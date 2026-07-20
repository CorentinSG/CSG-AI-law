import type { RegulationSource } from "@/agents/ai-regulation/types";
import { getFranceAgentSourceIds, isFranceMonitoringSource, type FranceAgentProfileId } from "@/agents/ai-regulation/franceNewsSources";
import { getEuAgentSourceIds, type EuAgentProfileId } from "@/agents/ai-regulation/euNewsSources";
import { getSpainAgentSourceIds, isSpainMonitoringSource, type SpainAgentProfileId } from "@/agents/ai-regulation/spainNewsSources";
import { getItalyAgentSourceIds, isItalyMonitoringSource, type ItalyAgentProfileId } from "@/agents/ai-regulation/italyNewsSources";
import { getGermanyAgentSourceIds, isGermanyMonitoringSource, type GermanyAgentProfileId } from "@/agents/ai-regulation/germanyNewsSources";
import { getNetherlandsAgentSourceIds, isNetherlandsMonitoringSource, type NetherlandsAgentProfileId } from "@/agents/ai-regulation/netherlandsNewsSources";
import { getBelgiumAgentSourceIds, isBelgiumMonitoringSource, type BelgiumAgentProfileId } from "@/agents/ai-regulation/belgiumNewsSources";
import { getAustriaAgentSourceIds, isAustriaMonitoringSource, type AustriaAgentProfileId } from "@/agents/ai-regulation/austriaNewsSources";
import { getSwedenAgentSourceIds, isSwedenMonitoringSource, type SwedenAgentProfileId } from "@/agents/ai-regulation/swedenNewsSources";
import { getIrelandAgentSourceIds, isIrelandMonitoringSource, type IrelandAgentProfileId } from "@/agents/ai-regulation/irelandNewsSources";
import { getInternationalAgentSourceIds, isInternationalMonitoringSource, type InternationalAgentProfileId } from "@/agents/ai-regulation/internationalNewsSources";

export const scanProfileIds = [
  "official_baseline_scan",
  "official_fast_scan",
  "live_news_discovery_scan",
  "verification_scan",
  "source_health_scan",
  "eu_official_legal_scan",
  "eu_live_news_discovery_scan",
  "eu_verification_scan",
  "france_official_legal_scan",
  "france_live_news_scan",
  "france_verification_scan",
  "spain_official_legal_scan",
  "spain_live_news_scan",
  "spain_verification_scan",
  "italy_official_legal_scan",
  "italy_live_news_scan",
  "italy_verification_scan",
  "germany_official_legal_scan",
  "germany_live_news_scan",
  "germany_verification_scan",
  "netherlands_official_legal_scan",
  "netherlands_live_news_scan",
  "netherlands_verification_scan",
  "belgium_official_legal_scan",
  "belgium_live_news_scan",
  "belgium_verification_scan",
  "austria_official_legal_scan",
  "austria_live_news_scan",
  "austria_verification_scan",
  "sweden_official_legal_scan",
  "sweden_live_news_scan",
  "sweden_verification_scan",
  "ireland_official_legal_scan",
  "ireland_live_news_scan",
  "ireland_verification_scan",
  "international_official_legal_scan",
  "international_live_news_scan",
  "international_verification_scan",
] as const;

export type ScanProfileId = (typeof scanProfileIds)[number];

export type SchedulerCapability = "daily_only" | "hourly" | "every_5_minutes";

export interface ScanProfileDefinition {
  id: ScanProfileId;
  label: string;
  description: string;
  targetInterval: string;
  sourceStrategy:
    | "official_only"
    | "official_fast"
    | "discovery_only"
    | "all_active"
    | "verification_only"
    | "eu_official_only"
    | "eu_live_only"
    | "eu_verification_only"
    | "france_official_only"
    | "france_live_only"
    | "france_verification_only"
    | "spain_official_only"
    | "spain_live_only"
    | "spain_verification_only"
    | "italy_official_only"
    | "italy_live_only"
    | "italy_verification_only"
    | "germany_official_only"
    | "germany_live_only"
    | "germany_verification_only"
    | "netherlands_official_only"
    | "netherlands_live_only"
    | "netherlands_verification_only"
    | "belgium_official_only"
    | "belgium_live_only"
    | "belgium_verification_only"
    | "austria_official_only"
    | "austria_live_only"
    | "austria_verification_only"
    | "sweden_official_only"
    | "sweden_live_only"
    | "sweden_verification_only"
    | "ireland_official_only"
    | "ireland_live_only"
    | "ireland_verification_only"
    | "international_official_only"
    | "international_live_only"
    | "international_verification_only";
  runsRecurringVerification: boolean;
  // Optional filter applied to sources during the recurring verification pass.
  // Replaces the hard-coded country switch in pipeline.ts (C2 optimisation).
  verificationFilter?: (source: RegulationSource) => boolean;
  // Maximum number of items to recheck in the recurring verification pass.
  // Defaults to 30 if not set; dedicated verification profiles use 60.
  verificationLimit?: number;
}

