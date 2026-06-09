import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAdminItalyLegalNewsOverview,
  getItalyLiveLegalIntelligenceData,
  isItalyNewsItem,
} from "@/agents/ai-regulation/italyLegalNewsAgent";
import {
  getItalyAgentSourceIds,
  getItalySchedulerGuidance,
  isItalyMonitoringSource,
} from "@/agents/ai-regulation/italyNewsSources";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { NewsItemRecord, SourceHealthCheck } from "@/agents/ai-regulation/governance";

afterEach(() => {
  vi.restoreAllMocks();
});

async function withItalyNewsItems<T>(run: () => Promise<T>) {
  const mockNewsItems: NewsItemRecord[] = [
    {
      id: "news-it-1",
      regulatoryUpdateId: null,
      rawItemId: "raw-it-1",
      title: "Garante AI warning",
      slug: "garante-ai-warning",
      shortSummary: "The Garante issued an official AI-related warning.",
      fullSummary: "",
      publicationDate: "2026-05-28",
      eventDate: null,
      detectedAt: "2026-05-28T10:00:00.000Z",
      lastVerifiedAt: "2026-05-28T10:05:00.000Z",
      sourceName: "Garante",
      sourceUrl: "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10255522",
      sourceType: "official_source",
      sourceReliability: "high",
      sourceJurisdiction: "Italy",
      region: "Europe",
      jurisdiction: "Italy",
      countryOrState: "Italy",
      legalArea: "Data protection",
      topicTags: ["Italy", "Garante", "AI"],
      authorityType: "enforcement_action",
      developmentType: "enforcement_action",
      verificationStatus: "official_verified",
      officialSourceFound: true,
      officialSourceUrl:
        "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10255522",
      sourceReferences: [],
      corroboratingSources: [],
      exactDateOfInformation: "2026-05-28",
      datePrecision: "day",
      citationQuality: "partial",
      publicVisibilityStatus: "public",
      reviewerNotes: "",
      relatedMonitorItemId: null,
      createdAt: "2026-05-28T10:00:00.000Z",
      updatedAt: "2026-05-28T10:05:00.000Z",
    },
    {
      id: "news-it-2",
      regulatoryUpdateId: null,
      rawItemId: "raw-it-2",
      title: "Italian AI discovery lead",
      slug: "italian-ai-discovery-lead",
      shortSummary: "An Italy AI development still awaiting stronger official confirmation.",
      fullSummary: "",
      publicationDate: "2026-06-02",
      eventDate: null,
      detectedAt: "2026-06-02T10:00:00.000Z",
      lastVerifiedAt: "2026-06-02T10:05:00.000Z",
      sourceName: "Tracker",
      sourceUrl: "https://example.com/italy-tracker",
      sourceType: "tracker_source",
      sourceReliability: "medium",
      sourceJurisdiction: "Italy",
      region: "Europe",
      jurisdiction: "Italy",
      countryOrState: "Italy",
      legalArea: "AI governance",
      topicTags: ["Italy"],
      authorityType: "other",
      developmentType: "legal_press_report",
      verificationStatus: "needs_official_source",
      officialSourceFound: false,
      officialSourceUrl: null,
      sourceReferences: [],
      corroboratingSources: [],
      exactDateOfInformation: "2026-06-02",
      datePrecision: "day",
      citationQuality: "partial",
      publicVisibilityStatus: "admin_only",
      reviewerNotes: "",
      relatedMonitorItemId: null,
      createdAt: "2026-06-02T10:00:00.000Z",
      updatedAt: "2026-06-02T10:05:00.000Z",
    },
  ];

  vi.spyOn(updateRepository, "getPublicNewsItems").mockResolvedValue(
    mockNewsItems.filter((item) => item.publicVisibilityStatus === "public"),
  );
  vi.spyOn(updateRepository, "getSourceHealthChecks").mockResolvedValue([
    {
      id: "health-it-1",
      sourceId: "src-it-garante-ai",
      checkedAt: "2026-05-28T10:05:00.000Z",
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
      createdAt: "2026-05-28T10:05:00.000Z",
    },
  ] satisfies SourceHealthCheck[]);

  return run();
}

