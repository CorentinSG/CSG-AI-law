import { describe, expect, it } from "vitest";

import {
  buildCountryDatabaseReadiness,
  type CountryDatabaseReadinessInput,
} from "@/lib/country-database-readiness";

const now = new Date("2026-07-15T12:00:00.000Z");

function source(overrides: Partial<CountryDatabaseReadinessInput["sources"][number]>) {
  return {
    id: "src-test",
    name: "Test source",
    jurisdiction: "France",
    region: "Europe",
    country: "France",
    sourceUrl: "https://example.com",
    sourceType: "static_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  } satisfies CountryDatabaseReadinessInput["sources"][number];
}

function health(
  overrides: Partial<CountryDatabaseReadinessInput["sourceHealth"][number]>,
) {
  return {
    sourceId: "src-test",
    sourceName: "Test source",
    jurisdiction: "France",
    active: true,
    state: "healthy",
    priorityBand: "high",
    recommendedCadence: "daily",
    freshHours: 24,
    staleHours: 168,
    freshnessStatus: "fresh",
    lastCheckedAt: now.toISOString(),
    lastSuccessfulAt: now.toISOString(),
    lastFailureAt: null,
    lastScanJobAt: now.toISOString(),
    lastScanJobStatus: "succeeded",
    hoursSinceSuccess: 0,
    consecutiveFailures: 0,
    latestResponseStatus: 200,
    latestParserStatus: "ok",
    latestFailureMessage: null,
    reasons: [],
    ...overrides,
  } satisfies CountryDatabaseReadinessInput["sourceHealth"][number];
}

describe("buildCountryDatabaseReadiness", () => {
  it("marks a well-covered country ready", () => {
    const report = buildCountryDatabaseReadiness({
      now,
      sources: [
        source({ id: "official", country: "France", sourceCategory: "official" }),
        source({ id: "regulator", country: "France", sourceCategory: "regulator" }),
        source({
          id: "media",
          country: "France",
          sourceCategory: "media",
          preferredExtractionMethod: "api",
        }),
        source({ id: "court", country: "France", sourceCategory: "court" }),
      ],
      sourceHealth: [
        health({ sourceId: "official" }),
        health({ sourceId: "regulator" }),
        health({ sourceId: "media" }),
        health({ sourceId: "court" }),
      ],
      updates: [
        {
          jurisdiction: "France",
          country: "France",
          region: "Europe",
          status: "published",
        },
      ],
      newsItems: [
        {
          countryOrState: "France",
          jurisdiction: "France",
          region: "Europe",
          publicVisibilityStatus: "public",
        },
      ],
      countryProfiles: [
        {
          countryName: "France",
          reviewStatus: "verified",
          citationQualityStatus: "complete",
          missingSourceWarnings: [],
        },
      ],
    });

    expect(report.summary.ready).toBe(1);
    expect(report.countries[0]).toMatchObject({
      country: "France",
      status: "ready",
      sourceCoverage: {
        total: 4,
        officialLike: 3,
        media: 1,
      },
      content: {
        regulatoryUpdates: 1,
        publicNews: 1,
      },
    });
    expect(report.countries[0].score).toBeGreaterThanOrEqual(85);
  });

  it("marks a country with sources but no successful scans as needs_backfill", () => {
    const report = buildCountryDatabaseReadiness({
      now,
      sources: [
        source({ id: "al-official", country: "Albania", sourceCategory: "official" }),
        source({ id: "al-media", country: "Albania", sourceCategory: "media" }),
      ],
      sourceHealth: [
        health({
          sourceId: "al-official",
          state: "degraded",
          freshnessStatus: "awaiting_first_success",
          lastSuccessfulAt: null,
          reasons: ["No successful source run is recorded yet."],
        }),
        health({
          sourceId: "al-media",
          state: "degraded",
          freshnessStatus: "awaiting_first_success",
          lastSuccessfulAt: null,
          reasons: ["No successful source run is recorded yet."],
        }),
      ],
      updates: [],
      newsItems: [],
      countryProfiles: [],
    });

    expect(report.summary.needsBackfill).toBe(1);
    expect(report.countries[0]).toMatchObject({
      country: "Albania",
      status: "needs_backfill",
      blockers: expect.arrayContaining(["no_recent_successful_scan", "empty_country_database"]),
    });
  });

  it("marks a country with latest source failures as blocked", () => {
    const report = buildCountryDatabaseReadiness({
      now,
      sources: [
        source({ id: "bg-government", country: "Bulgaria", sourceCategory: "official" }),
        source({ id: "bg-media", country: "Bulgaria", sourceCategory: "media" }),
      ],
      sourceHealth: [
        health({
          sourceId: "bg-government",
          state: "stale",
          consecutiveFailures: 1,
          latestFailureMessage: "fetch failed",
          reasons: ["fetch failed"],
        }),
        health({ sourceId: "bg-media" }),
      ],
      updates: [],
      newsItems: [],
      countryProfiles: [],
    });

    expect(report.summary.blocked).toBe(1);
    expect(report.countries[0]).toMatchObject({
      country: "Bulgaria",
      status: "blocked",
      failingSources: ["bg-government"],
      blockers: expect.arrayContaining(["source_failures", "empty_country_database"]),
    });
  });

  it("treats legacy high-reliability static sources without sourceCategory as official-like", () => {
    const report = buildCountryDatabaseReadiness({
      now,
      sources: [
        source({
          id: "legacy-official",
          country: "Spain",
          sourceCategory: null,
          sourceType: "static_page",
          reliabilityLevel: "high",
        }),
        source({
          id: "legacy-discovery",
          country: "Spain",
          sourceCategory: null,
          sourceType: "discovery_source",
          reliabilityLevel: "medium",
          preferredExtractionMethod: "api",
        }),
      ],
      sourceHealth: [
        health({ sourceId: "legacy-official" }),
        health({ sourceId: "legacy-discovery" }),
      ],
      updates: [
        {
          jurisdiction: "Spain",
          country: "Spain",
          region: "Europe",
          status: "published",
        },
      ],
      newsItems: [],
      countryProfiles: [],
    });

    expect(report.countries[0]).toMatchObject({
      country: "Spain",
      sourceCoverage: {
        officialLike: 1,
        media: 1,
      },
    });
    expect(report.countries[0].blockers).not.toContain("missing_official_source");
    expect(report.countries[0].blockers).not.toContain("missing_news_discovery");
  });

  it("does not treat stale accessibility notes as active failures after a later success", () => {
    const report = buildCountryDatabaseReadiness({
      now,
      sources: [
        source({ id: "court", country: "United States", sourceCategory: "court" }),
        source({ id: "official", country: "United States", sourceCategory: "official" }),
      ],
      sourceHealth: [
        health({
          sourceId: "court",
          state: "stale",
          lastSuccessfulAt: "2026-07-15T11:00:00.000Z",
          lastFailureAt: "2026-07-14T11:00:00.000Z",
          consecutiveFailures: 0,
          latestFailureMessage: "old 403 note",
        }),
        health({ sourceId: "official" }),
      ],
      updates: [
        {
          jurisdiction: "United States federal",
          country: "United States",
          region: "North America",
          status: "published",
        },
      ],
      newsItems: [],
      countryProfiles: [],
    });

    expect(report.countries[0].failingSources).toEqual([]);
    expect(report.countries[0].blockers).not.toContain("source_failures");
  });
});
