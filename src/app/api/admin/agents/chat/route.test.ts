import { afterEach, describe, expect, it, vi } from "vitest";

const handleGlobalSupervisorChat = vi.fn(async () => ({
  ok: true,
  action: "status",
  reply: "ready",
}));
const checkUpstashRateLimit = vi.fn(async () => true);
const hasAdminSessionCookieForRequest = vi.fn(() => false);
const requestHasValidAdminAuth = vi.fn(() => false);

vi.mock("@/agents/ai-regulation/globalSupervisorChat", () => ({
  handleGlobalSupervisorChat,
}));

vi.mock("@/lib/upstash-rate-limit", () => ({
  checkUpstashRateLimit,
}));

vi.mock("@/lib/admin-auth", () => ({
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
}));

describe("admin agents chat route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    const { POST } = await import("@/app/api/admin/agents/chat/route");
    const response = await POST(
      new Request("http://localhost/api/admin/agents/chat", {
        method: "POST",
        body: JSON.stringify({ message: "status" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(handleGlobalSupervisorChat).not.toHaveBeenCalled();
  });

  it("passes authenticated chat messages to the global supervisor", async () => {
    requestHasValidAdminAuth.mockReturnValueOnce(true);

    const { POST } = await import("@/app/api/admin/agents/chat/route");
    const response = await POST(
      new Request("http://localhost/api/admin/agents/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ message: "liste les agents" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(checkUpstashRateLimit).toHaveBeenCalledWith("agent-chat:127.0.0.1", 20, 60_000);
    expect(handleGlobalSupervisorChat).toHaveBeenCalledWith({ message: "liste les agents" });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      action: "status",
      reply: "ready",
    });
  });
});
