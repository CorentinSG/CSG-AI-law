-- Migration 009: Firecrawl + Scrapling dual ingestion pipeline
--
-- PURPOSE: Extend regulation_sources and raw_regulatory_items to support
-- the new dual-ingestion pipeline (Firecrawl for broad discovery,
-- Scrapling for targeted high-value extraction, hybrid mode for both).
-- Also adds a dedicated ingestion_logs table for per-run audit trails.
--
-- APPLY AFTER: migrations 001-008
-- APPLY TO: remote Supabase via SQL Editor

-- ── 1. Extend regulation_sources ──────────────────────────────────────────

-- ingestion_method: which ingestion engine to use for this source
alter table regulation_sources
  add column if not exists ingestion_method text not null default 'existing'
    check (ingestion_method in ('firecrawl', 'scrapling', 'hybrid', 'existing')),

  -- source_category: semantic category (separate from the technical source_type)
  add column if not exists source_category text
    check (source_category in ('official', 'regulator', 'court', 'parliament', 'media', 'newsletter') or source_category is null),

  -- Scrapling per-source extractor config (JSON with title_selector, date_selector, body_selector, fallback_rules, notes)
  add column if not exists scrapling_config jsonb not null default '{}'::jsonb,

  -- crawl_root_url: starting URL for crawl (may differ from source_url used for display)
  add column if not exists crawl_root_url text;

-- ── 2. Extend raw_regulatory_items ────────────────────────────────────────

alter table raw_regulatory_items
  -- Full Markdown content returned by Firecrawl or Scrapling body extraction
  add column if not exists markdown text,

  -- Optional HTML snapshot (for debugging / archiving)
  add column if not exists html_snapshot text,

  -- Content hash derived from title+markdown — used for semantic deduplication
  -- (distinct from hash which is a positional/URL hash from the scan pipeline)
  add column if not exists content_hash text,

  -- Which extraction engine produced this item
  add column if not exists extraction_method text
    check (extraction_method in ('firecrawl', 'scrapling', 'rss', 'api', 'html_static', 'html_dynamic', 'pdf', 'hybrid') or extraction_method is null),

  -- Publication date as detected/extracted by the ingestion engine
  add column if not exists published_at timestamptz,

  -- When this item was fetched from the source
  add column if not exists fetched_at timestamptz;

-- Index on content_hash for fast semantic dedup lookups
create index if not exists raw_regulatory_items_content_hash_idx
  on raw_regulatory_items(content_hash)
  where content_hash is not null;

-- Extend processing_status enum to include 'classified'
-- (items that have been through AI classification but not yet in review queue)
alter table raw_regulatory_items
  drop constraint if exists raw_regulatory_items_processing_status_check;

alter table raw_regulatory_items
  add constraint raw_regulatory_items_processing_status_check check (
    processing_status in ('new', 'duplicate', 'processed', 'failed', 'classified')
  );

-- ── 3. New: ingestion_logs ────────────────────────────────────────────────
-- Per-run audit trail for the ingestion pipeline.
-- One row per source per ingestion run.

create table if not exists ingestion_logs (
  id              text        primary key,
  source_id       text        references regulation_sources(id) on delete set null,
  method          text        not null
    check (method in ('firecrawl', 'scrapling', 'hybrid', 'existing')),
  status          text        not null
    check (status in ('running', 'success', 'partial_success', 'failed', 'skipped')),
  urls_discovered int         not null default 0,
  items_ingested  int         not null default 0,
  duplicates      int         not null default 0,
  error_message   text,
  details         jsonb       not null default '{}'::jsonb,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists ingestion_logs_source_id_idx
  on ingestion_logs(source_id, started_at desc);

create index if not exists ingestion_logs_status_idx
  on ingestion_logs(status, started_at desc);

-- RLS: ingestion logs are admin-only
alter table ingestion_logs enable row level security;

drop policy if exists "service_role_all_ingestion_logs" on ingestion_logs;
create policy "service_role_all_ingestion_logs" on ingestion_logs
  for all using (auth.role() = 'service_role');

grant select, insert, update, delete on table ingestion_logs to service_role;
