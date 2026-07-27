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

export interface PublicationEligibilityAssessment {
  eligible: boolean;
  blockingReasons: string[];
  warnings: string[];
  recommendedAction: string;
}

function hasOfficialLikeSource(references: SourceReference[]) {
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

/**
 * Source-level gate for sources whose extraction is not verified yet — today the
 * generated country DPA/government shells that scrape an index page with a
 * catch-all `a[href]` selector and therefore yield navigation links as often as
 * legal developments. Such a source is still official, so it is not a
 * discovery-only lead: its items stay reviewable and publishable, they just may
 * not ride the automatic-publication lane. Verified official lanes carry no flag
 * and keep auto-publishing.
 */
export function requiresSourceReview(
  source: Pick<RegulationSource, "config"> | null | undefined,
) {
  return source?.config?.requiresReview === true;
}

function isOfficialSourceConfirmed(input: {
  verification: ReturnType<typeof extractVerificationMetadata> | null;
  references: SourceReference[];
}) {
  return (
    input.verification?.officialSourceFound === true ||
    hasOfficialLikeSource(input.references)
  );
}

export function evaluatePublicationEligibility(input: {
  update: Pick<
    AiRegulatoryUpdate,
    | "status"
    | "title"
    | "jurisdiction"
    | "developmentType"
    | "sourceName"
    | "sourceUrl"
    | "publicationDate"
    | "detectedDate"
  >;
  rawItem: Pick<RawRegulatoryItem, "rawMetadata" | "detectedAt"> | null;
  source: Pick<RegulationSource, "config" | "name"> | null;
  sourceReferences?: SourceReference[];
}): PublicationEligibilityAssessment {
  const references =
    input.sourceReferences ??
    getCitationReferences({
      update: input.update as AiRegulatoryUpdate,
      rawItem: input.rawItem as RawRegulatoryItem | null,
      source: input.source as RegulationSource | null,
    });
  const citation = assessCitationQuality(references);
  const verification = input.rawItem
    ? extractVerificationMetadata(input.rawItem)
    : null;
  const officialSourceConfirmed = isOfficialSourceConfirmed({
    verification,
    references,
  });
  const sourceReviewRequired = requiresSourceReview(input.source);

  const blockingReasons: string[] = [];
  const warnings = [...citation.warnings];

  if (
    sourceReviewRequired &&
    !["approved", "published"].includes(input.update.status)
  ) {
    blockingReasons.push(
      "Source extraction is an unverified catch-all, so the item must be confirmed as a real legal development before publication.",
    );
  }

  if (
    !officialSourceConfirmed &&
    !["approved", "published"].includes(input.update.status)
  ) {
    blockingReasons.push(
      "Item has not completed the required human-review approval step and no official source has been confirmed.",
    );
  }

  if (input.source && isDiscoveryOnlySource(input.source)) {
    blockingReasons.push(
      "Discovery-only or media/tracker source cannot be published as legal authority.",
    );
  }

  if (!hasOfficialLikeSource(references)) {
    blockingReasons.push(
      "At least one official or authoritative primary source is required.",
    );
  }

  if (!input.update.jurisdiction) {
    blockingReasons.push("Jurisdiction is missing or not precise enough.");
  }

  if (!input.update.developmentType) {
    blockingReasons.push("Authority or development type is missing.");
  }

  if (!input.update.sourceUrl || !input.update.sourceName || !input.update.title) {
    blockingReasons.push("Core source metadata is incomplete.");
  }

  if (!input.update.publicationDate && !input.update.detectedDate && !input.rawItem?.detectedAt) {
    blockingReasons.push("No publication, detection, or retrieval date is available.");
  }

  if (!citation.publicationEligible) {
    blockingReasons.push(
      `Citation quality is ${citation.qualityStatus.replaceAll("_", " ")}.`,
    );
  }

  if (
    verification &&
    ["discovery_only", "needs_official_source", "rejected"].includes(
      verification.verificationStatus,
    )
  ) {
    blockingReasons.push(
      `Verification status is ${verification.verificationStatus.replaceAll("_", " ")}.`,
    );
  }

  if (verification && !verification.officialSourceFound && !hasOfficialLikeSource(references)) {
    blockingReasons.push("Official source confirmation is still missing.");
  }

  return {
    eligible: blockingReasons.length === 0,
    blockingReasons,
    warnings,
    recommendedAction:
      blockingReasons.length === 0
        ? officialSourceConfirmed && !sourceReviewRequired
          ? "Item is eligible for automatic publication because an official source is confirmed."
          : "Item is eligible for manual publication when the reviewer is satisfied."
        : "Resolve the blocking reasons, attach precise official citations, and keep the item non-public until approval is complete.",
  };
}
