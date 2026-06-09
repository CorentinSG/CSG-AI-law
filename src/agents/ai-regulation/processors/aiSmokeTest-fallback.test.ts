import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

const mockedUpdateRepository = {
  listUpdates: vi.fn(),
  getRawItems: vi.fn(),
  getSources: vi.fn(),
  getProcessingLogs: vi.fn(),
  getUpdate: vi.fn(),
  getRawItem: vi.fn(),
  addProcessingLog: vi.fn(),
};

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: mockedUpdateRepository,
}));

vi.mock("@/lib/env", () => ({
  env: {
    AI_ENABLE_PROCESSING: false,
    AI_MAX_ITEMS_PER_SCAN: 1,
    AI_MONTHLY_BUDGET_USD: 5,
    AI_MAX_INPUT_TOKENS_PER_ITEM: 6000,
    AI_COST_GUARDRAILS_ENABLED: true,
    OPENAI_API_KEY: "test-key",
    AI_MODEL_RELEVANCE: "gpt-5.4-nano",
    AI_MODEL_CLASSIFICATION: "gpt-5.4-nano",
    AI_MODEL_SUMMARY: "gpt-5.4-mini",
    AI_MODEL_DEEP_ANALYSIS: "gpt-5.4",
  },
}));

const source: RegulationSource = {
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
  notes: "",
  reliabilityLevel: "high",
  preferredExtractionMethod: "rss",
  config: {},
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z",
};

const smokeRaw: RawRegulatoryItem = {
  id: "raw-smoke-001",
  sourceId: source.id,
  rawTitle: "Internal Smoke Test Draft - FTC AI voice-cloning settlement",
  rawUrl:
    "https://www.ftc.gov/news-events/news/press-releases/2026/05/internal-smoke-test-ftc-ai-voice-cloning-settlement",
  rawText: "Official-source-style smoke test draft text for one guarded AI pass.",
  rawMetadata: {
    excerpt: "Internal smoke test draft excerpt.",
    stableId: "smoke-test-ftc-ai-voice-cloning-settlement-2026-05",
    smokeTestDraft: true,
  },
  detectedAt: "2026-05-25T05:10:00.000Z",
  hash: "hash-smoke-001",
  duplicateOf: null,
  processingStatus: "processed",
  createdAt: "2026-05-25T05:10:00.000Z",
  updatedAt: "2026-05-25T05:10:00.000Z",
};

const smokeUpdate: AiRegulatoryUpdate = {
  id: "upd-smoke-001",
  sourceId: source.id,
  rawItemId: smokeRaw.id,
  title: "Internal Smoke Test Draft - FTC AI voice-cloning settlement",
  sourceName: source.name,
  sourceUrl: smokeRaw.rawUrl,
  jurisdiction: "United States federal",
  region: "North America",
  country: "United States",
  developmentType: "Enforcement action",
  legalArea: "Consumer protection",
  publicationDate: "2026-05-25",
  detectedDate: "2026-05-25",
  oneSentenceSummary: "Internal smoke test draft seeded for one-item OpenAI verification.",
  summary: "Placeholder summary.",
  whatHappened: "Placeholder what happened.",
  whyItMatters: "Placeholder why it matters.",
  practicalImpact: "Placeholder practical impact.",
  affectedParties: ["Internal reviewer"],
  keyObligations: ["No specific obligation detected from the provided text."],
  complianceDeadlines: ["No clear deadline detected."],
  enforcementRisk: "Internal-only draft.",
  importanceLevel: "high",
  confidenceLevel: "low",
  tags: ["smoke-test", "internal-only"],
  status: "needs_review",
  reviewedBy: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: "2026-05-25T05:10:00.000Z",
  updatedAt: "2026-05-25T05:10:00.000Z",
};

const resetLog: AiProcessingLog = {
  id: "proc-smoke-seed-001",
  rawItemId: smokeRaw.id,
  regulatoryUpdateId: smokeUpdate.id,
  modelUsed: "smoke-test-seed",
  promptVersion: "smoke-test-seed.v1",
  processingStartedAt: "2026-05-25T05:39:59.461Z",
  processingFinishedAt: "2026-05-25T05:39:59.462Z",
  status: "success",
  errorMessage:
    "Smoke test draft reset for controlled one-item OpenAI verification. No live AI call made by this seed step.",
  createdAt: "2026-05-25T05:39:59.462Z",
};

describe("runExistingDraftAiSmokeTest fallback hydration", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mockedUpdateRepository).forEach((mockFn) => mockFn.mockReset());
  });

  it("restores the seeded smoke-test draft when it is missing from the limited raw-items batch", async () => {
    mockedUpdateRepository.listUpdates.mockResolvedValue([smokeUpdate]);
    mockedUpdateRepository.getRawItems.mockResolvedValue([]);
    mockedUpdateRepository.getSources.mockResolvedValue([source]);
    mockedUpdateRepository.getProcessingLogs.mockResolvedValue([resetLog]);
    mockedUpdateRepository.getUpdate.mockResolvedValue(smokeUpdate);
    mockedUpdateRepository.getRawItem.mockResolvedValue(smokeRaw);
    mockedUpdateRepository.addProcessingLog.mockResolvedValue(undefined);

    const { runExistingDraftAiSmokeTest } = await import(
      "@/agents/ai-regulation/processors/aiSmokeTest"
    );

    const summary = await runExistingDraftAiSmokeTest();

    expect(summary.mode).toBe("seeded_smoke_test_draft");
    expect(summary.eligibleItems).toBe(1);
    expect(summary.processedUpdateId).toBe("upd-smoke-001");
    expect(summary.processedRawItemId).toBe("raw-smoke-001");
    expect(summary.openAiCallMade).toBe(false);
    expect(summary.message).toContain("AI processing is disabled");
  });
});
