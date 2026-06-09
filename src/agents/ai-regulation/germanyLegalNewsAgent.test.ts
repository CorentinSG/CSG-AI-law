import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAdminGermanyLegalNewsOverview,
  getGermanyLiveLegalIntelligenceData,
  isGermanyNewsItem,
} from "@/agents/ai-regulation/germanyLegalNewsAgent";
import {
  getGermanyAgentSourceIds,
  getGermanySchedulerGuidance,
  isGermanyMonitoringSource,
} from "@/agents/ai-regulation/germanyNewsSources";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { NewsItemRecord, SourceHealthCheck } from "@/agents/ai-regulation/governance";

afterEach(() => {
  vi.restoreAllMocks();
});

async function withGermanyNewsItems<T>(run: () => Promise<T>) {
  const mockNewsItems: NewsItemRecord[] = [
    {
      id: "news-de-1",
      regulatoryUpdateId: null,
      rawItemId: "raw-de-1",
      title: "Germany AI Act implementation bill advanced",
      slug: "germany-ai-act-implementation-bill-advanced",
      shortSummary: "Bundestag materials highlighted the German AI Act implementation bill.",
      fullSummary: "",
      publicationDate: "2026-03-11",
      eventDate: null,
      detectedAt: "2026-03-11T10:00:00.000Z",
      lastVerifiedAt: "2026-03-11T10:05:00.000Z",
      sourceName: "Bundestag",
      sourceUrl: "https://www.bundestag.de/presse/hib/kurzmeldungen-1155112",
      sourceType: "official_source",
      sourceReliability: "high",
      sourceJurisdiction: "Germany",
      region: "Europe",
      jurisdiction: "Germany",
      countryOrState: "Germany",
      legalArea: "AI governance",
      topicTags: ["Germany", "Bundestag", "AI Act"],
      authorityType: "proposed_law",
      developmentType: "proposed_law",
      verificationStatus: "official_verified",
      officialSourceFound: true,
      officialSourceUrl: "https://www.bundestag.de/presse/hib/kurzmeldungen-1155112",
      sourceReferences: [],
      corroboratingSources: [],
      exactDateOfInformation: "2026-03-11",
      datePrecision: "day",
      citationQuality: "partial",
      publicVisibilityStatus: "public",
      reviewerNotes: "",
      relatedMonitorItemId: null,
      createdAt: "2026-03-11T10:00:00.000Z",
      updatedAt: "2026-03-11T10:05:00.000Z",
    },
    {
      id: "news-de-2",
      regulatoryUpdateId: null,
      rawItemId: "raw-de-2",
      title: "German AI discovery lead",
      slug: "german-ai-discovery-lead",
      shortSummary: "A Germany AI development still awaiting stronger official confirmation.",
      fullSummary: "",
      publicationDate: "2026-04-08",
      eventDate: null,
      detectedAt: "2026-04-08T10:00:00.000Z",
      lastVerifiedAt: "2026-04-08T10:05:00.000Z",
      sourceName: "Tracker",
      sourceUrl: "https://example.com/germany-tracker",
      sourceType: "tracker_source",
      sourceReliability: "medium",
      sourceJurisdiction: "Germany",
      region: "Europe",
      jurisdiction: "Germany",
      countryOrState: "Germany",
      legalArea: "AI governance",
      topicTags: ["Germany"],
      authorityType: "other",
      developmentType: "legal_press_report",
      verificationStatus: "needs_official_source",
      officialSourceFound: false,
      officialSourceUrl: null,
      sourceReferences: [],
      corroboratingSources: [],
      exactDateOfInformation: "2026-04-08",
      datePrecision: "day",
      citationQuality: "partial",
      publicVisibilityStatus: "admin_only",
      reviewerNotes: "",
      relatedMonitorItemId: null,
      createdAt: "2026-04-08T10:00:00.000Z",
      updatedAt: "2026-04-08T10:05:00.000Z",
    },
  ];

  vi.spyOn(updateRepository, "getPublicNewsItems").mockResolvedValue(
    mockNewsItems.filter((item) => item.publicVisibilityStatus === "public"),
  );
  vi.spyOn(updateRepository, "getSourceHealthChecks").mockResolvedValue([
    {
      id: "health-de-1",
      sourceId: "src-de-bfdi-ai",
      checkedAt: "2026-03-11T10:05:00.000Z",
      responseStatus: 200,
      runtimeAccessible: true,
      parserStatus: "healthy",
      activeRecommendation: "active",
      itemsFetched: 1,
      newItemsDetected: 0,
      duplicatesDetected: 1,
      parserWarnings: [],
      accessibilityIssue: null,
      reliabilityNotes: "test",
      createdAt: "2026-03-11T10:05:00.000Z",
    },
  ] satisfies SourceHealthCheck[]);

  return run();
}

