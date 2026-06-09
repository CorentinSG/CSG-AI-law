import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";

export interface EuVerificationAssessment {
  verificationStatus: string;
  officialSourceFound: boolean;
  sourceAuthorityLevel: string;
  canSupportLegalAuthority: boolean;
  publicDisplayAllowed: boolean;
  blockingReasons: string[];
}

export function assessEuNewsVerification(item: AiLawNewsItem): EuVerificationAssessment {
  const classification = classifyEuNewsItem(item);
  const nonOfficial =
    item.sourceType === "informal_discovery_source" ||
    item.sourceType === "legal_regulatory_press" ||
    item.sourceType === "tracker_database";

  const blockingReasons: string[] = [];

  if (nonOfficial && !item.officialSourceFound) {
    blockingReasons.push("Official source confirmation is still missing.");
  }
  if (!item.publicationDate && !item.detectedAt) {
    blockingReasons.push("No publication or detected date is available.");
  }

  const canSupportLegalAuthority =
    !nonOfficial && item.officialSourceFound && item.citationQuality !== "missing_official_source";
  const publicDisplayAllowed =
    item.publicVisibilityStatus === "public" &&
    (item.officialSourceFound || item.verificationStatus === "corroborated");

  let verificationStatus = item.verificationStatus;
  if (nonOfficial && !item.officialSourceFound) {
    verificationStatus =
      item.sourceType === "legal_regulatory_press" ? "media_reported" : "needs_official_source";
  } else if (canSupportLegalAuthority && item.verificationStatus === "needs_review") {
    verificationStatus = "official_source_found";
  }

  return {
    verificationStatus,
    officialSourceFound: item.officialSourceFound,
    sourceAuthorityLevel: classification.sourceAuthorityLevel,
    canSupportLegalAuthority,
    publicDisplayAllowed,
    blockingReasons,
  };
}
