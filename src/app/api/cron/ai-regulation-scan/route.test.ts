import { afterEach, describe, expect, it, vi } from "vitest";

const queueAndDrainScanJob = vi.fn();
const getRepositoryMode = vi.fn(() => "supabase");

vi.mock("@/agents/ai-regulation/processors/scanJobs", () => ({
  queueAndDrainScanJob,
}));

vi.mock("@/db/repository", () => ({
  getRepositoryMode,
}));

describe("cron ai regulation scan route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_AUTH_SECRET;
    delete process.env.APP_DATA_MODE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SCAN_JOB_ROUTE_ENQUEUE_ONLY;
  });

  it("rejects missing authorization header", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    const { GET } = await import("@/app/api/cron/ai-regulation-scan/route");
    const response = await GET(new Request("http://localhost/api/cron/ai-regulation-scan"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      reason: "missing_authorization_header",
    });
    expect(queueAndDrainScanJob).not.toHaveBeenCalled();
  });

  it("accepts a valid secret and runs the scheduled scan trigger", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-test",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron",
        status: "queued",
      },
      processedJob: {
        id: "job-test",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron",
        status: "succeeded",
      },
      queuedJobProcessedImmediately: true,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [
        {
          sourceId: "src-test",
          status: "success",
          trigger: "scheduled",
        },
      ],
    });

    const { GET } = await import("@/app/api/cron/ai-regulation-scan/route");
    const response = await GET(
      new Request("http://localhost/api/cron/ai-regulation-scan", {
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: undefined,
      trigger: "scheduled",
      requestedBy: "vercel-cron",
      executionMode: "drain",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      trigger: "scheduled",
      dataMode: "supabase",
    });
  });

  it("accepts a supported scan profile and forwards it to the scan job", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-live-news",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron",
        status: "queued",
      },
      processedJob: {
        id: "job-live-news",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron",
        status: "succeeded",
      },
      queuedJobProcessedImmediately: true,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [],
    });

    const { GET } = await import("@/app/api/cron/ai-regulation-scan/route");
    const response = await GET(
      new Request(
        "http://localhost/api/cron/ai-regulation-scan?profile=live_news_discovery_scan",
        {
          headers: {
            authorization: "Bearer 1234567890abcdef",
          },
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: undefined,
      trigger: "scheduled",
      requestedBy: "vercel-cron",
      scanProfile: "live_news_discovery_scan",
      executionMode: "drain",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      scanProfile: "live_news_discovery_scan",
    });
  });

  it("returns an honest queued-only response when enqueue-only route mode is enabled", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SCAN_JOB_ROUTE_ENQUEUE_ONLY = "true";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-queued-only",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron",
        status: "queued",
      },
      processedJob: null,
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [],
      stewardship: null,
    });

    const { GET } = await import("@/app/api/cron/ai-regulation-scan/route");
    const response = await GET(
      new Request("http://localhost/api/cron/ai-regulation-scan", {
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: undefined,
      trigger: "scheduled",
      requestedBy: "vercel-cron",
      scanProfile: undefined,
      executionMode: "enqueue_only",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      queuedJobProcessedImmediately: false,
      processedJob: null,
      queuedJob: {
        id: "job-queued-only",
      },
    });
  });

  it("returns structured blocker details when scheduled execution is standing down behind a healthy running job", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.APP_DATA_MODE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    queueAndDrainScanJob.mockResolvedValueOnce({
      queuedJob: {
        id: "job-blocked",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron",
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
          requestedBy: "vercel-cron-france",
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
    });

    const { GET } = await import("@/app/api/cron/ai-regulation-scan/route");
    const response = await GET(
      new Request("http://localhost/api/cron/ai-regulation-scan", {
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
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
        },
      ],
    });
  });
});
