import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSpainAgentSourceIds,
  getSpainSchedulerGuidance,
  isSpainMonitoringSource,
} from "@/agents/ai-regulation/spainNewsSources";
import {
  getAdminSpainLegalNewsOverview,
  getSpainLiveLegalIntelligenceData,
  isSpainNewsItem,
} from "@/agents/ai-regulation/spainLegalNewsAgent";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { NewsItemRecord, SourceHealthCheck } from "@/agents/ai-regulation/governance";

afterEach(() => {
  vi.restoreAllMocks();
});

async function withSpainNewsItems<T>(run: () => Promise<T>) {
  const mockNewsItems: NewsItemRecord[] = [
    {
      id: "news-es-1",
      regulatoryUpdateId: null,
      rawItemId: "raw-es-1",
      title: "AEPD agentic AI guidance",
      slug: "aepd-agentic-ai-guidance",
      shortSummary: "AEPD published official agentic AI guidance.",
      fullSummary: "",
      publicationDate: "2026-02-18",
      eventDate: null,
      detectedAt: "2026-02-18T10:00:00.000Z",
      lastVerifiedAt: "2026-02-18T10:05:00.000Z",
      sourceName: "AEPD",
      sourceUrl:
        "https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-agencia-publica-unas-orientaciones-sobre-inteligencia",
      sourceType: "official_source",
      sourceReliability: "high",
      sourceJurisdiction: "Spain",
      region: "Europe",
      jurisdiction: "Spain",
      countryOrState: "Spain",
      legalArea: "Data protection",
      topicTags: ["Spain", "AEPD", "AI"],
      authorityType: "agency_guidance",
      developmentType: "agency_guidance",
      verificationStatus: "official_verified",
      officialSourceFound: true,
      officialSourceUrl:
        "https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-agencia-publica-unas-orientaciones-sobre-inteligencia",
      sourceReferences: [],
      corroboratingSources: [],
      exactDateOfInformation: "2026-02-18",
      datePrecision: "day",
      citationQuality: "partial",
      publicVisibilityStatus: "public",
      reviewerNotes: "",
      relatedMonitorItemId: null,
      createdAt: "2026-02-18T10:00:00.000Z",
      updatedAt: "2026-02-18T10:05:00.000Z",
    },
    {
      id: "news-es-2",
      regulatoryUpdateId: null,
      rawItemId: "raw-es-2",
      title: "Spanish AI discovery lead",
      slug: "spanish-ai-discovery-lead",
      shortSummary: "A Spain AI development still awaiting stronger official confirmation.",
      fullSummary: "",
      publicationDate: "2026-04-08",
      eventDate: null,
      detectedAt: "2026-04-08T10:00:00.000Z",
      lastVerifiedAt: "2026-04-08T10:05:00.000Z",
      sourceName: "Tracker",
      sourceUrl: "https://example.com/spain-tracker",
      sourceType: "tracker_source",
      sourceReliability: "medium",
      sourceJurisdiction: "Spain",
      region: "Europe",
      jurisdiction: "Spain",
      countryOrState: "Spain",
      legalArea: "AI governance",
      topicTags: ["Spain"],
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
      id: "health-es-1",
      sourceId: "src-es-aepd-ai",
      checkedAt: "2026-04-07T10:05:00.000Z",
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
      createdAt: "2026-04-07T10:05:00.000Z",
    },
  ] satisfies SourceHealthCheck[]);

  return run();
}

describe("Spain legal news agent", () => {
  it("keeps a dedicated Spain source cluster for live and baseline monitoring", () => {
    expect(getSpainAgentSourceIds("spain_live_news_scan")).toEqual(
      expect.arrayContaining([
        "src-es-aepd-ai",
        "src-es-newsapi-ai",
        "src-es-major-press-newsapi-ai",
        "src-es-gdelt-ai",
      ]),
    );
    expect(getSpainAgentSourceIds("spain_official_legal_scan")).toEqual(
      expect.arrayContaining([
        "src-es-aepd-ai",
        "src-es-aesia-ai",
        "src-es-boe-ai",
        "src-es-moncloa-ai",
      ]),
    );
  });

  it("identifies Spain monitoring sources conservatively", () => {
    expect(
      isSpainMonitoringSource({
        id: "src-es-aepd-ai",
        country: "Spain",
        jurisdiction: "Spain",
      }),
    ).toBe(true);
    expect(
      isSpainMonitoringSource({
        id: "src-eu-commission-ai",
        country: "European Union",
        jurisdiction: "European Union",
      }),
    ).toBe(false);
  });

  it("keeps Spain live-item detection limited to Spain items", () => {
    expect(
      isSpainNewsItem({
        countryOrState: "Spain",
        jurisdiction: "Spain",
        region: "Europe",
      }),
    ).toBe(true);
    expect(
      isSpainNewsItem({
        countryOrState: "Italy",
        jurisdiction: "Italy",
        region: "Europe",
      }),
    ).toBe(false);
  });

  it("documents that five-minute Spain monitoring is architecture-ready but not guaranteed", () => {
    const guidance = getSpainSchedulerGuidance();

    expect(guidance.liveTarget).toContain("every 5 minutes");
    expect(guidance.notes[0]).toContain("AEPD");
    expect(
      guidance.notes.some((note) => note.includes("not be described as guaranteed real time")),
    ).toBe(true);
  });

  it("exposes structured Spain live-summary metrics", async () => {
    await withSpainNewsItems(async () => {
      const result = await getSpainLiveLegalIntelligenceData(6);

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

  it("ranks major media domains above secondary discovery sources in Spain admin review", async () => {
    const adminNewsItems: NewsItemRecord[] = [
      {
        id: "news-es-reuters",
        regulatoryUpdateId: null,
        rawItemId: "raw-es-reuters",
        title: "Reuters Spain AI legal update",
        slug: "reuters-spain-ai-legal-update",
        shortSummary: "Reuters reported on a Spanish AI legal development.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Reuters",
        sourceUrl: "https://www.reuters.com/world/europe/spain-ai-regulation-update-2026-04-08/",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "Spain",
        region: "Europe",
        jurisdiction: "Spain",
        countryOrState: "Spain",
        legalArea: "AI governance",
        topicTags: ["Spain", "AI"],
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
        id: "news-es-secondary",
        regulatoryUpdateId: null,
        rawItemId: "raw-es-secondary",
        title: "Secondary Spain AI legal update",
        slug: "secondary-spain-ai-legal-update",
        shortSummary: "A secondary source reported on a Spanish AI legal development.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Example Source",
        sourceUrl: "https://example.org/spain-ai-regulation-update",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "Spain",
        region: "Europe",
        jurisdiction: "Spain",
        countryOrState: "Spain",
        legalArea: "AI governance",
        topicTags: ["Spain", "AI"],
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

    const result = await getAdminSpainLegalNewsOverview(10);

    expect(result.items[0]?.item.sourceName).toBe("Reuters");
    expect(result.items[0]?.mediaDomain.label).toBe("Reuters");
  });
});
