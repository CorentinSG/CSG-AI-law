import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import { decideEuNewsDatabaseConversion } from "@/agents/ai-regulation/euNewsToDatabase";
import { assessEuNewsVerification } from "@/agents/ai-regulation/euNewsVerification";
import { getMediaDomainScore } from "@/agents/ai-regulation/mediaDomainScoring";
import {
  assessNewsCurrentness,
  assessSourceCurrentness,
  type NewsCurrentnessAssessment,
  type SourceFreshnessStatus,
} from "@/agents/ai-regulation/newsCurrentness";
import { runAiRegulationScan, type ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  irelandMonitoringSourceRegistry,
  getIrelandAgentSourceIds,
  getIrelandSchedulerGuidance,
  getIrelandSourceDescriptor,
  type IrelandAgentProfileId,
  type IrelandMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/irelandNewsSources";
import { normalizeNewsItemRecord, type AiLawNewsItem } from "@/content/ai-regulation/news";

export function isIrelandNewsItem(
  item: Pick<AiLawNewsItem, "countryOrState" | "jurisdiction" | "region">,
) {
  return (
    item.countryOrState === "Ireland" ||
    item.jurisdiction === "Ireland" ||
    (item.region === "Europe" && item.countryOrState === "Ireland")
  );
}

function getIrelandDescriptorForItem(
  item: Pick<AiLawNewsItem, "sourceName" | "sourceUrl" | "countryOrState" | "jurisdiction">,
) {
  const normalizedName = item.sourceName.toLowerCase();
  const normalizedUrl = item.sourceUrl.toLowerCase();

  return (
    irelandMonitoringSourceRegistry.find(
      (entry) =>
        entry.label.toLowerCase() === normalizedName ||
        normalizedName.includes(entry.label.toLowerCase()) ||
        normalizedUrl.includes(entry.sourceId.replace("src-", "")) ||
        (entry.sourceId === "src-ie-dpc-ai" && normalizedUrl.includes("dataprotection.ie")) ||
        (entry.sourceId === "src-ie-dete-ai" && normalizedUrl.includes("enterprise.gov.ie")) ||
        (entry.sourceId === "src-ie-gov-ai" &&
          (normalizedUrl.includes("gov.ie") ||
            normalizedUrl.includes("oireachtas.ie"))),
    ) ?? null
  );
}

function getLastCheckedAtForSourceIds(
  sourceIds: string[],
  healthChecks: Awaited<ReturnType<typeof updateRepository.getSourceHealthChecks>>,
) {
  const sourceIdSet = new Set(sourceIds);
  return (
    healthChecks
      .filter((check) => sourceIdSet.has(check.sourceId))
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0]?.checkedAt ?? null
  );
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
      sourceName: getIrelandSourceDescriptor(check.sourceId)?.label ?? check.sourceId,
      checkedAt: check.checkedAt,
      responseStatus: check.responseStatus,
      parserStatus: check.parserStatus,
      activeRecommendation: check.activeRecommendation,
      currentness: assessSourceCurrentness(check, null),
    }));
}

type IrelandNewsRankedItem = {
  item: AiLawNewsItem;
  descriptor: IrelandMonitoringSourceDescriptor | null;
  classification: ReturnType<typeof classifyEuNewsItem>;
  verification: ReturnType<typeof assessEuNewsVerification>;
  conversion: ReturnType<typeof decideEuNewsDatabaseConversion>;
  currentness: NewsCurrentnessAssessment;
  mediaDomain: ReturnType<typeof getMediaDomainScore>;
};

function buildIrelandNewsSummary(items: IrelandNewsRankedItem[]) {
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
    breakingSignals: items.filter(
      (entry) => entry.currentness.freshnessLabel === "breaking",
    ).length,
    currentSignals: items.filter(
      (entry) => entry.currentness.freshnessLabel === "current",
    ).length,
    watchSignals: items.filter((entry) => entry.currentness.freshnessLabel === "watch").length,
    staleSignals: items.filter((entry) => entry.currentness.freshnessLabel === "stale").length,
    highUrgencySignals: items.filter(
      (entry) => entry.currentness.reviewUrgency === "high",
    ).length,
  };
}

function rankIrelandNewsItems(items: AiLawNewsItem[]) {
  return items
    .map((item) => {
      const descriptor = getIrelandDescriptorForItem(item);
      const classification = classifyEuNewsItem(item);
      return {
        item,
        descriptor,
        classification,
        verification: assessEuNewsVerification(item),
        conversion: decideEuNewsDatabaseConversion(item),
        currentness: assessNewsCurrentness(item, classification, null),
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

function getReviewPriority(entry: IrelandNewsRankedItem) {
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

function sortByFreshnessStatus(a: SourceFreshnessStatus, b: SourceFreshnessStatus) {
  const priority = (value: SourceFreshnessStatus) => {
    switch (value) {
      case "source_inaccessible":
        return 0;
      case "stale":
        return 1;
      case "due_for_refresh":
        return 2;
      case "fresh":
        return 3;
      default:
        return 4;
    }
  };
  return priority(a) - priority(b);
}

export async function getIrelandLiveLegalIntelligenceData(limit = 6) {
  const sourceIds = getIrelandAgentSourceIds("ireland_live_news_scan");
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getPublicNewsItems(80),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const rankedItems = rankIrelandNewsItems(
    newsItems
      .map(normalizeNewsItemRecord)
      .filter(isIrelandNewsItem)
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
    items: rankedItems.slice(0, limit).map((entry) => ({
      item: entry.item,
      reviewPriority: getReviewPriority(entry),
      currentness: entry.currentness,
    })),
    summary: buildIrelandNewsSummary(rankedItems),
    lastCheckedAt: getLastCheckedAtForSourceIds(sourceIds, sourceHealthChecks),
    activity: getSourceActivityForSourceIds(sourceIds, sourceHealthChecks).sort((a, b) =>
      sortByFreshnessStatus(
        a.currentness.freshnessStatus,
        b.currentness.freshnessStatus,
      ),
    ),
    schedulerGuidance: getIrelandSchedulerGuidance(),
  };
}

export async function runIrelandLegalNewsAgentScan(options?: {
  trigger?: ScanTrigger;
  profile?: IrelandAgentProfileId;
}) {
  const trigger = options?.trigger ?? "scheduled_local_test";
  const profile = options?.profile ?? "ireland_live_news_scan";
  return runAiRegulationScan(undefined, {
    trigger,
    scanProfile: profile,
  });
}
