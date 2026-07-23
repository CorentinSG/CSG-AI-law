import { afterEach, describe, expect, it, vi } from "vitest";

import {
  checkScraplingHealth,
  getScraplingWorkerUrl,
  isScraplingRuntimeAvailable,
  scraplingExtract,
} from "./scraplingClient";

describe("scrapling client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("passes source_id so the worker can load per-source extractor config", async () => {
    vi.stubEnv("SCRAPLING_WORKER_URL", "http://localhost:8765");
    vi.stubEnv("SCRAPLING_WORKER_TOKEN", "test-worker-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "https://example.com/legal",
        title: "Legal update",
        body: "Body text",
        published_at: "2026-06-22T00:00:00Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await scraplingExtract("https://example.com/legal", "src-edpb", {
      title_selector: "h1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8765/extract",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-worker-token",
        },
        body: JSON.stringify({
          url: "https://example.com/legal",
          source_id: "src-edpb",
          config: { title_selector: "h1" },
        }),
      }),
    );
    expect(result).toMatchObject({
      title: "Legal update",
      source_id: "src-edpb",
      extraction_method: "scrapling",
    });
  });

  it("requires a worker token before requesting protected extraction routes", async () => {
    vi.stubEnv("SCRAPLING_WORKER_URL", "http://localhost:8765");
    vi.stubEnv("SCRAPLING_WORKER_TOKEN", "");
    vi.stubGlobal("fetch", vi.fn());

    await expect(scraplingExtract("https://example.com/legal", "src-edpb")).rejects.toThrow(
      "Scrapling worker token is not configured",
    );
  });

  it("reports worker health without throwing when the sidecar is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    await expect(checkScraplingHealth()).resolves.toEqual({ status: "error" });
  });

  it("only enables Scrapling when its worker URL is explicitly configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_DATA_MODE", "supabase");
    vi.stubEnv("SCRAPLING_WORKER_URL", "");

    expect(isScraplingRuntimeAvailable()).toBe(false);
    expect(getScraplingWorkerUrl()).toBeNull();
  });
});
