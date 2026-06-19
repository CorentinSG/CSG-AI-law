import { env } from "@/lib/env";
import { aiClassifier } from "@/agents/ai-regulation/processors/aiClassifier";
import {
  buildAiPlanningLogMessage,
  estimateMonthlyAiSpend,
  planAiProcessingBatch,
} from "@/agents/ai-regulation/processors/aiPlanning";
import { processRegulatoryItemWithOpenAi } from "@/agents/ai-regulation/processors/openaiProcessor";
import type { OpenAiProcessingSuccess } from "@/agents/ai-regulation/processors/openaiProcessor";
import { aiSummarizer } from "@/agents/ai-regulation/processors/aiSummarizer";
import { deduplicator } from "@/agents/ai-regulation/processors/deduplicator";
import { deadlineExtractor } from "@/agents/ai-regulation/processors/deadlineExtractor";
import { itemExtractor } from "@/agents/ai-regulation/processors/itemExtractor";
import { obligationExtractor } from "@/agents/ai-regulation/processors/obligationExtractor";
import { relevanceFilter } from "@/agents/ai-regulation/processors/relevanceFilter";
import {
  buildScanDiagnosticMessages,
  deriveScanStatus,
} from "@/agents/ai-regulation/processors/scanDiagnostics";
import { buildAuthorityTag } from "@/agents/ai-regulation/utils/authority";
import { buildCandidateSourceReference } from "@/agents/ai-regulation/citations";
import { getScanProfile } from "@/agents/ai-regulation/scanProfiles";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { buildInitialVerificationMetadata } from "@/agents/ai-regulation/verification";
import { runRecurringVerification } from "@/agents/ai-regulation/processors/recurringVerification";
import { sourceManager } from "@/agents/ai-regulation/processors/sourceManager";
import { sourceScanner } from "@/agents/ai-regulation/processors/sourceScanner";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { buildNewsItemFromUpdate } from "@/content/ai-regulation/news";
import type { ConnectorFetchMetadata } from "@/agents/ai-regulation/connectors/types";
import {
  buildFailureReport,
  buildFailureReportLogMessage,
} from "@/agents/harness/failure";
import { addStep, createTrace, finishTrace, type TraceStep } from "@/agents/harness/trace";
import type { SourceExecutionDecision } from "@/agents/ai-regulation/sourceRuntimeHealth";
import { alertOnSourceScanFinalized } from "@/lib/alerting";
import type {
  RegulationScanLog,
  ReviewAssistMetadata,
  TraceabilityMetadata,
  TraceabilityExtraction,
  TraceabilityRelevance,
  TraceabilityClassification,
} from "@/agents/ai-regulation/types";

export type ScanTrigger = "manual" | "scheduled" | "scheduled_local_test";

function resolveParserUsed(source: { preferredExtractionMethod: string; config?: Record<string, unknown> }) {
  const configuredParser = source.config?.parserType;
  return typeof configuredParser === "string"
    ? configuredParser
    : source.preferredExtractionMethod;
}

// Merges a partial TraceabilityMetadata patch into existing rawMetadata.
// Uses the typed TraceabilityMetadata interface instead of Record<string,unknown>
// so callers get type-checking on the patch shape (C3 optimisation).
// Patch type allowing partial nested sub-objects (C3)
type TraceabilityPatch = Omit<Partial<TraceabilityMetadata>, "extraction" | "relevance" | "classification"> & {
  extraction?: Partial<TraceabilityExtraction>;
  relevance?: Partial<TraceabilityRelevance>;
  classification?: Partial<TraceabilityClassification>;
};

function mergeTraceabilityMetadata(
  existing: Record<string, unknown>,
  patch: TraceabilityPatch,
): Record<string, unknown> {
  const current = (
    existing.traceability && typeof existing.traceability === "object"
      ? existing.traceability
      : {}
  ) as Partial<TraceabilityMetadata>;

  return {
    ...existing,
    traceability: {
      ...current,
      ...patch,
      extraction: {
        ...(current.extraction ?? {} as Partial<TraceabilityExtraction>),
        ...(patch.extraction ?? {}),
      } as TraceabilityExtraction,
      relevance: {
        ...(current.relevance ?? {} as Partial<TraceabilityRelevance>),
        ...(patch.relevance ?? {}),
      } as TraceabilityRelevance,
      classification: {
        ...(current.classification ?? {} as Partial<TraceabilityClassification>),
        ...(patch.classification ?? {}),
      } as TraceabilityClassification,
    } as TraceabilityMetadata,
  };
}

