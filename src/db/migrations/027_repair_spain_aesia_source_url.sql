-- Repair AESIA monitoring URL after the official portal moved away from
-- the legacy www.aesia.gob.es host, which now fails TLS in runtime scraping.

update public.regulation_sources
set
  source_url = 'https://aesia.digital.gob.es/en/es',
  notes = 'Official Spanish AI supervision agency site used to monitor governance, institutional, and implementation material related to AI supervision. URL repaired to the current AESIA digital.gob.es portal after the legacy host failed runtime TLS checks.',
  updated_at = now()
where id = 'src-es-aesia-ai';
