import { afterEach, describe, expect, it, vi } from "vitest";

const queueAndDrainScanJob = vi.fn();
const getRepositoryMode = vi.fn(() => "supabase");

vi.mock("@/agents/ai-regulation/processors/scanJobs", () => ({
  queueAndDrainScanJob,
}));

vi.mock("@/db/repository", () => ({
  getRepositoryMode,
}));

describe("cron belgium ai regulation scan route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_AUTH_SECRET;
    delete process.env.APP_DATA_MODE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("rejects missing authorization header", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    const { GET } = await import("@/app/api/cron/ai-regulation-belgium-scan/route");
    const response = await GET(
      new Request("http://localhost/api/cron/ai-regulation-belgium-scan"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      reason: "missing_authorization_header",
    });
    expect(queueAndDrainScanJob).not.toHaveBeenCalled();
  });

  it("defaults to the Belgium official legal scan profile", async () => {
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
        id: "job-belgium-official",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron-belgium",
        status: "queued",
      },
      processedJob: {
        id: "job-belgium-official",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "vercel-cron-belgium",
        status: "succeeded",
      },
      queuedJobProcessedImmediately: true,
      result: [],
    });

    const { GET } = await import("@/app/api/cron/ai-regulation-belgium-scan/route");
    const response = await GET(
      new Request("http://localhost/api/cron/ai-regulation-belgium-scan", {
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(queueAndDrainScanJob).toHaveBeenCalledWith({
      sourceId: undefined,
      trigger: "scheduled",
      requestedBy: "vercel-cron-belgium",
      scanProfile: "belgium_official_legal_scan",
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      regionScope: "Belgium",
      scanProfile: "belgium_official_legal_scan",
    });
  });
});
