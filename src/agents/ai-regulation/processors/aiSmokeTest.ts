import { env } from "@/lib/env";
import {
  buildAiPlanningLogMessage,
  estimateMonthlyAiSpend,
  parseAiPlanningLog,
  planAiProcessingBatch,
} from "@/agents/ai-regulation/processors/aiPlanning";
import {
  parseOpenAiResultLog,
  processRegulatoryItemWithOpenAi,
} from "@/agents/ai-regulation/processors/openaiProcessor";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  ExtractedCandidateItem,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

export interface SelectedSmokeTestTarget {
  update: AiRegulatoryUpdate;
  rawItem: RawRegulatoryItem;
  source: RegulationSource;
  candidate: ExtractedCandidateItem;
  priority: "seeded_smoke_test_draft" | "existing_unpublished_draft";
}

export interface AiSmokeTestSummary {
  aiEnabled: boolean;
  maxItemsPerScan: number;
  estimatedCostUsd: number;
  eligibleItems: number;
  processedItems: number;
  skippedItems: number;
  skipReasons: string[];
  openAiCallMade: boolean;
  processedUpdateId?: string;
  processedRawItemId?: string;
  processedTitle?: string;
  modelUsed?: string;
  statusAfterProcessing?: string;
  mode: "seeded_smoke_test_draft" | "existing_unpublished_draft" | "none";
  message: string;
}

const SEEDED_SMOKE_UPDATE_ID = "upd-smoke-001";
const SEEDED_SMOKE_RAW_ID = "raw-smoke-001";

function getMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isSmokeTestDraft(
  update: AiRegulatoryUpdate,
  rawItem: RawRegulatoryItem,
) {
  const smokeTag = update.tags.some((tag) =>
    tag.toLowerCase().includes("smoke-test"),
  );
  const internalOnly = rawItem.rawMetadata.smokeTestDraft === true;
  const titleMarker =
    update.title.toLowerCase().includes("smoke test") ||
    rawItem.rawTitle.toLowerCase().includes("smoke test");
  return smokeTag || internalOnly || titleMarker;
}

export function selectExistingDraftForAiSmokeTest(input: {
  updates: AiRegulatoryUpdate[];
  rawItems: RawRegulatoryItem[];
  sources: RegulationSource[];
  processingLogs: AiProcessingLog[];
}) {
  const processedRawItemIds = new Set(
    input.processingLogs
      .filter((log) => log.status === "success")
      .map((log) => ({
        rawItemId: log.rawItemId,
        result: parseOpenAiResultLog(log),
      }))
      .filter(
        (entry) => entry.result?.outcome === "completed_ai_processing",
      )
      .map((entry) => entry.rawItemId),
  );

  const rawItemsById = new Map(input.rawItems.map((item) => [item.id, item]));
  const sourcesById = new Map(input.sources.map((source) => [source.id, source]));

  const candidateUpdates = input.updates
    .filter((update) => update.status === "needs_review")
    .filter((update) => !update.publishedAt)
    .filter((update) => !processedRawItemIds.has(update.rawItemId));

  const hydratedCandidates = candidateUpdates
    .map((update) => ({
      update,
      rawItem: rawItemsById.get(update.rawItemId) ?? null,
      source: sourcesById.get(update.sourceId) ?? null,
    }))
    .filter(
      (
        entry,
      ): entry is {
        update: AiRegulatoryUpdate;
        rawItem: RawRegulatoryItem;
        source: RegulationSource;
      } =>
        Boolean(
          entry.rawItem &&
            entry.source &&
            entry.rawItem.rawText.trim(),
        ),
    )
    .sort((left, right) => {
      const leftPriority = isSmokeTestDraft(left.update, left.rawItem) ? 1 : 0;
      const rightPriority = isSmokeTestDraft(right.update, right.rawItem) ? 1 : 0;
      if (leftPriority !== rightPriority) return rightPriority - leftPriority;
      return right.update.createdAt.localeCompare(left.update.createdAt);
    });

  for (const { update, rawItem, source } of hydratedCandidates) {
    const priority = isSmokeTestDraft(update, rawItem)
      ? "seeded_smoke_test_draft"
      : "existing_unpublished_draft";

    return {
      update,
      rawItem,
      source,
      priority,
      candidate: {
        stableId: getMetadataString(rawItem.rawMetadata, "stableId"),
        title: rawItem.rawTitle,
        url: rawItem.rawUrl,
        text: rawItem.rawText,
        excerpt: getMetadataString(rawItem.rawMetadata, "excerpt"),
        publicationDate: update.publicationDate,
        detectedAt: rawItem.detectedAt,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: update.jurisdiction,
        developmentTypeHint: update.developmentType,
        legalAreaHint: update.legalArea,
        metadata: rawItem.rawMetadata,
      },
    } satisfies SelectedSmokeTestTarget;
  }

  return null;
}

