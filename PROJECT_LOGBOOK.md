# Project Logbook

Multi-agent project. Always update this file after meaningful changes. Include: what changed, files changed, commands run, verification results, limitations, next steps.

**Rule**: when this file exceeds ~500 lines, compress older phases into one-liner summaries in the Phase Index below.

---

## PHASE INDEX (compressed)

| Date | Phase | Summary |
|------|-------|---------|
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
| 2026-06-08 | T-ING1 Firecrawl + Scrapling ingestion pipeline | Dual ingestion engine: Firecrawl (Node.js SDK, broad discovery) + Scrapling Python sidecar worker (targeted official sources) + hybrid mode; dedup (URL normalization + SHA-256 content hash); AI classify → admin review → never auto-publish; INGESTION_SECRET-protected `/api/ingestion/run`; migration 009 (pending Supabase apply); 8 seed sources; 384 tests |

---

## Phase: Cursor-based Pagination on Public Monitor Surfaces (T-F1) — Claude Code

**Date**: 2026-06-08  
**Agent**: Claude Code  
**Status**: Completed | 358 tests | lint 0 errors | typecheck clean | build clean

### Problem solved

`page=N` URL params on public monitor surfaces caused: (a) unstable bookmarks/links when new items were inserted above a page boundary, (b) an expensive `COUNT(*)` query on every paginated page load, (c) duplicate/skipped items when live feeds inserted between page fetches.

### Design

- `CursorPosition { date: string; tiebreaker: string }` — opaque keyset cursor
  - `date` = `publicationDate ?? ""` (empty string = null, sorts LAST in DESC NULLS LAST)
  - `tiebreaker` = `createdAt` (regulatory updates) or `detectedAt` (news items)
- base64url encoding: `Buffer.from(JSON.stringify(cursor)).toString("base64url")`
- `limit + 1` fetch trick: fetch one extra item to determine `hasMore` without `COUNT(*)`
- `after` URL param = news tab cursor; `dbafter` = database tab cursor
- Admin surfaces keep offset-based pagination unchanged

### Files changed

```
src/lib/pagination.ts                                        — CursorPosition, encodeCursor, decodeCursor, parseCursorParam, buildCursorHref added
src/lib/pagination.test.ts                                   — 5 new cursor tests (round-trip, null-date, invalid input, array param, buildCursorHref)
src/db/repository-types.ts                                   — ListCursorParams, CursorPagedResult<T>, CursorPosition re-export; two new interface methods
src/db/repositories/memory-repository.ts                    — compareForCursorSort/isAfterCursor helpers; listRegulatoryUpdatesCursorPage; listNewsItemsCursorPage
src/db/repositories/supabase-repository.ts                  — listRegulatoryUpdatesCursorPage (PostgREST .or() cursor filter); listNewsItemsCursorPage (with fallback path)
src/agents/ai-regulation/processors/updateRepository.ts     — listPublicUpdatesCursorPage; getPublicNewsItemsCursorPage facades
src/components/site/pagination-controls.tsx                  — CursorPaginationControls component added (Back to start + Next → with base64url cursor)
src/app/ai-regulation/page.tsx                              — news tab: after cursor; database tab: dbafter cursor; PaginationControls → CursorPaginationControls; stats show X+ when hasMore
```

### Cursor filter logic (Supabase PostgREST)

- Date cursor (cursor.date !== ""): `.or("publication_date.lt.{date},and(publication_date.eq.{date},{tiebreaker_col}.lt.{tiebreaker}),publication_date.is.null")`
- Null cursor (cursor.date === ""): `.is("publication_date", null).lt("{tiebreaker_col}", tiebreaker)`

### Preserved

- Admin surfaces: offset pagination unchanged
- `PaginationControls` component: unchanged, still exported
- Stats IntelligenceSignals: show `X+` when hasMore, exact count when on last page
- FilterBar: unchanged; filter param changes reset to page 1 naturally since `after`/`dbafter` are not preserved by FilterBar links

### Verification

