import { describe, expect, it, vi } from "vitest";

import type { SourceHealthCheck, ScanJob } from "@/agents/ai-regulation/governance";
import {
  buildSourceExecutionDecisions,
  buildSourceRuntimeHealthSummaries,
  getSourceRuntimeHealthSummaries,
} from "@/agents/ai-regulation/sourceRuntimeHealth";
import type { RegulationScanLog, RegulationSource } from "@/agents/ai-regulation/types";
import type { IngestionLog } from "@/agents/ingestion/types";

const repositoryMock = vi.hoisted(() => ({
  getSources: vi.fn(),
  getSourceHealthChecks: vi.fn(),
  getScanLogs: vi.fn(),
  getScanJobs: vi.fn(),
  getIngestionLogs: vi.fn(),
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: repositoryMock,
}));

function makeSource(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-cnil-ai",
    name: "CNIL AI and Algorithms",
    jurisdiction: "France",
    region: "Europe",
    country: "France",
    sourceUrl: "https://www.cnil.fr",
    sourceType: "RSS",
    scanFrequency: "hourly",
    active: true,
    lastScannedAt: "2026-06-10T10:00:00.000Z",
    lastSuccessfulScanAt: "2026-06-10T10:00:00.000Z",
    lastFailedScanAt: null,
    latestResponseStatus: 200,
    latestItemsFetched: 4,
    latestNewItemsDetected: 1,
    latestDuplicatesDetected: 0,
    latestParserWarnings: [],
    latestAccessibilityIssue: null,
    sourceReliabilityNotes: null,
    notes: "",
    reliabilityLevel: "high",
    preferredExtractionMethod: "rss",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-10T10:00:00.000Z",
    ...overrides,
  };
}

function makeHealthCheck(overrides: Partial<SourceHealthCheck> = {}): SourceHealthCheck {
  return {
    id: "shc-1",
    sourceId: "src-cnil-ai",
    checkedAt: "2026-06-10T10:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    parserStatus: "healthy",
    activeRecommendation: "keep_active",
    itemsFetched: 4,
    newItemsDetected: 1,
    duplicatesDetected: 0,
    parserWarnings: [],
    accessibilityIssue: null,
    reliabilityNotes: "Stable on latest scan.",
    createdAt: "2026-06-10T10:00:00.000Z",
    ...overrides,
  };
}

function makeScanLog(overrides: Partial<RegulationScanLog> = {}): RegulationScanLog {
  return {
    id: "scan-1",
    sourceId: "src-cnil-ai",
    scanStartedAt: "2026-06-10T09:58:00.000Z",
    scanFinishedAt: "2026-06-10T10:00:00.000Z",
    status: "success",
    itemsFound: 4,
    newItemsDetected: 1,
    duplicatesDetected: 0,
    errors: [],
    createdAt: "2026-06-10T10:00:00.000Z",
    ...overrides,
  };
}

function makeScanJob(overrides: Partial<ScanJob> = {}): ScanJob {
  return {
    id: "job-1",
    sourceId: "src-cnil-ai",
    trigger: "manual",
    requestedBy: "tester",
    status: "succeeded",
    startedAt: "2026-06-10T09:58:00.000Z",
    finishedAt: "2026-06-10T10:00:00.000Z",
    resultSummary: {},
    errorMessage: null,
    createdAt: "2026-06-10T09:58:00.000Z",
    updatedAt: "2026-06-10T10:00:00.000Z",
    ...overrides,
  };
}

