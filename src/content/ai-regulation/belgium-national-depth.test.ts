import { describe, expect, it } from "vitest";

import { belgiumNationalDepthEntries } from "./belgium-national-depth";

describe("belgiumNationalDepthEntries", () => {
  it("covers Belgium country-by-country with official national depth across the requested domains", () => {
    expect(belgiumNationalDepthEntries).toHaveLength(7);
    expect(new Set(belgiumNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Belgium"]),
    );

    expect(new Set(belgiumNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of belgiumNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("belgium-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
