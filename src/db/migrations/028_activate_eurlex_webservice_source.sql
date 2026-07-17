-- Migration 028: Activate the native EUR-Lex SOAP webservice source.
--
-- PURPOSE: Replace the inactive HTML search lane with the official EUR-Lex
-- SOAP webservice now that operator credentials are available.
--
-- SAFETY: Non-destructive. Upserts one known regulation_sources row.

insert into public.regulation_sources (
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
    "expertQuery": "TI ~ \"artificial intelligence\" OR TI ~ \"AI Act\" OR TE ~ \"artificial intelligence\" OR TE ~ \"AI Act\" OR TE ~ \"biometric identification\"",
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
