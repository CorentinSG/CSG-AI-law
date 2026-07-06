-- 017 — Backfill schema objects that never reached production
--
-- A drift audit (2026-07-05) of project odhkoqluvhuzzdbgphji found that migrations
-- 003, 007 and 011 were never (fully) applied in production. Exactly these 8 objects
-- were missing; every other expected table/column/function was present:
--   003: source_references, verification_attempts, review_events, data_quality_findings
--   007: discovery_leads (table) + update_discovery_leads_updated_at (function/trigger)
--   011: country_profile_review_events (table) + country_intelligence.needs_re_review (column)
--
-- This migration re-applies those three migrations verbatim, made fully idempotent
-- (create ... if not exists; policies via drop-then-create). It is NON-DESTRUCTIVE:
-- the only data write is 011's needs_re_review backfill (its original intent).
-- Safe to run more than once. Run this BEFORE the raw-item dedup (016) and 013.

-- =====================================================================================
-- From migration 003 — foundation hardening tables
-- =====================================================================================

create table if not exists source_references (
  id text primary key,
  raw_item_id text not null references raw_regulatory_items(id) on delete cascade,
  regulatory_update_id text references ai_regulatory_updates(id) on delete cascade,
  source_role text not null,
  title text not null,
  institution text not null,
  url text not null,
  canonical_url text,
  source_type text not null,
  authority_type text,
  publication_date date,
  detected_at timestamptz,
  retrieved_at timestamptz,
  last_verified_at timestamptz,
  jurisdiction text,
  document_type text,
  excerpt text,
  pinpoint jsonb not null default '{}'::jsonb,
  reliability_level text not null,
  verification_status text not null,
  archived_url text,
  access_limitations text,
  notes text,
  created_at timestamptz not null default now(),
  constraint source_references_source_role_check check (
    source_role in ('primary', 'supporting', 'discovery', 'official_confirmation')
  ),
  constraint source_references_source_type_check check (
    source_type in ('official', 'court', 'regulator', 'standards_body', 'discovery_source', 'media_source', 'tracker')
  ),
  constraint source_references_reliability_check check (
    reliability_level in ('high', 'medium', 'low')
  )
);

create unique index if not exists source_references_raw_item_url_role_idx
  on source_references(raw_item_id, url, source_role);
create index if not exists source_references_update_idx
  on source_references(regulatory_update_id);

