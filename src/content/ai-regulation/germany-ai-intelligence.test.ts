import { describe, expect, it } from "vitest";

import { getGermanyAiIntelligenceSnapshot } from "@/content/ai-regulation/germany-ai-intelligence";

describe("germany ai intelligence", () => {
  it("builds a Germany snapshot with authority map, timeline, and verification gaps", () => {
    const snapshot = getGermanyAiIntelligenceSnapshot();

    expect(snapshot.authorityMap.length).toBeGreaterThan(0);
    expect(snapshot.timeline.length).toBeGreaterThan(0);
    expect(snapshot.verificationGaps.length).toBeGreaterThan(0);
  });

  it("includes Germany decision-layer entries in the verified decisions panel", () => {
    const snapshot = getGermanyAiIntelligenceSnapshot();

    expect(snapshot.verifiedDecisions.some((entry) => entry.country === "Germany")).toBe(true);
  });
});
