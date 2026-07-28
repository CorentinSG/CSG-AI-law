import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONNECTOR_REQUEST_TIMEOUT_MS,
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

  it("treats our own request deadline as transient, but not a caller cancellation", () => {
    const timedOut = new DOMException("aborted due to timeout", "TimeoutError");
    expect(isTransientFetchError(timedOut)).toBe(true);

    const wrapped = new TypeError("fetch failed");
    (wrapped as { cause?: unknown }).cause = timedOut;
    expect(isTransientFetchError(wrapped)).toBe(true);

    // A deliberate cancellation must never be retried.
    expect(isTransientFetchError(new DOMException("aborted", "AbortError"))).toBe(false);
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

describe("per-request timeout", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // AbortSignal.timeout() runs on a native timer that Vitest's fake clock does
  // not patch, so stand in a controller-backed equivalent with the same
  // documented behaviour (abort after `ms` with a TimeoutError DOMException)
  // driven by the fake setTimeout, and record the deadlines that were asked for.
  function installFakeDeadlines() {
    const requestedTimeouts: number[] = [];
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms: number) => {
      requestedTimeouts.push(ms);
      const controller = new AbortController();
      setTimeout(() => {
        controller.abort(new DOMException("aborted due to timeout", "TimeoutError"));
      }, ms);
      return controller.signal;
    });
    return requestedTimeouts;
  }

  // A source that accepts the connection and then answers nothing at all.
  function hangUntilAborted(init?: RequestInit) {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });
  }

  it("arms an unfired deadline on every request", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("ok", { status: 200 }));

    await fetchTextWithConditionalCaching(makeSource());

    const signal = vi.mocked(fetch).mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
  });

  it("aborts a hung request at the deadline and retries the abort", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999); // worst-case jitter
    const requestedTimeouts = installFakeDeadlines();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((_url, init) => hangUntilAborted(init));

    const settled = fetchTextWithConditionalCaching(makeSource()).catch((error) => error);

    expect(requestedTimeouts[0]).toBe(CONNECTOR_REQUEST_TIMEOUT_MS);
    await vi.advanceTimersByTimeAsync(CONNECTOR_REQUEST_TIMEOUT_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // still hanging, deadline not reached

    // Deadline, then the full-jitter retry delay for attempt 0 (floor(.999*500)).
    await vi.advanceTimersByTimeAsync(1 + 499);
    expect(fetchMock).toHaveBeenCalledTimes(2); // the abort was retried

    await vi.advanceTimersByTimeAsync(120_000);
    await expect(settled).resolves.toMatchObject({ name: "TimeoutError" });
  });

  it("keeps the whole attempt chain inside one shared budget", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.999); // worst-case jitter
    const requestedTimeouts = installFakeDeadlines();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((_url, init) => hangUntilAborted(init));

    const startedAt = Date.now();
    const elapsedMs = fetchTextWithConditionalCaching(makeSource()).then(
      () => Date.now() - startedAt,
      () => Date.now() - startedAt,
    );

    await vi.advanceTimersByTimeAsync(120_000);

    // Two full deadlines; the last attempt only gets the budget still unspent,
    // so three hung attempts cost 45s in total instead of 3 x 20s + jitter.
    expect(requestedTimeouts).toEqual([20_000, 20_000, 3_502]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await expect(elapsedMs).resolves.toBe(45_000);
  });
});
