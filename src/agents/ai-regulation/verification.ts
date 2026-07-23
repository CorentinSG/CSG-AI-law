import { z } from "zod";

import type { RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import {
  extractDiscoveryLeadMetadata,
  isDiscoveryOnlySource,
} from "@/agents/ai-regulation/utils/discovery";

export const verificationStatuses = [
  "discovery_only",
  "needs_official_source",
  "official_source_found",
  "corroborated",
  "verified_for_review",
  "rejected",
  "published",
] as const;

export type VerificationStatus = (typeof verificationStatuses)[number];

export interface VerificationMetadata {
  initialDetectionSource: string;
  initialSourceOfficial: boolean;
  initialSourceType: string;
  sourceUrl: string;
  detectedAt: string;
  lastVerifiedAt: string | null;
  verificationStatus: VerificationStatus;
  officialSourceFound: boolean;
  officialSourceUrl: string | null;
  corroboratingSourcesCount: number;
  corroboratingSourceUrls: string[];
  confidenceLevel: "high" | "medium" | "low";
  reviewerNotes: string;
  publicVisibilityAllowed: boolean;
  nextSuggestedVerificationSource: string;
  notPublishableReason: string | null;
  stale: boolean;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function inferInitialSourceType(source: RegulationSource) {
  if (typeof source.config?.sourceCategory === "string") {
    return source.config.sourceCategory;
  }

  if (typeof source.config?.authorityLevel === "string") {
    return source.config.authorityLevel;
  }

  return source.sourceType;
}

export function suggestVerificationSource(input: {
  possibleJurisdiction: string | null;
  possibleTopic: string | null;
  sourceCountry: string;
}) {
  const scope = `${input.possibleJurisdiction ?? ""} ${input.possibleTopic ?? ""} ${input.sourceCountry}`;

  if (/european union|eu ai act|ai office|commission|edpb|edps/i.test(scope)) {
    return "Check European Commission, EU AI Office, EUR-Lex, EDPB, or EDPS official pages.";
  }

  if (/france|cnil/i.test(scope)) {
    return "Check CNIL, Legifrance, French government, Assemblée nationale, or Sénat sources.";
  }

  if (/united states|federal|state|bill|legislation/i.test(scope)) {
    return "Check Federal Register, Congress.gov, state legislature, governor, agency, or official court sources.";
  }

  if (/court|case|litigation|decision|judgment/i.test(scope)) {
    return "Check the official court docket, order, judgment database, or a reliable lawful court-record source.";
  }

  return "Identify the underlying regulator, legislature, court, standards body, or government source.";
}

export function buildInitialVerificationMetadata(input: {
  source: RegulationSource;
  rawItem: Pick<RawRegulatoryItem, "rawTitle" | "rawUrl" | "detectedAt" | "rawMetadata">;
}): VerificationMetadata {
  const discovery = extractDiscoveryLeadMetadata(input.rawItem);
  const discoveryOnly = isDiscoveryOnlySource(input.source);
  const initialSourceOfficial = !discoveryOnly;
  const officialSourceUrl =
    discovery?.possibleOfficialSourceUrl ??
    (initialSourceOfficial ? input.rawItem.rawUrl : null);
  const officialSourceFound = Boolean(officialSourceUrl) && initialSourceOfficial;
  const corroboratingSourceUrls = stringArray(
    input.rawItem.rawMetadata.corroboratingSourceUrls,
  );
  const possibleJurisdiction = discovery?.possibleJurisdiction ?? input.source.jurisdiction;
  const possibleTopic = discovery?.possibleTopic ?? null;

  if (discoveryOnly) {
    const candidateOfficialUrl = discovery?.possibleOfficialSourceUrl ?? null;
    const status: VerificationStatus = candidateOfficialUrl
      ? "official_source_found"
      : "needs_official_source";

    return {
      initialDetectionSource: input.source.name,
      initialSourceOfficial: false,
      initialSourceType: inferInitialSourceType(input.source),
      sourceUrl: input.rawItem.rawUrl,
      detectedAt: input.rawItem.detectedAt,
      lastVerifiedAt: null,
      verificationStatus: status,
      officialSourceFound: Boolean(candidateOfficialUrl),
      officialSourceUrl: candidateOfficialUrl,
      corroboratingSourcesCount: corroboratingSourceUrls.length,
      corroboratingSourceUrls,
      confidenceLevel: "low",
      reviewerNotes:
        "Non-official discovery lead. Keep private until an official source is verified and corroboration is reviewed.",
      publicVisibilityAllowed: false,
      nextSuggestedVerificationSource: suggestVerificationSource({
        possibleJurisdiction,
        possibleTopic,
        sourceCountry: input.source.country,
      }),
      notPublishableReason:
        "Discovery/media/secondary source cannot support publication without official-source verification and human review.",
      stale: false,
    };
  }

  return {
    initialDetectionSource: input.source.name,
    initialSourceOfficial,
    initialSourceType: inferInitialSourceType(input.source),
    sourceUrl: input.rawItem.rawUrl,
    detectedAt: input.rawItem.detectedAt,
    lastVerifiedAt: new Date().toISOString(),
    verificationStatus: officialSourceFound ? "verified_for_review" : "needs_official_source",
    officialSourceFound,
    officialSourceUrl,
    corroboratingSourcesCount: corroboratingSourceUrls.length,
    corroboratingSourceUrls,
    confidenceLevel: officialSourceFound ? "medium" : "low",
    reviewerNotes:
      "Official-source item. Human review is still required before approval or publication.",
    publicVisibilityAllowed: officialSourceFound,
    nextSuggestedVerificationSource:
      "Check related official sources and corroborating references where available before publication.",
    notPublishableReason: null,
    stale: false,
  };
}

// W1.7: rawMetadata.verification is JSON written by several script
// generations — a blind cast let one malformed field crash citation
// assessment and the data-steward report. Each field falls back to its
// safest value instead (fail-closed: never grants official/public standing).
const verificationMetadataSchema = z.object({
  initialDetectionSource: z.string().catch(""),
  initialSourceOfficial: z.boolean().catch(false),
  initialSourceType: z.string().catch("unknown"),
  sourceUrl: z.string().catch(""),
  detectedAt: z.string().catch(""),
  lastVerifiedAt: z.string().nullable().catch(null),
  verificationStatus: z.enum(verificationStatuses).catch("needs_official_source"),
  officialSourceFound: z.boolean().catch(false),
  officialSourceUrl: z.string().nullable().catch(null),
  corroboratingSourcesCount: z.number().catch(0),
  corroboratingSourceUrls: z.array(z.string()).catch([]),
  confidenceLevel: z.enum(["high", "medium", "low"]).catch("low"),
  reviewerNotes: z.string().catch(""),
  publicVisibilityAllowed: z.boolean().catch(false),
  nextSuggestedVerificationSource: z.string().catch(""),
  notPublishableReason: z.string().nullable().catch(null),
  stale: z.boolean().catch(false),
});

export function extractVerificationMetadata(
  rawItem: Pick<RawRegulatoryItem, "rawMetadata">,
): VerificationMetadata | null {
  const value = rawItem.rawMetadata.verification;
  if (!value || typeof value !== "object") return null;

  const parsed = verificationMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isVerificationStatus(input: string): input is VerificationStatus {
  return verificationStatuses.includes(input as VerificationStatus);
}
