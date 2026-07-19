import { describe, expect, it } from "vitest";

import { estoniaNationalDepthEntries } from "./estonia-national-depth";

describe("estoniaNationalDepthEntries", () => {
  it("covers Estonia country-by-country with official national depth across the requested domains", () => {
    expect(estoniaNationalDepthEntries).toHaveLength(7);
    expect(new Set(estoniaNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Estonia"]),
    );

    expect(new Set(estoniaNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of estoniaNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("estonia-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
