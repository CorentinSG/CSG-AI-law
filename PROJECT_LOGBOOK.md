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
| 2026-06-08 | T-ING1 Firecrawl + Scrapling ingestion pipeline | Dual ingestion engine: Firecrawl (Node.js SDK, broad discovery) + Scrapling Python sidecar worker (targeted official sources) + hybrid mode; dedup (URL normalization + SHA-256 content hash); AI classify → admin review → never auto-publish; INGESTION_SECRET-protected `/api/ingestion/run`; migration 009 applied to Supabase; 8 sources seeded; 384 tests |
| 2026-06-09 | Production deployment | GitHub CorentinSG/CSG-AI-law (private); Vercel csg-ai-law.vercel.app; Framework Preset: Next.js (corrected from "Other"); env vars: APP_DATA_MODE=supabase, Supabase URL/keys, ADMIN_AUTH_SECRET, CRON_SECRET, INGESTION_SECRET, FIRECRAWL_API_KEY, AI_ENABLE_PROCESSING=false; migration 009 applied; 8 ingestion sources seeded |
| 2026-06-09 | F8B country profile admin editor + public override | Admin editor `/admin/ai-regulation/countries` (+`[slug]` form, `saveCountryProfileEditorial` action, 4 tests) edits country_intelligence editorial fields (publicSummary, implementationNotes, editorialNotes, missingSourceWarnings, reviewStatus, reviewedBy); public country page overrides publicSummary/editorialNotes/missingSourceWarnings from DB when present, TS baseline otherwise; structural content unchanged; 388 tests |
| 2026-06-09 | F8C-1 source lists from DB | Public country page renders the 3 source families from `country_intelligence_sources` (helper `groupCountryIntelligenceSourcesByFamily` + 4 tests; groups by authorityType, sorts by source-id index, strips family note prefix), per-family TS fallback; no schema change; deterministic id fetch in existing Promise.all; 392 tests |
| 2026-06-10 | F8C-2 admin source CRUD | Country `[slug]` editor gains add/update/remove of official sources (`addCountrySource`/`updateCountrySource`/`removeCountrySource` on `replaceCountryIntelligenceSources`, 5 tests); two server actions per row via `formAction`; new ids `country-source-<slug>-custom-<n>`; sources now live-editable. Build gotcha fixed: `'use server'` files export async only. 397 tests |
| 2026-06-10 | Coordination efficiency protocol | `AGENT_COORDINATION.md` now includes a token-efficiency layer: agents must read board/log/comments before writing, keep inter-agent notes compact and task-scoped, and update shared coordination state only on claim, overlap, blocker, handoff, or completion |
| 2026-06-10 | T-RT0A P-RT0 repo hygiene | Removed `french-louisiana-map-video/` (216 files) + stray root dev artifacts (codex/next logs, preview pngs, tmp html), untracked `.runtime/`, extended `.gitignore` (`*.log`, `.codex-*`, `.tmp-*`, `.runtime/`, preview dirs), fixed stale T-ING1 paragraph in master context §7. Committed as `4d34443`. No src changes |
| 2026-06-10 | T-RT0B P-RT0 cron coverage | Added NL/BE/AT/SE/IE crons to `vercel.json` (10 daily crons, 12:00–16:30, 30-min stagger). Ingestion cron deferred (route auth out of `vercel.json only` scope). Hobby plan may cap cron count |
| 2026-06-10 | T-RT0C P-RT0 public-page ISR | 5 public `/ai-regulation/*` + `/standards` pages → `revalidate=300` (ISR); hub + `[id]` kept dynamic (searchParams / unpublish-immediacy, both documented inline). Build-verified render modes; 397 tests |
| 2026-06-10 | T-RT1C admin freshness dashboard | `AdminFreshnessPanel` + pure `summarizeRuntimeHealth` (3 tests) on the main admin page: per-source SLO badges (stale/degraded/healthy/inactive), stale+degraded attention list, high-priority-at-risk note; consumes T-RT1A `getSourceRuntimeHealthSummaries()` (UI only, no logic duplication). 405 tests |
| 2026-06-10 | T-RT5A F8C-3 data layer | Migration 010 adds 8 structural columns to `country_intelligence` (implementation_measures + competent/market-surveillance/notifying authorities + relevant_ministries as text[]; 3 category notes as text); extended `CountryIntelligence` type, both supabase mappers, seed mapper, and `saveCountryProfileEditorial` pass-through. USER must apply 010 + reseed before deploy (insert now writes new columns). Build ✓ 405 tests. Next: F8C-3b page reads, F8C-3c structural editing |
| 2026-06-10 | F8C-3b page reads structural fields | Migration 010 applied + reseeded; country page renders implementation measures, competent/market-surveillance/notifying authorities, and the 3 category notes from `country_intelligence` (per-field TS fallback). `latestRelevantUpdates` jsonb deferred. Build ✓ 414 tests |
| 2026-06-10 | F8C-3c structural fields editable | Country `[slug]` admin editor edits the structural content (authorities, measures, ministries, 3 category notes); `saveCountryProfileEditorial` reads them from the form (blank → TS baseline). F8C effectively complete — only `latestRelevantUpdates` jsonb + derived status labels remain TS-authoritative. Build ✓ 414 tests |
| 2026-06-11 | F6 activated | `.env.example` tracked + Upstash vars documented; user set `UPSTASH_REDIS_REST_URL`/`_TOKEN` in Vercel + redeployed. Scan route now distributed-rate-limited (5/60s per IP) via Upstash REST, in-memory fallback retained. Code was already wired; activation was config-only |
| 2026-06-10 | T-RT1A runtime source health backend | Added `sourceRuntimeHealth.ts` backend summaries from `source_health_checks`, scan logs, scan jobs, and ingestion logs; cadence-aware thresholds from country registries with scan-frequency fallback; derived `healthy/degraded/stale/inactive` state and consecutive failure counts; 402 tests |
| 2026-06-22 | Async scan infra live | Railway Node 22 worker, Supabase `scan_jobs`, Vercel enqueue-only cron routing, production alias promoted to `ops/t-ops9-ux`, manual queue-to-worker E2E proven |