```
npm test          69 files, 358 tests
npm run lint      0 errors
npm run typecheck clean
npm run build     /ai-regulation registered ✓
```

---

## Phase: Austria Live Monitoring Stack (T-AT1) — Claude Code 1

**Date**: 2026-06-06
**Agent**: Claude Code 1
**Status**: Completed | 343 tests | lint | typecheck | build — all clean

Austria is now the seventh first-wave EU country with a full live monitoring stack.

### Files changed

```
src/agents/ai-regulation/austriaNewsSources.ts                 — new
src/agents/ai-regulation/austriaLegalNewsAgent.ts              — new
src/content/ai-regulation/austria-ai-intelligence.ts           — new
src/app/api/cron/ai-regulation-austria-scan/route.ts           — new
src/app/api/cron/ai-regulation-austria-scan/route.test.ts      — new
scripts/run-austria-official-legal-scan.ts                     — new
scripts/run-austria-legal-news-scan.ts                         — new
scripts/run-austria-verification-scan.ts                       — new
src/agents/ai-regulation/scanProfiles.ts                       — Austria profiles added
src/content/ai-regulation/europe-member-state-implementation.ts — Austria sources + first-wave profile
src/app/ai-regulation/europe/[country]/page.tsx                — Austria sections added
package.json                                                   — 3 Austria scripts
```

### What changed

- **`austriaNewsSources.ts`** — 5 sources: DSB Datenschutzbehoerde (official_guidance_feed, high, 5-min cadence, liveMonitoringEligible+baselineEligible); Digital Austria (official_government_implementation, daily); RTR (official_supervision_feed, medium, daily); NewsAPI AT + GDELT AT (discovery only). DSB-NOYB connection documented in scheduler guidance.
- **`austriaLegalNewsAgent.ts`** — `getAustriaLiveLegalIntelligenceData(limit=6)`, `runAustriaLegalNewsAgentScan()`. URL matching for dsb.gv.at, datenschutzbehoerde.gv.at, digital.gv.at, bmdw.gv.at, bmbwf.gv.at, rtr.at. Filters public items via officialSourceFound || official_verified || corroborated || published_news.
- **`austria-ai-intelligence.ts`** — Authority map: DSB (data_protection_authority, officially_supported), Digital Austria (government_implementation, preparing_or_partial), RTR (supervision_authority, needs_full_verification). 2 timeline entries. 5 verification gaps (authority designation, implementation instruments, RTR role, case law, parser depth).
- **`ai-regulation-austria-scan/route.ts`** — GET/POST; getCronAuthStatus + queueAndDrainScanJob with requestedBy:"vercel-cron-austria". Exposes queuedJob/processedJob/queuedJobProcessedImmediately/blockedByRunningJobs.
- **`ai-regulation-austria-scan/route.test.ts`** — 2 tests: auth rejection (401) + default profile (austria_official_legal_scan).
- **`scanProfiles.ts`** — austria_official_legal_scan / austria_live_news_scan / austria_verification_scan profile IDs; austria_official_only / austria_live_only / austria_verification_only sourceStrategy values; getAustriaProfileSourceIds helper; 3 switch cases.
- **`europe-member-state-implementation.ts`** — austriaDsb / austriaDigitalAustria / austriaRtr source records (all with: public:true, runtimeAccessible:null, parserStatus:candidate_for_monitoring or manual_reference, recommendation:manual_review, lastCheckedDate, publicationDate:null, note). Austria EuropeCountryProfile in firstWaveProfiles (implementation_in_progress / low confidence; 6 missingSourceWarnings; 4 editorialNotes). AT added to getPriorityEuropeCountryProfiles().
- **`[country]/page.tsx`** — Austria live monitoring panel + scheduler guidance + authority map + verification gaps + timeline + verified decisions (all conditional on profile.slug === "austria").
- **`package.json`** — scan:austria-official-legal, scan:austria-legal-news, scan:austria-verification.

### Verification

