import { afterEach, describe, expect, it, vi } from "vitest";

const enqueueCentralMonitoringSchedule = vi.fn(async () => ({
  plan: { totalAgents: 80, items: [] },
  queuedJobCount: 1,
  skippedJobCount: 0,
  queuedJobs: [{ id: "job-1" }],
  skippedJobs: [],
}));
const getCronAuthStatus = vi.fn(() => ({ ok: false, reason: "missing_authorization_header" }));
const getRepositoryMode = vi.fn(() => "supabase");

vi.mock("@/agents/ai-regulation/scheduler", () => ({
  enqueueCentralMonitoringSchedule,
}));

vi.mock("@/lib/cron-auth", () => ({
  getCronAuthStatus,
}));

vi.mock("@/db/repository", () => ({
  getRepositoryMode,
}));

vi.mock("@/lib/env", () => ({
  env: { AI_ENABLE_PROCESSING: false },
}));

describe("central scheduler cron route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getCronAuthStatus.mockReturnValue({
      ok: false,
      reason: "missing_authorization_header",
    });
  });

  it("rejects unauthenticated requests", async () => {
    const { GET } = await import("@/app/api/cron/ai-regulation-central-scheduler/route");
    const response = await GET(
      new Request("http://localhost/api/cron/ai-regulation-central-scheduler"),
    );

    expect(response.status).toBe(401);
    expect(enqueueCentralMonitoringSchedule).not.toHaveBeenCalled();
  });

  it("queues the selected central scheduler plan when authorized", async () => {
    getCronAuthStatus.mockReturnValueOnce({ ok: true, reason: "authorized" });

    const { GET } = await import("@/app/api/cron/ai-regulation-central-scheduler/route");
    const response = await GET(
      new Request(
        "http://localhost/api/cron/ai-regulation-central-scheduler?regions=us&cadences=live,hourly",
      ),
    );

    expect(response.status).toBe(200);
    expect(enqueueCentralMonitoringSchedule).toHaveBeenCalledWith({
      trigger: "scheduled",
      requestedBy: "central-monitoring-scheduler",
      regions: ["us"],
      cadences: ["live", "hourly"],
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      queuedJobCount: 1,
      plan: { totalAgents: 80 },
    });
  });

  it("accepts International as a central scheduler region", async () => {
    getCronAuthStatus.mockReturnValueOnce({ ok: true, reason: "authorized" });

    const { GET } = await import("@/app/api/cron/ai-regulation-central-scheduler/route");
    const response = await GET(
      new Request(
        "http://localhost/api/cron/ai-regulation-central-scheduler?regions=international&cadences=live",
      ),
    );

    expect(response.status).toBe(200);
    expect(enqueueCentralMonitoringSchedule).toHaveBeenCalledWith({
      trigger: "scheduled",
      requestedBy: "central-monitoring-scheduler",
      regions: ["international"],
      cadences: ["live"],
    });
  });

  it("reports missing cron secret as route misconfiguration", async () => {
    getCronAuthStatus.mockReturnValueOnce({
      ok: false,
      reason: "missing_cron_secret",
    });

    const { POST } = await import("@/app/api/cron/ai-regulation-central-scheduler/route");
    const response = await POST(
      new Request("http://localhost/api/cron/ai-regulation-central-scheduler", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Cron route misconfigured",
    });
  });
});
