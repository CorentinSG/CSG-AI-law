import { describe, expect, it, vi, afterEach } from "vitest";

const runAiRegulationScan = vi.fn(async (sourceId: string) => [
  { sourceId, status: "success" },
]);
const getSources = vi.fn();

vi.mock("@/agents/ai-regulation/processors/pipeline", () => ({
  runAiRegulationScan,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: {
    getSources,
  },
}));

describe("country legal news agent factory", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs only active sources assigned to the generated country agent", async () => {
    getSources.mockResolvedValueOnce([
      { id: "src-bg-dpa-ai", active: true },
      { id: "src-bg-newsapi-ai", active: true },
      { id: "src-fr-newsapi-ai", active: true },
      { id: "src-bg-gdelt-ai", active: false },
    ]);

    const { runBulgariaLegalNewsAgentScan } = await import(
      "@/agents/ai-regulation/bulgariaLegalNewsAgent"
    );

    const result = await runBulgariaLegalNewsAgentScan({
      profile: "live_news_scan",
    });

    expect(runAiRegulationScan).toHaveBeenCalledTimes(2);
    expect(runAiRegulationScan).toHaveBeenCalledWith("src-bg-dpa-ai", {
      trigger: "scheduled_local_test",
      scanProfile: "live_news_discovery_scan",
    });
    expect(runAiRegulationScan).toHaveBeenCalledWith("src-bg-newsapi-ai", {
      trigger: "scheduled_local_test",
      scanProfile: "live_news_discovery_scan",
    });
    expect(result).toMatchObject({
      status: "completed",
      activeSourceIds: ["src-bg-dpa-ai", "src-bg-newsapi-ai"],
    });
  });

  it("returns an explicit skipped diagnostic when no assigned source is active", async () => {
    getSources.mockResolvedValueOnce([{ id: "src-fr-newsapi-ai", active: true }]);

    const { runBulgariaLegalNewsAgentScan } = await import(
      "@/agents/ai-regulation/bulgariaLegalNewsAgent"
    );

    const result = await runBulgariaLegalNewsAgentScan({
      profile: "official_legal_scan",
    });

    expect(runAiRegulationScan).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "skipped",
      activeSourceIds: [],
      reason: "No active scannable source is currently registered for this agent/profile.",
    });
  });
});
