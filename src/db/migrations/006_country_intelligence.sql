-- Migration 006: country_intelligence table
--
-- PURPOSE: Move `europe-member-state-implementation.ts` (1951 lines of TypeScript
-- content) toward database-backed storage so country profiles can be updated
-- without a full redeployment.
--
-- This migration creates the schema only. Data population happens via a future
-- seed script (`scripts/seed-country-intelligence.ts`) that reads from the
-- existing TypeScript content files and converts to rows.
--
-- IMPORTANT: Apply AFTER migrations 001-005. Run in the Supabase SQL editor.
-- All columns that are currently optional in the TypeScript content use nullable
-- SQL types to preserve the conservative posture of the existing content layer.

-- Country profile master record
create table if not exists country_intelligence (
  id                          text        primary key,
  region                      text        not null check (region in ('Europe', 'United States', 'Global')),
  country_code                text        not null,       -- ISO 3166-1 alpha-2
  country_name                text        not null,
  slug                        text        not null unique,

  -- Implementation status (mirrors TypeScript taxonomy)
  implementation_status       text        not null default 'needs_review' check (
    implementation_status in (
      'eu_framework_applies',
      'national_implementation_identified',
      'implementation_in_progress',
      'competent_authority_designated',
      'consultation_or_draft_identified',
      'no_specific_national_implementation_verified',
      'needs_review',
      'not_applicable'
    )
  ),
  implementation_confidence   text        not null default 'low' check (
    implementation_confidence in ('high', 'medium', 'low', 'unverified')
  ),
  implementation_notes        text,

  -- Authority and regulatory information
  competent_authority_name    text,
  competent_authority_url     text,
  dpa_name                    text,
  dpa_url                     text,
  market_surveillance_authority text,

  -- Source traceability
  primary_official_source_url text,
  primary_official_source_title text,
  last_official_source_check  timestamptz,
  citation_quality_status     text        not null default 'needs_review' check (
    citation_quality_status in (
      'complete', 'partial', 'missing_official_source',
      'missing_pinpoint', 'vague_source', 'inaccessible_source',
      'discovery_only', 'needs_manual_verification', 'needs_review'
    )
  ),

  -- Editorial / review state
  public_summary              text,
  editorial_notes             text,
  missing_source_warnings     text[],
  last_reviewed_at            timestamptz,
  reviewed_by                 text,
  review_status               text        not null default 'needs_review' check (
    review_status in ('needs_review', 'verified', 'stale', 'flagged')
  ),

  -- Audit timestamps
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Official source references for each country profile (1-to-many)
create table if not exists country_intelligence_sources (
  id                  text        primary key,
  country_id          text        not null references country_intelligence(id) on delete cascade,
  source_url          text        not null,
  source_title        text        not null,
  institution         text,
  authority_type      text        check (
    authority_type is null or authority_type in (
      'government', 'parliament', 'legislation', 'policy',
      'regulator', 'court', 'official', 'standards_body',
      'soft_law', 'case_law_source', 'guidance_source'
    )
  ),
  public_accessible   boolean     not null default true,
  runtime_accessible  boolean,
  last_checked_at     timestamptz,
  response_status     int,
  active              boolean     not null default true,
  notes               text,
  created_at          timestamptz not null default now()
);

-- Indexes
create index if not exists idx_country_intelligence_region
  on country_intelligence(region);

create index if not exists idx_country_intelligence_status
  on country_intelligence(implementation_status);

create index if not exists idx_country_intelligence_slug
  on country_intelligence(slug);

create index if not exists idx_country_intelligence_sources_country
  on country_intelligence_sources(country_id);

-- RLS: read-only public for published/verified countries
alter table country_intelligence enable row level security;
alter table country_intelligence_sources enable row level security;

-- Public read access for verified countries
create policy "public_read_verified_countries" on country_intelligence
  for select using (review_status = 'verified');

-- Service role has full access
create policy "service_role_all_countries" on country_intelligence
  for all using (auth.role() = 'service_role');

create policy "public_read_country_sources" on country_intelligence_sources
  for select using (
    exists (
      select 1 from country_intelligence c
      where c.id = country_intelligence_sources.country_id
      and c.review_status = 'verified'
    )
  );

create policy "service_role_all_country_sources" on country_intelligence_sources
  for all using (auth.role() = 'service_role');

-- Updated_at trigger
create or replace function update_country_intelligence_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists country_intelligence_updated_at on country_intelligence;
create trigger country_intelligence_updated_at
  before update on country_intelligence
  for each row execute function update_country_intelligence_updated_at();
