-- Repair Hungary official legislation source after njt.hu started resetting crawler connections.
-- The National Legislation Database now resolves reliably under njt.jog.gov.hu.

UPDATE public.regulation_sources
SET
  source_url = 'https://njt.jog.gov.hu/',
  latest_accessibility_issue = NULL,
  source_reliability_notes = 'Official Hungary government legal-database source. URL repaired to current National Legislation Database host after njt.hu crawler connection resets.',
  updated_at = NOW()
WHERE id = 'src-hu-government-ai'
  AND source_url = 'https://njt.hu/';