describe("Italy legal news agent", () => {
  it("keeps a dedicated Italy source cluster for live and baseline monitoring", () => {
    expect(getItalyAgentSourceIds("italy_live_news_scan")).toEqual(
      expect.arrayContaining([
        "src-it-garante-ai",
        "src-it-newsapi-ai",
        "src-it-major-press-newsapi-ai",
        "src-it-gdelt-ai",
      ]),
    );
    expect(getItalyAgentSourceIds("italy_official_legal_scan")).toEqual(
      expect.arrayContaining([
        "src-it-garante-ai",
        "src-it-agid-ai",
        "src-it-normattiva-ai",
        "src-it-dtd-ai",
      ]),
    );
  });

  it("identifies Italy monitoring sources conservatively", () => {
    expect(
      isItalyMonitoringSource({
        id: "src-it-garante-ai",
        country: "Italy",
        jurisdiction: "Italy",
      }),
    ).toBe(true);
    expect(
      isItalyMonitoringSource({
        id: "src-eu-commission-ai",
        country: "European Union",
        jurisdiction: "European Union",
      }),
    ).toBe(false);
  });

  it("keeps Italy live-item detection limited to Italy items", () => {
    expect(
      isItalyNewsItem({
        countryOrState: "Italy",
        jurisdiction: "Italy",
        region: "Europe",
      }),
    ).toBe(true);
    expect(
      isItalyNewsItem({
        countryOrState: "Spain",
        jurisdiction: "Spain",
        region: "Europe",
      }),
    ).toBe(false);
  });

  it("documents that five-minute Italy monitoring is architecture-ready but not guaranteed", () => {
    const guidance = getItalySchedulerGuidance();

    expect(guidance.liveTarget).toContain("every 5 minutes");
    expect(guidance.notes[0]).toContain("Garante");
    expect(
      guidance.notes.some((note) => note.includes("not be described as guaranteed real time")),
    ).toBe(true);
  });

  it("exposes structured Italy live-summary metrics", async () => {
    await withItalyNewsItems(async () => {
      const result = await getItalyLiveLegalIntelligenceData(6);

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

  it("ranks major media domains above secondary discovery sources in Italy admin review", async () => {
    const adminNewsItems: NewsItemRecord[] = [
      {
        id: "news-it-reuters",
        regulatoryUpdateId: null,
        rawItemId: "raw-it-reuters",
        title: "Reuters Italy AI legal update",
        slug: "reuters-italy-ai-legal-update",
        shortSummary: "Reuters reported on an Italian AI legal development.",
        fullSummary: "",
        publicationDate: "2026-06-02",
        eventDate: null,
        detectedAt: "2026-06-02T10:00:00.000Z",
        lastVerifiedAt: "2026-06-02T10:05:00.000Z",
        sourceName: "Reuters",
        sourceUrl: "https://www.reuters.com/world/europe/italy-ai-regulation-update-2026-06-02/",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "Italy",
        region: "Europe",
        jurisdiction: "Italy",
        countryOrState: "Italy",
        legalArea: "AI governance",
        topicTags: ["Italy", "AI"],
        authorityType: "other",
        developmentType: "legal_press_report",
        verificationStatus: "needs_official_source",
        officialSourceFound: false,
        officialSourceUrl: null,
        sourceReferences: [],
        corroboratingSources: [],
        exactDateOfInformation: "2026-06-02",
        datePrecision: "day",
        citationQuality: "partial",
        publicVisibilityStatus: "admin_only",
        reviewerNotes: "",
        relatedMonitorItemId: null,
        createdAt: "2026-06-02T10:00:00.000Z",
        updatedAt: "2026-06-02T10:05:00.000Z",
      },
      {
        id: "news-it-secondary",
        regulatoryUpdateId: null,
        rawItemId: "raw-it-secondary",
        title: "Secondary Italy AI legal update",
        slug: "secondary-italy-ai-legal-update",
        shortSummary: "A secondary source reported on an Italian AI legal development.",
        fullSummary: "",
        publicationDate: "2026-06-02",
        eventDate: null,
        detectedAt: "2026-06-02T10:00:00.000Z",
        lastVerifiedAt: "2026-06-02T10:05:00.000Z",
        sourceName: "Example Source",
        sourceUrl: "https://example.org/italy-ai-regulation-update",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "Italy",
        region: "Europe",
        jurisdiction: "Italy",
        countryOrState: "Italy",
        legalArea: "AI governance",
        topicTags: ["Italy", "AI"],
        authorityType: "other",
        developmentType: "legal_press_report",
        verificationStatus: "needs_official_source",
        officialSourceFound: false,
        officialSourceUrl: null,
        sourceReferences: [],
        corroboratingSources: [],
        exactDateOfInformation: "2026-06-02",
        datePrecision: "day",
        citationQuality: "partial",
        publicVisibilityStatus: "admin_only",
        reviewerNotes: "",
        relatedMonitorItemId: null,
        createdAt: "2026-06-02T10:00:00.000Z",
        updatedAt: "2026-06-02T10:05:00.000Z",
      },
    ];

    vi.spyOn(updateRepository, "getNewsItems").mockResolvedValue(adminNewsItems);
    vi.spyOn(updateRepository, "getSourceHealthChecks").mockResolvedValue([]);

    const result = await getAdminItalyLegalNewsOverview(10);

    expect(result.items[0]?.item.sourceName).toBe("Reuters");
    expect(result.items[0]?.mediaDomain.label).toBe("Reuters");
  });
});
