import { describe, expect, it } from "vitest";

import { austriaNationalDepthEntries } from "./austria-national-depth";

describe("austriaNationalDepthEntries", () => {
  it("covers Austria country-by-country with official national depth across the requested domains", () => {
    expect(austriaNationalDepthEntries).toHaveLength(7);
    expect(new Set(austriaNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Austria"]),
    );

    expect(new Set(austriaNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of austriaNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("austria-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