/**
 * Highest-value official feeds for the fast sweep: cheap RSS/API lanes whose
 * publications are legally significant the hour they land. Conditional
 * fetching (ETag/hash) keeps repeat polling nearly free.
 */
export const OFFICIAL_FAST_SOURCE_IDS = new Set([
  "src-cnil-ai",
  "src-curia-rss",
  "src-edpb-rss",
  "src-eu-commission-news-rss",
  "src-eur-lex-proposals-rss",
  "src-eur-lex-legislation-rss",
  "src-federal-register-ai",
]);

export const scanProfiles: Record<ScanProfileId, ScanProfileDefinition> = {
  official_baseline_scan: {
    id: "official_baseline_scan",
    label: "Official baseline scan",
    description:
      "Comprehensive official-source monitoring for the legal baseline. Intended for slower daily or hourly runs depending on source sensitivity.",
    targetInterval: "daily or hourly depending on source",
    sourceStrategy: "official_only",
    runsRecurringVerification: false,
  },
  official_fast_scan: {
    id: "official_fast_scan",
    label: "Priority official feeds fast sweep",
    description:
      "Cheap conditional-fetch sweep of the highest-value official RSS/API lanes (CNIL, CURIA, EDPB, Commission, EUR-Lex feeds, Federal Register) so a real legal event reaches the site within the hour instead of the next daily sweep.",
    targetInterval: "hourly via the worker self-scheduler; 15 minutes when capacity allows",
    sourceStrategy: "official_fast",
    runsRecurringVerification: false,
  },
  live_news_discovery_scan: {
    id: "live_news_discovery_scan",
    label: "Live news discovery scan",
    description:
      "Lightweight live-discovery pass for feeds, trackers, and discovery sources. Intended to be frequent, but still rate-limited and source respectful.",
    targetInterval: "every 5 minutes when infrastructure allows, otherwise hourly",
    sourceStrategy: "discovery_only",
    runsRecurringVerification: true,
  },
  verification_scan: {
    id: "verification_scan",
    label: "Verification scan",
    description:
      "Rechecks unresolved discovery leads and tries to locate or refresh official confirmation without scanning the full source set.",
    targetInterval: "hourly or more frequently when safe",
    sourceStrategy: "verification_only",
    runsRecurringVerification: true,
    verificationLimit: 60,
  },
  source_health_scan: {
    id: "source_health_scan",
    label: "Source health scan",
    description:
      "Accessibility and parser-health pass across active sources. Focuses on runtime reachability and diagnostics, not publication.",
    targetInterval: "daily",
    sourceStrategy: "all_active",
    runsRecurringVerification: false,
  },
  eu_official_legal_scan: {
    id: "eu_official_legal_scan",
    label: "Europe official legal scan",
    description:
      "Dedicated Europe official-source monitoring across EU institutions, selected Member State official sources, and standards/governance bodies.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "eu_official_only",
    runsRecurringVerification: false,
  },
  eu_live_news_discovery_scan: {
    id: "eu_live_news_discovery_scan",
    label: "Europe live news scan",
    description:
      "Dedicated Europe live-discovery loop for approved EU legal-news APIs, media leads, and discovery feeds.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "eu_live_only",
    runsRecurringVerification: true,
  },
  eu_verification_scan: {
    id: "eu_verification_scan",
    label: "Europe verification scan",
    description:
      "Dedicated Europe recurring verification pass for unresolved European discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "eu_verification_only",
    runsRecurringVerification: true,
  },
  france_official_legal_scan: {
    id: "france_official_legal_scan",
    label: "France official legal scan",
    description:
      "Dedicated France baseline scan across official guidance, legislation, judicial governance, and rights-authority sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "france_official_only",
    runsRecurringVerification: false,
  },
  france_live_news_scan: {
    id: "france_live_news_scan",
    label: "France live news scan",
    description:
      "Dedicated lightweight France live-discovery loop, centered on approved frequent sources such as CNIL when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "france_live_only",
    runsRecurringVerification: true,
    verificationFilter: isFranceMonitoringSource,
    verificationLimit: 30,
  },
  france_verification_scan: {
    id: "france_verification_scan",
    label: "France verification scan",
    description:
      "Dedicated France recurring verification pass for unresolved French discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "france_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isFranceMonitoringSource,
    verificationLimit: 60,
  },
  spain_official_legal_scan: {
    id: "spain_official_legal_scan",
    label: "Spain official legal scan",
    description:
      "Dedicated Spain baseline scan across official guidance, legislation, government implementation, and AI-supervision sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "spain_official_only",
    runsRecurringVerification: false,
  },
  spain_live_news_scan: {
    id: "spain_live_news_scan",
    label: "Spain live news scan",
    description:
      "Dedicated lightweight Spain live-discovery loop, centered on approved frequent sources such as AEPD when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "spain_live_only",
    runsRecurringVerification: true,
    verificationFilter: isSpainMonitoringSource,
    verificationLimit: 30,
  },
  spain_verification_scan: {
    id: "spain_verification_scan",
    label: "Spain verification scan",
    description:
      "Dedicated Spain recurring verification pass for unresolved Spanish discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "spain_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isSpainMonitoringSource,
    verificationLimit: 60,
  },
  italy_official_legal_scan: {
    id: "italy_official_legal_scan",
    label: "Italy official legal scan",
    description:
      "Dedicated Italy baseline scan across official guidance, legislation, digital-governance, and government-implementation sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "italy_official_only",
    runsRecurringVerification: false,
  },
  italy_live_news_scan: {
    id: "italy_live_news_scan",
    label: "Italy live news scan",
    description:
      "Dedicated lightweight Italy live-discovery loop, centered on approved frequent sources such as the Garante when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "italy_live_only",
    runsRecurringVerification: true,
    verificationFilter: isItalyMonitoringSource,
    verificationLimit: 30,
  },
  italy_verification_scan: {
    id: "italy_verification_scan",
    label: "Italy verification scan",
    description:
      "Dedicated Italy recurring verification pass for unresolved Italian discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "italy_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isItalyMonitoringSource,
    verificationLimit: 60,
  },
  germany_official_legal_scan: {
    id: "germany_official_legal_scan",
    label: "Germany official legal scan",
    description:
      "Dedicated Germany baseline scan across official guidance, consultations, parliamentary implementation, and government-implementation sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "germany_official_only",
    runsRecurringVerification: false,
  },
  germany_live_news_scan: {
    id: "germany_live_news_scan",
    label: "Germany live news scan",
    description:
      "Dedicated lightweight Germany live-discovery loop, centered on approved frequent sources such as BfDI AI materials when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "germany_live_only",
    runsRecurringVerification: true,
    verificationFilter: isGermanyMonitoringSource,
    verificationLimit: 30,
  },
  germany_verification_scan: {
    id: "germany_verification_scan",
    label: "Germany verification scan",
    description:
      "Dedicated Germany recurring verification pass for unresolved German discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "germany_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isGermanyMonitoringSource,
    verificationLimit: 60,
  },
  netherlands_official_legal_scan: {
    id: "netherlands_official_legal_scan",
    label: "Netherlands official legal scan",
    description:
      "Dedicated Netherlands baseline scan across official guidance, supervision, and government-implementation sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "netherlands_official_only",
    runsRecurringVerification: false,
  },
  netherlands_live_news_scan: {
    id: "netherlands_live_news_scan",
    label: "Netherlands live news scan",
    description:
      "Dedicated lightweight Netherlands live-discovery loop, centered on approved frequent sources such as AP and RDI when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "netherlands_live_only",
    runsRecurringVerification: true,
    verificationFilter: isNetherlandsMonitoringSource,
    verificationLimit: 30,
  },
  netherlands_verification_scan: {
    id: "netherlands_verification_scan",
    label: "Netherlands verification scan",
    description:
      "Dedicated Netherlands recurring verification pass for unresolved Dutch discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "netherlands_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isNetherlandsMonitoringSource,
    verificationLimit: 60,
  },
  belgium_official_legal_scan: {
    id: "belgium_official_legal_scan",
    label: "Belgium official legal scan",
    description:
      "Dedicated Belgium baseline scan across official guidance, supervision, and government-implementation sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "belgium_official_only",
    runsRecurringVerification: false,
  },
  belgium_live_news_scan: {
    id: "belgium_live_news_scan",
    label: "Belgium live news scan",
    description:
      "Dedicated lightweight Belgium live-discovery loop, centered on approved frequent sources such as the APD/GBA when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "belgium_live_only",
    runsRecurringVerification: true,
    verificationFilter: isBelgiumMonitoringSource,
    verificationLimit: 30,
  },
  belgium_verification_scan: {
    id: "belgium_verification_scan",
    label: "Belgium verification scan",
    description:
      "Dedicated Belgium recurring verification pass for unresolved Belgian discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "belgium_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isBelgiumMonitoringSource,
    verificationLimit: 60,
  },
  austria_official_legal_scan: {
    id: "austria_official_legal_scan",
    label: "Austria official legal scan",
    description:
      "Dedicated Austria baseline scan across official guidance, supervision, and government-implementation sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "austria_official_only",
    runsRecurringVerification: false,
  },
  austria_live_news_scan: {
    id: "austria_live_news_scan",
    label: "Austria live news scan",
    description:
      "Dedicated lightweight Austria live-discovery loop, centered on approved frequent sources such as the DSB when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "austria_live_only",
    runsRecurringVerification: true,
    verificationFilter: isAustriaMonitoringSource,
    verificationLimit: 30,
  },
  austria_verification_scan: {
    id: "austria_verification_scan",
    label: "Austria verification scan",
    description:
      "Dedicated Austria recurring verification pass for unresolved Austrian discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "austria_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isAustriaMonitoringSource,
    verificationLimit: 60,
  },
  sweden_official_legal_scan: {
    id: "sweden_official_legal_scan",
    label: "Sweden official legal scan",
    description:
      "Dedicated Sweden baseline scan across official guidance and government-implementation sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "sweden_official_only",
    runsRecurringVerification: false,
  },
  sweden_live_news_scan: {
    id: "sweden_live_news_scan",
    label: "Sweden live news scan",
    description:
      "Dedicated lightweight Sweden live-discovery loop, centered on approved frequent sources such as IMY when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "sweden_live_only",
    runsRecurringVerification: true,
    verificationFilter: isSwedenMonitoringSource,
    verificationLimit: 30,
  },
  sweden_verification_scan: {
    id: "sweden_verification_scan",
    label: "Sweden verification scan",
    description:
      "Dedicated Sweden recurring verification pass for unresolved Swedish discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "sweden_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isSwedenMonitoringSource,
    verificationLimit: 60,
  },
  ireland_official_legal_scan: {
    id: "ireland_official_legal_scan",
    label: "Ireland official legal scan",
    description:
      "Dedicated Ireland baseline scan across official guidance, data-protection authority, and government-implementation sources. The DPC is the primary anchor given its role as lead supervisory authority for many major AI and technology companies established in Ireland.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "ireland_official_only",
    runsRecurringVerification: false,
  },
  ireland_live_news_scan: {
    id: "ireland_live_news_scan",
    label: "Ireland live news scan",
    description:
      "Dedicated lightweight Ireland live-discovery loop, centered on DPC guidance and approved discovery sources when infrastructure and source rules allow.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "ireland_live_only",
    runsRecurringVerification: true,
    verificationFilter: isIrelandMonitoringSource,
    verificationLimit: 30,
  },
  ireland_verification_scan: {
    id: "ireland_verification_scan",
    label: "Ireland verification scan",
    description:
      "Dedicated Ireland recurring verification pass for unresolved Irish discovery leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "ireland_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isIrelandMonitoringSource,
    verificationLimit: 60,
  },
  international_official_legal_scan: {
    id: "international_official_legal_scan",
    label: "International official governance scan",
    description:
      "Dedicated International baseline scan across official transnational governance, soft-law, IP-policy, and standards-body sources.",
    targetInterval: "daily on Vercel Hobby, hourly or better on higher scheduler capability",
    sourceStrategy: "international_official_only",
    runsRecurringVerification: false,
  },
  international_live_news_scan: {
    id: "international_live_news_scan",
    label: "International live news scan",
    description:
      "Dedicated International live-discovery loop for global AI-law and governance reporting across serious media/discovery APIs.",
    targetInterval: "every 5 minutes when supported, otherwise daily on Vercel Hobby or hourly on a higher scheduler",
    sourceStrategy: "international_live_only",
    runsRecurringVerification: true,
    verificationFilter: isInternationalMonitoringSource,
    verificationLimit: 30,
  },
  international_verification_scan: {
    id: "international_verification_scan",
    label: "International verification scan",
    description:
      "Dedicated International recurring verification pass for unresolved transnational AI governance leads and official-source confirmation checks.",
    targetInterval: "hourly when safe, otherwise daily on Vercel Hobby",
    sourceStrategy: "international_verification_only",
    runsRecurringVerification: true,
    verificationFilter: isInternationalMonitoringSource,
    verificationLimit: 60,
  },
};