function makeIngestionLog(overrides: Partial<IngestionLog> = {}): IngestionLog {
  return {
    id: "ing-1",
    source_id: "src-cnil-ai",
    method: "firecrawl",
    status: "success",
    urls_discovered: 2,
    items_ingested: 1,
    duplicates: 0,
    error_message: null,
    details: {},
    started_at: "2026-06-10T09:58:00.000Z",
    finished_at: "2026-06-10T10:00:00.000Z",
    created_at: "2026-06-10T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildSourceRuntimeHealthSummaries", () => {
  it("marks a recent successful high-priority source as healthy", () => {
    const summaries = buildSourceRuntimeHealthSummaries({
      sources: [makeSource()],
      sourceHealthChecks: [makeHealthCheck()],
      scanLogs: [makeScanLog()],
      scanJobs: [makeScanJob()],
      ingestionLogs: [makeIngestionLog()],
      now: new Date("2026-06-10T12:00:00.000Z"),
    });

    expect(summaries[0]).toMatchObject({
      sourceId: "src-cnil-ai",
      state: "healthy",
      freshnessStatus: "fresh",
      consecutiveFailures: 0,
      priorityBand: "high",
    });
  });

  it("marks a source as degraded after two consecutive failed attempts", () => {
    const summaries = buildSourceRuntimeHealthSummaries({
      sources: [makeSource({
        id: "src-es-aepd-ai",
        name: "AEPD AI and Innovation",
        jurisdiction: "Spain",
        country: "Spain",
        sourceUrl: "https://www.aepd.es",
      })],
      sourceHealthChecks: [
        makeHealthCheck({
          sourceId: "src-es-aepd-ai",
          checkedAt: "2026-06-10T07:00:00.000Z",
          parserStatus: "warnings_present",
        }),
      ],
      scanLogs: [
        makeScanLog({
          sourceId: "src-es-aepd-ai",
          id: "scan-fail-1",
          status: "failed",
          scanFinishedAt: "2026-06-10T11:00:00.000Z",
          errors: ["HTTP 500"],
        }),
      ],
      scanJobs: [makeScanJob({ sourceId: "src-es-aepd-ai" })],
      ingestionLogs: [
        makeIngestionLog({
          source_id: "src-es-aepd-ai",
          id: "ing-fail-1",
          status: "failed",
          finished_at: "2026-06-10T10:30:00.000Z",
          error_message: "Temporary upstream error",
        }),
      ],
      now: new Date("2026-06-10T12:00:00.000Z"),
    });

    expect(summaries[0]?.state).toBe("degraded");
    expect(summaries[0]?.consecutiveFailures).toBe(2);
    expect(summaries[0]?.reasons.join(" ")).toContain("Consecutive failures: 2");
  });

  it("marks a source as stale when it is inaccessible and failure-heavy", () => {
    const summaries = buildSourceRuntimeHealthSummaries({
      sources: [makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        lastSuccessfulScanAt: "2026-06-01T08:00:00.000Z",
        latestResponseStatus: 403,
      })],
      sourceHealthChecks: [
        makeHealthCheck({
          sourceId: "src-fr-legifrance-ai",
          checkedAt: "2026-06-10T11:00:00.000Z",
          responseStatus: 403,
          runtimeAccessible: false,
          parserStatus: "needs_attention",
          accessibilityIssue: "HTTP 403",
        }),
      ],
      scanLogs: [
        makeScanLog({
          sourceId: "src-fr-legifrance-ai",
          id: "scan-fail-1",
          status: "failed",
          scanFinishedAt: "2026-06-10T11:00:00.000Z",
          errors: ["HTTP 403"],
        }),
        makeScanLog({
          sourceId: "src-fr-legifrance-ai",
          id: "scan-fail-2",
          status: "failed",
          scanFinishedAt: "2026-06-10T10:00:00.000Z",
          errors: ["HTTP 403"],
        }),
        makeScanLog({
          sourceId: "src-fr-legifrance-ai",
          id: "scan-fail-3",
          status: "failed",
          scanFinishedAt: "2026-06-10T09:00:00.000Z",
          errors: ["HTTP 403"],
        }),
      ],
      scanJobs: [makeScanJob({ sourceId: "src-fr-legifrance-ai", status: "failed" })],
      ingestionLogs: [],
      now: new Date("2026-06-10T12:00:00.000Z"),
    });

    expect(summaries[0]?.state).toBe("stale");
    expect(summaries[0]?.freshnessStatus).toBe("source_inaccessible");
    expect(summaries[0]?.consecutiveFailures).toBe(3);
  });

  it("falls back to scan-frequency thresholds when a source is outside the country registries", () => {
    const summaries = buildSourceRuntimeHealthSummaries({
      sources: [makeSource({
        id: "src-ny-courts-ai",
        name: "New York Courts AI rules",
        jurisdiction: "New York",
        region: "North America",
        country: "United States",
        scanFrequency: "daily",
        sourceUrl: "https://ww2.nycourts.gov",
        lastSuccessfulScanAt: "2026-06-08T00:00:00.000Z",
      })],
      sourceHealthChecks: [],
      scanLogs: [],
      scanJobs: [],
      ingestionLogs: [],
      now: new Date("2026-06-10T12:00:00.000Z"),
    });

    expect(summaries[0]).toMatchObject({
      sourceId: "src-ny-courts-ai",
      recommendedCadence: "daily",
      freshHours: 24,
      staleHours: 168,
      freshnessStatus: "due_for_refresh",
    });
  });
});

