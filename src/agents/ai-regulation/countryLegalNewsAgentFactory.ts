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
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { normalizeNewsItemRecord, type AiLawNewsItem } from "@/content/ai-regulation/news";

export type GenericCountryAgentProfileId =
  | "official_legal_scan"
  | "live_news_scan"
  | "verification_scan";

export type MonitoringSourceCategory =
  | "official_guidance_feed"
  | "official_supervision_feed"
  | "official_government_implementation"
  | "official_legislative_feed"
  | "official_court_feed"
  | "discovery_media_feed";

export interface CountryMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  category: MonitoringSourceCategory;
  recommendedCadence:
    | "every_5_minutes_when_supported"
    | "hourly_fallback"
    | "daily"
    | "weekly";
  priorityBand: "high" | "medium" | "low";
  freshHours: number;
  watchHours: number;
  staleHours: number;
  liveMonitoringEligible: boolean;
  baselineEligible: boolean;
  verificationEligible: boolean;
}

export interface CountryLegalNewsAgentDefinition {
  countryName: string;
  countrySlug: string;
  countryCode: string;
  adjective: string;
  primaryAuthorityLabel: string;
  sourceRegistry: CountryMonitoringSourceDescriptor[];
}

type RankedCountryNewsItem = {
  item: AiLawNewsItem;
  descriptor: CountryMonitoringSourceDescriptor | null;
  classification: ReturnType<typeof classifyEuNewsItem>;
  verification: ReturnType<typeof assessEuNewsVerification>;
  conversion: ReturnType<typeof decideEuNewsDatabaseConversion>;
  currentness: NewsCurrentnessAssessment;
  mediaDomain: ReturnType<typeof getMediaDomainScore>;
};

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildDefaultCountrySourceRegistry(input: {
  countryName: string;
  countryCode: string;
  primaryAuthorityLabel: string;
}): CountryMonitoringSourceDescriptor[] {
  const prefix = input.countryCode.toLowerCase();
  return [
    {
      sourceId: `src-${prefix}-dpa-ai`,
      label: `${input.primaryAuthorityLabel} - AI and data-protection oversight`,
      category: "official_guidance_feed",
      recommendedCadence: "daily",
      priorityBand: "high",
      freshHours: 24,
      watchHours: 72,
      staleHours: 168,
      liveMonitoringEligible: true,
      baselineEligible: true,
      verificationEligible: false,
    },
    {
      sourceId: `src-${prefix}-government-ai`,
      label: `${input.countryName} government - AI and digital policy`,
      category: "official_government_implementation",
      recommendedCadence: "daily",
      priorityBand: "medium",
      freshHours: 24,
      watchHours: 72,
      staleHours: 168,
      liveMonitoringEligible: false,
      baselineEligible: true,
      verificationEligible: false,
    },
    {
      sourceId: `src-${prefix}-newsapi-ai`,
      label: `${input.countryName} AI legal news discovery (NewsAPI)`,
      category: "discovery_media_feed",
      recommendedCadence: "hourly_fallback",
      priorityBand: "medium",
      freshHours: 6,
      watchHours: 24,
      staleHours: 72,
      liveMonitoringEligible: true,
      baselineEligible: false,
      verificationEligible: false,
    },
    {
      sourceId: `src-${prefix}-gdelt-ai`,
      label: `${input.countryName} AI legal news discovery (GDELT)`,
      category: "discovery_media_feed",
      recommendedCadence: "hourly_fallback",
      priorityBand: "low",
      freshHours: 6,
      watchHours: 24,
      staleHours: 72,
      liveMonitoringEligible: true,
      baselineEligible: false,
      verificationEligible: false,
    },
  ];
}

