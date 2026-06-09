import type { RegulationSource } from "@/agents/ai-regulation/types";

export const germanyAgentProfileIds = [
  "germany_official_legal_scan",
  "germany_live_news_scan",
  "germany_verification_scan",
] as const;

export type GermanyAgentProfileId = (typeof germanyAgentProfileIds)[number];

export interface GermanyMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  category:
    | "official_guidance_feed"
    | "official_consultation_feed"
    | "official_government_implementation"
    | "official_parliamentary_feed"
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

export const germanyMonitoringSourceRegistry: GermanyMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-de-bfdi-ai",
    label: "BfDI AI unit materials",
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
    sourceId: "src-de-bfdi-consultation-ai",
    label: "BfDI AI-model consultation",
    category: "official_consultation_feed",
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
    sourceId: "src-de-bundesregierung-ai",
    label: "Federal Government AI Act implementation materials",
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
    sourceId: "src-de-bundestag-ai",
    label: "Bundestag AI Act implementation materials",
    category: "official_parliamentary_feed",
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
    sourceId: "src-de-newsapi-ai",
    label: "Germany AI legal news discovery (NewsAPI)",
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
    sourceId: "src-de-major-press-newsapi-ai",
    label: "Germany AI legal major press (NewsAPI)",
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
    sourceId: "src-de-gdelt-ai",
    label: "Germany AI legal news discovery (GDELT)",
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

const germanySourceIds = new Set(germanyMonitoringSourceRegistry.map((entry) => entry.sourceId));

export function isGermanyMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    germanySourceIds.has(source.id) ||
    source.country === "Germany" ||
    source.jurisdiction === "Germany"
  );
}

export function getGermanySourceDescriptor(sourceId: string) {
  return germanyMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
}

export function getGermanyAgentSourceIds(profile: GermanyAgentProfileId) {
  switch (profile) {
    case "germany_live_news_scan":
      return germanyMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "germany_verification_scan":
      return germanyMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "germany_official_legal_scan":
    default:
      return germanyMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getGermanySchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "BfDI AI-unit and consultation materials are the current lightweight Germany live sources most suited to frequent refresh.",
      "Federal Government and Bundestag implementation materials should remain on a slower cadence because they are authoritative but less suitable for aggressive polling.",
      "NewsAPI and GDELT can accelerate Germany legal-news discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "This architecture is Germany-live ready, but it should not be described as guaranteed real time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
