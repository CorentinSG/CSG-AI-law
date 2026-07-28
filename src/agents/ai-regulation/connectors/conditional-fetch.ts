import { createHash } from "node:crypto";

import type { RegulationSource } from "@/agents/ai-regulation/types";
import type { ConnectorFetchMetadata, ConnectorFetchState } from "@/agents/ai-regulation/connectors/types";

const USER_AGENT =
  "C-Saint-Girons-AI-Regulation-Monitor/0.1 (official-source-monitoring)";

// A single 502/503/504 or DNS blip must not be recorded as a source failure:
// consecutive failures open the circuit breaker and multiply the scan interval
// in buildSourceExecutionDecisions(), so one flaky response would otherwise
// cost a source hours of monitoring. Retry the transient classes in place; a
// retry that succeeds is an ordinary success and never reaches the breaker.
const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const TRANSIENT_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);
const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 4000;

// A source that accepts the connection and then stalls is invisible to the
// retry policy above: undici only gives up after its multi-minute default, and
// never at all if the server trickles just enough bytes to keep the socket
// alive. Because the pipeline scans sources sequentially, one such source can
// consume the whole GitHub Actions run. 20s is generous for the HTML/RSS/JSON
// documents these connectors poll — including the slower official search
// endpoints — while staying two orders of magnitude below the run budget.
// AbortSignal.timeout also covers the response body stream, so a trickled body
// aborts too (mirrors src/agents/ingestion/scraplingClient.ts).
export const CONNECTOR_REQUEST_TIMEOUT_MS = 20_000;

// A timeout is retried like any other transient failure, but three full
// deadlines would cost over a minute per source — worse than the hang it
// guards against. One logical fetch therefore shares a single budget: every
// attempt gets whichever is smaller, the per-request deadline or the budget
// left, so the attempt chain can never exceed this figure of request time
// however the failures are mixed.
const CONNECTOR_FETCH_BUDGET_MS = 45_000;

export function isTransientFetchStatus(status: number) {
  return TRANSIENT_STATUS_CODES.has(status);
}

export function isTransientFetchError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }
  // Our own deadline firing is the same class of blip as a socket timeout, so
  // it is retried within the shared budget. Only "TimeoutError" qualifies:
  // a plain "AbortError" would be a caller cancelling on purpose, and
  // retrying that would defeat the cancellation.
  if ((error as { name?: unknown }).name === "TimeoutError") return true;
  const cause = (error as { cause?: unknown }).cause;
  return cause ? isTransientFetchError(cause) : false;
}

// Full jitter: every retry picks a delay in [0, cap) so that sources failing
// together do not resynchronise into a thundering herd on the next attempt.
export function getTransientRetryDelayMs(attempt: number, random: () => number = Math.random) {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  return Math.floor(random() * cap);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTransientRetry(url: string, init: RequestInit) {
  let lastError: unknown = null;
  const budgetExpiresAt = Date.now() + CONNECTOR_FETCH_BUDGET_MS;

  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
    const isLastAttempt = attempt === MAX_FETCH_ATTEMPTS - 1;
    const timeoutMs = Math.max(
      0,
      Math.min(CONNECTOR_REQUEST_TIMEOUT_MS, budgetExpiresAt - Date.now()),
    );

    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!isTransientFetchStatus(response.status) || isLastAttempt) {
        return response;
      }
    } catch (error) {
      if (!isTransientFetchError(error) || isLastAttempt) {
        throw error;
      }
      lastError = error;
    }

    await sleep(getTransientRetryDelayMs(attempt));
  }

  // Unreachable: the final attempt always returns or throws above.
  throw lastError ?? new Error("Transient fetch retry exhausted");
}

function asFetchState(value: unknown): ConnectorFetchState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    etag: typeof record.etag === "string" ? record.etag : null,
    lastModified:
      typeof record.lastModified === "string" ? record.lastModified : null,
    contentHash:
      typeof record.contentHash === "string" ? record.contentHash : null,
    contentType:
      typeof record.contentType === "string" ? record.contentType : null,
    checkedAt: typeof record.checkedAt === "string" ? record.checkedAt : new Date().toISOString(),
  };
}

function getPreviousFetchState(source: RegulationSource) {
  return asFetchState(source.config?.runtimeFetchState);
}

function buildContentHash(body: string) {
  return createHash("sha256").update(body).digest("hex");
}

function buildNextFetchState(
  response: Response,
  contentHash: string | null,
): ConnectorFetchState {
  return {
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    contentHash,
    contentType: response.headers.get("content-type"),
    checkedAt: new Date().toISOString(),
  };
}

export interface ConditionalTextFetchResult {
  notModified: false;
  response: Response;
  body: string;
  fetchMetadata: ConnectorFetchMetadata;
  shortCircuitedByHash: boolean;
}

export interface ConditionalJsonFetchResult<T> {
  notModified: false;
  response: Response;
  json: T;
  body: string;
  fetchMetadata: ConnectorFetchMetadata;
  shortCircuitedByHash: boolean;
}

export interface ConditionalFetchNotModifiedResult {
  response: Response;
  fetchMetadata: ConnectorFetchMetadata;
  notModified: true;
}

function buildBaseHeaders(extraHeaders?: HeadersInit) {
  return {
    "User-Agent": USER_AGENT,
    ...(extraHeaders ?? {}),
  };
}

export async function fetchTextWithConditionalCaching(
  source: RegulationSource,
  extraHeaders?: HeadersInit,
): Promise<ConditionalTextFetchResult | ConditionalFetchNotModifiedResult> {
  const previousState = getPreviousFetchState(source);
  const headers = new Headers(buildBaseHeaders(extraHeaders));
  if (previousState?.etag) {
    headers.set("If-None-Match", previousState.etag);
  }
  if (previousState?.lastModified) {
    headers.set("If-Modified-Since", previousState.lastModified);
  }

  const response = await fetchWithTransientRetry(source.sourceUrl, {
    headers,
    next: { revalidate: 0 },
  } as RequestInit);

  const reusedConditionalHeaders = Boolean(
    previousState?.etag || previousState?.lastModified,
  );

  if (response.status === 304) {
    return {
      response,
      notModified: true,
      fetchMetadata: {
        state: {
          ...(previousState ?? {
            etag: null,
            lastModified: null,
            contentHash: null,
            contentType: null,
            checkedAt: new Date().toISOString(),
          }),
          checkedAt: new Date().toISOString(),
        },
        notModified: true,
        reusedConditionalHeaders,
      },
    };
  }

  const body = await response.text();
  const contentHash = buildContentHash(body);
  const shortCircuitedByHash =
    Boolean(previousState?.contentHash) && previousState?.contentHash === contentHash;

  return {
    notModified: false,
    response,
    body,
    shortCircuitedByHash,
    fetchMetadata: {
      state: buildNextFetchState(response, contentHash),
      notModified: false,
      reusedConditionalHeaders,
    },
  };
}

export async function fetchJsonWithConditionalCaching<T>(
  source: RegulationSource,
  extraHeaders?: HeadersInit,
): Promise<ConditionalJsonFetchResult<T> | ConditionalFetchNotModifiedResult> {
  const textResult = await fetchTextWithConditionalCaching(source, {
    Accept: "application/json",
    ...(extraHeaders ?? {}),
  });

  if ("notModified" in textResult && textResult.notModified) {
    return textResult;
  }

  return {
    ...textResult,
    notModified: false,
    json: JSON.parse(textResult.body) as T,
  };
}
