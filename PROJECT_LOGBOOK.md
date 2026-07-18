# Project Logbook

Multi-agent project. Always update this file after meaningful changes. Include: what changed, files changed, commands run, verification results, limitations, next steps.

**Rule**: when this file exceeds ~500 lines, compress older phases into one-liner summaries in the Phase Index below.

---

## PHASE INDEX (compressed)

| Date | Phase | Summary |
|------|-------|---------|
| 2026-07-16 | International monitoring backend | Added International monitoring profiles, supervisor integration, central scheduler coverage, and official UNESCO/UN/WIPO/IEEE plus international NewsAPI/GDELT sources |
| 2026-07-17 | EUR-Lex webservice readiness | Added optional official EUR-Lex SOAP connector, capability reporting, seed/migration activation for `src-eur-lex-ai`, env docs, and tests; credentials must live only in Vercel/Railway env |
| 2026-07-18 | EUR-Lex legal-database quality | Hardened EUR-Lex SOAP extraction with title cleanup, CELEX/CELLAR/date/form metadata, AI/legal filtering, and authority/legal-area/development hints for cleaner official EU database promotion |
| 2026-07-16 | International AI hub | Added `/ai-regulation/international`, linked it from the main AI regulation overview and database-region cards, and exposed the route in sitemap/smoke coverage |
| 2026-07-16 | International standards coverage | Added an international standards baseline for the public Standards page, including ISO/IEC AI standards, OECD AI Principles, UNESCO AI Ethics Recommendation, and IEEE 7000, with non-binding/incorporation caveats and tests |
| 2026-07-16 | Judilibre OAuth fallback | Judilibre can now use either a direct `JUDILIBRE_API_KEYID` or the configured PISTE OAuth client credentials already used for Legifrance; runtime verification and capability reporting understand both modes |
| 2026-07-16 | PISTE sandbox fallback | Live scan proof showed the configured PISTE app is sandbox; Legifrance/Judilibre now retry sandbox OAuth and automatically call `sandbox-api.piste.gouv.fr` when needed |
| 2026-07-16 | CourtListener readiness | Added operator-friendly `COURTLISTENER_API_TOKEN` alias, runtime probe coverage, and `src-us-courtlistener-ai` migration/seed source for U.S. AI case-law discovery once the token is configured |
| 2026-07-15 | LOCUS U.S. local-law discovery prep | Added optional LOCUS-v1 policy/helper for U.S. local AI-law discovery leads only; LOCUS remains non-official, admin-only, non-public, and cannot create legal database items without official municipal/county verification |
| early 2025 | Foundation Hardening 1–12 | Core persistence (Supabase), seed-backed memory mode, admin auth, review workflow, scan pipeline, deduplication, basic public/admin routes |
| 2025 | Phase 2 | Supabase persistence upgrade, production hardening |
| 2025 | Phase 2.5 | Production hardening, error handling |
| 2025 | Phase 3 | Live Supabase verification prep |
| 2025 | Phase 4 | Connector hardening, extraction quality |
| 2025 | Phase 4.5 | Admin source diagnostics and observability |
| 2025 | Phase 5 | Official source coverage expansion (EU AI Office, EDPB, CNIL, ICO, NIST, FTC, etc.) |
| 2025-05-25 | Phase 5.5 | Source-by-source parser tuning; dedicated parsers for EDPB, NIST, CFPB, SEC, NYDFS, ICO |
| 2025-05-25 | Phase 6A | AI ranking + cost guardrails layer (AI processing still disabled by default) |
| 2025-05-25 | Phase 6B | Controlled OpenAI processing module added (disabled by default) |
| 2025 | Phase 6C/6D | Live OpenAI smoke test + admin review polish |
| 2025 | Phase 7 | EUR-Lex parser, soft law/standards taxonomy |
| 2025 | Phase 8–8.7 | Public site shell, brand, profile photo, minimalist redesign, liquid glass hero |
| 2025 | Phase 9 | Research/notes architecture; "Notes & Commentary" reframing |
| 2025 | Phase 11 | Deployment readiness |
| 2025 | Phase 12 | Europe/US hub separation, EU verification layer |
| 2025 | Phase 13 | Europe country-profile enrichment foundation |
| 2025 | Europe deep pass | First verified CJEU layer; France/Spain/Italy/Germany/Netherlands country profiles |
| 2025 | France monitoring | France live monitoring loop (CNIL RSS, Judilibre, NewsAPI, GDELT, Legifrance) |
| 2025 | Spain monitoring | Spain live monitoring loop (AEPD, AESIA, BOE, La Moncloa) |
| 2025 | US baseline | Federal + 50-state AI law baseline, US map, case-law source architecture |
| 2025 | EU legal news | EU legal news agent, EU official RSS feeds, EU discovery APIs |
| 2025 | Data steward | Data quality, freshness, coverage diagnostics, data governance dashboard |
| 2025 | AI Law News | News items layer, news sources, persisted news_items table, public /news feed |
| 2025 | Citations | Precise citation layer, publication eligibility guardrail, citation quality statuses |
| 2025 | Pagination | Server-side pagination for all major list surfaces |
| 2025 | NY Courts | Part 161 regression harness; NY Courts official source coverage |
| 2025 | Germany monitoring | Germany live monitoring loop (BfDI, Federal Government, Bundestag) |
| 2025 | Italy monitoring | Italy live monitoring loop (Garante, AgID, Normattiva, DTD) |
| 2026-06-04 | Public UX QA | Live panel zero-states fixed; mobile hero clipping fixed; admin source diagnostics index added; branded 401 screen |
| 2026-06-04 | Phase A | HTTP security headers, timingSafeEqual admin auth, error.tsx boundaries, rate limiter docs, DE/IT/ES cron routes |
| 2026-06-04 | Phase B | listDistinctFilterValues replacing unbounded collectOptions; initial verification metadata in createRawItem |
| 2026-06-04 | Phase C+D | TraceabilityMetadata typed interface; finalizeSourceScan extracted; data-driven verificationFilter in scanProfiles; 19 integration tests |
| 2026-06-04 | Phase E+F | IntelligenceSummaryBand; EmptyFilterState; migrations 006+007; AI_PROCESSING_ENABLED deprecation; Upstash Redis rate limiter prep |
| 2026-06-05 | Improvements A/B/C/D/E | Deferred interim DB write (B2); scan orchestrator refactor — scanSourcesForCandidates + processAllCandidates (C1); admin page → 4 sub-components (C4); 9 integration tests (D1); 008_review_transition_rpc.sql atomic RPC (D2) |
| 2026-06-05 | Platform Redesign P/Q-series | Hub restructure; compact news card; region portal; US timeline component; legal badges; breadcrumb nav; live panels first on all hub pages |
| 2026-06-05 | R-series polish | Item detail dark→light rewrite; ImplementationProgressBar; FilterBar active chips with individual removal |
| 2026-06-05 | S-series platform | Sitemap all 27 EU + 51 US pages; stub verification callout on country pages; Upstash rate limiter wiring on scan route |
| 2026-06-05 | Inter-agent coordination | AGENT_COORDINATION.md created; multi-agent protocol + logbook discipline + inter-agent comment conventions |
| 2026-06-05 | Discovery leads backend (F2) | AiRegulationRepository extended with 5 discovery_leads methods; memory + Supabase + mappers + tests |
| 2026-06-05 | P-C1: Discovery leads adoption | Admin diagnostics, steward, news, detail pages prefer dedicated discovery_leads table; legacy fallback preserved |
| 2026-06-05 | T-T1/T-U1: Discovery leads admin | AdminCoveragePanel: status workflow badges + action buttons; updateDiscoveryLeadStatus server action |
| 2026-06-06 | P-C2: Discovery leads pagination | Source-scoped loading; direct lookup by rawItemId; lazy fallback; PaginationControls with pageParamKey on admin coverage panel |
| 2026-06-06 | P-C3: Scan job durability (T-C3A–J) | queueAndDrainScanJob, tryStartScanJob + lease heartbeat, blockedByRunningJobs guard, drainQueuedScanJobs, processScanJob safety entrypoint, scan:worker-local local worker, admin-trigger harmonization — cooperative serial model only; NOT yet a detached distributed worker or fully atomic distributed lock |
| 2026-06-06 | T-C3B + F5 | Admin scan-job: color badges + recoverStaleJobs + drainNextQueuedJob server actions; Poland, Sweden, Ireland first-wave profiles |
| 2026-06-06 | T-NL1 Netherlands monitoring | Full monitoring stack: AP + RDI primary; netherlands_official_legal_scan/live_news_scan/verification_scan; cron route; page sections; 331 tests |
| 2026-06-06 | T-BE1 Belgium monitoring | Full monitoring stack: APD/GBA primary; 3 scan profiles + cron route + page sections; federal structure gap documented; 336 tests |
| 2026-06-06 | T-C4A runtime traceability | queue-drain and scan/cron responses now expose structured blocker ownership summaries (`leaseOwner`, heartbeat, running age, trigger/source/requestedBy) in addition to ID-only compatibility fields |
| 2026-06-08 | T-C4B local worker service hardening | `scan:worker-local` now uses a single-worker lease, persisted status/heartbeat files, graceful stop handling, and `scan:worker-stop`; still local-process only, not a detached distributed worker |
| 2026-06-08 | T-C4C cursor-pagination primitives | Cursor-page repository/server primitives added for `scan_jobs` and `discovery_leads`; `/ai-regulation` database view aligned to cursor controls; partial `F1` only, broader pagination migration still open |
| 2026-06-08 | T-C4D country_intelligence storage groundwork | Repository, mappers, seed-backed fallback, and wrappers added for normalized `country_intelligence` + `country_intelligence_sources`; partial `F8` only, pages still read the TS profile layer |
| 2026-06-06 | T-SE1 Sweden monitoring | Full monitoring stack: IMY (primary, 5-min) + DIGG + Regeringen (daily) + NewsAPI/GDELT (discovery); swedenImy upgraded to candidate_for_monitoring; cron route; page sections; 348 tests |
| 2026-06-08 | T-F1 Cursor pagination | Keyset (cursor-based) pagination on public monitor surfaces; `CursorPosition`, `encodeCursor/decodeCursor`, `CursorPaginationControls`; two repo methods each in memory + Supabase repos; `after`/`dbafter` URL params; 358 tests |
| 2026-06-08 | T-IE1 Ireland monitoring | Ireland is the 9th first-wave EU country with a full live monitoring stack; DPC as primary anchor (EDPB member, lead SA for Big Tech EU establishments); 3 scan profiles + cron route + page sections; 363 tests |
| 2026-06-08 | F7 migration 008 | `008_review_transition_rpc.sql` applied to remote Supabase via SQL Editor — `transition_review_status` RPC now live |
| 2026-06-08 | F8A country_intelligence seed | `scripts/seed-country-intelligence.ts` created; `seed-supabase.ts` extended; migration 006 applied + authority_type constraint broadened (added soft_law/case_law_source/guidance_source); 27 profiles + 77 sources upserted to remote Supabase |
| 2026-06-08 | T-ING1 Firecrawl + Scrapling ingestion pipeline | Dual ingestion engine: Firecrawl (Node.js SDK, broad discovery) + Scrapling Python sidecar worker (targeted official sources) + hybrid mode; dedup (URL normalization + SHA-256 content hash); AI classify → admin review → never auto-publish; INGESTION_SECRET-protected `/api/ingestion/run`; migration 009 applied to Supabase; 8 sources seeded; 384 tests |
| 2026-06-09 | Production deployment | GitHub CorentinSG/CSG-AI-law (private); Vercel csg-ai-law.vercel.app; Framework Preset: Next.js (corrected from "Other"); env vars: APP_DATA_MODE=supabase, Supabase URL/keys, ADMIN_AUTH_SECRET, CRON_SECRET, INGESTION_SECRET, FIRECRAWL_API_KEY, AI_ENABLE_PROCESSING=false; migration 009 applied; 8 ingestion sources seeded |
| 2026-06-09 | F8B country profile admin editor + public override | Admin editor `/admin/ai-regulation/countries` (+`[slug]` form, `saveCountryProfileEditorial` action, 4 tests) edits country_intelligence editorial fields (publicSummary, implementationNotes, editorialNotes, missingSourceWarnings, reviewStatus, reviewedBy); public country page overrides publicSummary/editorialNotes/missingSourceWarnings from DB when present, TS baseline otherwise; structural content unchanged; 388 tests |
| 2026-06-09 | F8C-1 source lists from DB | Public country page renders the 3 source families from `country_intelligence_sources` (helper `groupCountryIntelligenceSourcesByFamily` + 4 tests; groups by authorityType, sorts by source-id index, strips family note prefix), per-family TS fallback; no schema change; deterministic id fetch in existing Promise.all; 392 tests |
| 2026-06-10 | F8C-2 admin source CRUD | Country `[slug]` editor gains add/update/remove of official sources (`addCountrySource`/`updateCountrySource`/`removeCountrySource` on `replaceCountryIntelligenceSources`, 5 tests); two server actions per row via `formAction`; new ids `country-source-<slug>-custom-<n>`; sources now live-editable. Build gotcha fixed: `'use server'` files export async only. 397 tests |
| 2026-06-10 | Coordination efficiency protocol | `AGENT_COORDINATION.md` now includes a token-efficiency layer: agents must read board/log/comments before writing, keep inter-agent notes compact and task-scoped, and update shared coordination state only on claim, overlap, blocker, handoff, or completion |
| 2026-06-10 | T-RT0B P-RT0 cron coverage | Added NL/BE/AT/SE/IE crons to `vercel.json` (10 daily crons, 12:00–16:30, 30-min stagger). Ingestion cron deferred (route auth out of `vercel.json only` scope). Hobby plan may cap cron count |
| 2026-06-10 | T-RT0C P-RT0 public-page ISR | 5 public `/ai-regulation/*` + `/standards` pages → `revalidate=300` (ISR); hub + `[id]` kept dynamic (searchParams / unpublish-immediacy, both documented inline). Build-verified render modes; 397 tests |
| 2026-06-10 | T-RT1C admin freshness dashboard | `AdminFreshnessPanel` + pure `summarizeRuntimeHealth` (3 tests) on the main admin page: per-source SLO badges (stale/degraded/healthy/inactive), stale+degraded attention list, high-priority-at-risk note; consumes T-RT1A `getSourceRuntimeHealthSummaries()` (UI only, no logic duplication). 405 tests |
| 2026-06-10 | T-RT5A F8C-3 data layer | Migration 010 adds 8 structural columns to `country_intelligence` (implementation_measures + competent/market-surveillance/notifying authorities + relevant_ministries as text[]; 3 category notes as text); extended `CountryIntelligence` type, both supabase mappers, seed mapper, and `saveCountryProfileEditorial` pass-through. USER must apply 010 + reseed before deploy (insert now writes new columns). Build ✓ 405 tests. Next: F8C-3b page reads, F8C-3c structural editing |
| 2026-06-10 | F8C-3b page reads structural fields | Migration 010 applied + reseeded; country page renders implementation measures, competent/market-surveillance/notifying authorities, and the 3 category notes from `country_intelligence` (per-field TS fallback). `latestRelevantUpdates` jsonb deferred. Build ✓ 414 tests |
| 2026-06-10 | F8C-3c structural fields editable | Country `[slug]` admin editor edits the structural content (authorities, measures, ministries, 3 category notes); `saveCountryProfileEditorial` reads them from the form (blank → TS baseline). F8C effectively complete — only `latestRelevantUpdates` jsonb + derived status labels remain TS-authoritative. Build ✓ 414 tests |
| 2026-06-11 | F6 activated | `.env.example` tracked + Upstash vars documented; user set `UPSTASH_REDIS_REST_URL`/`_TOKEN` in Vercel + redeployed. Scan route now distributed-rate-limited (5/60s per IP) via Upstash REST, in-memory fallback retained. Code was already wired; activation was config-only |
| 2026-06-10 | T-RT1A runtime source health backend | Added `sourceRuntimeHealth.ts` backend summaries from `source_health_checks`, scan logs, scan jobs, and ingestion logs; cadence-aware thresholds from country registries with scan-frequency fallback; derived `healthy/degraded/stale/inactive` state and consecutive failure counts; 402 tests |
| 2026-06-22 | Async scan infra live | Railway Node 22 worker, Supabase `scan_jobs`, Vercel enqueue-only cron routing, production alias promoted to `ops/t-ops9-ux`, manual queue-to-worker E2E proven |
| 2026-06-10→11 | Admin ops dashboard hardening (2 UI batches) | System-status band (worker idle/active/backlog/broken from `health.worker` + stuck signal, queue depth, sources-at-risk, review backlog), inaccessible-source flagging, batch-review ergonomics (shift-range/quick-select/`priorityReasons`), integrations/env-vars panel (`listAgentApiCapabilities`), news discovery/admin-only signals, system-health strip, research forthcoming section + content-state badges. Tested helpers: `system-status.ts`, `freshness-summary.ts`, `news-source-signal.ts`. 544 tests |
| 2026-06-22 | Doc compression | `PROJECT_LOGBOOK` (1002→~90), `AGENT_COORDINATION` (605→~490; pruned pre-06-10 comments + completed P-C plan), `AI_AGENT_MASTER_CONTEXT` (§8-9 → pointer) compressed to cut token cost. Canonical phase record = this index + git history; no info lost |

---

_Detailed per-phase write-ups were compressed (2026-06-22) to cut token cost. The one-line Phase Index above is the canonical record; full prose for any phase lives in git history (`git log -- PROJECT_LOGBOOK.md` and each phase's commit). Going forward, add new phases as one-liner rows to the index — do not reintroduce long prose blocks here._
