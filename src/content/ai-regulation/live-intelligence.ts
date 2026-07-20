import {
  getNewsVerificationLabel,
  type AiLawNewsItem,
  type NormalizedNewsItemRecord,
} from "@/content/ai-regulation/news";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import type { RegulationSource } from "@/agents/ai-regulation/types";

export type RegionalLiveIntelligenceScope = "Europe" | "North America";

const publicEligibleStatuses = new Set([
  "official_verified",
  "official_source_found",
  "corroborated",
  "published_news",
  "converted_to_monitor_item",
  // Max-auto publication policy (2026-07-20): reputable-media reporting is
  // shown live with an explicit "official source pending" badge instead of
  // being held back until official confirmation.
  "media_reported",
]);

/**
 * Single gate for every public "live legal intelligence" panel (regional
 * hubs, country pages, factory countries). Visibility is still controlled by
 * publicVisibilityStatus — this only widens which verification statuses are
 * live-panel eligible; the verification badge always discloses the status.
 */
export function isLivePanelEligible(
  item: Pick<
    AiLawNewsItem,
    "publicVisibilityStatus" | "officialSourceFound" | "verificationStatus"
  >,
) {
  return (
    item.publicVisibilityStatus === "public" &&
    (item.officialSourceFound || publicEligibleStatuses.has(item.verificationStatus))
  );
}

export function filterRegionalLiveItems(
  items: AiLawNewsItem[],
  region: RegionalLiveIntelligenceScope,
) {
  return items
    .filter((item) => item.region === region)
    .filter((item) => isLivePanelEligible(item))
    .sort((a, b) => {
      const aDate = a.publicationDate ?? a.detectedAt;
      const bDate = b.publicationDate ?? b.detectedAt;
      return bDate.localeCompare(aDate);
    });
}

export function buildRegionalLiveSummary(
  items: NormalizedNewsItemRecord[],
  region: RegionalLiveIntelligenceScope,
) {
  const filtered = filterRegionalLiveItems(items, region);

  return {
    totalVisible: filtered.length,
    officialLike: filtered.filter((item) => item.officialSourceFound).length,
    withMonitorItem: filtered.filter((item) => Boolean(item.relatedMonitorItemId)).length,
  };
}

export function getLiveStatusBadgeLabel(item: Pick<
  AiLawNewsItem,
  "sourceType" | "officialSourceFound" | "verificationStatus" | "sourceName"
>) {
  return getNewsVerificationLabel(item);
}

export function getLiveReliabilityLabel(
  reliability: AiLawNewsItem["sourceReliability"],
) {
  return reliability.replaceAll("_", " ");
}

export function getRegionalLastCheckedAt(
  healthChecks: SourceHealthCheck[],
  sources: RegulationSource[],
  region: RegionalLiveIntelligenceScope,
) {
  const sourceIds = new Set(
    sources.filter((source) => source.region === region).map((source) => source.id),
  );

  return healthChecks
    .filter((check) => sourceIds.has(check.sourceId))
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0]?.checkedAt ?? null;
}

export function getRegionalSourceActivity(
  healthChecks: SourceHealthCheck[],
  sources: RegulationSource[],
  region: RegionalLiveIntelligenceScope,
  limit = 3,
) {
  const sourceById = new Map(
    sources
      .filter((source) => source.region === region)
      .map((source) => [source.id, source]),
  );

  return healthChecks
    .filter((check) => sourceById.has(check.sourceId))
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
    .slice(0, limit)
    .map((check) => ({
      sourceId: check.sourceId,
      sourceName: sourceById.get(check.sourceId)?.name ?? check.sourceId,
      checkedAt: check.checkedAt,
      responseStatus: check.responseStatus,
      parserStatus: check.parserStatus,
      activeRecommendation: check.activeRecommendation,
    }));
}
