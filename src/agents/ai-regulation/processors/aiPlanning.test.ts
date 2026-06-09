import { describe, expect, it } from "vitest";

import {
  buildAiPlanningLogMessage,
  estimateAiCost,
  estimateMonthlyAiSpend,
  estimateTokenCount,
  parseAiPlanningLog,
  planAiProcessingBatch,
  rankCandidateForAi,
} from "@/agents/ai-regulation/processors/aiPlanning";
import type { CandidateForAiPlanning } from "@/agents/ai-regulation/processors/aiPlanning";

function makeCandidate(overrides: Partial<CandidateForAiPlanning> = {}): CandidateForAiPlanning {
  return {
    candidate: {
      title: "FTC issues AI enforcement guidance on algorithmic discrimination",
      url: "https://www.ftc.gov/example-ai-guidance",
      text:
        "The Federal Trade Commission issued official guidance on artificial intelligence, algorithmic discrimination, model transparency, risk management, and enforcement expectations for companies deploying automated decision-making systems.",
      excerpt: "Official FTC AI guidance.",
      publicationDate: "2026-05-20",
      sourceId: "src-ftc-ai-press",
      sourceName: "FTC AI Press Releases",
      jurisdictionHint: "United States federal",
    },
    rawItem: {
      id: "raw-1",
      sourceId: "src-ftc-ai-press",
      rawTitle: "FTC guidance",
      rawUrl: "https://www.ftc.gov/example-ai-guidance",
      rawText: "raw",
      rawMetadata: {},
      detectedAt: "2026-05-21T12:00:00.000Z",
      hash: "hash-1",
      duplicateOf: null,
      processingStatus: "new",
      createdAt: "2026-05-21T12:00:00.000Z",
      updatedAt: "2026-05-21T12:00:00.000Z",
    },
    source: {
      id: "src-ftc-ai-press",
      name: "FTC AI Press Releases",
      jurisdiction: "United States federal",
      region: "North America",
      country: "United States",
      sourceUrl: "https://www.ftc.gov/feeds/press-release.xml",
      sourceType: "RSS",
      scanFrequency: "daily",
      active: true,
      lastScannedAt: null,
      notes: "test",
      reliabilityLevel: "high",
      preferredExtractionMethod: "rss",
      createdAt: "2026-05-21T12:00:00.000Z",
      updatedAt: "2026-05-21T12:00:00.000Z",
    },
    classification: {
      jurisdiction: "United States federal",
      developmentType: "Agency guidance",
      importanceLevel: "high",
    },
    ...overrides,
  };
}

const baseEnv = {
  AI_ENABLE_PROCESSING: false,
  AI_PROCESSING_ENABLED: false,
  AI_MONTHLY_BUDGET_USD: 20,
  AI_MAX_INPUT_TOKENS_PER_ITEM: 12000,
  AI_MAX_ITEMS_PER_SCAN: 10,
  AI_MODEL_RELEVANCE: "gpt-5.4-nano",
  AI_MODEL_CLASSIFICATION: "gpt-5.4-nano",
  AI_MODEL_SUMMARY: "gpt-5.4-mini",
  AI_MODEL_DEEP_ANALYSIS: "gpt-5.4",
  AI_COST_GUARDRAILS_ENABLED: true,
  OPENAI_API_KEY: undefined,
};

describe("aiPlanning", () => {
  it("ranks high-value official guidance above a low-value generic announcement", () => {
    const highValue = rankCandidateForAi(makeCandidate());
    const lowValue = rankCandidateForAi(
      makeCandidate({
        candidate: {
          title: "General AI announcement",
          url: "https://example.com/announcement",
          text: "Official announcement about AI.",
          publicationDate: null,
        },
        source: {
          ...makeCandidate().source,
          id: "src-generic",
          name: "Generic Source",
          reliabilityLevel: "low",
        },
        classification: {
          jurisdiction: "OECD",
          developmentType: "Government announcement",
          importanceLevel: "low",
        },
      }),
    );

    expect(highValue.score).toBeGreaterThan(lowValue.score);
    expect(highValue.tier === "high" || highValue.tier === "critical").toBe(true);
  });

  it("estimates token counts deterministically", () => {
    expect(estimateTokenCount("abcd")).toBe(1);
    expect(estimateTokenCount("a".repeat(400))).toBe(100);
  });

  it("estimates higher cost when deep analysis is required", () => {
    const base = estimateAiCost({
      env: baseEnv,
      inputTokens: 1000,
      requiresDeepAnalysis: false,
    });
    const deep = estimateAiCost({
      env: baseEnv,
      inputTokens: 1000,
      requiresDeepAnalysis: true,
    });

    expect(deep.estimatedOutputTokens).toBeGreaterThan(base.estimatedOutputTokens);
    expect(deep.estimatedCostUsd).toBeGreaterThan(base.estimatedCostUsd);
  });

  it("keeps AI-disabled items as pending instead of allowing live processing", () => {
    const [decision] = planAiProcessingBatch([makeCandidate()], baseEnv, 0);

    expect(decision?.decision).toBe("pending_ai_processing");
  });

  it("skips items that exceed the per-item token limit", () => {
    const [decision] = planAiProcessingBatch(
      [
        makeCandidate({
          candidate: {
            ...makeCandidate().candidate,
            text: "x".repeat(60000),
          },
        }),
      ],
      baseEnv,
      0,
    );

    expect(decision?.decision).toBe("skipped_due_to_token_limit");
  });

  it("enforces the monthly budget", () => {
    const [decision] = planAiProcessingBatch(
      [makeCandidate()],
      { ...baseEnv, AI_MONTHLY_BUDGET_USD: 0.000001 },
      0,
    );

    expect(decision?.decision).toBe("skipped_due_to_budget");
  });

  it("skips lower-ranked items past the per-scan cap", () => {
    const decisions = planAiProcessingBatch(
      [makeCandidate(), makeCandidate({ rawItem: { ...makeCandidate().rawItem, id: "raw-2" } })],
      { ...baseEnv, AI_MAX_ITEMS_PER_SCAN: 1 },
      0,
    );

    expect(decisions[0]?.decision).toBe("pending_ai_processing");
    expect(decisions[1]?.decision).toBe("skipped_due_to_scan_limit");
  });

  it("requires an API key when live AI is explicitly enabled", () => {
    const [decision] = planAiProcessingBatch(
      [makeCandidate()],
      { ...baseEnv, AI_ENABLE_PROCESSING: true, AI_PROCESSING_ENABLED: true },
      0,
    );

    expect(decision?.decision).toBe("skipped_due_to_missing_api_key");
  });

  it("serializes and parses AI planning logs", () => {
    const [decision] = planAiProcessingBatch([makeCandidate()], baseEnv, 0);
    const message = buildAiPlanningLogMessage(decision!);
    const parsed = parseAiPlanningLog({
      errorMessage: message,
    });

    expect(parsed?.decision).toBe("pending_ai_processing");
    expect(parsed?.sourceId).toBe("src-ftc-ai-press");
  });

  it("estimates monthly spend from pending or allowed AI decisions", () => {
    const [decision] = planAiProcessingBatch([makeCandidate()], baseEnv, 0);
    const spend = estimateMonthlyAiSpend([
      {
        createdAt: new Date().toISOString(),
        errorMessage: buildAiPlanningLogMessage(decision!),
      },
    ]);

    expect(spend).toBeGreaterThan(0);
  });
});