```
npm test          67 files, 343 tests
npm run lint      0 errors, 0 warnings
npm run typecheck clean
npm run build     compiled + /api/cron/ai-regulation-austria-scan registered
```

### Austria rules preserved

- DSB is primary live source (high priority, 5-min cadence architecture); Digital Austria and RTR are daily, non-real-time
- NewsAPI and GDELT are discovery-only; never legal authority
- RTR role under AI Act = needs_full_verification; do not claim RTR has market-surveillance authority without a verified binding instrument
- DSB-NOYB link documented in scheduler guidance; not used to infer enforcement outcomes or claim specific decisions
- No Austria enforcement decisions, case law, or binding designation instruments were added
- implementationStatus: implementation_in_progress / implementationConfidence: low — not overclaimed
- Do not describe the Austria layer as exhaustive
 
---

## Phase: Runtime Blocker Ownership Traceability (T-C4A) â€” Codex 1

**Date**: 2026-06-06  
**Agent**: Codex 1  
**Status**: Completed | targeted tests + typecheck + lint + build clean

### What changed

- `scanJobs.ts` now emits structured `blockingRunningJobSummaries` whenever a healthy running scan job is standing in front of queue-drain execution.
- Each blocker summary includes `jobId`, `sourceId`, `trigger`, `requestedBy`, `leaseOwner`, `startedAt`, `heartbeatAt`, `runningForMs`, `heartbeatAgeMs`, `heartbeatTimeoutMs`, and `blockedReason`.
- Manual scan and cron route responses now expose this structured field alongside the older `blockedByRunningJobs` ID list for compatibility.

### Files changed

`src/agents/ai-regulation/processors/scanJobs.ts`  
`src/agents/ai-regulation/processors/scanJobs.test.ts`  
`src/app/api/ai-regulation/scan/route.ts`  
`src/app/api/ai-regulation/scan/route.test.ts`  
`src/app/api/cron/ai-regulation-scan/route.ts`  
`src/app/api/cron/ai-regulation-scan/route.test.ts`  
`src/app/api/cron/ai-regulation-france-scan/route.ts`  
`src/app/api/cron/ai-regulation-germany-scan/route.ts`  
`src/app/api/cron/ai-regulation-italy-scan/route.ts`  
`src/app/api/cron/ai-regulation-spain-scan/route.ts`  
`src/app/api/cron/ai-regulation-netherlands-scan/route.ts`  
`src/app/api/cron/ai-regulation-belgium-scan/route.ts`  
`src/app/api/cron/ai-regulation-austria-scan/route.ts`

### Verification

`npm test -- src\\agents\\ai-regulation\\processors\\scanJobs.test.ts src\\app\\api\\ai-regulation\\scan\\route.test.ts src\\app\\api\\cron\\ai-regulation-scan\\route.test.ts`  
`npm run typecheck`  
`npm run lint`  
`npm run build`

### Limitations

- This improves operational explainability, not locking strength.
- The runtime is still a cooperative serial model, not a detached distributed worker or fully distributed lock.

### Next step

- Continue the remaining backend continuation plan with a stronger worker/service model or more formal lease/runtime service boundaries.

---

## Phase: Local Worker Service Hardening (T-C4B) â€” Codex 1

**Date**: 2026-06-08  
**Agent**: Codex 1  
**Status**: Completed | targeted tests + live worker run + stop-script run + typecheck + lint + build clean

### What changed

- Extracted worker runtime primitives into a dedicated helper: single-worker lease acquisition, stale-lease takeover, status-file writes, stop-file requests, and lease heartbeat refresh.
- Upgraded `scan:worker-local` to:
  - acquire a singleton lease before starting
  - persist worker state/heartbeat under `.runtime/scan-worker`
  - refresh lease/status while running
  - stop gracefully on `SIGINT`, `SIGTERM`, or stop-file detection
- Added `scan:worker-stop` to request a soft shutdown via stop file.

### Files changed

