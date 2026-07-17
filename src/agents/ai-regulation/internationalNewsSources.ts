import type { RegulationSource } from "@/agents/ai-regulation/types";

export const internationalAgentProfileIds = [
  "international_official_legal_scan",
  "international_live_news_scan",
  "international_verification_scan",
] as const;

export type InternationalAgentProfileId = (typeof internationalAgentProfileIds)[number];

export interface InternationalMonitoringSourceDescriptor {
  sourceId: string;
  label: string;
  organization: "OECD" | "UNESCO" | "ISO" | "IEEE" | "WIPO" | "United Nations" | "OWASP" | "Global";
  category:
    | "official_soft_law"
    | "official_governance_framework"
    | "technical_standard"
    | "ip_policy"
    | "best_practice"
    | "discovery_media_feed";
  official: boolean;
  recommendedCadence:
    | "every_5_minutes_when_supported"
    | "hourly_fallback"
    | "daily"
    | "weekly";
  priorityBand: "high" | "medium" | "low";
  liveMonitoringEligible: boolean;
  baselineEligible: boolean;
  verificationEligible: boolean;
}

export const internationalMonitoringSourceRegistry: InternationalMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-oecd-ai",
    label: "OECD AI Policy Observatory",
    organization: "OECD",
    category: "official_governance_framework",
    official: true,
    recommendedCadence: "daily",
    priorityBand: "high",
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-unesco-ai-ethics",
    label: "UNESCO Recommendation on the Ethics of AI",
    organization: "UNESCO",
    category: "official_soft_law",
    official: true,
    recommendedCadence: "weekly",
    priorityBand: "high",
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-un-ai-advisory-body",
    label: "UN High-Level Advisory Body on AI",
    organization: "United Nations",
    category: "official_governance_framework",
    official: true,
    recommendedCadence: "weekly",
    priorityBand: "high",
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-wipo-ai-ip",
    label: "WIPO AI and IP Clearing House",
    organization: "WIPO",
    category: "ip_policy",
    official: true,
    recommendedCadence: "weekly",
    priorityBand: "medium",
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-iso-42001",
    label: "ISO/IEC 42001 official metadata",
    organization: "ISO",
    category: "technical_standard",
    official: true,
    recommendedCadence: "weekly",
    priorityBand: "high",
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-ieee-7000",
    label: "IEEE 7000-2021 official standard page",
    organization: "IEEE",
    category: "technical_standard",
    official: true,
    recommendedCadence: "weekly",
    priorityBand: "medium",
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-owasp-aima",
    label: "OWASP AI Maturity Assessment",
    organization: "OWASP",
    category: "best_practice",
    official: false,
    recommendedCadence: "weekly",
    priorityBand: "medium",
    liveMonitoringEligible: false,
    baselineEligible: true,
    verificationEligible: false,
  },
  {
    sourceId: "src-international-newsapi-ai",
    label: "International AI legal major press (NewsAPI)",
    organization: "Global",
    category: "discovery_media_feed",
    official: false,
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-international-gdelt-ai",
    label: "International AI legal news discovery (GDELT)",
    organization: "Global",
    category: "discovery_media_feed",
    official: false,
    recommendedCadence: "hourly_fallback",
    priorityBand: "medium",
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-global-policy-watch-ai",
    label: "Global Policy Watch AI category",
    organization: "Global",
    category: "discovery_media_feed",
    official: false,
    recommendedCadence: "daily",
    priorityBand: "low",
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: true,
  },
];

const internationalSourceIds = new Set(
  internationalMonitoringSourceRegistry.map((entry) => entry.sourceId),
);

export function isInternationalMonitoringSource(
  source: Pick<RegulationSource, "id" | "region" | "country" | "jurisdiction"> | null | undefined,
) {
  if (!source) return false;
  return (
    internationalSourceIds.has(source.id) ||
    source.region === "International" ||
    source.country === "International" ||
    ["OECD", "UNESCO", "ISO", "IEEE", "WIPO", "United Nations"].includes(source.jurisdiction)
  );
}

export function getInternationalSourceDescriptor(sourceId: string) {
  return internationalMonitoringSourceRegistry.find((entry) => entry.sourceId === sourceId) ?? null;
}

export function getInternationalAgentSourceIds(profile: InternationalAgentProfileId) {
  switch (profile) {
    case "international_live_news_scan":
      return internationalMonitoringSourceRegistry
        .filter((entry) => entry.liveMonitoringEligible)
        .map((entry) => entry.sourceId);
    case "international_verification_scan":
      return internationalMonitoringSourceRegistry
        .filter((entry) => entry.verificationEligible)
        .map((entry) => entry.sourceId);
    case "international_official_legal_scan":
    default:
      return internationalMonitoringSourceRegistry
        .filter((entry) => entry.baselineEligible)
        .map((entry) => entry.sourceId);
  }
}

export function getInternationalSchedulerGuidance() {
  return {
    liveTarget: "hourly when infrastructure allows, five-minute ready for major-press/API feeds",
    safeFallback: "daily until each organization-specific endpoint proves stable",
    notes: [
      "International is a cross-border governance layer, not a substitute for Europe or US jurisdictional monitoring.",
      "Official international sources can feed the legal database as soft law, governance frameworks, standards, or policy reports, but not as binding national law by default.",
      "NewsAPI, GDELT, and Global Policy Watch remain discovery-only unless a serious-source/publication rule or official-source confirmation applies.",
      "Paywalled standards text must not be reproduced; monitor only official public metadata and publication status.",
    ],
  };
}