function getFranceProfileSourceIds(profileId: FranceAgentProfileId) {
  return new Set(getFranceAgentSourceIds(profileId));
}

function getEuProfileSourceIds(profileId: EuAgentProfileId) {
  return new Set(getEuAgentSourceIds(profileId));
}

function getSpainProfileSourceIds(profileId: SpainAgentProfileId) {
  return new Set(getSpainAgentSourceIds(profileId));
}

function getItalyProfileSourceIds(profileId: ItalyAgentProfileId) {
  return new Set(getItalyAgentSourceIds(profileId));
}

function getGermanyProfileSourceIds(profileId: GermanyAgentProfileId) {
  return new Set(getGermanyAgentSourceIds(profileId));
}

function getNetherlandsProfileSourceIds(profileId: NetherlandsAgentProfileId) {
  return new Set(getNetherlandsAgentSourceIds(profileId));
}

function getBelgiumProfileSourceIds(profileId: BelgiumAgentProfileId) {
  return new Set(getBelgiumAgentSourceIds(profileId));
}

function getAustriaProfileSourceIds(profileId: AustriaAgentProfileId) {
  return new Set(getAustriaAgentSourceIds(profileId));
}

function getSwedenProfileSourceIds(profileId: SwedenAgentProfileId) {
  return new Set(getSwedenAgentSourceIds(profileId));
}

