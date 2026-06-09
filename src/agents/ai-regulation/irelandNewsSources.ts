import type { RegulationSource } from "@/agents/ai-regulation/types";

export const irelandAgentProfileIds = [
  "ireland_official_legal_scan",
  "ireland_live_news_scan",
  "ireland_verification_scan",
] as const;

export type IrelandAgentProfileId = (typeof irelandAgentProfileIds)[number];

export interface IrelandMonitoringSourceDescriptor {
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

export const irelandMonitoringSourceRegistry: IrelandMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-ie-dpc-ai",
    label: "DPC (Data Protection Commission) — AI and data-protection oversight",
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
    sourceId: "src-ie-dete-ai",
    label: "Department of Enterprise, Trade and Employment — AI and digital regulation",
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
    sourceId: "src-ie-gov-ai",
    label: "gov.ie — Irish Government official portal",
    category: "official_government_implementation",
    recommendedCadence: "daily",
    priorityBand: "low",
    freshHours: 24,
    watchHours: 72,
    staleHours: 168,
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-ie-newsapi-ai",
    label: "Ireland AI legal news discovery (NewsAPI)",
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
    sourceId: "src-ie-gdelt-ai",
    label: "Ireland AI legal news discovery (GDELT)",
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

const irelandSourceIds = new Set(
  irelandMonitoringSourceRegistry.map((entry) => entry.sourceId),
);

export function isIrelandMonitoringSource(
  source: Pick<RegulationSource, "id" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    irelandSourceIds.has(source.id) ||
    source.country === "Ireland" ||
    source.jurisdiction === "Ireland"
  );
}

export function getIrelandSourceDescriptor(sourceId: string) {
  return (
    irelandMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null
  );
}

export function getIrelandAgentSourceIds(profile: IrelandAgentProfileId) {
  switch (profile) {
    case "ireland_live_news_scan":
      return irelandMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "ireland_verification_scan":
      return irelandMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "ireland_official_legal_scan":
    default:
      return irelandMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getIrelandSchedulerGuidance() {
  return {
    liveTarget: "every 5 minutes when infrastructure allows",
    safeFallback: "hourly or daily depending on source weight",
    notes: [
      "The DPC (Data Protection Commission) is the primary Ireland live source, best suited to frequent refresh given its role as Ireland's DPA, EDPB member, and lead supervisory authority for many large AI and technology companies whose EU headquarters are in Ireland.",
      "The DPC has active GDPR enforcement activity on AI-related processing, including inquiries into major technology companies' use of personal data for AI training purposes.",
      "DETE and gov.ie should remain on a daily cadence as authoritative government-context anchors, not suited to aggressive polling.",
      "NewsAPI and GDELT can accelerate Ireland AI-law discovery, but they remain discovery-only and never count as legal authority by themselves.",
      "Ireland's status as the EU establishment of many major AI companies gives the DPC's actions heightened practical relevance under both GDPR and the AI Act; this should be reflected in monitoring priority, not in overclaiming DPC's AI Act role.",
      "This architecture is Ireland live-ready, but should not be described as guaranteed real-time on infrastructure that cannot schedule at five-minute intervals.",
    ],
  };
}
