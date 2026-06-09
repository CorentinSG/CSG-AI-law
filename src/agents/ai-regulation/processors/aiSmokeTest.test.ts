import { describe, expect, it } from "vitest";

import {
  selectExistingDraftForAiSmokeTest,
  summarizeAiLogsSince,
} from "@/agents/ai-regulation/processors/aiSmokeTest";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

const source: RegulationSource = {
  id: "src-ftc-ai-press",
  name: "FTC AI Press Feed",
  jurisdiction: "United States federal",
  region: "North America",
  country: "United States",
  sourceUrl: "https://www.ftc.gov/feeds/press-release.xml",
  sourceType: "RSS",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "",
  reliabilityLevel: "high",
  preferredExtractionMethod: "rss",
  config: {},
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
};

const rawItem: RawRegulatoryItem = {
  id: "raw-1",
  sourceId: source.id,
  rawTitle: "FTC announces AI enforcement matter",
  rawUrl: "https://www.ftc.gov/news-events/news/press-releases/ai-enforcement",
  rawText: "The Federal Trade Commission announced an AI enforcement action touching automated decision-making and consumer protection.",
  rawMetadata: {
    excerpt: "AI enforcement action touching automated decision-making.",
    stableId: "ftc-ai-enforcement-1",
  },
  detectedAt: "2026-05-25T00:00:00.000Z",
  hash: "hash-1",
  duplicateOf: null,
  processingStatus: "processed",
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
};

const baseUpdate: AiRegulatoryUpdate = {
  id: "upd-1",
  sourceId: source.id,
  rawItemId: rawItem.id,
  title: rawItem.rawTitle,
  sourceName: source.name,
  sourceUrl: rawItem.rawUrl,
  jurisdiction: "United States federal",
  region: "North America",
  country: "United States",
  developmentType: "Enforcement action",
  legalArea: "Consumer protection",
  publicationDate: "2026-05-24",
  detectedDate: "2026-05-25",
  oneSentenceSummary: "",
  summary: "",
  whatHappened: "",
  whyItMatters: "",
  practicalImpact: "",
  affectedParties: [],
  keyObligations: [],
  complianceDeadlines: [],
  enforcementRisk: "",
  importanceLevel: "high",
  confidenceLevel: "medium",
  tags: ["ftc", "ai"],
  status: "needs_review",
  reviewedBy: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
};

