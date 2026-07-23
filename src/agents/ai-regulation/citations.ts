import type {
  AiRegulatoryUpdate,
  ExtractedCandidateItem,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { extractVerificationMetadata } from "@/agents/ai-regulation/verification";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";

export const citationQualityStatuses = [
  "complete",
  "partial",
  "missing_official_source",
  "missing_pinpoint",
  "vague_source",
  "inaccessible_source",
  "discovery_only",
  "needs_manual_verification",
] as const;

export type CitationQualityStatus = (typeof citationQualityStatuses)[number];

export type SourceReferenceRole =
  | "primary"
  | "supporting"
  | "discovery"
  | "official_confirmation";

export type SourceReferenceType =
  | "official"
  | "court"
  | "regulator"
  | "government"
  | "parliament"
  | "legislation"
  | "policy"
  | "standards_body"
  | "discovery_source"
  | "media_source"
  | "tracker";

export interface SourcePinpoint {
  article?: string;
  recital?: string;
  section?: string;
  paragraph?: string;
  page?: string;
  annex?: string;
  docket?: string;
  billNumber?: string;
  ruleNumber?: string;
  CELEX?: string;
  ECLI?: string;
  caseNumber?: string;
}

export interface SourceReference {
  sourceRole: SourceReferenceRole;
  title: string;
  institution: string;
  url: string;
  canonicalUrl?: string | null;
  sourceType: SourceReferenceType;
  authorityType?: string | null;
  publicationDate?: string | null;
  detectedAt?: string | null;
  retrievedAt?: string | null;
  lastVerifiedAt?: string | null;
  jurisdiction?: string | null;
  documentType?: string | null;
  excerpt?: string | null;
  pinpoint?: SourcePinpoint | null;
  reliabilityLevel: "high" | "medium" | "low";
  verificationStatus: string;
  archivedUrl?: string | null;
  accessLimitations?: string | null;
  notes?: string | null;
}

export interface CitationAssessment {
  qualityStatus: CitationQualityStatus;
  publicationEligible: boolean;
  warnings: string[];
  primaryOfficialSource: SourceReference | null;
}

function sourceTypeFor(source: RegulationSource): SourceReferenceType {
  if (isDiscoveryOnlySource(source)) return "discovery_source";
  if (source.sourceType === "legislative_database") return "official";
  if (source.sourceType === "regulator_page" || source.sourceType === "RSS") {
    return "regulator";
  }
  if (/iso|owasp|nist|oecd/i.test(source.name)) return "standards_body";
  return "official";
}

const SOURCE_REFERENCE_TYPES: readonly SourceReferenceType[] = [
  "official", "court", "regulator", "government", "parliament", "legislation",
  "policy", "standards_body", "discovery_source", "media_source", "tracker",
];

function parseSourceReferences(value: unknown): SourceReference[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is SourceReference => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<SourceReference>;
      return (
        typeof candidate.title === "string" &&
        typeof candidate.institution === "string" &&
        typeof candidate.url === "string" &&
        typeof candidate.sourceRole === "string"
      );
    })
    // W1.7: references come from JSON written across several script
    // generations — a missing field used to crash assessCitationQuality
    // (`verificationStatus.includes`). Normalize with fail-closed defaults:
    // malformed data never gains official standing or trust.
    .map((reference) => ({
      ...reference,
      verificationStatus:
        typeof reference.verificationStatus === "string"
          ? reference.verificationStatus
          : "needs_manual_verification",
      reliabilityLevel:
        reference.reliabilityLevel === "high" ||
        reference.reliabilityLevel === "medium" ||
        reference.reliabilityLevel === "low"
          ? reference.reliabilityLevel
          : "low",
      sourceType: SOURCE_REFERENCE_TYPES.includes(reference.sourceType)
        ? reference.sourceType
        : "media_source",
      pinpoint:
        reference.pinpoint && typeof reference.pinpoint === "object"
          ? reference.pinpoint
          : null,
    }));
}