function buildReviewAssistMetadata(input: {
  processedAt: string;
  modelUsed: string;
  promptVersion: string;
  planningDecision: NonNullable<
    ReturnType<typeof planAiProcessingBatch>[number]
  >;
  updatePatch: OpenAiProcessingSuccess["updatePatch"];
}): ReviewAssistMetadata {
  return {
    generatedAt: input.processedAt,
    modelUsed: input.modelUsed,
    promptVersion: input.promptVersion,
    planningDecision: input.planningDecision.decision,
    planningDecisionReason: input.planningDecision.decisionReason,
    estimatedCostUsd: input.planningDecision.estimatedCostUsd,
    estimatedInputTokens: input.planningDecision.estimatedInputTokens,
    estimatedOutputTokens: input.planningDecision.estimatedOutputTokens,
    humanReviewRequired: true,
    publicationStatus: "hidden",
    citationQualityStatus: "needs_manual_verification",
    suggestedClassification: {
      jurisdiction: input.updatePatch.jurisdiction,
      developmentType: input.updatePatch.developmentType,
      legalArea: input.updatePatch.legalArea,
      importanceLevel: input.updatePatch.importanceLevel,
      confidenceLevel: input.updatePatch.confidenceLevel,
      tags: input.updatePatch.tags,
    },
    suggestedSummary: {
      oneSentenceSummary: input.updatePatch.oneSentenceSummary,
      summary: input.updatePatch.summary,
      whatHappened: input.updatePatch.whatHappened,
      whyItMatters: input.updatePatch.whyItMatters,
      practicalImpact: input.updatePatch.practicalImpact,
      affectedParties: input.updatePatch.affectedParties,
      keyObligations: input.updatePatch.keyObligations,
      complianceDeadlines: input.updatePatch.complianceDeadlines,
      enforcementRisk: input.updatePatch.enforcementRisk,
    },
  };
}

function buildDiscoveryLeadCopy(input: {
  title: string;
  url: string;
  sourceName: string;
  sourceCountry: string;
  possibleJurisdiction: string | null;
  possibleTopic: string | null;
  possibleOfficialSourceFound: boolean;
  possibleOfficialSourceUrl: string | null;
}) {
  const jurisdictionText = input.possibleJurisdiction ?? "an unverified jurisdiction";
  const topicText = input.possibleTopic ?? "a potentially relevant AI legal or policy development";
  const officialUrlText = input.possibleOfficialSourceUrl
    ? `A possible official source candidate was identified at ${input.possibleOfficialSourceUrl}.`
    : "No official source URL has been identified yet.";

  return {
    oneSentenceSummary:
      `Non-official discovery lead from ${input.sourceName} pointing to ${topicText} in ${jurisdictionText}. Official-source verification and cross-source corroboration are required before any publication.`,
    summary:
      `${input.sourceName} surfaced the headline "${input.title}" and linked to ${input.url}. This item is stored only as a discovery lead and should not be treated as legal authority. ${officialUrlText} Cross-source corroboration is required where appropriate before conversion.`,
    whatHappened:
      `A non-official discovery dashboard highlighted a potentially relevant development for further verification. The outbound article or post may point toward an official source, but that official material must be independently confirmed before this lead can support any legal intelligence publication.`,
    whyItMatters:
      `Discovery sources can help flag fast-moving AI law, policy, enforcement, standards, or case-law developments earlier than official monitoring alone. They are useful for triage, but they do not establish that a legal development actually occurred.`,
    practicalImpact:
      `Reviewers should identify the original underlying source, determine whether an official source exists for the same development, and either create or confirm a separate official-source-backed update before publication.`,
    affectedParties: [
      "Editorial reviewers",
      "Legal intelligence researchers",
      "AI regulation monitoring team",
    ],
    keyObligations: [
      "Do not publish this discovery lead directly.",
      "Locate and verify an official source before treating the development as established.",
      "Look for at least one additional reliable corroborating source where appropriate.",
    ],
    complianceDeadlines: [
      "No legal deadline should be inferred from a non-official discovery lead.",
    ],
    enforcementRisk:
      "No enforcement conclusion should be drawn from this lead alone. Treat it as an unverified pointer until an official source is confirmed.",
  };
}

// --- Types shared across pipeline stages ---
interface ProcessableCandidate {
  source: Awaited<ReturnType<typeof sourceManager.getActiveSourcesForProfile>>[number];
  candidate: Parameters<typeof relevanceFilter.evaluate>[0];
  rawItem: Awaited<ReturnType<typeof updateRepository.createRawItem>>;
  classification: ReturnType<typeof aiClassifier.classify>;
  processingStartedAt: string;
}

interface SourceScanState {
  source: Awaited<ReturnType<typeof sourceManager.getActiveSourcesForProfile>>[number];
  startedAt: string;
  startedMs: number;
  itemsFound: number;
  newItemsDetected: number;
  duplicatesDetected: number;
  itemsFilteredOut: number;
  processingFailures: number;
  parsingWarnings: string[];
  extractionErrors: string[];
  responseStatus: number | null | undefined;
  zeroResultsReason: string | null | undefined;
  fetchMetadata: ConnectorFetchMetadata | null;
  scheduledExecutionDecision: SourceExecutionDecision | null;
  aiPendingCount: number;
  aiSkippedCount: number;
  aiEstimatedCostUsd: number;
}

function buildPipelineFailureReportMessage(input: {
  taskInput: unknown;
  agentConfig: Record<string, unknown>;
  stepName: string;
  stepKind: TraceStep["kind"];
  error: unknown;
  stepInput?: unknown;
  stepOutput?: unknown;
}) {
  const errorMessage =
    input.error instanceof Error ? input.error.message : String(input.error ?? "Unknown failure");
  const trace = createTrace({
    taskInput: input.taskInput,
    agentConfig: input.agentConfig,
  });

  addStep(trace, {
    name: input.stepName,
    kind: input.stepKind,
    input: input.stepInput,
    output: input.stepOutput,
    error: errorMessage,
  });
  finishTrace(trace, { status: "failed" });

  const report = buildFailureReport(trace);
  return report ? buildFailureReportLogMessage(report) : null;
}

