import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseFailureReportLog } from "@/agents/harness/failure";
import type {
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { MemoryAiRegulationRepository } from "@/db/repositories/memory-repository";
import { resetMockStore } from "@/db/mock-store";
const mocks = vi.hoisted(() => ({
  env: {
    AI_ENABLE_PROCESSING: false,
    AI_MODEL_SUMMARY: "gpt-5.4-mini",
  },
  sourceManager: {
    getActiveSourcesForProfile: vi.fn(),
    getScheduledExecutionDecisionsForProfile: vi.fn(),
    updateLastScannedAt: vi.fn(),
  },
  sourceScanner: {
    scanSource: vi.fn(),
  },
  itemExtractor: {
    extract: vi.fn(),
  },
  deduplicator: {
    createHash: vi.fn(),
    findDuplicate: vi.fn(),
  },
  updateRepository: {
    getProcessingLogs: vi.fn(),
    createRawItem: vi.fn(),
    updateRawItemMetadata: vi.fn(),
    createUpdate: vi.fn(),
    addProcessingLog: vi.fn(),
    addScanLog: vi.fn(),
    updateSource: vi.fn(),
    addSourceHealthCheck: vi.fn(),
    upsertNewsItem: vi.fn(),
    saveUpdateEdits: vi.fn(),
  },
  repository: {
    upsertRawItem: vi.fn(),
  },
  relevanceFilter: {
    evaluate: vi.fn(),
  },
  aiClassifier: {
    classify: vi.fn(),
  },
  aiSummarizer: {
    summarize: vi.fn(),
  },
  aiPlanning: {
    estimateMonthlyAiSpend: vi.fn(),
    planAiProcessingBatch: vi.fn(),
    buildAiPlanningLogMessage: vi.fn(),
  },
  openaiProcessor: {
    processRegulatoryItemWithOpenAi: vi.fn(),
  },
  obligationExtractor: {
    extract: vi.fn(),
  },
  deadlineExtractor: {
    extract: vi.fn(),
  },
  alerting: {
    alertOnSourceScanFinalized: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: mocks.env,
}));

vi.mock("@/lib/alerting", () => mocks.alerting);

vi.mock("@/agents/ai-regulation/processors/sourceManager", () => ({
  sourceManager: mocks.sourceManager,
}));

vi.mock("@/agents/ai-regulation/processors/sourceScanner", () => ({
  sourceScanner: mocks.sourceScanner,
}));

vi.mock("@/agents/ai-regulation/processors/itemExtractor", () => ({
  itemExtractor: mocks.itemExtractor,
}));

vi.mock("@/agents/ai-regulation/processors/deduplicator", () => ({
  deduplicator: mocks.deduplicator,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: mocks.updateRepository,
}));

vi.mock("@/db/repository", () => ({
  getAiRegulationRepository: vi.fn(() => mocks.repository),
}));

vi.mock("@/agents/ai-regulation/processors/relevanceFilter", () => ({
  relevanceFilter: mocks.relevanceFilter,
}));

vi.mock("@/agents/ai-regulation/processors/aiClassifier", () => ({
  aiClassifier: mocks.aiClassifier,
}));

vi.mock("@/agents/ai-regulation/processors/aiSummarizer", () => ({
  aiSummarizer: mocks.aiSummarizer,
}));

vi.mock("@/agents/ai-regulation/processors/aiPlanning", () => mocks.aiPlanning);

vi.mock("@/agents/ai-regulation/processors/openaiProcessor", () => ({
  processRegulatoryItemWithOpenAi: mocks.openaiProcessor.processRegulatoryItemWithOpenAi,
}));

vi.mock("@/agents/ai-regulation/processors/obligationExtractor", () => ({
  obligationExtractor: mocks.obligationExtractor,
}));

vi.mock("@/agents/ai-regulation/processors/deadlineExtractor", () => ({
  deadlineExtractor: mocks.deadlineExtractor,
}));

vi.mock("@/agents/ai-regulation/verification", () => ({
  buildInitialVerificationMetadata: vi.fn(() => ({ seeded: true })),
}));

vi.mock("@/agents/ai-regulation/utils/authority", () => ({
  buildAuthorityTag: vi.fn(() => "authority:binding"),
}));

vi.mock("@/agents/ai-regulation/citations", () => ({
  buildCandidateSourceReference: vi.fn(() => ({ sourceType: "official" })),
  getSourceReferencesFromRawItem: vi.fn(() => []),
  getCitationReferences: vi.fn(() => []),
}));

vi.mock("@/agents/ai-regulation/scanProfiles", () => ({
  getScanProfile: vi.fn(() => null),
}));

vi.mock("@/agents/ai-regulation/utils/discovery", () => ({
  isDiscoveryOnlySource: vi.fn(() => false),
}));

vi.mock("@/agents/ai-regulation/processors/recurringVerification", () => ({
  runRecurringVerification: vi.fn(),
}));

vi.mock("@/content/ai-regulation/news", () => ({
  buildNewsItemFromUpdate: vi.fn(() => ({
    slug: "news-slug",
    title: "News title",
    summary: "Summary",
    publishedAt: null,
    publicVisibilityStatus: "hidden",
  })),
}));

const source: RegulationSource = {
  id: "src-1",
  name: "Official Source",
  jurisdiction: "European Union",
  region: "Europe",
  country: "Belgium",
  sourceUrl: "https://example.eu/feed.xml",
  sourceType: "RSS",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "",
  reliabilityLevel: "high",
  preferredExtractionMethod: "rss",
  config: {},
  createdAt: "2026-06-11T00:00:00.000Z",
  updatedAt: "2026-06-11T00:00:00.000Z",
};

const rawItem: RawRegulatoryItem = {
  id: "raw-1",
  sourceId: source.id,
  rawTitle: "AI courts rule",
  rawUrl: "https://example.eu/item-1",
  rawText: "AI rule text",
  rawMetadata: {},
  detectedAt: "2026-06-11T00:00:00.000Z",
  hash: "hash-1",
  duplicateOf: null,
  processingStatus: "new",
  createdAt: "2026-06-11T00:00:00.000Z",
  updatedAt: "2026-06-11T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();

  mocks.sourceManager.getActiveSourcesForProfile.mockResolvedValue([source]);
  mocks.sourceManager.getScheduledExecutionDecisionsForProfile.mockResolvedValue(
    new Map(),
  );
  mocks.env.AI_ENABLE_PROCESSING = false;
  mocks.sourceManager.updateLastScannedAt.mockResolvedValue(undefined);
  mocks.sourceScanner.scanSource.mockResolvedValue({
    items: [],
    itemsFetched: 0,
    warnings: [],
    errors: [],
    responseStatus: 200,
    zeroResultsReason: null,
  });
  mocks.itemExtractor.extract.mockReturnValue([]);
  mocks.deduplicator.createHash.mockReturnValue("hash-1");
  mocks.deduplicator.findDuplicate.mockResolvedValue(null);
  mocks.updateRepository.getProcessingLogs.mockResolvedValue([]);
  mocks.updateRepository.createRawItem.mockResolvedValue({ ...rawItem });
  mocks.repository.upsertRawItem.mockResolvedValue({
    item: { ...rawItem },
    inserted: true,
  });
  mocks.updateRepository.updateRawItemMetadata.mockImplementation(
    async (id: string, metadata: Record<string, unknown>) => ({
      ...rawItem,
      id,
      rawMetadata: metadata,
    }),
  );
  mocks.updateRepository.createUpdate.mockResolvedValue({
    id: "upd-1",
    status: "needs_review",
  });
  mocks.updateRepository.addProcessingLog.mockResolvedValue(undefined);
  mocks.updateRepository.addScanLog.mockResolvedValue(undefined);
  mocks.updateRepository.updateSource.mockResolvedValue(undefined);
  mocks.updateRepository.addSourceHealthCheck.mockResolvedValue(undefined);
  mocks.updateRepository.upsertNewsItem.mockResolvedValue(undefined);
  mocks.updateRepository.saveUpdateEdits.mockResolvedValue(undefined);
  mocks.relevanceFilter.evaluate.mockReturnValue({
    relevant: true,
    reason: "Matched AI + legal terms",
    matchedAiTerms: ["ai"],
    matchedRegulatoryTerms: ["rule"],
  });
  mocks.aiClassifier.classify.mockReturnValue({
    jurisdiction: "European Union",
    developmentType: "Court rule",
    importanceLevel: "high",
    confidenceLevel: "medium",
    authorityType: "binding_court_rule",
    legalArea: "AI governance",
    publicationDate: "2026-06-11",
    tags: ["court-rule"],
  });
  mocks.aiSummarizer.summarize.mockReturnValue({
    title: "AI courts rule",
    oneSentenceSummary: "Summary",
    summary: "Longer summary",
    whatHappened: "What happened",
    whyItMatters: "Why it matters",
    practicalImpact: "Practical impact",
    affectedParties: ["Lawyers"],
    enforcementRisk: "Sanctions possible",
  });
  mocks.aiPlanning.estimateMonthlyAiSpend.mockReturnValue(0);
  mocks.aiPlanning.planAiProcessingBatch.mockReturnValue([]);
  mocks.aiPlanning.buildAiPlanningLogMessage.mockReturnValue("planning");
  mocks.openaiProcessor.processRegulatoryItemWithOpenAi.mockResolvedValue({
    skipped: true,
    reason: "AI processing disabled in this test.",
    logMessage: "skipped",
  });
  mocks.obligationExtractor.extract.mockReturnValue(["Review filings"]);
  mocks.deadlineExtractor.extract.mockReturnValue(["No clear deadline detected."]);
});

describe("runAiRegulationScan harness wiring", () => {
  it("uses atomic raw-item upsert and treats a concurrent conflict as a duplicate", async () => {
    mocks.sourceScanner.scanSource.mockResolvedValue({
      items: [{ id: "item-1" }],
      itemsFetched: 1,
      warnings: [],
      errors: [],
      responseStatus: 200,
      zeroResultsReason: null,
    });
    mocks.itemExtractor.extract.mockReturnValue([
      {
        title: "AI courts rule",
        url: "https://example.eu/item-1",
        text: "AI rule text",
        metadata: {},
        publicationDate: "2026-06-11",
      },
    ]);
    mocks.repository.upsertRawItem.mockResolvedValue({
      item: { ...rawItem },
      inserted: false,
    });

    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );
    const [result] = await runAiRegulationScan(source.id);

    expect(mocks.repository.upsertRawItem).toHaveBeenCalledOnce();
    expect(mocks.updateRepository.createRawItem).not.toHaveBeenCalled();
    expect(result.duplicatesDetected).toBe(1);
    expect(result.newItemsDetected).toBe(0);
    expect(mocks.updateRepository.createUpdate).not.toHaveBeenCalled();
  });

  it("serializes concurrent pipeline attempts into one raw row and one update", async () => {
    resetMockStore();
    const repository = new MemoryAiRegulationRepository();
    mocks.repository.upsertRawItem.mockImplementation((input) =>
      repository.upsertRawItem(input),
    );
    mocks.sourceScanner.scanSource.mockResolvedValue({
      items: [{ id: "item-1" }],
      itemsFetched: 1,
      warnings: [],
      errors: [],
      responseStatus: 200,
      zeroResultsReason: null,
    });
    mocks.itemExtractor.extract.mockReturnValue([{
      title: "AI courts rule",
      url: "https://example.eu/item-1",
      text: "AI rule text",
      metadata: {},
      publicationDate: "2026-06-11",
    }]);

    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );
    const results = await Promise.all([
      runAiRegulationScan(source.id),
      runAiRegulationScan(source.id),
    ]);

    const durable = (await repository.listRawRegulatoryItems()).filter(
      (item) => item.hash === "hash-1",
    );
    expect(durable).toHaveLength(1);
    expect(mocks.updateRepository.createUpdate).toHaveBeenCalledOnce();
    expect(results.flat().map((result) => result.duplicatesDetected).sort()).toEqual([0, 1]);
    expect(results.flat().map((result) => result.newItemsDetected).sort()).toEqual([0, 1]);
  });

  it("stores a structured failure report in scan logs when source retrieval fails", async () => {
    mocks.sourceScanner.scanSource.mockRejectedValue(new Error("403 Forbidden"));
    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );

    await runAiRegulationScan(source.id);

    const scanLog = mocks.updateRepository.addScanLog.mock.calls[0]?.[0];
    expect(scanLog).toBeDefined();

    const structuredEntry = scanLog.errors.find((entry: string) =>
      entry.startsWith("failure_report="),
    );
    expect(structuredEntry).toBeDefined();

    const report = parseFailureReportLog(structuredEntry);
    expect(report?.impactedStep).toBe("scan_source");
    expect(report?.fixPolicy).toBe("propose-only-human-approval-required");
  });

  it("stores a structured failure report in processing logs when candidate processing fails", async () => {
    mocks.sourceScanner.scanSource.mockResolvedValue({
      items: [{ id: "item-1" }],
      itemsFetched: 1,
      warnings: [],
      errors: [],
      responseStatus: 200,
      zeroResultsReason: null,
    });
    mocks.itemExtractor.extract.mockReturnValue([
      {
        title: "AI courts rule",
        url: "https://example.eu/item-1",
        text: "AI rule text",
        excerpt: "AI rule excerpt",
        metadata: {},
        publicationDate: "2026-06-11",
      },
    ]);
    mocks.updateRepository.createUpdate.mockRejectedValue(new Error("database write failed"));
    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );

    await runAiRegulationScan(source.id);

    const failedLog = mocks.updateRepository.addProcessingLog.mock.calls
      .map(([entry]) => entry)
      .find((entry) => entry.status === "failed");

    expect(failedLog).toBeDefined();
    expect(failedLog.errorMessage.startsWith("failure_report=")).toBe(true);

    const report = parseFailureReportLog(failedLog.errorMessage);
    expect(report?.impactedStep).toBe("process_candidate");
    expect(report?.fixPolicy).toBe("propose-only-human-approval-required");
  });

  it("persists conditional-fetch runtime state back onto the source config", async () => {
    mocks.sourceScanner.scanSource.mockResolvedValue({
      items: [],
      itemsFetched: 0,
      warnings: ["Static source returned 304 Not Modified; parsing was skipped."],
      errors: [],
      responseStatus: 304,
      zeroResultsReason: "The official static source returned 304 Not Modified.",
      fetchMetadata: {
        state: {
          etag: '"etag-123"',
          lastModified: "Wed, 11 Jun 2026 12:00:00 GMT",
          contentHash: "hash-123",
          contentType: "text/html",
          checkedAt: "2026-06-11T12:01:00.000Z",
        },
        notModified: true,
        reusedConditionalHeaders: true,
      },
    });
    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );

    await runAiRegulationScan(source.id);

    expect(mocks.updateRepository.updateSource).toHaveBeenCalledWith(
      source.id,
      expect.objectContaining({
        config: expect.objectContaining({
          runtimeFetchState: {
            etag: '"etag-123"',
            lastModified: "Wed, 11 Jun 2026 12:00:00 GMT",
            contentHash: "hash-123",
            contentType: "text/html",
            checkedAt: "2026-06-11T12:01:00.000Z",
          },
        }),
      }),
    );
  });

  it("records a scheduled skip honestly without mutating source freshness fields", async () => {
    mocks.sourceManager.getScheduledExecutionDecisionsForProfile.mockResolvedValue(
      new Map([
        [
          source.id,
          {
            sourceId: source.id,
            shouldScan: false,
            decision: "skip_circuit_open",
            reason:
              "Scheduled scan skipped while the source circuit is open after 3 consecutive failures. Next eligible retry: 2026-06-11T18:00:00.000Z.",
            recommendedCadence: "daily",
            consecutiveFailures: 3,
            nextEligibleAt: "2026-06-11T18:00:00.000Z",
          },
        ],
      ]),
    );
    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );

    const results = await runAiRegulationScan(undefined, {
      trigger: "scheduled",
      scanProfile: "official_baseline_scan",
    });

    expect(mocks.sourceScanner.scanSource).not.toHaveBeenCalled();
    expect(mocks.updateRepository.addScanLog).toHaveBeenCalledOnce();
    expect(mocks.updateRepository.updateSource).not.toHaveBeenCalled();
    expect(mocks.updateRepository.addSourceHealthCheck).not.toHaveBeenCalled();
    expect(results[0]).toMatchObject({
      sourceId: source.id,
      status: "success",
      zeroResultsReason:
        "Scheduled scan skipped while the source circuit is open after 3 consecutive failures. Next eligible retry: 2026-06-11T18:00:00.000Z.",
    });
  });

  it("persists AI review-assist metadata on raw items when live processing succeeds", async () => {
    mocks.env.AI_ENABLE_PROCESSING = true;
    mocks.sourceScanner.scanSource.mockResolvedValue({
      items: [{ id: "item-1" }],
      itemsFetched: 1,
      warnings: [],
      errors: [],
      responseStatus: 200,
      zeroResultsReason: null,
    });
    mocks.itemExtractor.extract.mockReturnValue([
      {
        title: "AI courts rule",
        url: "https://example.eu/item-1",
        text: "AI rule text",
        excerpt: "AI rule excerpt",
        metadata: {},
        publicationDate: "2026-06-11",
      },
    ]);
    mocks.aiPlanning.planAiProcessingBatch.mockReturnValue([
      {
        rawItemId: "raw-1",
        decision: "allowed_for_live_processing",
        decisionReason: "Critical official item within budget.",
        rankingScore: 120,
        rankingTier: "critical",
        rankingReasons: ["official source", "binding court rule"],
        estimatedInputTokens: 300,
        estimatedOutputTokens: 1200,
        estimatedCostUsd: 0.01,
        requiresDeepAnalysis: false,
        monthlyBudgetUsd: 5,
        monthlySpendBeforeUsd: 0,
        monthlyProjectedSpendUsd: 0.01,
        aiEnabled: true,
        models: {
          relevance: "gpt-5.4-nano",
          classification: "gpt-5.4-nano",
          summary: "gpt-5.4-mini",
          deepAnalysis: "gpt-5.4",
        },
        sourceId: source.id,
        sourceName: source.name,
        title: "AI courts rule",
        publicationDate: "2026-06-11",
        developmentType: "Final rule",
        importanceLevel: "high",
        jurisdiction: "European Union",
      },
    ]);
    mocks.openaiProcessor.processRegulatoryItemWithOpenAi.mockResolvedValue({
      skipped: false,
      modelUsed: "gpt-5.4-mini",
      promptVersion:
        "analysis=analysis.v1;openai-structured.v2",
      logMessage: 'ai_result={"outcome":"completed_ai_processing"}',
      updatePatch: {
        title: "AI courts rule",
        jurisdiction: "European Union",
        region: "Europe",
        country: "Belgium",
        publicationDate: "2026-06-11",
        oneSentenceSummary: "AI filing rule summary",
        summary: "Detailed AI filing rule summary",
        whatHappened: "Court adopted an AI filing rule.",
        whyItMatters: "It changes attorney filing obligations.",
        practicalImpact: "Lawyers must review AI-assisted filings.",
        affectedParties: ["Lawyers", "Courts"],
        keyObligations: ["Disclose and verify AI-assisted content."],
        complianceDeadlines: ["Effective immediately."],
        enforcementRisk: "Sanctions remain possible.",
        importanceLevel: "high",
        confidenceLevel: "high",
        tags: ["court-rule", "ai-governance"],
        developmentType: "Final rule",
        legalArea: "Professional responsibility",
      },
    });

    const { runAiRegulationScan } = await import(
      "@/agents/ai-regulation/processors/pipeline"
    );

    await runAiRegulationScan(source.id);

    expect(mocks.updateRepository.saveUpdateEdits).toHaveBeenCalledOnce();
    const lastMetadataWrite =
      mocks.updateRepository.updateRawItemMetadata.mock.calls.at(-1)?.[1];
    expect(lastMetadataWrite).toBeDefined();
    expect(lastMetadataWrite.reviewAssist).toMatchObject({
      modelUsed: "gpt-5.4-mini",
      humanReviewRequired: true,
      publicationStatus: "hidden",
      citationQualityStatus: "needs_manual_verification",
      planningDecision: "allowed_for_live_processing",
      suggestedClassification: {
        jurisdiction: "European Union",
        developmentType: "Final rule",
        legalArea: "Professional responsibility",
        importanceLevel: "high",
        confidenceLevel: "high",
        tags: ["court-rule", "ai-governance"],
      },
      suggestedSummary: {
        oneSentenceSummary: "AI filing rule summary",
        summary: "Detailed AI filing rule summary",
      },
    });
  });
});
