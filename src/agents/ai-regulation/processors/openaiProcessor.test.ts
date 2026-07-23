import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildOpenAiResultLogMessage,
  parseOpenAiResultLog,
  processRegulatoryItemWithOpenAi,
} from "@/agents/ai-regulation/processors/openaiProcessor";
import { buildRegulatoryAnalysisPrompt } from "@/agents/ai-regulation/prompts/regulatoryAnalysisPrompt";

const createMock = vi.fn();

vi.mock("@/agents/ai-regulation/processors/openaiClient", () => ({
  getOpenAiClient: () => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  }),
}));

function makeInput() {
  return {
    env: {
      AI_MODEL_CLASSIFICATION: "gpt-5.4-nano",
      AI_MODEL_SUMMARY: "gpt-5.4-mini",
      AI_MODEL_DEEP_ANALYSIS: "gpt-5.4",
    },
    source: {
      id: "src-ftc-ai-press",
      name: "FTC AI Press Releases",
      jurisdiction: "United States federal" as const,
      region: "North America",
      country: "United States",
      sourceUrl: "https://www.ftc.gov/feeds/press-release.xml",
      sourceType: "RSS" as const,
      scanFrequency: "daily" as const,
      active: true,
      lastScannedAt: null,
      notes: "test",
      reliabilityLevel: "high" as const,
      preferredExtractionMethod: "rss" as const,
      createdAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
    },
    candidate: {
      title: "FTC issues AI guidance",
      url: "https://www.ftc.gov/example-ai-guidance",
      text:
        "Official FTC artificial intelligence guidance discussing algorithmic discrimination, transparency, and compliance expectations.",
      publicationDate: "2026-05-24",
    },
    rawItem: {
      id: "raw-1",
      sourceId: "src-ftc-ai-press",
      rawTitle: "FTC guidance",
      rawUrl: "https://www.ftc.gov/example-ai-guidance",
      rawText: "raw",
      rawMetadata: {},
      detectedAt: "2026-05-25T00:00:00.000Z",
      hash: "hash-1",
      duplicateOf: null,
      processingStatus: "new" as const,
      createdAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
    },
    existingUpdate: {
      id: "upd-1",
      sourceId: "src-ftc-ai-press",
      rawItemId: "raw-1",
      title: "FTC issues AI guidance",
      sourceName: "FTC AI Press Releases",
      sourceUrl: "https://www.ftc.gov/example-ai-guidance",
      jurisdiction: "United States federal" as const,
      region: "North America",
      country: "United States",
      developmentType: "Agency guidance" as const,
      legalArea: "Consumer protection" as const,
      publicationDate: "2026-05-24",
      detectedDate: "2026-05-25",
      oneSentenceSummary: "Draft",
      summary: "Draft summary",
      whatHappened: "Draft what happened",
      whyItMatters: "Draft why it matters",
      practicalImpact: "Draft practical impact",
      affectedParties: ["Lawyers"],
      keyObligations: ["Draft obligation"],
      complianceDeadlines: ["No clear deadline detected"],
      enforcementRisk: "Draft enforcement risk",
      importanceLevel: "high" as const,
      confidenceLevel: "medium" as const,
      tags: ["draft"],
      status: "needs_review" as const,
      reviewedBy: null,
      reviewedAt: null,
      publishedAt: null,
      createdAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
    },
    planningDecision: {
      decision: "allowed_for_live_processing" as const,
      decisionReason: "planner approved",
      aiEnabled: true,
      monthlyBudgetUsd: 20,
      monthlySpendBeforeUsd: 0,
      monthlyProjectedSpendUsd: 0.0042,
      models: {
        relevance: "gpt-5.4-nano",
        classification: "gpt-5.4-nano",
        summary: "gpt-5.4-mini",
      },
      rawItemId: "raw-1",
      sourceId: "src-ftc-ai-press",
      sourceName: "FTC AI Press Releases",
      title: "FTC issues AI guidance",
      url: "https://www.ftc.gov/example-ai-guidance",
      publicationDate: "2026-05-24",
      detectedAt: "2026-05-25T00:00:00.000Z",
      developmentType: "Agency guidance" as const,
      importanceLevel: "high" as const,
      jurisdiction: "United States federal" as const,
      score: 88,
      tier: "high" as const,
      reasons: ["high reliability source"],
      estimatedInputTokens: 500,
      estimatedOutputTokens: 1200,
      estimatedCostUsd: 0.0042,
      requiresDeepAnalysis: false,
    },
  };
}

describe("openaiProcessor", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("maps successful AI JSON into update fields", async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              jurisdiction: "United States federal",
              developmentType: "Agency guidance",
              legalArea: "Consumer protection",
              importanceLevel: "high",
              confidenceLevel: "high",
              tags: ["ftc", "ai-guidance"],
              oneSentenceSummary: "FTC guidance sharpens AI compliance expectations.",
              summary: "Summary text",
              whatHappened: "What happened text",
              whyItMatters: "Why it matters text",
              practicalImpact: "Practical impact text",
              affectedParties: ["AI vendors", "Compliance teams"],
              enforcementRisk: "Enforcement risk text",
              keyObligations: ["Review AI marketing claims."],
              complianceDeadlines: ["No clear deadline detected"],
            }),
          },
        },
      ],
    });

    const result = await processRegulatoryItemWithOpenAi(makeInput());

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(result.skipped).toBe(false);
    if (!result.skipped) {
      expect(result.updatePatch.oneSentenceSummary).toContain("FTC");
      expect(result.updatePatch.legalArea).toBe("Consumer protection");
      expect(result.updatePatch.keyObligations[0]).toContain("marketing");
    }
  });

  it("handles malformed AI JSON safely", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: "not-json" } }],
    });

    await expect(processRegulatoryItemWithOpenAi(makeInput())).rejects.toThrow(
      /json/i,
    );
  });

  it("does not modify published items automatically", async () => {
    const result = await processRegulatoryItemWithOpenAi({
      ...makeInput(),
      existingUpdate: {
        ...makeInput().existingUpdate,
        status: "published",
        publishedAt: "2026-05-25T00:00:00.000Z",
      },
    });

    expect(result.skipped).toBe(true);
  });

  it("serializes and parses AI result logs", () => {
    const message = buildOpenAiResultLogMessage({
      outcome: "completed_ai_processing",
      modelUsed: "gpt-5.4-mini",
      promptVersion: "openai-structured.v1",
      estimatedInputTokens: 100,
      estimatedOutputTokens: 400,
      estimatedCostUsd: 0.0021,
      confidenceLevel: "high",
    });

    const parsed = parseOpenAiResultLog({ errorMessage: message });
    expect(parsed?.modelUsed).toBe("gpt-5.4-mini");
  });

  it("prompt construction does not include secrets", () => {
    const prompt = buildRegulatoryAnalysisPrompt({
      sourceName: "FTC",
      sourceUrl: "https://www.ftc.gov/example",
      jurisdiction: "United States federal",
      region: "North America",
      country: "United States",
      title: "FTC item",
      publicationDate: "2026-05-24",
      text: "Official AI guidance text",
    });

    expect(prompt).not.toContain("sk-");
  });
});
