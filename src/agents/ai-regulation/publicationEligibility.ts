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
    ["official", "court", "regulator", "standards_body"].includes(reference.sourceType),
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

  const blockingReasons: string[] = [];
  const warnings = [...citation.warnings];

  if (!["approved", "published"].includes(input.update.status)) {
    blockingReasons.push(
      "Item has not completed the required human-review approval step.",
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

  if (verification && !verification.officialSourceFound) {
    blockingReasons.push("Official source confirmation is still missing.");
  }

  return {
    eligible: blockingReasons.length === 0,
    blockingReasons,
    warnings,
    recommendedAction:
      blockingReasons.length === 0
        ? "Item is eligible for manual publication when the reviewer is satisfied."
        : "Resolve the blocking reasons, attach precise official citations, and keep the item non-public until approval is complete.",
  };
}
