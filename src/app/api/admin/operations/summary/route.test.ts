import { afterEach, describe, expect, it, vi } from "vitest";

const buildAdminOperationsSummary = vi.fn(async () => ({
  checkedAt: "2026-06-20T12:00:00.000Z",
  health: { ok: true },
}));
const hasAdminSessionCookieForRequest = vi.fn(() => false);
const requestHasValidAdminAuth = vi.fn(() => false);

vi.mock("@/lib/admin-operations-summary", () => ({
  buildAdminOperationsSummary,
}));

vi.mock("@/lib/admin-auth", () => ({
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
}));

describe("admin operations summary route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    const { GET } = await import("@/app/api/admin/operations/summary/route");
    const response = await GET(
      new Request("http://localhost/api/admin/operations/summary"),
    );

    expect(response.status).toBe(401);
    expect(buildAdminOperationsSummary).not.toHaveBeenCalled();
  });

  it("returns the admin operations summary for authenticated requests", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);

    const { GET } = await import("@/app/api/admin/operations/summary/route");
    const response = await GET(
      new Request("http://localhost/api/admin/operations/summary", {
        headers: {
          authorization: "Basic test",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(buildAdminOperationsSummary).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({
      checkedAt: "2026-06-20T12:00:00.000Z",
      health: { ok: true },
    });
  });
});
