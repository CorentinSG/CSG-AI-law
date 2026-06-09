import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getFranceAgentSourceIds,
  getFranceSchedulerGuidance,
  isFranceMonitoringSource,
} from "@/agents/ai-regulation/franceNewsSources";
import {
  getAdminFranceLegalNewsOverview,
  getFranceLiveLegalIntelligenceData,
  isFranceNewsItem,
} from "@/agents/ai-regulation/franceLegalNewsAgent";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { NewsItemRecord, SourceHealthCheck } from "@/agents/ai-regulation/governance";

afterEach(() => {
  vi.restoreAllMocks();
});

async function withNewsItems<T>(run: () => Promise<T>) {
  const mockNewsItems: NewsItemRecord[] = [
      {
        id: "news-fr-1",
        regulatoryUpdateId: null,
        rawItemId: "raw-fr-1",
        title: "CNIL programme 2026",
        slug: "cnil-programme-2026",
        shortSummary: "CNIL flagged incoming AI Act market-surveillance preparation.",
        fullSummary: "",
        publicationDate: "2026-04-07",
        eventDate: null,
        detectedAt: "2026-04-07T10:00:00.000Z",
        lastVerifiedAt: "2026-04-07T10:05:00.000Z",
        sourceName: "CNIL",
        sourceUrl:
          "https://www.cnil.fr/fr/accompagnement-des-professionnels-le-programme-de-travail-de-la-cnil-pour-2026",
        sourceType: "official_source",
        sourceReliability: "high",
        sourceJurisdiction: "France",
        region: "Europe",
        jurisdiction: "France",
        countryOrState: "France",
        legalArea: "AI governance",
        topicTags: ["France", "CNIL", "AI Act"],
        authorityType: "agency_guidance",
        developmentType: "agency_guidance",
        verificationStatus: "official_verified",
        officialSourceFound: true,
        officialSourceUrl:
          "https://www.cnil.fr/fr/accompagnement-des-professionnels-le-programme-de-travail-de-la-cnil-pour-2026",
        sourceReferences: [],
        corroboratingSources: [],
        exactDateOfInformation: "2026-04-07",
        datePrecision: "day",
        citationQuality: "partial",
        publicVisibilityStatus: "public",
        reviewerNotes: "",
        relatedMonitorItemId: null,
        createdAt: "2026-04-07T10:00:00.000Z",
        updatedAt: "2026-04-07T10:05:00.000Z",
      },
      {
        id: "news-fr-2",
        regulatoryUpdateId: null,
        rawItemId: "raw-fr-2",
        title: "French AI discovery lead",
        slug: "french-ai-discovery-lead",
        shortSummary: "A France AI development still awaiting stronger official confirmation.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Tracker",
        sourceUrl: "https://example.com/tracker",
        sourceType: "tracker_source",
        sourceReliability: "medium",
        sourceJurisdiction: "France",
        region: "Europe",
        jurisdiction: "France",
        countryOrState: "France",
        legalArea: "AI governance",
        topicTags: ["France"],
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
      id: "health-fr-1",
      sourceId: "src-cnil-ai",
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

describe("France legal news agent", () => {
  it("keeps a dedicated France source cluster for live and baseline monitoring", () => {
    expect(getFranceAgentSourceIds("france_live_news_scan")).toEqual(
      expect.arrayContaining([
        "src-cnil-ai",
        "src-fr-newsapi-ai",
        "src-fr-major-press-newsapi-ai",
        "src-fr-gdelt-ai",
      ]),
    );
    expect(getFranceAgentSourceIds("france_official_legal_scan")).toEqual(
      expect.arrayContaining([
        "src-cnil-ai",
        "src-fr-legifrance-ai",
        "src-fr-judilibre-ai",
        "src-fr-conseil-etat-ai",
        "src-fr-cour-cassation-ai",
        "src-fr-defenseur-droits-ai",
      ]),
    );
  });

  it("identifies France monitoring sources conservatively", () => {
    expect(
      isFranceMonitoringSource({
        id: "src-cnil-ai",
        country: "France",
        jurisdiction: "France",
      }),
    ).toBe(true);
    expect(
      isFranceMonitoringSource({
        id: "src-eu-commission-ai",
        country: "European Union",
        jurisdiction: "European Union",
      }),
    ).toBe(false);
  });

  it("keeps France live-item detection limited to France items", () => {
    expect(
      isFranceNewsItem({
        countryOrState: "France",
        jurisdiction: "France",
        region: "Europe",
      }),
    ).toBe(true);
    expect(
      isFranceNewsItem({
        countryOrState: "Germany",
        jurisdiction: "Germany",
        region: "Europe",
      }),
    ).toBe(false);
  });

  it("documents that five-minute France monitoring is architecture-ready but not guaranteed", () => {
    const guidance = getFranceSchedulerGuidance();

    expect(guidance.liveTarget).toContain("every 5 minutes");
    expect(guidance.notes[0]).toContain("CNIL RSS");
    expect(guidance.notes.some((note) => note.includes("not be described as guaranteed real time"))).toBe(true);
  });

  it("exposes structured France live-summary metrics", async () => {
    await withNewsItems(async () => {
      const result = await getFranceLiveLegalIntelligenceData(6);

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

  it("ranks major media domains above secondary discovery sources in admin review", async () => {
    const adminNewsItems: NewsItemRecord[] = [
      {
        id: "news-fr-reuters",
        regulatoryUpdateId: null,
        rawItemId: "raw-fr-reuters",
        title: "Reuters AI legal update",
        slug: "reuters-ai-legal-update",
        shortSummary: "Reuters reported on a French AI legal development.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Reuters",
        sourceUrl: "https://www.reuters.com/world/europe/france-ai-regulation-update-2026-04-08/",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "France",
        region: "Europe",
        jurisdiction: "France",
        countryOrState: "France",
        legalArea: "AI governance",
        topicTags: ["France", "AI"],
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
        id: "news-fr-secondary",
        regulatoryUpdateId: null,
        rawItemId: "raw-fr-secondary",
        title: "Secondary AI legal update",
        slug: "secondary-ai-legal-update",
        shortSummary: "A secondary source reported on a French AI legal development.",
        fullSummary: "",
        publicationDate: "2026-04-08",
        eventDate: null,
        detectedAt: "2026-04-08T10:00:00.000Z",
        lastVerifiedAt: "2026-04-08T10:05:00.000Z",
        sourceName: "Example Source",
        sourceUrl: "https://example.org/france-ai-regulation-update",
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
        sourceJurisdiction: "France",
        region: "Europe",
        jurisdiction: "France",
        countryOrState: "France",
        legalArea: "AI governance",
        topicTags: ["France", "AI"],
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

    const result = await getAdminFranceLegalNewsOverview(10);

    expect(result.items[0]?.item.sourceName).toBe("Reuters");
    expect(result.items[0]?.mediaDomain.label).toBe("Reuters");
  });
});
