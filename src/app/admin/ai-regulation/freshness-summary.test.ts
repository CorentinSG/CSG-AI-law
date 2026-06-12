import { describe, expect, it } from "vitest";

import {
  runtimeHealthTone,
  summarizeRuntimeHealth,
} from "@/app/admin/ai-regulation/freshness-summary";
import type { SourceRuntimeHealthSummary } from "@/agents/ai-regulation/sourceRuntimeHealth";

function summary(
  overrides: Partial<SourceRuntimeHealthSummary> & { sourceId: string },
): SourceRuntimeHealthSummary {
  return {
    sourceName: overrides.sourceId,
    jurisdiction: "European Union",
    active: true,
    state: "healthy",
    priorityBand: "medium",
    recommendedCadence: "daily",
    freshHours: 24,
    staleHours: 168,
    freshnessStatus: "fresh",
    lastCheckedAt: null,
    lastSuccessfulAt: null,
    lastFailureAt: null,
    lastScanJobAt: null,
    lastScanJobStatus: null,
    hoursSinceSuccess: null,
    consecutiveFailures: 0,
    latestResponseStatus: null,
    latestParserStatus: null,
    latestFailureMessage: null,
    reasons: [],
    ...overrides,
  } as SourceRuntimeHealthSummary;
}

describe("summarizeRuntimeHealth", () => {
  it("counts states and collects stale+degraded as needing attention", () => {
    const rollup = summarizeRuntimeHealth([
      summary({ sourceId: "a", state: "stale", priorityBand: "high" }),
      summary({ sourceId: "b", state: "degraded", priorityBand: "low" }),
      summary({ sourceId: "c", state: "healthy" }),
      summary({ sourceId: "d", state: "inactive", active: false }),
    ]);

    expect(rollup.total).toBe(4);
    expect(rollup.stale).toBe(1);
    expect(rollup.degraded).toBe(1);
    expect(rollup.healthy).toBe(1);
    expect(rollup.inactive).toBe(1);
    expect(rollup.needsAttention.map((s) => s.sourceId)).toEqual(["a", "b"]);
    expect(rollup.highPriorityAtRisk).toBe(1);
  });

  it("handles an empty input", () => {
    const rollup = summarizeRuntimeHealth([]);
    expect(rollup).toMatchObject({ total: 0, stale: 0, needsAttention: [] });
  });

  it("maps states to display tones", () => {
    expect(runtimeHealthTone("stale")).toBe("danger");
    expect(runtimeHealthTone("degraded")).toBe("warning");
    expect(runtimeHealthTone("healthy")).toBe("ok");
    expect(runtimeHealthTone("inactive")).toBe("muted");
  });
});