`src/agents/ai-regulation/processors/scanWorkerRuntime.ts`  
`src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts`  
`scripts/run-scan-job-worker.ts`  
`scripts/run-scan-job-worker-stop.ts`  
`package.json`

### Verification

`npm test -- src\\agents\\ai-regulation\\processors\\scanWorkerRuntime.test.ts src\\agents\\ai-regulation\\processors\\scanJobs.test.ts`  
`$env:SCAN_JOB_WORKER_STATE_DIR='.runtime/test-worker'; $env:SCAN_JOB_WORKER_IDLE_EXIT_AFTER='1'; $env:SCAN_JOB_WORKER_POLL_MS='1'; npm run scan:worker-local`  
`$env:SCAN_JOB_WORKER_STATE_DIR='.runtime/test-worker'; npm run scan:worker-stop`  
`npm run typecheck`  
`npm run lint`  
`npm run build`

### Limitations

- This is a more formal local service model, but still not a detached distributed worker.
- Lease/state coordination is file-based for the always-on machine, not a cross-host distributed lock.

### Next step

- Move to the next backend continuation slice: pagination `F1` on the highest-volume server surfaces or the first extraction pass for `F8`.

---

## Phase: Sweden Live Monitoring Stack (T-SE1) — Claude Code 1

**Date**: 2026-06-06
**Agent**: Claude Code 1
**Status**: Completed | 348 tests | lint | typecheck | build — all clean

Sweden is now the eighth first-wave EU country with a full live monitoring stack.

### Files changed

```
src/agents/ai-regulation/swedenNewsSources.ts                  — new
src/agents/ai-regulation/swedenLegalNewsAgent.ts               — new
src/content/ai-regulation/sweden-ai-intelligence.ts            — new
src/app/api/cron/ai-regulation-sweden-scan/route.ts            — new
src/app/api/cron/ai-regulation-sweden-scan/route.test.ts       — new
scripts/run-sweden-official-legal-scan.ts                      — new
scripts/run-sweden-legal-news-scan.ts                          — new
scripts/run-sweden-verification-scan.ts                        — new
src/agents/ai-regulation/scanProfiles.ts                       — Sweden profiles added
src/content/ai-regulation/europe-member-state-implementation.ts — swedenImy upgraded + swedenRegeringen added + Sweden profile updated
src/app/ai-regulation/europe/[country]/page.tsx                — Sweden sections added
package.json                                                   — 3 Sweden scripts
```

### What changed

- **`swedenNewsSources.ts`** — 5 sources: IMY (official_guidance_feed, high, 5-min cadence, liveMonitoringEligible+baselineEligible); DIGG (official_government_implementation, daily); Regeringen (official_government_implementation, medium, daily); NewsAPI SE + GDELT SE (discovery only). IMY ChatGPT investigation participation documented in scheduler guidance.
- **`swedenLegalNewsAgent.ts`** — `getSwedenLiveLegalIntelligenceData(limit=6)`, `runSwedenLegalNewsAgentScan()`. URL matching for imy.se, digg.se, regeringen.se, riksdagen.se, government.se. Filters public items via officialSourceFound || official_verified || corroborated || published_news.
- **`sweden-ai-intelligence.ts`** — Authority map: IMY (data_protection_authority, officially_supported), DIGG (government_implementation, preparing_or_partial), Regeringen (government_implementation, preparing_or_partial). 2 timeline entries. 5 verification gaps (authority designation, implementation instruments, DIGG role, case law, parser depth).
- **`ai-regulation-sweden-scan/route.ts`** — GET/POST; getCronAuthStatus + queueAndDrainScanJob with requestedBy:"vercel-cron-sweden". Exposes queuedJob/processedJob/queuedJobProcessedImmediately/blockedByRunningJobs.
- **`ai-regulation-sweden-scan/route.test.ts`** — 2 tests: auth rejection (401) + default profile (sweden_official_legal_scan).
- **`scanProfiles.ts`** — sweden_official_legal_scan / sweden_live_news_scan / sweden_verification_scan profile IDs; sweden_official_only / sweden_live_only / sweden_verification_only sourceStrategy values; getSwedenProfileSourceIds helper; 3 switch cases.
- **`europe-member-state-implementation.ts`** — swedenImy upgraded to candidate_for_monitoring + publicationDate:null added; swedenDigg publicationDate:null added; swedenRegeringen new source (manual_reference); Sweden profile updated with 3 sources in nationalAIRegulationSources/officialSourceUrls/sourceReferences; editorial notes updated to mention IMY ChatGPT investigation.
- **`[country]/page.tsx`** — Sweden live monitoring panel + scheduler guidance + authority map + verification gaps + timeline + verified decisions (all conditional on profile.slug === "sweden").
- **`package.json`** — scan:sweden-official-legal, scan:sweden-legal-news, scan:sweden-verification.

