/**
 * AI classification bridge for ingestion pipeline documents.
 *
 * Connects the ingestion pipeline to the existing aiClassifier so that
 * newly ingested raw_regulatory_items can be classified automatically.
 *
 * AI processing remains disabled by default (AI_ENABLE_PROCESSING env var).
 * This module only schedules classification — it never auto-publishes.
 * All classified items remain in needs_review status until a human approves.
 */

import { aiClassifier } from "@/agents/ai-regulation/processors/aiClassifier";
import type { RawRegulatoryItem } from "@/agents/ai-regulation/types";

export interface ClassificationResult {
  jurisdiction: string;
  developmentType: string;
  legalArea: string;
  importanceLevel: string;
  confidenceLevel: string;
  tags: string[];
  authorityType: string;
  summary: string;
}

/**
 * Classify a raw item using the existing deterministic classifier.
 *
 * The existing aiClassifier uses rule-based inference without calling OpenAI.
 * OpenAI-based summarization (when enabled) is handled separately by the
 * existing openaiProcessor pipeline — we do not duplicate that here.
 */
export function classifyIngestionItem(
  item: RawRegulatoryItem,
  sourceName: string
): ClassificationResult {
  const result = aiClassifier.classify({
    title: item.rawTitle,
    text: item.rawText,
    sourceName,
  });

  return {
    jurisdiction: result.jurisdiction,
    developmentType: result.developmentType,
    legalArea: result.legalArea,
    importanceLevel: result.importanceLevel,
    confidenceLevel: result.confidenceLevel,
    tags: result.tags,
    authorityType: result.authorityType,
    summary: `[Pending human review] ${item.rawTitle}`,
  };
}
