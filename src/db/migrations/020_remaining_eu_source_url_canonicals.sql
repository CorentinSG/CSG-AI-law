-- Migration 020: canonical URLs for two remaining-EU regulator sources
--
-- PURPOSE: keep the seeded DPA/regulator sources on URLs that the production
-- worker can fetch directly without relying on runtime redirect handling.
--
-- SAFETY: Non-destructive. Updates only two known source URLs.

update public.regulation_sources
set
  source_url = 'https://cpdp.bg/',
  updated_at = now()
where id = 'src-bg-dpa-ai';

update public.regulation_sources
set
  source_url = 'https://www.dataprotection.gov.cy/dataprotection/dataprotection.nsf',
  updated_at = now()
where id = 'src-cy-dpa-ai';
