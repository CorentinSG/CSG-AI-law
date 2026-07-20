-- 031_repair_check_constraint_drift.sql
--
-- PURPOSE: repair two CHECK-constraint drifts identified by the 2026-07-20
-- audit (docs/superpowers/plans/2026-07-20-master-improvement-plan.md, W1.1):
--
--   1. source_references_source_type_check — migration 017 recreated the
--      table with the PRE-005 value list (missing 'government', 'parliament',
--      'legislation', 'policy'). Migration 005 had run as a no-op in prod
--      ("alter table IF EXISTS") because the table did not exist yet at the
--      time. The application writes those values today (national-depth
--      backfills via rawMetadata.sourceReferences), so every such upsert RPC
--      transaction fails against the drifted CHECK.
--
--   2. regulation_sources source_category CHECK — created inline by 009 with
--      ('official','regulator','court','parliament','media','newsletter').
--      Migration 028 inserts 'official_legal_database', which this CHECK
--      forbids: 028 could never have applied cleanly on a base where 009 ran,
--      so the EUR-Lex webservice source is likely missing/inactive in prod.
--      This migration widens the CHECK and re-runs the (idempotent) 028
--      upsert so the repair is self-contained.
--
-- SAFETY: idempotent (drop constraint if exists + add, upsert on conflict).
-- Widening a CHECK never invalidates existing rows.
-- APPLY TO: remote Supabase via SQL editor (or migration runner once adopted).

-- ── 1. source_references.source_type: restore the full 005 value list ──────

alter table if exists source_references
  drop constraint if exists source_references_source_type_check;

alter table if exists source_references
  add constraint source_references_source_type_check check (
    source_type in (
      'official',
      'court',
      'regulator',
      'government',
      'parliament',
      'legislation',
      'policy',
      'standards_body',
      'discovery_source',
      'media_source',
      'tracker'
    )
  );

-- ── 2. regulation_sources.source_category: allow official_legal_database ───

alter table if exists regulation_sources
  drop constraint if exists regulation_sources_source_category_check;

alter table if exists regulation_sources
  add constraint regulation_sources_source_category_check check (
    source_category in (
      'official',
      'regulator',
      'court',
      'parliament',
      'media',
      'newsletter',
      'official_legal_database'
    ) or source_category is null
  );

-- ── 3. Re-apply the 028 EUR-Lex webservice upsert (blocked by the old CHECK)

insert into regulation_sources (
  id,
  name,
  jurisdiction,
  region,
  country,
  source_url,
  source_type,
  scan_frequency,
  active,
  last_scanned_at,
  notes,
  reliability_level,
  preferred_extraction_method,
  config,
  ingestion_method,
  source_category,
  created_at,
  updated_at
) values (
  'src-eur-lex-ai',
  'EUR-Lex AI webservice search',
  'European Union',
  'Europe',
  'European Union',
  'https://eur-lex.europa.eu/EURLexWebService',
  'legislative_database',
  'daily',
  true,
  null,
  'Official EUR-Lex SOAP webservice search for AI-related EU legal acts and lawmaking materials. Requires EURLEX_USERNAME/EURLEX_PASSWORD at runtime; when absent or upstream-constrained, RSS/static EUR-Lex lanes remain the honest official fallback.',
  'high',
  'api',
  '{
    "apiProvider": "eurlex",
    "expertQuery": "TI ~ \"artificial intelligence\" OR TI ~ \"AI Act\" OR TI ~ \"biometric identification\" OR (TE ~ \"artificial intelligence\" AND (TI ~ \"regulation\" OR TI ~ \"directive\" OR TI ~ \"decision\" OR TI ~ \"opinion\" OR TI ~ \"recommendation\" OR TI ~ \"impact assessment\"))",
    "searchLanguage": "en",
    "maxItems": 12,
    "authorityTypeHint": "Official EU legal database",
    "editorialNotes": [
      "Official EU legal database results only; do not import broad EUR-Lex corpora wholesale.",
      "Review instrument form, legal status, date, CELEX reference, and pinpoint citation before treating any item as binding law."
    ]
  }'::jsonb,
  'existing',
  'official_legal_database',
  now(),
  now()
) on conflict (id) do update set
  name = excluded.name,
  jurisdiction = excluded.jurisdiction,
  region = excluded.region,
  country = excluded.country,
  source_url = excluded.source_url,
  source_type = excluded.source_type,
  scan_frequency = excluded.scan_frequency,
  active = excluded.active,
  notes = excluded.notes,
  reliability_level = excluded.reliability_level,
  preferred_extraction_method = excluded.preferred_extraction_method,
  config = excluded.config,
  ingestion_method = excluded.ingestion_method,
  source_category = excluded.source_category,
  updated_at = now();
