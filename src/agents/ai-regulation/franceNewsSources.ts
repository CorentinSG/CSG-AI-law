import type { RegulationSource } from "@/agents/ai-regulation/types";

export const franceAgentProfileIds = [
  "france_official_legal_scan",
  "france_live_news_scan",
  "france_verification_scan",
] as const;

export type FranceAgentProfileId = (typeof franceAgentProfileIds)[number];

export interface FranceMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  category:
    | "official_guidance_feed"
    | "official_legislation"
    | "official_case_law_api"
    | "official_judicial_governance"
    | "official_rights_authority"
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

export const franceMonitoringSourceRegistry: FranceMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-cnil-ai",
    label: "CNIL AI and Algorithms",
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
    sourceId: "src-fr-legifrance-ai",
    label: "Legifrance AI legal texts",
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
    sourceId: "src-fr-judilibre-ai",
    label: "Judilibre AI-related decisions",
    category: "official_case_law_api",
    recommendedCadence: "hourly_fallback",
    priorityBand: "high",
    freshHours: 12,
    watchHours: 48,
    staleHours: 120,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-conseil-etat-ai",
    label: "Conseil d'Etat artificial intelligence materials",
    category: "official_judicial_governance",
    recommendedCadence: "daily",
    priorityBand: "medium",
    freshHours: 24,
    watchHours: 96,
    staleHours: 192,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-cour-cassation-ai",
    label: "Cour de cassation artificial intelligence materials",
    category: "official_judicial_governance",
    recommendedCadence: "daily",
    priorityBand: "medium",
    freshHours: 24,
    watchHours: 96,
    staleHours: 192,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-newsapi-ai",
    label: "France AI legal news discovery (NewsAPI)",
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
    sourceId: "src-fr-major-press-newsapi-ai",
    label: "France AI legal major press (NewsAPI)",
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
    sourceId: "src-fr-gdelt-ai",
    label: "France AI legal news discovery (GDELT)",
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
  {
    sourceId: "src-fr-defenseur-droits-ai",
    label: "Defender of Rights artificial intelligence materials",
    category: "official_rights_authority",
    recommendedCadence: "daily",
    priorityBand: "medium",
    freshHours: 24,
    watchHours: 96,
    staleHours: 192,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
];

const franceSourceIds = new Set(franceMonitoringSourceRegistry.map((entry) => entry.sourceId));

export function isFranceMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    franceSourceIds.has(source.id) ||
    source.country === "France" ||
    source.jurisdiction === "France"
  );
}

export function getFranceSourceDescriptor(sourceId: string) {
  return franceMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
}

export function getFranceAgentSourceIds(profile: FranceAgentProfileId) {
  switch (profile) {
    case "france_live_news_scan":
      return franceMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "france_verification_scan":
      return franceMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "france_official_legal_scan":
    default:
      return franceMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getFranceSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "CNIL RSS remains the strongest official lightweight France live source today.",
      "NewsAPI and GDELT can accelerate France legal-news discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "Legifrance and judicial-institution sources should remain on a slower recurring cadence.",
      "This architecture is France-live ready, but it should not be described as guaranteed real time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
