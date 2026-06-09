import { describe, expect, it } from "vitest";

import { getSpainAiIntelligenceSnapshot } from "@/content/ai-regulation/spain-ai-intelligence";

describe("Spain AI intelligence snapshot", () => {
  it("builds a structured Spain authority map, timeline, and verification gap layer", () => {
    const snapshot = getSpainAiIntelligenceSnapshot();

    expect(snapshot.authorityMap.length).toBeGreaterThanOrEqual(4);
    expect(
      snapshot.authorityMap.some(
        (entry) =>
          entry.category === "ai_supervision_body" &&
          entry.statusLabel === "officially_supported",
      ),
    ).toBe(true);
    expect(
      snapshot.authorityMap.some(
        (entry) =>
          entry.category === "draft_governance_instrument" &&
          entry.statusLabel === "direct_instrument_under_review",
      ),
    ).toBe(true);

    expect(snapshot.timeline.length).toBeGreaterThanOrEqual(6);
    expect(snapshot.timeline[0]?.date >= snapshot.timeline[1]?.date).toBe(true);
    expect(
      snapshot.timeline.some(
        (entry) =>
          entry.date === "2026-05-26" &&
          entry.title.includes("draft organic law"),
      ),
    ).toBe(true);

    expect(snapshot.verifiedDecisions.length).toBeGreaterThanOrEqual(2);
    expect(
      snapshot.verifiedDecisions.some(
        (entry) =>
          entry.authorityType === "administrative_decision" &&
          entry.courtOrAuthority.includes("AEPD"),
      ),
    ).toBe(true);

    expect(snapshot.verificationGaps.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.verificationGaps.some((gap) => gap.severity === "high")).toBe(true);
  });
});
