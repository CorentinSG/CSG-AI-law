import { describe, expect, it } from "vitest";

import { newYorkAiLawDepthEntries } from "./new-york-ai-law-depth";

describe("newYorkAiLawDepthEntries", () => {
  it("covers New York AI law across courts, work product, AEDT, agencies, and legislation", () => {
    expect(newYorkAiLawDepthEntries.length).toBeGreaterThanOrEqual(15);
    expect(new Set(newYorkAiLawDepthEntries.map((entry) => entry.jurisdiction))).toEqual(
      new Set(["New York"]),
    );

    expect(Array.from(new Set(newYorkAiLawDepthEntries.map((entry) => entry.legalArea)))).toEqual(
      expect.arrayContaining([
        "Professional responsibility",
        "Automated decision-making",
        "Labor and social law",
        "Financial services",
        "Cybersecurity",
        "Public sector use of AI",
        "AI governance",
      ]),
    );

    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("work-product"))).toBe(
      true,
    );
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("attorney-client-privilege"))).toBe(true);
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("local-law-144"))).toBe(
      true,
    );
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("hallucinated-authority"))).toBe(
      true,
    );
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("discovery-lead"))).toBe(
      false,
    );

    for (const entry of newYorkAiLawDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("new-york-ai-law-watch");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });
});
