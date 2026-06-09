/**
 * Firecrawl ingestion service.
 *
 * Role: broad ingestion layer — discovers links, crawls official websites,
 * and turns pages into clean Markdown for AI agents.
 *
 * Uses the @mendable/firecrawl-js SDK.
 * Requires: FIRECRAWL_API_KEY env var.
 */

import { computeContentHash, normalizeUrl } from "./deduplication";
import type { NormalizedDocument } from "./types";

// We keep the Firecrawl SDK import dynamic so the project builds even
// when the SDK is not installed (tests can mock it).
type FirecrawlApp = {
  scrapeUrl(
    url: string,
    params?: Record<string, unknown>
  ): Promise<FirecrawlScrapeResult>;
  crawlUrl(
    url: string,
    params?: Record<string, unknown>
  ): Promise<FirecrawlCrawlResult>;
  mapUrl(
    url: string,
    params?: Record<string, unknown>
  ): Promise<FirecrawlMapResult>;
};

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
      publishedTime?: string;
      ogImage?: string;
    };
  };
  error?: string;
}

interface FirecrawlCrawlResult {
  success: boolean;
  data?: FirecrawlScrapeResult["data"][];
  error?: string;
}

interface FirecrawlMapResult {
  success: boolean;
  links?: string[];
  error?: string;
}

interface SourceDescriptor {
  id: string;
  crawlRootUrl?: string | null;
  sourceUrl: string;
}

let _app: FirecrawlApp | null = null;

function getApp(): FirecrawlApp {
  if (_app) return _app;
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FIRECRAWL_API_KEY is not set. Add it to your environment variables."
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: FirecrawlAppClass } = require("@mendable/firecrawl-js");
  _app = new FirecrawlAppClass({ apiKey }) as FirecrawlApp;
  return _app;
}

/** Reset the cached instance (useful in tests). */
export function _resetFirecrawlApp(): void {
  _app = null;
}

/** Scrape a single URL and return a normalized document. */
export async function scrapeUrl(
  url: string,
  sourceId: string
): Promise<NormalizedDocument | null> {
  const app = getApp();
  const normalized = normalizeUrl(url);

  let result: FirecrawlScrapeResult;
  try {
    result = await app.scrapeUrl(normalized, {
      formats: ["markdown", "html"],
      waitFor: 1000,
    });
  } catch (err) {
    throw new Error(
      `Firecrawl scrapeUrl failed for ${normalized}: ${String(err)}`
    );
  }

  if (!result.success || !result.data) {
    throw new Error(
      `Firecrawl returned unsuccessful result for ${normalized}: ${result.error ?? "unknown error"}`
    );
  }

  const data = result.data;
  const title = data.metadata?.title ?? "";
  const markdown = data.markdown ?? "";

  if (!markdown && !title) return null;

  return {
    url: normalized,
    title,
    markdown,
    html_snapshot: data.html,
    published_at: data.metadata?.publishedTime ?? null,
    source_id: sourceId,
    extraction_method: "firecrawl",
    content_hash: computeContentHash(title, markdown),
  };
}

/**
 * Crawl a source URL and return all discovered documents.
 * Uses Firecrawl crawl (follows internal links up to crawl_limit pages).
 */
export async function crawlSource(
  source: SourceDescriptor,
  options?: { crawl_limit?: number }
): Promise<NormalizedDocument[]> {
  const app = getApp();
  const startUrl = normalizeUrl(
    source.crawlRootUrl ?? source.sourceUrl
  );
  const limit = options?.crawl_limit ?? 10;

  let result: FirecrawlCrawlResult;
  try {
    result = await app.crawlUrl(startUrl, {
      limit,
      scrapeOptions: { formats: ["markdown", "html"] },
    });
  } catch (err) {
    throw new Error(
      `Firecrawl crawlUrl failed for ${startUrl}: ${String(err)}`
    );
  }

  if (!result.success || !result.data) {
    throw new Error(
      `Firecrawl crawl returned unsuccessful result for ${startUrl}: ${result.error ?? "unknown"}`
    );
  }

  const docs: NormalizedDocument[] = [];
  for (const page of result.data) {
    if (!page) continue;
    const title = page.metadata?.title ?? "";
    const markdown = page.markdown ?? "";
    const url = page.metadata?.sourceURL
      ? normalizeUrl(page.metadata.sourceURL)
      : startUrl;
    if (!markdown && !title) continue;
    docs.push({
      url,
      title,
      markdown,
      html_snapshot: page.html,
      published_at: page.metadata?.publishedTime ?? null,
      source_id: source.id,
      extraction_method: "firecrawl",
      content_hash: computeContentHash(title, markdown),
    });
  }
  return docs;
}

/**
 * Map a source URL to discover all reachable links.
 * Returns normalized URLs — useful for hybrid mode to hand off to Scrapling.
 */
export async function mapSource(
  source: SourceDescriptor
): Promise<string[]> {
  const app = getApp();
  const startUrl = normalizeUrl(
    source.crawlRootUrl ?? source.sourceUrl
  );

  let result: FirecrawlMapResult;
  try {
    result = await app.mapUrl(startUrl, {});
  } catch (err) {
    throw new Error(
      `Firecrawl mapUrl failed for ${startUrl}: ${String(err)}`
    );
  }

  if (!result.success) {
    throw new Error(
      `Firecrawl map returned unsuccessful result for ${startUrl}: ${result.error ?? "unknown"}`
    );
  }

  return (result.links ?? []).map(normalizeUrl);
}
