import {
  assessCitationQuality,
  getCitationReferences,
  type SourceReference,
} from "@/agents/ai-regulation/citations";
import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { extractVerificationMetadata } from "@/agents/ai-regulation/verification";
import { slugify } from "@/lib/utils";
import {
  getAiLawNewsSourceConfigByName,
  type AiLawNewsSourceReliability,
  type AiLawNewsSourceType,
} from "@/content/ai-regulation/news-sources";
import type { NewsItemRecord } from "@/agents/ai-regulation/governance";

export const aiLawNewsVerificationStatuses = [
  "official_verified",
  "official_source_found",
  "corroborated",
  "needs_official_source",
  "discovery_only",
  "media_reported",
  "needs_review",
  "rejected",
  "converted_to_monitor_item",
  "published_news",
] as const;

export type AiLawNewsVerificationStatus =
  (typeof aiLawNewsVerificationStatuses)[number];

export type AiLawNewsDatePrecision =
  | "exact"
  | "month"
  | "year"
  | "not_detected"
  | "requires_verification";

export interface AiLawNewsItem {
  id: string;
  title: string;
  slug: string;
  shortSummary: string;
  fullSummary: string;
  detectedAt: string;
  eventDate: string | null;
  publicationDate: string | null;
  lastVerifiedAt: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceType: AiLawNewsSourceType;
  sourceReliability: AiLawNewsSourceReliability;
  sourceJurisdiction: string;
  jurisdiction: string;
  region: string;
  countryOrState: string;
  legalArea: string;
  topicTags: string[];
  authorityType: string;
  developmentType: string;
  verificationStatus: AiLawNewsVerificationStatus;
  officialSourceFound: boolean;
  officialSourceUrl: string | null;
  sourceReferences: SourceReference[];
  corroboratingSources: SourceReference[];
  exactDateOfInformation: string | null;
  datePrecision: AiLawNewsDatePrecision;
  citationQuality: string;
  publicVisibilityStatus: "public" | "admin_only";
  reviewerNotes: string;
  relatedMonitorItemId: string | null;
  /** Optional OG/header image URL for visual news cards. Never required; never fabricated. */
  imageUrl?: string | null;
}

export type NormalizedNewsItemRecord = AiLawNewsItem &
  Pick<
    NewsItemRecord,
    "rawItemId" | "regulatoryUpdateId" | "createdAt" | "updatedAt"
  >;

export interface NewsFilterParams {
  region?: string;
  jurisdiction?: string;
  sourceType?: string;
  verificationStatus?: string;
  topic?: string;
  developmentType?: string;
  date?: string;
}

type NewsVerificationLabelInput = Pick<
  AiLawNewsItem,
  "sourceType" | "officialSourceFound" | "verificationStatus" | "sourceName"
>;

function sourceTypeFor(source: RegulationSource | null): AiLawNewsSourceType {
  if (!source) return "official_source";
  if (isDiscoverySource(source)) return "informal_discovery_source";
  const configured = getAiLawNewsSourceConfigByName(source.name);
  return configured?.sourceType ?? "official_source";
}

function reliabilityFor(source: RegulationSource | null): AiLawNewsSourceReliability {
  if (!source) return "official_authority";
  if (isDiscoverySource(source)) return "informal_discovery";
  const configured = getAiLawNewsSourceConfigByName(source.name);
  return configured?.reliabilityLevel ?? "official_authority";
}

function isDiscoverySource(source: RegulationSource | null) {
  if (!source) return false;
  return isDiscoveryOnlySource(source) || /\bdiscovery only\b/i.test(source.name);
}

function isInternalOnlyUpdate(update: AiRegulatoryUpdate) {
  return update.tags.some((tag) => /^(internal-only|smoke-test)$/i.test(tag));
}

function verificationStatusFor(input: {
  update: AiRegulatoryUpdate;
  source: RegulationSource | null;
  citationEligible: boolean;
  officialSourceFound: boolean;
  corroboratingSources: SourceReference[];
}): AiLawNewsVerificationStatus {
  if (input.update.status === "published" && input.citationEligible) {
    return "published_news";
  }
  if (input.corroboratingSources.length > 0) {
    return "corroborated";
  }
  if (isDiscoverySource(input.source)) {
    return input.officialSourceFound ? "needs_review" : "discovery_only";
  }
  return input.officialSourceFound ? "official_verified" : "needs_review";
}

