import { afterEach, describe, expect, it, vi } from "vitest";

const buildHealthSnapshot = vi.fn();

vi.mock("@/lib/health", () => ({
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

  it("returns 503 for an authenticated worker check when its heartbeat is stale", async () => {
    process.env.CRON_SECRET = "1234567890abcdef";
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();

    buildHealthSnapshot.mockResolvedValueOnce({
      ok: true,
      worker: {
        alive: false,
        heartbeatFresh: false,
      },
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(
      new Request("http://localhost/api/health?check=worker", {
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
      }),
    );

    expect(response.status).toBe(503);
    expect(buildHealthSnapshot).toHaveBeenCalledWith({ access: "authenticated" });
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      worker: { alive: false },
    });
  });
});
