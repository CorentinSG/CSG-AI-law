import { parseAiPlanningLog } from "@/agents/ai-regulation/processors/aiPlanning";
import { parseOpenAiResultLog } from "@/agents/ai-regulation/processors/openaiProcessor";
import type { AiProcessingLog, AiRegulatoryUpdate } from "@/agents/ai-regulation/types";

export interface AdminAiReviewState {
  lastAiPlanningDecision: string | null;
  lastAiPlanningReason: string | null;
  aiProcessingStatus:
    | "completed"
    | "failed"
    | "skipped"
    | "planned_only"
    | "not_run";
  modelUsed: string | null;
  estimatedCostUsd: number | null;
  estimatedInputTokens: number | null;
  estimatedOutputTokens: number | null;
  promptVersion: string | null;
  lastAiProcessingAt: string | null;
  confidenceLevel: string | null;
  skipOrErrorReason: string | null;
  hasAiGeneratedContent: boolean;
}

export function buildAdminAiReviewState(
  update: Pick<
    AiRegulatoryUpdate,
    | "rawItemId"
    | "confidenceLevel"
    | "oneSentenceSummary"
    | "summary"
    | "whatHappened"
    | "whyItMatters"
    | "practicalImpact"
    | "keyObligations"
    | "complianceDeadlines"
  >,
  processingLogs: AiProcessingLog[],
): AdminAiReviewState {
  const relatedLogs = processingLogs
    .filter((log) => log.rawItemId === update.rawItemId)
    .sort((left, right) =>
      right.processingFinishedAt.localeCompare(left.processingFinishedAt),
    );

  const latestPlanning = relatedLogs
    .map((log) => ({
      log,
      plan: parseAiPlanningLog(log),
    }))
    .find((entry) => entry.plan);

  const latestAiResult = relatedLogs
    .map((log) => ({
      log,
      result: parseOpenAiResultLog(log),
    }))
    .find((entry) => entry.result);

  const latestOpenAiLog = relatedLogs.find((log) =>
    log.promptVersion.includes("openai-structured"),
  );

  const hasAiGeneratedContent = Boolean(
    latestAiResult?.result?.outcome === "completed_ai_processing",
  );

  let aiProcessingStatus: AdminAiReviewState["aiProcessingStatus"] = "not_run";
  if (latestAiResult?.result?.outcome === "completed_ai_processing") {
    aiProcessingStatus = "completed";
  } else if (latestOpenAiLog?.status === "failed") {
    aiProcessingStatus = "failed";
  } else if (latestOpenAiLog?.status === "skipped") {
    aiProcessingStatus = "skipped";
  } else if (latestPlanning?.plan) {
    aiProcessingStatus = "planned_only";
  }

  return {
    lastAiPlanningDecision: latestPlanning?.plan?.decision ?? null,
    lastAiPlanningReason: latestPlanning?.plan?.decisionReason ?? null,
    aiProcessingStatus,
    modelUsed:
      latestAiResult?.result?.modelUsed ??
      latestOpenAiLog?.modelUsed ??
      null,
    estimatedCostUsd:
      latestAiResult?.result?.estimatedCostUsd ??
      latestPlanning?.plan?.estimatedCostUsd ??
      null,
    estimatedInputTokens:
      latestAiResult?.result?.estimatedInputTokens ??
      latestPlanning?.plan?.estimatedInputTokens ??
      null,
    estimatedOutputTokens:
      latestAiResult?.result?.estimatedOutputTokens ??
      latestPlanning?.plan?.estimatedOutputTokens ??
      null,
    promptVersion:
      latestAiResult?.result?.promptVersion ??
      latestOpenAiLog?.promptVersion ??
      null,
    lastAiProcessingAt:
      latestOpenAiLog?.processingFinishedAt ??
      latestPlanning?.log.processingFinishedAt ??
      null,
    confidenceLevel:
      latestAiResult?.result?.confidenceLevel ?? update.confidenceLevel ?? null,
    skipOrErrorReason:
      latestAiResult?.result?.skipReason ??
      (latestOpenAiLog?.status === "failed"
        ? latestOpenAiLog.errorMessage
        : latestOpenAiLog?.status === "skipped"
          ? latestOpenAiLog.errorMessage
          : null),
    hasAiGeneratedContent,
  };
}

export function formatAdminAiSafetyLabels(input: {
  status: AiRegulatoryUpdate["status"];
  publishedAt: string | null;
  aiProcessingStatus: AdminAiReviewState["aiProcessingStatus"];
  hasAiGeneratedContent: boolean;
}) {
  const draftLabel = input.hasAiGeneratedContent
    ? "AI-enriched draft - requires human review"
    : input.aiProcessingStatus === "failed"
      ? "AI processing failed - human review still required"
      : input.aiProcessingStatus === "skipped"
        ? "AI processing skipped - draft remains for human review"
        : "Draft requires human review";

  return [
    draftLabel,
    input.publishedAt ? "Publicly visible" : "Not publicly visible",
    "Published items are not automatically modified",
    input.status === "needs_review"
      ? "Review required before approval or publication"
      : `Current status: ${input.status}`,
  ];
}
