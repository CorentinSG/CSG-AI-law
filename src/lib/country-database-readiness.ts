import type { NewsItemRecord, CountryIntelligence } from "@/agents/ai-regulation/governance";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  getSourceRuntimeHealthSummaries,
  type SourceRuntimeHealthSummary,
} from "@/agents/ai-regulation/sourceRuntimeHealth";
import type { AiRegulatoryUpdate, RegulationSource } from "@/agents/ai-regulation/types";

export type CountryReadinessStatus = "ready" | "degraded" | "needs_backfill" | "blocked";

export interface CountryDatabaseReadinessInput {
  now?: Date;
  sources: RegulationSource[];
  sourceHealth: SourceRuntimeHealthSummary[];
  updates: Array<
    Pick<AiRegulatoryUpdate, "jurisdiction" | "country" | "region" | "status">
  >;
  newsItems: Array<
    Pick<
      NewsItemRecord,
      "countryOrState" | "jurisdiction" | "region" | "publicVisibilityStatus"
    >
  >;
  countryProfiles: Array<
    Pick<
      CountryIntelligence,
      "countryName" | "reviewStatus" | "citationQualityStatus" | "missingSourceWarnings"
    >
  >;
}

export interface CountryDatabaseReadiness {
  country: string;
  status: CountryReadinessStatus;
  score: number;
  sourceCoverage: {
    total: number;
    officialLike: number;
    media: number;
    api: number;
    htmlStatic: number;
    active: number;
  };
  runtime: {
    healthy: number;
    degraded: number;
    stale: number;
    inactive: number;
    scanned24h: number;
    scanned7d: number;
    neverSucceeded: number;
    failing: number;
  };
  content: {
    regulatoryUpdates: number;
    publicNews: number;
    hasVerifiedProfile: boolean;
    citationQualityStatus: string | null;
    missingSourceWarnings: string[];
  };
  blockers: string[];
  recommendations: string[];
  failingSources: string[];
}

export interface CountryDatabaseReadinessReport {
  checkedAt: string;
  summary: {
    total: number;
    ready: number;
    degraded: number;
    needsBackfill: number;
    blocked: number;
    averageScore: number;
  };
  countries: CountryDatabaseReadiness[];
  blockers: Array<{
    country: string;
    status: CountryReadinessStatus;
    score: number;
    blockers: string[];
    failingSources: string[];
  }>;
}

const OFFICIAL_SOURCE_CATEGORIES = new Set(["official", "regulator", "court", "parliament"]);
const OFFICIAL_SOURCE_TYPES = new Set([
  "API",
  "static_page",
  "dynamic_page",
  "PDF_repository",
  "legislative_database",
  "regulator_page",
  "court_database",
  "standards_body",
  "tracker_source",
]);
const DISCOVERY_SOURCE_TYPES = new Set(["discovery_source", "media_source", "RSS"]);

function isOfficialLikeSource(source: RegulationSource) {
  if (OFFICIAL_SOURCE_CATEGORIES.has(source.sourceCategory ?? "")) return true;
  return (
    !source.sourceCategory &&
    source.reliabilityLevel === "high" &&
    OFFICIAL_SOURCE_TYPES.has(source.sourceType)
  );
}

function isDiscoveryLikeSource(source: RegulationSource) {
  if (source.sourceCategory === "media") return true;
  return !source.sourceCategory && DISCOVERY_SOURCE_TYPES.has(source.sourceType);
}

function sourceCountry(source: Pick<RegulationSource, "country" | "jurisdiction" | "region">) {
  return source.country || source.jurisdiction || source.region || "Unknown";
}

function updateCountry(
  update: Pick<AiRegulatoryUpdate, "jurisdiction" | "country" | "region">,
) {
  return update.country || update.jurisdiction || update.region || "Unknown";
}

function newsCountry(
  item: Pick<NewsItemRecord, "countryOrState" | "jurisdiction" | "region">,
) {
  return item.countryOrState || item.jurisdiction || item.region || "Unknown";
}

function isSuccessfulWithin(value: string | null, now: Date, days: number) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && now.getTime() - parsed <= days * 24 * 60 * 60 * 1000;
}

