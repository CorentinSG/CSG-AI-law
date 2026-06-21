import { afterEach, describe, expect, it, vi } from "vitest";

const listPrioritizedReviewQueue = vi.fn(async () => ({
  total: 1,
  limit: 25,
  items: [{ id: "upd-1" }],
}));
const batchTransitionReviewStatus = vi.fn(async () => ({
  requested: 1,
  succeeded: 1,
  failed: 0,
  targetStatus: "approved",
  results: [{ id: "upd-1", status: "succeeded" }],
}));
const hasAdminSessionCookieForRequest = vi.fn(() => false);
const requestHasValidAdminAuth = vi.fn(() => false);

vi.mock("@/lib/admin-review-batch", () => ({
  batchReviewTargetStatuses: ["approved", "rejected", "archived"],
  listPrioritizedReviewQueue,
  batchTransitionReviewStatus,
}));

vi.mock("@/lib/admin-auth", () => ({
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
}));

describe("admin review batch route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects unauthenticated queue requests", async () => {
    const { GET } = await import("@/app/api/admin/review/batch/route");
    const response = await GET(new Request("http://localhost/api/admin/review/batch"));

    expect(response.status).toBe(401);
    expect(listPrioritizedReviewQueue).not.toHaveBeenCalled();
  });

  it("returns a prioritized queue for authenticated admins", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);

    const { GET } = await import("@/app/api/admin/review/batch/route");
    const response = await GET(new Request("http://localhost/api/admin/review/batch?limit=25"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(listPrioritizedReviewQueue).toHaveBeenCalledWith({ limit: 25 });
    await expect(response.json()).resolves.toMatchObject({
      total: 1,
      limit: 25,
    });
  });

  it("applies valid batch transitions", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);

    const { POST } = await import("@/app/api/admin/review/batch/route");
    const response = await POST(
      new Request("http://localhost/api/admin/review/batch", {
        method: "POST",
        body: JSON.stringify({
          ids: ["upd-1"],
          targetStatus: "approved",
          reviewer: "Ops",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(batchTransitionReviewStatus).toHaveBeenCalledWith({
      ids: ["upd-1"],
      targetStatus: "approved",
      reviewer: "Ops",
    });
  });

  it("rejects unsafe or invalid batch transitions", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);

    const { POST } = await import("@/app/api/admin/review/batch/route");
    const response = await POST(
      new Request("http://localhost/api/admin/review/batch", {
        method: "POST",
        body: JSON.stringify({
          ids: ["upd-1"],
          targetStatus: "published",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(batchTransitionReviewStatus).not.toHaveBeenCalled();
  });
});