const LEGAL_NEWS_DEVELOPMENT_TYPES = new Set([
  "Binding law",
  "Regulation",
  "Agency guidance",
  "Enforcement action",
  "Court decision",
  "Case law",
  "Legislative proposal",
  "Consultation",
  "Policy",
]);

function hasLegalNewsSignals(input: {
  update: AiRegulatoryUpdate;
  sourceType: AiLawNewsSourceType;
}) {
  const legalArea = input.update.legalArea.toLowerCase();
  const developmentType = input.update.developmentType;
  const tags = input.update.tags.map((tag) => tag.toLowerCase());

  const legalAreaLooksLegal =
    /(law|legal|regulat|compliance|privacy|data|cloud|court|case|litig|governance|consumer|employment|finance|copyright|competition)/i
      .test(legalArea);
  const legalTagPresent = tags.some((tag) =>
    /(law|legal|regulat|privacy|data|cloud|court|case|litig|compliance|governance|enforcement)/i.test(
      tag,
    ),
  );

  if (input.sourceType === "official_source") return true;
  if (LEGAL_NEWS_DEVELOPMENT_TYPES.has(developmentType)) return true;
  return legalAreaLooksLegal || legalTagPresent;
}

function isNewsPublicBySourceQuality(input: {
  update: AiRegulatoryUpdate;
  sourceType: AiLawNewsSourceType;
  sourceReliability: AiLawNewsSourceReliability;
  officialSourceFound: boolean;
  citationEligible: boolean;
  corroboratingSources: SourceReference[];
}) {
  const legalSignals = hasLegalNewsSignals({
    update: input.update,
    sourceType: input.sourceType,
  });

  if (isInternalOnlyUpdate(input.update)) return false;
  if (input.sourceType === "informal_discovery_source") return false;
  if (input.update.status === "published") return true;
  if (input.officialSourceFound && input.citationEligible && legalSignals) return true;
  if (input.corroboratingSources.length > 0 && legalSignals) return true;

  if (input.sourceReliability === "official_authority") {
    return input.citationEligible && legalSignals;
  }

  if (input.sourceReliability === "reputable_secondary") {
    return (
      input.citationEligible &&
      legalSignals &&
      input.update.confidenceLevel !== "low" &&
      input.update.importanceLevel !== "low"
    );
  }

  return false;
}

function datePrecisionFor(item: AiRegulatoryUpdate): AiLawNewsDatePrecision {
  if (item.publicationDate) return "exact";
  return "requires_verification";
}

export function buildNewsItemFromUpdate(input: {
  update: AiRegulatoryUpdate;
  rawItem: RawRegulatoryItem | null;
  source: RegulationSource | null;
}): AiLawNewsItem {
  const sourceReferences = getCitationReferences(input);
  const citationAssessment = assessCitationQuality(sourceReferences);
  const verification = input.rawItem
    ? extractVerificationMetadata(input.rawItem)
    : null;
  const officialSourceFound =
    verification?.officialSourceFound ?? citationAssessment.primaryOfficialSource !== null;
  const officialSourceUrl =
    verification?.officialSourceUrl ??
    citationAssessment.primaryOfficialSource?.url ??
    null;
  const eventDate = input.update.publicationDate;
  const sourceReliability = reliabilityFor(input.source);
  const corroboratingSources = sourceReferences.filter(
    (reference) =>
      reference.sourceRole === "supporting" ||
      reference.sourceRole === "official_confirmation",
  );
  const publicBySourceQuality = isNewsPublicBySourceQuality({
    update: input.update,
    sourceType: sourceTypeFor(input.source),
    sourceReliability,
    officialSourceFound,
    citationEligible: citationAssessment.publicationEligible,
    corroboratingSources,
  });
  const sourceType = sourceTypeFor(input.source);

  return {
    id: `news-${input.update.id}`,
    title: input.update.title,
    slug: slugify(`${input.update.title}-${input.update.id}`),
    shortSummary: input.update.oneSentenceSummary,
    fullSummary: input.update.summary,
    detectedAt: input.update.detectedDate,
    eventDate,
    publicationDate: input.update.publicationDate,
    lastVerifiedAt:
      verification?.lastVerifiedAt ??
      citationAssessment.primaryOfficialSource?.lastVerifiedAt ??
      null,
    sourceName: input.update.sourceName,
    sourceUrl: input.update.sourceUrl,
    sourceType,
    sourceReliability,
    sourceJurisdiction: input.source?.jurisdiction ?? input.update.jurisdiction,
    jurisdiction: input.update.jurisdiction,
    region: input.update.region,
    countryOrState: input.update.country,
    legalArea: input.update.legalArea,
    topicTags: input.update.tags,
    authorityType: input.update.developmentType,
    developmentType: input.update.developmentType,
    verificationStatus: verificationStatusFor({
      update: input.update,
      source: input.source,
      citationEligible: citationAssessment.publicationEligible,
      officialSourceFound,
      corroboratingSources,
    }),
    officialSourceFound,
    officialSourceUrl,
    sourceReferences,
    corroboratingSources,
    exactDateOfInformation: eventDate,
    datePrecision: datePrecisionFor(input.update),
    citationQuality: citationAssessment.qualityStatus,
    publicVisibilityStatus: publicBySourceQuality ? "public" : "admin_only",
    reviewerNotes:
      input.update.status === "published"
        ? "Published news derived from a source-verified AI Regulation Monitor entry."
        : publicBySourceQuality
          ? "Automatically public news item based on serious source quality, official confirmation, or cross-source corroboration."
          : "Admin-only news lead; not public until reviewed.",
    relatedMonitorItemId: publicBySourceQuality ? input.update.id : null,
  };
}