// --- Stage 1 helper: scanSourcesForCandidates ---
// For each source, fetch items, deduplicate, run relevance + classification,
// and collect processable candidates. Returns processable candidates while
// mutating sourceStates in place with per-source counters.
async function scanSourcesForCandidates(
  sources: Awaited<ReturnType<typeof sourceManager.getActiveSourcesForProfile>>,
  trigger: ScanTrigger,
  scanProfile: ScanProfileId | undefined,
  scanJobId: string | null,
  sourceStates: Map<string, SourceScanState>,
  scheduledExecutionDecisions?: Map<string, SourceExecutionDecision>,
): Promise<ProcessableCandidate[]> {
  const processableCandidates: ProcessableCandidate[] = [];

  for (const source of sources) {
    const state = sourceStates.get(source.id)!;
    const executionDecision = scheduledExecutionDecisions?.get(source.id) ?? null;

    if (executionDecision && !executionDecision.shouldScan) {
      state.scheduledExecutionDecision = executionDecision;
      state.zeroResultsReason = executionDecision.reason;
      continue;
    }

    try {
      const scanResult = await sourceScanner.scanSource(source);
      const candidates = itemExtractor.extract(scanResult.items, source);
      state.itemsFound = scanResult.itemsFetched ?? candidates.length;
      state.responseStatus = scanResult.responseStatus;
      state.zeroResultsReason = scanResult.zeroResultsReason;
      state.fetchMetadata = scanResult.fetchMetadata ?? null;
      state.parsingWarnings.push(...scanResult.warnings);
      state.extractionErrors.push(...scanResult.errors);

      for (const candidate of candidates) {
        const processingStartedAt = new Date().toISOString();
        const candidateMetadata = (candidate.metadata ?? {}) as Record<string, unknown>;
        const hash = deduplicator.createHash({
          sourceId: source.id,
          title: candidate.title,
          url: candidate.url,
          publicationDate: candidate.publicationDate,
          stableId: candidate.stableId,
          text: candidate.text,
        });
        const duplicate = await deduplicator.findDuplicate(hash);

        // Build verification metadata using candidate + source data.
        // This is computed before createRawItem so it can be included in the
        // initial write, eliminating the separate updateRawItemMetadata call
        // that previously ran immediately after creation (B2 optimisation).
        const detectedAt = candidate.detectedAt ?? new Date().toISOString();
        const initialVerification = buildInitialVerificationMetadata({
          source,
          rawItem: {
            rawTitle: candidate.title,
            rawUrl: candidate.url,
            detectedAt,
            rawMetadata: (candidate.metadata ?? {}) as Record<string, unknown>,
          },
        });

        const rawItem = await updateRepository.createRawItem({
          sourceId: source.id,
          rawTitle: candidate.title,
          rawUrl: candidate.url,
          rawText: candidate.text,
          rawMetadata: {
            ...candidate.metadata,
            verification: initialVerification,
            sourceReferences: [
              buildCandidateSourceReference({
                source,
                candidate,
                retrievedAt: processingStartedAt,
              }),
            ],
            excerpt: candidate.excerpt ?? null,
            stableId: candidate.stableId ?? null,
            jurisdictionHint: candidate.jurisdictionHint ?? null,
            developmentTypeHint: candidate.developmentTypeHint ?? null,
            legalAreaHint: candidate.legalAreaHint ?? null,
            authorityTypeHint: candidate.authorityTypeHint ?? null,
            traceability: {
              sourceId: source.id,
              sourceName: source.name,
              sourceUrl: source.sourceUrl,
              sourceType: source.sourceType,
              officialSource: !isDiscoveryOnlySource(source),
              parserUsed: resolveParserUsed(source),
              scanTimestamp: state.startedAt,
              scanTrigger: trigger,
              scanProfile: scanProfile ?? "default",
              scanJobId,
              httpStatus: scanResult.responseStatus ?? null,
              contentHash: hash,
              duplicateStatus: duplicate ? "duplicate" : "unique",
              duplicateOfRawItemId: duplicate?.id ?? null,
              rawUrlScanned: candidate.url,
              extraction: {
                stableId: candidate.stableId ?? null,
                contentType:
                  typeof candidateMetadata.contentType === "string"
                    ? candidateMetadata.contentType
                    : null,
                extractedTitle: candidate.title,
                extractedContentPreview:
                  candidate.excerpt ?? candidate.text.slice(0, 320),
                publicationDate: candidate.publicationDate ?? null,
                effectiveDate:
                  typeof candidateMetadata.effectiveDate === "string"
                    ? candidateMetadata.effectiveDate
                    : null,
                authorityClassification:
                  typeof candidateMetadata.authorityClassification === "string"
                    ? candidateMetadata.authorityClassification
                    : null,
              },
            },
          },
          detectedAt,
          hash,
          duplicateOf: duplicate?.id ?? null,
          processingStatus: duplicate ? "duplicate" : "new",
        });

        if (duplicate) {
          state.duplicatesDetected += 1;
          await updateRepository.addProcessingLog({
            rawItemId: rawItem.id,
            regulatoryUpdateId: null,
            modelUsed: "deduplicator",
            promptVersion: "hash.v1",
            processingStartedAt,
            processingFinishedAt: new Date().toISOString(),
            status: "skipped",
            errorMessage: `Duplicate item detected via stable hash ${hash}.`,
          });
          continue;
        }

        const relevance = relevanceFilter.evaluate(candidate, source);
        if (!relevance.relevant) {
          const updatedRawItem = await updateRepository.updateRawItemMetadata(
            rawItem.id,
            mergeTraceabilityMetadata(rawItem.rawMetadata, {
              relevance: {
                relevant: false,
                reason: relevance.reason,
                matchedAiTerms: relevance.matchedAiTerms,
                matchedRegulatoryTerms: relevance.matchedRegulatoryTerms,
              },
              reviewStatus: "needs_review",
              publicationStatus: "hidden",
            }),
          );
          rawItem.rawMetadata = updatedRawItem.rawMetadata;
          state.itemsFilteredOut += 1;
          await updateRepository.addProcessingLog({
            rawItemId: rawItem.id,
            regulatoryUpdateId: null,
            modelUsed: "heuristic-fallback",
            promptVersion: "relevance.v1",
            processingStartedAt,
            processingFinishedAt: new Date().toISOString(),
            status: "skipped",
            errorMessage: `Item did not pass deterministic AI-regulation relevance filtering. ${relevance.reason}`,
          });
          continue;
        }

        const classification = aiClassifier.classify({
          title: candidate.title,
          text: candidate.text,
          sourceName: source.name,
          publicationDate: candidate.publicationDate ?? null,
          jurisdictionHint: candidate.jurisdictionHint,
          developmentTypeHint: candidate.developmentTypeHint,
          legalAreaHint: candidate.legalAreaHint,
          authorityTypeHint: candidate.authorityTypeHint,
        });

        // Accumulate relevance + partial classification in memory only.
        // The full DB write is deferred to processAllCandidates where the
        // complete classification data is available, saving one round trip
        // per relevant item (B2 optimisation).
        rawItem.rawMetadata = mergeTraceabilityMetadata(rawItem.rawMetadata, {
          relevance: {
            relevant: true,
            reason: relevance.reason,
            matchedAiTerms: relevance.matchedAiTerms,
            matchedRegulatoryTerms: relevance.matchedRegulatoryTerms,
          },
          classification: {
            authorityType: classification.authorityType,
          },
          reviewStatus: "needs_review",
          publicationStatus: "hidden",
        });
        processableCandidates.push({
          source,
          candidate,
          rawItem,
          classification,
          processingStartedAt,
        });
      }

      await sourceManager.updateLastScannedAt(source.id, new Date().toISOString());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown scan error";
      const failureReportMessage = buildPipelineFailureReportMessage({
        taskInput: {
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.sourceUrl,
          trigger,
          scanProfile: scanProfile ?? "default",
          scanJobId,
        },
        agentConfig: {
          pipelineStage: "scan_sources",
          parserUsed: resolveParserUsed(source),
        },
        stepName: "scan_source",
        stepKind: "retrieval",
        error,
        stepInput: {
          sourceId: source.id,
          sourceUrl: source.sourceUrl,
        },
      });

      state.extractionErrors.push(errorMessage);
      if (failureReportMessage) {
        state.extractionErrors.push(failureReportMessage);
      }
    }
  }

  return processableCandidates;
}

