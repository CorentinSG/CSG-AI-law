-- Migration 021: non-EU Western Europe and Balkan monitoring sources
--
-- PURPOSE: activate country legal-news agents for selected non-EU Western
-- European and Balkan jurisdictions with official anchors plus NewsAPI/GDELT
-- discovery channels.
--
-- SAFETY: Non-destructive. Upserts only known source IDs.

with country_sources (
  code,
  country,
  dpa_name,
  dpa_url,
  government_name,
  government_url,
  news_query,
  gdelt_query,
  domains
) as (
  values
    ('gb', 'United Kingdom', 'Information Commissioner''s Office', 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/', 'UK legislation and AI policy sources', 'https://www.legislation.gov.uk/', '(("artificial intelligence" OR "AI Act" OR "algorithmic decision") AND ("United Kingdom" OR Britain OR ICO) AND (law OR regulation OR legal))', '("artificial intelligence" OR "AI Act" OR "algorithmic decision") AND ("United Kingdom" OR Britain OR ICO) AND (law OR regulation OR legal)', 'lawgazette.co.uk,legalfutures.co.uk,theregister.com,reuters.com,politico.eu,ft.com'),
    ('no', 'Norway', 'Norwegian Data Protection Authority', 'https://www.datatilsynet.no/en/regulations-and-tools/artificial-intelligence/', 'Lovdata official legal information', 'https://lovdata.no/', '(("artificial intelligence" OR "AI Act" OR "kunstig intelligens") AND Norway AND (law OR regulation OR legal OR Datatilsynet))', '("artificial intelligence" OR "AI Act" OR "kunstig intelligens") AND Norway AND (law OR regulation OR Datatilsynet)', 'rett24.no,digi.no,nrk.no,reuters.com,politico.eu,euractiv.com'),
    ('is', 'Iceland', 'Icelandic Data Protection Authority', 'https://www.personuvernd.is/information-in-english/', 'Icelandic official gazette', 'https://www.stjornartidindi.is/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Iceland AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Iceland AND (law OR regulation OR legal)', 'ruv.is,icelandreview.com,visir.is,reuters.com,politico.eu'),
    ('ch', 'Switzerland', 'Federal Data Protection and Information Commissioner', 'https://www.edoeb.admin.ch/edoeb/en/home/datenschutz/technologien/ki.html', 'Fedlex official publication platform', 'https://www.fedlex.admin.ch/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Switzerland AND (law OR regulation OR legal OR FDPIC))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Switzerland AND (law OR regulation OR FDPIC)', 'swissinfo.ch,nzz.ch,tagesanzeiger.ch,reuters.com,politico.eu'),
    ('li', 'Liechtenstein', 'Liechtenstein Data Protection Office', 'https://www.datenschutzstelle.li/', 'Liechtenstein legal information system', 'https://www.gesetze.li/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Liechtenstein AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Liechtenstein AND (law OR regulation OR legal)', 'vaterland.li,volksblatt.li,liechtenstein-business.li,reuters.com'),
    ('mc', 'Monaco', 'Commission de Controle des Informations Nominatives', 'https://www.ccin.mc/', 'Legimonaco official legal portal', 'https://legimonaco.mc/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Monaco AND (law OR regulation OR legal OR CCIN))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Monaco AND (law OR regulation OR legal)', 'monacolife.net,monaco-tribune.com,reuters.com,politico.eu'),
    ('ad', 'Andorra', 'Andorran Data Protection Agency', 'https://www.apda.ad/', 'Butlleti Oficial del Principat d''Andorra', 'https://www.bopa.ad/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Andorra AND (law OR regulation OR legal OR APDA))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Andorra AND (law OR regulation OR legal)', 'andorradifusio.ad,diariandorra.ad,altaveu.com,reuters.com'),
    ('sm', 'San Marino', 'San Marino Data Protection Authority', 'https://www.garanteprivacy.sm/', 'San Marino institutional legal sources', 'https://www.consigliograndeegenerale.sm/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND "San Marino" AND (law OR regulation OR legal OR privacy))', '("artificial intelligence" OR "AI Act" OR algorithm) AND "San Marino" AND (law OR regulation OR legal)', 'sanmarinortv.sm,libertas.sm,reuters.com,politico.eu'),
    ('va', 'Vatican City', 'Vatican City official legal sources', 'https://www.vaticanstate.va/', 'Vatican archive and official documents', 'https://www.vatican.va/archive/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND (Vatican OR "Holy See") AND (law OR regulation OR legal))', '("artificial intelligence" OR "AI Act" OR algorithm) AND (Vatican OR "Holy See") AND (law OR regulation OR legal)', 'vaticannews.va,reuters.com,politico.eu'),
    ('al', 'Albania', 'Information and Data Protection Commissioner', 'https://www.idp.al/', 'Albanian official publications center', 'https://qbz.gov.al/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Albania AND (law OR regulation OR legal OR IDP))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Albania AND (law OR regulation OR IDP)', 'exit.al,tiranatimes.com,balkaninsight.com,euractiv.com,reuters.com'),
    ('ba', 'Bosnia and Herzegovina', 'Personal Data Protection Agency of Bosnia and Herzegovina', 'https://azlp.ba/', 'Parliamentary Assembly of Bosnia and Herzegovina', 'https://www.parlament.ba/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND ("Bosnia and Herzegovina" OR Bosnia) AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act" OR algorithm) AND ("Bosnia and Herzegovina" OR Bosnia) AND (law OR regulation OR legal)', 'balkaninsight.com,klix.ba,sarajevotimes.com,reuters.com,euractiv.com'),
    ('xk', 'Kosovo', 'Information and Privacy Agency', 'https://aip.rks-gov.net/', 'Official Gazette of Kosovo', 'https://gzk.rks-gov.net/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Kosovo AND (law OR regulation OR legal OR privacy))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Kosovo AND (law OR regulation OR legal)', 'prishtinainsight.com,koha.net,balkaninsight.com,reuters.com,euractiv.com'),
    ('me', 'Montenegro', 'Agency for Personal Data Protection and Free Access to Information', 'https://www.azlp.me/', 'Government of Montenegro legal and policy portal', 'https://www.gov.me/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Montenegro AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Montenegro AND (law OR regulation OR legal)', 'vijesti.me,balkaninsight.com,reuters.com,euractiv.com'),
    ('mk', 'North Macedonia', 'Personal Data Protection Agency of North Macedonia', 'https://azlp.mk/', 'Official Gazette of North Macedonia', 'https://www.slvesnik.com.mk/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND ("North Macedonia" OR Macedonia) AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act" OR algorithm) AND ("North Macedonia" OR Macedonia) AND (law OR regulation OR legal)', 'mia.mk,balkaninsight.com,slobodenpecat.mk,reuters.com,euractiv.com'),
    ('rs', 'Serbia', 'Commissioner for Information of Public Importance and Personal Data Protection', 'https://www.poverenik.rs/', 'Serbian legal information system', 'https://www.pravno-informacioni-sistem.rs/', '(("artificial intelligence" OR "AI Act" OR algorithm) AND Serbia AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act" OR algorithm) AND Serbia AND (law OR regulation OR legal)', 'balkaninsight.com,n1info.rs,politika.rs,reuters.com,euractiv.com')
),
expanded_sources as (
  select
    'src-' || code || '-dpa-ai' as id,
    dpa_name || ' AI and data-protection materials' as name,
    country as jurisdiction,
    'Europe' as region,
    country,
    dpa_url as source_url,
    'regulator_page' as source_type,
    'daily' as scan_frequency,
    true as active,
    null::timestamptz as last_scanned_at,
    'Official ' || country || ' data-protection authority source for AI, automated-decision, biometric, and data-protection enforcement monitoring.' as notes,
    'high' as reliability_level,
    'html_static' as preferred_extraction_method,
    jsonb_build_object(
      'maxItems', 15,
      'authorityTypeHint', 'Agency guidance',
      'itemSelector', 'main a[href], article a[href], a[href]',
      'linkSelector', 'self',
      'includeAnyTerms', jsonb_build_array('artificial intelligence', 'AI Act', 'algorithm', 'automated decision', 'biometric', 'data protection'),
      'editorialNotes', jsonb_build_array('Official DPA/regulator source.', 'Regulator guidance and enforcement signals must be classified separately from binding legislation.')
    ) as config,
    'existing' as ingestion_method,
    'regulator' as source_category
  from country_sources

  union all

  select
    'src-' || code || '-government-ai',
    government_name || ' AI legal materials',
    country,
    'Europe',
    country,
    government_url,
    'static_page',
    'daily',
    true,
    null::timestamptz,
    'Official ' || country || ' government or legal-database anchor for AI Act implementation, legislation, soft-law, and public-sector AI materials.',
    'high',
    'html_static',
    jsonb_build_object(
      'maxItems', 15,
      'authorityTypeHint', 'Government policy',
      'itemSelector', 'main a[href], article a[href], a[href]',
      'linkSelector', 'self',
      'includeAnyTerms', jsonb_build_array('artificial intelligence', 'AI Act', 'algorithm', 'automated decision', 'regulation', 'legislation'),
      'editorialNotes', jsonb_build_array('Official government or legal-database source.', 'Use as authoritative legal-database input only when the item itself is an official legal or policy document.')
    ),
    'existing',
    'official'
  from country_sources

  union all

  select
    'src-' || code || '-newsapi-ai',
    country || ' AI legal news discovery (NewsAPI)',
    country,
    'Europe',
    country,
    'https://newsapi.org/v2/everything?q=' || replace(replace(news_query, ' ', '%20'), '"', '%22') || '&sortBy=publishedAt&pageSize=20&domains=' || domains,
    'media_source',
    'hourly',
    true,
    null::timestamptz,
    'Discovery-only ' || country || ' AI legal news query restricted to reputable national and EU policy media. Official confirmation remains required for legal-database publication.',
    'medium',
    'api',
    jsonb_build_object(
      'apiProvider', 'newsapi',
      'sourceCategory', 'media_discovery_source',
      'maxItems', 12,
      'allowedDomains', string_to_array(domains, ',')
    ),
    'existing',
    'media'
  from country_sources

  union all

  select
    'src-' || code || '-gdelt-ai',
    country || ' AI legal news corroboration (GDELT)',
    country,
    'Europe',
    country,
    'https://api.gdeltproject.org/api/v2/doc/doc?query=' || replace(replace(gdelt_query, ' ', '%20'), '"', '%22') || '&mode=artlist&format=json&maxrecords=20',
    'discovery_source',
    'hourly',
    true,
    null::timestamptz,
    'Discovery and corroboration channel for ' || country || '; never authoritative by itself.',
    'medium',
    'api',
    jsonb_build_object(
      'apiProvider', 'gdelt',
      'sourceCategory', 'media_discovery_source',
      'maxItems', 12
    ),
    'existing',
    'media'
  from country_sources
)
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
)
select
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
  now(),
  now()
from expanded_sources
on conflict (id) do update set
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
