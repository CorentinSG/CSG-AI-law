import { afterEach, describe, expect, it, vi } from "vitest";

const queueAndDrainScanJob = vi.fn();
const getRepositoryMode = vi.fn(() => "supabase");
const checkUpstashRateLimit = vi.fn(async () => true);
const hasAdminSessionCookieForRequest = vi.fn(() => false);
const requestHasValidAdminAuth = vi.fn(() => false);

vi.mock("@/agents/ai-regulation/processors/scanJobs", () => ({
  queueAndDrainScanJob,
}));

vi.mock("@/db/repository", () => ({
  getRepositoryMode,
}));

vi.mock("@/lib/upstash-rate-limit", () => ({
  checkUpstashRateLimit,
}));

vi.mock("@/lib/admin-auth", () => ({
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
}));

describe("admin ai regulation scan route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.SCAN_JOB_ROUTE_ENQUEUE_ONLY;
  });

  it("rejects unauthenticated requests", async () => {
    const { POST } = await import("@/app/api/ai-regulation/scan/route");
    const response = await POST(
      new Request("http://localhost/api/ai-regulation/scan", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    expect(queueAndDrainScanJob).not.toHaveBeenCalled();
  });

  it("queues and drains a manual scan with explicit queue metadata", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);
    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-manual-queued",
        sourceId: "src-1",
        trigger: "manual",
        requestedBy: "admin-api",
        status: "queued",
      },
      processedJob: {
        id: "job-manual-processed",
        sourceId: "src-1",
        trigger: "manual",
        requestedBy: "admin-api",
        status: "succeeded",
      },
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [],
      stewardship: null,
    });

    const { POST } = await import("@/app/api/ai-regulation/scan/route");
    const response = await POST(
      new Request("http://localhost/api/ai-regulation/scan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sourceId: "src-1",
          scanProfile: "live_news_discovery_scan",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(checkUpstashRateLimit).toHaveBeenCalled();
    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: "src-1",
      trigger: "manual",
      requestedBy: "admin-api",
      scanProfile: "live_news_discovery_scan",
      executionMode: "drain",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      dataMode: "supabase",
      queuedJobProcessedImmediately: false,
      queuedJob: {
        id: "job-manual-queued",
      },
      processedJob: {
        id: "job-manual-processed",
      },
      blockingRunningJobSummaries: [],
    });
  });

  it("switches the admin API to honest enqueue-only mode when the route flag is enabled", async () => {
    process.env.SCAN_JOB_ROUTE_ENQUEUE_ONLY = "true";
    requestHasValidAdminAuth.mockReturnValueOnce(true);
    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-manual-queued",
        sourceId: "src-1",
        trigger: "manual",
        requestedBy: "admin-api",
        status: "queued",
      },
      processedJob: null,
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [],
      stewardship: null,
    });

    const { POST } = await import("@/app/api/ai-regulation/scan/route");
    const response = await POST(
      new Request("http://localhost/api/ai-regulation/scan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sourceId: "src-1",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: "src-1",
      trigger: "manual",
      requestedBy: "admin-api",
      scanProfile: undefined,
      executionMode: "enqueue_only",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      queuedJobProcessedImmediately: false,
      processedJob: null,
      queuedJob: {
        id: "job-manual-queued",
      },
    });
  });

  it("surfaces structured blocker ownership details when a healthy running job blocks execution", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);
    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-manual-queued",
        sourceId: "src-1",
        trigger: "manual",
        requestedBy: "admin-api",
        status: "queued",
      },
      processedJob: null,
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: ["job-running-1"],
      blockingRunningJobSummaries: [
        {
          jobId: "job-running-1",
          sourceId: "src-running",
          trigger: "scheduled",
          requestedBy: "vercel-cron",
          status: "running",
          leaseOwner: "local-worker",
          startedAt: "2026-06-06T10:00:00.000Z",
          heartbeatAt: "2026-06-06T10:00:20.000Z",
          runningForMs: 30_000,
          heartbeatAgeMs: 10_000,
          heartbeatTimeoutMs: 45_000,
          blockedReason: "healthy_running_job",
        },
      ],
      result: [],
      stewardship: null,
    });

    const { POST } = await import("@/app/api/ai-regulation/scan/route");
    const response = await POST(
      new Request("http://localhost/api/ai-regulation/scan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sourceId: "src-1",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      blockedByRunningJobs: ["job-running-1"],
      blockingRunningJobSummaries: [
        {
          jobId: "job-running-1",
          leaseOwner: "local-worker",
          blockedReason: "healthy_running_job",
        },
      ],
    });
  });
});
