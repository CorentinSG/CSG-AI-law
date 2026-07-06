import type { RegulationSource } from "@/agents/ai-regulation/types";

export const belgiumAgentProfileIds = [
  "belgium_official_legal_scan",
  "belgium_live_news_scan",
  "belgium_verification_scan",
] as const;

export type BelgiumAgentProfileId = (typeof belgiumAgentProfileIds)[number];

export interface BelgiumMonitoringSourceDescriptor {
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

export const belgiumMonitoringSourceRegistry: BelgiumMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-be-apd-ai",
    label: "Autorité de protection des données — AI and algorithms",
    category: "official_guidance_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 6,
    watchHours: 24,
    staleHours: 72,
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: true,
  },
  {
    sourceId: "src-be-justel-ai-law",
    label: "Justel and Belgian Official Gazette - AI legislation",
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
    sourceId: "src-be-courts-ai",
    label: "Belgian constitutional and cassation case law on AI and algorithms",
    category: "official_supervision_feed",
    recommendedCadence: "daily",
    priorityBand: "high",
    freshHours: 24,
    watchHours: 72,
    staleHours: 168,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: true,
  },
  {
    sourceId: "src-be-digitalbelgium-ai",
    label: "Digital Belgium — AI policy portal",
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
    sourceId: "src-be-ai4belgium",
    label: "AI4Belgium — government AI strategy coordination",
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
    sourceId: "src-be-newsapi-ai",
    label: "Belgium AI legal news discovery (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: true,
  },
  {
    sourceId: "src-be-gdelt-ai",
    label: "Belgium AI legal news discovery (GDELT)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "medium",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: true,
  },
];

const belgiumSourceIds = new Set(
  belgiumMonitoringSourceRegistry.map((entry) => entry.sourceId),
);

export function isBelgiumMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    belgiumSourceIds.has(source.id) ||
    source.country === "Belgium" ||
    source.jurisdiction === "Belgium"
  );
}

export function getBelgiumSourceDescriptor(sourceId: string) {
  return (
    belgiumMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null
  );
}

export function getBelgiumAgentSourceIds(profile: BelgiumAgentProfileId) {
  switch (profile) {
    case "belgium_live_news_scan":
      return belgiumMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "belgium_verification_scan":
      return belgiumMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "belgium_official_legal_scan":
    default:
      return belgiumMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getBelgiumSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "The APD/GBA is the current lightweight Belgium live source most suited to frequent refresh.",
      "Digital Belgium and AI4Belgium policy materials should remain on a slower daily cadence because they are authoritative but less suited to aggressive polling.",
      "NewsAPI and GDELT can accelerate Belgium AI-law discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "Belgium's federal structure means AI Act supervision responsibilities may span multiple levels of government; the monitoring posture reflects this complexity.",
      "This architecture is Belgium live-ready, but it should not be described as guaranteed real-time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
