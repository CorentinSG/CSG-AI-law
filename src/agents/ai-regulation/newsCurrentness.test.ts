import { describe, expect, it } from "vitest";

import {
  assessNewsCurrentness,
  assessSourceCurrentness,
} from "@/agents/ai-regulation/newsCurrentness";
import { getFranceSourceDescriptor } from "@/agents/ai-regulation/franceNewsSources";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import type { EuNewsClassification } from "@/agents/ai-regulation/euNewsClassification";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";

const baseItem: AiLawNewsItem = {
  id: "news-fr-test",
  title: "CNIL AI update",
  slug: "cnil-ai-update",
  shortSummary: "CNIL published a fresh AI governance signal.",
  fullSummary: "",
  detectedAt: "2026-06-02T10:00:00.000Z",
  eventDate: null,
  publicationDate: "2026-06-02T09:00:00.000Z",
  lastVerifiedAt: "2026-06-02T10:05:00.000Z",
  sourceName: "CNIL",
  sourceUrl: "https://www.cnil.fr/fr/example",
  sourceType: "official_source",
  sourceReliability: "official_authority",
  sourceJurisdiction: "France",
  jurisdiction: "France",
  region: "Europe",
  countryOrState: "France",
  legalArea: "AI governance",
  topicTags: ["France", "CNIL", "AI Act"],
  authorityType: "agency_guidance",
  developmentType: "DPA guidance",
  verificationStatus: "official_verified",
  officialSourceFound: true,
  officialSourceUrl: "https://www.cnil.fr/fr/example",
  sourceReferences: [],
  corroboratingSources: [],
  exactDateOfInformation: "2026-06-02T09:00:00.000Z",
  datePrecision: "exact",
  citationQuality: "partial",
  publicVisibilityStatus: "public",
  reviewerNotes: "",
  relatedMonitorItemId: null,
};

const hardLawClassification: EuNewsClassification = {
  sourceAuthorityLevel: "official_eu_or_member_state",
  sourceAccessStatus: "accessible",
  institution: "CNIL",
  country: "France",
  legalEffect: "May affect binding AI law obligations or formal implementation posture once reviewed.",
  hardLaw: true,
  softLaw: false,
  caseLaw: false,
  enforcement: false,
  developmentType: "Member State implementation",
  importanceRank: 80,
  rankingReason: "Binding or proposed hard-law development with Europe-wide relevance.",
};

describe("news currentness", () => {
  it("marks fresh official France hard-law signals as breaking or current", () => {
    const descriptor = getFranceSourceDescriptor("src-cnil-ai");
    const assessment = assessNewsCurrentness(
      baseItem,
      hardLawClassification,
      descriptor,
      new Date("2026-06-02T12:00:00.000Z"),
    );

    expect(["breaking", "current"]).toContain(assessment.freshnessLabel);
    expect(assessment.reviewUrgency).toBe("high");
    expect(assessment.currentnessScore).toBeGreaterThan(60);
  });

  it("marks older non-official items as watch or stale", () => {
    const assessment = assessNewsCurrentness(
      {
        ...baseItem,
        sourceType: "informal_discovery_source",
        sourceReliability: "informal_discovery",
        verificationStatus: "needs_official_source",
        officialSourceFound: false,
        publicationDate: "2026-05-20T10:00:00.000Z",
        detectedAt: "2026-05-20T10:00:00.000Z",
      },
      {
        ...hardLawClassification,
        hardLaw: false,
        softLaw: false,
        caseLaw: false,
        enforcement: false,
        developmentType: "discovery lead",
        importanceRank: 20,
      },
      null,
      new Date("2026-06-02T12:00:00.000Z"),
    );

    expect(["watch", "stale"]).toContain(assessment.freshnessLabel);
    expect(assessment.reviewUrgency).not.toBe("high");
  });

  it("flags stale or inaccessible France source checks conservatively", () => {
    const inaccessible: SourceHealthCheck = {
      id: "health-fr-1",
      sourceId: "src-fr-legifrance-ai",
      checkedAt: "2026-05-20T10:00:00.000Z",
      responseStatus: 403,
      runtimeAccessible: false,
      parserStatus: "blocked",
      activeRecommendation: "inactive",
      itemsFetched: 0,
      newItemsDetected: 0,
      duplicatesDetected: 0,
      parserWarnings: ["Cloudflare challenge"],
      accessibilityIssue: "blocked",
      reliabilityNotes: "blocked in runtime",
      createdAt: "2026-05-20T10:00:00.000Z",
    };

    const assessment = assessSourceCurrentness(
      inaccessible,
      getFranceSourceDescriptor("src-fr-legifrance-ai"),
      new Date("2026-06-02T12:00:00.000Z"),
    );

    expect(assessment.freshnessStatus).toBe("source_inaccessible");
    expect(assessment.dueForRefresh).toBe(true);
  });
});
