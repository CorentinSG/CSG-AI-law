import { z } from "zod";

import { buildRegulatoryAnalysisPrompt } from "@/agents/ai-regulation/prompts/regulatoryAnalysisPrompt";
import { promptVersions } from "@/agents/ai-regulation/prompts/versions";
import { getOpenAiClient } from "@/agents/ai-regulation/processors/openaiClient";
import type {
  AiRegulatoryUpdate,
  ExtractedCandidateItem,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type {
  AiDecisionRecord,
  ParsedAiPlanningLog,
} from "@/agents/ai-regulation/processors/aiPlanning";
import type { AppEnv } from "@/lib/env";
import type {
  ConfidenceLevel,
  DevelopmentType,
  ImportanceLevel,
  Jurisdiction,
  LegalArea,
} from "@/db/schema";

const analysisSchema = z.object({
  jurisdiction: z.string().min(1),
  developmentType: z.string().min(1),
  legalArea: z.string().min(1),
  importanceLevel: z.string().min(1),
  confidenceLevel: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  oneSentenceSummary: z.string().min(1),
  summary: z.string().min(1),
  whatHappened: z.string().min(1),
  whyItMatters: z.string().min(1),
  practicalImpact: z.string().min(1),
  affectedParties: z.array(z.string().min(1)).min(1),
  enforcementRisk: z.string().min(1),
  keyObligations: z.array(z.string().min(1)).min(1),
  complianceDeadlines: z.array(z.string().min(1)).min(1),
});

const allowedJurisdictions = new Set<string>([
  "United States federal",
  "New York",
  "California",
  "European Union",
  "France",
  "United Kingdom",
  "Canada",
  "OECD",
  "Council of Europe",
]);

const allowedDevelopmentTypes = new Set<string>([
  "Statute",
  "Bill",
  "Regulation",
  "Proposed rule",
  "Final rule",
  "Executive order",
  "Agency guidance",
  "Enforcement action",
  "Public consultation",
  "Policy report",
  "Standards document",
  "International treaty",
  "Government announcement",
  "Code of practice",
  "Other official regulatory development",
]);

const allowedLegalAreas = new Set<string>([
  "AI governance",
  "Privacy",
  "Data protection",
  "Consumer protection",
  "Employment",
  "Labor and social law",
  "Cloud and infrastructure",
  "Financial services",
  "Healthcare",
  "Education",
  "Public sector use of AI",
  "Criminal justice",
  "Biometric identification",
  "Algorithmic discrimination",
  "Automated decision-making",
  "Copyright and generative AI",
  "Cybersecurity",
  "Product safety",
  "Competition / antitrust",
  "Professional responsibility",
  "Access to justice",
  "Other",
]);

const allowedImportanceLevels = new Set<string>(["critical", "high", "medium", "low"]);
const allowedConfidenceLevels = new Set<string>(["high", "medium", "low"]);

function normalizeOrFallback<T extends string>(
  value: string,
  allowed: Set<string>,
  fallback: T,
) {
  return allowed.has(value) ? (value as T) : fallback;
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("OpenAI response did not contain a valid JSON object.");
  }
  return match[0];
}

