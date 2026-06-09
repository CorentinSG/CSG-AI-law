import { describe, expect, it } from "vitest";

import { buildAdminAiReviewState, formatAdminAiSafetyLabels } from "@/app/admin/ai-regulation/review-metadata";
import type { AiProcessingLog, AiRegulatoryUpdate } from "@/agents/ai-regulation/types";

const baseUpdate: Pick<
  AiRegulatoryUpdate,
  | "rawItemId"
  | "confidenceLevel"
  | "oneSentenceSummary"
  | "summary"
  | "whatHappened"
  | "whyItMatters"
  | "practicalImpact"
  | "keyObligations"
  | "complianceDeadlines"
> = {
  rawItemId: "raw-smoke-001",
  confidenceLevel: "low",
  oneSentenceSummary: "Draft summary",
  summary: "Draft long summary",
  whatHappened: "Draft what happened",
  whyItMatters: "Draft why it matters",
  practicalImpact: "Draft practical impact",
  keyObligations: ["No specific obligation detected from the provided text."],
  complianceDeadlines: ["No clear deadline detected."],
};

describe("review-metadata", () => {
  it("surfaces failed OpenAI processing logs in admin state", () => {
    const logs: AiProcessingLog[] = [
      {
        id: "proc-plan",
        rawItemId: "raw-smoke-001",
        regulatoryUpdateId: "upd-smoke-001",
        modelUsed: "gpt-5.4-mini",
        promptVersion: "ai-planning.v1",
        processingStartedAt: "2026-05-25T05:19:05.711Z",
        processingFinishedAt: "2026-05-25T05:19:05.711Z",
        status: "success",
        errorMessage:
          'ai_planning={"version":"v1","decision":"allowed_for_live_processing","decisionReason":"Item is within current AI guardrails.","rankingScore":120,"rankingTier":"critical","rankingReasons":["high reliability source"],"estimatedInputTokens":317,"estimatedOutputTokens":2640,"estimatedCostUsd":0.013109,"requiresDeepAnalysis":true,"monthlyBudgetUsd":5,"monthlySpendBeforeUsd":0,"monthlyProjectedSpendUsd":0.013109,"aiEnabled":true,"models":{"relevance":"gpt-5.4-nano","classification":"gpt-5.4-nano","summary":"gpt-5.4-mini","deepAnalysis":"gpt-5.4"},"rawItemId":"raw-smoke-001","sourceId":"src-ftc-ai-press","sourceName":"FTC AI Press Releases","title":"Internal Smoke Test Draft","publicationDate":"2026-05-25","developmentType":"Enforcement action","importanceLevel":"high","jurisdiction":"United States federal"}',
        createdAt: "2026-05-25T05:19:05.55766+00:00",
      },
      {
        id: "proc-failed",
        rawItemId: "raw-smoke-001",
        regulatoryUpdateId: "upd-smoke-001",
        modelUsed: "gpt-5.4-mini",
        promptVersion: "openai-structured.v1",
        processingStartedAt: "2026-05-25T05:19:06.269Z",
        processingFinishedAt: "2026-05-25T05:19:06.269Z",
        status: "failed",
        errorMessage: "AI smoke test fallback failed safely: 401 Incorrect API key provided.",
        createdAt: "2026-05-25T05:19:06.121819+00:00",
      },
    ];

    const state = buildAdminAiReviewState(baseUpdate, logs);

    expect(state.aiProcessingStatus).toBe("failed");
    expect(state.modelUsed).toBe("gpt-5.4-mini");
    expect(state.estimatedCostUsd).toBe(0.013109);
    expect(state.skipOrErrorReason).toContain("Incorrect API key");
    expect(state.hasAiGeneratedContent).toBe(false);
  });

  it("surfaces successful AI processing logs and confidence metadata", () => {
    const logs: AiProcessingLog[] = [
      {
        id: "proc-success",
        rawItemId: "raw-smoke-001",
        regulatoryUpdateId: "upd-smoke-001",
        modelUsed: "gpt-5.4-mini",
        promptVersion: "openai-structured.v1",
        processingStartedAt: "2026-05-25T05:20:00.000Z",
        processingFinishedAt: "2026-05-25T05:20:08.000Z",
        status: "success",
        errorMessage:
          'ai_result={"outcome":"completed_ai_processing","modelUsed":"gpt-5.4-mini","promptVersion":"openai-structured.v1","estimatedInputTokens":317,"estimatedOutputTokens":2640,"estimatedCostUsd":0.013109,"confidenceLevel":"high"}',
        createdAt: "2026-05-25T05:20:08.000Z",
      },
    ];

    const state = buildAdminAiReviewState(baseUpdate, logs);

    expect(state.aiProcessingStatus).toBe("completed");
    expect(state.hasAiGeneratedContent).toBe(true);
    expect(state.confidenceLevel).toBe("high");
    expect(state.promptVersion).toBe("openai-structured.v1");
  });

  it("keeps private safety labels for unpublished needs_review drafts", () => {
    const labels = formatAdminAiSafetyLabels({
      status: "needs_review",
      publishedAt: null,
      aiProcessingStatus: "completed",
      hasAiGeneratedContent: true,
    });

    expect(labels).toContain("AI-enriched draft - requires human review");
    expect(labels).toContain("Not publicly visible");
    expect(labels).toContain("Published items are not automatically modified");
  });

  it("uses a non-misleading label when AI processing failed", () => {
    const labels = formatAdminAiSafetyLabels({
      status: "needs_review",
      publishedAt: null,
      aiProcessingStatus: "failed",
      hasAiGeneratedContent: false,
    });

    expect(labels).toContain("AI processing failed - human review still required");
    expect(labels).not.toContain("AI-enriched draft - requires human review");
  });
});
