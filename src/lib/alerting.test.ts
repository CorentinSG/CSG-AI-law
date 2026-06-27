import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { RegulationScanLog, RegulationSource } from "@/agents/ai-regulation/types";

const mocks = vi.hoisted(() => ({
  env: {
    ALERT_WEBHOOK_URL: "https://alerts.example.test/webhook",
  },
  updateRepository: {
    getSource: vi.fn(),
    getSourceHealthChecks: vi.fn(),
    getScanLogsBySource: vi.fn(),
    getScanJobs: vi.fn(),
    getIngestionLogs: vi.fn(),
    addScanLog: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: mocks.env,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: mocks.updateRepository,
}));

function makeSource(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-alert",
    name: "Alert Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "France",
    sourceUrl: "https://authority.example.test",
    sourceType: "regulator_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: "2026-06-11T09:00:00.000Z",
    lastSuccessfulScanAt: "2026-06-11T09:00:00.000Z",
    lastFailedScanAt: null,
    latestResponseStatus: 200,
    latestItemsFetched: 1,
    latestNewItemsDetected: 1,
    latestDuplicatesDetected: 0,
    latestParserWarnings: [],
    latestAccessibilityIssue: null,
    sourceReliabilityNotes: "Stable.",
    notes: "Official source.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "rss",
    config: {},
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-11T09:00:00.000Z",
    ...overrides,
  };
}

function makeScanLog(overrides: Partial<RegulationScanLog> = {}): RegulationScanLog {
  return {
    id: `log-${Math.random()}`,
    sourceId: "src-alert",
    scanStartedAt: "2026-06-12T10:00:00.000Z",
    scanFinishedAt: "2026-06-12T10:00:01.000Z",
    status: "failed",
    itemsFound: 0,
    newItemsDetected: 0,
    duplicatesDetected: 0,
    errors: ["HTTP 500"],
    createdAt: "2026-06-12T10:00:01.000Z",
    ...overrides,
  };
}

function makeJob(overrides: Partial<ScanJob> = {}): ScanJob {
  return {
    id: "job-alert",
    sourceId: null,
    trigger: "scheduled",
    requestedBy: "cron",
    status: "succeeded",
    startedAt: "2026-06-12T10:00:00.000Z",
    finishedAt: "2026-06-12T10:01:00.000Z",
    resultSummary: { scanProfile: "global" },
    errorMessage: null,
    createdAt: "2026-06-12T10:00:00.000Z",
    updatedAt: "2026-06-12T10:01:00.000Z",
    ...overrides,
  };
}