function hasActiveFailure(health: SourceRuntimeHealthSummary | null) {
  if (!health) return false;
  const successAt = health.lastSuccessfulAt ? Date.parse(health.lastSuccessfulAt) : null;
  const failureAt = health.lastFailureAt ? Date.parse(health.lastFailureAt) : null;
  const failureIsLatest =
    typeof failureAt === "number" &&
    Number.isFinite(failureAt) &&
    (typeof successAt !== "number" || !Number.isFinite(successAt) || failureAt > successAt);

  return Boolean(health.consecutiveFailures > 0 || (failureIsLatest && health.state === "stale"));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildRecommendations(blockers: string[]) {
  const recommendations: string[] = [];
  if (blockers.includes("too_few_sources")) {
    recommendations.push("Add at least two active sources for this jurisdiction.");
  }
  if (blockers.includes("missing_official_source")) {
    recommendations.push("Add or repair an official/regulator/court source.");
  }
  if (blockers.includes("missing_news_discovery")) {
    recommendations.push("Add or configure a media discovery source such as NewsAPI or GDELT.");
  }
  if (blockers.includes("no_recent_successful_scan")) {
    recommendations.push("Run a controlled baseline backfill for this country.");
  }
  if (blockers.includes("source_failures")) {
    recommendations.push("Repair or replace failing sources before relying on automation.");
  }
  if (blockers.includes("empty_country_database")) {
    recommendations.push("Backfill official legal entries and legal-news items, then review publication eligibility.");
  }
  if (blockers.includes("country_profile_unverified")) {
    recommendations.push("Review the country profile and attach official citations.");
  }
  return recommendations;
}

function deriveStatus(input: {
  blockers: string[];
  sourceCoverage: CountryDatabaseReadiness["sourceCoverage"];
  runtime: CountryDatabaseReadiness["runtime"];
  content: CountryDatabaseReadiness["content"];
}) {
  const { blockers, runtime, content } = input;
  if (blockers.includes("source_failures") || blockers.includes("missing_official_source")) {
    return "blocked" satisfies CountryReadinessStatus;
  }
  if (runtime.scanned7d === 0 || runtime.neverSucceeded === input.sourceCoverage.total) {
    return "needs_backfill" satisfies CountryReadinessStatus;
  }
  if (content.regulatoryUpdates === 0 && content.publicNews === 0) {
    return "needs_backfill" satisfies CountryReadinessStatus;
  }
  if (blockers.length > 0 || runtime.degraded > 0 || runtime.stale > 0) {
    return "degraded" satisfies CountryReadinessStatus;
  }
  return "ready" satisfies CountryReadinessStatus;
}

function scoreCountry(input: {
  sourceCoverage: CountryDatabaseReadiness["sourceCoverage"];
  runtime: CountryDatabaseReadiness["runtime"];
  content: CountryDatabaseReadiness["content"];
  blockers: string[];
}) {
  const { sourceCoverage, runtime, content, blockers } = input;
  let score = 0;
  score += Math.min(sourceCoverage.total, 4) * 8;
  score += Math.min(sourceCoverage.officialLike, 2) * 10;
  score += Math.min(sourceCoverage.media, 2) * 6;
  score += Math.min(sourceCoverage.api, 2) * 4;
  score += sourceCoverage.total > 0 ? (runtime.scanned7d / sourceCoverage.total) * 18 : 0;
  score += content.regulatoryUpdates > 0 ? 8 : 0;
  score += content.publicNews > 0 ? 6 : 0;
  score += content.hasVerifiedProfile ? 8 : 0;
  score -= runtime.failing * 12;
  score -= runtime.neverSucceeded * 3;
  score -= blockers.includes("missing_official_source") ? 20 : 0;
  score -= blockers.includes("source_failures") ? 15 : 0;
  return clampScore(score);
}

export function buildCountryDatabaseReadiness(
  input: CountryDatabaseReadinessInput,
): CountryDatabaseReadinessReport {
  const now = input.now ?? new Date();
  const sourceHealthById = new Map(input.sourceHealth.map((health) => [health.sourceId, health]));
  const countries = new Map<string, CountryDatabaseReadiness>();

  function ensure(country: string) {
    const existing = countries.get(country);
    if (existing) return existing;
    const created: CountryDatabaseReadiness = {
      country,
      status: "needs_backfill",
      score: 0,
      sourceCoverage: {
        total: 0,
        officialLike: 0,
        media: 0,
        api: 0,
        htmlStatic: 0,
        active: 0,
      },
      runtime: {
        healthy: 0,
        degraded: 0,
        stale: 0,
        inactive: 0,
        scanned24h: 0,
        scanned7d: 0,
        neverSucceeded: 0,
        failing: 0,
      },
      content: {
        regulatoryUpdates: 0,
        publicNews: 0,
        hasVerifiedProfile: false,
        citationQualityStatus: null,
        missingSourceWarnings: [],
      },
      blockers: [],
      recommendations: [],
      failingSources: [],
    };
    countries.set(country, created);
    return created;
  }

  for (const source of input.sources.filter((entry) => entry.active)) {
    const country = ensure(sourceCountry(source));
    const health = sourceHealthById.get(source.id) ?? null;
    country.sourceCoverage.total += 1;
    country.sourceCoverage.active += 1;
    if (isOfficialLikeSource(source)) {
      country.sourceCoverage.officialLike += 1;
    }
    if (isDiscoveryLikeSource(source)) {
      country.sourceCoverage.media += 1;
    }
    if (source.preferredExtractionMethod === "api") {
      country.sourceCoverage.api += 1;
    }
    if (source.preferredExtractionMethod === "html_static") {
      country.sourceCoverage.htmlStatic += 1;
    }
    if (health?.state === "healthy") country.runtime.healthy += 1;
    if (health?.state === "degraded") country.runtime.degraded += 1;
    if (health?.state === "stale") country.runtime.stale += 1;
    if (health?.state === "inactive") country.runtime.inactive += 1;
    if (isSuccessfulWithin(health?.lastSuccessfulAt ?? source.lastSuccessfulScanAt ?? null, now, 1)) {
      country.runtime.scanned24h += 1;
    }
    if (isSuccessfulWithin(health?.lastSuccessfulAt ?? source.lastSuccessfulScanAt ?? null, now, 7)) {
      country.runtime.scanned7d += 1;
    }
    if (!(health?.lastSuccessfulAt ?? source.lastSuccessfulScanAt)) {
      country.runtime.neverSucceeded += 1;
    }
    if (hasActiveFailure(health)) {
      country.runtime.failing += 1;
      country.failingSources.push(source.id);
    }
  }

  for (const update of input.updates) {
    ensure(updateCountry(update)).content.regulatoryUpdates += 1;
  }

  for (const item of input.newsItems) {
    if (item.publicVisibilityStatus !== "public") continue;
    ensure(newsCountry(item)).content.publicNews += 1;
  }

  for (const profile of input.countryProfiles) {
    const country = ensure(profile.countryName);
    country.content.hasVerifiedProfile = profile.reviewStatus === "verified";
    country.content.citationQualityStatus = profile.citationQualityStatus;
    country.content.missingSourceWarnings = profile.missingSourceWarnings ?? [];
  }

  const reportCountries = Array.from(countries.values())
    .filter((country) => country.sourceCoverage.total > 0)
    .map((country) => {
      const blockers: string[] = [];
      if (country.sourceCoverage.total < 2) blockers.push("too_few_sources");
      if (country.sourceCoverage.officialLike === 0) blockers.push("missing_official_source");
      if (country.sourceCoverage.media === 0 && country.sourceCoverage.api === 0) {
        blockers.push("missing_news_discovery");
      }
      if (country.runtime.scanned7d === 0 || country.runtime.neverSucceeded === country.sourceCoverage.total) {
        blockers.push("no_recent_successful_scan");
      }
      if (country.runtime.failing > 0) blockers.push("source_failures");
      if (country.content.regulatoryUpdates === 0 && country.content.publicNews === 0) {
        blockers.push("empty_country_database");
      }
      if (
        country.content.citationQualityStatus === "missing_official_source" ||
        country.content.missingSourceWarnings.length > 0
      ) {
        blockers.push("country_profile_unverified");
      }

      const dedupedBlockers = Array.from(new Set(blockers));
      const status = deriveStatus({
        blockers: dedupedBlockers,
        sourceCoverage: country.sourceCoverage,
        runtime: country.runtime,
        content: country.content,
      });
      const score = scoreCountry({
        sourceCoverage: country.sourceCoverage,
        runtime: country.runtime,
        content: country.content,
        blockers: dedupedBlockers,
      });

      return {
        ...country,
        status,
        score,
        blockers: dedupedBlockers,
        recommendations: buildRecommendations(dedupedBlockers),
      } satisfies CountryDatabaseReadiness;
    })
    .sort((a, b) => a.score - b.score || a.country.localeCompare(b.country));

  const summary = {
    total: reportCountries.length,
    ready: 0,
    degraded: 0,
    needs_backfill: 0,
    blocked: 0,
    averageScore: 0,
  };
  for (const country of reportCountries) {
    summary[country.status] += 1;
  }
  summary.averageScore = reportCountries.length
    ? clampScore(reportCountries.reduce((sum, country) => sum + country.score, 0) / reportCountries.length)
    : 0;

  return {
    checkedAt: now.toISOString(),
    summary: {
      total: summary.total,
      ready: summary.ready,
      degraded: summary.degraded,
      needsBackfill: summary.needs_backfill,
      blocked: summary.blocked,
      averageScore: summary.averageScore,
    } as CountryDatabaseReadinessReport["summary"],
    countries: reportCountries,
    blockers: reportCountries
      .filter((country) => country.status !== "ready")
      .slice(0, 20)
      .map((country) => ({
        country: country.country,
        status: country.status,
        score: country.score,
        blockers: country.blockers,
        failingSources: country.failingSources,
      })),
  };
}

export async function getCountryDatabaseReadiness(options?: { now?: Date }) {
  const [sources, sourceHealth, updates, newsItems, countryProfiles] = await Promise.all([
    updateRepository.getSources(),
    getSourceRuntimeHealthSummaries({ now: options?.now, limitPerCollection: 1000 }),
    updateRepository.listUpdates(),
    updateRepository.getNewsItems(1000),
    updateRepository.listCountryIntelligence(),
  ]);

  return buildCountryDatabaseReadiness({
    now: options?.now,
    sources,
    sourceHealth,
    updates,
    newsItems,
    countryProfiles,
  });
}