create table if not exists verification_attempts (
  id text primary key,
  raw_item_id text not null references raw_regulatory_items(id) on delete cascade,
  source_reference_id text references source_references(id) on delete set null,
  source_name text not null,
  source_url text not null,
  source_type text not null,
  attempt_type text not null,
  result_status text not null,
  response_status integer,
  official_source_found boolean not null default false,
  official_source_url text,
  notes text,
  attempted_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists verification_attempts_raw_item_idx
  on verification_attempts(raw_item_id);
create index if not exists verification_attempts_attempted_at_idx
  on verification_attempts(attempted_at desc);

create table if not exists review_events (
  id text primary key,
  regulatory_update_id text not null references ai_regulatory_updates(id) on delete cascade,
  source_id text not null references regulation_sources(id) on delete cascade,
  raw_item_id text not null references raw_regulatory_items(id) on delete cascade,
  event_type text not null,
  actor text not null,
  previous_status text,
  next_status text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint review_events_event_type_check check (
    event_type in ('draft_saved', 'status_transition', 'citation_synced')
  )
);

create index if not exists review_events_update_idx
  on review_events(regulatory_update_id, created_at desc);

create table if not exists data_quality_findings (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  scope text not null,
  severity text not null,
  status text not null,
  finding_type text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  first_detected_at timestamptz not null,
  last_detected_at timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_quality_findings_severity_check check (
    severity in ('high', 'medium', 'low')
  )
);

create unique index if not exists data_quality_findings_dedup_idx
  on data_quality_findings(entity_type, entity_id, finding_type);
create index if not exists data_quality_findings_status_idx
  on data_quality_findings(status, severity);

grant select, insert, update, delete on table source_references to service_role;
grant select, insert, update, delete on table verification_attempts to service_role;
grant select, insert, update, delete on table review_events to service_role;
grant select, insert, update, delete on table data_quality_findings to service_role;

-- =====================================================================================
-- From migration 007 — discovery_leads relational table
-- =====================================================================================

create table if not exists discovery_leads (
  id                          text        primary key,
  raw_item_id                 text        references raw_regulatory_items(id) on delete set null,
  source_id                   text        references regulation_sources(id) on delete set null,
  headline                    text        not null,
  discovery_source_url        text        not null,
  outbound_url                text,
  detected_at                 timestamptz not null default now(),
  possible_jurisdiction       text,
  possible_topic              text,
  possible_legal_area         text,
  possible_authority_type     text,
  status                      text        not null default 'unresolved' check (
    status in (
      'unresolved',
      'official_source_found',
      'corroborated',
      'converted_to_monitor_item',
      'rejected',
      'stale'
    )
  ),
  official_source_found       boolean     not null default false,
  official_source_url         text,
  corroborating_source_count  int         not null default 0,
  corroborating_source_urls   text[],
  converted_update_id         text        references ai_regulatory_updates(id) on delete set null,
  reviewer_notes              text,
  last_verified_at            timestamptz,
  stale_at                    timestamptz,
  public_visibility_allowed   boolean     not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_discovery_leads_status
  on discovery_leads(status);
create index if not exists idx_discovery_leads_source_id
  on discovery_leads(source_id);
create index if not exists idx_discovery_leads_detected_at
  on discovery_leads(detected_at desc);
create index if not exists idx_discovery_leads_unresolved
  on discovery_leads(status, detected_at desc)
  where status = 'unresolved';

alter table discovery_leads enable row level security;

drop policy if exists "service_role_all_discovery_leads" on discovery_leads;
create policy "service_role_all_discovery_leads" on discovery_leads
  for all using (auth.role() = 'service_role');

create or replace function update_discovery_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists discovery_leads_updated_at on discovery_leads;
create trigger discovery_leads_updated_at
  before update on discovery_leads
  for each row execute function update_discovery_leads_updated_at();

-- NOTE: the original migration 007 never granted table privileges to service_role.
-- In this project, tables created by the postgres role via the SQL editor do NOT
-- inherit service_role grants automatically, so the discovery pipeline failed with
-- "permission denied for table discovery_leads" (42501). Grant them explicitly,
-- matching every other pipeline table.
grant select, insert, update, delete on table discovery_leads to service_role;

-- =====================================================================================
-- From migration 011 — country-profile review audit + re-review flag
-- =====================================================================================

alter table country_intelligence
  add column if not exists needs_re_review boolean not null default false;

update country_intelligence
set needs_re_review = case
  when last_reviewed_at is null then true
  when last_reviewed_at <= now() - interval '60 days' then true
  else false
end;

create index if not exists idx_country_intelligence_needs_re_review
  on country_intelligence(needs_re_review, review_status, country_name);

create table if not exists country_profile_review_events (
  id text primary key,
  country_id text not null references country_intelligence(id) on delete cascade,
  country_slug text not null,
  event_type text not null check (
    event_type in ('editorial_saved', 'review_status_changed')
  ),
  actor text not null,
  previous_review_status text,
  next_review_status text,
  previous_needs_re_review boolean,
  next_needs_re_review boolean not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_country_profile_review_events_country
  on country_profile_review_events(country_id, created_at desc);

alter table country_profile_review_events enable row level security;

drop policy if exists "service_role_all_country_profile_review_events" on country_profile_review_events;
create policy "service_role_all_country_profile_review_events"
  on country_profile_review_events
  for all
  using (auth.role() = 'service_role');

grant select, insert, update, delete
  on table country_profile_review_events
  to service_role;
