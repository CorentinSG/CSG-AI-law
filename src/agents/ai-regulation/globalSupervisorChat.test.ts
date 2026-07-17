import { describe, expect, it, vi } from "vitest";

import { handleGlobalSupervisorChat } from "@/agents/ai-regulation/globalSupervisorChat";

vi.mock("@/agents/ai-regulation/globalMonitoringSupervisorAgent", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/agents/ai-regulation/globalMonitoringSupervisorAgent")>();

  return {
    ...actual,
    runGlobalMonitoringSupervisorAgent: vi.fn(async () => ({
      totalSupervisors: 2,
      succeeded: 2,
      failed: 0,
    })),
  };
});

describe("global supervisor chat", () => {
  it("returns a status summary by default", async () => {
    const response = await handleGlobalSupervisorChat({ message: "Tu en es ou ?" });

    expect(response).toMatchObject({
      ok: true,
      action: "status",
      summary: {
        counts: {
          eu: 28,
          us: 52,
          international: 10,
          design: 1,
          totalManaged: 91,
        },
      },
    });
  });

  it("lists the nested agent registry", async () => {
    const response = await handleGlobalSupervisorChat({ action: "list_agents" });

    expect(response).toMatchObject({
      ok: true,
      action: "list_agents",
      registry: {
        regionalSupervisors: [
          { id: "eu-monitoring-supervisor" },
          { id: "us-monitoring-supervisor" },
          { id: "international-monitoring-supervisor" },
        ],
      },
    });
  });

  it("keeps run requests in dry-run mode unless explicitly confirmed", async () => {
    const response = await handleGlobalSupervisorChat({
      message: "lance le monitoring",
    });

    expect(response).toMatchObject({
      ok: true,
      action: "run_supervisor",
      dryRun: true,
    });
  });
});