// --- Stage 2 helper: processAllCandidates ---
// Plans AI processing, creates regulatory updates and news items, optionally
// calls OpenAI for allowed items, and logs outcomes. Mutates sourceStates
// with per-candidate counters (newItemsDetected, aiPendingCount, etc.).
async function processAllCandidates(
  processableCandidates: ProcessableCandidate[],
  sourceStates: Map<string, SourceScanState>,
): Promise<void> {
  const existingProcessingLogs = await updateRepository.getProcessingLogs(2000);
  const monthlyEstimatedSpendUsd = estimateMonthlyAiSpend(existingProcessingLogs);
  const aiPlan = planAiProcessingBatch(
    processableCandidates.map((entry) => ({
      candidate: entry.candidate,
      rawItem: entry.rawItem,
      source: entry.source,
      classification: {
        jurisdiction: entry.classification.jurisdiction,
        developmentType: entry.classification.developmentType,
        importanceLevel: entry.classification.importanceLevel,
      },
    })),
    env,
    monthlyEstimatedSpendUsd,
  );

  const aiPlanByRawItemId = new Map(aiPlan.map((entry) => [entry.rawItemId, entry]));

  for (const entry of processableCandidates) {
    const state = sourceStates.get(entry.source.id)!;
    const planningDecision = aiPlanByRawItemId.get(entry.rawItem.id);

    if (planningDecision) {
      if (planningDecision.decision === "pending_ai_processing") {
        state.aiPendingCount += 1;
      } else if (planningDecision.decision !== "allowed_for_live_processing") {
        state.aiSkippedCount += 1;
      }
      state.aiEstimatedCostUsd += planningDecision.estimatedCostUsd;

      await updateRepository.addProcessingLog({
        rawItemId: entry.rawItem.id,
        regulatoryUpdateId: null,
        modelUsed: planningDecision.models.summary,
        promptVersion: "ai-planning.v1",
        processingStartedAt: entry.processingStartedAt,
        processingFinishedAt: new Date().toISOString(),
        status:
          planningDecision.decision === "pending_ai_processing" ||
          planningDecision.decision === "allowed_for_live_processing"
            ? "success"
            : "skipped",
        errorMessage: buildAiPlanningLogMessage(planningDecision),
      });
    }

    try {
      const discoveryOnlySource = isDiscoveryOnlySource(entry.source);
      const discoveryMetadata = discoveryOnlySource ? entry.candidate.metadata ?? {} : {};
      const summary = aiSummarizer.summarize({
        title: entry.candidate.title,
        text: entry.candidate.text,
        legalArea: entry.classification.legalArea,
        developmentType: entry.classification.developmentType,
        authorityType: entry.classification.authorityType,
      });
      const discoveryCopy = discoveryOnlySource
        ? buildDiscoveryLeadCopy({
            title: entry.candidate.title,
            url: entry.candidate.url,
            sourceName: entry.source.name,
            sourceCountry: entry.source.country,
            possibleJurisdiction:
              typeof discoveryMetadata.possibleJurisdiction === "string"
                ? discoveryMetadata.possibleJurisdiction
                : null,
            possibleTopic:
              typeof discoveryMetadata.possibleTopic === "string"
                ? discoveryMetadata.possibleTopic
                : null,
            possibleOfficialSourceFound:
              discoveryMetadata.possibleOfficialSourceFound === true,
            possibleOfficialSourceUrl:
              typeof discoveryMetadata.possibleOfficialSourceUrl === "string"
                ? discoveryMetadata.possibleOfficialSourceUrl
                : null,
          })
        : null;

      const update = await updateRepository.createUpdate({
        sourceId: entry.source.id,
        rawItemId: entry.rawItem.id,
        title: discoveryOnlySource ? entry.candidate.title : summary.title,
        sourceName: entry.source.name,
        sourceUrl: entry.candidate.url,
        jurisdiction: entry.classification.jurisdiction,
        region: entry.source.region,
        country: entry.source.country,
        developmentType: entry.classification.developmentType,
        legalArea: entry.classification.legalArea,
        publicationDate: entry.classification.publicationDate,
        detectedDate: new Date().toISOString().slice(0, 10),
        oneSentenceSummary:
          discoveryCopy?.oneSentenceSummary ?? summary.oneSentenceSummary,
        summary: discoveryCopy?.summary ?? summary.summary,
        whatHappened: discoveryCopy?.whatHappened ?? summary.whatHappened,
        whyItMatters: discoveryCopy?.whyItMatters ?? summary.whyItMatters,
        practicalImpact: discoveryCopy?.practicalImpact ?? summary.practicalImpact,
        affectedParties: discoveryCopy?.affectedParties ?? summary.affectedParties,
        keyObligations:
          discoveryCopy?.keyObligations ?? obligationExtractor.extract(entry.candidate.text),
        complianceDeadlines:
          discoveryCopy?.complianceDeadlines ?? deadlineExtractor.extract(entry.candidate.text),
        enforcementRisk: discoveryCopy?.enforcementRisk ?? summary.enforcementRisk,
        importanceLevel: discoveryOnlySource ? "low" : entry.classification.importanceLevel,
        confidenceLevel: discoveryOnlySource ? "low" : entry.classification.confidenceLevel,
        tags: Array.from(
          new Set([
            ...entry.classification.tags,
            buildAuthorityTag(entry.classification.authorityType),
            ...(discoveryOnlySource
              ? [
                  "discovery_only",
                  "non_official_source",
                  "verification_required",
                  discoveryMetadata.possibleOfficialSourceFound === true
                    ? "official_source_candidate_identified"
                    : "official_source_not_yet_identified",
                ]
              : []),
          ]),
        ),
        status: "needs_review",
        reviewedBy: null,
        reviewedAt: null,
        publishedAt: null,
      });
      const updatedRawItem = await updateRepository.updateRawItemMetadata(
        entry.rawItem.id,
        mergeTraceabilityMetadata(entry.rawItem.rawMetadata, {
          classification: {
            authorityType: entry.classification.authorityType,
            authorityClassification:
              typeof (entry.candidate.metadata as Record<string, unknown> | undefined)
                ?.authorityClassification === "string"
                ? String((entry.candidate.metadata as Record<string, unknown>).authorityClassification)
                : null,
            jurisdiction: entry.classification.jurisdiction,
            developmentType: entry.classification.developmentType,
            legalArea: entry.classification.legalArea,
            importanceLevel: entry.classification.importanceLevel,
            effectiveDate:
              typeof (entry.candidate.metadata as Record<string, unknown> | undefined)
                ?.effectiveDate === "string"
                ? String((entry.candidate.metadata as Record<string, unknown>).effectiveDate)
                : null,
          },
          reviewStatus: update.status,
          publicationStatus: update.status === "published" ? "public" : "hidden",
        }),
      );
      entry.rawItem.rawMetadata = updatedRawItem.rawMetadata;
      const newsItem = buildNewsItemFromUpdate({
        update,
        rawItem: entry.rawItem,
        source: entry.source,
      });
      await updateRepository.upsertNewsItem({
        ...newsItem,
        regulatoryUpdateId: update.id,
        rawItemId: entry.rawItem.id,
      });

      await updateRepository.addProcessingLog({
        rawItemId: entry.rawItem.id,
        regulatoryUpdateId: update.id,
        modelUsed: "heuristic-fallback",
        promptVersion: "summary.v1",
        processingStartedAt: entry.processingStartedAt,
        processingFinishedAt: new Date().toISOString(),
        status: "success",
        errorMessage: null,
      });

      if (
        planningDecision &&
        planningDecision.decision === "allowed_for_live_processing" &&
        env.AI_ENABLE_PROCESSING &&
        !discoveryOnlySource
      ) {
        try {
          const aiResult = await processRegulatoryItemWithOpenAi({
            env,
            source: entry.source,
            candidate: entry.candidate,
            rawItem: entry.rawItem,
            existingUpdate: update,
            planningDecision,
          });

          if (aiResult.skipped) {
            await updateRepository.addProcessingLog({
              rawItemId: entry.rawItem.id,
              regulatoryUpdateId: update.id,
              modelUsed: env.AI_MODEL_SUMMARY,
              promptVersion: "openai-structured.v1",
              processingStartedAt: entry.processingStartedAt,
              processingFinishedAt: new Date().toISOString(),
              status: "skipped",
              errorMessage: aiResult.logMessage,
            });
          } else {
            await updateRepository.saveUpdateEdits(update.id, aiResult.updatePatch);
            const aiReviewAssistMetadata = buildReviewAssistMetadata({
              processedAt: new Date().toISOString(),
              modelUsed: aiResult.modelUsed,
              promptVersion: aiResult.promptVersion,
              planningDecision,
              updatePatch: aiResult.updatePatch,
            });
            const rawItemWithReviewAssist = await updateRepository.updateRawItemMetadata(
              entry.rawItem.id,
              {
                ...entry.rawItem.rawMetadata,
                reviewAssist: aiReviewAssistMetadata,
              },
            );
            entry.rawItem.rawMetadata = rawItemWithReviewAssist.rawMetadata;
            await updateRepository.addProcessingLog({
              rawItemId: entry.rawItem.id,
              regulatoryUpdateId: update.id,
              modelUsed: aiResult.modelUsed,
              promptVersion: aiResult.promptVersion,
              processingStartedAt: entry.processingStartedAt,
              processingFinishedAt: new Date().toISOString(),
              status: "success",
              errorMessage: aiResult.logMessage,
            });
          }
        } catch (error) {
          state.processingFailures += 1;
          const failureReportMessage = buildPipelineFailureReportMessage({
            taskInput: {
              sourceId: entry.source.id,
              rawItemId: entry.rawItem.id,
              regulatoryUpdateId: update.id,
              candidateUrl: entry.candidate.url,
            },
            agentConfig: {
              pipelineStage: "openai_processing",
              model: env.AI_MODEL_SUMMARY,
              processingDecision: planningDecision?.decision ?? "unplanned",
            },
            stepName: "openai_processing",
            stepKind: "llm",
            error,
            stepInput: {
              rawItemId: entry.rawItem.id,
              regulatoryUpdateId: update.id,
            },
          });
          await updateRepository.addProcessingLog({
            rawItemId: entry.rawItem.id,
            regulatoryUpdateId: update.id,
            modelUsed: env.AI_MODEL_SUMMARY,
            promptVersion: "openai-structured.v1",
            processingStartedAt: entry.processingStartedAt,
            processingFinishedAt: new Date().toISOString(),
            status: "failed",
            errorMessage: failureReportMessage ?? "OpenAI processing failed safely.",
          });
        }
      }

      state.newItemsDetected += 1;
    } catch (error) {
      state.processingFailures += 1;
      const failureReportMessage = buildPipelineFailureReportMessage({
        taskInput: {
          sourceId: entry.source.id,
          rawItemId: entry.rawItem.id,
          candidateUrl: entry.candidate.url,
          candidateTitle: entry.candidate.title,
        },
        agentConfig: {
          pipelineStage: "process_candidate",
          parserUsed: resolveParserUsed(entry.source),
        },
        stepName: "process_candidate",
        stepKind: "other",
        error,
        stepInput: {
          rawItemId: entry.rawItem.id,
          candidateUrl: entry.candidate.url,
        },
      });
      await updateRepository.addProcessingLog({
        rawItemId: entry.rawItem.id,
        regulatoryUpdateId: null,
        modelUsed: "heuristic-fallback",
        promptVersion: "summary.v1",
        processingStartedAt: entry.processingStartedAt,
        processingFinishedAt: new Date().toISOString(),
        status: "failed",
        errorMessage: failureReportMessage ?? "Unknown processing failure",
      });
    }
  }
}

