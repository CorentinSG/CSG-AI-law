import { afterEach, describe, expect, it, vi } from "vitest";

const runAllActiveSourceIngestion = vi.fn();
const runSourceIngestion = vi.fn();
const getAiRegulationRepository = vi.fn();
const getRepositoryMode = vi.fn(() => "memory");

vi.mock("@/agents/ingestion/ingestionOrchestrator", () => ({
  runAllActiveSourceIngestion,
  runSourceIngestion,
}));

vi.mock("@/db/repository", () => ({
  getAiRegulationRepository,
  getRepositoryMode,
}));

describe("ingestion run route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ADMIN_AUTH_SECRET;
    delete process.env.INGESTION_SECRET;
    delete process.env.APP_DATA_MODE;
  });

  it("rejects GET without triggering ingestion", async () => {
    const { GET } = await import("@/app/api/ingestion/run/route");

    const response = await GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(runAllActiveSourceIngestion).not.toHaveBeenCalled();
    expect(runSourceIngestion).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      reason: "Use POST to trigger ingestion.",
    });
  });

  it("keeps POST as the authorized ingestion trigger", async () => {
    process.env.ADMIN_AUTH_SECRET = "123456789012345678901234";
    process.env.INGESTION_SECRET = "1234567890abcdef";
    process.env.APP_DATA_MODE = "memory";
    const { resetEnvForTests } = await import("@/lib/env");
    resetEnvForTests();
    runAllActiveSourceIngestion.mockResolvedValueOnce([
      {
        source_id: "src-1",
        source_name: "Source",
        status: "success",
        items_found: 1,
        items_ingested: 1,
        duplicates: 0,
        errors: [],
      },
    ]);

    const { POST } = await import("@/app/api/ingestion/run/route");
    const response = await POST(
      new Request("http://localhost/api/ingestion/run", {
        method: "POST",
        headers: {
          authorization: "Bearer 1234567890abcdef",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(runAllActiveSourceIngestion).toHaveBeenCalledWith({
      methods: ["firecrawl", "scrapling", "hybrid"],
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      dataMode: "memory",
      sourcesRun: 1,
      totalIngested: 1,
    });
  });
});