---

## Phase: Runtime Source Health Backend (T-RT1A) - Codex 1

**Date**: 2026-06-10
**Agent**: Codex 1
**Status**: Completed | 402 tests | lint 0 errors | typecheck clean | build clean

### Problem solved

The new P-RT plan needed a backend source-health contract before any admin freshness dashboard work. We already persisted source-health checks, scan logs, scan jobs, and ingestion logs, but there was no single reusable source-level summary turning those signals into an operational state.

### Design

- Added `src/agents/ai-regulation/sourceRuntimeHealth.ts` with:
  - `buildSourceRuntimeHealthSummaries(...)` for deterministic pure summarization
  - `getSourceRuntimeHealthSummaries(...)` for repository-backed loading
- Each summary now includes:
  - derived state: `healthy` / `degraded` / `stale` / `inactive`
  - freshness status
  - cadence thresholds
  - consecutive failure count
  - latest success / failure / scan-job timestamps
  - latest parser / response signals
  - human-readable reasons
- Thresholds come from the existing country monitoring registries when available; non-registry sources fall back to scan-frequency defaults so the contract also covers sources like NY Courts.
- Added one small repository wrapper in `updateRepository.ts` so the helper can read ingestion logs cleanly.

### Files changed

```text
src/agents/ai-regulation/sourceRuntimeHealth.ts
src/agents/ai-regulation/sourceRuntimeHealth.test.ts
src/agents/ai-regulation/processors/updateRepository.ts
```

---

## Phase: Async Scan Infra Live

**Date**: 2026-06-22
**Status**: Production operational

### What changed

- Railway worker now runs successfully as the detached queue drainer using Node 22 (`NIXPACKS_NODE_VERSION=22`).
- Supabase migration `004_operational_jobs_and_news.sql` was confirmed live; `scan_jobs` exists with the expected queue fields.
- Vercel cron routes are configured in enqueue-only mode with `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` on Production and Preview.
- The production alias was moved onto branch `ops/t-ops9-ux` (latest validated app commit `ab63d39`) even though that branch is not yet merged into `main`.
- A manual E2E probe inserted a synthetic queued job into `scan_jobs`; the Railway worker picked it up and processed it. The probe ended in `failed` only because it intentionally used `source_id: null`, which proves the queue/claim/drain path without representing a real source scan.