function buildSelectedTarget(input: {
  update: AiRegulatoryUpdate;
  rawItem: RawRegulatoryItem;
  source: RegulationSource;
}): SelectedSmokeTestTarget {
  const priority = isSmokeTestDraft(input.update, input.rawItem)
    ? "seeded_smoke_test_draft"
    : "existing_unpublished_draft";

  return {
    update: input.update,
    rawItem: input.rawItem,
    source: input.source,
    priority,
    candidate: {
      stableId: getMetadataString(input.rawItem.rawMetadata, "stableId"),
      title: input.rawItem.rawTitle,
      url: input.rawItem.rawUrl,
      text: input.rawItem.rawText,
      excerpt: getMetadataString(input.rawItem.rawMetadata, "excerpt"),
      publicationDate: input.update.publicationDate,
      detectedAt: input.rawItem.detectedAt,
      sourceName: input.source.name,
      sourceId: input.source.id,
      jurisdictionHint: input.update.jurisdiction,
      developmentTypeHint: input.update.developmentType,
      legalAreaHint: input.update.legalArea,
      metadata: input.rawItem.rawMetadata,
    },
  };
}

async function inspectSeededSmokeDraftFallback(input: {
  updates: AiRegulatoryUpdate[];
  rawItems: RawRegulatoryItem[];
  sources: RegulationSource[];
  processingLogs: AiProcessingLog[];
}) {
  const diagnostics: string[] = [];
  const seededUpdate =
    input.updates.find((update) => update.id === SEEDED_SMOKE_UPDATE_ID) ??
    (await updateRepository.getUpdate(SEEDED_SMOKE_UPDATE_ID));
  const seededRawInBatch =
    input.rawItems.find((rawItem) => rawItem.id === SEEDED_SMOKE_RAW_ID) ?? null;
  const seededRaw = seededRawInBatch ?? (await updateRepository.getRawItem(SEEDED_SMOKE_RAW_ID));

  diagnostics.push(`seeded_update_exists=${Boolean(seededUpdate)}`);
  diagnostics.push(`seeded_raw_exists=${Boolean(seededRaw)}`);
  diagnostics.push(`seeded_raw_in_batch=${Boolean(seededRawInBatch)}`);

  if (!seededUpdate || !seededRaw) {
    diagnostics.push(
      "seeded_draft_exclusion=seeded smoke-test update or raw item was not found in persistence.",
    );
    return { target: null, diagnostics };
  }

  diagnostics.push(`seeded_status=${seededUpdate.status}`);
  diagnostics.push(`seeded_published_at=${seededUpdate.publishedAt ?? "null"}`);
  diagnostics.push(`seeded_reviewed_at=${seededUpdate.reviewedAt ?? "null"}`);

  const seededSource =
    input.sources.find((source) => source.id === seededUpdate.sourceId) ?? null;
  diagnostics.push(`seeded_source_exists=${Boolean(seededSource)}`);

  const hasCompletedAiProcessing = input.processingLogs.some((log) => {
    if (log.rawItemId !== seededRaw.id || log.status !== "success") return false;
    return parseOpenAiResultLog(log)?.outcome === "completed_ai_processing";
  });
  diagnostics.push(`seeded_has_completed_ai_processing=${hasCompletedAiProcessing}`);

  if (seededUpdate.status !== "needs_review") {
    diagnostics.push("seeded_draft_exclusion=status was not needs_review.");
    return { target: null, diagnostics };
  }
  if (seededUpdate.publishedAt) {
    diagnostics.push("seeded_draft_exclusion=published_at was not null.");
    return { target: null, diagnostics };
  }
  if (!seededSource) {
    diagnostics.push("seeded_draft_exclusion=source record was missing.");
    return { target: null, diagnostics };
  }
  if (!seededRaw.rawText.trim()) {
    diagnostics.push("seeded_draft_exclusion=raw_text was empty.");
    return { target: null, diagnostics };
  }
  if (hasCompletedAiProcessing) {
    diagnostics.push(
      "seeded_draft_exclusion=prior completed_ai_processing log makes the draft intentionally ineligible.",
    );
    return { target: null, diagnostics };
  }

  diagnostics.push(
    seededRawInBatch
      ? "seeded_draft_ready=seeded draft was already present in the raw-items batch."
      : "seeded_draft_ready=seeded draft was eligible but missing from the limited raw-items batch; direct fetch restored it.",
  );

  return {
    target: buildSelectedTarget({
      update: seededUpdate,
      rawItem: seededRaw,
      source: seededSource,
    }),
    diagnostics,
  };
}

