import { describe, expect, it } from "vitest";

import { decideEuNewsDatabaseConversion } from "@/agents/ai-regulation/euNewsToDatabase";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";

function createItem(overrides: Partial<AiLawNewsItem> = {}): AiLawNewsItem {
  return {
    id: "news-1",
    title: "Official EU AI Act implementing act update",
    slug: "implementing-act",
    shortSummary: "Official implementing act update.",
    fullSummary: "Official implementing act update.",
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
    authorityType: "Regulation",
    developmentType: "implementing act",
    verificationStatus: "official_verified",
    officialSourceFound: true,
    officialSourceUrl: "https://example.eu/official",
    sourceReferences: [],
    corroboratingSources: [],
    exactDateOfInformation: "2026-06-01",
    datePrecision: "exact",
    citationQuality: "partial",
    publicVisibilityStatus: "public",
    reviewerNotes: "",
    relatedMonitorItemId: null,
    ...overrides,
  };
}

describe("EU news to database conversion", () => {
  it("marks verified official hard-law developments as eligible for needs_review insertion", () => {
    const decision = decideEuNewsDatabaseConversion(createItem());

    expect(decision.conversionStatus).toBe("eligible_needs_review");
    expect(decision.shouldCreateOrLinkDatabaseItem).toBe(true);
    expect(decision.targetReviewStatus).toBe("needs_review");
  });

  it("blocks non-official discoveries from legal-database conversion without official source", () => {
    const decision = decideEuNewsDatabaseConversion(
      createItem({
        sourceType: "informal_discovery_source",
        sourceReliability: "informal_discovery",
        officialSourceFound: false,
        officialSourceUrl: null,
        verificationStatus: "discovery_only",
      }),
    );

    expect(decision.shouldCreateOrLinkDatabaseItem).toBe(false);
    expect(decision.conversionStatus).toBe("needs_official_source");
  });
});
