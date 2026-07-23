import { describe, expect, it } from "vitest";

import { newYorkAiLawDepthEntries } from "./new-york-ai-law-depth";

describe("newYorkAiLawDepthEntries", () => {
  it("covers New York AI law across courts, work product, AEDT, agencies, and legislation", () => {
    expect(newYorkAiLawDepthEntries).toHaveLength(60);
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
        "Consumer protection",
        "Copyright and generative AI",
        "Criminal justice",
      ]),
    );

    for (const requiredTag of [
      "work-product",
      "attorney-client-privilege",
      "local-law-144",
      "hallucinated-authority",
      "loading-act",
      "ai-companions",
      "digital-replica",
      "deepfakes",
      "algorithmic-feeds",
      "effective-2027",
    ]) {
      expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes(requiredTag))).toBe(true);
    }

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

  it("preserves the operative status and authority of the corrected 2026 sources", () => {
    const byTitle = new Map(newYorkAiLawDepthEntries.map((entry) => [entry.title, entry]));

    expect(
      byTitle.get("SAFE for Kids Act regulates addictive algorithmic feeds for minors")?.summary,
    ).toContain("not yet effective");
    expect(
      byTitle.get(
        "Digital replica contract law conditions performer voice and likeness agreements",
      )?.publicationDate,
    ).toBe("2024-12-13");
    expect(
      byTitle.get("NYS-P24-001 sets AI acceptable-use rules for covered state agencies")
        ?.publicationDate,
    ).toBe("2026-06-24");
    expect(
      byTitle.get("NYT v OpenAI motion-to-dismiss ruling lets core copyright claims proceed")
        ?.authorityType,
    ).toBe("Other");
    expect(
      byTitle.get(
        "RAISE Act chapter amendment finalizes frontier-developer duties before the 2027 effective date",
      )?.whatHappened,
    ).toContain("All frontier developers");
  });
});
