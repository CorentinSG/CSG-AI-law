# France Aggressive Legal News Radar Design

Goal: make the France AI-law area much closer to live by expanding journalistic discovery coverage aggressively, while preserving the existing rule that only official or authoritative legal sources can create verified legal authority.

Architecture: keep the current France authority spine unchanged: CNIL, Legifrance, Judilibre, Conseil d'Etat, Cour de cassation, Defenseur des droits, parliamentary/government sources when added. Add a wider media-discovery layer around the existing NewsAPI and GDELT connectors. The new layer should feed alerts, news candidates, currentness signals, and review queues; it must not convert press coverage into verified law, case law, enforcement, or guidance without official-source confirmation.

Source Families:
- Specialist legal press: Dalloz Actualite, Actu-Juridique, Gazette du Palais/Lextenso, Village de la Justice, and comparable French legal-professional outlets when their access terms allow metadata discovery.
- Tech and digital-policy press: Next.ink, L'Usine Digitale, Siecle Digital/siecledigital.fr, ZDNet France or its successor publication coverage, and other reputable French digital-policy outlets.
- General, political, and economic press: Le Monde, Les Echos, Liberation, Le Figaro, Franceinfo, Public Senat, and similar national outlets that regularly cover regulation, justice, labor, public sector, or digital policy.
- Europe and cross-border policy press: Euractiv France, Politico Europe, Contexte when accessible, IAPP and other serious privacy/AI-policy outlets for France-relevant signals.
- Sector coverage: La Gazette des communes for public-sector AI, and accessible health, education, employment, cybersecurity, and public-procurement outlets where AI legal developments often appear first.
- Broad fallback: aggressive GDELT France queries for French-language and France-focused AI legal signals, independent of NewsAPI credentials.

Query Strategy: split the live lane into several source descriptors instead of one generic France media source. Use targeted queries for AI Act implementation, CNIL enforcement/guidance, automated decision-making, employment AI, public-sector algorithms, biometrics, copyright/generative AI, data protection, cybersecurity/cloud, procurement, education, health, courts, lawyers' use of generative AI, and parliamentary/government announcements. Prefer domain-restricted queries for high-signal outlets and broader French-language GDELT queries for recall.

Freshness and Priority:
- High-priority media lanes target every 5 minutes when infrastructure allows, with hourly fallback.
- General broad discovery can run hourly or daily depending on cost/rate limits.
- Official confirmation lanes stay on their safer cadence, except CNIL RSS which remains a high-priority live official feed.
- Runtime health should show France media lanes separately from official lanes, so noisy or rate-limited press discovery does not hide authority-source problems.

Publication Rules:
- Press and API-discovered articles are discovery-only unless an existing publication rule explicitly allows them as news items.
- No press item can create or upgrade a legal database entry to verified authority without an official URL or manual review.
- Store enough metadata to let reviewers trace the lead: title, publisher, URL, published date, query/source family, matched legal topics, and suggested official follow-up source.
- Paywalled or restricted outlets may contribute metadata leads only; do not scrape or reproduce protected article text.

Implementation Scope:
- Extend `src/agents/ai-regulation/franceNewsSources.ts` with multiple aggressive media descriptors and scheduler guidance.
- Extend `src/db/seed/ai-regulation-seed.ts` and `src/content/ai-regulation/news-sources.ts` with matching active discovery sources.
- Update France live scan source selection so `france_live_news_scan` includes the new media families while `france_official_legal_scan` continues to exclude all media.
- Add or update tests proving source IDs, source categories, discovery-only wording, official/media separation, and scheduler/currentness behavior.
- Add an operator note for required credentials and runtime limits: `NEWSAPI_API_KEY` improves speed; GDELT remains the keyless fallback; paywalled sources are metadata/manual-review only.

Out of Scope:
- No changes to Claude-owned Standards UI files.
- No automatic legal conclusion from journalism.
- No bulk article scraping from paywalled or rights-restricted publishers.
- No guarantee of true real-time coverage if the deployment scheduler cannot run at five-minute cadence.

Testing:
- France source registry tests prove all new media lanes are live-eligible, discovery-only, and mapped to fresh/watch/stale thresholds.
- Scan profile tests prove official France scans include only authority sources and live France scans include the aggressive media set.
- News source tests prove public source metadata exists for each lane with non-official reliability.
- Connector tests, if needed, prove allowed-domain filtering and broad GDELT fallback keep AI-plus-legal relevance.
- Full verification after implementation: targeted France tests, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
