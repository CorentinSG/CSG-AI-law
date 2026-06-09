import { estimateMonthlyAiSpend, parseAiPlanningLog } from "@/agents/ai-regulation/processors/aiPlanning";
import { parseOpenAiResultLog } from "@/agents/ai-regulation/processors/openaiProcessor";
import type { AiProcessingLog, RawRegulatoryItem } from "@/agents/ai-regulation/types";

export function summarizeAiPlanning(
  processingLogs: AiProcessingLog[],
  rawItems: RawRegulatoryItem[],
) {
  const rawItemMap = new Map(rawItems.map((item) => [item.id, item]));
  const planningLogs = processingLogs
    .map((log) => ({
      log,
      plan: parseAiPlanningLog(log),
    }))
    .filter(
      (
        entry,
      ): entry is { log: AiProcessingLog; plan: NonNullable<ReturnType<typeof parseAiPlanningLog>> } =>
        Boolean(entry.plan),
    );

  const pending = planningLogs
    .filter((entry) => entry.plan.decision === "pending_ai_processing")
    .sort((left, right) => right.plan.rankingScore - left.plan.rankingScore);
  const skipped = planningLogs.filter((entry) => entry.plan.decision.startsWith("skipped_"));
  const openAiResults = processingLogs
    .map((log) => ({
      log,
      result: parseOpenAiResultLog(log),
    }))
    .filter(
      (
        entry,
      ): entry is { log: AiProcessingLog; result: NonNullable<ReturnType<typeof parseOpenAiResultLog>> } =>
        Boolean(entry.result),
    );

  return {
    planningLogs,
    pending,
    skipped,
    openAiResults,
    estimatedMonthlySpendUsd: estimateMonthlyAiSpend(processingLogs),
    enrichedPending: pending.slice(0, 8).map((entry) => ({
      ...entry.plan,
      rawItem: rawItemMap.get(entry.plan.rawItemId) ?? null,
    })),
    enrichedSkipped: skipped.slice(0, 8).map((entry) => ({
      ...entry.plan,
      rawItem: rawItemMap.get(entry.plan.rawItemId) ?? null,
    })),
    enrichedOpenAiResults: openAiResults.slice(0, 8).map((entry) => ({
      ...entry.result,
      rawItem: rawItemMap.get(entry.log.rawItemId) ?? null,
      regulatoryUpdateId: entry.log.regulatoryUpdateId,
      logId: entry.log.id,
    })),
  };
}