### Operational notes

- Worker runtime was unstable on Node 20 because Supabase Realtime needed native WebSocket support; Node 22 resolved that runtime issue.
- The current public `/api/health` endpoint only reports worker heartbeat from actively running jobs, so an idle-but-healthy Railway worker can still look empty in the health snapshot.
- The infrastructure is live, but a real cron-created job should still be observed to prove the full Vercel-cron-to-Railway loop on production traffic rather than only via manual DB insertion.

### Verification

`npm test` | `npm run lint` | `npm run typecheck` | `npm run build`

### Limitations

- This slice creates the backend contract only; no admin UI consumes it yet.
- Failure streaks are derived from recent persisted attempts, so extremely long histories still depend on repository read limits.
- No alerting is sent yet; that remains for `T-RT1B`.

### Next step

- `T-RT1C`: have the admin freshness dashboard consume `getSourceRuntimeHealthSummaries(...)` instead of rebuilding cadence/failure logic in the UI.

---

## Phase: Admin Source CRUD per Country (F8C-2) — Claude Code

**Date**: 2026-06-10
**Agent**: Claude Code
**Status**: Completed | 397 tests | lint 0 errors | typecheck clean | build clean

### Problem solved

After F8C-1 the public page reads source lists from the DB, but they could only change via re-running the seed (which mirrors TS). F8C-2 makes the official sources live-editable from the admin, completing the editable read/write loop for the largest structural block.

### Design

- Three server actions in `countries/actions.ts`, all admin-gated, all built on the existing `replaceCountryIntelligenceSources(countryId, sources[])`: load the full set → apply one change → write the whole set back.
  - `addCountrySource`: appends; id = `country-source-<slug>-custom-<n>` where n = max existing trailing index + 1; `publicAccessible: true`, `lastCheckedAt: null` defaults; ignores blank title/URL.
  - `updateCountrySource`: maps the set, replacing only the row whose id matches; no-op if id unknown.
  - `removeCountrySource`: filters the target id out; no-op if absent.
- Editor `[slug]/page.tsx` "Official sources" section: each source is a form with Save (`action`) + Remove (`formAction`) — two server actions on one form — plus an "Add a source" form. authorityType select is labelled with the public list each value maps to. Note prefix (`family:`) stripped for display, stored plain.
- `parseTriState` (yes/no/unknown → boolean/null), `parseResponseStatus`, `parseAuthorityType` (validates against the allowed set) guard inputs.

### Files changed

```
src/app/admin/ai-regulation/countries/actions.ts          — addCountrySource/updateCountrySource/removeCountrySource + helpers
src/app/admin/ai-regulation/countries/[slug]/page.tsx     — Official sources section (per-source forms + add form)
src/app/admin/ai-regulation/countries/actions.test.ts     — 5 new tests (append/preserve, blank-ignore, targeted update, unknown no-op, targeted remove)
```

### Verification

`npm test` (397 passed; default 5s per-test timeout flakes under OneDrive I/O load — `--test-timeout=30000` gives a clean run; failures were timeouts, never assertions) | `npm run lint` (0 errors) | `npm run typecheck` (clean) | `npm run build` (clean).

### Gotcha

`'use server'` modules may only export async functions. A non-async `export const countrySourceAuthorityTypes` there failed the build with "Failed to collect page data for /admin/ai-regulation/countries/[slug]". Fixed by making the constant non-exported (the editor page has its own labelled option list).

### Guardrails preserved

Admin-gated; no auto-publish; no fabrication (admin authors sources — exactly the intended human-in-the-loop); source hierarchy semantics intact (authorityType drives the family). Public page still falls back to TS per family if the DB set is emptied.

### Limitations / next steps

- **F8C-3**: migrate the remaining scalar/array structural fields (authority maps, implementation measures, per-category notes, latest updates, status labels) to an expanded schema; only then can `europe-member-state-implementation.ts` be retired.

---

## Phase: Source-Family Lists Rendered from DB (F8C-1) — Claude Code

**Date**: 2026-06-09
**Agent**: Claude Code
**Status**: Completed | 392 tests | lint 0 errors | typecheck clean | build clean

### Problem solved

