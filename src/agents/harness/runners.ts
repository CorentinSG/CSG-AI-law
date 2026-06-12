import {
  planAiProcessingBatch,
  type CandidateForAiPlanning,
} from "@/agents/ai-regulation/processors/aiPlanning";
import { aiClassifier } from "@/agents/ai-regulation/processors/aiClassifier";
import { aiSummarizer } from "@/agents/ai-regulation/processors/aiSummarizer";
import { deadlineExtractor } from "@/agents/ai-regulation/processors/deadlineExtractor";
import { deduplicator } from "@/agents/ai-regulation/processors/deduplicator";
import { obligationExtractor } from "@/agents/ai-regulation/processors/obligationExtractor";
import { relevanceFilter } from "@/agents/ai-regulation/processors/relevanceFilter";
import {
  buildScanDiagnosticMessages,
  deriveScanStatus,
} from "@/agents/ai-regulation/processors/scanDiagnostics";
import type {
  ExtractedCandidateItem,
  NormalizedRegulatoryUpdateDraft,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { AuthorityType } from "@/db/schema";
import { replayTrace, type ReplayResult } from "@/agents/harness/replay";
import type { AgentRunTrace } from "@/agents/harness/trace";

export const builtInReplayRunnerIds = [
  "relevance_filter",
  "ai_classifier",
  "deadline_extractor",
  "obligation_extractor",
  "ai_summarizer",
  "ai_planning_batch",
  "scan_diagnostics_messages",
  "scan_status_derivation",
  "deduplicator_hash",
] as const;

export type BuiltInReplayRunnerId = (typeof builtInReplayRunnerIds)[number];

export interface BuiltInReplayRunner {
  id: BuiltInReplayRunnerId;
  description: string;
  supports(trace: AgentRunTrace): boolean;
  run(taskInput: unknown): Promise<unknown>;
}

function hasPreferredReplayRunner(
  trace: AgentRunTrace,
): trace is AgentRunTrace & { agentConfig: { replayRunner: BuiltInReplayRunnerId } } {
  return typeof trace.agentConfig.replayRunner === "string";
}

function looksLikeRelevanceInput(
  taskInput: unknown,
): taskInput is { candidate: ExtractedCandidateItem; source: RegulationSource } {
  if (!taskInput || typeof taskInput !== "object") return false;

  const candidate = (taskInput as Record<string, unknown>).candidate;
  const source = (taskInput as Record<string, unknown>).source;

  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      typeof (candidate as Record<string, unknown>).title === "string" &&
      typeof (candidate as Record<string, unknown>).text === "string" &&
      source &&
      typeof source === "object" &&
      typeof (source as Record<string, unknown>).id === "string" &&
      typeof (source as Record<string, unknown>).name === "string",
  );
}

function looksLikeClassifierInput(
  taskInput: unknown,
): taskInput is Parameters<typeof aiClassifier.classify>[0] {
  if (!taskInput || typeof taskInput !== "object") return false;

  return (
    typeof (taskInput as Record<string, unknown>).title === "string" &&
    typeof (taskInput as Record<string, unknown>).text === "string" &&
    typeof (taskInput as Record<string, unknown>).sourceName === "string"
  );
}

function looksLikeTextOnlyInput(
  taskInput: unknown,
): taskInput is { text: string } {
  return Boolean(
    taskInput &&
      typeof taskInput === "object" &&
      typeof (taskInput as Record<string, unknown>).text === "string",
  );
}

function looksLikeSummarizerInput(
  taskInput: unknown,
): taskInput is {
  title: string;
  text: string;
  legalArea: NormalizedRegulatoryUpdateDraft["legalArea"];
  developmentType: NormalizedRegulatoryUpdateDraft["developmentType"];
  authorityType: AuthorityType;
} {
  if (!taskInput || typeof taskInput !== "object") return false;

  return (
    typeof (taskInput as Record<string, unknown>).title === "string" &&
    typeof (taskInput as Record<string, unknown>).text === "string" &&
    typeof (taskInput as Record<string, unknown>).legalArea === "string" &&
    typeof (taskInput as Record<string, unknown>).developmentType === "string" &&
    typeof (taskInput as Record<string, unknown>).authorityType === "string"
  );
}

function looksLikeAiPlanningInput(
  taskInput: unknown,
): taskInput is {
  candidates: CandidateForAiPlanning[];
  env: Parameters<typeof planAiProcessingBatch>[1];
  monthlySpendUsd: number;
} {
  if (!taskInput || typeof taskInput !== "object") return false;
  const record = taskInput as Record<string, unknown>;
  return (
    Array.isArray(record.candidates) &&
    !!record.env &&
    typeof record.env === "object" &&
    typeof record.monthlySpendUsd === "number"
  );
}

function looksLikeScanDiagnosticsInput(
  taskInput: unknown,
): taskInput is Parameters<typeof buildScanDiagnosticMessages>[0] {
  if (!taskInput || typeof taskInput !== "object") return false;
  const record = taskInput as Record<string, unknown>;
  return (
    typeof record.itemsFetched === "number" &&
    typeof record.itemsFilteredOut === "number" &&
    typeof record.itemsInserted === "number" &&
    typeof record.duplicatesDetected === "number" &&
    typeof record.processingFailures === "number" &&
    Array.isArray(record.parsingWarnings) &&
    Array.isArray(record.extractionErrors) &&
    typeof record.durationMs === "number"
  );
}

