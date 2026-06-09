create extension if not exists "pgcrypto";

create table if not exists regulation_sources (
  id text primary key,
  name text not null,
  jurisdiction text not null,
  region text not null,
  country text not null,
  source_url text not null,
  source_type text not null,
  scan_frequency text not null,
  active boolean not null default true,
  last_scanned_at timestamptz,
  notes text not null default '',
  reliability_level text not null,
  preferred_extraction_method text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulation_sources_source_type_check check (
    source_type in ('RSS', 'API', 'static_page', 'dynamic_page', 'PDF_repository', 'legislative_database', 'regulator_page')
  ),
  constraint regulation_sources_reliability_check check (
    reliability_level in ('high', 'medium', 'low')
  )
);

create table if not exists raw_regulatory_items (
  id text primary key,
  source_id text not null references regulation_sources(id) on delete cascade,
  raw_title text not null,
  raw_url text not null,
  raw_text text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null,
  hash text not null,
  duplicate_of text references raw_regulatory_items(id) on delete set null,
  processing_status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raw_regulatory_items_processing_status_check check (
    processing_status in ('new', 'duplicate', 'processed', 'failed')
  )
);

create index if not exists raw_regulatory_items_hash_idx
  on raw_regulatory_items(hash);
create index if not exists raw_regulatory_items_source_id_idx
  on raw_regulatory_items(source_id);

create table if not exists ai_regulatory_updates (
  id text primary key,
  source_id text not null references regulation_sources(id) on delete cascade,
  raw_item_id text not null references raw_regulatory_items(id) on delete cascade,
  title text not null,
  source_name text not null,
  source_url text not null,
  jurisdiction text not null,
  region text not null,
  country text not null,
  development_type text not null,
  legal_area text not null,
  publication_date date,
  detected_date date not null,
  one_sentence_summary text not null,
  summary text not null,
  what_happened text not null,
  why_it_matters text not null,
  practical_impact text not null,
  affected_parties text[] not null default '{}',
  key_obligations text[] not null default '{}',
  compliance_deadlines text[] not null default '{}',
  enforcement_risk text not null,
  importance_level text not null,
  confidence_level text not null,
  tags text[] not null default '{}',
  status text not null default 'needs_review',
  reviewed_by text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_regulatory_updates_status_check check (
    status in ('needs_review', 'approved', 'rejected', 'published', 'archived')
  ),
  constraint ai_regulatory_updates_importance_check check (
    importance_level in ('critical', 'high', 'medium', 'low')
  ),
  constraint ai_regulatory_updates_confidence_check check (
    confidence_level in ('high', 'medium', 'low')
  )
);

create index if not exists ai_regulatory_updates_status_idx
  on ai_regulatory_updates(status);
create index if not exists ai_regulatory_updates_jurisdiction_idx
  on ai_regulatory_updates(jurisdiction);
create index if not exists ai_regulatory_updates_legal_area_idx
  on ai_regulatory_updates(legal_area);
create index if not exists ai_regulatory_updates_development_type_idx
  on ai_regulatory_updates(development_type);
create index if not exists ai_regulatory_updates_importance_level_idx
  on ai_regulatory_updates(importance_level);
create index if not exists ai_regulatory_updates_publication_date_idx
  on ai_regulatory_updates(publication_date desc);
create index if not exists ai_regulatory_updates_source_id_idx
  on ai_regulatory_updates(source_id);

create table if not exists regulation_scan_logs (
  id text primary key,
  source_id text not null references regulation_sources(id) on delete cascade,
  scan_started_at timestamptz not null,
  scan_finished_at timestamptz not null,
  status text not null,
  items_found integer not null default 0,
  new_items_detected integer not null default 0,
  duplicates_detected integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint regulation_scan_logs_status_check check (
    status in ('success', 'partial_success', 'failed')
  )
);
create index if not exists regulation_scan_logs_source_id_idx
  on regulation_scan_logs(source_id);

create table if not exists ai_processing_logs (
  id text primary key,
  raw_item_id text not null references raw_regulatory_items(id) on delete cascade,
  regulatory_update_id text references ai_regulatory_updates(id) on delete set null,
  model_used text not null,
  prompt_version text not null,
  processing_started_at timestamptz not null,
  processing_finished_at timestamptz not null,
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  constraint ai_processing_logs_status_check check (
    status in ('success', 'failed', 'skipped')
  )
);
create index if not exists ai_processing_logs_raw_item_id_idx
  on ai_processing_logs(raw_item_id);
create index if not exists ai_processing_logs_regulatory_update_id_idx
  on ai_processing_logs(regulatory_update_id);

grant usage on schema public to service_role;

grant select, insert, update, delete on table regulation_sources to service_role;
grant select, insert, update, delete on table raw_regulatory_items to service_role;
grant select, insert, update, delete on table ai_regulatory_updates to service_role;
grant select, insert, update, delete on table regulation_scan_logs to service_role;
grant select, insert, update, delete on table ai_processing_logs to service_role;
