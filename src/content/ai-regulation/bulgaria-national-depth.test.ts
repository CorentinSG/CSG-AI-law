import { describe, expect, it } from "vitest";

import { bulgariaNationalDepthEntries } from "./bulgaria-national-depth";

describe("bulgariaNationalDepthEntries", () => {
  it("covers Bulgaria country-by-country with official national depth across the requested domains", () => {
    expect(bulgariaNationalDepthEntries).toHaveLength(7);
    expect(new Set(bulgariaNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Bulgaria"]),
    );

    expect(new Set(bulgariaNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of bulgariaNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("bulgaria-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