describe("aiSmokeTest", () => {
  it("selects an unpublished needs_review draft that has not already completed AI processing", () => {
    const processedLog: AiProcessingLog = {
      id: "proc-1",
      rawItemId: "raw-older",
      regulatoryUpdateId: "upd-older",
      modelUsed: "gpt-5.4-mini",
      promptVersion: "openai-structured.v1",
      processingStartedAt: "2026-05-25T00:00:00.000Z",
      processingFinishedAt: "2026-05-25T00:00:01.000Z",
      status: "success",
      errorMessage:
        'ai_result={"outcome":"completed_ai_processing","modelUsed":"gpt-5.4-mini","promptVersion":"openai-structured.v1","estimatedInputTokens":100,"estimatedOutputTokens":400,"estimatedCostUsd":0.002}',
      createdAt: "2026-05-25T00:00:01.000Z",
    };

    const publishedUpdate: AiRegulatoryUpdate = {
      ...baseUpdate,
      id: "upd-published",
      rawItemId: "raw-published",
      status: "published",
      publishedAt: "2026-05-25T00:00:00.000Z",
    };

    const selected = selectExistingDraftForAiSmokeTest({
      updates: [publishedUpdate, baseUpdate],
      rawItems: [rawItem],
      sources: [source],
      processingLogs: [processedLog],
    });

    expect(selected?.update.id).toBe(baseUpdate.id);
    expect(selected?.candidate.title).toBe(rawItem.rawTitle);
    expect(selected?.candidate.jurisdictionHint).toBe(baseUpdate.jurisdiction);
  });

  it("prioritizes the seeded smoke-test draft over other eligible unpublished drafts", () => {
    const smokeRaw: RawRegulatoryItem = {
      ...rawItem,
      id: "raw-smoke-001",
      rawTitle: "Internal Smoke Test Draft - FTC AI voice-cloning settlement",
      rawMetadata: {
        ...rawItem.rawMetadata,
        smokeTestDraft: true,
      },
    };

    const smokeUpdate: AiRegulatoryUpdate = {
      ...baseUpdate,
      id: "upd-smoke-001",
      rawItemId: smokeRaw.id,
      title: "Internal Smoke Test Draft - FTC AI voice-cloning settlement",
      tags: ["smoke-test", "internal-only"],
      createdAt: "2026-05-24T00:00:00.000Z",
    };

    const newerRegularUpdate: AiRegulatoryUpdate = {
      ...baseUpdate,
      id: "upd-newer",
      rawItemId: rawItem.id,
      title: "Regular needs_review draft",
      tags: ["ftc"],
      createdAt: "2026-05-25T00:00:00.000Z",
    };

    const selected = selectExistingDraftForAiSmokeTest({
      updates: [newerRegularUpdate, smokeUpdate],
      rawItems: [rawItem, smokeRaw],
      sources: [source],
      processingLogs: [],
    });

    expect(selected?.update.id).toBe(smokeUpdate.id);
    expect(selected?.priority).toBe("seeded_smoke_test_draft");
  });

  it("summarizes planning and AI result logs created during the smoke-test window", () => {
    const logs: AiProcessingLog[] = [
      {
        id: "proc-plan",
        rawItemId: "raw-1",
        regulatoryUpdateId: "upd-1",
        modelUsed: "gpt-5.4-mini",
        promptVersion: "ai-planning.v1",
        processingStartedAt: "2026-05-25T10:00:00.000Z",
        processingFinishedAt: "2026-05-25T10:00:01.000Z",
        status: "success",
        errorMessage:
          'ai_planning={"version":"v1","decision":"allowed_for_live_processing","decisionReason":"Within budget.","rankingScore":88,"rankingTier":"high","rankingReasons":["recent"],"estimatedInputTokens":1000,"estimatedOutputTokens":1240,"estimatedCostUsd":0.01,"requiresDeepAnalysis":false,"monthlyBudgetUsd":5,"monthlySpendBeforeUsd":0,"monthlyProjectedSpendUsd":0.01,"aiEnabled":true,"models":{"relevance":"gpt-5.4-nano","classification":"gpt-5.4-nano","summary":"gpt-5.4-mini"},"rawItemId":"raw-1","sourceId":"src-ftc-ai-press","sourceName":"FTC AI Press Feed","title":"FTC announces AI enforcement matter","publicationDate":"2026-05-24","developmentType":"Enforcement action","importanceLevel":"high","jurisdiction":"United States federal"}',
        createdAt: "2026-05-25T10:00:01.000Z",
      },
      {
        id: "proc-result",
        rawItemId: "raw-1",
        regulatoryUpdateId: "upd-1",
        modelUsed: "gpt-5.4-mini",
        promptVersion: "openai-structured.v1",
        processingStartedAt: "2026-05-25T10:00:02.000Z",
        processingFinishedAt: "2026-05-25T10:00:04.000Z",
        status: "success",
        errorMessage:
          'ai_result={"outcome":"completed_ai_processing","modelUsed":"gpt-5.4-mini","promptVersion":"openai-structured.v1","estimatedInputTokens":1000,"estimatedOutputTokens":1240,"estimatedCostUsd":0.01,"confidenceLevel":"high"}',
        createdAt: "2026-05-25T10:00:04.000Z",
      },
    ];

    const summary = summarizeAiLogsSince(logs, "2026-05-25T10:00:00.000Z");

    expect(summary.eligibleItems).toBe(1);
    expect(summary.processedItems).toBe(1);
    expect(summary.skippedItems).toBe(0);
    expect(summary.openAiCallMade).toBe(true);
  });
});
