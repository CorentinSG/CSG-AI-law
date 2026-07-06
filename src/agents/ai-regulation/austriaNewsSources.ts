import type { RegulationSource } from "@/agents/ai-regulation/types";

export const austriaAgentProfileIds = [
  "austria_official_legal_scan",
  "austria_live_news_scan",
  "austria_verification_scan",
] as const;

export type AustriaAgentProfileId = (typeof austriaAgentProfileIds)[number];

export interface AustriaMonitoringSourceDescriptor {
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

export const austriaMonitoringSourceRegistry: AustriaMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-at-dsb-ai",
    label: "Datenschutzbehörde — AI and data-protection oversight",
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
    sourceId: "src-at-ris-ai-law",
    label: "RIS - Austrian AI legislation and consolidated law",
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
    sourceId: "src-at-ris-ai-case-law",
    label: "RIS - Austrian AI and automated-decision case law",
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
    sourceId: "src-at-digital-austria-ai",
    label: "Digital Austria — federal AI strategy and digital policy",
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
    sourceId: "src-at-rtr-ai",
    label: "RTR — media and communications regulatory authority",
    category: "official_supervision_feed",
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
    sourceId: "src-at-newsapi-ai",
    label: "Austria AI legal news discovery (NewsAPI)",
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
    sourceId: "src-at-gdelt-ai",
    label: "Austria AI legal news discovery (GDELT)",
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

const austriaSourceIds = new Set(
  austriaMonitoringSourceRegistry.map((entry) => entry.sourceId),
);

export function isAustriaMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    austriaSourceIds.has(source.id) ||
    source.country === "Austria" ||
    source.jurisdiction === "Austria"
  );
}

export function getAustriaSourceDescriptor(sourceId: string) {
  return (
    austriaMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null
  );
}

export function getAustriaAgentSourceIds(profile: AustriaAgentProfileId) {
  switch (profile) {
    case "austria_live_news_scan":
      return austriaMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "austria_verification_scan":
      return austriaMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "austria_official_legal_scan":
    default:
      return austriaMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getAustriaSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "The DSB (Datenschutzbehörde) is the primary lightweight Austria live source most suited to frequent refresh given its active AI and GDPR enforcement posture.",
      "Digital Austria and RTR materials should remain on a slower daily cadence because they are authoritative but less suited to aggressive polling.",
      "NewsAPI and GDELT can accelerate Austria AI-law discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "Austria's DSB is closely linked to NOYB (Max Schrems), which regularly files complaints with the DSB on AI and data-processing matters; DSB decisions therefore warrant close monitoring.",
      "This architecture is Austria live-ready, but it should not be described as guaranteed real-time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
