/**
 * Ingestion orchestrator.
 *
 * Routing logic:
 *   ingestion_method = "firecrawl"  → Firecrawl only
 *   ingestion_method = "scrapling"  → Scrapling only (via Python worker)
 *   ingestion_method = "hybrid"     → Firecrawl discovers URLs, Scrapling extracts each
 *   ingestion_method = "existing"   → skip (handled by existing scan pipeline)
 *
 * All results go through:
 *   normalize → deduplicate → store as raw_regulatory_item → AI classify → admin review queue
 */

import { randomUUID } from "node:crypto";

import { crawlSource, mapSource } from "./firecrawlService";
import { scraplingExtract } from "./scraplingClient";
import { normalizeUrl } from "./deduplication";
import type { IngestionLogInput, IngestionRunResult, NormalizedDocument } from "./types";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { getAiRegulationRepository } from "@/db/repository";

/** Source shape for the ingestion pipeline (uses the new optional fields from migration 009). */
export type IngestionSource = RegulationSource;

/** Insert or skip a normalized document based on URL + content hash dedup. */
async function insertIfNotDuplicate(
  doc: NormalizedDocument
): Promise<{ inserted: boolean; duplicate: boolean }> {
  const repo = getAiRegulationRepository();

  // Check URL dedup
  const existingByUrl = await repo.findRawRegulatoryItemByUrl(normalizeUrl(doc.url));
  if (existingByUrl) {
    return { inserted: false, duplicate: true };
  }

  // Check content hash dedup (reuses the existing hash column)
  const existingByHash = await repo.findRawRegulatoryItemByHash(doc.content_hash);
  if (existingByHash) {
    return { inserted: false, duplicate: true };
  }

  // Insert new raw regulatory item
  const now = new Date().toISOString();
  await repo.createRawRegulatoryItem({
    sourceId: doc.source_id,
    rawTitle: doc.title,
    rawUrl: doc.url,
    rawText: doc.markdown,
    rawMetadata: {
      markdown: doc.markdown,
      html_snapshot: doc.html_snapshot ?? null,
      content_hash: doc.content_hash,
      extraction_method: doc.extraction_method,
      published_at: doc.published_at,
      fetched_at: now,
    },
    detectedAt: now,
    hash: doc.content_hash,
    duplicateOf: null,
    processingStatus: "new",
  });

  return { inserted: true, duplicate: false };
}

/** Run ingestion for a single source. */
export async function runSourceIngestion(
  source: IngestionSource
): Promise<IngestionRunResult> {
  const startedAt = new Date().toISOString();
  const method = (source.ingestionMethod ?? "existing") as
    | "firecrawl"
    | "scrapling"
    | "hybrid"
    | "existing";

  if (method === "existing") {
    return {
      source_id: source.id,
      method,
      status: "skipped",
      urls_discovered: 0,
      items_ingested: 0,
      duplicates: 0,
      error_message: null,
    };
  }

  let urlsDiscovered = 0;
  let itemsIngested = 0;
  let duplicates = 0;
  let errorMessage: string | null = null;

  try {
    let docs: NormalizedDocument[] = [];

    if (method === "firecrawl") {
      docs = await crawlSource(source, { crawl_limit: 20 });
      urlsDiscovered = docs.length;
    } else if (method === "scrapling") {
      const urlsToExtract = [source.crawlRootUrl ?? source.sourceUrl];
      urlsDiscovered = urlsToExtract.length;
      for (const url of urlsToExtract) {
        const doc = await scraplingExtract(
          url,
          source.id,
          (source.scraplingConfig ?? {}) as Record<string, unknown>
        );
        if (doc) docs.push(doc);
      }
    } else if (method === "hybrid") {
      // Step 1: Firecrawl discovers all URLs on the source
      const discoveredUrls = await mapSource(source);
      urlsDiscovered = discoveredUrls.length;

      // Step 2: Scrapling extracts structured content from each URL
      for (const url of discoveredUrls) {
        try {
          const doc = await scraplingExtract(
            url,
            source.id,
            (source.scraplingConfig ?? {}) as Record<string, unknown>
          );
          if (doc) docs.push(doc);
        } catch {
          // Non-fatal: log and continue
        }
      }
    }

    // Deduplicate and insert
    for (const doc of docs) {
      const { inserted, duplicate } = await insertIfNotDuplicate(doc);
      if (inserted) itemsIngested++;
      if (duplicate) duplicates++;
    }
  } catch (err) {
    errorMessage = String(err);
  }

  const status =
    errorMessage != null
      ? "failed"
      : itemsIngested > 0
        ? "success"
        : "skipped";

  // Write ingestion log
  await writeIngestionLog({
    id: randomUUID(),
    source_id: source.id,
    method,
    status,
    urls_discovered: urlsDiscovered,
    items_ingested: itemsIngested,
    duplicates,
    error_message: errorMessage,
    details: {},
    started_at: startedAt,
    finished_at: new Date().toISOString(),
  });

  return {
    source_id: source.id,
    method,
    status,
    urls_discovered: urlsDiscovered,
    items_ingested: itemsIngested,
    duplicates,
    error_message: errorMessage,
  };
}

/** Persist an ingestion log entry via the repository. */
async function writeIngestionLog(input: IngestionLogInput): Promise<void> {
  try {
    await getAiRegulationRepository().createIngestionLog(input);
  } catch {
    // Non-fatal: log persistence failure should not break the ingestion run
  }
}

/** Run ingestion for all active sources with the given methods. */
export async function runAllActiveSourceIngestion(options?: {
  methods?: Array<"firecrawl" | "scrapling" | "hybrid">;
}): Promise<IngestionRunResult[]> {
  const repo = getAiRegulationRepository();
  const allSources = await repo.listSources();

  const targetMethods = options?.methods ?? ["firecrawl", "scrapling", "hybrid"];
  const sources = allSources.filter((s) => {
    const method = (s.ingestionMethod ?? "existing") as string;
    return targetMethods.includes(method as "firecrawl" | "scrapling" | "hybrid");
  });

  const results: IngestionRunResult[] = [];
  for (const source of sources) {
    const result = await runSourceIngestion(source as IngestionSource);
    results.push(result);
  }
  return results;
}
