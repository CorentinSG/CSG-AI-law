import type { RegulationSource } from "@/agents/ai-regulation/types";

export const netherlandsAgentProfileIds = [
  "netherlands_official_legal_scan",
  "netherlands_live_news_scan",
  "netherlands_verification_scan",
] as const;

export type NetherlandsAgentProfileId = (typeof netherlandsAgentProfileIds)[number];

export interface NetherlandsMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  category:
    | "official_guidance_feed"
    | "official_supervision_feed"
    | "official_government_implementation"
    | "discovery_media_feed";
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

export const netherlandsMonitoringSourceRegistry: NetherlandsMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-nl-ap-ai",
    label: "Autoriteit Persoonsgegevens algorithms/AI page",
    category: "official_guidance_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 6,
    watchHours: 24,
    staleHours: 72,
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-nl-rdi-ai",
    label: "RDI AI supervision page",
    category: "official_supervision_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 6,
    watchHours: 24,
    staleHours: 72,
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-nl-rijksoverheid-ai",
    label: "Rijksoverheid AI policy portal",
    category: "official_government_implementation",
    recommendedCadence: "daily",
    priorityBand: "high",
    freshHours: 24,
    watchHours: 72,
    staleHours: 168,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-nl-newsapi-ai",
    label: "Netherlands AI legal news discovery (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-nl-gdelt-ai",
    label: "Netherlands AI legal news discovery (GDELT)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "medium",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
];

const netherlandsSourceIds = new Set(
  netherlandsMonitoringSourceRegistry.map((entry) => entry.sourceId),
);

export function isNetherlandsMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    netherlandsSourceIds.has(source.id) ||
    source.country === "Netherlands" ||
    source.jurisdiction === "Netherlands"
  );
}

export function getNetherlandsSourceDescriptor(sourceId: string) {
  return (
    netherlandsMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null
  );
}

export function getNetherlandsAgentSourceIds(profile: NetherlandsAgentProfileId) {
  switch (profile) {
    case "netherlands_live_news_scan":
      return netherlandsMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "netherlands_verification_scan":
      return netherlandsMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "netherlands_official_legal_scan":
    default:
      return netherlandsMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getNetherlandsSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "AP and RDI are the current lightweight Netherlands live sources most suited to frequent refresh.",
      "Rijksoverheid AI policy materials should remain on a slower daily cadence because they are authoritative but less suited to aggressive polling.",
      "NewsAPI and GDELT can accelerate Netherlands legal-news discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "This architecture is Netherlands-live ready, but it should not be described as guaranteed real-time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