export function createCountryNewsSourceModule(definition: CountryLegalNewsAgentDefinition) {
  const sourceIds = new Set(definition.sourceRegistry.map((entry) => entry.sourceId));

  function isMonitoringSource(
    source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
  ) {
    if (!source) return false;
    return (
      sourceIds.has(source.id) ||
      source.country === definition.countryName ||
      source.jurisdiction === definition.countryName
    );
  }

  function getSourceDescriptor(sourceId: string) {
    return definition.sourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
  }

  function getAgentSourceIds(profile: GenericCountryAgentProfileId) {
    switch (profile) {
      case "live_news_scan":
        return definition.sourceRegistry
          .filter((entry) => entry.liveMonitoringEligible)
          .map((entry) => entry.sourceId);
      case "verification_scan":
        return definition.sourceRegistry
          .filter((entry) => entry.verificationEligible)
          .map((entry) => entry.sourceId);
      case "official_legal_scan":
      default:
        return definition.sourceRegistry
          .filter((entry) => entry.baselineEligible)
          .map((entry) => entry.sourceId);
    }
  }

  function getSchedulerGuidance() {
    return {
      liveTarget: "hourly when infrastructure allows",
      safeFallback: "daily until source-specific RSS/API endpoints are verified",
      notes: [
        `${definition.primaryAuthorityLabel} is the primary ${definition.countryName} official oversight source to verify first.`,
        `${definition.countryName} government and digital-policy sources should remain on a slower cadence until official feeds are validated.`,
        "NewsAPI and GDELT are discovery-only accelerators and never count as legal authority by themselves.",
        "This agent shell is country-ready; source descriptors must be promoted to active scannable sources only after endpoint verification.",
      ],
    };
  }

  return {
    definition,
    agentProfileIds: [
      "official_legal_scan",
      "live_news_scan",
      "verification_scan",
    ] as const,
    isMonitoringSource,
    getSourceDescriptor,
    getAgentSourceIds,
    getSchedulerGuidance,
  };
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

function buildCountryNewsSummary(items: RankedCountryNewsItem[]) {
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

function getReviewPriority(entry: RankedCountryNewsItem) {
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
  getSourceDescriptor: (sourceId: string) => CountryMonitoringSourceDescriptor | null,
  limit = 4,
) {
  const sourceIdSet = new Set(sourceIds);

  return healthChecks
    .filter((check) => sourceIdSet.has(check.sourceId))
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
    .slice(0, limit)
    .map((check) => ({
      sourceId: check.sourceId,
      sourceName: getSourceDescriptor(check.sourceId)?.label ?? check.sourceId,
      checkedAt: check.checkedAt,
      responseStatus: check.responseStatus,
      parserStatus: check.parserStatus,
      activeRecommendation: check.activeRecommendation,
      currentness: assessSourceCurrentness(check, null),
    }));
}

function mapGenericProfileToScanProfile(profile: GenericCountryAgentProfileId): ScanProfileId {
  switch (profile) {
    case "live_news_scan":
      return "live_news_discovery_scan";
    case "verification_scan":
      return "verification_scan";
    case "official_legal_scan":
    default:
      return "official_baseline_scan";
  }
}

export function createCountryLegalNewsAgent(
  sourceModule: ReturnType<typeof createCountryNewsSourceModule>,
) {
  const { definition } = sourceModule;

  function isNewsItem(
    item: Pick<AiLawNewsItem, "countryOrState" | "jurisdiction" | "region">,
  ) {
    return (
      item.countryOrState === definition.countryName ||
      item.jurisdiction === definition.countryName ||
      (item.region === "Europe" && item.countryOrState === definition.countryName)
    );
  }

  function getDescriptorForItem(
    item: Pick<AiLawNewsItem, "sourceName" | "sourceUrl" | "countryOrState" | "jurisdiction">,
  ) {
    const normalizedName = item.sourceName.toLowerCase();
    const normalizedUrl = item.sourceUrl.toLowerCase();

    return (
      definition.sourceRegistry.find(
        (entry) =>
          entry.label.toLowerCase() === normalizedName ||
          normalizedName.includes(entry.label.toLowerCase()) ||
          normalizedUrl.includes(entry.sourceId.replace("src-", "")) ||
          normalizedUrl.includes(normalizeSlug(definition.countryName)),
      ) ?? null
    );
  }

  function rankNewsItems(items: AiLawNewsItem[]) {
    return items
      .map((item) => {
        const descriptor = getDescriptorForItem(item);
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

  async function getLiveLegalIntelligenceData(limit = 6) {
    const sourceIds = sourceModule.getAgentSourceIds("live_news_scan");
    const [newsItems, sourceHealthChecks] = await Promise.all([
      updateRepository.getPublicNewsItems(80),
      updateRepository.getSourceHealthChecks(undefined, 80),
    ]);

    const rankedItems = rankNewsItems(
      newsItems
        .map(normalizeNewsItemRecord)
        .filter(isNewsItem)
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
      summary: buildCountryNewsSummary(rankedItems),
      lastCheckedAt: getLastCheckedAtForSourceIds(sourceIds, sourceHealthChecks),
      activity: getSourceActivityForSourceIds(
        sourceIds,
        sourceHealthChecks,
        sourceModule.getSourceDescriptor,
      ).sort((a, b) =>
        sortByFreshnessStatus(
          a.currentness.freshnessStatus,
          b.currentness.freshnessStatus,
        ),
      ),
      schedulerGuidance: sourceModule.getSchedulerGuidance(),
    };
  }

  async function runLegalNewsAgentScan(options?: {
    trigger?: ScanTrigger;
    profile?: GenericCountryAgentProfileId;
  }) {
    const trigger = options?.trigger ?? "scheduled_local_test";
    const profile = options?.profile ?? "live_news_scan";
    const sourceIds = sourceModule.getAgentSourceIds(profile);
    const activeSources = await updateRepository.getSources();
    const activeSourceIds = sourceIds.filter((sourceId) =>
      activeSources.some((source) => source.active && source.id === sourceId),
    );
    const scanProfile = mapGenericProfileToScanProfile(profile);

    if (activeSourceIds.length === 0) {
      return {
        trigger,
        profile,
        scanProfile,
        sourceIds,
        activeSourceIds,
        status: "skipped" as const,
        reason:
          "No active scannable source is currently registered for this agent/profile.",
      };
    }

    const results = [];
    for (const sourceId of activeSourceIds) {
      results.push(
        ...(await runAiRegulationScan(sourceId, {
          trigger,
          scanProfile,
        })),
      );
    }

    return {
      trigger,
      profile,
      scanProfile,
      sourceIds,
      activeSourceIds,
      status: "completed" as const,
      results,
    };
  }

  return {
    definition,
    isNewsItem,
    getLiveLegalIntelligenceData,
    runLegalNewsAgentScan,
  };
}
