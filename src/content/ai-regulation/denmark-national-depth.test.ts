import { describe, expect, it } from "vitest";

import { denmarkNationalDepthEntries } from "./denmark-national-depth";

describe("denmarkNationalDepthEntries", () => {
  it("covers Denmark country-by-country with official national depth across the requested domains", () => {
    expect(denmarkNationalDepthEntries).toHaveLength(7);
    expect(new Set(denmarkNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Denmark"]),
    );

    expect(new Set(denmarkNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of denmarkNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("denmark-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
