import { decideEuNewsDatabaseConversion } from "@/agents/ai-regulation/euNewsToDatabase";
import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import { getEuNewsSourceConfigs } from "@/agents/ai-regulation/euNewsSources";
import { getMediaDomainScore } from "@/agents/ai-regulation/mediaDomainScoring";
import { assessEuNewsVerification } from "@/agents/ai-regulation/euNewsVerification";
import { runAiRegulationScan, type ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import {
  filterRegionalLiveItems,
  getRegionalLastCheckedAt,
  getRegionalSourceActivity,
} from "@/content/ai-regulation/live-intelligence";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";

const euScanProfileMap = {
  eu_official_legal_scan: "eu_official_legal_scan",
  eu_live_news_discovery_scan: "eu_live_news_discovery_scan",
  eu_verification_scan: "eu_verification_scan",
  eu_source_health_scan: "source_health_scan",
} as const satisfies Record<string, ScanProfileId>;

export type EuAgentScanProfile = keyof typeof euScanProfileMap;

export async function runEuLegalNewsAgentScan(options?: {
  trigger?: ScanTrigger;
  profile?: EuAgentScanProfile;
}) {
  return runAiRegulationScan(undefined, {
    trigger: options?.trigger ?? "scheduled_local_test",
    scanProfile: euScanProfileMap[options?.profile ?? "eu_live_news_discovery_scan"],
  });
}

export async function getEuropeLiveLegalIntelligenceData(limit = 6) {
  const [newsItems, sources, sourceHealthChecks] = await Promise.all([
    updateRepository.getPublicNewsItems(40),
    updateRepository.getSources(),
    updateRepository.getSourceHealthChecks(undefined, 40),
  ]);

  const rankedItems = filterRegionalLiveItems(
    newsItems.map(normalizeNewsItemRecord),
    "Europe",
  )
    .map((item) => ({
      item,
      classification: classifyEuNewsItem(item),
      verification: assessEuNewsVerification(item),
      conversion: decideEuNewsDatabaseConversion(item),
    }))
    .sort((a, b) => {
      const dateA = a.item.publicationDate ?? a.item.detectedAt;
      const dateB = b.item.publicationDate ?? b.item.detectedAt;
      if (b.classification.importanceRank !== a.classification.importanceRank) {
        return b.classification.importanceRank - a.classification.importanceRank;
      }
      return dateB.localeCompare(dateA);
    });

  return {
    items: rankedItems.slice(0, limit),
    lastCheckedAt: getRegionalLastCheckedAt(sourceHealthChecks, sources, "Europe"),
    activity: getRegionalSourceActivity(sourceHealthChecks, sources, "Europe"),
  };
}

export async function getAdminEuLegalNewsOverview(limit = 40) {
  const [newsItems, rawItems, sources, sourceHealthChecks] = await Promise.all([
    updateRepository.getNewsItems(limit),
    updateRepository.getRawItems(200),
    updateRepository.getSources(),
    updateRepository.getSourceHealthChecks(undefined, 50),
  ]);

  const rankedItems = newsItems
    .map(normalizeNewsItemRecord)
    .filter((item) => item.region === "Europe")
    .map((item) => ({
      item,
      classification: classifyEuNewsItem(item),
      verification: assessEuNewsVerification(item),
      conversion: decideEuNewsDatabaseConversion(item),
      mediaDomain: getMediaDomainScore(item),
      reviewPriority:
        item.officialSourceFound &&
        (classifyEuNewsItem(item).hardLaw || classifyEuNewsItem(item).caseLaw)
          ? "high"
          : item.verificationStatus === "needs_official_source"
            ? "medium"
            : "low",
    }))
    .sort((a, b) => {
      if (a.reviewPriority !== b.reviewPriority) {
        return a.reviewPriority === "high" ? -1 : b.reviewPriority === "high" ? 1 : 0;
      }
      if (b.mediaDomain.score !== a.mediaDomain.score) {
        return b.mediaDomain.score - a.mediaDomain.score;
      }
      return b.classification.importanceRank - a.classification.importanceRank;
    });

  return {
    items: rankedItems,
    euSourceConfigs: getEuNewsSourceConfigs(),
    sourceHealthChecks: sourceHealthChecks.filter((check) =>
      sources.some((source) => source.id === check.sourceId && source.region === "Europe"),
    ),
    rawItems,
  };
}