describe("alerting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.ALERT_WEBHOOK_URL = "https://alerts.example.test/webhook";
    mocks.updateRepository.getSource.mockResolvedValue(makeSource({
      latestResponseStatus: 500,
      latestAccessibilityIssue: "HTTP 500",
      lastFailedScanAt: "2026-06-12T10:00:01.000Z",
    }));
    mocks.updateRepository.getSourceHealthChecks.mockResolvedValue([
      {
        id: "check-alert",
        sourceId: "src-alert",
        checkedAt: "2026-06-12T10:00:01.000Z",
        responseStatus: 500,
        runtimeAccessible: false,
        parserStatus: "healthy",
        activeRecommendation: "needs_manual_review",
        itemsFetched: 0,
        newItemsDetected: 0,
        duplicatesDetected: 0,
        parserWarnings: [],
        accessibilityIssue: "HTTP 500",
        reliabilityNotes: "HTTP 500",
        createdAt: "2026-06-12T10:00:01.000Z",
      },
    ]);
    mocks.updateRepository.getScanLogsBySource.mockResolvedValue([
      makeScanLog({ scanFinishedAt: "2026-06-12T10:00:01.000Z" }),
      makeScanLog({ scanFinishedAt: "2026-06-11T10:00:01.000Z" }),
      makeScanLog({ scanFinishedAt: "2026-06-10T10:00:01.000Z" }),
    ]);
    mocks.updateRepository.getScanJobs.mockResolvedValue([]);
    mocks.updateRepository.getIngestionLogs.mockResolvedValue([]);
    mocks.updateRepository.addScanLog.mockResolvedValue(makeScanLog());
  });

  it("does not attempt delivery when the webhook URL is unset", async () => {
    const fetchImpl = vi.fn();
    const { postAlertPayload } = await import("@/lib/alerting");

    const result = await postAlertPayload(
      { kind: "review_backlog_digest", emittedAt: "2026-06-12T10:00:00.000Z" },
      { webhookUrl: "", fetchImpl },
    );

    expect(result).toEqual({ attempted: false, ok: true, status: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts a compact JSON payload to the configured webhook", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    const { postAlertPayload } = await import("@/lib/alerting");

    const result = await postAlertPayload(
      {
        kind: "source_consecutive_failures",
        emittedAt: "2026-06-12T10:00:00.000Z",
        sourceId: "src-alert",
        consecutiveFailures: 3,
      },
      { webhookUrl: "https://alerts.example.test/webhook", fetchImpl },
    );

    expect(result).toEqual({ attempted: true, ok: true, status: 204 });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://alerts.example.test/webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "source_consecutive_failures",
          emittedAt: "2026-06-12T10:00:00.000Z",
          sourceId: "src-alert",
          consecutiveFailures: 3,
        }),
      }),
    );
  });

  it("emits source state and consecutive-failure alerts without item content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const { alertOnSourceScanFinalized } = await import("@/lib/alerting");

    await alertOnSourceScanFinalized({
      sourceBeforeUpdate: makeSource(),
      scanStatus: "failed",
      trigger: "scheduled",
      scanProfile: "global",
      scanJobId: "job-alert",
      responseStatus: 500,
      checkedAt: "2026-06-12T10:00:01.000Z",
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const bodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String(call[1]?.body)),
    );
    expect(bodies.map((body) => body.kind)).toEqual([
      "source_runtime_state",
      "source_consecutive_failures",
    ]);
    expect(bodies[0]).toMatchObject({
      sourceId: "src-alert",
      previousState: "healthy",
      currentState: "stale",
      scanStatus: "failed",
      responseStatus: 500,
    });
    expect(JSON.stringify(bodies)).not.toContain("rawText");
    vi.unstubAllGlobals();
  });

  it("records one daily digest marker even when webhook delivery fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("webhook down")));
    mocks.updateRepository.getScanLogsBySource.mockResolvedValue([]);
    const { alertOnDailyReviewBacklog } = await import("@/lib/alerting");

    await expect(
      alertOnDailyReviewBacklog({
        job: makeJob(),
        needsReviewBacklogSize: 7,
      }),
    ).resolves.toBeUndefined();

    expect(mocks.updateRepository.addScanLog).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: "ops-alerting",
        status: "success",
        errors: [expect.stringMatching(/^alert_digest_sent=\d{4}-\d{2}-\d{2}$/)],
      }),
    );
    vi.unstubAllGlobals();
  });

  it("prefers persisted failure reasons when composing backlog digest alert text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    mocks.updateRepository.getScanLogsBySource.mockResolvedValue([]);
    const { alertOnDailyReviewBacklog } = await import("@/lib/alerting");

    await alertOnDailyReviewBacklog({
      job: makeJob({
        status: "failed",
        errorMessage: "stale fallback",
        resultSummary: {
          scanProfile: "global",
          failureReasons: ["HTTP 503", "source_failed:src-alert"],
        },
      }),
      needsReviewBacklogSize: 4,
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      kind: "review_backlog_digest",
      failureReasons: ["HTTP 503", "source_failed:src-alert"],
      text: expect.stringContaining("HTTP 503"),
    });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("stale fallback");
    vi.unstubAllGlobals();
  });
});
