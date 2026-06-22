import type {
  SourceRuntimeHealthState,
  SourceRuntimeHealthSummary,
} from "@/agents/ai-regulation/sourceRuntimeHealth";

/**
 * Presentational rollup of the per-source runtime-health summaries (T-RT1A
 * contract) for the admin freshness dashboard (T-RT1C). Pure — no I/O.
 */
export interface RuntimeHealthRollup {
  total: number;
  stale: number;
  degraded: number;
  healthy: number;
  inactive: number;
  /** Subset reporting runtime inaccessibility (a stricter signal than "stale"). */
  inaccessible: number;
  /** Sources needing attention (stale + degraded), preserving the contract's sort. */
  needsAttention: SourceRuntimeHealthSummary[];
  /** Active high-priority sources whose state is stale or degraded. */
  highPriorityAtRisk: number;
}

/** A source whose latest check reported it unreachable / recommended inactive. */
export function isInaccessible(summary: SourceRuntimeHealthSummary): boolean {
  return summary.freshnessStatus === "source_inaccessible";
}

export function summarizeRuntimeHealth(
  summaries: SourceRuntimeHealthSummary[],
): RuntimeHealthRollup {
  const counts: Record<SourceRuntimeHealthState, number> = {
    healthy: 0,
    degraded: 0,
    stale: 0,
    inactive: 0,
  };

  for (const summary of summaries) {
    counts[summary.state] += 1;
  }

  const needsAttention = summaries.filter(
    (summary) => summary.state === "stale" || summary.state === "degraded",
  );

  const highPriorityAtRisk = needsAttention.filter(
    (summary) => summary.priorityBand === "high",
  ).length;

  const inaccessible = summaries.filter(isInaccessible).length;

  return {
    total: summaries.length,
    stale: counts.stale,
    degraded: counts.degraded,
    healthy: counts.healthy,
    inactive: counts.inactive,
    inaccessible,
    needsAttention,
    highPriorityAtRisk,
  };
}

const stateTone: Record<SourceRuntimeHealthState, "danger" | "warning" | "ok" | "muted"> = {
  stale: "danger",
  degraded: "warning",
  healthy: "ok",
  inactive: "muted",
};

export function runtimeHealthTone(state: SourceRuntimeHealthState) {
  return stateTone[state];
}
