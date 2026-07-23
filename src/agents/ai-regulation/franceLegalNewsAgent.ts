import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import { assessEuNewsVerification } from "@/agents/ai-regulation/euNewsVerification";
import { decideEuNewsDatabaseConversion } from "@/agents/ai-regulation/euNewsToDatabase";
import { getMediaDomainScore } from "@/agents/ai-regulation/mediaDomainScoring";
import {
  franceMonitoringSourceRegistry,
  getFranceAgentSourceIds,
  getFranceSchedulerGuidance,
  getFranceSourceDescriptor,
  type FranceAgentProfileId,
  type FranceMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/franceNewsSources";
import {
  assessNewsCurrentness,
  assessSourceCurrentness,
  type NewsCurrentnessAssessment,
} from "@/agents/ai-regulation/newsCurrentness";
import { runAiRegulationScan, type ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { buildLiveStoryFeed } from "@/agents/ai-regulation/storyClustering";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import { normalizeNewsItemRecord, type AiLawNewsItem } from "@/content/ai-regulation/news";

function isFranceNewsItem(item: Pick<AiLawNewsItem, "countryOrState" | "jurisdiction" | "region">) {
  return (
    item.countryOrState === "France" ||
    item.jurisdiction === "France" ||
    (item.region === "Europe" && item.countryOrState === "France")
  );
}

function getFranceDescriptorForItem(
  item: Pick<AiLawNewsItem, "sourceName" | "sourceUrl" | "countryOrState" | "jurisdiction">,
) {
  const normalizedName = item.sourceName.toLowerCase();
  const normalizedUrl = item.sourceUrl.toLowerCase();

  return (
    franceMonitoringSourceRegistry.find(
      (entry) =>
        entry.label.toLowerCase() === normalizedName ||
        normalizedName.includes(entry.label.toLowerCase()) ||
        normalizedUrl.includes(entry.sourceId.replace("src-", "")) ||
        (entry.sourceId === "src-cnil-ai" && normalizedUrl.includes("cnil.fr")) ||
        (entry.sourceId === "src-fr-legifrance-ai" && normalizedUrl.includes("legifrance.gouv.fr")) ||
        (entry.sourceId === "src-fr-conseil-etat-ai" && normalizedUrl.includes("conseil-etat.fr")) ||
        (entry.sourceId === "src-fr-cour-cassation-ai" &&
          normalizedUrl.includes("courdecassation.fr")) ||
        (entry.sourceId === "src-fr-defenseur-droits-ai" &&
          normalizedUrl.includes("defenseurdesdroits.fr")),
    ) ?? null
  );
}

function getLastCheckedAtForSourceIds(
  sourceIds: string[],
  healthChecks: Awaited<ReturnType<typeof updateRepository.getSourceHealthChecks>>,
) {
  const sourceIdSet = new Set(sourceIds);
  return healthChecks
    .filter((check) => sourceIdSet.has(check.sourceId))
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0]?.checkedAt ?? null;
}

function getSourceActivityForSourceIds(
  sourceIds: string[],
  healthChecks: Awaited<ReturnType<typeof updateRepository.getSourceHealthChecks>>,
  limit = 4,
) {
  const sourceIdSet = new Set(sourceIds);

  return healthChecks
    .filter((check) => sourceIdSet.has(check.sourceId))
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
    .slice(0, limit)
    .map((check) => ({
      sourceId: check.sourceId,
      sourceName: getFranceSourceDescriptor(check.sourceId)?.label ?? check.sourceId,
      checkedAt: check.checkedAt,
      responseStatus: check.responseStatus,
      parserStatus: check.parserStatus,
      activeRecommendation: check.activeRecommendation,
      currentness: assessSourceCurrentness(check, getFranceSourceDescriptor(check.sourceId)),
    }));
}

type FranceNewsRankedItem = {
  item: AiLawNewsItem;
  descriptor: FranceMonitoringSourceDescriptor | null;
  classification: ReturnType<typeof classifyEuNewsItem>;
  verification: ReturnType<typeof assessEuNewsVerification>;
  conversion: ReturnType<typeof decideEuNewsDatabaseConversion>;
  currentness: NewsCurrentnessAssessment;
  mediaDomain: ReturnType<typeof getMediaDomainScore>;
};

function buildFranceNewsSummary(items: FranceNewsRankedItem[]) {
  return {
    total: items.length,
    officialLike: items.filter(
      (entry) =>
        entry.item.officialSourceFound ||
        entry.item.verificationStatus === "official_verified" ||
        entry.item.verificationStatus === "corroborated",
    ).length,
    awaitingOfficialSource: items.filter(
      (entry) =>
        entry.item.verificationStatus === "needs_official_source" ||
        entry.item.verificationStatus === "discovery_only" ||
        entry.item.verificationStatus === "media_reported",
    ).length,
    linkedMonitorItems: items.filter((entry) => Boolean(entry.item.relatedMonitorItemId)).length,
    hardLawSignals: items.filter((entry) => entry.classification.hardLaw).length,
    caseLawSignals: items.filter((entry) => entry.classification.caseLaw).length,
    enforcementSignals: items.filter((entry) => entry.classification.enforcement).length,
    breakingSignals: items.filter((entry) => entry.currentness.freshnessLabel === "breaking").length,
    currentSignals: items.filter((entry) => entry.currentness.freshnessLabel === "current").length,
    watchSignals: items.filter((entry) => entry.currentness.freshnessLabel === "watch").length,
    staleSignals: items.filter((entry) => entry.currentness.freshnessLabel === "stale").length,
    highUrgencySignals: items.filter((entry) => entry.currentness.reviewUrgency === "high").length,
  };
}

function rankFranceNewsItems(items: AiLawNewsItem[]) {
  return items
    .map((item) => {
      const descriptor = getFranceDescriptorForItem(item);
      const classification = classifyEuNewsItem(item);
      return {
        item,
        descriptor,
        classification,
        verification: assessEuNewsVerification(item),
        conversion: decideEuNewsDatabaseConversion(item),
        currentness: assessNewsCurrentness(item, classification, descriptor),
        mediaDomain: getMediaDomainScore(item),
      };
    })
    .sort((a, b) => {
      const dateA = a.item.publicationDate ?? a.item.detectedAt;
      const dateB = b.item.publicationDate ?? b.item.detectedAt;

      if (b.currentness.currentnessScore !== a.currentness.currentnessScore) {
        return b.currentness.currentnessScore - a.currentness.currentnessScore;
      }
      if (b.classification.importanceRank !== a.classification.importanceRank) {
        return b.classification.importanceRank - a.classification.importanceRank;
      }
      if (b.mediaDomain.score !== a.mediaDomain.score) {
        return b.mediaDomain.score - a.mediaDomain.score;
      }
      return dateB.localeCompare(dateA);
    });
}

function getReviewPriority(entry: FranceNewsRankedItem) {
  if (
    entry.currentness.reviewUrgency === "high" ||
    (entry.item.officialSourceFound &&
      (entry.classification.hardLaw ||
        entry.classification.caseLaw ||
        entry.classification.enforcement))
  ) {
    return "high" as const;
  }
  if (
    entry.currentness.reviewUrgency === "medium" ||
    entry.item.verificationStatus === "needs_official_source"
  ) {
    return "medium" as const;
  }
  return "low" as const;
}

function rankSourceHealthChecks(sourceIds: string[], checks: SourceHealthCheck[]) {
  return checks
    .filter((check) => sourceIds.includes(check.sourceId))
    .map((check) => ({
      check,
      descriptor: getFranceSourceDescriptor(check.sourceId),
      currentness: assessSourceCurrentness(check, getFranceSourceDescriptor(check.sourceId)),
    }))
    .sort((a, b) => {
      const priority = (value: typeof a.currentness.freshnessStatus) => {
        switch (value) {
          case "source_inaccessible":
            return 0;
          case "stale":
            return 1;
          case "due_for_refresh":
            return 2;
          case "fresh":
          default:
            return 3;
        }
      };

      return priority(a.currentness.freshnessStatus) - priority(b.currentness.freshnessStatus);
    });
}

export async function runFranceLegalNewsAgentScan(options?: {
  trigger?: ScanTrigger;
  profile?: FranceAgentProfileId;
}) {
  const trigger = options?.trigger ?? "scheduled_local_test";
  const profile = options?.profile ?? "france_live_news_scan";
  return runAiRegulationScan(undefined, {
    trigger,
    scanProfile: profile,
  });
}

export async function getFranceLiveLegalIntelligenceData(limit = 6) {
  const franceSourceIds = getFranceAgentSourceIds("france_official_legal_scan");
  // The public news list is global and ordered by publication date, so a
  // small window starves France items once other jurisdictions publish in
  // volume (France entries with a null publication date sort last). Widen the
  // window until a country-filtered repository query exists.
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getPublicNewsItems(500),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const rankedItems = rankFranceNewsItems(
    newsItems
      .map(normalizeNewsItemRecord)
      .filter(isFranceNewsItem)
      .filter(
        (item) =>
          item.publicVisibilityStatus === "public" &&
          (item.officialSourceFound ||
            item.verificationStatus === "official_verified" ||
            item.verificationStatus === "corroborated" ||
            item.verificationStatus === "published_news"),
      ),
  );

  return {
    items: rankedItems.slice(0, limit),
    // Clustered before the display cap so the same development reported by
    // several sources counts as one corroborated story, not N rows.
    stories: buildLiveStoryFeed(
      rankedItems.map((entry) => entry.item),
      { limit },
    ),
    summary: buildFranceNewsSummary(rankedItems),
    lastCheckedAt: getLastCheckedAtForSourceIds(franceSourceIds, sourceHealthChecks),
    activity: getSourceActivityForSourceIds(franceSourceIds, sourceHealthChecks),
    schedulerGuidance: getFranceSchedulerGuidance(),
  };
}

export async function getAdminFranceLegalNewsOverview(limit = 40) {
  const franceSourceIds = getFranceAgentSourceIds("france_official_legal_scan");
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getNewsItems(limit),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const items = rankFranceNewsItems(
    newsItems.map(normalizeNewsItemRecord).filter(isFranceNewsItem),
  ).map((entry) => ({
    ...entry,
    reviewPriority: getReviewPriority(entry),
  }));

  const rankedSourceHealthChecks = rankSourceHealthChecks(franceSourceIds, sourceHealthChecks);

  return {
    items,
    summary: buildFranceNewsSummary(items),
    sourceIds: franceSourceIds,
    sourceHealthChecks: rankedSourceHealthChecks,
    schedulerGuidance: getFranceSchedulerGuidance(),
  };
}

export { isFranceNewsItem };