export function summarizeAiLogsSince(
  logs: AiProcessingLog[],
  startedAt: string,
) {
  const relevantLogs = logs.filter((log) => log.createdAt >= startedAt);
  const planningLogs = relevantLogs
    .map((log) => parseAiPlanningLog(log))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const resultLogs = relevantLogs
    .map((log) => parseOpenAiResultLog(log))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const eligibleItems = planningLogs.filter(
    (entry) =>
      entry.decision === "allowed_for_live_processing" ||
      entry.decision === "pending_ai_processing",
  ).length;
  const processedItems = resultLogs.filter(
    (entry) => entry.outcome === "completed_ai_processing",
  ).length;
  const skipReasons = [
    ...planningLogs
      .filter(
        (entry) =>
          entry.decision !== "allowed_for_live_processing" &&
          entry.decision !== "pending_ai_processing",
      )
      .map((entry) => `${entry.decision}: ${entry.decisionReason}`),
    ...resultLogs
      .filter((entry) => entry.outcome !== "completed_ai_processing")
      .map(
        (entry) =>
          `${entry.outcome}: ${entry.skipReason ?? "No skip reason recorded."}`,
      ),
  ];

  return {
    eligibleItems,
    processedItems,
    skippedItems: skipReasons.length,
    skipReasons,
    openAiCallMade: processedItems > 0,
  };
}

