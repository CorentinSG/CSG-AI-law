import { describe, expect, it } from "vitest";

import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";

function createItem(overrides: Partial<AiLawNewsItem> = {}): AiLawNewsItem {
  return {
    id: "news-1",
    title: "European Commission AI Act guidance update",
    slug: "eu-guidance",
    shortSummary: "The Commission published AI Act guidance.",
    fullSummary: "The Commission published guidance.",
    detectedAt: "2026-06-01T10:00:00.000Z",
    eventDate: "2026-06-01",
    publicationDate: "2026-06-01",
    lastVerifiedAt: "2026-06-01T10:00:00.000Z",
    sourceName: "European Commission AI and Digital Strategy pages",
    sourceUrl: "https://example.eu",
    sourceType: "official_source",
    sourceReliability: "official_authority",
    sourceJurisdiction: "European Union",
    jurisdiction: "European Union",
    region: "Europe",
    countryOrState: "European Union",
    legalArea: "AI governance",
    topicTags: ["AI Act"],
    authorityType: "Agency guidance",
    developmentType: "Agency guidance",
    verificationStatus: "official_verified",
    officialSourceFound: true,
    officialSourceUrl: "https://example.eu/official",
    sourceReferences: [],
    corroboratingSources: [],
    exactDateOfInformation: "2026-06-01",
    datePrecision: "exact",
    citationQuality: "complete",
    publicVisibilityStatus: "public",
    reviewerNotes: "",
    relatedMonitorItemId: "upd-1",
    ...overrides,
  };
}

describe("EU news classification", () => {
  it("detects hard-law signals from official EU regulation items", () => {
    const classification = classifyEuNewsItem(
      createItem({
        title: "Regulation (EU) 2026/9999 published in the Official Journal",
        shortSummary: "A new EU regulation was published in the Official Journal.",
        authorityType: "Regulation",
        developmentType: "Regulation",
      }),
    );

    expect(classification.developmentType).toBe("EU regulation");
    expect(classification.hardLaw).toBe(true);
    expect(classification.importanceRank).toBeGreaterThan(60);
  });

  it("keeps legal-press discoveries out of hard-law classification by default", () => {
    const classification = classifyEuNewsItem(
      createItem({
        sourceName: "Reuters Legal / Technology / Regulation",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        title: "Reuters reports possible AI Act implementation move",
        shortSummary: "Reported by Reuters; official source still pending.",
        officialSourceFound: false,
      }),
    );

    expect(classification.hardLaw).toBe(false);
    expect(classification.developmentType).toBe("legal press report");
  });
});
