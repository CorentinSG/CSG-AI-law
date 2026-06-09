import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import { assessEuNewsVerification } from "@/agents/ai-regulation/euNewsVerification";

export type EuConversionStatus =
  | "discovery_only"
  | "needs_official_source"
  | "eligible_needs_review"
  | "converted_to_database_item";

export interface EuDatabaseConversionDecision {
  conversionStatus: EuConversionStatus;
  shouldCreateOrLinkDatabaseItem: boolean;
  targetReviewStatus: "needs_review" | "verified_for_review" | null;
  reasoning: string;
}

export function decideEuNewsDatabaseConversion(
  item: AiLawNewsItem,
): EuDatabaseConversionDecision {
  const classification = classifyEuNewsItem(item);
  const verification = assessEuNewsVerification(item);

  if (!verification.officialSourceFound) {
    return {
      conversionStatus: "needs_official_source",
      shouldCreateOrLinkDatabaseItem: false,
      targetReviewStatus: null,
      reasoning:
        "No automatic database conversion is allowed until an official source is attached and verified.",
    };
  }

  if (
    classification.hardLaw ||
    classification.softLaw ||
    classification.caseLaw ||
    classification.enforcement
  ) {
    return {
      conversionStatus: item.relatedMonitorItemId
        ? "converted_to_database_item"
        : "eligible_needs_review",
      shouldCreateOrLinkDatabaseItem: true,
      targetReviewStatus: item.relatedMonitorItemId ? "needs_review" : "needs_review",
      reasoning:
        "Official-source or officially corroborated EU development is eligible to exist in the legal database, but only as a review-stage item.",
    };
  }

  return {
    conversionStatus: "discovery_only",
    shouldCreateOrLinkDatabaseItem: false,
    targetReviewStatus: null,
    reasoning:
      "The item may remain useful as live legal intelligence, but it is not yet a strong candidate for structured database conversion.",
  };
}
