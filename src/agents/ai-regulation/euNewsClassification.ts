import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import { getEuSourceDescriptor } from "@/agents/ai-regulation/euNewsSources";

export const euDevelopmentTypes = [
  "EU regulation",
  "implementing act",
  "delegated act",
  "Commission guidance",
  "AI Office update",
  "GPAI Code update",
  "EDPB guidance",
  "EDPS guidance",
  "DPA guidance",
  "Member State implementation",
  "national law",
  "draft law",
  "consultation",
  "enforcement action",
  "administrative decision",
  "court decision",
  "parliamentary development",
  "standardisation update",
  "soft law",
  "technical standard",
  "governance framework",
  "legal press report",
  "discovery lead",
  "other",
] as const;

export type EuDevelopmentType = (typeof euDevelopmentTypes)[number];

export interface EuNewsClassification {
  sourceAuthorityLevel: string;
  sourceAccessStatus: "accessible" | "blocked_or_unknown";
  institution: string;
  country: string;
  legalEffect: string;
  hardLaw: boolean;
  softLaw: boolean;
  caseLaw: boolean;
  enforcement: boolean;
  developmentType: EuDevelopmentType;
  importanceRank: number;
  rankingReason: string;
}

function normalizedHaystack(item: Pick<
  AiLawNewsItem,
  "title" | "shortSummary" | "developmentType" | "authorityType" | "topicTags" | "sourceName"
>) {
  return [
    item.title,
    item.shortSummary,
    item.developmentType,
    item.authorityType,
    item.sourceName,
    ...item.topicTags,
  ]
    .join(" ")
    .toLowerCase();
}

export function classifyEuNewsItem(item: AiLawNewsItem): EuNewsClassification {
  const descriptor = getEuSourceDescriptor({
    name: item.sourceName,
    region: item.region,
    sourceType:
      item.sourceType === "official_source"
        ? "regulator_page"
        : item.sourceType === "tracker_database"
          ? "tracker_source"
          : item.sourceType === "legal_regulatory_press"
            ? "media_source"
            : "discovery_source",
  });
  const text = normalizedHaystack(item);

  let developmentType: EuDevelopmentType = "other";
  if (item.sourceType === "legal_regulatory_press") developmentType = "legal press report";
  else if (item.sourceType === "informal_discovery_source") developmentType = "discovery lead";
  else if (/implementing act/.test(text)) developmentType = "implementing act";
  else if (/delegated act/.test(text)) developmentType = "delegated act";
  else if (/ai office/.test(text)) developmentType = "AI Office update";
  else if (/gpai|general-purpose ai|code of practice/.test(text)) developmentType = "GPAI Code update";
  else if (/edpb/.test(text)) developmentType = "EDPB guidance";
  else if (/edps/.test(text)) developmentType = "EDPS guidance";
  else if (/cnil|dpa guidance|data protection authority/.test(text)) developmentType = "DPA guidance";
  else if (/member state|competent authority|implementation/.test(text)) developmentType = "Member State implementation";
  else if (/national law|member state law|statute/.test(text)) developmentType = "national law";
  else if (/draft law|bill|proposal/.test(text)) developmentType = "draft law";
  else if (/consultation/.test(text)) developmentType = "consultation";
  else if (/enforcement/.test(text)) developmentType = "enforcement action";
  else if (/administrative decision/.test(text)) developmentType = "administrative decision";
  else if (/court|curia|judgment|decision/.test(text) && /case|ecli|cjeu|court/.test(text)) developmentType = "court decision";
  else if (/parliament|council/.test(text)) developmentType = "parliamentary development";
  else if (/technical standard/.test(text)) developmentType = "technical standard";
  else if (/standard|cenelec|cen|iso|owasp/.test(text)) developmentType = "standardisation update";
  else if (/soft law/.test(text)) developmentType = "soft law";
  else if (/governance framework|oecd/.test(text)) developmentType = "governance framework";
  else if (/regulation|official journal|eur-lex/.test(text)) developmentType = "EU regulation";
  else if (/guidance/.test(text)) developmentType = "Commission guidance";

  const hardLaw =
    developmentType === "EU regulation" ||
    developmentType === "implementing act" ||
    developmentType === "delegated act" ||
    developmentType === "national law" ||
    developmentType === "draft law" ||
    developmentType === "Member State implementation";
  const softLaw =
    developmentType === "Commission guidance" ||
    developmentType === "AI Office update" ||
    developmentType === "GPAI Code update" ||
    developmentType === "EDPB guidance" ||
    developmentType === "EDPS guidance" ||
    developmentType === "DPA guidance" ||
    developmentType === "soft law" ||
    developmentType === "technical standard" ||
    developmentType === "governance framework" ||
    developmentType === "standardisation update";
  const caseLaw = developmentType === "court decision";
  const enforcement =
    developmentType === "enforcement action" || developmentType === "administrative decision";

  let importanceRank = 20;
  let rankingReason = "Recent Europe-visible legal signal.";

  if (item.sourceType === "official_source") {
    importanceRank += 40;
    rankingReason = "Official-source EU or Member State legal development.";
  }
  if (hardLaw) {
    importanceRank += 35;
    rankingReason = "Binding or proposed hard-law development with Europe-wide relevance.";
  } else if (caseLaw || enforcement) {
    importanceRank += 28;
    rankingReason = "Judicial or enforcement development with concrete legal effect.";
  } else if (softLaw) {
    importanceRank += 20;
    rankingReason = "Official guidance or governance material relevant to AI Act application.";
  }
  if (item.officialSourceFound) {
    importanceRank += 18;
  }
  if (item.jurisdiction === "European Union") {
    importanceRank += 16;
  }
  if (/ai act/.test(text)) {
    importanceRank += 12;
  }

  return {
    sourceAuthorityLevel: descriptor?.sourceAuthorityLevel ?? "informal_discovery",
    sourceAccessStatus: item.sourceUrl ? "accessible" : "blocked_or_unknown",
    institution: descriptor?.name ?? item.sourceName,
    country: item.countryOrState || "European Union",
    legalEffect: hardLaw
      ? "May affect binding AI law obligations or formal implementation posture once reviewed."
      : caseLaw
        ? "May affect interpretation or application of AI-related legal rules once reviewed."
        : enforcement
          ? "May signal regulatory enforcement or administrative posture once reviewed."
          : softLaw
            ? "May affect guidance, interpretation, compliance expectations, or governance posture."
            : "Requires review before legal effect is characterized.",
    hardLaw,
    softLaw,
    caseLaw,
    enforcement,
    developmentType,
    importanceRank,
    rankingReason,
  };
}
