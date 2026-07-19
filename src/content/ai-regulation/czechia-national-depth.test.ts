import { describe, expect, it } from "vitest";

import { czechiaNationalDepthEntries } from "./czechia-national-depth";

describe("czechiaNationalDepthEntries", () => {
  it("covers Czechia country-by-country with official national depth across the requested domains", () => {
    expect(czechiaNationalDepthEntries).toHaveLength(7);
    expect(new Set(czechiaNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Czechia"]),
    );

    expect(new Set(czechiaNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of czechiaNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("czechia-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