export async function runExistingDraftAiSmokeTest(): Promise<AiSmokeTestSummary> {
  const [updates, rawItems, sources, processingLogs] = await Promise.all([
    updateRepository.listUpdates(),
    updateRepository.getRawItems(500),
    updateRepository.getSources(),
    updateRepository.getProcessingLogs(2500),
  ]);

  let target: SelectedSmokeTestTarget | null = selectExistingDraftForAiSmokeTest({
    updates,
    rawItems,
    sources,
    processingLogs,
  });
  let diagnostics: string[] = [];

  if (!target) {
    const inspectedSeededDraft = await inspectSeededSmokeDraftFallback({
      updates,
      rawItems,
      sources,
      processingLogs,
    });
    target = inspectedSeededDraft.target;
    diagnostics = inspectedSeededDraft.diagnostics;
  }

  if (!target) {
    return {
      aiEnabled: env.AI_ENABLE_PROCESSING,
      maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
      estimatedCostUsd: 0,
      eligibleItems: 0,
      processedItems: 0,
      skippedItems: 0,
      skipReasons: diagnostics,
      openAiCallMade: false,
      mode: "none",
      message:
        "No eligible existing unpublished needs_review draft was available for the AI smoke test fallback.",
    };
  }

  const monthlyEstimatedSpendUsd = estimateMonthlyAiSpend(processingLogs);
  const [planningDecision] = planAiProcessingBatch(
    [
      {
        candidate: target.candidate,
        rawItem: target.rawItem,
        source: target.source,
        classification: {
          jurisdiction: target.update.jurisdiction,
          developmentType: target.update.developmentType,
          importanceLevel: target.update.importanceLevel,
        },
      },
    ],
    env,
    monthlyEstimatedSpendUsd,
  );

  await updateRepository.addProcessingLog({
    rawItemId: target.rawItem.id,
    regulatoryUpdateId: target.update.id,
    modelUsed: planningDecision.models.summary,
    promptVersion: "ai-planning.v1",
    processingStartedAt: new Date().toISOString(),
    processingFinishedAt: new Date().toISOString(),
    status:
      planningDecision.decision === "pending_ai_processing" ||
      planningDecision.decision === "allowed_for_live_processing"
        ? "success"
        : "skipped",
    errorMessage: buildAiPlanningLogMessage(planningDecision),
  });

  if (!env.AI_ENABLE_PROCESSING) {
    return {
      aiEnabled: false,
      maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
      estimatedCostUsd: planningDecision.estimatedCostUsd,
      eligibleItems: planningDecision.decision === "pending_ai_processing" ? 1 : 0,
      processedItems: 0,
      skippedItems: 0,
      skipReasons: [],
      openAiCallMade: false,
      processedUpdateId: target.update.id,
      processedRawItemId: target.rawItem.id,
      processedTitle: target.update.title,
      statusAfterProcessing: target.update.status,
      mode: target.priority,
      message:
        "AI smoke test fallback located an unpublished draft, but AI processing is disabled so no OpenAI call was made.",
    };
  }

  if (planningDecision.decision !== "allowed_for_live_processing") {
    return {
      aiEnabled: true,
      maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
      estimatedCostUsd: planningDecision.estimatedCostUsd,
      eligibleItems: 0,
      processedItems: 0,
      skippedItems: 1,
      skipReasons: [planningDecision.decisionReason],
      openAiCallMade: false,
      processedUpdateId: target.update.id,
      processedRawItemId: target.rawItem.id,
      processedTitle: target.update.title,
      statusAfterProcessing: target.update.status,
      mode: target.priority,
      message:
        "AI smoke test fallback found an unpublished draft, but planner guardrails skipped live processing.",
    };
  }

  try {
    const startedAt = new Date().toISOString();
    const aiResult = await processRegulatoryItemWithOpenAi({
      env,
      source: target.source,
      candidate: target.candidate,
      rawItem: target.rawItem,
      existingUpdate: target.update,
      planningDecision,
    });

    if (aiResult.skipped) {
      await updateRepository.addProcessingLog({
        rawItemId: target.rawItem.id,
        regulatoryUpdateId: target.update.id,
        modelUsed: env.AI_MODEL_SUMMARY,
        promptVersion: "openai-structured.v2",
        processingStartedAt: startedAt,
        processingFinishedAt: new Date().toISOString(),
        status: "skipped",
        errorMessage: aiResult.logMessage,
      });

      return {
        aiEnabled: true,
        maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
        estimatedCostUsd: planningDecision.estimatedCostUsd,
        eligibleItems: 1,
        processedItems: 0,
        skippedItems: 1,
        skipReasons: [aiResult.reason],
        openAiCallMade: false,
        processedUpdateId: target.update.id,
        processedRawItemId: target.rawItem.id,
        processedTitle: target.update.title,
        modelUsed: env.AI_MODEL_SUMMARY,
        statusAfterProcessing: target.update.status,
        mode: target.priority,
        message:
          "AI smoke test fallback reached a draft target, but the processor skipped updating it safely.",
      };
    }

    const updatedDraft = await updateRepository.saveUpdateEdits(
      target.update.id,
      aiResult.updatePatch,
    );
    await updateRepository.addProcessingLog({
      rawItemId: target.rawItem.id,
      regulatoryUpdateId: updatedDraft.id,
      modelUsed: aiResult.modelUsed,
      promptVersion: aiResult.promptVersion,
      processingStartedAt: startedAt,
      processingFinishedAt: new Date().toISOString(),
      status: "success",
      errorMessage: aiResult.logMessage,
    });

    return {
      aiEnabled: true,
      maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
      estimatedCostUsd: planningDecision.estimatedCostUsd,
      eligibleItems: 1,
      processedItems: 1,
      skippedItems: 0,
      skipReasons: [],
      openAiCallMade: true,
      processedUpdateId: updatedDraft.id,
      processedRawItemId: target.rawItem.id,
      processedTitle: updatedDraft.title,
      modelUsed: aiResult.modelUsed,
      statusAfterProcessing: updatedDraft.status,
      mode: target.priority,
      message:
        "AI smoke test fallback processed one existing unpublished needs_review draft and left it unpublished for human review.",
    };
  } catch (error) {
    await updateRepository.addProcessingLog({
      rawItemId: target.rawItem.id,
      regulatoryUpdateId: target.update.id,
      modelUsed: env.AI_MODEL_SUMMARY,
      promptVersion: "openai-structured.v2",
      processingStartedAt: new Date().toISOString(),
      processingFinishedAt: new Date().toISOString(),
      status: "failed",
      errorMessage:
        error instanceof Error
          ? `AI smoke test fallback failed safely: ${error.message}`
          : "AI smoke test fallback failed safely.",
    });

    return {
      aiEnabled: true,
      maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
      estimatedCostUsd: planningDecision.estimatedCostUsd,
      eligibleItems: 1,
      processedItems: 0,
      skippedItems: 1,
      skipReasons: [
        error instanceof Error ? error.message : "Unknown OpenAI processing error.",
      ],
      openAiCallMade: false,
      processedUpdateId: target.update.id,
      processedRawItemId: target.rawItem.id,
      processedTitle: target.update.title,
      mode: target.priority,
      statusAfterProcessing: target.update.status,
      message:
        "AI smoke test fallback found a safe draft target, but processing failed safely and did not publish anything.",
    };
  }
}

export function buildAiSmokeTestConfigSummary() {
  return {
    aiEnabled: env.AI_ENABLE_PROCESSING,
    maxItemsPerScan: env.AI_MAX_ITEMS_PER_SCAN,
    monthlyBudgetUsd: env.AI_MONTHLY_BUDGET_USD,
    maxInputTokensPerItem: env.AI_MAX_INPUT_TOKENS_PER_ITEM,
    costGuardrailsEnabled: env.AI_COST_GUARDRAILS_ENABLED,
    hasApiKey: Boolean(env.OPENAI_API_KEY),
    models: {
      relevance: env.AI_MODEL_RELEVANCE,
      classification: env.AI_MODEL_CLASSIFICATION,
      summary: env.AI_MODEL_SUMMARY,
      deepAnalysis: env.AI_MODEL_DEEP_ANALYSIS,
    },
  };
}
