import { describe, expect, it } from "vitest";

import { getMediaDomainScore } from "@/agents/ai-regulation/mediaDomainScoring";

describe("media domain scoring", () => {
  it("gives Reuters a higher score than a secondary domain", () => {
    const reuters = getMediaDomainScore({
      sourceType: "legal_regulatory_press",
      sourceUrl: "https://www.reuters.com/world/europe/eu-ai-act-update/",
      sourceName: "Reuters",
    });
    const secondary = getMediaDomainScore({
      sourceType: "legal_regulatory_press",
      sourceUrl: "https://example.org/ai-regulation-commentary",
      sourceName: "Example Source",
    });

    expect(reuters.label).toBe("Reuters");
    expect(reuters.score).toBeGreaterThan(secondary.score);
    expect(reuters.tier).toBe("major_global");
  });

  it("does not override official sources with media scores", () => {
    const official = getMediaDomainScore({
      sourceType: "official_source",
      sourceUrl: "https://commission.europa.eu/news-and-media/news/example",
      sourceName: "European Commission",
    });

    expect(official.score).toBe(0);
    expect(official.label).toBe("Official source");
  });
});
