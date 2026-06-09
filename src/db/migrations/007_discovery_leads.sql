-- Migration 007: discovery_leads dedicated relational table
--
-- PURPOSE: Give discovery leads their own first-class relational entity
-- instead of filtering raw_regulatory_items by metadata flags (F2 roadmap).
--
-- Currently, discovery leads are stored as raw items with:
--   processingStatus = "new" and source metadata indicating discovery_source
-- This makes querying, counting, and managing leads require full-table reads.
--
-- This migration creates a dedicated discovery_leads table with its own
-- status workflow, enabling targeted queries and a proper resolution flow.
--
-- IMPORTANT: Apply AFTER migrations 001-005 and optionally after 006.
-- Existing raw item discovery leads can be migrated via a future script.

create table if not exists discovery_leads (
  id                          text        primary key,
  raw_item_id                 text        references raw_regulatory_items(id) on delete set null,
  source_id                   text        references regulation_sources(id) on delete set null,

  -- Lead content
  headline                    text        not null,
  discovery_source_url        text        not null,
  outbound_url                text,
  detected_at                 timestamptz not null default now(),

  -- Jurisdiction and topic hints (non-authoritative)
  possible_jurisdiction       text,
  possible_topic              text,
  possible_legal_area         text,
  possible_authority_type     text,

  -- Verification state
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

  -- Review metadata
  reviewer_notes              text,
  last_verified_at            timestamptz,
  stale_at                    timestamptz,  -- auto-set when no official source found within SLA
  public_visibility_allowed   boolean     not null default false,

  -- Audit
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists idx_discovery_leads_status
  on discovery_leads(status);

create index if not exists idx_discovery_leads_source_id
  on discovery_leads(source_id);

create index if not exists idx_discovery_leads_detected_at
  on discovery_leads(detected_at desc);

create index if not exists idx_discovery_leads_unresolved
  on discovery_leads(status, detected_at desc)
  where status = 'unresolved';

-- RLS: discovery leads are admin-only — never public
alter table discovery_leads enable row level security;

-- No public read: discovery leads must never appear publicly
create policy "service_role_all_discovery_leads" on discovery_leads
  for all using (auth.role() = 'service_role');

-- Updated_at trigger
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
