import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import { decideEuNewsDatabaseConversion } from "@/agents/ai-regulation/euNewsToDatabase";
import { assessEuNewsVerification } from "@/agents/ai-regulation/euNewsVerification";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import {
  getMediaDomainScore,
} from "@/agents/ai-regulation/mediaDomainScoring";
import {
  assessNewsCurrentness,
  assessSourceCurrentness,
  type NewsCurrentnessAssessment,
} from "@/agents/ai-regulation/newsCurrentness";
import { runAiRegulationScan, type ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { buildLiveStoryFeed } from "@/agents/ai-regulation/storyClustering";
import {
  getItalyAgentSourceIds,
  getItalySchedulerGuidance,
  getItalySourceDescriptor,
  italyMonitoringSourceRegistry,
  type ItalyAgentProfileId,
  type ItalyMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/italyNewsSources";
import { normalizeNewsItemRecord, type AiLawNewsItem } from "@/content/ai-regulation/news";

export function isItalyNewsItem(
  item: Pick<AiLawNewsItem, "countryOrState" | "jurisdiction" | "region">,
) {
  return (
    item.countryOrState === "Italy" ||
    item.jurisdiction === "Italy" ||
    (item.region === "Europe" && item.countryOrState === "Italy")
  );
}

function getItalyDescriptorForItem(
  item: Pick<AiLawNewsItem, "sourceName" | "sourceUrl" | "countryOrState" | "jurisdiction">,
) {
  const normalizedName = item.sourceName.toLowerCase();
  const normalizedUrl = item.sourceUrl.toLowerCase();

  return (
    italyMonitoringSourceRegistry.find(
      (entry) =>
        entry.label.toLowerCase() === normalizedName ||
        normalizedName.includes(entry.label.toLowerCase()) ||
        normalizedUrl.includes(entry.sourceId.replace("src-", "")) ||
        (entry.sourceId === "src-it-garante-ai" && normalizedUrl.includes("garanteprivacy.it")) ||
        (entry.sourceId === "src-it-agid-ai" && normalizedUrl.includes("agid.gov.it")) ||
        (entry.sourceId === "src-it-normattiva-ai" && normalizedUrl.includes("normattiva.it")) ||
        (entry.sourceId === "src-it-dtd-ai" && normalizedUrl.includes("innovazione.gov.it")),
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
      sourceName: getItalySourceDescriptor(check.sourceId)?.label ?? check.sourceId,
      checkedAt: check.checkedAt,
      responseStatus: check.responseStatus,
      parserStatus: check.parserStatus,
      activeRecommendation: check.activeRecommendation,
      currentness: assessSourceCurrentness(check, getItalySourceDescriptor(check.sourceId)),
    }));
}

type ItalyNewsRankedItem = {
  item: AiLawNewsItem;
  descriptor: ItalyMonitoringSourceDescriptor | null;
  classification: ReturnType<typeof classifyEuNewsItem>;
  verification: ReturnType<typeof assessEuNewsVerification>;
  conversion: ReturnType<typeof decideEuNewsDatabaseConversion>;
  currentness: NewsCurrentnessAssessment;
  mediaDomain: ReturnType<typeof getMediaDomainScore>;
};

function buildItalyNewsSummary(items: ItalyNewsRankedItem[]) {
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

function rankItalyNewsItems(items: AiLawNewsItem[]) {
  return items
    .map((item) => {
      const descriptor = getItalyDescriptorForItem(item);
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

function getReviewPriority(entry: ItalyNewsRankedItem) {
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
      descriptor: getItalySourceDescriptor(check.sourceId),
      currentness: assessSourceCurrentness(check, getItalySourceDescriptor(check.sourceId)),
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

export async function runItalyLegalNewsAgentScan(options?: {
  trigger?: ScanTrigger;
  profile?: ItalyAgentProfileId;
}) {
  const trigger = options?.trigger ?? "scheduled_local_test";
  const profile = options?.profile ?? "italy_live_news_scan";
  return runAiRegulationScan(undefined, {
    trigger,
    scanProfile: profile,
  });
}

export async function getItalyLiveLegalIntelligenceData(limit = 6) {
  const italySourceIds = getItalyAgentSourceIds("italy_official_legal_scan");
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getPublicNewsItems(80),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const rankedItems = rankItalyNewsItems(
    newsItems
      .map(normalizeNewsItemRecord)
      .filter(isItalyNewsItem)
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
    summary: buildItalyNewsSummary(rankedItems),
    lastCheckedAt: getLastCheckedAtForSourceIds(italySourceIds, sourceHealthChecks),
    activity: getSourceActivityForSourceIds(italySourceIds, sourceHealthChecks),
    schedulerGuidance: getItalySchedulerGuidance(),
  };
}

export async function getAdminItalyLegalNewsOverview(limit = 40) {
  const italySourceIds = getItalyAgentSourceIds("italy_official_legal_scan");
  const [newsItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getNewsItems(limit),
    updateRepository.getSourceHealthChecks(undefined, 80),
  ]);

  const items = rankItalyNewsItems(
    newsItems.map(normalizeNewsItemRecord).filter(isItalyNewsItem),
  ).map((entry) => ({
    ...entry,
    reviewPriority: getReviewPriority(entry),
  }));

  return {
    items,
    sourceHealthChecks: rankSourceHealthChecks(italySourceIds, sourceHealthChecks),
    summary: buildItalyNewsSummary(items),
    schedulerGuidance: getItalySchedulerGuidance(),
  };
}
