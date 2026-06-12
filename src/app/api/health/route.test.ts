import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {
    CRON_SECRET: "1234567890abcdef",
  },
  buildHealthResponse: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: mocks.env,
}));

vi.mock("@/lib/health", () => ({
  buildHealthResponse: mocks.buildHealthResponse,
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.CRON_SECRET = "1234567890abcdef";
    mocks.buildHealthResponse.mockResolvedValue({
      ok: true,
      visibility: "public",
      db: { reachable: true },
    });
  });

  it("returns public health without authorization", async () => {
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(new Request("https://example.test/api/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.visibility).toBe("public");
    expect(mocks.buildHealthResponse).toHaveBeenCalledWith({ visibility: "public" });
  });

  it("returns private health for a valid CRON_SECRET bearer", async () => {
    mocks.buildHealthResponse.mockResolvedValue({
      ok: true,
      visibility: "private",
      reviewBacklog: { needsReviewCount: 3 },
    });
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(
      new Request("https://example.test/api/health", {
        headers: { authorization: "Bearer 1234567890abcdef" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.visibility).toBe("private");
    expect(body.reviewBacklog.needsReviewCount).toBe(3);
    expect(mocks.buildHealthResponse).toHaveBeenCalledWith({ visibility: "private" });
  });

  it("rejects an invalid bearer without leaking private health", async () => {
    const { GET } = await import("@/app/api/health/route");

    const response = await GET(
      new Request("https://example.test/api/health", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: "Unauthorized",
      reason: "invalid_cron_secret",
    });
    expect(mocks.buildHealthResponse).not.toHaveBeenCalled();
  });
});