describe("Germany legal news agent", () => {
  it("keeps a dedicated Germany source cluster for live and baseline monitoring", () => {
    expect(getGermanyAgentSourceIds("germany_live_news_scan")).toEqual(
      expect.arrayContaining([
        "src-de-bfdi-ai",
        "src-de-bfdi-consultation-ai",
        "src-de-newsapi-ai",
        "src-de-major-press-newsapi-ai",
        "src-de-gdelt-ai",
      ]),
    );
    expect(getGermanyAgentSourceIds("germany_official_legal_scan")).toEqual(
      expect.arrayContaining([
        "src-de-bfdi-ai",
        "src-de-bfdi-consultation-ai",
        "src-de-bundesregierung-ai",
        "src-de-bundestag-ai",
      ]),
    );
  });

  it("identifies Germany monitoring sources conservatively", () => {
    expect(
      isGermanyMonitoringSource({
        id: "src-de-bfdi-ai",
        country: "Germany",
        jurisdiction: "Germany",
      }),
    ).toBe(true);
    expect(
      isGermanyMonitoringSource({
        id: "src-eu-commission-ai",
        country: "European Union",
        jurisdiction: "European Union",
      }),
    ).toBe(false);
  });

  it("keeps Germany live-item detection limited to Germany items", () => {
    expect(
      isGermanyNewsItem({
        countryOrState: "Germany",
        jurisdiction: "Germany",
        region: "Europe",
      }),
    ).toBe(true);
    expect(
      isGermanyNewsItem({
        countryOrState: "Italy",
        jurisdiction: "Italy",
        region: "Europe",
      }),
    ).toBe(false);
  });

  it("documents that five-minute Germany monitoring is architecture-ready but not guaranteed", () => {
    const guidance = getGermanySchedulerGuidance();

    expect(guidance.liveTarget).toContain("every 5 minutes");
    expect(guidance.notes[0]).toContain("BfDI");
    expect(
      guidance.notes.some((note) => note.includes("not be described as guaranteed real time")),
    ).toBe(true);
  });

  it("exposes structured Germany live-summary metrics", async () => {
    await withGermanyNewsItems(async () => {
      const result = await getGermanyLiveLegalIntelligenceData(6);

      expect(result.summary.total).toBe(1);
      expect(result.summary.officialLike).toBe(1);
      expect(result.summary.hardLawSignals).toBeGreaterThanOrEqual(0);
      expect(
        result.summary.breakingSignals +
          result.summary.currentSignals +
          result.summary.watchSignals +
          result.summary.staleSignals,
      ).toBe(result.summary.total);
      expect(result.items[0]?.currentness.currentnessScore).toBeGreaterThan(0);
      expect(result.activity[0]?.currentness.freshnessStatus).toBeDefined();
    });
  });

  it("ranks major media domains above secondary discovery sources in Germany admin review", async () => {
    const adminNewsItems: NewsItemRecord[] = [
      {
        id: "news-de-reuters",
        regulatoryUpdateId: null,
        rawItemId: "raw-de-reuters",
        title: "Reuters Germany AI legal update",
        slug: "reuters-germany-ai-legal-update",
        shortSummary: "Reuters reported on a German AI legal development.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Reuters",
        sourceUrl: "https://www.reuters.com/world/europe/germany-ai-regulation-update-2026-04-08/",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "Germany",
        region: "Europe",
        jurisdiction: "Germany",
        countryOrState: "Germany",
        legalArea: "AI governance",
        topicTags: ["Germany", "AI"],
        authorityType: "other",
        developmentType: "legal_press_report",
        verificationStatus: "needs_official_source",
        officialSourceFound: false,
        officialSourceUrl: null,
        sourceReferences: [],
        corroboratingSources: [],
        exactDateOfInformation: "2026-04-08",
        datePrecision: "day",
        citationQuality: "partial",
        publicVisibilityStatus: "admin_only",
        reviewerNotes: "",
        relatedMonitorItemId: null,
        createdAt: "2026-04-08T10:00:00.000Z",
        updatedAt: "2026-04-08T10:05:00.000Z",
      },
      {
        id: "news-de-secondary",
        regulatoryUpdateId: null,
        rawItemId: "raw-de-secondary",
        title: "Secondary Germany AI legal update",
        slug: "secondary-germany-ai-legal-update",
        shortSummary: "A secondary source reported on a German AI legal development.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Example Source",
        sourceUrl: "https://example.org/germany-ai-regulation-update",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "Germany",
        region: "Europe",
        jurisdiction: "Germany",
        countryOrState: "Germany",
        legalArea: "AI governance",
        topicTags: ["Germany", "AI"],
        authorityType: "other",
        developmentType: "legal_press_report",
        verificationStatus: "needs_official_source",
        officialSourceFound: false,
        officialSourceUrl: null,
        sourceReferences: [],
        corroboratingSources: [],
        exactDateOfInformation: "2026-04-08",
        datePrecision: "day",
        citationQuality: "partial",
        publicVisibilityStatus: "admin_only",
        reviewerNotes: "",
        relatedMonitorItemId: null,
        createdAt: "2026-04-08T10:00:00.000Z",
        updatedAt: "2026-04-08T10:05:00.000Z",
      },
    ];

    vi.spyOn(updateRepository, "getNewsItems").mockResolvedValue(adminNewsItems);
    vi.spyOn(updateRepository, "getSourceHealthChecks").mockResolvedValue([]);

    const result = await getAdminGermanyLegalNewsOverview(10);

    expect(result.items[0]?.item.sourceName).toBe("Reuters");
    expect(result.items[0]?.mediaDomain.label).toBe("Reuters");
  });
});