describe("buildSourceExecutionDecisions", () => {
  it("skips a fresh source until its base cadence is due", () => {
    const decisions = buildSourceExecutionDecisions({
      sources: [makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        lastScannedAt: "2026-06-10T10:00:00.000Z",
        lastSuccessfulScanAt: "2026-06-10T10:00:00.000Z",
      })],
      sourceHealthChecks: [makeHealthCheck({
        sourceId: "src-fr-legifrance-ai",
        checkedAt: "2026-06-10T10:00:00.000Z",
      })],
      scanLogs: [makeScanLog({
        sourceId: "src-fr-legifrance-ai",
        scanFinishedAt: "2026-06-10T10:00:00.000Z",
      })],
      scanJobs: [makeScanJob({ sourceId: "src-fr-legifrance-ai" })],
      ingestionLogs: [makeIngestionLog({ source_id: "src-fr-legifrance-ai" })],
      now: new Date("2026-06-10T10:30:00.000Z"),
    });

    expect(decisions[0]).toMatchObject({
      sourceId: "src-fr-legifrance-ai",
      shouldScan: false,
      decision: "skip_until_due",
      recommendedCadence: "daily",
      consecutiveFailures: 0,
    });
  });

  it("applies exponential backoff after repeated failures", () => {
    const decisions = buildSourceExecutionDecisions({
      sources: [makeSource({
        id: "src-fr-judilibre-ai",
        name: "Judilibre AI-related decisions",
      })],
      sourceHealthChecks: [
        makeHealthCheck({
          sourceId: "src-fr-judilibre-ai",
          checkedAt: "2026-06-10T10:00:00.000Z",
          parserStatus: "warnings_present",
        }),
      ],
      scanLogs: [
        makeScanLog({
          sourceId: "src-fr-judilibre-ai",
          status: "failed",
          scanFinishedAt: "2026-06-10T10:00:00.000Z",
          errors: ["HTTP 429"],
        }),
        makeScanLog({
          sourceId: "src-fr-judilibre-ai",
          id: "scan-fail-2",
          status: "failed",
          scanFinishedAt: "2026-06-10T09:00:00.000Z",
          errors: ["HTTP 429"],
        }),
      ],
      scanJobs: [makeScanJob({ sourceId: "src-fr-judilibre-ai", status: "failed" })],
      ingestionLogs: [],
      now: new Date("2026-06-10T10:30:00.000Z"),
    });

    expect(decisions[0]).toMatchObject({
      sourceId: "src-fr-judilibre-ai",
      shouldScan: false,
      decision: "skip_backoff",
      consecutiveFailures: 2,
      recommendedCadence: "hourly_fallback",
    });
  });

  it("opens the circuit temporarily after three consecutive failures", () => {
    const decisions = buildSourceExecutionDecisions({
      sources: [makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
      })],
      sourceHealthChecks: [
        makeHealthCheck({
          sourceId: "src-fr-legifrance-ai",
          checkedAt: "2026-06-10T11:00:00.000Z",
          parserStatus: "needs_attention",
          runtimeAccessible: false,
          accessibilityIssue: "HTTP 403",
        }),
      ],
      scanLogs: [
        makeScanLog({
          sourceId: "src-fr-legifrance-ai",
          status: "failed",
          scanFinishedAt: "2026-06-10T11:00:00.000Z",
          errors: ["HTTP 403"],
        }),
        makeScanLog({
          sourceId: "src-fr-legifrance-ai",
          id: "scan-fail-2",
          status: "failed",
          scanFinishedAt: "2026-06-10T10:00:00.000Z",
          errors: ["HTTP 403"],
        }),
        makeScanLog({
          sourceId: "src-fr-legifrance-ai",
          id: "scan-fail-3",
          status: "failed",
          scanFinishedAt: "2026-06-10T09:00:00.000Z",
          errors: ["HTTP 403"],
        }),
      ],
      scanJobs: [makeScanJob({ sourceId: "src-fr-legifrance-ai", status: "failed" })],
      ingestionLogs: [],
      now: new Date("2026-06-10T18:00:00.000Z"),
    });

    expect(decisions[0]).toMatchObject({
      sourceId: "src-fr-legifrance-ai",
      shouldScan: false,
      decision: "skip_circuit_open",
      consecutiveFailures: 3,
      recommendedCadence: "daily",
    });
  });
});

describe("getSourceRuntimeHealthSummaries", () => {
  it("loads repository-backed inputs and returns the computed summaries", async () => {
    repositoryMock.getSources.mockResolvedValue([makeSource()]);
    repositoryMock.getSourceHealthChecks.mockResolvedValue([makeHealthCheck()]);
    repositoryMock.getScanLogs.mockResolvedValue([makeScanLog()]);
    repositoryMock.getScanJobs.mockResolvedValue([makeScanJob()]);
    repositoryMock.getIngestionLogs.mockResolvedValue([makeIngestionLog()]);

    const summaries = await getSourceRuntimeHealthSummaries({
      now: new Date("2026-06-10T12:00:00.000Z"),
      limitPerCollection: 25,
    });

    expect(repositoryMock.getIngestionLogs).toHaveBeenCalledWith(undefined, 25);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.state).toBe("healthy");
  });
});
