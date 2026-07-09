/**
 * Node.js HTTP client for the Scrapling Python sidecar worker.
 *
 * The Scrapling library is Python-only. This client calls the Python
 * worker service at SCRAPLING_WORKER_URL (default: http://localhost:8765).
 *
 * See scrapling_worker/README.md for setup instructions.
 */

import { computeContentHash, normalizeUrl } from "./deduplication";
import type { NormalizedDocument, ScraplingConfig, ScraplingExtractResult, ScraplingHealthResult } from "./types";

const LOCAL_SCRAPLING_WORKER_URL = "http://localhost:8765";
const PRODUCTION_SCRAPLING_WORKER_URL =
  "https://fantastic-nourishment-production-6d34.up.railway.app";

export function getScraplingWorkerUrl() {
  const configuredUrl = process.env.SCRAPLING_WORKER_URL?.trim();
  if (configuredUrl) return configuredUrl;

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_SCRAPLING_WORKER_URL
    : LOCAL_SCRAPLING_WORKER_URL;
}

export function isScraplingRuntimeAvailable() {
  return Boolean(process.env.SCRAPLING_WORKER_URL?.trim()) || process.env.NODE_ENV === "production";
}

/** Extract a single URL via the Scrapling worker. */
export async function scraplingExtract(
  url: string,
  sourceId: string,
  config?: ScraplingConfig
): Promise<NormalizedDocument | null> {
  const normalized = normalizeUrl(url);
  const workerUrl = getScraplingWorkerUrl();

  let res: Response;
  try {
    res = await fetch(`${workerUrl}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: normalized,
        source_id: sourceId,
        config: config ?? {},
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new Error(
      `Scrapling worker unreachable at ${workerUrl}: ${String(err)}`
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Scrapling worker returned HTTP ${res.status} for ${normalized}: ${body}`
    );
  }

  let data: ScraplingExtractResult;
  try {
    data = (await res.json()) as ScraplingExtractResult;
  } catch {
    throw new Error(`Scrapling worker returned invalid JSON for ${normalized}`);
  }

  if (data.error) {
    throw new Error(`Scrapling extraction error for ${normalized}: ${data.error}`);
  }

  const title = data.title ?? "";
  const markdown = data.body ?? "";
  if (!markdown && !title) return null;

  return {
    url: normalizeUrl(data.url ?? normalized),
    title,
    markdown,
    published_at: data.published_at,
    source_id: sourceId,
    extraction_method: "scrapling",
    content_hash: computeContentHash(title, markdown),
  };
}

/** Check if the Scrapling worker is healthy. */
export async function checkScraplingHealth(): Promise<ScraplingHealthResult> {
  const workerUrl = getScraplingWorkerUrl();
  try {
    const res = await fetch(`${workerUrl}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { status: "error" };
    return (await res.json()) as ScraplingHealthResult;
  } catch {
    return { status: "error" };
  }
}
