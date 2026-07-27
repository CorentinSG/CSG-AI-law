import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchTextWithConditionalCaching,
  getTransientRetryDelayMs,
  isTransientFetchError,
  isTransientFetchStatus,
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
});

describe("transient retry policy", () => {
  it("treats only gateway-class statuses as transient", () => {
    for (const status of [502, 503, 504]) {
      expect(isTransientFetchStatus(status)).toBe(true);
    }
    // 4xx and 500 are the source's own answer, not a blip: retrying them
    // hides a real defect and wastes the scan budget.
    for (const status of [200, 304, 400, 403, 404, 429, 500]) {
      expect(isTransientFetchStatus(status)).toBe(false);
    }
  });

  it("recognises DNS and socket failures, including nested causes", () => {
    expect(isTransientFetchError({ code: "ENOTFOUND" })).toBe(true);
    expect(isTransientFetchError({ code: "EAI_AGAIN" })).toBe(true);
    expect(isTransientFetchError(new TypeError("fetch failed"))).toBe(false);

    const wrapped = new TypeError("fetch failed");
    (wrapped as { cause?: unknown }).cause = { code: "ECONNRESET" };
    expect(isTransientFetchError(wrapped)).toBe(true);

    expect(isTransientFetchError({ code: "CERT_HAS_EXPIRED" })).toBe(false);
    expect(isTransientFetchError(null)).toBe(false);
  });

  it("spreads retries with full jitter under a bounded cap", () => {
    expect(getTransientRetryDelayMs(0, () => 0)).toBe(0);
    expect(getTransientRetryDelayMs(0, () => 0.999)).toBeLessThan(500);
    expect(getTransientRetryDelayMs(1, () => 0.999)).toBeLessThan(1000);
    // Cap holds no matter how many attempts are requested.
    expect(getTransientRetryDelayMs(20, () => 0.999)).toBeLessThan(4000);
  });
});

describe("transient retry behaviour", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function okResponse(body: string) {
    return new Response(body, { status: 200, headers: { etag: '"ok"' } });
  }

  it("recovers from a single 503 without surfacing a failure", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(okResponse("recovered"));

    const result = await fetchTextWithConditionalCaching(makeSource());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.notModified).toBe(false);
    if (result.notModified) return;
    expect(result.response.status).toBe(200);
    expect(result.body).toBe("recovered");
  });

  it("recovers from a transient DNS error", async () => {
    const fetchMock = vi.mocked(fetch);
    const dnsError = new TypeError("fetch failed");
    (dnsError as { cause?: unknown }).cause = { code: "EAI_AGAIN" };
    fetchMock.mockRejectedValueOnce(dnsError).mockResolvedValueOnce(okResponse("resolved"));

    const result = await fetchTextWithConditionalCaching(makeSource());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.notModified).toBe(false);
    if (result.notModified) return;
    expect(result.body).toBe("resolved");
  });

  it("gives up after three attempts and returns the last transient response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response("down", { status: 502 }));

    const result = await fetchTextWithConditionalCaching(makeSource());

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.notModified).toBe(false);
    if (result.notModified) return;
    // Still a failure for the caller — the circuit breaker must see a genuine outage.
    expect(result.response.status).toBe(502);
  });

  it("does not retry a 404", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response("gone", { status: 404 }));

    await fetchTextWithConditionalCaching(makeSource());

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a non-transient network error", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(Object.assign(new Error("bad cert"), { code: "CERT_HAS_EXPIRED" }));

    await expect(fetchTextWithConditionalCaching(makeSource())).rejects.toThrow("bad cert");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
