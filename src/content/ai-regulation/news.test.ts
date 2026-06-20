import { describe, expect, it } from "vitest";

import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import {
  buildNewsItemFromUpdate,
  filterNewsItems,
  getNewsVerificationLabel,
} from "@/content/ai-regulation/news";
import {
  aiLawNewsSourceConfigs,
  aiLawNewsSourceTypes,
} from "@/content/ai-regulation/news-sources";

function update(overrides: Partial<AiRegulatoryUpdate> = {}): AiRegulatoryUpdate {
  return {
    id: "upd-1",
    sourceId: "src-official",
    rawItemId: "raw-1",
    title: "Official AI development",
    sourceName: "Federal Register",
    sourceUrl: "https://www.federalregister.gov/documents/example",
    jurisdiction: "United States federal",
    region: "North America",
    country: "United States",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    publicationDate: "2026-05-01",
    detectedDate: "2026-05-02T00:00:00.000Z",
    oneSentenceSummary: "An official AI development was detected.",
    summary: "Official-source summary for a public news item.",
    whatHappened: "Official source was published.",
    whyItMatters: "It may matter for AI governance.",
    practicalImpact: "Requires legal review.",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "Needs review.",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    tags: ["AI governance"],
    status: "published",
    reviewedBy: "Admin Reviewer",
    reviewedAt: "2026-05-03T00:00:00.000Z",
    publishedAt: "2026-05-03T00:00:00.000Z",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
    ...overrides,
  };
}

