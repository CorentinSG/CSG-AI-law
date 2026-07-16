-- Migration 024: Add CourtListener/RECAP US AI case-law monitoring source.
--
-- PURPOSE: Register an active, API-backed US case-law discovery source so the
-- monitoring worker can query CourtListener as soon as an operator supplies
-- COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN.
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
  'src-us-courtlistener-ai',
  'CourtListener AI case-law search',
  'United States federal',
  'North America',
  'United States',
  'https://www.courtlistener.com/api/rest/v4/search/?q=%22artificial%20intelligence%22%20OR%20%22algorithmic%20decision%22%20OR%20%22automated%20decision%22%20OR%20%22facial%20recognition%22%20OR%20%22generative%20AI%22&type=o&order_by=dateFiled%20desc',
  'court_database',
  'daily',
  true,
  null,
  'CourtListener/RECAP API search for US AI-related opinions and docket signals. Requires COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN at runtime; degrades honestly when absent. Results support case-law discovery and still require citation/relevance safeguards before legal-database reliance.',
  'high',
  'api',
  '{
    "apiProvider": "courtlistener",
    "sourceCategory": "case_law_database",
    "authorityTypeHint": "Case law",
    "legalAreaHint": "AI governance",
    "maxItems": 15,
    "includeAnyTerms": [
      "artificial intelligence",
      "algorithmic decision",
      "automated decision",
      "facial recognition",
      "generative AI",
      "predictive policing",
      "biometric"
    ],
    "editorialNotes": [
      "CourtListener is a legal research corpus and RECAP/docket discovery surface.",
      "Prefer official court citation and docket metadata when converting discoveries into verified legal database entries."
    ]
  }'::jsonb,
  'existing',
  'court',
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
