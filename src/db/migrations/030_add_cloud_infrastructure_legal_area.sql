-- 030 - Add cloud and infrastructure as a first-class legal-area taxonomy value.
--
-- The application legal-area enum now includes "Cloud and infrastructure" for AI
-- infrastructure, data centres, cloud services, hosting, compute, edge computing,
-- cloud switching/interoperability, resilience and security obligations that shape
-- AI deployment infrastructure.
--
-- The production column is text-backed, so no enum DDL is required here. This
-- idempotent backfill moves existing cloud/infrastructure signals into the more
-- precise domain and tags them for future filters.

update public.ai_regulatory_updates
set
  legal_area = 'Cloud and infrastructure',
  tags = case
    when 'legal-area:Cloud and infrastructure' = any(tags) then tags
    else array_append(tags, 'legal-area:Cloud and infrastructure')
  end
where legal_area in ('Cybersecurity', 'AI governance', 'Other')
  and lower(coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(what_happened, ''))
    ~ '(cloud|data centre|data center|infrastructure|hosting|compute|edge computing|data act|nis2|digital operational resilience)';