F8C aims to finish moving country content off the TypeScript file. The largest structural block is the three source-family lists (national AI regulation, case-law, soft-law). These were already seeded into `country_intelligence_sources` (77 rows) by F8A, but the public page still rendered them from the TS arrays. This slice switches the read path for those lists to the DB — the single biggest structural chunk — with zero schema change and zero content-loss risk.

### Design

- New pure helper `groupCountryIntelligenceSourcesByFamily(sources)` reconstructs the three families from flat DB rows using `authorityType` (`case_law_source` → case-law, `guidance_source` → soft-law, everything else → regulation; note `soft_law` source-type stays in the regulation family — only the explicit `guidance_source` marker is soft-law).
- Within each family, sorts by the trailing 1-based index in the source id (`country-source-<slug>-<family>-<n>`) so order matches the authored TS order regardless of repository return order.
- Strips the seed's `family:` note prefix and normalizes nullable institution/runtimeAccessible/responseStatus to match the `SourceList` view-model exactly.
- Page fetches `listCountryIntelligenceSources(\`country-${slug}\`)` in the existing Promise.all — the country id is deterministic (`country-<slug>`), so no extra round trip / waterfall.
- Per-family fallback: if the DB has no sources for a family, that family renders from the TS baseline. DB rows were seeded from TS, so output is identical until an admin edits sources.

### Files changed

```
src/agents/ai-regulation/utils/country-intelligence-view.ts       — NEW helper + view-model types
src/agents/ai-regulation/utils/country-intelligence-view.test.ts  — NEW: 4 tests (family routing, index ordering, note/null normalization, empty)
src/app/ai-regulation/europe/[country]/page.tsx                   — fetch + group DB sources; 3 SourceList usages now DB-backed with TS fallback
```

### Verification

`npm test` (392 passed) | `npm run lint` (0 errors) | `npm run typecheck` (clean) | `npm run build` (clean).

### Guardrails preserved

Source hierarchy and verified content unchanged (DB seeded from the same verified TS); no fabrication; no auto-publish; per-family TS fallback prevents any content loss.

### Limitations / next steps

- **F8C-2**: admin source CRUD (add/edit/remove/toggle sources per country) via `replaceCountryIntelligenceSources` so the source lists become live-editable like the editorial fields.
- **F8C-3**: migrate remaining scalar/array structural fields (authority maps, implementation measures, per-category notes, latest updates, status labels) to an expanded schema; only then can the TS file be retired.

---

## Phase: Country Profile Admin Editor + Public Editorial Override (F8B) — Claude Code

**Date**: 2026-06-09
**Agent**: Claude Code
**Status**: Completed | 388 tests | lint 0 errors | typecheck clean | build clean

### Problem solved

F8 aims to move country profiles off the 2100-line `europe-member-state-implementation.ts` into editable DB storage so profiles can change without a redeployment. F8A seeded the normalized `country_intelligence` table, but nothing could edit it (the DB just mirrored the TS), and the public pages still read TS exclusively. A naive "read everything from DB" swap was rejected: the DB table is a flattened subset and would have dropped ~70% of the rich legal content (authority maps, case-law/soft-law source lists, per-category notes, latest updates) from public pages — a content-loss regression.

### Design

Scoped, non-destructive slice:
- **Admin editor** edits only the mutable EDITORIAL fields (publicSummary, implementationNotes, editorialNotes, missingSourceWarnings, reviewStatus, reviewedBy). Structural fields are read-only and preserved from the existing row.
- **Public page override**: the country page prefers DB editorial values when present and falls back to the verified TS baseline when the DB field is blank/empty. Structural content always renders from TS. Net effect: an admin edit reflects live, nothing is ever lost.
- Reversible mapping reused from the seed: editorialNotes array ⇄ `\n`-joined string; missingSourceWarnings array ⇄ array; publicSummary string ⇄ string.

### Files changed

```
src/app/admin/ai-regulation/countries/page.tsx          — NEW: index list of all country profiles (review status, last reviewed, edit link)
src/app/admin/ai-regulation/countries/[slug]/page.tsx   — NEW: per-country editor form + read-only context panel
src/app/admin/ai-regulation/countries/actions.ts        — NEW: saveCountryProfileEditorial server action (admin-gated, upsertCountryIntelligence)
src/app/admin/ai-regulation/countries/actions.test.ts   — NEW: 4 tests (merge persist, invalid status fallback, blank→baseline, missing row throws)
src/app/ai-regulation/europe/[country]/page.tsx         — DB editorial override added to existing Promise.all + 3 render sites
src/app/admin/ai-regulation/page.tsx                    — "Edit country profiles" discoverability link
```

