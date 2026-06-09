import {
  assessCitationQuality,
  type CitationQualityStatus,
  type SourceReference,
} from "@/agents/ai-regulation/citations";
import {
  assessFreshness,
  type FreshnessAssessment,
  type FreshnessPolicyKey,
  type FreshnessStatus,
} from "@/agents/ai-regulation/freshness";

export const dataQualityStatuses = [
  "complete",
  "partial",
  "needs_review",
  "stale",
  "missing_official_source",
  "missing_citation",
  "inaccessible_source",
  "discovery_only",
  "verified_for_review",
  "ready_for_publication",
] as const;

export type DataQualityStatus = (typeof dataQualityStatuses)[number];
export type ReviewPriority = "high" | "medium" | "low";

export interface DataQualityAssessment {
  sourceCompleteness: DataQualityStatus;
  citationQuality: CitationQualityStatus | "missing_citation";
  verificationStatus: string;
  freshnessStatus: FreshnessStatus;
  confidenceLevel: string;
  publicReadiness: DataQualityStatus;
  publicationEligible: boolean;
  missingFields: string[];
  staleWarnings: string[];
  sourceAccessibilityWarnings: string[];
  reviewPriority: ReviewPriority;
}

function hasOfficialOrAuthoritativeSource(references: SourceReference[]) {
  return references.some((reference) =>
    [
      "official",
      "court",
      "regulator",
      "government",
      "parliament",
      "legislation",
      "policy",
      "standards_body",
    ].includes(reference.sourceType),
  );
}

function deriveReviewPriority(input: {
  publicationEligible: boolean;
  publicFacing?: boolean;
  freshness: FreshnessAssessment;
  missingFields: string[];
  citationQuality: CitationQualityStatus | "missing_citation";
  sourceWarnings: string[];
  verificationStatus: string;
}): ReviewPriority {
  if (
    input.publicFacing &&
    (input.freshness.status === "stale" ||
      input.citationQuality === "missing_citation" ||
      input.citationQuality === "missing_official_source")
  ) {
    return "high";
  }

  if (
    input.sourceWarnings.length > 0 ||
    input.freshness.status === "source_inaccessible" ||
    input.citationQuality === "missing_official_source" ||
    input.verificationStatus === "verified_for_review"
  ) {
    return "high";
  }

  if (
    input.freshness.status === "stale" ||
    input.freshness.status === "due_for_review" ||
    input.missingFields.length > 0 ||
    input.citationQuality === "partial" ||
    input.verificationStatus.includes("needs")
  ) {
    return "medium";
  }

  return input.publicationEligible ? "low" : "medium";
}

export function assessDataQuality(input: {
  sourceReferences?: SourceReference[];
  requiredFields?: Record<string, unknown>;
  verificationStatus?: string | null;
  confidenceLevel?: string | null;
  lastReviewedAt?: string | null;
  freshnessPolicy: FreshnessPolicyKey;
  freshnessThresholdDaysOverride?: number;
  sourceAccessible?: boolean | null;
  publicFacing?: boolean;
  humanReviewed?: boolean;
  now?: Date;
}): DataQualityAssessment {
  const references = input.sourceReferences ?? [];
  const missingFields = Object.entries(input.requiredFields ?? {})
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length === 0;
      return value === null || value === undefined || value === "";
    })
    .map(([field]) => field);
  const citationAssessment =
    references.length > 0
      ? assessCitationQuality(references)
      : {
          qualityStatus: "missing_official_source" as CitationQualityStatus,
          publicationEligible: false,
          warnings: ["No source references are attached."],
          primaryOfficialSource: null,
        };
  const freshness = assessFreshness({
    lastReviewedAt: input.lastReviewedAt,
    policy: input.freshnessPolicy,
    thresholdDaysOverride: input.freshnessThresholdDaysOverride,
    now: input.now,
    sourceAccessible: input.sourceAccessible,
    manualReviewRequired: input.verificationStatus?.includes("manual") ?? false,
  });
  const officialSourcePresent = hasOfficialOrAuthoritativeSource(references);
  const sourceAccessibilityWarnings = references
    .filter(
      (reference) =>
        Boolean(reference.accessLimitations) ||
        reference.verificationStatus.includes("manual") ||
        reference.verificationStatus.includes("blocked"),
    )
    .map(
      (reference) =>
        `${reference.institution}: ${reference.accessLimitations ?? reference.verificationStatus}`,
    );

  const publicationEligible =
    citationAssessment.publicationEligible &&
    officialSourcePresent &&
    input.humanReviewed === true &&
    input.verificationStatus === "published";

  const publicReadiness: DataQualityStatus = publicationEligible
    ? "ready_for_publication"
    : !officialSourcePresent
      ? "missing_official_source"
      : references.length === 0
        ? "missing_citation"
        : input.verificationStatus === "discovery_only"
          ? "discovery_only"
          : input.verificationStatus === "verified_for_review"
            ? "verified_for_review"
            : "needs_review";

  return {
    sourceCompleteness:
      officialSourcePresent && missingFields.length === 0
        ? "complete"
        : officialSourcePresent
          ? "partial"
          : "missing_official_source",
    citationQuality:
      references.length > 0 ? citationAssessment.qualityStatus : "missing_citation",
    verificationStatus: input.verificationStatus ?? "needs_review",
    freshnessStatus: freshness.status,
    confidenceLevel: input.confidenceLevel ?? "needs_review",
    publicReadiness,
    publicationEligible,
    missingFields,
    staleWarnings: [...freshness.warnings, ...citationAssessment.warnings],
    sourceAccessibilityWarnings,
    reviewPriority: deriveReviewPriority({
      publicationEligible,
      publicFacing: input.publicFacing,
      freshness,
      missingFields,
      citationQuality:
        references.length > 0 ? citationAssessment.qualityStatus : "missing_citation",
      sourceWarnings: sourceAccessibilityWarnings,
      verificationStatus: input.verificationStatus ?? "needs_review",
    }),
  };
}
