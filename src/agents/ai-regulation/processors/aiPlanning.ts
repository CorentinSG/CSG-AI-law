import type {
  AiProcessingLog,
  ExtractedCandidateItem,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { aiRegulationKeywordConfig } from "@/agents/ai-regulation/config/relevance";
import type { AppEnv } from "@/lib/env";
import type {
  DevelopmentType,
  ImportanceLevel,
  Jurisdiction,
  ReliabilityLevel,
} from "@/db/schema";

export type AiPlanningDecision =
  | "pending_ai_processing"
  | "allowed_for_live_processing"
  | "skipped_due_to_budget"
  | "skipped_due_to_token_limit"
  | "skipped_due_to_missing_api_key"
  | "skipped_due_to_scan_limit";

export interface RankedAiCandidate {
  rawItemId: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  publicationDate: string | null;
  detectedAt: string;
  developmentType: DevelopmentType;
  importanceLevel: ImportanceLevel;
  jurisdiction: Jurisdiction;
  score: number;
  tier: "critical" | "high" | "medium" | "low";
  reasons: string[];
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  requiresDeepAnalysis: boolean;
}

export interface AiDecisionRecord extends RankedAiCandidate {
  decision: AiPlanningDecision;
  decisionReason: string;
  aiEnabled: boolean;
  monthlyBudgetUsd: number;
  monthlySpendBeforeUsd: number;
  monthlyProjectedSpendUsd: number;
  models: {
    relevance: string;
    classification: string;
    summary: string;
    deepAnalysis?: string;
  };
}

export interface CandidateForAiPlanning {
  candidate: ExtractedCandidateItem;
  rawItem: RawRegulatoryItem;
  source: RegulationSource;
  classification: {
    jurisdiction: Jurisdiction;
    developmentType: DevelopmentType;
    importanceLevel: ImportanceLevel;
  };
  /** Independent serious sources already reporting the same story (0 if unknown). */
  corroboratingSourceCount?: number;
}

const sourcePriorityBoosts: Record<string, number> = {
  "src-eu-ai-office": 24,
  "src-eu-commission-news-rss": 22,
  "src-eur-lex-legislation-rss": 22,
  "src-eur-lex-proposals-rss": 21,
  "src-edpb-rss": 20,
  "src-curia-rss": 20,
  "src-federal-register-ai": 24,
  "src-ftc-ai-press": 22,
  "src-nist-ai-rmf": 20,
  "src-edpb-ai": 18,
  "src-edps-ai": 18,
  "src-cnil-ai": 18,
  "src-uk-ico-ai": 18,
  "src-eeoc-ai": 17,
  "src-cfpb-ai": 17,
  "src-sec-ai": 17,
  "src-nydfs-ai": 17,
  "src-eu-commission-ai": 16,
  "src-white-house-ai": 15,
};

const reliabilityBoosts: Record<ReliabilityLevel, number> = {
  high: 16,
  medium: 9,
  low: 3,
};

const jurisdictionBoosts: Partial<Record<Jurisdiction, number>> = {
  "European Union": 14,
  "United States federal": 14,
  France: 10,
  "United Kingdom": 10,
  "New York": 10,
  California: 10,
  Canada: 8,
  OECD: 7,
  "Council of Europe": 7,
};

const developmentTypeBoosts: Record<DevelopmentType, number> = {
  Statute: 22,
  Regulation: 22,
  "Final rule": 21,
  "Proposed rule": 19,
  Bill: 14,
  "Agency guidance": 18,
  "Enforcement action": 20,
  "Executive order": 16,
  "Public consultation": 14,
  "Policy report": 10,
  "Standards document": 16,
  "International treaty": 20,
  "Government announcement": 8,
  "Code of practice": 16,
  "Other official regulatory development": 10,
};

const importanceBoosts: Record<ImportanceLevel, number> = {
  critical: 18,
  high: 12,
  medium: 7,
  low: 3,
};

const modelPricingUsdPer1kTokens: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-5.4-nano": { input: 0.00005, output: 0.0002 },
  "gpt-5.4-mini": { input: 0.0003, output: 0.0012 },
  "gpt-5.4": { input: 0.002, output: 0.008 },
};

function getModelPricing(model: string) {
  return modelPricingUsdPer1kTokens[model] ?? { input: 0.0005, output: 0.002 };
}

function countKeywordMatches(value: string) {
  const haystack = value.toLowerCase();
  const aiHits = aiRegulationKeywordConfig.aiTerms.filter((term) =>
    haystack.includes(term.toLowerCase()),
  );
  const regulatoryHits = aiRegulationKeywordConfig.regulatoryTerms.filter((term) =>
    haystack.includes(term.toLowerCase()),
  );

  return {
    aiHits,
    regulatoryHits,
  };
}

