import { createHash } from "node:crypto";

import type { RegulationSource } from "@/agents/ai-regulation/types";
import type { ConnectorFetchMetadata, ConnectorFetchState } from "@/agents/ai-regulation/connectors/types";

const USER_AGENT =
  "C-Saint-Girons-AI-Regulation-Monitor/0.1 (official-source-monitoring)";

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

/**
 * Hard per-request timeout. Without it, a hanging source freezes the whole
 * scan queue (single-flight) while the job heartbeat keeps it looking
 * healthy — the worst failure mode for a near-real-time monitor.
 */
export const CONNECTOR_FETCH_TIMEOUT_MS = 25_000;

const TRANSIENT_STATUSES = new Set([502, 503, 504]);

function isTransientNetworkError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  // A timeout already consumed the full 25s budget — never double it.
  if (name === "TimeoutError" || name === "AbortError") return false;
  const message = error instanceof Error ? error.message : String(error);
  return /(fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|socket hang up|UND_ERR)/i.test(
    message,
  );
}

function jitterDelay() {
  return new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));
}

/**
 * One retry with jitter for transient failures (network blip, 502/503/504).
 * Without it, a single blip on a live-cadence source pushes the next attempt
 * a full backoff cycle away — the opposite of near-real-time. Each attempt
 * gets a fresh timeout signal.
 */
async function fetchWithTransientRetry(
  url: string,
  buildInit: () => RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, buildInit());
    if (!TRANSIENT_STATUSES.has(response.status)) return response;
    await jitterDelay();
    return await fetch(url, buildInit());
  } catch (error) {
    if (!isTransientNetworkError(error)) throw error;
    await jitterDelay();
    return await fetch(url, buildInit());
  }
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

  const response = await fetchWithTransientRetry(source.sourceUrl, () => ({
    headers,
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(CONNECTOR_FETCH_TIMEOUT_MS),
  }));

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
