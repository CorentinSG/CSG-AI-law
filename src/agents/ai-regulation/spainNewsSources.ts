import type { RegulationSource } from "@/agents/ai-regulation/types";

export const spainAgentProfileIds = [
  "spain_official_legal_scan",
  "spain_live_news_scan",
  "spain_verification_scan",
] as const;

export type SpainAgentProfileId = (typeof spainAgentProfileIds)[number];

export interface SpainMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  category:
    | "official_guidance_feed"
    | "official_ai_supervision"
    | "official_legislation"
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

export const spainMonitoringSourceRegistry: SpainMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-es-aepd-ai",
    label: "AEPD AI and Innovation",
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
    sourceId: "src-es-aesia-ai",
    label: "AESIA official materials",
    category: "official_ai_supervision",
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
    sourceId: "src-es-boe-ai",
    label: "BOE AI legal texts",
    category: "official_legislation",
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
    sourceId: "src-es-moncloa-ai",
    label: "La Moncloa AI governance materials",
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
    sourceId: "src-es-newsapi-ai",
    label: "Spain AI legal news discovery (NewsAPI)",
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
    sourceId: "src-es-major-press-newsapi-ai",
    label: "Spain AI legal major press (NewsAPI)",
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
    sourceId: "src-es-gdelt-ai",
    label: "Spain AI legal news discovery (GDELT)",
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

const spainSourceIds = new Set(spainMonitoringSourceRegistry.map((entry) => entry.sourceId));

export function isSpainMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return spainSourceIds.has(source.id) || source.country === "Spain" || source.jurisdiction === "Spain";
}

export function getSpainSourceDescriptor(sourceId: string) {
  return spainMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
}

export function getSpainAgentSourceIds(profile: SpainAgentProfileId) {
  switch (profile) {
    case "spain_live_news_scan":
      return spainMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "spain_verification_scan":
      return spainMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "spain_official_legal_scan":
    default:
      return spainMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getSpainSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "AEPD is the current lightweight Spain live source most suited to frequent refresh.",
      "AESIA, BOE, and La Moncloa should remain on a slower cadence because they are more authoritative but less suitable for aggressive polling.",
      "NewsAPI and GDELT can accelerate Spain legal-news discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "This architecture is Spain-live ready, but it should not be described as guaranteed real time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