### Verification

`npm test` (388 passed) | `npm run lint` (0 errors) | `npm run typecheck` (clean) | `npm run build` (clean).

### Guardrails preserved

Editorial text only; no auto-publish; no fabrication (admin authors the text); structural legal content (authority designations, source hierarchy) untouched; `/admin/*` protected by `src/proxy.ts` middleware; server action gated by `assertAdminServerActionAccess()`.

### Limitations / next steps

- Metadata `description` (in `generateMetadata`) still uses the TS publicSummary; only the rendered body reflects DB edits. Low-impact; can be wired later if needed.
- Editor covers Europe country_intelligence rows (the only region seeded). 
- **F8C (optional)**: migrate structural content (authority maps, source lists, per-category notes, latest updates) into an expanded DB schema for a full TS retirement.

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

### Completed (were pending, now done — 2026-06-09)

- Migration 009 applied to remote Supabase — made idempotent with `drop policy if exists` before `create policy`
- `INGESTION_SECRET` set on Vercel
- `FIRECRAWL_API_KEY` set on Vercel
- `npm run seed:ingestion-sources` run — 8 sources created in production DB
- Site deployed: https://csg-ai-law.vercel.app

### Still pending

- Optionally add `SCRAPLING_WORKER_URL` if running the Python sidecar remotely
- Deploy Scrapling Python worker: `cd scrapling_worker && pip install -r requirements.txt && python worker.py`

---

## Phase: Production Deployment — GitHub + Vercel — Claude Code

**Date**: 2026-06-09  
**Agent**: Claude Code  
**Status**: Completed

### What was done

Complete first production deployment of the project to GitHub + Vercel, plus all post-T-ING1 production setup steps.

#### 1. Code fixes (4 typecheck errors from T-ING1)

| Error | Root cause | Fix |
|-------|-----------|-----|
| `id` not in `RawRegulatoryItemInput` | `RawRegulatoryItemInput = Omit<..., "id" \| "createdAt" \| "updatedAt">` | Removed `id: randomUUID()` in orchestrator; removed `id: "raw-test-001"` / `id: "raw-dedup-001"` in tests |
| `duplicateOf` missing | Required field in `RawRegulatoryItemInput` | Added `duplicateOf: null` to all three `createRawRegulatoryItem` call sites |
| `IngestionSource` cast in route.ts | Type removed from orchestrator exports | Changed `source as IngestionSource` to plain `source` |
| Unused imports | `vi`, `scrapeUrl`, `IngestionLog` | Removed all three |

#### 2. Migration 009 — idempotency fix

- First attempt failed: `policy "service_role_all_ingestion_logs" already exists` (partial prior run)
- Fix: added `drop policy if exists "service_role_all_ingestion_logs" on ingestion_logs;` before the `create policy` line in `src/db/migrations/009_ingestion_pipeline.sql`
- Applied successfully via Supabase SQL Editor

#### 3. `sourceToInsert` mapper fix

`src/db/supabase-mappers.ts` — the 4 new migration 009 columns were missing from `sourceToInsert`. Added:

```typescript
ingestion_method: source.ingestionMethod,
source_category: source.sourceCategory,
scrapling_config: source.scraplingConfig,
crawl_root_url: source.crawlRootUrl,
```

Also added these 4 columns to `legacyUnsupportedSourceColumns` in `supabase-repository.ts` so they are stripped safely when falling back to a pre-migration-009 schema.

#### 4. Seed script — dotenv fix

`scripts/seed-ingestion-sources.ts` — `import "dotenv/config"` reads `.env`, not `.env.local`. Changed to:

```typescript
import { config } from "dotenv";
config({ path: ".env.local" });
```

Also: `npm install dotenv` (package was missing).

#### 5. Seed run — 8 sources created in production

```
npm run seed:ingestion-sources
```

