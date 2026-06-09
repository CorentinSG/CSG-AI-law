import type { RegulationSource } from "@/agents/ai-regulation/types";

export const swedenAgentProfileIds = [
  "sweden_official_legal_scan",
  "sweden_live_news_scan",
  "sweden_verification_scan",
] as const;

export type SwedenAgentProfileId = (typeof swedenAgentProfileIds)[number];

export interface SwedenMonitoringSourceDescriptor {
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

export const swedenMonitoringSourceRegistry: SwedenMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-se-imy-ai",
    label: "IMY (Integritetsskyddsmyndigheten) — AI and data-protection oversight",
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
    sourceId: "src-se-digg-ai",
    label: "DIGG — Agency for Digital Government",
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
    sourceId: "src-se-regeringen-ai",
    label: "Regeringen — Swedish Government AI and digital policy",
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
    sourceId: "src-se-newsapi-ai",
    label: "Sweden AI legal news discovery (NewsAPI)",
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
    sourceId: "src-se-gdelt-ai",
    label: "Sweden AI legal news discovery (GDELT)",
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

const swedenSourceIds = new Set(
  swedenMonitoringSourceRegistry.map((entry) => entry.sourceId),
);

export function isSwedenMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    swedenSourceIds.has(source.id) ||
    source.country === "Sweden" ||
    source.jurisdiction === "Sweden"
  );
}

export function getSwedenSourceDescriptor(sourceId: string) {
  return (
    swedenMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null
  );
}

export function getSwedenAgentSourceIds(profile: SwedenAgentProfileId) {
  switch (profile) {
    case "sweden_live_news_scan":
      return swedenMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "sweden_verification_scan":
      return swedenMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "sweden_official_legal_scan":
    default:
      return swedenMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getSwedenSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "IMY (Integritetsskyddsmyndigheten) is the primary lightweight Sweden live source most suited to frequent refresh given its role as Sweden's data-protection authority and EDPB member.",
      "IMY participated in the EDPB coordinated ChatGPT investigation, reflecting active engagement with AI and large language model oversight.",
      "DIGG and Regeringen materials should remain on a slower daily cadence because they are authoritative context sources but less suited to aggressive polling.",
      "NewsAPI and GDELT can accelerate Sweden AI-law discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "This architecture is Sweden live-ready, but it should not be described as guaranteed real-time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
