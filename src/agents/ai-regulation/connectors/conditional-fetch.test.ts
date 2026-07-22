import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchTextWithConditionalCaching,
} from "@/agents/ai-regulation/connectors/conditional-fetch";
import type { RegulationSource } from "@/agents/ai-regulation/types";

function makeSource(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-conditional-test",
    name: "Conditional Test Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: "https://example.eu/feed",
    sourceType: "API",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "test",
    reliabilityLevel: "high",
    preferredExtractionMethod: "api",
    config: {},
    createdAt: "2026-06-11T00:00:00.000Z",
    updatedAt: "2026-06-11T00:00:00.000Z",
    ...overrides,
  };
}

describe("conditional-fetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("reuses etag and last-modified validators when present", async () => {
    vi.mocked(fetch).mockResolvedValue(
      {
        status: 304,
        headers: new Headers({
          etag: '"abc123"',
          "last-modified": "Wed, 11 Jun 2026 12:00:00 GMT",
        }),
      } as Response,
    );

    const result = await fetchTextWithConditionalCaching(
      makeSource({
        config: {
          runtimeFetchState: {
            etag: '"abc123"',
            lastModified: "Wed, 11 Jun 2026 12:00:00 GMT",
            contentHash: "hash-1",
            contentType: "application/json",
            checkedAt: "2026-06-11T12:00:00.000Z",
          },
        },
      }),
    );

    expect(result.notModified).toBe(true);
    const fetchOptions = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(new Headers(fetchOptions?.headers).get("If-None-Match")).toBe('"abc123"');
    expect(new Headers(fetchOptions?.headers).get("If-Modified-Since")).toBe(
      "Wed, 11 Jun 2026 12:00:00 GMT",
    );
  });

  it("short-circuits when the fetched body hash matches the prior source state", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: {
          etag: '"abc124"',
          "content-type": "application/json",
        },
      }),
    );

    const result = await fetchTextWithConditionalCaching(
      makeSource({
        config: {
          runtimeFetchState: {
            etag: null,
            lastModified: null,
            contentHash:
              "4062edaf750fb8074e7e83e0c9028c94e32468a8b6f1614774328ef045150f93",
            contentType: "application/json",
            checkedAt: "2026-06-11T12:00:00.000Z",
          },
        },
      }),
    );

    expect(result.notModified).toBe(false);
    if (result.notModified) return;
    expect(result.shortCircuitedByHash).toBe(true);
    expect(result.fetchMetadata.state.etag).toBe('"abc124"');
  });

  it("retries once with jitter on a transient network failure", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("fetch failed: ECONNRESET"))
      .mockResolvedValueOnce(new Response("recovered", { status: 200 }) as Response);

    const result = await fetchTextWithConditionalCaching(makeSource());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect("body" in result && result.body).toBe("recovered");
  });

  it("does not retry after a timeout (budget already spent)", async () => {
    const timeoutError = new Error("The operation was aborted due to timeout");
    timeoutError.name = "TimeoutError";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(timeoutError);

    await expect(fetchTextWithConditionalCaching(makeSource())).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
