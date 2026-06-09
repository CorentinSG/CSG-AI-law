alter table regulation_sources
  add column if not exists last_successful_scan_at timestamptz,
  add column if not exists last_failed_scan_at timestamptz,
  add column if not exists latest_response_status integer,
  add column if not exists latest_items_fetched integer not null default 0,
  add column if not exists latest_new_items_detected integer not null default 0,
  add column if not exists latest_duplicates_detected integer not null default 0,
  add column if not exists latest_parser_warnings jsonb not null default '[]'::jsonb,
  add column if not exists latest_accessibility_issue text,
  add column if not exists source_reliability_notes text;

alter table regulation_sources
  drop constraint if exists regulation_sources_source_type_check;

alter table regulation_sources
  add constraint regulation_sources_source_type_check check (
    source_type in (
      'RSS',
      'API',
      'static_page',
      'dynamic_page',
      'PDF_repository',
      'legislative_database',
      'regulator_page',
      'court_database',
      'standards_body',
      'tracker_source',
      'discovery_source',
      'media_source'
    )
  );

create table if not exists scan_jobs (
  id text primary key,
  source_id text references regulation_sources(id) on delete set null,
  trigger text not null,
  requested_by text not null,
  status text not null,
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scan_jobs_status_check check (
    status in ('queued', 'running', 'succeeded', 'partial_success', 'failed')
  )
);

create index if not exists scan_jobs_created_at_idx
  on scan_jobs(created_at desc);
create index if not exists scan_jobs_status_idx
  on scan_jobs(status, created_at desc);

create table if not exists news_items (
  id text primary key,
  regulatory_update_id text references ai_regulatory_updates(id) on delete set null,
  raw_item_id text not null references raw_regulatory_items(id) on delete cascade,
  slug text not null unique,
  title text not null,
  short_summary text not null,
  full_summary text not null,
  detected_at timestamptz not null,
  event_date date,
  publication_date date,
  last_verified_at timestamptz,
  source_name text not null,
  source_url text not null,
  source_type text not null,
  source_reliability text not null,
  source_jurisdiction text not null,
  jurisdiction text not null,
  region text not null,
  country_or_state text not null,
  legal_area text not null,
  topic_tags text[] not null default '{}',
  authority_type text not null,
  development_type text not null,
  verification_status text not null,
  official_source_found boolean not null default false,
  official_source_url text,
  exact_date_of_information date,
  date_precision text not null,
  citation_quality text not null,
  public_visibility_status text not null,
  reviewer_notes text not null default '',
  related_monitor_item_id text references ai_regulatory_updates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_items_visibility_check check (
    public_visibility_status in ('public', 'admin_only')
  )
);

create index if not exists news_items_visibility_idx
  on news_items(public_visibility_status, publication_date desc, detected_at desc);
create index if not exists news_items_raw_item_idx
  on news_items(raw_item_id);
create index if not exists news_items_regulatory_update_idx
  on news_items(regulatory_update_id);

grant select on table news_items to anon, authenticated;
grant select, insert, update, delete on table news_items to service_role;

alter table news_items enable row level security;

drop policy if exists "Public can read visible news items" on news_items;
create policy "Public can read visible news items"
  on news_items
  for select
  to anon, authenticated
  using (public_visibility_status = 'public');

create table if not exists source_health_checks (
  id text primary key,
  source_id text not null references regulation_sources(id) on delete cascade,
  checked_at timestamptz not null,
  response_status integer,
  runtime_accessible boolean not null,
  parser_status text not null,
  active_recommendation text not null,
  items_fetched integer not null default 0,
  new_items_detected integer not null default 0,
  duplicates_detected integer not null default 0,
  parser_warnings jsonb not null default '[]'::jsonb,
  accessibility_issue text,
  reliability_notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists source_health_checks_source_idx
  on source_health_checks(source_id, checked_at desc);

grant select, insert, update, delete on table scan_jobs to service_role;
grant select, insert, update, delete on table source_health_checks to service_role;
