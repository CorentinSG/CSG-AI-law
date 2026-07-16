import { describe, expect, it } from "vitest";

import { assessCitationQuality, type SourceReference } from "@/agents/ai-regulation/citations";
import { buildEuropeCoverageDiagnostics } from "@/agents/ai-regulation/coverageDiagnostics";
import { assessDataQuality } from "@/agents/ai-regulation/dataQuality";
import { buildLegalIntelligenceDataStewardReport } from "@/agents/ai-regulation/dataSteward";
import { assessFreshness } from "@/agents/ai-regulation/freshness";
import type {
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";
import { getUsStateAiLawProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";

const now = new Date("2026-05-27T12:00:00.000Z");

const officialReference: SourceReference = {
  sourceRole: "primary",
  title: "Official AI source",
  institution: "Official Institution",
  url: "https://example.gov/ai",
  canonicalUrl: "https://example.gov/ai",
  sourceType: "official",
  authorityType: "Agency guidance",
  publicationDate: "2026-05-01",
  detectedAt: "2026-05-01T00:00:00.000Z",
  retrievedAt: "2026-05-01T00:00:00.000Z",
  lastVerifiedAt: "2026-05-01T00:00:00.000Z",
  jurisdiction: "United States federal",
  documentType: "Guidance",
  excerpt: null,
  pinpoint: null,
  reliabilityLevel: "high",
  verificationStatus: "verified",
  archivedUrl: null,
  accessLimitations: null,
  notes: null,
};

function source(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-ai-weekly-news-today",
    name: "AI Weekly / AI News Today",
    jurisdiction: "OECD",
    region: "International",
    country: "International",
    sourceUrl: "https://aiweekly.co/ai-news-today",
    sourceType: "static_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: "2026-05-27T00:00:00.000Z",
    notes: "Discovery only.",
    reliabilityLevel: "low",
    preferredExtractionMethod: "html_static",
    config: {
      sourceCategory: "discovery_source",
    },
    createdAt: "2026-05-27T00:00:00.000Z",
    updatedAt: "2026-05-27T00:00:00.000Z",
    ...overrides,
  };
}

function rawItem(overrides: Partial<RawRegulatoryItem> = {}): RawRegulatoryItem {
  return {
    id: "raw-discovery-1",
    sourceId: "src-ai-weekly-news-today",
    rawTitle: "Possible AI law development",
    rawUrl: "https://aiweekly.co/ai-news-today",
    rawText: "Discovery lead metadata only.",
    rawMetadata: {
      discoveryLead: true,
      discoveryHeadline: "Possible AI law development",
      discoverySourceUrl: "https://aiweekly.co/ai-news-today",
      discoveryOutboundUrl: "https://example.com/non-official",
      discoveryVerificationStatus: "needs_official_source",
      discoveryConversionStatus: "discovery_only",
      possibleOfficialSourceFound: false,
      corroboratingSourceFound: false,
      verification: {
        verificationStatus: "needs_official_source",
        officialSourceFound: false,
        publicVisibilityAllowed: false,
        reviewerNotes: "Non-official discovery lead - requires official verification.",
      },
    },
    detectedAt: "2026-05-27T00:00:00.000Z",
    hash: "hash-discovery-1",
    duplicateOf: null,
    processingStatus: "new",
    createdAt: "2026-05-27T00:00:00.000Z",
    updatedAt: "2026-05-27T00:00:00.000Z",
    ...overrides,
  };
}

function scanLog(overrides: Partial<RegulationScanLog> = {}): RegulationScanLog {
  return {
    id: "scan-1",
    sourceId: "src-ai-weekly-news-today",
    scanStartedAt: "2026-05-27T00:00:00.000Z",
    scanFinishedAt: "2026-05-27T00:01:00.000Z",
    status: "success",
    itemsFound: 1,
    newItemsDetected: 1,
    duplicatesDetected: 0,
    errors: ["scan_trigger=scheduled_local_test", "items_fetched=1"],
    createdAt: "2026-05-27T00:01:00.000Z",
    ...overrides,
  };
}

describe("data stewardship", () => {
  it("scores complete official citations as complete", () => {
    const citation = assessCitationQuality([officialReference]);
    expect(citation.qualityStatus).toBe("complete");
    expect(citation.publicationEligible).toBe(true);
  });

  it("blocks public readiness when official citations are missing", () => {
    const assessment = assessDataQuality({
      sourceReferences: [],
      verificationStatus: "verified_for_review",
      confidenceLevel: "medium",
      lastReviewedAt: "2026-05-27T00:00:00.000Z",
      freshnessPolicy: "soft_law",
      humanReviewed: true,
      now,
    });

    expect(assessment.publicationEligible).toBe(false);
    expect(assessment.publicReadiness).toBe("missing_official_source");
    expect(assessment.citationQuality).toBe("missing_citation");
  });

  it("marks stale records after the freshness threshold", () => {
    const freshness = assessFreshness({
      lastReviewedAt: "2025-01-01T00:00:00.000Z",
      policy: "country_status",
      now,
    });

    expect(freshness.status).toBe("stale");
    expect(freshness.warnings[0]).toContain("threshold");
  });

  it("builds Europe coverage diagnostics with country and timeline checks", () => {
    const diagnostics = buildEuropeCoverageDiagnostics(now);
    expect(diagnostics.some((entry) => entry.entityType === "country")).toBe(true);
    expect(diagnostics.some((entry) => entry.entityType === "timeline")).toBe(true);
    expect(
      diagnostics
        .filter((entry) => entry.entityType === "country")
        .every((entry) => entry.sourceCount > 0),
    ).toBe(true);
  });

  it("keeps every U.S. state and D.C. visible to coverage diagnostics", () => {
    const states = getUsStateAiLawProfiles();
    expect(states).toHaveLength(51);
    expect(states.some((state) => state.stateCode === "DC")).toBe(true);
  });

  it("requires EU timeline milestones to carry source references", () => {
    expect(euAiTimelineEntries.every((entry) => entry.sourceReferences.length > 0)).toBe(true);
  });

  it("treats discovery leads as non-publishable stewardship items", () => {
    const report = buildLegalIntelligenceDataStewardReport({
      updates: [],
      rawItems: [rawItem()],
      sources: [source()],
      scanLogs: [scanLog()],
      now,
    });

    expect(report.discoveryFindings).toHaveLength(1);
    expect(report.discoveryFindings[0].publicVisibilityAllowed).toBe(false);
    expect(report.reviewQueue.some((item) => item.area === "discovery")).toBe(true);
  });

  it("prefers dedicated discovery leads when a first-class backlog is provided", () => {
    const report = buildLegalIntelligenceDataStewardReport({
      updates: [],
      rawItems: [rawItem()],
      sources: [source()],
      scanLogs: [scanLog()],
      discoveryLeads: [
        {
          id: "lead-1",
          rawItemId: "raw-discovery-1",
          sourceId: "src-ai-weekly-news-today",
          headline: "Dedicated discovery lead",
          discoverySourceUrl: "https://aiweekly.co/ai-news-today",
          outboundUrl: "https://example.com/non-official",
          detectedAt: "2026-05-27T00:00:00.000Z",
          possibleJurisdiction: "OECD",
          possibleTopic: "AI governance",
          possibleLegalArea: null,
          possibleAuthorityType: null,
          status: "official_source_found",
          officialSourceFound: true,
          officialSourceUrl: "https://example.gov/official",
          corroboratingSourceCount: 1,
          corroboratingSourceUrls: ["https://example.org/corroborating"],
          convertedUpdateId: null,
          reviewerNotes: "Possible official source found.",
          lastVerifiedAt: "2026-05-27T01:00:00.000Z",
          staleAt: null,
          publicVisibilityAllowed: false,
          createdAt: "2026-05-27T00:00:00.000Z",
          updatedAt: "2026-05-27T01:00:00.000Z",
        },
      ],
      now,
    });

    expect(report.discoveryFindings).toHaveLength(1);
    expect(report.discoveryFindings[0].discoveryLeadId).toBe("lead-1");
    expect(report.discoveryFindings[0].headline).toBe("Dedicated discovery lead");
  });

  it("surfaces source accessibility warnings for blocked active sources", () => {
    const report = buildLegalIntelligenceDataStewardReport({
      updates: [],
      rawItems: [],
      sources: [
        source({
          id: "src-sec-ai",
          name: "SEC AI",
          sourceUrl: "https://www.sec.gov/ai",
          config: {},
        }),
      ],
      scanLogs: [
        scanLog({
          sourceId: "src-sec-ai",
          status: "failed",
          errors: ["source_response_status=403", "Forbidden"],
        }),
      ],
      now,
    });

    expect(report.sources[0].reviewPriority).toBe("high");
    expect(report.reviewQueue.some((item) => item.area === "source")).toBe(true);
  });

  it("tracks scheduled scan presence in the stewardship report", () => {
    const report = buildLegalIntelligenceDataStewardReport({
      updates: [],
      rawItems: [],
      sources: [source()],
      scanLogs: [scanLog()],
      now,
    });

    expect(report.latestScheduledScan?.id).toBe("scan-1");
  });

  it("builds a Europe-only maintenance queue for prioritized Europe follow-up", () => {
    const report = buildLegalIntelligenceDataStewardReport({
      updates: [],
      rawItems: [],
      sources: [
        source({
          id: "src-eu",
          name: "European Commission AI",
          jurisdiction: "European Union",
          region: "Europe",
          sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
          config: {},
        }),
      ],
      scanLogs: [
        scanLog({
          sourceId: "src-eu",
          status: "failed",
          errors: ["source_response_status=403", "Forbidden"],
        }),
      ],
      now,
    });

    expect(report.summary.europeMaintenanceItems).toBeGreaterThan(0);
    expect(report.europeMaintenanceQueue.some((item) => item.area === "europe")).toBe(
      true,
    );
  });
});