function scoreFreshness(dateValue: string | null, detectedAt: string) {
  const basis = dateValue ? new Date(dateValue) : new Date(detectedAt);
  const daysOld = Math.max(
    0,
    Math.floor((Date.now() - basis.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (daysOld <= 7) return { score: 10, label: "very recent publication" };
  if (daysOld <= 30) return { score: 7, label: "recent publication" };
  if (daysOld <= 90) return { score: 4, label: "moderately recent publication" };
  return { score: 1, label: "older publication" };
}

export function estimateTokenCount(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / 4));
}

export function estimateAiCost(input: {
  env: Pick<AppEnv, "AI_MODEL_SUMMARY" | "AI_MODEL_DEEP_ANALYSIS">;
  inputTokens: number;
  requiresDeepAnalysis: boolean;
}) {
  // The processor makes a single combined analysis call (classification +
  // summary + obligations), so the input text is billed once on one model.
  const model = input.requiresDeepAnalysis
    ? input.env.AI_MODEL_DEEP_ANALYSIS
    : input.env.AI_MODEL_SUMMARY;
  const estimatedOutputTokens = input.requiresDeepAnalysis ? 1500 : 1100;

  const pricing = getModelPricing(model);
  const estimatedCostUsd =
    (input.inputTokens / 1000) * pricing.input +
    (estimatedOutputTokens / 1000) * pricing.output;

  return {
    estimatedOutputTokens,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
  };
}

export function rankCandidateForAi(input: CandidateForAiPlanning) {
  const combinedText = `${input.candidate.title}. ${input.candidate.text}`;
  const reasons: string[] = [];
  let score = 0;

  const reliabilityScore = reliabilityBoosts[input.source.reliabilityLevel];
  score += reliabilityScore;
  reasons.push(`${input.source.reliabilityLevel} reliability source`);

  const sourceBoost = sourcePriorityBoosts[input.source.id] ?? 6;
  score += sourceBoost;
  reasons.push(`source priority ${sourceBoost}`);

  const jurisdictionBoost = jurisdictionBoosts[input.classification.jurisdiction] ?? 5;
  score += jurisdictionBoost;
  reasons.push(`jurisdiction priority ${jurisdictionBoost}`);

  const developmentBoost = developmentTypeBoosts[input.classification.developmentType] ?? 6;
  score += developmentBoost;
  reasons.push(`development type ${input.classification.developmentType}`);

  const importanceBoost = importanceBoosts[input.classification.importanceLevel];
  score += importanceBoost;
  reasons.push(`importance ${input.classification.importanceLevel}`);

  // Cross-source corroboration outranks single-source items of equal weight,
  // so the capped per-scan AI budget goes to multi-source stories first. This
  // only reorders candidates; every cost guardrail applies unchanged.
  const corroboratingSourceCount = input.corroboratingSourceCount ?? 0;
  if (corroboratingSourceCount > 0) {
    const corroborationBoost = Math.min(20, corroboratingSourceCount * 10);
    score += corroborationBoost;
    reasons.push(
      `corroborated by ${corroboratingSourceCount} independent source(s)`,
    );
  }

  const { aiHits, regulatoryHits } = countKeywordMatches(combinedText);
  const keywordBoost = Math.min(14, aiHits.length * 3 + regulatoryHits.length * 2);
  score += keywordBoost;
  if (aiHits.length > 0) {
    reasons.push(`${aiHits.length} AI keyword matches`);
  }
  if (regulatoryHits.length > 0) {
    reasons.push(`${regulatoryHits.length} regulatory keyword matches`);
  }

  const freshness = scoreFreshness(
    input.classification.developmentType === "Standards document"
      ? input.candidate.publicationDate ?? input.rawItem.detectedAt
      : input.candidate.publicationDate ?? null,
    input.rawItem.detectedAt,
  );
  score += freshness.score;
  reasons.push(freshness.label);

  score += 8;
  reasons.push("new unique item");

  if (input.candidate.publicationDate) {
    score += 4;
    reasons.push("publication date available");
  }

  const requiresDeepAnalysis =
    input.classification.importanceLevel === "critical" ||
    input.classification.developmentType === "Final rule" ||
    input.classification.developmentType === "Regulation" ||
    input.classification.developmentType === "Enforcement action" ||
    input.classification.developmentType === "International treaty";

  const estimatedInputTokens = estimateTokenCount(
    `${input.candidate.title}\n${input.candidate.text}`,
  );
  const tier: RankedAiCandidate["tier"] =
    score >= 90 ? "critical" : score >= 72 ? "high" : score >= 54 ? "medium" : "low";

  return {
    rawItemId: input.rawItem.id,
    sourceId: input.source.id,
    sourceName: input.source.name,
    title: input.candidate.title,
    url: input.candidate.url,
    publicationDate: input.candidate.publicationDate ?? null,
    detectedAt: input.rawItem.detectedAt,
    developmentType: input.classification.developmentType,
    importanceLevel: input.classification.importanceLevel,
    jurisdiction: input.classification.jurisdiction,
    score,
    tier,
    reasons,
    estimatedInputTokens,
    requiresDeepAnalysis,
  };
}

function buildDecision(
  ranked: ReturnType<typeof rankCandidateForAi>,
  env: Pick<
    AppEnv,
    | "AI_ENABLE_PROCESSING"
    | "AI_PROCESSING_ENABLED"
    | "AI_MONTHLY_BUDGET_USD"
    | "AI_MAX_INPUT_TOKENS_PER_ITEM"
    | "AI_MAX_ITEMS_PER_SCAN"
    | "AI_MODEL_RELEVANCE"
    | "AI_MODEL_CLASSIFICATION"
    | "AI_MODEL_SUMMARY"
    | "AI_MODEL_DEEP_ANALYSIS"
    | "AI_COST_GUARDRAILS_ENABLED"
    | "OPENAI_API_KEY"
  >,
  monthlySpendBeforeUsd: number,
  plannedItemIndex: number,
) {
  const { estimatedOutputTokens, estimatedCostUsd } = estimateAiCost({
    env,
    inputTokens: ranked.estimatedInputTokens,
    requiresDeepAnalysis: ranked.requiresDeepAnalysis,
  });

  const aiEnabled = env.AI_ENABLE_PROCESSING ?? env.AI_PROCESSING_ENABLED;
  const models = {
    relevance: env.AI_MODEL_RELEVANCE,
    classification: env.AI_MODEL_CLASSIFICATION,
    summary: env.AI_MODEL_SUMMARY,
    ...(ranked.requiresDeepAnalysis
      ? { deepAnalysis: env.AI_MODEL_DEEP_ANALYSIS }
      : {}),
  };

  let decision: AiPlanningDecision = aiEnabled
    ? "allowed_for_live_processing"
    : "pending_ai_processing";
  let decisionReason = aiEnabled
    ? "Item is within current AI guardrails."
    : "AI processing remains disabled by configuration; item is queued conceptually for future review.";

  if (
    env.AI_COST_GUARDRAILS_ENABLED &&
    ranked.estimatedInputTokens > env.AI_MAX_INPUT_TOKENS_PER_ITEM
  ) {
    decision = "skipped_due_to_token_limit";
    decisionReason = `Estimated input tokens ${ranked.estimatedInputTokens} exceed AI_MAX_INPUT_TOKENS_PER_ITEM=${env.AI_MAX_INPUT_TOKENS_PER_ITEM}.`;
  } else if (
    env.AI_COST_GUARDRAILS_ENABLED &&
    plannedItemIndex >= env.AI_MAX_ITEMS_PER_SCAN
  ) {
    decision = "skipped_due_to_scan_limit";
    decisionReason = `Item ranked below the per-scan AI cap of ${env.AI_MAX_ITEMS_PER_SCAN} items.`;
  } else if (
    env.AI_COST_GUARDRAILS_ENABLED &&
    monthlySpendBeforeUsd + estimatedCostUsd > env.AI_MONTHLY_BUDGET_USD
  ) {
    decision = "skipped_due_to_budget";
    decisionReason = `Projected monthly spend would exceed AI_MONTHLY_BUDGET_USD=${env.AI_MONTHLY_BUDGET_USD}.`;
  } else if (aiEnabled && !env.OPENAI_API_KEY) {
    decision = "skipped_due_to_missing_api_key";
    decisionReason = "AI processing is enabled but OPENAI_API_KEY is missing.";
  }

  const monthlyProjectedSpendUsd =
    decision === "pending_ai_processing" ||
    decision === "allowed_for_live_processing"
      ? Number((monthlySpendBeforeUsd + estimatedCostUsd).toFixed(6))
      : Number(monthlySpendBeforeUsd.toFixed(6));

  const record: AiDecisionRecord = {
    ...ranked,
    estimatedOutputTokens,
    estimatedCostUsd,
    decision,
    decisionReason,
    aiEnabled,
    monthlyBudgetUsd: env.AI_MONTHLY_BUDGET_USD,
    monthlySpendBeforeUsd: Number(monthlySpendBeforeUsd.toFixed(6)),
    monthlyProjectedSpendUsd,
    models,
  };

  return record;
}

export function planAiProcessingBatch(
  candidates: CandidateForAiPlanning[],
  env: Pick<
    AppEnv,
    | "AI_ENABLE_PROCESSING"
    | "AI_PROCESSING_ENABLED"
    | "AI_MONTHLY_BUDGET_USD"
    | "AI_MAX_INPUT_TOKENS_PER_ITEM"
    | "AI_MAX_ITEMS_PER_SCAN"
    | "AI_MODEL_RELEVANCE"
    | "AI_MODEL_CLASSIFICATION"
    | "AI_MODEL_SUMMARY"
    | "AI_MODEL_DEEP_ANALYSIS"
    | "AI_COST_GUARDRAILS_ENABLED"
    | "OPENAI_API_KEY"
  >,
  monthlySpendUsd: number,
) {
  const ranked = candidates
    .map((candidate) => rankCandidateForAi(candidate))
    .sort((left, right) => right.score - left.score);

  let runningMonthlySpend = monthlySpendUsd;

  return ranked.map((item, index) => {
    const decision = buildDecision(item, env, runningMonthlySpend, index);
    if (
      decision.decision === "pending_ai_processing" ||
      decision.decision === "allowed_for_live_processing"
    ) {
      runningMonthlySpend = decision.monthlyProjectedSpendUsd;
    }
    return decision;
  });
}

export function buildAiPlanningLogMessage(decision: AiDecisionRecord) {
  return `ai_planning=${JSON.stringify({
    version: "v1",
    decision: decision.decision,
    decisionReason: decision.decisionReason,
    rankingScore: decision.score,
    rankingTier: decision.tier,
    rankingReasons: decision.reasons,
    estimatedInputTokens: decision.estimatedInputTokens,
    estimatedOutputTokens: decision.estimatedOutputTokens,
    estimatedCostUsd: decision.estimatedCostUsd,
    requiresDeepAnalysis: decision.requiresDeepAnalysis,
    monthlyBudgetUsd: decision.monthlyBudgetUsd,
    monthlySpendBeforeUsd: decision.monthlySpendBeforeUsd,
    monthlyProjectedSpendUsd: decision.monthlyProjectedSpendUsd,
    aiEnabled: decision.aiEnabled,
    models: decision.models,
    rawItemId: decision.rawItemId,
    sourceId: decision.sourceId,
    sourceName: decision.sourceName,
    title: decision.title,
    publicationDate: decision.publicationDate,
    developmentType: decision.developmentType,
    importanceLevel: decision.importanceLevel,
    jurisdiction: decision.jurisdiction,
  })}`;
}

export interface ParsedAiPlanningLog {
  decision: AiPlanningDecision;
  decisionReason: string;
  rankingScore: number;
  rankingTier: string;
  rankingReasons: string[];
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  requiresDeepAnalysis: boolean;
  monthlyBudgetUsd: number;
  monthlySpendBeforeUsd: number;
  monthlyProjectedSpendUsd: number;
  aiEnabled: boolean;
  models: {
    relevance: string;
    classification: string;
    summary: string;
    deepAnalysis?: string;
  };
  rawItemId: string;
  sourceId: string;
  sourceName: string;
  title: string;
  publicationDate: string | null;
  developmentType: DevelopmentType;
  importanceLevel: ImportanceLevel;
  jurisdiction: Jurisdiction;
}

export function parseAiPlanningLog(log: Pick<AiProcessingLog, "errorMessage">) {
  if (!log.errorMessage?.startsWith("ai_planning=")) return null;

  try {
    return JSON.parse(
      log.errorMessage.slice("ai_planning=".length),
    ) as ParsedAiPlanningLog;
  } catch {
    return null;
  }
}

export function estimateMonthlyAiSpend(logs: Pick<AiProcessingLog, "createdAt" | "errorMessage">[]) {
  const monthPrefix = new Date().toISOString().slice(0, 7);
  return Number(
    logs
      .filter((log) => log.createdAt.startsWith(monthPrefix))
      .map((log) => parseAiPlanningLog(log))
      .filter((entry): entry is ParsedAiPlanningLog => Boolean(entry))
      .reduce((sum, entry) => {
        if (
          entry.decision === "pending_ai_processing" ||
          entry.decision === "allowed_for_live_processing"
        ) {
          return sum + entry.estimatedCostUsd;
        }
        return sum;
      }, 0)
      .toFixed(6),
  );
}
