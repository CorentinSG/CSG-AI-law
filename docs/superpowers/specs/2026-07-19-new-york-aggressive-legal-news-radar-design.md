# New York Aggressive Legal News Radar Design

Goal: make the New York AI-law watch much closer to live by expanding journalistic and legal-press discovery coverage aggressively, while preserving New York official, court, agency, legislature, and CourtListener sources as the only verified legal-authority layer.

Architecture: reuse the France and EU aggressive radar pattern at a state/city/federal-litigation level. Keep the current New York authority spine unchanged: New York Courts, NY Courts Part 161, CourtListener/RECAP for New York federal AI litigation, NYC DCWP AEDT, NYC Rules/Council, NYC OTI, NY Senate/Assembly, RAISE Act source, NYDFS, and NY AG. Add a wider New York media-discovery layer around NewsAPI and GDELT. The new layer should feed alerts, news candidates, currentness signals, and review queues; it must not convert journalism or law-firm commentary into verified law, case law, enforcement, guidance, or court-rule authority without official-source confirmation or manual review.

Source Families:
- Legal press and litigation trackers: Law360, New York Law Journal, Bloomberg Law, Reuters Legal, ABA Journal, and serious court/litigation outlets.
- Law-firm and legal commentary: JD Supra, Lexology, National Law Review, and firm alerts for leads on Part 161, AEDT, NYDFS, NY AG, privilege, work-product, and sanctions. These remain metadata/manual-review leads only.
- New York local civic and politics press: City & State NY, The City, Gothamist, New York Daily News, New York Post, New York Times when accessible, and other city/state policy outlets.
- Business, finance, and insurance press: Bloomberg, Reuters, Insurance Journal, American Banker, and finance/insurance sources for NYDFS AI and model-governance developments.
- Tech and platform press: TechCrunch, The Verge, Wired, The Information when accessible, and other technology desks that report New York AI litigation or regulation.
- Broad fallback: aggressive GDELT queries for New York AI law, Part 161, hallucinated cases, AI evidence, work product, privilege, AEDT, Local Law 144, NYDFS, NY AG, RAISE Act, automated decision tools, biometrics, insurance, finance, and consumer protection.

Query Strategy: split the New York live lane into several source descriptors instead of relying on generic US media discovery. Use targeted queries for Part 161 and AI court filings, hallucinated citations and sanctions, AI-created evidence, privilege/work-product, discovery disputes, AEDT/Local Law 144, NYDFS AI insurance guidance, NY AG enforcement, RAISE Act and state AI bills, NYC public-sector algorithms, biometrics, employment AI, financial services AI, consumer protection, data centers, cloud/compute, and cybersecurity overlap. Prefer domain-restricted NewsAPI queries for high-signal outlets and broad GDELT queries for recall.

Freshness and Priority:
- High-priority New York media lanes target every 5 minutes when infrastructure allows, with hourly fallback.
- Broad GDELT can run hourly or daily depending on rate limits.
- Official New York confirmation lanes stay on their current safer cadence, except official feeds/API sources that are already live-ready.
- Runtime health should distinguish official New York authority lanes from media-discovery lanes, so noisy press discovery never masks court/agency/source failures.

Publication Rules:
- Press, law-firm, and API-discovered articles are discovery-only unless an existing publication rule explicitly allows them as news items.
- No press or commentary item can create or upgrade a legal database entry to verified authority without an official URL, CourtListener/court source, agency source, legislature source, or manual review.
- Store enough metadata to trace the lead: title, publisher, URL, published date, query/source family, matched legal topics, and suggested official follow-up source.
- Paywalled or restricted outlets may contribute metadata leads only; do not scrape or reproduce protected article text.

Implementation Scope:
- Extend `src/agents/ai-regulation/usMonitoringAgentDefinitions.ts` with New York-specific aggressive media descriptors.
- Extend `src/db/seed/ai-regulation-seed.ts` and `src/content/ai-regulation/news-sources.ts` with matching active New York discovery sources.
- Update New York tests so the New York watch includes media discovery lanes while official/court/agency sources remain identifiable as authority sources.
- Add or update tests proving source IDs, source categories, discovery-only wording, metadata-only/manual-review flags, official/media separation, and currentness posture.
- Add an operator note for required credentials and runtime limits: `NEWSAPI_API_KEY` improves speed; GDELT remains the keyless fallback; CourtListener remains the litigation authority/discovery bridge; paywalled sources are metadata/manual-review only.

Out of Scope:
- No changes to Claude-owned Standards UI files.
- No automatic legal conclusion from journalism, law-firm alerts, or commentary.
- No bulk article scraping from paywalled or rights-restricted publishers.
- No guarantee of true real-time coverage if the deployment scheduler cannot run at five-minute cadence.
- No expansion to all US states in this spec; New York is the state/city/federal-litigation model.

Testing:
- New York watch tests prove all new media lanes are live-eligible, discovery-only, not baseline/verification authority, and mapped to fresh/watch/stale thresholds.
- Seed tests prove every new New York media source is active, API-based, non-official/discovery-only, metadata-only, manual-review-required, and explicitly says it is never legal authority without official-source confirmation.
- News source tests prove public source metadata exists for each lane with non-official reliability and never-authority wording.
- Full verification after implementation: targeted New York tests, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` with complete local production-guard environment variables.
