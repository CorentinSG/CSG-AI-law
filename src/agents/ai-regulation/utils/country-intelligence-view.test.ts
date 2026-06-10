import { describe, expect, it } from "vitest";

import { groupCountryIntelligenceSourcesByFamily } from "@/agents/ai-regulation/utils/country-intelligence-view";
import type { CountryIntelligenceSource } from "@/agents/ai-regulation/governance";

function source(
  overrides: Partial<CountryIntelligenceSource> & { id: string },
): CountryIntelligenceSource {
  return {
    countryId: "country-france",
    sourceUrl: "https://example.gov/source",
    sourceTitle: "Example source",
    institution: "Example institution",
    authorityType: "regulator",
    publicAccessible: true,
    runtimeAccessible: true,
    lastCheckedAt: null,
    responseStatus: 200,
    active: true,
    notes: "regulation: Example note",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupCountryIntelligenceSourcesByFamily", () => {
  it("routes case-law and guidance authority types into their own families", () => {
    const grouped = groupCountryIntelligenceSourcesByFamily([
      source({ id: "country-source-france-regulation-1", authorityType: "regulator" }),
      source({ id: "country-source-france-case-law-1", authorityType: "case_law_source" }),
      source({ id: "country-source-france-soft-law-1", authorityType: "guidance_source" }),
      source({ id: "country-source-france-regulation-2", authorityType: "soft_law" }),
    ]);

    expect(grouped.regulation).toHaveLength(2);
    expect(grouped.caseLaw).toHaveLength(1);
    expect(grouped.softLaw).toHaveLength(1);
    // `soft_law` authority type stays in the regulation family — only the
    // explicit `guidance_source` marker is the soft-law family.
    expect(grouped.regulation.map((s) => s.url)).toEqual([
      "https://example.gov/source",
      "https://example.gov/source",
    ]);
  });

  it("orders sources by their trailing index, not repository order", () => {
    const grouped = groupCountryIntelligenceSourcesByFamily([
      source({ id: "country-source-france-regulation-10", sourceTitle: "Tenth" }),
      source({ id: "country-source-france-regulation-2", sourceTitle: "Second" }),
      source({ id: "country-source-france-regulation-1", sourceTitle: "First" }),
    ]);

    expect(grouped.regulation.map((s) => s.label)).toEqual([
      "First",
      "Second",
      "Tenth",
    ]);
  });

  it("strips the family prefix from notes and normalizes nullable fields", () => {
    const grouped = groupCountryIntelligenceSourcesByFamily([
      source({
        id: "country-source-france-case-law-1",
        authorityType: "case_law_source",
        notes: "case-law: Judilibre AI decisions",
        institution: null,
        runtimeAccessible: null,
        responseStatus: null,
      }),
    ]);

    const item = grouped.caseLaw[0];
    expect(item.note).toBe("Judilibre AI decisions");
    expect(item.institution).toBe("");
    expect(item.runtimeAccessible).toBeNull();
    expect(item.responseStatus).toBeNull();
  });

  it("returns empty families when there are no sources", () => {
    const grouped = groupCountryIntelligenceSourcesByFamily([]);
    expect(grouped.regulation).toEqual([]);
    expect(grouped.caseLaw).toEqual([]);
    expect(grouped.softLaw).toEqual([]);
  });
});
