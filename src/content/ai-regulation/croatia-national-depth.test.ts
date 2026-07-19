import { describe, expect, it } from "vitest";

import { croatiaNationalDepthEntries } from "./croatia-national-depth";

describe("croatiaNationalDepthEntries", () => {
  it("covers Croatia country-by-country with official national depth across the requested domains", () => {
    expect(croatiaNationalDepthEntries).toHaveLength(7);
    expect(new Set(croatiaNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Croatia"]),
    );

    expect(new Set(croatiaNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of croatiaNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("croatia-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
