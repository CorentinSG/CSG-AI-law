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

  const response = await fetch(source.sourceUrl, {
    headers,
    next: { revalidate: 0 },
  });

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
