import { aiRegulationKeywordConfig } from "@/agents/ai-regulation/config/relevance";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";

export interface RelevanceDecision {
  relevant: boolean;
  reason: string;
  matchedAiTerms: string[];
  matchedRegulatoryTerms: string[];
}

function normalizeForSearch(input: string) {
  return ` ${input.toLowerCase()} `
    .replace(/[^\p{L}\p{N}/]+/gu, " ")
    .replace(/\s+/g, " ");
}

function collectMatches(haystack: string, terms: readonly string[]) {
  return terms.filter((term) => haystack.includes(normalizeForSearch(term)));
}

export const relevanceFilter = {
  evaluate(candidate: ExtractedCandidateItem, source: RegulationSource): RelevanceDecision {
    const candidateHaystack = normalizeForSearch(
      [
        candidate.title,
        candidate.excerpt ?? "",
        candidate.text,
        candidate.metadata?.categories,
        candidate.metadata?.topics,
        candidate.metadata?.section,
        candidate.metadata?.contentType,
        candidate.metadata?.type,
        candidate.metadata?.category,
        candidate.metadata?.pageSection,
      ]
        .flat()
        .filter(Boolean)
        .join(" "),
    );
    const sourceHaystack = normalizeForSearch(
      [source.name, source.notes, source.sourceUrl].filter(Boolean).join(" "),
    );

    const hasNegativeSignal = aiRegulationKeywordConfig.negativeTerms.some((term) =>
      candidateHaystack.includes(normalizeForSearch(term)),
    );
    if (hasNegativeSignal) {
      return {
        relevant: false,
        reason: "Negative-content signal matched the deterministic relevance denylist.",
        matchedAiTerms: [],
        matchedRegulatoryTerms: [],
      };
    }

    const matchedAiTerms = collectMatches(
      candidateHaystack,
      aiRegulationKeywordConfig.aiTerms,
    );
    const matchedRegulatoryTerms = collectMatches(
      candidateHaystack,
      aiRegulationKeywordConfig.regulatoryTerms,
    );
    const sourceContextMatch = aiRegulationKeywordConfig.permissiveSourceContexts.some(
      (term) => sourceHaystack.includes(normalizeForSearch(term)),
    );

    const titleExcerptHaystack = normalizeForSearch(
      `${candidate.title} ${candidate.excerpt ?? ""}`,
    );
    const hasStrongTitleSignal =
      matchedAiTerms.length > 0 &&
      (matchedRegulatoryTerms.length > 0 ||
        /guidance|framework|consultation|policy|government|regulation|executive order|law|tool|transparency/i.test(
          titleExcerptHaystack,
        ));

    const relevant =
      hasStrongTitleSignal ||
      (matchedAiTerms.length > 0 &&
        matchedRegulatoryTerms.length > 0 &&
        sourceContextMatch);

    return {
      relevant,
      reason: relevant
        ? "Matched AI and legal-regulatory context signals."
        : matchedAiTerms.length === 0
          ? "No AI-specific keyword match was detected."
          : "AI terms were present, but legal-regulatory context was too weak.",
      matchedAiTerms,
      matchedRegulatoryTerms,
    };
  },
};
