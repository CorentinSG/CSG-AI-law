import {
  aiLawNewsSourceConfigs,
  getAiLawNewsSourceConfigByName,
  type AiLawNewsSourceConfig,
} from "@/content/ai-regulation/news-sources";
import type { RegulationSource } from "@/agents/ai-regulation/types";

export const euSourceAuthorityLevels = [
  "official_eu_primary",
  "official_member_state",
  "standards_governance_body",
  "secondary_tracker",
  "media_legal_press",
  "informal_discovery",
] as const;

export type EuSourceAuthorityLevel = (typeof euSourceAuthorityLevels)[number];

export interface EuNewsSourceDescriptor {
  sourceId?: string;
  id: string;
  name: string;
  sourceAuthorityLevel: EuSourceAuthorityLevel;
  official: boolean;
  region: "Europe" | "International";
  category:
    | "official_eu"
    | "official_member_state"
    | "soft_law_or_standards"
    | "tracker"
    | "media"
    | "discovery";
}

export const euNewsSourceRegistry: EuNewsSourceDescriptor[] = [
  {
    id: "eu-ai-office",
    sourceId: "src-eu-ai-office",
    name: "European AI Office",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "eu-commission-ai",
    sourceId: "src-eu-commission-ai",
    name: "European Commission AI and Digital Strategy pages",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "eu-commission-news-rss",
    sourceId: "src-eu-commission-news-rss",
    name: "European Commission Highlighted News RSS",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "eur-lex",
    sourceId: "src-eur-lex-ai",
    name: "EUR-Lex",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "eur-lex-ai-act",
    sourceId: "src-eur-lex-ai-act",
    name: "EUR-Lex AI Act consolidated text",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "eur-lex-proposals-rss",
    sourceId: "src-eur-lex-proposals-rss",
    name: "EUR-Lex Commission proposals RSS",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "eur-lex-legislation-rss",
    sourceId: "src-eur-lex-legislation-rss",
    name: "EUR-Lex legislation RSS",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "edpb-ai",
    sourceId: "src-edpb-ai",
    name: "European Data Protection Board Artificial Intelligence",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "edpb-rss",
    sourceId: "src-edpb-rss",
    name: "EDPB official RSS",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "edps-ai",
    sourceId: "src-edps-ai",
    name: "European Data Protection Supervisor Artificial Intelligence",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "curia-rss",
    sourceId: "src-curia-rss",
    name: "CURIA press releases RSS",
    sourceAuthorityLevel: "official_eu_primary",
    official: true,
    region: "Europe",
    category: "official_eu",
  },
  {
    id: "cnil-ai",
    sourceId: "src-cnil-ai",
    name: "CNIL Artificial Intelligence",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "legifrance-ai",
    sourceId: "src-fr-legifrance-ai",
    name: "Legifrance AI legal texts",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "conseil-etat-ai",
    sourceId: "src-fr-conseil-etat-ai",
    name: "Conseil d'Etat artificial intelligence materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "cour-cassation-ai",
    sourceId: "src-fr-cour-cassation-ai",
    name: "Cour de cassation artificial intelligence materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "defender-rights-ai",
    sourceId: "src-fr-defenseur-droits-ai",
    name: "Defender of Rights artificial intelligence materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "aepd-ai",
    sourceId: "src-es-aepd-ai",
    name: "AEPD AI and Innovation",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "aesia-ai",
    sourceId: "src-es-aesia-ai",
    name: "AESIA official materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "boe-ai",
    sourceId: "src-es-boe-ai",
    name: "BOE AI legal texts",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "moncloa-ai",
    sourceId: "src-es-moncloa-ai",
    name: "La Moncloa AI governance materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "garante-ai",
    sourceId: "src-it-garante-ai",
    name: "Garante AI topic and decisions",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "agid-ai",
    sourceId: "src-it-agid-ai",
    name: "AgID artificial intelligence materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "normattiva-ai",
    sourceId: "src-it-normattiva-ai",
    name: "Normattiva Italian AI legal texts",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "dtd-ai",
    sourceId: "src-it-dtd-ai",
    name: "Digital Transformation Department AI materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "assemblee-ai",
    name: "Assemblee nationale AI materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "senat-ai",
    name: "Senat AI materials",
    sourceAuthorityLevel: "official_member_state",
    official: true,
    region: "Europe",
    category: "official_member_state",
  },
  {
    id: "council-of-europe-ai",
    sourceId: "src-council-europe-ai",
    name: "Council of Europe Artificial Intelligence",
    sourceAuthorityLevel: "standards_governance_body",
    official: true,
    region: "Europe",
    category: "soft_law_or_standards",
  },
  {
    id: "oecd-ai",
    sourceId: "src-oecd-ai",
    name: "OECD AI policy materials",
    sourceAuthorityLevel: "standards_governance_body",
    official: true,
    region: "International",
    category: "soft_law_or_standards",
  },
  {
    id: "iapp-trackers",
    name: "IAPP AI governance trackers and news",
    sourceAuthorityLevel: "secondary_tracker",
    official: false,
    region: "International",
    category: "tracker",
  },
  {
    id: "reuters-legal",
    name: "Reuters Legal / Technology / Regulation",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "International",
    category: "media",
  },
  {
    id: "politico-europe",
    name: "Politico Europe",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "euractiv-tech",
    name: "Euractiv Technology",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-newsapi-discovery",
    sourceId: "src-eu-newsapi-ai",
    name: "European AI legal news discovery (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-major-press-newsapi",
    sourceId: "src-eu-major-press-newsapi-ai",
    name: "Europe AI legal major press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-gdelt-discovery",
    sourceId: "src-eu-gdelt-ai",
    name: "European AI legal news discovery (GDELT)",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "Europe",
    category: "discovery",
  },
  {
    id: "spain-newsapi-discovery",
    sourceId: "src-es-newsapi-ai",
    name: "Spain AI legal news discovery (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "spain-major-press-newsapi",
    sourceId: "src-es-major-press-newsapi-ai",
    name: "Spain AI legal major press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "spain-gdelt-discovery",
    sourceId: "src-es-gdelt-ai",
    name: "Spain AI legal news discovery (GDELT)",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "Europe",
    category: "discovery",
  },
  {
    id: "italy-newsapi-discovery",
    sourceId: "src-it-newsapi-ai",
    name: "Italy AI legal news discovery (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "italy-major-press-newsapi",
    sourceId: "src-it-major-press-newsapi-ai",
    name: "Italy AI legal major press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "italy-gdelt-discovery",
    sourceId: "src-it-gdelt-ai",
    name: "Italy AI legal news discovery (GDELT)",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "Europe",
    category: "discovery",
  },
  {
    id: "global-policy-watch-eu",
    sourceId: "src-global-policy-watch-eu",
    name: "Global Policy Watch European Union category",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "Europe",
    category: "discovery",
  },
  {
    id: "global-policy-watch-ai",
    sourceId: "src-global-policy-watch-ai",
    name: "Global Policy Watch AI category",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "International",
    category: "discovery",
  },
  {
    id: "ai-weekly",
    sourceId: "src-ai-weekly-news-today",
    name: "AI Weekly / AI News Today",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "International",
    category: "discovery",
  },
];