// --- Stage 3 helper: finalizeSourceScan ---
// Persists the scan log, updates source operational metadata, records a source
// health check snapshot, and returns the per-source result entry.
// Extracted from runAiRegulationScan to keep the orchestrator readable (C1).
async function finalizeSourceScan(
  source: SourceScanState["source"],
  state: SourceScanState,
  trigger: ScanTrigger,
  scanProfile: ScanProfileId | undefined,
  scanJobId: string | null,
) {
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - state.startedMs;
  const diagnosticMessages = buildScanDiagnosticMessages({
    responseStatus: state.responseStatus,
    itemsFetched: state.itemsFound,
    itemsFilteredOut: state.itemsFilteredOut,
    itemsInserted: state.newItemsDetected,
    duplicatesDetected: state.duplicatesDetected,
    processingFailures: state.processingFailures,
    parsingWarnings: [
      `scan_trigger=${trigger}`,
      `scan_profile=${scanProfile ?? "default"}`,
      ...(scanJobId ? [`scan_job_id=${scanJobId}`] : []),
      ...state.parsingWarnings,
      `AI pending items=${state.aiPendingCount}`,
      `AI skipped items=${state.aiSkippedCount}`,
      `AI estimated cost usd=${state.aiEstimatedCostUsd.toFixed(6)}`,
    ],
    extractionErrors: state.extractionErrors,
    zeroResultsReason: state.zeroResultsReason,
    durationMs,
  });
  const status: RegulationScanLog["status"] = deriveScanStatus({
    extractionErrors: state.extractionErrors,
    processingFailures: state.processingFailures,
    parsingWarnings: state.parsingWarnings,
    itemsInserted: state.newItemsDetected,
  });

  await updateRepository.addScanLog({
    sourceId: source.id,
    scanStartedAt: state.startedAt,
    scanFinishedAt: finishedAt,
    status,
    itemsFound: state.itemsFound,
    newItemsDetected: state.newItemsDetected,
    duplicatesDetected: state.duplicatesDetected,
    errors: diagnosticMessages,
  });
  if (state.scheduledExecutionDecision) {
    return {
      sourceId: source.id,
      status,
      itemsFound: state.itemsFound,
      newItemsDetected: state.newItemsDetected,
      duplicatesDetected: state.duplicatesDetected,
      itemsFilteredOut: state.itemsFilteredOut,
      processingFailures: state.processingFailures,
      responseStatus: state.responseStatus ?? null,
      warnings: state.parsingWarnings,
      errors: state.extractionErrors,
      durationMs,
      zeroResultsReason: state.zeroResultsReason ?? null,
      aiPendingCount: state.aiPendingCount,
      aiSkippedCount: state.aiSkippedCount,
      aiEstimatedCostUsd: Number(state.aiEstimatedCostUsd.toFixed(6)),
      trigger,
      scanProfile: scanProfile ?? "default",
    };
  }
  await updateRepository.updateSource(source.id, {
    config: state.fetchMetadata
      ? {
          ...(source.config ?? {}),
          runtimeFetchState: state.fetchMetadata.state,
        }
      : source.config,
    lastScannedAt: finishedAt,
    lastSuccessfulScanAt: status === "success" || status === "partial_success"
      ? finishedAt
      : source.lastSuccessfulScanAt ?? null,
    lastFailedScanAt: status === "failed" ? finishedAt : source.lastFailedScanAt ?? null,
    latestResponseStatus: state.responseStatus ?? null,
    latestItemsFetched: state.itemsFound,
    latestNewItemsDetected: state.newItemsDetected,
    latestDuplicatesDetected: state.duplicatesDetected,
    latestParserWarnings: state.parsingWarnings,
    latestAccessibilityIssue:
      state.extractionErrors[0] ??
      (state.responseStatus && state.responseStatus >= 400
        ? `Source returned HTTP ${state.responseStatus}.`
        : state.zeroResultsReason ?? null),
    sourceReliabilityNotes:
      state.extractionErrors[0] ??
      state.parsingWarnings[0] ??
      "Latest scan completed without critical reliability issues.",
  });
  await updateRepository.addSourceHealthCheck({
    sourceId: source.id,
    checkedAt: finishedAt,
    responseStatus: state.responseStatus ?? null,
    runtimeAccessible:
      (state.responseStatus ? state.responseStatus < 400 : true) &&
      state.extractionErrors.length === 0,
    parserStatus:
      state.processingFailures > 0
        ? "needs_attention"
        : state.parsingWarnings.length > 0
          ? "warnings_present"
          : "healthy",
    activeRecommendation:
      status === "failed"
        ? "needs_manual_review"
        : source.active
          ? "keep_active"
          : "inactive",
    itemsFetched: state.itemsFound,
    newItemsDetected: state.newItemsDetected,
    duplicatesDetected: state.duplicatesDetected,
    parserWarnings: state.parsingWarnings,
    accessibilityIssue:
      state.extractionErrors[0] ??
      (state.responseStatus && state.responseStatus >= 400
        ? `HTTP ${state.responseStatus}`
        : null),
    reliabilityNotes:
      state.extractionErrors[0] ??
      state.parsingWarnings[0] ??
      "Stable on latest scan.",
  });
  await alertOnSourceScanFinalized({
    sourceBeforeUpdate: source,
    scanStatus: status,
    trigger,
    scanProfile: scanProfile ?? "default",
    scanJobId,
    responseStatus: state.responseStatus ?? null,
    checkedAt: finishedAt,
  });

  return {
    sourceId: source.id,
    status,
    itemsFound: state.itemsFound,
    newItemsDetected: state.newItemsDetected,
    duplicatesDetected: state.duplicatesDetected,
    itemsFilteredOut: state.itemsFilteredOut,
    processingFailures: state.processingFailures,
    responseStatus: state.responseStatus ?? null,
    warnings: state.parsingWarnings,
    errors: state.extractionErrors,
    durationMs,
    zeroResultsReason: state.zeroResultsReason ?? null,
    aiPendingCount: state.aiPendingCount,
    aiSkippedCount: state.aiSkippedCount,
    aiEstimatedCostUsd: Number(state.aiEstimatedCostUsd.toFixed(6)),
    trigger,
    scanProfile: scanProfile ?? "default",
  };
}

