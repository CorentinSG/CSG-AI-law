import { describe, expect, it } from "vitest";

import { getFranceAiIntelligenceSnapshot } from "@/content/ai-regulation/france-ai-intelligence";

describe("France AI intelligence snapshot", () => {
  it("builds a structured France authority map, timeline, and verification gap layer", () => {
    const snapshot = getFranceAiIntelligenceSnapshot();

    expect(snapshot.authorityMap.length).toBeGreaterThanOrEqual(4);
    expect(
      snapshot.authorityMap.some(
        (entry) =>
          entry.category === "fundamental_rights_authority" &&
          entry.statusLabel === "officially_supported",
      ),
    ).toBe(true);
    expect(
      snapshot.authorityMap.some(
        (entry) =>
          entry.category === "notifying_authority" &&
          entry.statusLabel === "direct_instrument_under_review",
      ),
    ).toBe(true);

    expect(snapshot.timeline.length).toBeGreaterThanOrEqual(6);
    expect(snapshot.timeline[0]?.date >= snapshot.timeline[1]?.date).toBe(true);
    expect(
      snapshot.timeline.some(
        (entry) =>
          entry.date === "2026-04-07" &&
          entry.title.includes("CNIL 2026 work programme"),
      ),
    ).toBe(true);

    expect(snapshot.verifiedDecisions.length).toBeGreaterThanOrEqual(7);
    expect(
      snapshot.verifiedDecisions.some(
        (entry) =>
          entry.docketOrCaseNumber === "2025-108" &&
          entry.authorityType === "administrative_decision",
      ),
    ).toBe(true);

    expect(snapshot.verificationGaps.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.verificationGaps.some((gap) => gap.severity === "high")).toBe(true);
  });
});