function looksLikeScanStatusInput(
  taskInput: unknown,
): taskInput is Parameters<typeof deriveScanStatus>[0] {
  if (!taskInput || typeof taskInput !== "object") return false;
  const record = taskInput as Record<string, unknown>;
  return (
    Array.isArray(record.extractionErrors) &&
    typeof record.processingFailures === "number" &&
    Array.isArray(record.parsingWarnings) &&
    typeof record.itemsInserted === "number"
  );
}

function looksLikeDeduplicatorHashInput(
  taskInput: unknown,
): taskInput is Parameters<typeof deduplicator.createHash>[0] {
  if (!taskInput || typeof taskInput !== "object") return false;
  const record = taskInput as Record<string, unknown>;
  return (
    typeof record.sourceId === "string" &&
    typeof record.title === "string" &&
    typeof record.url === "string" &&
    typeof record.text === "string"
  );
}

const builtInReplayRunners: BuiltInReplayRunner[] = [
  {
    id: "relevance_filter",
    description:
      "Replays { candidate, source } inputs through the deterministic AI-regulation relevance filter.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "relevance_filter";
      }
      return looksLikeRelevanceInput(trace.taskInput);
    },
    async run(taskInput) {
      const { candidate, source } = taskInput as {
        candidate: ExtractedCandidateItem;
        source: RegulationSource;
      };
      return relevanceFilter.evaluate(candidate, source);
    },
  },
  {
    id: "ai_classifier",
    description:
      "Replays deterministic classification inputs through the heuristic AI-regulation classifier.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "ai_classifier";
      }
      return looksLikeClassifierInput(trace.taskInput);
    },
    async run(taskInput) {
      return aiClassifier.classify(taskInput as Parameters<typeof aiClassifier.classify>[0]);
    },
  },
  {
    id: "deadline_extractor",
    description:
      "Replays text inputs through the deterministic compliance-deadline extractor.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "deadline_extractor";
      }
      return (
        looksLikeTextOnlyInput(trace.taskInput) &&
        !looksLikeClassifierInput(trace.taskInput) &&
        !looksLikeSummarizerInput(trace.taskInput)
      );
    },
    async run(taskInput) {
      return deadlineExtractor.extract((taskInput as { text: string }).text);
    },
  },
  {
    id: "obligation_extractor",
    description:
      "Replays text inputs through the deterministic obligation extractor.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "obligation_extractor";
      }
      return false;
    },
    async run(taskInput) {
      return obligationExtractor.extract((taskInput as { text: string }).text);
    },
  },
  {
    id: "ai_summarizer",
    description:
      "Replays deterministic summarization inputs through the local heuristic summarizer.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "ai_summarizer";
      }
      return looksLikeSummarizerInput(trace.taskInput);
    },
    async run(taskInput) {
      return aiSummarizer.summarize(
        taskInput as Parameters<typeof aiSummarizer.summarize>[0],
      );
    },
  },
  {
    id: "ai_planning_batch",
    description:
      "Replays ranked candidate batches through deterministic AI-planning guardrails.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "ai_planning_batch";
      }
      return looksLikeAiPlanningInput(trace.taskInput);
    },
    async run(taskInput) {
      const input = taskInput as {
        candidates: CandidateForAiPlanning[];
        env: Parameters<typeof planAiProcessingBatch>[1];
        monthlySpendUsd: number;
      };
      return planAiProcessingBatch(input.candidates, input.env, input.monthlySpendUsd);
    },
  },
  {
    id: "scan_diagnostics_messages",
    description:
      "Replays per-source scan telemetry through the deterministic diagnostic-message builder.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "scan_diagnostics_messages";
      }
      return (
        looksLikeScanDiagnosticsInput(trace.taskInput) &&
        !looksLikeScanStatusInput(trace.taskInput)
      );
    },
    async run(taskInput) {
      return buildScanDiagnosticMessages(
        taskInput as Parameters<typeof buildScanDiagnosticMessages>[0],
      );
    },
  },
  {
    id: "scan_status_derivation",
    description:
      "Replays source-scan aggregate counters through the deterministic scan-status derivation step.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "scan_status_derivation";
      }
      return looksLikeScanStatusInput(trace.taskInput);
    },
    async run(taskInput) {
      return deriveScanStatus(taskInput as Parameters<typeof deriveScanStatus>[0]);
    },
  },
  {
    id: "deduplicator_hash",
    description:
      "Replays raw candidate identity inputs through the stable deduplication hash builder.",
    supports(trace) {
      if (hasPreferredReplayRunner(trace)) {
        return trace.agentConfig.replayRunner === "deduplicator_hash";
      }
      return looksLikeDeduplicatorHashInput(trace.taskInput);
    },
    async run(taskInput) {
      return deduplicator.createHash(
        taskInput as Parameters<typeof deduplicator.createHash>[0],
      );
    },
  },
];

export function listBuiltInReplayRunners() {
  return builtInReplayRunners;
}

export function getBuiltInReplayRunner(id: BuiltInReplayRunnerId) {
  return builtInReplayRunners.find((runner) => runner.id === id) ?? null;
}

export function resolveBuiltInReplayRunner(trace: AgentRunTrace) {
  return builtInReplayRunners.find((runner) => runner.supports(trace)) ?? null;
}

export async function replayTraceWithBuiltInRunner(trace: AgentRunTrace): Promise<{
  runnerId: BuiltInReplayRunnerId;
  result: ReplayResult;
}> {
  const runner = resolveBuiltInReplayRunner(trace);
  if (!runner) {
    throw new Error(
      "No built-in replay runner matches this trace. Supply a custom side-effect-free runner instead.",
    );
  }

  return {
    runnerId: runner.id,
    result: await replayTrace(trace, runner.run),
  };
}
