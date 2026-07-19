# EU Aggressive Legal News Radar Design

Goal: make the European Union AI-law area much closer to live by expanding journalistic and policy-press discovery coverage aggressively, while preserving official EU institutions as the only verified legal-authority layer.

Architecture: reuse the France aggressive radar pattern at supranational level. Keep the current EU authority spine unchanged: EUR-Lex, European Commission, AI Office, European Parliament, Council, Curia/CJEU, EDPB, EDPS, official standards and official guidance sources. Add a wider EU media-discovery layer around the existing NewsAPI and GDELT connectors. The new layer should feed alerts, news candidates, currentness signals, and review queues; it must not convert journalism into verified law, case law, enforcement, guidance, or standards without official-source confirmation.

Source Families:
- Brussels and EU policy press: Euractiv, Politico Europe, MLex when accessible, Contexte Europe when accessible, and comparable Brussels policy outlets.
- Privacy and AI-governance press: IAPP, Tech Policy Press, Future of Privacy Forum, and serious privacy/AI governance outlets with EU coverage.
- Tech and regulation press: TechCrunch, The Register, Euronews Next, Sifted, and EU-focused technology regulation desks.
- Legal, competition, and platform-regulation press: legal/regulatory outlets covering AI Act, DSA, DMA, GDPR, product safety, competition, copyright, cloud, cybersecurity, and standards overlaps; paywalled sources remain metadata/manual-review only.
- General international press: Reuters, AP, Financial Times, The Guardian, Bloomberg when accessible, and similar serious outlets that report EU regulatory developments quickly.
- Broad fallback: aggressive GDELT queries for EU AI-law, AI Act, AI Office, GPAI, high-risk systems, biometrics, data protection, copyright, cloud, competition, product safety, and harmonised standards.

Query Strategy: split the EU live lane into several source descriptors instead of relying only on one generic EU media source. Use targeted queries for AI Act implementation, AI Office enforcement, GPAI model obligations, high-risk systems, prohibited practices, biometrics, standards, EDPB/EDPS guidance, GDPR-AI overlap, copyright/generative AI, DSA/DMA/platform governance, competition, product safety, cybersecurity/cloud, public-sector AI, and Parliament/Council/Commission announcements. Prefer domain-restricted NewsAPI queries for high-signal outlets and broad GDELT queries for recall.

Freshness and Priority:
- High-priority EU media lanes target every 5 minutes when infrastructure allows, with hourly fallback.
- Broad GDELT can run hourly or daily depending on rate limits.
- Official EU confirmation lanes stay on their current safer cadence, except official RSS/API feeds that are already live-ready.
- Runtime health should distinguish official EU lanes from media-discovery lanes, so noisy press discovery never masks authority-source failures.

Publication Rules:
- Press and API-discovered articles are discovery-only unless an existing publication rule explicitly allows them as news items.
- No press item can create or upgrade a legal database entry to verified authority without an official URL or manual review.
- Store enough metadata to trace the lead: title, publisher, URL, published date, query/source family, matched legal topics, and suggested official follow-up source.
- Paywalled or restricted outlets may contribute metadata leads only; do not scrape or reproduce protected article text.

Implementation Scope:
- Extend `src/agents/ai-regulation/euNewsSources.ts` with multiple aggressive EU media descriptors and scheduler guidance.
- Extend `src/db/seed/ai-regulation-seed.ts` and `src/content/ai-regulation/news-sources.ts` with matching active EU discovery sources.
- Update EU live scan source selection so `eu_live_news_discovery_scan` includes the new media families while official EU scans continue to exclude media.
- Add or update tests proving source IDs, source categories, discovery-only wording, official/media separation, and scheduler/currentness behavior.
- Add an operator note for required credentials and runtime limits: `NEWSAPI_API_KEY` improves speed; GDELT remains the keyless fallback; paywalled sources are metadata/manual-review only.

Out of Scope:
- No changes to Claude-owned Standards UI files.
- No automatic legal conclusion from journalism.
- No bulk article scraping from paywalled or rights-restricted publishers.
- No guarantee of true real-time coverage if the deployment scheduler cannot run at five-minute cadence.
- No country-specific source expansion beyond existing country lanes; this spec is for supranational EU coverage.

Testing:
- EU source registry tests prove all new media lanes are live-eligible, discovery-only, and mapped to fresh/watch/stale thresholds.
- Scan profile tests prove official EU scans include only authority sources and EU live discovery scans include the aggressive media set.
- News source tests prove public source metadata exists for each lane with non-official reliability.
- Seed tests prove every new EU media source is active, API-based, non-official/discovery-only, and explicitly says it is never legal authority without official-source confirmation.
- Full verification after implementation: targeted EU tests, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` with complete local production-guard environment variables.