### Verification

```
npm test          68 files, 348 tests
npm run lint      0 errors, 0 warnings
npm run typecheck clean
npm run build     compiled + /api/cron/ai-regulation-sweden-scan registered
```

### Sweden rules preserved

- IMY is primary live source (high priority, 5-min cadence architecture); DIGG and Regeringen are daily, non-real-time
- NewsAPI and GDELT are discovery-only; never legal authority
- IMY ChatGPT investigation participation documented in scheduler guidance; not used to infer enforcement outcomes or claim specific decisions
- DIGG role under AI Act = preparing_or_partial; do not claim DIGG has market-surveillance authority without a verified binding instrument
- No Sweden enforcement decisions, case law, or binding designation instruments were added
- implementationStatus: implementation_in_progress / implementationConfidence: low — not overclaimed
- Do not describe the Sweden layer as exhaustive

---

## Phase: Cursor Pagination Primitives on Heavy Backend Surfaces (T-C4C) â€” Codex 1

**Date**: 2026-06-08  
**Agent**: Codex 1  
**Status**: Completed | targeted repository tests + typecheck + lint + build clean

### What changed

- Added cursor-pagination repository contracts for `scan_jobs` and `discovery_leads`.
- Implemented those cursor pages in both memory and Supabase repositories using stable `createdAt + id` ordering/tiebreaking.
- Exposed narrow `updateRepository` wrappers so higher layers can adopt cursor pages without reaching into repository internals directly.
- Fixed `/ai-regulation` to use `CursorPaginationControls` consistently on the database view, removing the mixed old page-number usage that was breaking global typecheck/lint/build.

### Files changed

`src/db/repository-types.ts`  
`src/db/repositories/memory-repository.ts`  
`src/db/repositories/supabase-repository.ts`  
`src/agents/ai-regulation/processors/updateRepository.ts`  
`src/db/repositories/memory-repository.test.ts`  
`src/db/repositories/supabase-repository.test.ts`  
`src/app/ai-regulation/page.tsx`

### Verification

`npm test -- src\\db\\repositories\\memory-repository.test.ts src\\db\\repositories\\supabase-repository.test.ts`  
`npm run typecheck`  
`npm run lint`  
`npm run build`

### Limitations

- This is a partial `F1` step, not a full pagination migration.
- Many admin/server surfaces still use offset/page-number pagination.
- Cursor pagination is now stronger on key heavy backend surfaces, but broader adoption remains open.

### Next step

- Continue `F1` on the next highest-volume consumers, or switch to `F8` if the Europe baseline monolith becomes the more urgent risk.

---

## Phase: Normalized Country Intelligence Storage Groundwork (T-C4D) â€” Codex 1

**Date**: 2026-06-08  
**Agent**: Codex 1  
**Status**: Completed | targeted seed/repository tests + typecheck + lint + build clean

### What changed

- Added normalized repository contracts for `country_intelligence` and `country_intelligence_sources`.
- Added a Europe-derived seed adapter that maps the current `EuropeCountryProfile` layer into normalized `country_intelligence` records and source rows.
- Added memory-store support and Supabase mappers/insert helpers for the new storage layer.
- Added Supabase repository methods with safe fallback to the derived seed-backed layer when the remote tables are unavailable.
- Exposed `updateRepository` wrappers so future extraction slices can read/write normalized country intelligence without reaching into repository internals.

