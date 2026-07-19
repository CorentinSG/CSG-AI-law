import { describe, expect, it } from "vitest";

import { cyprusNationalDepthEntries } from "./cyprus-national-depth";

describe("cyprusNationalDepthEntries", () => {
  it("covers Cyprus country-by-country with official national depth across the requested domains", () => {
    expect(cyprusNationalDepthEntries).toHaveLength(7);
    expect(new Set(cyprusNationalDepthEntries.map((entry) => entry.country))).toEqual(
      new Set(["Cyprus"]),
    );

    expect(new Set(cyprusNationalDepthEntries.map((entry) => entry.legalArea))).toEqual(
      new Set([
        "AI governance",
        "Data protection",
        "Cloud and infrastructure",
        "Copyright and generative AI",
        "Labor and social law",
        "Automated decision-making",
      ]),
    );

    for (const entry of cyprusNationalDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("cyprus-national-depth");
      expect(entry.tags).toContain("official-source");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
