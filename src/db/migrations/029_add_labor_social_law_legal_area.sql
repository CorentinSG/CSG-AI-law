-- 029 — Add labor and social law as a first-class legal-area taxonomy value.
--
-- The application legal-area enum now includes "Labor and social law" for AI issues
-- touching employment, workplace surveillance, hiring, workers, platform work,
-- algorithmic management, collective bargaining, and social-law enforcement.
--
-- The production column is text-backed, so no enum DDL is required here. This
-- idempotent backfill moves existing employment/workplace AI entries into the
-- more precise domain without deleting the older "Employment" value from code.

update public.ai_regulatory_updates
set
  legal_area = 'Labor and social law',
  tags = case
    when 'legal-area:Labor and social law' = any(tags) then tags
    else array_append(tags, 'legal-area:Labor and social law')
  end
where legal_area = 'Employment'
   or 'legal-area:Employment' = any(tags)
   or 'Employment' = any(tags)
   or (
     lower(coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(what_happened, ''))
       ~ '(employment|workplace|worker|labour|labor|social law|platform work|algorithmic management|hiring)'
     and lower(coalesce(title, '')) not like '%department of enterprise, trade and employment%'
     and lower(coalesce(title, '')) not like '%ai act implementation monitoring baseline%'
   );