Sources: `eur-lex-new-acts`, `edpb-news`, `ai-office-docs`, `cnil-actualites`, `ico-guidance`, `nist-ai-publications`, `bafin-digital-finance`, `dpc-news`

#### 6. GitHub + Vercel

- GitHub repo: `CorentinSG/CSG-AI-law` (private) — https://github.com/CorentinSG/CSG-AI-law
- Git was re-initialized inside the project folder. The first push had git root at the parent `CSG Law/` folder; all files were nested under a subdirectory, preventing Vercel from detecting Next.js. Corrected with a force push from the correct root.
- Vercel project: `csg-ai-law` — https://csg-ai-law.vercel.app
- **Framework Preset issue**: initial detect was "Other" (because of the wrong git root push). All URLs returned `404: NOT_FOUND` at infra level even though the build compiled all 104+ routes. Fixed by changing Framework Settings → "Next.js" and redeploying.

#### 7. Environment variables set on Vercel

| Variable | Purpose | Notes |
|----------|---------|-------|
| `APP_DATA_MODE` | `supabase` | Switches repository from memory to Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public — exposed to browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Public — exposed to browser; RLS controls access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Server-only — bypasses RLS; used in API routes + cron |
| `ADMIN_AUTH_SECRET` | Admin panel password | Protects all `/admin/*` routes; must be ≥ 32 chars |
| `CRON_SECRET` | Cron route authentication | Protects all `/api/cron/*` routes; sent as `Authorization: Bearer <token>` header by Vercel cron scheduler |
| `INGESTION_SECRET` | Ingestion API authentication | Protects `/api/ingestion/run`; **distinct** from CRON_SECRET and ADMIN_AUTH_SECRET |
| `FIRECRAWL_API_KEY` | Firecrawl Node.js SDK key | Required for `firecrawl` and `hybrid` ingestion methods |
| `AI_ENABLE_PROCESSING` | `false` | Keeps OpenAI processing disabled; default off — do not change unless deliberately enabling AI classify |
| `SCRAPLING_WORKER_URL` | *(not yet set)* | URL of the Flask Scrapling sidecar; required for `scrapling` and `hybrid` sources |

**Vercel project settings:**

| Setting | Value |
|---------|-------|
| Project name | `csg-ai-law` |
| Framework Preset | **Next.js** (was incorrectly "Other" on first deploy — caused 404 on all routes) |
| Root Directory | *(empty — project is at git root)* |
| Build Command | *(default: `next build`)* |
| Output Directory | *(default: `.next`)* |
| Node.js version | 22.x |
| Region | iad1 (US East) |
| Production branch | `main` |

#### 8. npm packages added

`@mendable/firecrawl-js`, `dotenv`

### Files changed

```
src/agents/ingestion/ingestionOrchestrator.ts   — removed id/IngestionLog/scrapeUrl; added duplicateOf: null
src/agents/ingestion/ingestion.test.ts          — removed id fields; added duplicateOf: null; removed unused vi import
src/app/api/ingestion/run/route.ts              — removed IngestionSource cast
src/db/migrations/009_ingestion_pipeline.sql   — added drop policy if exists for idempotency
src/db/supabase-mappers.ts                     — added ingestion columns to sourceToInsert
src/db/repositories/supabase-repository.ts     — added migration 009 columns to legacyUnsupportedSourceColumns
scripts/seed-ingestion-sources.ts              — dotenv config({ path: ".env.local" })
package.json                                   — @mendable/firecrawl-js + dotenv
```

### Verification

```
npm test          384 tests ✓
npm run lint      0 errors
npm run typecheck clean
npm run build     104+ routes compiled ✓
```

### Known limitations

- Scrapling Python sidecar not yet deployed — `scrapling` and `hybrid` ingestion methods non-operational until `SCRAPLING_WORKER_URL` is set and the Flask worker is running
- `/api/ingestion/run` live but not yet smoke-tested in production

### Next steps

1. Deploy Scrapling Python worker (VPS, Railway, Fly.io) and set `SCRAPLING_WORKER_URL` on Vercel
2. Smoke-test `/api/ingestion/run` with a `firecrawl`-method source
3. Monitor `ingestion_logs` table in Supabase for first run results

## Phase: Audit hardening

Date: 2026-06-22

