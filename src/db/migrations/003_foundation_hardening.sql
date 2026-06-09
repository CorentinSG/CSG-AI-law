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