async function callJsonModel<T>(input: {
  model: string;
  prompt: string;
  schema: z.ZodSchema<T>;
  maxOutputTokens: number;
}) {
  const client = getOpenAiClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is missing; no OpenAI client is available.");
  }

  const response = await client.chat.completions.create({
    model: input.model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_completion_tokens: input.maxOutputTokens,
    messages: [
      {
        role: "system",
        content: "Return only valid JSON. Do not wrap the response in markdown fences.",
      },
      {
        role: "user",
        content: input.prompt,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const json = extractJsonObject(raw);
  const parsed = JSON.parse(json);
  return input.schema.parse(parsed);
}

export interface OpenAiProcessingSuccess {
  updatePatch: {
    title: string;
    jurisdiction: Jurisdiction;
    region: string;
    country: string;
    publicationDate: string | null;
    oneSentenceSummary: string;
    summary: string;
    whatHappened: string;
    whyItMatters: string;
    practicalImpact: string;
    affectedParties: string[];
    keyObligations: string[];
    complianceDeadlines: string[];
    enforcementRisk: string;
    importanceLevel: ImportanceLevel;
    confidenceLevel: ConfidenceLevel;
    tags: string[];
    developmentType: DevelopmentType;
    legalArea: LegalArea;
  };
  modelUsed: string;
  promptVersion: string;
  logMessage: string;
}

export type OpenAiProcessingResult =
  | ({
      skipped: true;
      reason: string;
      logMessage: string;
    })
  | ({
      skipped: false;
    } & OpenAiProcessingSuccess);

export function buildOpenAiResultLogMessage(input: {
  outcome: "completed_ai_processing" | "skipped_published_item";
  modelUsed: string;
  promptVersion: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number;
  confidenceLevel?: ConfidenceLevel;
  skipReason?: string;
}) {
  return `ai_result=${JSON.stringify(input)}`;
}

export function parseOpenAiResultLog(log: { errorMessage: string | null }) {
  if (!log.errorMessage?.startsWith("ai_result=")) return null;
  try {
    return JSON.parse(log.errorMessage.slice("ai_result=".length)) as {
      outcome: string;
      modelUsed: string;
      promptVersion: string;
      estimatedInputTokens: number;
      estimatedOutputTokens: number;
      estimatedCostUsd: number;
      confidenceLevel?: ConfidenceLevel;
      skipReason?: string;
    };
  } catch {
    return null;
  }
}

export async function processRegulatoryItemWithOpenAi(input: {
  env: Pick<AppEnv, "AI_MODEL_SUMMARY" | "AI_MODEL_DEEP_ANALYSIS">;
  source: RegulationSource;
  candidate: ExtractedCandidateItem;
  rawItem: RawRegulatoryItem;
  existingUpdate: AiRegulatoryUpdate;
  planningDecision: AiDecisionRecord | ParsedAiPlanningLog;
}): Promise<OpenAiProcessingResult> {
  if (input.existingUpdate.status === "published") {
    return {
      skipped: true as const,
      reason: "Published items are not automatically reprocessed.",
      logMessage: buildOpenAiResultLogMessage({
        outcome: "skipped_published_item",
        modelUsed: input.env.AI_MODEL_SUMMARY,
        promptVersion: "openai-structured.v2",
        estimatedInputTokens: input.planningDecision.estimatedInputTokens,
        estimatedOutputTokens: input.planningDecision.estimatedOutputTokens,
        estimatedCostUsd: input.planningDecision.estimatedCostUsd,
        skipReason: "published_item_not_modified",
      }),
    };
  }

  const narrativeModel = input.planningDecision.requiresDeepAnalysis
    ? input.env.AI_MODEL_DEEP_ANALYSIS
    : input.env.AI_MODEL_SUMMARY;

  // One call covers classification + summary + obligations so the source text
  // is only paid for once.
  const analysis = await callJsonModel({
    model: narrativeModel,
    prompt: buildRegulatoryAnalysisPrompt({
      sourceName: input.source.name,
      sourceUrl: input.candidate.url,
      jurisdiction: input.source.jurisdiction,
      region: input.source.region,
      country: input.source.country,
      title: input.candidate.title,
      publicationDate: input.candidate.publicationDate ?? null,
      text: input.candidate.text,
    }),
    schema: analysisSchema,
    maxOutputTokens: input.planningDecision.requiresDeepAnalysis ? 3000 : 2000,
  });

  const confidenceLevel = normalizeOrFallback<ConfidenceLevel>(
    analysis.confidenceLevel.toLowerCase(),
    allowedConfidenceLevels,
    input.existingUpdate.confidenceLevel,
  );

  const updatePatch: OpenAiProcessingSuccess["updatePatch"] = {
    title: input.existingUpdate.title,
    jurisdiction: normalizeOrFallback<Jurisdiction>(
      analysis.jurisdiction,
      allowedJurisdictions,
      input.existingUpdate.jurisdiction,
    ),
    region: input.source.region,
    country: input.source.country,
    publicationDate: input.candidate.publicationDate ?? input.existingUpdate.publicationDate,
    oneSentenceSummary: analysis.oneSentenceSummary,
    summary: analysis.summary,
    whatHappened: analysis.whatHappened,
    whyItMatters: analysis.whyItMatters,
    practicalImpact: analysis.practicalImpact,
    affectedParties: analysis.affectedParties,
    keyObligations: analysis.keyObligations,
    complianceDeadlines: analysis.complianceDeadlines,
    enforcementRisk: analysis.enforcementRisk,
    importanceLevel: normalizeOrFallback<ImportanceLevel>(
      analysis.importanceLevel.toLowerCase(),
      allowedImportanceLevels,
      input.existingUpdate.importanceLevel,
    ),
    confidenceLevel,
    tags: Array.from(new Set(analysis.tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 12),
    developmentType: normalizeOrFallback<DevelopmentType>(
      analysis.developmentType,
      allowedDevelopmentTypes,
      input.existingUpdate.developmentType,
    ),
    legalArea: normalizeOrFallback<LegalArea>(
      analysis.legalArea,
      allowedLegalAreas,
      input.existingUpdate.legalArea,
    ),
  };

  return {
    skipped: false as const,
    updatePatch,
    modelUsed: narrativeModel,
    promptVersion: `analysis=${promptVersions.analysis};openai-structured.v2`,
    logMessage: buildOpenAiResultLogMessage({
      outcome: "completed_ai_processing",
      modelUsed: narrativeModel,
      promptVersion: "openai-structured.v2",
      estimatedInputTokens: input.planningDecision.estimatedInputTokens,
      estimatedOutputTokens: input.planningDecision.estimatedOutputTokens,
      estimatedCostUsd: input.planningDecision.estimatedCostUsd,
      confidenceLevel,
    }),
  } satisfies OpenAiProcessingResult;
}
