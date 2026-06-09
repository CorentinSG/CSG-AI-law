import { assessCitationQuality, type SourceReference } from "@/agents/ai-regulation/citations";
import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { extractVerificationMetadata } from "@/agents/ai-regulation/verification";

export interface ReviewChecklistItem {
  question: string;
  answer: "yes" | "no" | "not_confirmed";
  basis: string;
}

export interface AdminReviewTraceability {
  sourceId: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceType: string | null;
  officialSource: boolean;
  parserUsed: string | null;
  scanTimestamp: string | null;
  httpStatus: number | null;
  contentHash: string | null;
  duplicateStatus: "duplicate" | "unique" | "unknown";
  duplicateOf: string | null;
  rawUrlScanned: string | null;
  extractedContentPreview: string | null;
  relevanceReason: string | null;
  matchedAiTerms: string[];
  matchedRegulatoryTerms: string[];
  authorityClassification: string | null;
  authorityType: string;
  jurisdiction: string;
  effectiveDate: string | null;
  reviewStatus: string;
  publicationStatus: "public" | "hidden";
  reviewRequired: boolean;
  missingInformation: string[];
  reviewWarnings: string[];
  checklist: ReviewChecklistItem[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function yesNo(value: boolean): ReviewChecklistItem["answer"] {
  return value ? "yes" : "no";
}

function buildNyCourtsPart161Checklist(input: {
  update: AiRegulatoryUpdate;
  rawItem: RawRegulatoryItem | null;
  source: RegulationSource | null;
  sourceReferences: SourceReference[];
}) {
  const metadata = asRecord(input.rawItem?.rawMetadata) ?? {};
  const summaryText = [
    input.update.summary,
    input.update.whatHappened,
    input.update.whyItMatters,
    input.update.practicalImpact,
    input.update.keyObligations.join(" "),
    input.update.enforcementRisk,
    input.rawItem?.rawText ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const scope = asStringArray(metadata.scope);
  const officialCourtReference = input.sourceReferences.some(
    (reference) =>
      reference.institution === "New York State Unified Court System" &&
      (reference.sourceType === "court" || reference.sourceType === "official"),
  );

  const checklist: ReviewChecklistItem[] = [
    {
      question: "Is this an official NY Courts source?",
      answer: yesNo(
        Boolean(input.source && !isDiscoveryOnlySource(input.source) && officialCourtReference),
      ),
      basis:
        input.source?.sourceUrl ??
        input.sourceReferences[0]?.url ??
        "No official NY Courts URL was attached.",
    },
    {
      question: "Does it apply statewide?",
      answer: yesNo(
        /statewide|new york state unified court system|rules of the chief administrator/.test(
          summaryText,
        ),
      ),
      basis: asString(metadata.applicableForum) ?? "Forum metadata not detected.",
    },
    {
      question: "Does it apply to civil and criminal cases?",
      answer:
        scope.includes("civil cases") && scope.includes("criminal cases")
          ? "yes"
          : "not_confirmed",
      basis:
        scope.length > 0
          ? `Detected scope: ${scope.join(", ")}.`
          : "Civil/criminal scope not yet pinned from official metadata.",
    },
    {
      question: "Does it permit AI use in court papers?",
      answer: /should not be prohibited|permit ai use|use of artificial intelligence/.test(
        summaryText,
      )
        ? "yes"
        : "not_confirmed",
      basis:
        "Review the official rule text for the policy language on AI use in preparing papers.",
    },
    {
      question: "Does it require disclosure of AI use?",
      answer: /disclosure/.test(summaryText) ? "yes" : "not_confirmed",
      basis:
        "Confirm from the official rule text whether disclosure is explicitly required rather than inferred.",
    },
    {
      question: "Does it require independent attorney review?",
      answer: /independently ensure|carefully review the paper|independent attorney review/.test(
        summaryText,
      )
        ? "yes"
        : "not_confirmed",
      basis:
        "Appendix A / key-obligation language should confirm the duty to review AI-assisted papers.",
    },
    {
      question: "Does it mention fabricated cases, statutes, or other material?",
      answer: /fabricated|fictitious cases|fictitious statutes|other material/.test(summaryText)
        ? "yes"
        : "not_confirmed",
      basis:
        "The official model-rule text should mention fabricated or fictitious authorities if present.",
    },
    {
      question: "Does it mention sanctions or remedial action?",
      answer: /sanction|remedial action/.test(summaryText) ? "yes" : "not_confirmed",
      basis:
        "Check the model-rule / enforcement-risk language for sanctions or remedial action.",
    },
    {
      question:
        "Should it be tagged as attorney ethics, court filings, AI governance, or professional responsibility?",
      answer:
        input.update.tags.some((tag) =>
          ["professional responsibility", "ai filings", "courts", "ai governance"].includes(
            tag.toLowerCase(),
          ),
        )
          ? "yes"
          : "not_confirmed",
      basis: `Current tags: ${input.update.tags.join(", ") || "none"}.`,
    },
  ];

  return checklist;
}

export function buildAdminReviewTraceability(input: {
  update: AiRegulatoryUpdate;
  rawItem: RawRegulatoryItem | null;
  source: RegulationSource | null;
  sourceReferences: SourceReference[];
}) : AdminReviewTraceability {
  const traceability = asRecord(input.rawItem?.rawMetadata.traceability) ?? {};
  const relevance = asRecord(traceability.relevance) ?? {};
  const classification = asRecord(traceability.classification) ?? {};
  const extraction = asRecord(traceability.extraction) ?? {};
  const verification = input.rawItem ? extractVerificationMetadata(input.rawItem) : null;
  const citationAssessment = assessCitationQuality(input.sourceReferences);

  const reviewWarnings = [
    ...citationAssessment.warnings,
    ...(verification?.publicVisibilityAllowed === false
      ? ["Human review is still required before any public visibility."]
      : []),
    ...(verification?.notPublishableReason ? [verification.notPublishableReason] : []),
  ];

  const missingInformation = [
    !asString(traceability.parserUsed) ? "Parser used is not recorded." : null,
    !asString(asString(classification.effectiveDate) ?? asString(extraction.effectiveDate))
      ? "Effective date is not recorded."
      : null,
    input.sourceReferences.length === 0 ? "Structured source references are missing." : null,
    !asString(relevance.reason) ? "Deterministic relevance reason is not recorded." : null,
    !asString(asString(classification.authorityClassification) ?? asString(extraction.authorityClassification))
      ? "Authority classification detail is not recorded."
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const isNyCourtsPart161 =
    input.source?.id === "src-nycourts-part-161-ai" ||
    /part 161/i.test(input.update.title) ||
    /ao\/75\/2026/i.test(input.update.summary);
  const fallbackChecklist: ReviewChecklistItem[] = [
    {
      question: "Is the source official or otherwise authoritative?",
      answer: input.source && !isDiscoveryOnlySource(input.source) ? "yes" : "not_confirmed",
      basis:
        input.source?.sourceUrl ??
        input.sourceReferences[0]?.url ??
        "No official or authoritative source URL attached.",
    },
    {
      question: "Are jurisdiction, authority type, and effective date sufficiently pinned?",
      answer:
        input.update.jurisdiction &&
        (asString(classification.authorityClassification) || input.update.developmentType) &&
        (asString(classification.effectiveDate) || input.update.publicationDate)
          ? "yes"
          : "not_confirmed",
      basis:
        "Review the traceability panel and citations before approval or publication.",
    },
  ];

  return {
    sourceId: asString(traceability.sourceId) ?? input.source?.id ?? null,
    sourceName: input.update.sourceName,
    sourceUrl: input.update.sourceUrl,
    sourceType: asString(traceability.sourceType) ?? input.source?.sourceType ?? null,
    officialSource: input.source ? !isDiscoveryOnlySource(input.source) : false,
    parserUsed:
      asString(traceability.parserUsed) ??
      asString(input.source?.config?.parserType) ??
      input.source?.preferredExtractionMethod ??
      null,
    scanTimestamp: asString(traceability.scanTimestamp) ?? input.rawItem?.detectedAt ?? null,
    httpStatus: asNumber(traceability.httpStatus),
    contentHash: input.rawItem?.hash ?? null,
    duplicateStatus:
      input.rawItem?.duplicateOf === null
        ? "unique"
        : input.rawItem?.duplicateOf
          ? "duplicate"
          : "unknown",
    duplicateOf: input.rawItem?.duplicateOf ?? null,
    rawUrlScanned:
      asString(traceability.rawUrlScanned) ?? input.rawItem?.rawUrl ?? input.update.sourceUrl,
    extractedContentPreview:
      asString(extraction.extractedContentPreview) ??
      input.rawItem?.rawText.slice(0, 320) ??
      null,
    relevanceReason: asString(relevance.reason),
    matchedAiTerms: asStringArray(relevance.matchedAiTerms),
    matchedRegulatoryTerms: asStringArray(relevance.matchedRegulatoryTerms),
    authorityClassification:
      asString(classification.authorityClassification) ??
      asString(extraction.authorityClassification) ??
      null,
    authorityType: asString(classification.authorityType) ?? input.update.developmentType,
    jurisdiction: asString(classification.jurisdiction) ?? input.update.jurisdiction,
    effectiveDate:
      asString(classification.effectiveDate) ??
      asString(extraction.effectiveDate) ??
      null,
    reviewStatus: input.update.status,
    publicationStatus: input.update.status === "published" ? "public" : "hidden",
    reviewRequired: input.update.status !== "published",
    missingInformation,
    reviewWarnings,
    checklist: isNyCourtsPart161 ? buildNyCourtsPart161Checklist(input) : fallbackChecklist,
  };
}