export function getSourceReferencesFromRawItem(
  rawItem: Pick<RawRegulatoryItem, "rawMetadata"> | null,
) {
  return parseSourceReferences(rawItem?.rawMetadata.sourceReferences);
}

export function buildCandidateSourceReference(input: {
  source: RegulationSource;
  candidate: ExtractedCandidateItem;
  retrievedAt: string;
}): SourceReference {
  const discovery = isDiscoveryOnlySource(input.source);
  const metadata = input.candidate.metadata ?? {};
  const institution =
    typeof metadata.sourceInstitution === "string"
      ? metadata.sourceInstitution
      : input.source.name;

  return {
    sourceRole: discovery ? "discovery" : "primary",
    title: input.candidate.title,
    institution,
    url: input.candidate.url,
    canonicalUrl:
      typeof metadata.canonicalUrl === "string" ? metadata.canonicalUrl : input.candidate.url,
    sourceType: sourceTypeFor(input.source),
    authorityType: input.candidate.authorityTypeHint ?? null,
    publicationDate: input.candidate.publicationDate ?? null,
    detectedAt: input.candidate.detectedAt ?? null,
    retrievedAt: input.retrievedAt,
    lastVerifiedAt: discovery ? null : input.retrievedAt,
    jurisdiction: input.candidate.jurisdictionHint ?? input.source.jurisdiction,
    documentType: input.candidate.developmentTypeHint ?? null,
    excerpt: input.candidate.excerpt ?? null,
    pinpoint:
      metadata.pinpoint && typeof metadata.pinpoint === "object"
        ? (metadata.pinpoint as SourcePinpoint)
        : {},
    reliabilityLevel: input.source.reliabilityLevel,
    verificationStatus: discovery ? "needs_official_source" : "verified_for_review",
    archivedUrl:
      typeof metadata.archivedUrl === "string" ? metadata.archivedUrl : null,
    notes:
      typeof metadata.accessLimitations === "string"
        ? metadata.accessLimitations
        : discovery
          ? "Discovery source only; not legal authority."
          : "Official or authoritative source captured by the monitoring pipeline.",
  };
}

export function getCitationReferences(input: {
  update: AiRegulatoryUpdate;
  rawItem: RawRegulatoryItem | null;
  source: RegulationSource | null;
}): SourceReference[] {
  const structured = getSourceReferencesFromRawItem(input.rawItem);
  if (structured.length > 0) return structured;

  const source = input.source;
  const verification = input.rawItem
    ? extractVerificationMetadata(input.rawItem)
    : null;
  const official = source ? !isDiscoveryOnlySource(source) : false;

  return [
    {
      sourceRole: official ? "primary" : "discovery",
      title: input.update.title,
      institution: input.update.sourceName,
      url: input.update.sourceUrl,
      canonicalUrl: input.update.sourceUrl,
      // An unresolvable source must never default to official authority.
      sourceType: source ? sourceTypeFor(source) : "media_source",
      authorityType: input.update.developmentType,
      publicationDate: input.update.publicationDate,
      detectedAt: input.update.detectedDate,
      retrievedAt: input.rawItem?.detectedAt ?? input.update.detectedDate,
      lastVerifiedAt:
        verification?.lastVerifiedAt ??
        (official ? input.rawItem?.detectedAt ?? input.update.detectedDate : null),
      jurisdiction: input.update.jurisdiction,
      documentType: input.update.developmentType,
      excerpt: null,
      pinpoint: {},
      reliabilityLevel: source?.reliabilityLevel ?? "medium",
      verificationStatus:
        verification?.verificationStatus ??
        (official ? "verified_for_review" : "needs_official_source"),
      archivedUrl: null,
      notes: source?.notes ?? "Fallback citation generated from update metadata.",
    },
  ];
}

function isOfficialLike(reference: SourceReference) {
  return (
    reference.sourceType === "official" ||
    reference.sourceType === "court" ||
    reference.sourceType === "regulator" ||
    reference.sourceType === "government" ||
    reference.sourceType === "parliament" ||
    reference.sourceType === "legislation" ||
    reference.sourceType === "policy" ||
    reference.sourceType === "standards_body"
  );
}