// --- Main orchestrator ---
// runAiRegulationScan orchestrates the four pipeline stages.
// Each stage is implemented in its own helper function above so this
// function stays short and readable (C1 optimisation).
export async function runAiRegulationScan(
  sourceId?: string,
  options?: {
    trigger?: ScanTrigger;
    scanJobId?: string;
    scanProfile?: ScanProfileId;
  },
) {
  const trigger = options?.trigger ?? "manual";
  const scanJobId = options?.scanJobId ?? null;
  const scanProfile = options?.scanProfile;
  const activeSources = await sourceManager.getActiveSourcesForProfile(scanProfile);
  const scheduledExecutionDecisions =
    trigger === "manual"
      ? undefined
      : await sourceManager.getScheduledExecutionDecisionsForProfile(scanProfile);
  const sources = sourceId
    ? activeSources.filter((source) => source.id === sourceId)
    : activeSources;

  // Initialise per-source state counters.
  const sourceStates = new Map<string, SourceScanState>();
  for (const source of sources) {
    sourceStates.set(source.id, {
      source,
      startedAt: new Date().toISOString(),
      startedMs: Date.now(),
      itemsFound: 0,
      newItemsDetected: 0,
      duplicatesDetected: 0,
      itemsFilteredOut: 0,
      processingFailures: 0,
      parsingWarnings: [],
      extractionErrors: [],
      responseStatus: null,
      zeroResultsReason: null,
      fetchMetadata: null,
      scheduledExecutionDecision: null,
      aiPendingCount: 0,
      aiSkippedCount: 0,
      aiEstimatedCostUsd: 0,
    });
  }

  // --- Stage 1: scan all sources, collect processable candidates ---
  const processableCandidates = await scanSourcesForCandidates(
    sources,
    trigger,
    scanProfile,
    scanJobId,
    sourceStates,
    scheduledExecutionDecisions,
  );

  // --- Stage 2: AI planning, update/news creation, optional OpenAI ---
  await processAllCandidates(processableCandidates, sourceStates);


  // --- Stage 3: finalizeSourceScan ---
  // For each source, persist scan log, update source metadata, record health
  // check, and assemble the result entry returned to the caller.
  const results = [];
  for (const source of sources) {
    results.push(
      await finalizeSourceScan(
        source,
        sourceStates.get(source.id)!,
        trigger,
        scanProfile,
        scanJobId,
      ),
    );
  }

  // --- Stage 4: recurring verification pass ---
  // The profile definition now carries verificationFilter and verificationLimit
  // so the pipeline does not need a hard-coded country switch (C2 optimisation).
  const activeProfile = getScanProfile(scanProfile);
  const shouldRunRecurringVerification =
    (activeProfile?.runsRecurringVerification ?? false) ||
    (!scanProfile && !sourceId && trigger !== "manual");

  if (!sourceId && shouldRunRecurringVerification) {
    const verificationSummary = await runRecurringVerification({
      limit: activeProfile?.verificationLimit ?? 30,
      sourceFilter: activeProfile?.verificationFilter,
    });
    results.push({
      sourceId: "recurring-verification",
      status: "success" as const,
      itemsFound: verificationSummary.checked,
      newItemsDetected: 0,
      duplicatesDetected: 0,
      itemsFilteredOut: verificationSummary.needsOfficialSource,
      processingFailures: 0,
      responseStatus: null,
      warnings: [
        `verification_checked=${verificationSummary.checked}`,
        `official_source_found=${verificationSummary.officialSourceFound}`,
        `needs_official_source=${verificationSummary.needsOfficialSource}`,
        `stale_unverified=${verificationSummary.stale}`,
      ],
      errors: [],
      durationMs: 0,
      zeroResultsReason: verificationSummary.checked === 0
        ? "No unresolved discovery leads required recurring verification."
        : null,
      aiPendingCount: 0,
      aiSkippedCount: 0,
      aiEstimatedCostUsd: 0,
      trigger,
      scanProfile: scanProfile ?? "default",
    });
  }

  return results;
}
