-- Migration 019: remaining EU member state monitoring sources
--
-- PURPOSE: activate the default country legal-news agents for the remaining
-- EU member states by backing their expected source IDs with real official and
-- discovery sources.
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
    ('bg', 'Bulgaria', 'Bulgarian Commission for Personal Data Protection', 'https://www.cpdp.bg/', 'Bulgarian Ministry of Electronic Governance', 'https://egov.government.bg/', '(("artificial intelligence" OR "AI Act" OR "izkustven intelekt") AND (Bulgaria OR Bulgarian) AND (law OR regulation OR legal OR CPDP))', '("artificial intelligence" OR "AI Act" OR "izkustven intelekt") AND Bulgaria AND (law OR regulation OR CPDP)', 'bta.bg,capital.bg,dnevnik.bg,reuters.com,politico.eu,euractiv.com'),
    ('hr', 'Croatia', 'Croatian Personal Data Protection Agency', 'https://azop.hr/', 'Croatian Ministry of Justice, Public Administration and Digital Transformation', 'https://mpudt.gov.hr/', '(("artificial intelligence" OR "AI Act" OR "umjetna inteligencija") AND (Croatia OR Hrvatska OR AZOP) AND (law OR regulation OR legal))', '("artificial intelligence" OR "AI Act" OR "umjetna inteligencija") AND (Croatia OR Hrvatska) AND (law OR regulation OR AZOP)', 'hina.hr,jutarnji.hr,vecernji.hr,reuters.com,politico.eu,euractiv.com'),
    ('cy', 'Cyprus', 'Cyprus Commissioner for Personal Data Protection', 'https://www.dataprotection.gov.cy/', 'Cyprus Deputy Ministry of Research, Innovation and Digital Policy', 'https://www.gov.cy/dmrid/en/uncategorized/regulation-eu-2024-1689-establishing-harmonised-rules-on-artificial-intelligence-ai-act/', '(("artificial intelligence" OR "AI Act") AND Cyprus AND (law OR regulation OR legal OR data protection))', '("artificial intelligence" OR "AI Act") AND Cyprus AND (law OR regulation OR legal)', 'cyprus-mail.com,philenews.com,stockwatch.com.cy,reuters.com,politico.eu,euractiv.com'),
    ('cz', 'Czechia', 'Czech Office for Personal Data Protection', 'https://uoou.gov.cz/en', 'Czech Ministry of Industry and Trade AI Act implementation', 'https://mpo.gov.cz/en/guidepost/for-the-media/press-releases/the-ministry-of-industry-and-trade-has-prepared-a-draft-law-on-artificial-intelligence----289865/', '(("artificial intelligence" OR "AI Act" OR "umela inteligence") AND (Czechia OR Czech Republic OR UOOU) AND (law OR regulation OR legal))', '("artificial intelligence" OR "AI Act" OR "umela inteligence") AND (Czechia OR "Czech Republic") AND (law OR regulation OR UOOU)', 'ctk.eu,hn.cz,lupa.cz,reuters.com,politico.eu,euractiv.com'),
    ('dk', 'Denmark', 'Danish Data Protection Agency', 'https://www.datatilsynet.dk/english', 'Danish Agency for Digital Government AI guidance', 'https://en.digst.dk/news/news-archive/2024/maj/the-agency-for-digital-government-publishes-ai-guides/', '(("artificial intelligence" OR "AI Act" OR "kunstig intelligens") AND Denmark AND (law OR regulation OR legal OR Datatilsynet))', '("artificial intelligence" OR "AI Act" OR "kunstig intelligens") AND Denmark AND (law OR regulation OR Datatilsynet)', 'berlingske.dk,borsen.dk,version2.dk,reuters.com,politico.eu,euractiv.com'),
    ('ee', 'Estonia', 'Estonian Data Protection Inspectorate', 'https://www.aki.ee/en', 'Estonia Kratid AI initiative', 'https://www.kratid.ee/en', '(("artificial intelligence" OR "AI Act" OR "tehisintellekt") AND Estonia AND (law OR regulation OR legal OR AKI))', '("artificial intelligence" OR "AI Act" OR "tehisintellekt") AND Estonia AND (law OR regulation OR AKI)', 'err.ee,news.err.ee,postimees.ee,reuters.com,politico.eu,euractiv.com'),
    ('fi', 'Finland', 'Finnish Office of the Data Protection Ombudsman', 'https://tietosuoja.fi/en/ai-systems-and-data-protection', 'Traficom EU Artificial Intelligence Act materials', 'https://traficom.fi/en/ai-regulation/about-eu-artificial-intelligence-act', '(("artificial intelligence" OR "AI Act" OR tekoaly) AND Finland AND (law OR regulation OR legal OR Traficom))', '("artificial intelligence" OR "AI Act" OR tekoaly) AND Finland AND (law OR regulation OR Traficom)', 'yle.fi,hs.fi,kauppalehti.fi,reuters.com,politico.eu,euractiv.com'),
    ('gr', 'Greece', 'Hellenic Data Protection Authority', 'https://www.dpa.gr/en', 'Greek National Codification Portal', 'https://gslegal.gov.gr/en/national-codification-portal/', '(("artificial intelligence" OR "AI Act" OR "techniti noimosyni") AND Greece AND (law OR regulation OR legal OR DPA))', '("artificial intelligence" OR "AI Act" OR "techniti noimosyni") AND Greece AND (law OR regulation OR DPA)', 'ekathimerini.com,lawspot.gr,naftemporiki.gr,reuters.com,politico.eu,euractiv.com'),
    ('hu', 'Hungary', 'Hungarian National Authority for Data Protection and Freedom of Information', 'https://www.naih.hu/', 'Hungarian National Legislation Database', 'https://njt.hu/', '(("artificial intelligence" OR "AI Act" OR "mesterseges intelligencia") AND Hungary AND (law OR regulation OR legal OR NAIH))', '("artificial intelligence" OR "AI Act" OR "mesterseges intelligencia") AND Hungary AND (law OR regulation OR NAIH)', 'portfolio.hu,jogaszvilag.hu,hvg.hu,reuters.com,politico.eu,euractiv.com'),
    ('lv', 'Latvia', 'Latvian Data State Inspectorate', 'https://www.dvi.gov.lv/en', 'Likumi.lv official legislation database', 'https://likumi.lv/', '(("artificial intelligence" OR "AI Act" OR "maksligais intelekts") AND Latvia AND (law OR regulation OR legal OR DVI))', '("artificial intelligence" OR "AI Act" OR "maksligais intelekts") AND Latvia AND (law OR regulation OR DVI)', 'lvportals.lv,juristavards.lv,lsm.lv,reuters.com,politico.eu,euractiv.com'),
    ('lt', 'Lithuania', 'Lithuanian State Data Protection Inspectorate', 'https://vdai.lrv.lt/en/', 'Lithuanian Register of Legal Acts', 'https://www.e-tar.lt/portal/en/index', '(("artificial intelligence" OR "AI Act" OR "dirbtinis intelektas") AND Lithuania AND (law OR regulation OR legal OR VDAI))', '("artificial intelligence" OR "AI Act" OR "dirbtinis intelektas") AND Lithuania AND (law OR regulation OR VDAI)', 'teise.pro,vz.lt,lrt.lt,reuters.com,politico.eu,euractiv.com'),
    ('lu', 'Luxembourg', 'Luxembourg National Commission for Data Protection', 'https://cnpd.public.lu/en.html', 'Legilux official legal portal', 'https://legilux.public.lu/', '(("artificial intelligence" OR "AI Act") AND Luxembourg AND (law OR regulation OR legal OR CNPD))', '("artificial intelligence" OR "AI Act") AND Luxembourg AND (law OR regulation OR CNPD)', 'paperjam.lu,luxtimes.lu,virgule.lu,reuters.com,politico.eu,euractiv.com'),
    ('mt', 'Malta', 'Malta Information and Data Protection Commissioner', 'https://idpc.org.mt/', 'Legislation Malta', 'https://legislation.mt/', '(("artificial intelligence" OR "AI Act") AND Malta AND (law OR regulation OR legal OR IDPC))', '("artificial intelligence" OR "AI Act") AND Malta AND (law OR regulation OR IDPC)', 'timesofmalta.com,maltatoday.com.mt,newsbook.com.mt,reuters.com,politico.eu,euractiv.com'),
    ('pl', 'Poland', 'Polish Personal Data Protection Office', 'https://uodo.gov.pl/en', 'Polish Ministry of Digital Affairs AI Act implementation', 'https://www.gov.pl/web/cyfryzacja/wdrozenie-aktu-o-ai', '(("artificial intelligence" OR "AI Act" OR "sztuczna inteligencja") AND Poland AND (law OR regulation OR legal OR UODO))', '("artificial intelligence" OR "AI Act" OR "sztuczna inteligencja") AND Poland AND (law OR regulation OR UODO)', 'rp.pl,prawo.pl,dziennik.pl,reuters.com,politico.eu,euractiv.com'),
    ('pt', 'Portugal', 'Portuguese National Data Protection Commission', 'https://www.cnpd.pt/', 'Diario da Republica', 'https://diariodarepublica.pt/', '(("artificial intelligence" OR "AI Act" OR "inteligencia artificial") AND Portugal AND (law OR regulation OR legal OR CNPD))', '("artificial intelligence" OR "AI Act" OR "inteligencia artificial") AND Portugal AND (law OR regulation OR CNPD)', 'observador.pt,jornaldenegocios.pt,publico.pt,reuters.com,politico.eu,euractiv.com'),
    ('ro', 'Romania', 'Romanian National Supervisory Authority for Personal Data Processing', 'https://www.dataprotection.ro/', 'Romanian national AI strategy', 'https://www.research.gov.ro/programe-nationale/strategia-nationala-in-domeniul-inteligentei-artificiale-2024-2027/', '(("artificial intelligence" OR "AI Act" OR "inteligenta artificiala") AND Romania AND (law OR regulation OR legal OR ANSPDCP))', '("artificial intelligence" OR "AI Act" OR "inteligenta artificiala") AND Romania AND (law OR regulation OR ANSPDCP)', 'juridice.ro,hotnews.ro,g4media.ro,reuters.com,politico.eu,euractiv.com'),
    ('sk', 'Slovakia', 'Slovak Office for Personal Data Protection', 'https://dataprotection.gov.sk/uoou/en', 'Slov-lex official legislation portal', 'https://www.slov-lex.sk/', '(("artificial intelligence" OR "AI Act" OR "umela inteligencia") AND Slovakia AND (law OR regulation OR legal OR UOOU))', '("artificial intelligence" OR "AI Act" OR "umela inteligencia") AND Slovakia AND (law OR regulation OR UOOU)', 'pravnenoviny.sk,sme.sk,dennikn.sk,reuters.com,politico.eu,euractiv.com'),
    ('si', 'Slovenia', 'Slovenian Information Commissioner', 'https://www.ip-rs.si/en', 'Slovenian national AI ecosystem', 'https://www.gov.si/teme/nacionalni-ekosistem-za-umetno-inteligenco/', '(("artificial intelligence" OR "AI Act" OR "umetna inteligenca") AND Slovenia AND (law OR regulation OR legal OR IPRS))', '("artificial intelligence" OR "AI Act" OR "umetna inteligenca") AND Slovenia AND (law OR regulation OR IPRS)', 'iusinfo.si,sta.si,delo.si,reuters.com,politico.eu,euractiv.com')
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
