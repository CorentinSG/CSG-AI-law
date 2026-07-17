-- Activate the native DILA/PISTE Legifrance connector now that PISTE credentials
-- are configured in the production runtimes.
update public.regulation_sources
set
  source_url = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search',
  preferred_extraction_method = 'api',
  config = jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce(config, '{}'::jsonb),
        '{apiProvider}',
        '"legifrance"'::jsonb,
        true
      ),
      '{fond}',
      '"JORF"'::jsonb,
      true
    ),
    '{searchText}',
    '"intelligence artificielle"'::jsonb,
    true
  ),
  notes = 'Official French legislative database for AI-related decrees, laws, CNIL deliberations published in the JORF, and related governance texts. The official DILA/PISTE API connector (apiProvider ''legifrance'') is the preferred channel when LEGIFRANCE_PISTE_CLIENT_ID/SECRET are configured; it degrades honestly if credentials or upstream access fail.',
  updated_at = now()
where id = 'src-fr-legifrance-ai';
