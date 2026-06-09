import { describe, expect, it } from "vitest";

import { getItalyAiIntelligenceSnapshot } from "@/content/ai-regulation/italy-ai-intelligence";

describe("italy ai intelligence", () => {
  it("builds an Italy snapshot with authority map, timeline, and verification gaps", () => {
    const snapshot = getItalyAiIntelligenceSnapshot();

    expect(snapshot.authorityMap.length).toBeGreaterThan(0);
    expect(snapshot.timeline.length).toBeGreaterThan(0);
    expect(snapshot.verificationGaps.length).toBeGreaterThan(0);
  });

  it("includes Italian decision-layer entries in the verified decisions panel", () => {
    const snapshot = getItalyAiIntelligenceSnapshot();

    expect(snapshot.verifiedDecisions.some((entry) => entry.country === "Italy")).toBe(true);
  });
});