function descriptorByNormalizedName(name: string) {
  const normalized = name.toLowerCase();
  return (
    euNewsSourceRegistry.find(
      (entry) =>
        entry.name.toLowerCase() === normalized ||
        normalized.includes(entry.name.toLowerCase()) ||
        entry.name.toLowerCase().includes(normalized),
    ) ?? null
  );
}

export function getEuSourceDescriptor(
  source:
    | Pick<RegulationSource, "name" | "region" | "sourceType">
    | null
    | undefined,
) {
  if (!source) return null;

  const registryMatch = descriptorByNormalizedName(source.name);
  if (registryMatch) {
    return registryMatch;
  }

  const configured = getAiLawNewsSourceConfigByName(source.name);
  if (configured) {
    return buildDescriptorFromNewsConfig(configured);
  }

  if (source.region === "Europe") {
    if (source.sourceType === "court_database" || source.sourceType === "legislative_database") {
      return {
        id: source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: source.name,
        sourceAuthorityLevel: "official_member_state",
        official: true,
        region: "Europe",
        category: "official_member_state",
      } satisfies EuNewsSourceDescriptor;
    }

    return {
      id: source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: source.name,
      sourceAuthorityLevel: "official_eu_primary",
      official: true,
      region: "Europe",
      category: "official_eu",
    } satisfies EuNewsSourceDescriptor;
  }

  return null;
}

function buildDescriptorFromNewsConfig(
  source: AiLawNewsSourceConfig,
): EuNewsSourceDescriptor | null {
  if (source.region !== "Europe" && source.region !== "International") {
    return null;
  }

  if (source.sourceType === "official_source") {
    return {
      id: source.id,
      name: source.name,
      sourceAuthorityLevel: "official_eu_primary",
      official: true,
      region: source.region,
      category: "official_eu",
    };
  }

  if (source.sourceType === "tracker_database") {
    return {
      id: source.id,
      name: source.name,
      sourceAuthorityLevel: "secondary_tracker",
      official: false,
      region: source.region,
      category: "tracker",
    };
  }

  if (source.sourceType === "legal_regulatory_press") {
    return {
      id: source.id,
      name: source.name,
      sourceAuthorityLevel: "media_legal_press",
      official: false,
      region: source.region,
      category: "media",
    };
  }

  return {
    id: source.id,
    name: source.name,
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: source.region,
    category: "discovery",
  };
}

export function getEuNewsSourceConfigs() {
  return aiLawNewsSourceConfigs.filter(
    (source) => source.region === "Europe" || source.region === "International",
  );
}

export type EuAgentProfileId =
  | "eu_official_legal_scan"
  | "eu_live_news_discovery_scan"
  | "eu_verification_scan";

const euProfileSourceIds = {
  eu_official_legal_scan: euNewsSourceRegistry
    .filter((entry) => entry.official && entry.sourceId)
    .map((entry) => entry.sourceId as string),
  eu_live_news_discovery_scan: euNewsSourceRegistry
    .filter((entry) => !entry.official && entry.sourceId)
    .map((entry) => entry.sourceId as string),
  eu_verification_scan: [] as string[],
} as const satisfies Record<EuAgentProfileId, string[]>;

export function getEuAgentSourceIds(profileId: EuAgentProfileId) {
  return [...euProfileSourceIds[profileId]];
}
