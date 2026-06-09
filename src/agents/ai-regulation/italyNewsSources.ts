import type { RegulationSource } from "@/agents/ai-regulation/types";

export const italyAgentProfileIds = [
  "italy_official_legal_scan",
  "italy_live_news_scan",
  "italy_verification_scan",
] as const;

export type ItalyAgentProfileId = (typeof italyAgentProfileIds)[number];

export interface ItalyMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  category:
    | "official_guidance_feed"
    | "official_digital_governance"
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

export const italyMonitoringSourceRegistry: ItalyMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-it-garante-ai",
    label: "Garante AI topic and decisions",
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
    sourceId: "src-it-agid-ai",
    label: "AgID artificial intelligence materials",
    category: "official_digital_governance",
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
    sourceId: "src-it-normattiva-ai",
    label: "Normattiva Italian AI legal texts",
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
    sourceId: "src-it-dtd-ai",
    label: "Digital Transformation Department AI materials",
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
    sourceId: "src-it-newsapi-ai",
    label: "Italy AI legal news discovery (NewsAPI)",
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
    sourceId: "src-it-major-press-newsapi-ai",
    label: "Italy AI legal major press (NewsAPI)",
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
    sourceId: "src-it-gdelt-ai",
    label: "Italy AI legal news discovery (GDELT)",
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

const italySourceIds = new Set(italyMonitoringSourceRegistry.map((entry) => entry.sourceId));

export function isItalyMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return italySourceIds.has(source.id) || source.country === "Italy" || source.jurisdiction === "Italy";
}

export function getItalySourceDescriptor(sourceId: string) {
  return italyMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
}

export function getItalyAgentSourceIds(profile: ItalyAgentProfileId) {
  switch (profile) {
    case "italy_live_news_scan":
      return italyMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "italy_verification_scan":
      return italyMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "italy_official_legal_scan":
    default:
      return italyMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getItalySchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "Garante is the current lightweight Italy live source most suited to frequent refresh.",
      "AgID, Normattiva, and the Digital Transformation Department should remain on a slower cadence because they are authoritative but less suitable for aggressive polling.",
      "NewsAPI and GDELT can accelerate Italy legal-news discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "This architecture is Italy-live ready, but it should not be described as guaranteed real time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
