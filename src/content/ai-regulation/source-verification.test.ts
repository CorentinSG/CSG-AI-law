import { describe, expect, it } from "vitest";

import {
  getLatestSourceHealthCheckForSource,
  getResolvedSourceVerificationRecord,
  getInaccessibleSourceVerificationRecords,
  getSourceVerificationRecord,
  getSourceVerificationRecordsForHub,
  sourceVerificationRecords,
} from "@/content/ai-regulation/source-verification";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";
import { europeCountryStatuses } from "@/content/ai-regulation/europe-map";

describe("source verification registry", () => {
  it("documents every configured monitoring source", () => {
    expect(sourceVerificationRecords.length).toBeGreaterThanOrEqual(24);
    expect(getSourceVerificationRecord("src-eu-ai-office")?.responseStatus).toBe(200);
    expect(getSourceVerificationRecord("src-council-europe-ai")?.recommendation).toBe(
      "inactive",
    );
    expect(getSourceVerificationRecord("src-ai-weekly-news-today")?.official).toBe(false);
  });

  it("surfaces inaccessible official sources explicitly", () => {
    const inaccessible = getInaccessibleSourceVerificationRecords().map(
      (record) => record.sourceId,
    );

    expect(inaccessible).toContain("src-council-europe-ai");
    expect(inaccessible).toContain("src-sec-ai");
    expect(inaccessible).toContain("src-ftc-ai-press");
  });

  it("separates Europe and U.S. hub records", () => {
    const europe = getSourceVerificationRecordsForHub("europe");
    const unitedStates = getSourceVerificationRecordsForHub("united-states");

    expect(europe.some((record) => record.sourceId === "src-eu-ai-office")).toBe(true);
    expect(
      unitedStates.some((record) => record.sourceId === "src-federal-register-ai"),
    ).toBe(true);
  });

  it("prefers persisted runtime source-health checks over static fallback data when available", () => {
    const source: RegulationSource = {
      id: "src-eu-ai-office",
      name: "EU AI Office",
      jurisdiction: "European Union",
      region: "Europe",
      country: "European Union",
      sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
      sourceType: "static_page",
      scanFrequency: "daily",
      active: true,
      lastScannedAt: "2026-06-01T09:50:00.000Z",
      lastSuccessfulScanAt: "2026-06-01T09:50:00.000Z",
      lastFailedScanAt: null,
      latestResponseStatus: 200,
      latestItemsFetched: 5,
      latestNewItemsDetected: 1,
      latestDuplicatesDetected: 1,
      latestParserWarnings: [],
      latestAccessibilityIssue: null,
      sourceReliabilityNotes: "Live runtime source health says the endpoint is temporarily blocked.",
      notes: "Fallback notes",
      reliabilityLevel: "high",
      preferredExtractionMethod: "html_static",
      config: {},
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-06-01T09:50:00.000Z",
    };
    const healthCheck: SourceHealthCheck = {
      id: "shc-eu-ai-office",
      sourceId: "src-eu-ai-office",
      checkedAt: "2026-06-01T10:00:00.000Z",
      responseStatus: 403,
      runtimeAccessible: false,
      parserStatus: "ready",
      activeRecommendation: "inactive",
      itemsFetched: 0,
      newItemsDetected: 0,
      duplicatesDetected: 0,
      parserWarnings: [],
      accessibilityIssue: "403 returned from runtime verification.",
      reliabilityNotes: "Latest runtime check should override the static verification snapshot.",
      createdAt: "2026-06-01T10:00:00.000Z",
    };

    expect(getLatestSourceHealthCheckForSource(source.id, [healthCheck])?.id).toBe(
      healthCheck.id,
    );

    const resolved = getResolvedSourceVerificationRecord(source.id, {
      sources: [source],
      sourceHealthChecks: [healthCheck],
    });

    expect(resolved?.responseStatus).toBe(403);
    expect(resolved?.runtimeAccessible).toBe(false);
    expect(resolved?.status).toBe("access_blocked");
    expect(resolved?.lastVerifiedAt).toBe("2026-06-01T10:00:00.000Z");
  });

  it("marks AI Weekly as a non-official discovery-only source", () => {
    const record = getSourceVerificationRecord("src-ai-weekly-news-today");

    expect(record?.sourceClassification).toBe("discovery_source");
    expect(record?.authorityLevel).toBe("non_official");
    expect(record?.publicationAllowed).toBe(false);
    expect(record?.requiresOfficialSourceConfirmation).toBe(true);
    expect(record?.requiresCrossSourceVerification).toBe(true);
    expect(record?.runtimeAccessible).toBe(true);
  });

  it("marks Global Policy Watch categories as non-official discovery-only sources", () => {
    const europeRecord = getSourceVerificationRecord("src-global-policy-watch-eu");
    const aiRecord = getSourceVerificationRecord("src-global-policy-watch-ai");

    for (const record of [europeRecord, aiRecord]) {
      expect(record?.sourceClassification).toBe("discovery_source");
      expect(record?.official).toBe(false);
      expect(record?.authorityLevel).toBe("non_official");
      expect(record?.publicationAllowed).toBe(false);
      expect(record?.requiresOfficialSourceConfirmation).toBe(true);
      expect(record?.requiresCrossSourceVerification).toBe(true);
      expect(record?.responseStatus).toBe(200);
      expect(record?.recommendation).toBe("active");
    }
  });
});

describe("EU timeline and Europe map content", () => {
  it("stores EU timeline entries with official source URLs and parseable dates", () => {
    expect(euAiTimelineEntries.length).toBeGreaterThanOrEqual(8);

    for (const entry of euAiTimelineEntries) {
      expect(entry.sourceUrl.startsWith("https://")).toBe(true);
      expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
    }
  });

  it("keeps the Europe implementation map within the conservative verified taxonomy", () => {
    expect(europeCountryStatuses.length).toBe(27);
    expect(
      europeCountryStatuses.every(
        (country) =>
          country.status === "national_implementation_identified" ||
          country.status === "implementation_in_progress" ||
          country.status === "competent_authority_designated" ||
          country.status === "no_specific_national_implementation_verified" ||
          country.status === "consultation_or_draft_identified" ||
          country.status === "eu_framework_applies" ||
          country.status === "needs_review" ||
          country.status === "not_applicable",
      ),
    ).toBe(true);
  });
});