### Files changed

`src/db/repository-types.ts`  
`src/db/seed/country-intelligence-seed.ts`  
`src/db/seed/seed-profiles.ts`  
`src/db/seed/seed-profiles.test.ts`  
`src/db/mock-store.ts`  
`src/db/supabase-mappers.ts`  
`src/db/repositories/memory-repository.ts`  
`src/db/repositories/memory-repository.test.ts`  
`src/db/repositories/supabase-repository.ts`  
`src/db/repositories/supabase-repository.test.ts`  
`src/agents/ai-regulation/processors/updateRepository.ts`

### Verification

`npm test -- src\\db\\seed\\seed-profiles.test.ts src\\db\\repositories\\memory-repository.test.ts src\\db\\repositories\\supabase-repository.test.ts`  
`npm run typecheck`  
`npm run lint`  
`npm run build`

### Limitations

- This is a first `F8` extraction slice, not a full migration away from `europe-member-state-implementation.ts`.
- Public/admin country pages still read the TypeScript profile layer directly.
- No remote backfill script has been run yet; this adds storage contracts and seed-backed fallback, not full durable population of remote Supabase.

### Next step

- Start rerouting the highest-value read surfaces to prefer normalized `country_intelligence`, or add a dedicated sync/backfill path before broader page migration.

---

## Phase: Ireland Live Monitoring Stack (T-IE1) — Claude Code

**Date**: 2026-06-08  
**Agent**: Claude Code  
**Status**: Completed | 363 tests | lint 0 errors | typecheck clean | build clean

Ireland is now the 9th first-wave EU country with a full live monitoring stack.

### Files changed

```
src/agents/ai-regulation/irelandNewsSources.ts                 — new
src/agents/ai-regulation/irelandLegalNewsAgent.ts              — new
src/content/ai-regulation/ireland-ai-intelligence.ts           — new
src/app/api/cron/ai-regulation-ireland-scan/route.ts           — new
src/app/api/cron/ai-regulation-ireland-scan/route.test.ts      — new
scripts/run-ireland-official-legal-scan.ts                     — new
scripts/run-ireland-legal-news-scan.ts                         — new
scripts/run-ireland-verification-scan.ts                       — new
src/agents/ai-regulation/scanProfiles.ts                       — Ireland profiles added
src/content/ai-regulation/europe-member-state-implementation.ts — irelandDpc upgraded + irelandGov added + Ireland profile updated
src/app/ai-regulation/europe/[country]/page.tsx                — Ireland sections added
package.json                                                   — 3 Ireland scripts
```

### What changed

