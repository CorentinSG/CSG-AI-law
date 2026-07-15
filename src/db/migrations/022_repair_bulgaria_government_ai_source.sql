-- Migration 022: repair Bulgaria government AI source
--
-- PURPOSE: replace an unstable Bulgarian government endpoint that resets
-- plain fetch and Scrapling requests with a stable official European
-- Commission AI Watch Bulgaria country report.
--
-- SAFETY: Non-destructive. Updates only source `src-bg-government-ai`.

update public.regulation_sources
set
  name = 'European Commission AI Watch Bulgaria strategy report AI legal materials',
  source_url = 'https://ai-watch.ec.europa.eu/countries/bulgaria/bulgaria-ai-strategy-report_en',
  notes = 'Official European Commission AI Watch country report for Bulgaria AI strategy and implementation monitoring. Use as an official Bulgaria-facing policy anchor while the national e-government endpoint is unstable.',
  latest_accessibility_issue = null,
  latest_parser_warnings = '[]'::jsonb,
  updated_at = now()
where id = 'src-bg-government-ai';
