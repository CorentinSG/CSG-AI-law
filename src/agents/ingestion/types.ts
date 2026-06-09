/** Types for the Firecrawl + Scrapling dual ingestion pipeline. */

export const ingestionMethods = [
  "firecrawl",
  "scrapling",
  "hybrid",
  "existing",
] as const;
export type IngestionMethod = (typeof ingestionMethods)[number];

export const sourceCategories = [
  "official",
  "regulator",
  "court",
  "parliament",
  "media",
  "newsletter",
] as const;
export type SourceCategory = (typeof sourceCategories)[number];

export const ingestionStatuses = [
  "running",
  "success",
  "partial_success",
  "failed",
  "skipped",
] as const;
export type IngestionStatus = (typeof ingestionStatuses)[number];

export const extractionMethods = [
  "firecrawl",
  "scrapling",
  "rss",
  "api",
  "html_static",
  "html_dynamic",
  "pdf",
  "hybrid",
] as const;
export type ExtractionMethodExtended = (typeof extractionMethods)[number];

/** Per-source Scrapling extractor configuration stored in regulation_sources.scrapling_config. */
export interface ScraplingConfig {
  title_selector?: string;
  date_selector?: string;
  body_selector?: string;
  pdf_link_selector?: string;
  canonical_selector?: string;
  fallback_rules?: string[];
  notes?: string;
}

/** Normalized result produced by either Firecrawl or Scrapling after extraction. */
export interface NormalizedDocument {
  url: string;
  title: string;
  markdown: string;
  html_snapshot?: string;
  published_at: string | null;
  source_id: string;
  extraction_method: ExtractionMethodExtended;
  /** Content hash (sha256 of title + markdown) for semantic deduplication. */
  content_hash: string;
}

/** Result from the Scrapling Python worker /extract endpoint. */
export interface ScraplingExtractResult {
  url: string;
  title: string;
  body: string;
  published_at: string | null;
  canonical_url: string | null;
  pdf_links: string[];
  error?: string;
}

/** Result from the Scrapling Python worker /health endpoint. */
export interface ScraplingHealthResult {
  status: "ok" | "error";
  version?: string;
}

/** Input for creating an ingestion log entry. */
export interface IngestionLogInput {
  id: string;
  source_id: string | null;
  method: IngestionMethod;
  status: IngestionStatus;
  urls_discovered?: number;
  items_ingested?: number;
  duplicates?: number;
  error_message?: string | null;
  details?: Record<string, unknown>;
  started_at: string;
  finished_at?: string | null;
}

/** A full ingestion log record. */
export interface IngestionLog extends IngestionLogInput {
  created_at: string;
}

/** Result returned by the ingestion orchestrator for one source. */
export interface IngestionRunResult {
  source_id: string;
  method: IngestionMethod;
  status: IngestionStatus;
  urls_discovered: number;
  items_ingested: number;
  duplicates: number;
  error_message: string | null;
}