function getIrelandProfileSourceIds(profileId: IrelandAgentProfileId) {
  return new Set(getIrelandAgentSourceIds(profileId));
}

function getInternationalProfileSourceIds(profileId: InternationalAgentProfileId) {
  return new Set(getInternationalAgentSourceIds(profileId));
}

function isDiscoveryCategory(source: RegulationSource) {
  const category =
    typeof source.config?.sourceCategory === "string"
      ? source.config.sourceCategory
      : null;

  return (
    source.sourceType === "tracker_source" ||
    source.sourceType === "discovery_source" ||
    source.sourceType === "media_source" ||
    category === "discovery_source" ||
    category === "media_discovery_source" ||
    category === "tracker_source"
  );
}

export function getScanProfile(profileId?: string | null): ScanProfileDefinition | null {
  if (!profileId) return null;
  if ((scanProfileIds as readonly string[]).includes(profileId)) {
    return scanProfiles[profileId as ScanProfileId];
  }
  return null;
}

export function selectSourcesForScanProfile(
  sources: RegulationSource[],
  profileId?: ScanProfileId,
) {
  if (!profileId) {
    return sources;
  }

  const profile = scanProfiles[profileId];
  switch (profile.sourceStrategy) {
    case "official_only":
      return sources.filter((source) => !isDiscoveryCategory(source));
    case "official_fast":
      return sources.filter((source) => OFFICIAL_FAST_SOURCE_IDS.has(source.id));
    case "discovery_only":
      return sources.filter((source) => isDiscoveryCategory(source));
    case "verification_only":
      return [];
    case "eu_official_only": {
      const euIds = getEuProfileSourceIds("eu_official_legal_scan");
      return sources.filter((source) => euIds.has(source.id));
    }
    case "eu_live_only": {
      const euIds = getEuProfileSourceIds("eu_live_news_discovery_scan");
      return sources.filter((source) => euIds.has(source.id));
    }
    case "eu_verification_only":
      return [];
    case "france_official_only": {
      const franceIds = getFranceProfileSourceIds("france_official_legal_scan");
      return sources.filter((source) => franceIds.has(source.id));
    }
    case "france_live_only": {
      const franceIds = getFranceProfileSourceIds("france_live_news_scan");
      return sources.filter((source) => franceIds.has(source.id));
    }
    case "france_verification_only":
      return [];
    case "spain_official_only": {
      const spainIds = getSpainProfileSourceIds("spain_official_legal_scan");
      return sources.filter((source) => spainIds.has(source.id));
    }
    case "spain_live_only": {
      const spainIds = getSpainProfileSourceIds("spain_live_news_scan");
      return sources.filter((source) => spainIds.has(source.id));
    }
    case "spain_verification_only":
      return [];
    case "italy_official_only": {
      const italyIds = getItalyProfileSourceIds("italy_official_legal_scan");
      return sources.filter((source) => italyIds.has(source.id));
    }
    case "italy_live_only": {
      const italyIds = getItalyProfileSourceIds("italy_live_news_scan");
      return sources.filter((source) => italyIds.has(source.id));
    }
    case "italy_verification_only":
      return [];
    case "germany_official_only": {
      const germanyIds = getGermanyProfileSourceIds("germany_official_legal_scan");
      return sources.filter((source) => germanyIds.has(source.id));
    }
    case "germany_live_only": {
      const germanyIds = getGermanyProfileSourceIds("germany_live_news_scan");
      return sources.filter((source) => germanyIds.has(source.id));
    }
    case "germany_verification_only":
      return [];
    case "netherlands_official_only": {
      const netherlandsIds = getNetherlandsProfileSourceIds("netherlands_official_legal_scan");
      return sources.filter((source) => netherlandsIds.has(source.id));
    }
    case "netherlands_live_only": {
      const netherlandsIds = getNetherlandsProfileSourceIds("netherlands_live_news_scan");
      return sources.filter((source) => netherlandsIds.has(source.id));
    }
    case "netherlands_verification_only":
      return [];
    case "belgium_official_only": {
      const belgiumIds = getBelgiumProfileSourceIds("belgium_official_legal_scan");
      return sources.filter((source) => belgiumIds.has(source.id));
    }
    case "belgium_live_only": {
      const belgiumIds = getBelgiumProfileSourceIds("belgium_live_news_scan");
      return sources.filter((source) => belgiumIds.has(source.id));
    }
    case "belgium_verification_only":
      return [];
    case "austria_official_only": {
      const austriaIds = getAustriaProfileSourceIds("austria_official_legal_scan");
      return sources.filter((source) => austriaIds.has(source.id));
    }
    case "austria_live_only": {
      const austriaIds = getAustriaProfileSourceIds("austria_live_news_scan");
      return sources.filter((source) => austriaIds.has(source.id));
    }
    case "austria_verification_only":
      return [];
    case "sweden_official_only": {
      const swedenIds = getSwedenProfileSourceIds("sweden_official_legal_scan");
      return sources.filter((source) => swedenIds.has(source.id));
    }
    case "sweden_live_only": {
      const swedenIds = getSwedenProfileSourceIds("sweden_live_news_scan");
      return sources.filter((source) => swedenIds.has(source.id));
    }
    case "sweden_verification_only":
      return [];
    case "ireland_official_only": {
      const irelandIds = getIrelandProfileSourceIds("ireland_official_legal_scan");
      return sources.filter((source) => irelandIds.has(source.id));
    }
    case "ireland_live_only": {
      const irelandIds = getIrelandProfileSourceIds("ireland_live_news_scan");
      return sources.filter((source) => irelandIds.has(source.id));
    }
    case "ireland_verification_only":
      return [];
    case "international_official_only": {
      const internationalIds = getInternationalProfileSourceIds("international_official_legal_scan");
      return sources.filter((source) => internationalIds.has(source.id));
    }
    case "international_live_only": {
      const internationalIds = getInternationalProfileSourceIds("international_live_news_scan");
      return sources.filter((source) => internationalIds.has(source.id));
    }
    case "international_verification_only":
      return [];
    case "all_active":
    default:
      return sources;
  }
}

export function getSchedulerRecommendation(capability: SchedulerCapability) {
  if (capability === "every_5_minutes") {
    return {
      liveNewsCron: "*/5 * * * *",
      officialBaselineCron: "0 * * * *",
      limitation:
        null as string | null,
    };
  }

  if (capability === "hourly") {
    return {
      liveNewsCron: "0 * * * *",
      officialBaselineCron: "0 12 * * *",
      limitation:
        "A five-minute live discovery loop is not available on the current scheduler capability, so live news falls back to hourly execution.",
    };
  }

  return {
    liveNewsCron: null as string | null,
    officialBaselineCron: "0 12 * * *",
    limitation:
      "The current scheduler capability does not safely support a five-minute live discovery loop, and Vercel Hobby cannot deploy more-than-daily cron expressions. The architecture is five-minute ready, but the deployed fallback remains daily on-platform unless a higher scheduler capability or external scheduler is used.",
  };
}