function hasAnyPinpoint(pinpoint: SourcePinpoint | null | undefined) {
  if (!pinpoint) return false;
  return Object.values(pinpoint).some((value) => Boolean(value));
}

function shouldExpectPinpoint(reference: SourceReference) {
  const authority = reference.authorityType?.toLowerCase() ?? "";
  const documentType = reference.documentType?.toLowerCase() ?? "";
  const title = reference.title.toLowerCase();

  if (/agency guidance|soft law|governance framework|best practice/.test(authority)) {
    return false;
  }

  return (
    /binding law|proposed law|regulation|final rule|bill|statute|case law|court|enforcement action/.test(
      authority,
    ) ||
    /regulation|rule|bill|statute|judgment|decision|case/.test(documentType) ||
    /regulation|directive|act|bill|judgment|decision|case/.test(title)
  );
}

function isInaccessible(reference: SourceReference) {
  return (
    reference.verificationStatus.includes("blocked") ||
    reference.verificationStatus.includes("inaccessible") ||
    reference.accessLimitations?.toLowerCase().includes("response status") === true
  );
}

export function assessCitationQuality(references: SourceReference[]): CitationAssessment {
  const warnings: string[] = [];
  const primaryOfficialSource =
    references.find(
      (reference) => reference.sourceRole === "primary" && isOfficialLike(reference),
    ) ??
    references.find((reference) => isOfficialLike(reference)) ??
    null;

  if (!primaryOfficialSource) {
    const discoveryOnly = references.some(
      (reference) =>
        reference.sourceType === "discovery_source" ||
        reference.sourceType === "media_source" ||
        reference.sourceType === "tracker",
    );
    warnings.push("No official or authoritative source reference is attached.");
    return {
      qualityStatus: discoveryOnly ? "discovery_only" : "missing_official_source",
      publicationEligible: false,
      warnings,
      primaryOfficialSource: null,
    };
  }

  if (!primaryOfficialSource.url) warnings.push("Source URL is missing.");
  if (!primaryOfficialSource.title) warnings.push("Source title is missing.");
  if (!primaryOfficialSource.institution) warnings.push("Source institution is missing.");
  if (!primaryOfficialSource.authorityType) warnings.push("Authority type is missing.");
  if (!primaryOfficialSource.publicationDate && !primaryOfficialSource.retrievedAt) {
    warnings.push("Publication or retrieval date is missing.");
  }
  if (!primaryOfficialSource.lastVerifiedAt) warnings.push("Last verified date is missing.");
  if (isInaccessible(primaryOfficialSource)) {
    warnings.push("Primary official source is inaccessible or blocked from runtime verification.");
  }
  if (
    shouldExpectPinpoint(primaryOfficialSource) &&
    !hasAnyPinpoint(primaryOfficialSource.pinpoint)
  ) {
    warnings.push("Precise pinpoint citation was not detected for a source type that usually benefits from one.");
  }

  const vague =
    primaryOfficialSource.title.trim().length < 8 ||
    primaryOfficialSource.institution.trim().length < 3;
  if (vague) warnings.push("Source citation appears too vague.");

  if (warnings.length === 0) {
    return {
      qualityStatus: "complete",
      publicationEligible: true,
      warnings,
      primaryOfficialSource,
    };
  }

  return {
    qualityStatus: isInaccessible(primaryOfficialSource)
      ? "inaccessible_source"
      : vague
        ? "vague_source"
        : shouldExpectPinpoint(primaryOfficialSource) &&
            !hasAnyPinpoint(primaryOfficialSource.pinpoint)
          ? "missing_pinpoint"
          : "partial",
    publicationEligible:
      !isInaccessible(primaryOfficialSource) &&
      !vague &&
      warnings.every(
        (warning) =>
          warning ===
          "Precise pinpoint citation was not detected for a source type that usually benefits from one.",
      ),
    warnings,
    primaryOfficialSource,
  };
}
