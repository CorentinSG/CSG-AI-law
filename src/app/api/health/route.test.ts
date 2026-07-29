import { afterEach, describe, expect, it, vi } from "vitest";

const buildHealthSnapshot = vi.fn();

// Only the snapshot is faked. `isMonitoringStale` stays real so these tests
// exercise the actual staleness rule through the route rather than a stub of it.
vi.mock("@/lib/health", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/health")>()),
  buildHealthSnapshot,
}));

describe("health route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_AUTH_SECRET;
  });

  it("returns the public snapshot without authorization", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    buildHealthSnapshot.mockResolvedValueOnce({
      ok: true,
      database: { reachable: true },
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(buildHealthSnapshot).toHaveBeenCalledWith({ access: "public" });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      database: { reachable: true },
    });
  });

  it("returns the authenticated snapshot with a valid cron bearer", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    buildHealthSnapshot.mockResolvedValueOnce({
      ok: true,
      details: { runningJobIds: ["job-1"] },
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(
      new Request("http://localhost/api/health", {
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(buildHealthSnapshot).toHaveBeenCalledWith({ access: "authenticated" });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      details: { runningJobIds: ["job-1"] },
    });
  });

  it("returns 503 when the health snapshot is unhealthy", async () => {
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    buildHealthSnapshot.mockResolvedValueOnce({
      ok: false,
      database: { reachable: false },
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(503);
    expect(buildHealthSnapshot).toHaveBeenCalledWith({ access: "public" });
  });

  async function workerCheck(snapshot: Record<string, unknown>) {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    buildHealthSnapshot.mockResolvedValueOnce(snapshot);

    const { GET } = await import("@/app/api/health/route");
    return GET(
      new Request("http://localhost/api/health?check=worker", {
        headers: { authorization: "Bearer 1234567890abcdef" },
      }),
    );
  }

  const HOUR = 60 * 60 * 1000;

  // The case that motivated the change: between two cron runs there is no live
  // worker, which is normal operation. Alerting on it meant a 503 almost
  // continuously, and an always-red alert is one nobody reads.
  it("stays 200 between runs when a scan succeeded recently", async () => {
    const response = await workerCheck({
      ok: true,
      worker: { alive: false, heartbeatFresh: false },
      scans: { newestSuccessfulScanAgeMs: 2 * HOUR, newestSuccessfulScanAt: "2026-07-28T20:00:00Z" },
    });

    expect(response.status).toBe(200);
    expect(buildHealthSnapshot).toHaveBeenCalledWith({ access: "authenticated" });
  });

  it("returns 503 once no scan has succeeded for longer than the window", async () => {
    const response = await workerCheck({
      ok: true,
      worker: { alive: true, heartbeatFresh: true },
      scans: { newestSuccessfulScanAgeMs: 7 * HOUR, newestSuccessfulScanAt: "2026-07-28T14:00:00Z" },
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  // "Never scanned" on a monitor that has run for months is a fault, not an
  // unknown, so it must not be treated as healthy.
  it("returns 503 when no scan has ever succeeded", async () => {
    const response = await workerCheck({
      ok: true,
      worker: { alive: true, heartbeatFresh: true },
      scans: { newestSuccessfulScanAgeMs: null, newestSuccessfulScanAt: null },
    });

    expect(response.status).toBe(503);
  });
});