- **`irelandNewsSources.ts`** — 5 sources: DPC (official_guidance_feed, high, 5-min cadence, liveMonitoringEligible+baselineEligible); DETE (official_government_implementation, daily); gov.ie (official_government_implementation, low, daily); NewsAPI IE + GDELT IE (discovery only). DPC's role as lead SA for Meta/Google/Apple/LinkedIn/Microsoft EU establishments documented in scheduler guidance.
- **`irelandLegalNewsAgent.ts`** — `getIrelandLiveLegalIntelligenceData(limit=6)`, `runIrelandLegalNewsAgentScan()`. URL matching for dataprotection.ie, enterprise.gov.ie, gov.ie, oireachtas.ie. Filters public items via officialSourceFound || official_verified || corroborated || published_news.
- **`ireland-ai-intelligence.ts`** — Authority map: DPC (data_protection_authority, officially_supported), DETE (government_implementation, preparing_or_partial). 2 timeline entries (DPC as lead SA for Big Tech 2023, Ireland AI Strategy/DETE 2021). 5 verification gaps (authority designation, implementation instruments, DPC AI Act role, case law, parser depth).
- **`ai-regulation-ireland-scan/route.ts`** — GET/POST; getCronAuthStatus + queueAndDrainScanJob with requestedBy:"vercel-cron-ireland". Default profile: ireland_official_legal_scan. Exposes queuedJob/processedJob/queuedJobProcessedImmediately/blockedByRunningJobs.
- **`ai-regulation-ireland-scan/route.test.ts`** — 2 tests: auth rejection (401) + default profile (ireland_official_legal_scan).
- **`scanProfiles.ts`** — ireland_official_legal_scan / ireland_live_news_scan / ireland_verification_scan profile IDs; ireland_official_only / ireland_live_only / ireland_verification_only sourceStrategy values; getIrelandProfileSourceIds helper; 3 switch cases.
- **`europe-member-state-implementation.ts`** — irelandDpc upgraded to candidate_for_monitoring + publicationDate:null added + note expanded (DPC as lead SA for Big Tech EU establishments); irelandEnterpriseDept publicationDate:null added + note updated; irelandGov new source (gov.ie, manual_reference); Ireland profile updated with 3 sources in nationalAIRegulationSources/officialSourceUrls/sourceReferences; editorialNotes updated to mention full live monitoring; publicSummary updated.
- **`[country]/page.tsx`** — Ireland live monitoring panel + scheduler guidance + authority map + verification gaps + timeline + verified decisions (all conditional on profile.slug === "ireland").
- **`package.json`** — scan:ireland-official-legal, scan:ireland-legal-news, scan:ireland-verification.

### Verification

```
npm test          70 files, 363 tests
npm run lint      0 errors, 0 warnings
npm run typecheck clean
npm run build     compiled + /api/cron/ai-regulation-ireland-scan registered
```

### Ireland rules preserved

- DPC is the primary live source (high priority, 5-min cadence architecture); DETE and gov.ie are daily, non-real-time
- NewsAPI and GDELT are discovery-only; never legal authority
- DPC's role as lead SA for Big Tech documented in scheduler guidance; not used to infer enforcement outcomes or claim specific decisions
- DPC AI Act role is explicitly marked needs_full_verification; no claim that DPC has binding AI Act designation without a verified instrument
- No Ireland enforcement decisions, case law, or binding designation instruments were added
- implementationStatus: implementation_in_progress / implementationConfidence: low — not overclaimed
- Do not describe the Ireland layer as exhaustive

---

## Phase: Firecrawl + Scrapling Dual Ingestion Pipeline (T-ING1) — Claude Code

**Date**: 2026-06-08  
**Agent**: Claude Code  
**Status**: Completed | 384 tests | lint 0 errors | typecheck clean | build clean

### What this does

Adds a second ingestion track independent from the existing cron/scan pipeline. Sources registered with `ingestion_method = firecrawl | scrapling | hybrid` are processed by the new engine. Everything lands in `raw_regulatory_items` with `status=new`, then flows through AI classification → admin review queue. Nothing is auto-published.

### Architecture

```
Source Registry (regulation_sources with ingestion_method field)
      │
      ▼
POST /api/ingestion/run  (INGESTION_SECRET bearer token)
      │
      ▼
ingestionOrchestrator.ts
  ├── firecrawl  → crawlSource() via @mendable/firecrawl-js
  ├── scrapling  → scraplingExtract() → HTTP → scrapling_worker/ (Python)
  └── hybrid     → mapSource() [Firecrawl] → scraplingExtract() each URL [Scrapling]
      │
      ▼
deduplication.ts  (URL normalization + SHA-256 content hash)
      │
      ▼
raw_regulatory_items  status=new
      │
      ▼
AI classification  (existing classifier, no OpenAI by default)
      │
      ▼
Admin review queue  →  approved  →  published  (never auto-published)
```

### Files created