export function normalizeNewsItemRecord(
  item: NewsItemRecord,
): NormalizedNewsItemRecord {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    shortSummary: item.shortSummary,
    fullSummary: item.fullSummary,
    detectedAt: item.detectedAt,
    eventDate: item.eventDate,
    publicationDate: item.publicationDate,
    lastVerifiedAt: item.lastVerifiedAt,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    sourceType: item.sourceType as AiLawNewsSourceType,
    sourceReliability: item.sourceReliability as AiLawNewsSourceReliability,
    sourceJurisdiction: item.sourceJurisdiction,
    jurisdiction: item.jurisdiction,
    region: item.region,
    countryOrState: item.countryOrState,
    legalArea: item.legalArea,
    topicTags: item.topicTags,
    authorityType: item.authorityType,
    developmentType: item.developmentType,
    verificationStatus: item.verificationStatus as AiLawNewsVerificationStatus,
    officialSourceFound: item.officialSourceFound,
    officialSourceUrl: item.officialSourceUrl,
    sourceReferences: item.sourceReferences ?? [],
    corroboratingSources: item.corroboratingSources ?? [],
    exactDateOfInformation: item.exactDateOfInformation,
    datePrecision: item.datePrecision as AiLawNewsDatePrecision,
    citationQuality: item.citationQuality,
    publicVisibilityStatus: item.publicVisibilityStatus,
    reviewerNotes: item.reviewerNotes,
    relatedMonitorItemId: item.relatedMonitorItemId,
    rawItemId: item.rawItemId,
    regulatoryUpdateId: item.regulatoryUpdateId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function filterNewsItems(items: AiLawNewsItem[], params: NewsFilterParams) {
  return items.filter((item) => {
    if (params.region && params.region !== "all" && item.region !== params.region) {
      return false;
    }
    if (
      params.jurisdiction &&
      params.jurisdiction !== "all" &&
      item.jurisdiction !== params.jurisdiction
    ) {
      return false;
    }
    if (
      params.sourceType &&
      params.sourceType !== "all" &&
      item.sourceType !== params.sourceType
    ) {
      return false;
    }
    if (
      params.verificationStatus &&
      params.verificationStatus !== "all" &&
      item.verificationStatus !== params.verificationStatus
    ) {
      return false;
    }
    if (
      params.topic &&
      params.topic !== "all" &&
      !item.topicTags.includes(params.topic)
    ) {
      return false;
    }
    if (
      params.developmentType &&
      params.developmentType !== "all" &&
      item.developmentType !== params.developmentType
    ) {
      return false;
    }
    if (
      params.date &&
      params.date !== "all" &&
      item.publicationDate !== params.date
    ) {
      return false;
    }

    return true;
  });
}

export function getNewsVerificationLabel(item: NewsVerificationLabelInput) {
  if (item.sourceType === "official_source" && item.officialSourceFound) {
    return "Official source";
  }
  if (item.verificationStatus === "corroborated") {
    return "Corroborated by official source";
  }
  if (item.sourceType === "legal_regulatory_press") {
    return `Reported by ${item.sourceName} - official source pending`;
  }
  if (item.sourceType === "informal_discovery_source") {
    return "Discovery lead - requires verification";
  }
  return item.verificationStatus.replaceAll("_", " ");
}
