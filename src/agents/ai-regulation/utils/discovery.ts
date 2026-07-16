import type { RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";

export interface DiscoverySourcePolicy {
  sourceType: "discovery_source" | "media_discovery_source";
  official: false;
  authorityLevel: "secondary" | "non_official";
  publicationAllowed: false;
  requiresOfficialSourceConfirmation: true;
  requiresCrossSourceVerification: true;
}

export interface DiscoveryLeadMetadata {
  isDiscoveryLead: boolean;
  headline: string | null;
  discoverySourceName: string | null;
  discoverySourceUrl: string | null;
  outboundUrl: string | null;
  detectedDate: string | null;
  possibleJurisdiction: string | null;
  possibleTopic: string | null;
  possibleLegalArea: string | null;
  possibleAuthorityType: string | null;
  possibleOfficialSourceFound: boolean;
  possibleOfficialSourceUrl: string | null;
  corroboratingSourceFound: boolean;
  corroboratingSourceUrl: string | null;
  verificationStatus: string | null;
  conversionStatus: string | null;
  reviewerNotes: string | null;
}

export function getDiscoverySourcePolicy(
  source: Pick<RegulationSource, "config"> | null | undefined,
): DiscoverySourcePolicy | null {
  if (!source?.config || typeof source.config !== "object") {
    return null;
  }

  if (
    source.config.sourceCategory !== "discovery_source" &&
    source.config.sourceCategory !== "media_discovery_source"
  ) {
    return null;
  }

  return {
    sourceType:
      source.config.sourceCategory === "media_discovery_source"
        ? "media_discovery_source"
        : "discovery_source",
    official: false,
    authorityLevel:
      source.config.sourceCategory === "media_discovery_source"
        ? "secondary"
        : "non_official",
    publicationAllowed: false,
    requiresOfficialSourceConfirmation: true,
    requiresCrossSourceVerification: true,
  };
}

export function isDiscoveryOnlySource(
  source: Pick<RegulationSource, "config"> | null | undefined,
) {
  return getDiscoverySourcePolicy(source) !== null;
}

export function isMediaDiscoverySource(
  source: Pick<RegulationSource, "config"> | null | undefined,
) {
  return getDiscoverySourcePolicy(source)?.sourceType === "media_discovery_source";
}

export function extractDiscoveryLeadMetadata(
  rawItem: Pick<RawRegulatoryItem, "rawTitle" | "rawUrl" | "detectedAt" | "rawMetadata">,
): DiscoveryLeadMetadata | null {
  const metadata = rawItem.rawMetadata;
  if (!metadata || metadata.discoveryLead !== true) {
    return null;
  }

  return {
    isDiscoveryLead: true,
    headline:
      typeof metadata.discoveryHeadline === "string"
        ? metadata.discoveryHeadline
        : rawItem.rawTitle,
    discoverySourceName:
      typeof metadata.discoverySourceName === "string"
        ? metadata.discoverySourceName
        : null,
    discoverySourceUrl:
      typeof metadata.discoverySourceUrl === "string"
        ? metadata.discoverySourceUrl
        : null,
    outboundUrl:
      typeof metadata.discoveryOutboundUrl === "string"
        ? metadata.discoveryOutboundUrl
        : rawItem.rawUrl,
    detectedDate:
      typeof metadata.discoveryDetectedDate === "string"
        ? metadata.discoveryDetectedDate
        : rawItem.detectedAt,
    possibleJurisdiction:
      typeof metadata.possibleJurisdiction === "string"
        ? metadata.possibleJurisdiction
        : null,
    possibleTopic:
      typeof metadata.possibleTopic === "string" ? metadata.possibleTopic : null,
    possibleLegalArea:
      typeof metadata.legalAreaHint === "string" ? metadata.legalAreaHint : null,
    possibleAuthorityType:
      typeof metadata.authorityTypeHint === "string"
        ? metadata.authorityTypeHint
        : null,
    possibleOfficialSourceFound: metadata.possibleOfficialSourceFound === true,
    possibleOfficialSourceUrl:
      typeof metadata.possibleOfficialSourceUrl === "string"
        ? metadata.possibleOfficialSourceUrl
        : null,
    corroboratingSourceFound: metadata.corroboratingSourceFound === true,
    corroboratingSourceUrl:
      typeof metadata.corroboratingSourceUrl === "string"
        ? metadata.corroboratingSourceUrl
        : null,
    verificationStatus:
      typeof metadata.discoveryVerificationStatus === "string"
        ? metadata.discoveryVerificationStatus
        : null,
    conversionStatus:
      typeof metadata.discoveryConversionStatus === "string"
        ? metadata.discoveryConversionStatus
        : null,
    reviewerNotes:
      typeof metadata.discoveryReviewerNotes === "string"
        ? metadata.discoveryReviewerNotes
        : null,
  };
}