What changed
- Restored the public research registry by reconnecting `researchEntries` in `src/content/research.ts`, which fixed the broken research-content contract and re-enabled static research pages.
- Tightened AI-law news visibility rules in `src/content/ai-regulation/news.ts`: discovery-only items now stay admin-only, and reputable secondary sources need stronger legal signals plus non-low confidence/importance before going public automatically.
- Extended `buildHealthSnapshot()` in `src/lib/health.ts` so worker status distinguishes `active`, `idle`, and `unknown`, with `lastActivityAt`/`lastActivityAgeMs` instead of treating every non-running worker as absent.
- Enriched `listAgentApiCapabilities()` and `buildAdminOperationsSummary()` so backend outputs include `missingEnvVars` and `configuredEnvVars`, making operator setup gaps explicit for the admin UI.
- Improved `listPrioritizedReviewQueue()` so review items now carry stronger scoring signals and `priorityReasons`, helping the admin surface the most consequential `needs_review` items first.

Files changed
- `src/content/research.ts`
- `src/content/ai-regulation/news.ts`
- `src/content/ai-regulation/news.test.ts`
- `src/lib/health.ts`
- `src/lib/health.test.ts`
- `src/agents/ai-regulation/agentApiCapabilities.ts`
- `src/agents/ai-regulation/agentApiCapabilities.test.ts`
- `src/lib/admin-operations-summary.ts`
- `src/lib/admin-operations-summary.test.ts`
- `src/lib/admin-review-batch.ts`
- `src/lib/admin-review-batch.test.ts`
- `AI_TASKS.md`

Commands run
- `npm test -- src/content/research.test.ts`
- `npm test -- src/content/ai-regulation/news.test.ts src/lib/health.test.ts src/agents/ai-regulation/agentApiCapabilities.test.ts src/lib/admin-review-batch.test.ts src/lib/admin-operations-summary.test.ts src/agents/ai-regulation/publicationEligibility.test.ts`
- `npm test`
- `npm run typecheck`
- `VERCEL_ENV=preview ADMIN_USERNAME=csg-admin ADMIN_PASSWORD=<set> npm run build`

Verification
- Targeted research test PASS
- Targeted backend hardening tests PASS
- Full test suite PASS (`102` files / `539` tests)
- Typecheck PASS
- Production build PASS

Limitations
- This hardening pass does not yet remediate specific degraded/inaccessible sources; it improves visibility and prioritization around them.
- News-quality tightening is heuristic and intentionally conservative; additional publication-integrity tuning may still be useful on live data.

Next steps
1. Let Claude surface `worker.state`, `lastActivityAt`, and capability env-var gaps in admin surfaces.
2. Review a sample of currently published legal-news items to see whether the stricter gating should be tightened further.
3. Use the new `priorityReasons` feed to reduce the `needs_review` backlog more deliberately.

## Phase: News backfill and publication integrity

Date: 2026-06-22

What changed
- Added a tested `backfillNewsItemsFromUpdates()` service plus `npm run backfill:news-items` so the live `news_items` table can be rebuilt from monitor updates without relying on legacy fallback behavior.
- Ran the backfill against Supabase: `327` news items upserted, ending at `95` public and `232` admin-only.
- Hardened news visibility so internal smoke-test updates and sources named `(Discovery Only)` stay admin-only even when legacy source config has been overwritten by runtime fetch metadata.
- Tightened the production-safe seed profile so demo/seed updates never appear as pre-published monitor items.

Verification
- `npm test -- src/agents/ai-regulation/legalIntegrity.test.ts` PASS
- `npm test -- src/lib/news-backfill.test.ts` PASS
- `npm test -- src/content/ai-regulation/news.test.ts` PASS
- `npm run backfill:news-items` dry-run PASS
- `npm run backfill:news-items -- --write` PASS against Supabase
- Live DB query confirms no public `news_items` matching smoke-test or Discovery Only sources
- `npm run report:data-quality` PASS with integrity `high=0`, `medium=18`

Remaining work
- The 18 medium data-quality findings need source/citation research, not automatic publication changes.
- Optional connector credentials are still missing for NewsAPI, Legifrance/PISTE, Judilibre, CourtListener/RECAP, and Legal Data Hunter.
