import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { RegulationScanLog } from "@/agents/ai-regulation/types";

const mocks = vi.hoisted(() => ({
  repositoryMode: "memory",
  updateRepository: {
    getScanLogs: vi.fn(),
    getScanJobs: vi.fn(),
    listUpdatesPage: vi.fn(),
  },
}));

vi.mock("@/db/repository", () => ({
  getRepositoryMode: () => mocks.repositoryMode,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: mocks.updateRepository,
}));

function makeScanLog(overrides: Partial<RegulationScanLog> = {}): RegulationScanLog {
  return {
    id: "scan-1",
    sourceId: "src-1",
    scanStartedAt: "2026-06-12T09:55:00.000Z",
    scanFinishedAt: "2026-06-12T10:00:00.000Z",
    status: "success",
    itemsFound: 1,
    newItemsDetected: 1,
    duplicatesDetected: 0,
    errors: ["scan_profile=global"],
    createdAt: "2026-06-12T10:00:00.000Z",
    ...overrides,
  };
}

function makeScanJob(overrides: Partial<ScanJob> = {}): ScanJob {
  return {
    id: "job-1",
    sourceId: "src-1",
    trigger: "scheduled",
    requestedBy: "cron",
    status: "running",
    startedAt: "2026-06-12T10:02:00.000Z",
    finishedAt: null,
    resultSummary: {
      leaseHeartbeatAt: "2026-06-12T10:04:00.000Z",
      leaseOwner: "local-worker",
    },
    errorMessage: null,
    createdAt: "2026-06-12T10:02:00.000Z",
    updatedAt: "2026-06-12T10:04:00.000Z",
    ...overrides,
  };
}

describe("buildHealthResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repositoryMode = "memory";
    mocks.updateRepository.getScanLogs.mockResolvedValue([
      makeScanLog(),
      makeScanLog({
        id: "scan-2",
        sourceId: "src-2",
        scanFinishedAt: "2026-06-12T09:30:00.000Z",
        errors: ["scan_profile=france"],
      }),
      makeScanLog({
        id: "scan-alert",
        sourceId: "ops-alerting",
        scanFinishedAt: "2026-06-12T10:03:00.000Z",
        errors: ["alert_digest_sent=2026-06-12"],
      }),
    ]);
    mocks.updateRepository.getScanJobs.mockResolvedValue([makeScanJob()]);
    mocks.updateRepository.listUpdatesPage.mockResolvedValue({
      items: [],
      total: 9,
      limit: 1,
      offset: 0,
      hasMore: true,
    });
  });

  it("returns coarse public health without review backlog details", async () => {
    const { buildHealthResponse } = await import("@/lib/health");

    const health = await buildHealthResponse({
      visibility: "public",
      now: new Date("2026-06-12T10:05:00.000Z"),
      rawEnv: { VERCEL_GIT_COMMIT_SHA: "abc123" } as unknown as NodeJS.ProcessEnv,
    });

    expect(health).toMatchObject({
      ok: true,
      visibility: "public",
      db: { reachable: true },
      scans: {
        latestSuccessfulScanAt: "2026-06-12T10:00:00.000Z",
        latestSuccessfulScanAgeMs: 5 * 60 * 1000,
      },
      worker: {
        available: true,
        heartbeatAt: "2026-06-12T10:04:00.000Z",
        heartbeatAgeMs: 60 * 1000,
        leaseOwner: "local-worker",
        jobId: "job-1",
      },
      reviewBacklog: { needsReviewCount: null },
      app: {
        version: "0.1.0",
        commit: "abc123",
      },
    });
    expect(health.scans.byProfileFamily).toBeUndefined();
  });

  it("returns private profile-family scan ages and needs-review count", async () => {
    const { buildHealthResponse } = await import("@/lib/health");

    const health = await buildHealthResponse({
      visibility: "private",
      now: new Date("2026-06-12T10:05:00.000Z"),
    });

    expect(health.reviewBacklog.needsReviewCount).toBe(9);
    expect(health.scans.byProfileFamily).toMatchObject({
      global: {
        latestSuccessfulScanAt: "2026-06-12T10:00:00.000Z",
        latestSuccessfulScanAgeMs: 5 * 60 * 1000,
      },
      france: {
        latestSuccessfulScanAt: "2026-06-12T09:30:00.000Z",
        latestSuccessfulScanAgeMs: 35 * 60 * 1000,
      },
    });
  });

  it("marks db unreachable without throwing", async () => {
    mocks.updateRepository.getScanLogs.mockRejectedValue(new Error("db down"));
    const { buildHealthResponse } = await import("@/lib/health");

    const health = await buildHealthResponse({
      visibility: "private",
      now: new Date("2026-06-12T10:05:00.000Z"),
    });

    expect(health.ok).toBe(false);
    expect(health.db.reachable).toBe(false);
    expect(health.errors).toEqual(["db down"]);
  });
});