```
src/db/migrations/009_ingestion_pipeline.sql    — extends regulation_sources + raw_regulatory_items; new ingestion_logs table
src/agents/ingestion/types.ts                   — IngestionMethod, NormalizedDocument, IngestionLogInput/IngestionLog, etc.
src/agents/ingestion/deduplication.ts           — normalizeUrl, computeContentHash (sha256)
src/agents/ingestion/firecrawlService.ts        — scrapeUrl, crawlSource, mapSource via @mendable/firecrawl-js
src/agents/ingestion/scraplingClient.ts         — HTTP client to Python worker (/extract, /health)
src/agents/ingestion/ingestionOrchestrator.ts   — routing, dedup, insertIfNotDuplicate, runSourceIngestion, runAllActiveSourceIngestion
src/agents/ingestion/ingestionClassifier.ts     — delegates to existing aiClassifier
src/agents/ingestion/seedSources.ts             — 8 seed sources (EU AI Office, EC, EP, EDPB, NY Courts, CPPA, CO AG, FTC)
src/agents/ingestion/ingestion.test.ts          — 21 tests (URL normalization, hash dedup, repo methods, status transitions)
src/app/api/ingestion/run/route.ts              — GET/POST; timingSafeEqual INGESTION_SECRET check; methods + sourceId params
scrapling_worker/worker.py                      — Flask sidecar; /health, /extract, /extract/batch
scrapling_worker/requirements.txt               — scrapling>=0.2.9, flask>=3.0.0, python-dotenv>=1.0.0
scrapling_worker/extractors/eu-ai-office.json  — CSS selector configs
scrapling_worker/extractors/edpb.json
scrapling_worker/extractors/ftc.json
scrapling_worker/README.md
docs/INGESTION_PIPELINE.md                     — comprehensive pipeline docs
scripts/seed-ingestion-sources.ts              — upsert seed sources to DB
```

### Files modified

```
src/agents/ai-regulation/types.ts         — RegulationSource: ingestionMethod?, sourceCategory?, scraplingConfig?, crawlRootUrl?
src/lib/env.ts                            — FIRECRAWL_API_KEY, INGESTION_SECRET, SCRAPING_USER_AGENT, SCRAPING_RATE_LIMIT_PER_DOMAIN, SCRAPLING_WORKER_URL
src/db/repository-types.ts               — findRawRegulatoryItemByUrl, createIngestionLog, listIngestionLogs interface methods
src/db/mock-store.ts                      — ingestionLogs array
src/db/repositories/memory-repository.ts — findRawRegulatoryItemByUrl, createIngestionLog, listIngestionLogs
src/db/repositories/supabase-repository.ts — same methods for Supabase
src/db/supabase-mappers.ts               — mapIngestionLogRow; ingestion fields in mapSourceRow
package.json                             — @mendable/firecrawl-js dependency; seed:ingestion-sources script
```

### Key guardrails preserved

- `AI_ENABLE_PROCESSING` defaults to off — no OpenAI by default
- All ingested items land with `processingStatus: "new"` — never auto-approved or auto-published
- Admin review is the only path to `approved` → `published`
- `INGESTION_SECRET` is a NEW env var, distinct from `CRON_SECRET` and `ADMIN_AUTH_SECRET`
- Scrapling Python worker binds to `127.0.0.1:8765` only — no external exposure
- No token limits, scan limits, or monthly budget limits removed

### Verification

```
npm test          71 files, 384 tests
npm run lint      0 errors (3 pre-existing warnings in unrelated french-louisiana-map-video/)
npm run typecheck clean
npm run build     /api/ingestion/run registered ✓
```

### Pending (user action required)

- Apply migration `src/db/migrations/009_ingestion_pipeline.sql` to remote Supabase via SQL Editor
- Add `INGESTION_SECRET` (min 16 chars) to Vercel/prod environment variables
- Add `FIRECRAWL_API_KEY` to Vercel/prod environment variables for Firecrawl/hybrid sources
- Optionally add `SCRAPLING_WORKER_URL` if running the Python sidecar remotely
- Run `npm run seed:ingestion-sources` after migration applied to register the 8 initial sources
- Start Python worker for Scrapling sources: `cd scrapling_worker && pip install -r requirements.txt && python worker.py`
