import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import { decideEuNewsDatabaseConversion } from "@/agents/ai-regulation/euNewsToDatabase";
import { assessEuNewsVerification } from "@/agents/ai-regulation/euNewsVerification";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import { getMediaDomainScore } from "@/agents/ai-regulation/mediaDomainScoring";
import {
  assessNewsCurrentness,
  assessSourceCurrentness,
  type NewsCurrentnessAssessment,
} from "@/agents/ai-regulation/newsCurrentness";
import { runAiRegulationScan, type ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  germanyMonitoringSourceRegistry,
  getGermanyAgentSourceIds,
  getGermanySchedulerGuidance,
  getGermanySourceDescriptor,
  type GermanyAgentProfileId,
  type GermanyMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/germanyNewsSources";
import { normalizeNewsItemRecord, type AiLawNewsItem } from "@/content/ai-regulation/news";

export function isGermanyNewsItem(
  item: Pick<AiLawNewsItem, "countryOrState" | "jurisdiction" | "region">,
) {
  return (
    item.countryOrState === "Germany" ||
    item.jurisdiction === "Germany" ||
    (item.region === "Europe" && item.countryOrState === "Germany")
  );
}

function getGermanyDescriptorForItem(
  item: Pick<AiLawNewsItem, "sourceName" | "sourceUrl" | "countryOrState" | "jurisdiction">,
) {
  const normalizedName = item.sourceName.toLowerCase();
  const normalizedUrl = item.sourceUrl.toLowerCase();

  return (
    germanyMonitoringSourceRegistry.find(
      (entry) =>
        entry.label.toLowerCase() === normalizedName ||
        normalizedName.includes(entry.label.toLowerCase()) ||
        normalizedUrl.includes(entry.sourceId.replace("src-", "")) ||
        (entry.sourceId === "src-de-bfdi-ai" && normalizedUrl.includes("bfdi.bund.de")) ||
        (entry.sourceId === "src-de-bfdi-consultation-ai" &&
          normalizedUrl.includes("bfdi.bund.de")) ||
        (entry.sourceId === "src-de-bundesregierung-ai" &&
          normalizedUrl.includes("bundesregierung.de")) ||
        (entry.sourceId === "src-de-bundestag-ai" && normalizedUrl.includes("bundestag.de")),
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
      sourceName: getGermanySourceDescriptor(check.sourceId)?.label ?? check.sourceId,
      checkedAt: check.checkedAt,
      responseStatus: check.responseStatus,
      parserStatus: check.parserStatus,
      activeRecommendation: check.activeRecommendation,
      currentness: assessSourceCurrentness(check, getGermanySourceDescriptor(check.sourceId)),
    }));
}

type GermanyNewsRankedItem = {
  item: AiLawNewsItem;
  descriptor: GermanyMonitoringSourceDescriptor | null;
  classification: ReturnType<typeof classifyEuNewsItem>;
  verification: ReturnType<typeof assessEuNewsVerification>;
  conversion: ReturnType<typeof decideEuNewsDatabaseConversion>;
  currentness: NewsCurrentnessAssessment;
  mediaDomain: ReturnType<typeof getMediaDomainScore>;
};

function buildGermanyNewsSummary(items: GermanyNewsRankedItem[]) {
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

function rankGermanyNewsItems(items: AiLawNewsItem[]) {
  return items
    .map((item) => {
      const descriptor = getGermanyDescriptorForItem(item);
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

function getReviewPriority(entry: GermanyNewsRankedItem) {
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
      descriptor: getGermanySourceDescriptor(check.sourceId),
      currentness: assessSourceCurrentness(check, getGermanySourceDescriptor(check.sourceId)),
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

export async function runGermanyLegalNewsAgentScan(options?: {
  trigger?: ScanTrigger;
  profile?: GermanyAgentProfileId;
}) {
  const trigger = options?.trigger ?? "scheduled_local_test";
  const profile = options?.profile ?? "germany_live_news_scan";
  return runAiRegulationScan(undefined, {
    trigger,
    scanProfile: profile,
  });
}

export async function getGermanyLiveLegalIntelligenceData(limit = 6) {
  const germanySourceIds = getGermanyAgentSourceIds("germany_official_legal_scan");
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getPublicNewsItems(80),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const rankedItems = rankGermanyNewsItems(
    newsItems
      .map(normalizeNewsItemRecord)
      .filter(isGermanyNewsItem)
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
    summary: buildGermanyNewsSummary(rankedItems),
    lastCheckedAt: getLastCheckedAtForSourceIds(germanySourceIds, sourceHealthChecks),
    activity: getSourceActivityForSourceIds(germanySourceIds, sourceHealthChecks),
    schedulerGuidance: getGermanySchedulerGuidance(),
  };
}

export async function getAdminGermanyLegalNewsOverview(limit = 40) {
  const germanySourceIds = getGermanyAgentSourceIds("germany_official_legal_scan");
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getNewsItems(limit),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const items = rankGermanyNewsItems(
    newsItems.map(normalizeNewsItemRecord).filter(isGermanyNewsItem),
  ).map((entry) => ({
    ...entry,
    reviewPriority: getReviewPriority(entry),
  }));

  return {
    items,
    sourceHealthChecks: rankSourceHealthChecks(germanySourceIds, sourceHealthChecks),
    summary: buildGermanyNewsSummary(items),
    schedulerGuidance: getGermanySchedulerGuidance(),
  };
}