function officialSource(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-official",
    name: "Federal Register",
    jurisdiction: "United States federal",
    region: "North America",
    country: "United States",
    sourceUrl: "https://www.federalregister.gov/",
    sourceType: "API",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: "2026-05-03T00:00:00.000Z",
    notes: "Official source.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "api",
    config: {},
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function rawItem(overrides: Partial<RawRegulatoryItem> = {}): RawRegulatoryItem {
  return {
    id: "raw-1",
    sourceId: "src-official",
    rawTitle: "Official AI development",
    rawUrl: "https://www.federalregister.gov/documents/example",
    rawText: "Official metadata only.",
    rawMetadata: {
      sourceReferences: [
        {
          sourceRole: "primary",
          title: "Official AI development",
          institution: "Federal Register",
          url: "https://www.federalregister.gov/documents/example",
          canonicalUrl: "https://www.federalregister.gov/documents/example",
          sourceType: "official",
          authorityType: "Agency guidance",
          publicationDate: "2026-05-01",
          detectedAt: "2026-05-02T00:00:00.000Z",
          retrievedAt: "2026-05-02T00:00:00.000Z",
          lastVerifiedAt: "2026-05-02T00:00:00.000Z",
          jurisdiction: "United States federal",
          documentType: "Guidance",
          excerpt: null,
          pinpoint: null,
          reliabilityLevel: "high",
          verificationStatus: "verified",
          archivedUrl: null,
          accessLimitations: null,
          notes: "Official source metadata.",
        },
      ],
    },
    detectedAt: "2026-05-02T00:00:00.000Z",
    hash: "hash",
    duplicateOf: null,
    processingStatus: "processed",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("AI Law News", () => {
  it("defines the expected news source type hierarchy", () => {
    expect(aiLawNewsSourceTypes).toContain("official_source");
    expect(aiLawNewsSourceTypes).toContain("legal_regulatory_press");
    expect(aiLawNewsSourceTypes).toContain("tracker_database");
    expect(aiLawNewsSourceTypes).toContain("informal_discovery_source");
  });

  it("maps official published monitor items to public official news", () => {
    const item = buildNewsItemFromUpdate({
      update: update({ status: "needs_review", reviewedBy: null, reviewedAt: null, publishedAt: null }),
      rawItem: rawItem(),
      source: officialSource(),
    });

    expect(item.publicVisibilityStatus).toBe("public");
    expect(item.sourceType).toBe("official_source");
    expect(item.officialSourceFound).toBe(true);
    expect(item.publicationDate).toBe("2026-05-01");
    expect(item.exactDateOfInformation).toBe("2026-05-01");
    expect(getNewsVerificationLabel(item)).toBe("Official source");
    expect(item).not.toHaveProperty("traceability");
    expect(JSON.stringify(item)).not.toContain("responseStatus");
    expect(JSON.stringify(item)).not.toContain("contentHash");
  });

  it("publishes legal news from serious sources without admin approval", () => {
    const item = buildNewsItemFromUpdate({
      update: update({ status: "needs_review", reviewedBy: null, reviewedAt: null, publishedAt: null }),
      rawItem: rawItem(),
      source: officialSource({
        name: "IAPP",
        sourceUrl: "https://iapp.org/news/",
      }),
    });

    expect(item.publicVisibilityStatus).toBe("public");
    expect(item.reviewerNotes).toContain("Automatically public");
  });

  it("flags missing publication dates as requiring verification", () => {
    const item = buildNewsItemFromUpdate({
      update: update({ publicationDate: null }),
      rawItem: rawItem(),
      source: officialSource(),
    });

    expect(item.publicationDate).toBeNull();
    expect(item.datePrecision).toBe("requires_verification");
  });

  it("does not treat non-official discovery sources as legal authority", () => {
    const item = buildNewsItemFromUpdate({
      update: update({
        sourceId: "src-ai-weekly-news-today",
        sourceName: "AI Weekly / AI News Today",
        sourceUrl: "https://aiweekly.co/ai-news-today",
      }),
      rawItem: rawItem({ rawMetadata: {} }),
      source: officialSource({
        id: "src-ai-weekly-news-today",
        name: "AI Weekly / AI News Today",
        sourceUrl: "https://aiweekly.co/ai-news-today",
        config: { sourceCategory: "discovery_source" },
        reliabilityLevel: "low",
      }),
    });

    expect(item.sourceType).toBe("informal_discovery_source");
    expect(item.sourceReliability).toBe("informal_discovery");
    expect(item.verificationStatus).toBe("discovery_only");
    expect(item.publicVisibilityStatus).toBe("public");
    expect(getNewsVerificationLabel(item)).toBe("Discovery lead - requires verification");
  });

  it("exposes cross-source corroboration fields", () => {
    const baseReferences = rawItem().rawMetadata.sourceReferences;
    const primaryReference = Array.isArray(baseReferences) ? baseReferences[0] : null;
    const item = buildNewsItemFromUpdate({
      update: update({ status: "needs_review", reviewedBy: null, reviewedAt: null, publishedAt: null }),
      rawItem: rawItem({
        rawMetadata: {
          sourceReferences: [
            primaryReference,
            {
              sourceRole: "supporting",
              title: "Supporting official page",
              institution: "Official Institution",
              url: "https://example.gov/supporting",
              sourceType: "official",
              authorityType: "Supporting source",
              publicationDate: "2026-05-01",
              retrievedAt: "2026-05-02T00:00:00.000Z",
              lastVerifiedAt: "2026-05-02T00:00:00.000Z",
              reliabilityLevel: "high",
              verificationStatus: "verified",
            },
          ].filter(Boolean),
        },
      }),
      source: officialSource(),
    });

    expect(item.corroboratingSources).toHaveLength(1);
    expect(item.publicVisibilityStatus).toBe("public");
    expect(item.verificationStatus).toBe("corroborated");
  });

  it("keeps paywalled media sources manual or metadata-only", () => {
    const paywalled = aiLawNewsSourceConfigs.filter(
      (source) => source.paywallStatus === "paywalled",
    );

    expect(paywalled.every((source) => source.manualOnly)).toBe(true);
    expect(paywalled.every((source) => !source.scrapingAllowed)).toBe(true);
  });

  it("includes dedicated official France news-source configs", () => {
    expect(aiLawNewsSourceConfigs.map((source) => source.id)).toEqual(
      expect.arrayContaining([
        "news-official-eu-commission-rss",
        "news-official-edpb-rss",
        "news-official-curia-rss",
        "news-official-eurlex-proposals-rss",
        "news-official-eurlex-legislation-rss",
        "news-official-france-cnil",
        "news-official-france-legifrance",
        "news-official-france-judilibre",
        "news-official-france-conseil-etat",
        "news-official-france-cour-cassation",
        "news-official-france-defenseur-droits",
        "news-europe-newsapi-discovery",
        "news-europe-major-press-newsapi",
        "news-europe-gdelt-discovery",
        "news-france-newsapi-discovery",
        "news-france-major-press-newsapi",
        "news-france-gdelt-discovery",
      ]),
    );
  });

  it("filters news items by source type and topic", () => {
    const item = buildNewsItemFromUpdate({
      update: update(),
      rawItem: rawItem(),
      source: officialSource(),
    });

    expect(filterNewsItems([item], { sourceType: "official_source" })).toHaveLength(1);
    expect(filterNewsItems([item], { topic: "AI governance" })).toHaveLength(1);
    expect(filterNewsItems([item], { topic: "Copyright" })).toHaveLength(0);
  });
});
