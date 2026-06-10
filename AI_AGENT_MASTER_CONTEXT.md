# AI Agent Master Context

Project: `c-saint-girons-ai-law-intelligence` — C. Saint-Girons, Esq | AI Law & Legal Intelligence
Purpose: fast-start machine context for AI agents resuming work. Repository code is the final authority over this file.
Last synchronized: 2026-06-09 (T-ING1 ingestion pipeline in production — migration 009 applied, 8 sources seeded, Vercel deployment live at csg-ai-law.vercel.app; production setup complete: GitHub CorentinSG/CSG-AI-law, Vercel csg-ai-law.vercel.app, Framework Preset corrected to Next.js, all env vars set)

---

## 1. Active Operating Context

**Current state (2026-06-09):**
- Test suite: 397 tests | lint | typecheck | build — all green
- **Production deployment**: site live at https://csg-ai-law.vercel.app — GitHub repo CorentinSG/CSG-AI-law (private); Vercel project csg-ai-law; Framework Preset: Next.js; env vars set: APP_DATA_MODE=supabase, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_AUTH_SECRET, CRON_SECRET, INGESTION_SECRET, FIRECRAWL_API_KEY, AI_ENABLE_PROCESSING=false; SCRAPLING_WORKER_URL not yet set
- 9 EU countries with full live monitoring stack: FR, DE, ES, IT, NL, BE, AT, SE, IE
- 1 EU country with first-wave profile only (no live stack): PL
- Scan runtime: P-C3 complete — queue-drain semantics, optimistic claim, lease heartbeat, blockedByRunningJobs guard, local worker, structured blocker ownership summaries
- Admin: discovery_leads backend + admin UX + pagination complete (P-C1, P-C2, T-C1/C2 all done)
- **T-ING1 live**: migration 009 applied to Supabase; 8 ingestion sources seeded; `/api/ingestion/run` live (INGESTION_SECRET-protected); Firecrawl sources operational; Scrapling sidecar not yet deployed (scrapling/hybrid methods require Python worker)
- **F1 in progress**: public monitor `/ai-regulation` uses keyset (cursor-based) pagination on news/database tabs, and backend cursor primitives now exist for `scan_jobs` + `discovery_leads`; broader admin/server pagination migration is still open
- **F8 in progress**: normalized `country_intelligence` storage seeded to Supabase; **F8B done** — admin editor at `/admin/ai-regulation/countries` edits editorial fields, public page overrides publicSummary/editorialNotes/missingSourceWarnings from DB. **F8C-1 done** — public page renders the three source-family lists from `country_intelligence_sources` (grouped via `groupCountryIntelligenceSourcesByFamily`), per-family TS fallback. **F8C-2 done** — admin source CRUD (add/update/remove per country via `replaceCountryIntelligenceSources`) in the `[slug]` editor. Still TS-only: authority maps, implementation measures, per-category notes, latest updates, status labels (F8C-3)
- Open: F-series roadmap below

**Open F-series roadmap (priority order):**
- **T-ING1** ✓ — Firecrawl + Scrapling dual ingestion pipeline complete and in production (384 tests); migration 009 applied; 8 sources seeded; INGESTION_SECRET + FIRECRAWL_API_KEY set on Vercel; Scrapling Python sidecar not yet deployed (scrapling/hybrid sources non-operational until deployed)
- **F5e** ✓ — Ireland is now the 9th first-wave EU country with a full live monitoring stack (T-IE1 done)
- **F1** — Broader cursor-based pagination migration (public hub and heavy backend surfaces partially migrated; many admin/server surfaces still offset/page-number)
- **F7** ✓ — `008_review_transition_rpc.sql` applied to remote Supabase (2026-06-08, confirmed Success)
- **F8** — Move `europe-member-state-implementation.ts` (~2100+ lines) to DB-backed storage — **F8A done**: 27 country_intelligence + 77 source rows seeded (2026-06-08). **F8B done**: admin editorial editor + public-page editorial override. **F8C-1 done** (2026-06-09): public page renders the three source-family lists from `country_intelligence_sources` (per-family TS fallback). **F8C-2 done**: admin source CRUD (`addCountrySource`/`updateCountrySource`/`removeCountrySource` built on `replaceCountryIntelligenceSources`) in the `[slug]` editor — sources are now live-editable. Remaining: **F8C-3** migrate scalar/array structural fields (authority maps, measures, per-category notes, latest updates, status labels) to an expanded schema for full TS retirement
- **F6** — Upstash Redis rate limiting (env vars wired; in-memory fallback active)
- **F3** — Fully detached production worker (scan:worker-local exists; not yet distributed service)

---

## 2. Non-Negotiable Guardrails

**Read these before any change. They are structurally enforced and cannot be weakened.**

### AI + publication
- AI processing must remain disabled by default (`AI_ENABLE_PROCESSING` env var defaults to off)
- Do not enable OpenAI processing by default
- Do not remove or weaken token limits, scan limits, or monthly budget limits
- Never auto-publish anything; human review is required before status=published
- Never expose API keys or secrets

### Auth + visibility
- Admin auth: `ADMIN_AUTH_SECRET`; cron auth: `CRON_SECRET` — do not weaken either
- Admin routes must return 401 + `WWW-Authenticate` + human-readable branded response
- Public pages expose only `status=published` monitor items and `public_visibility_status`-gated news items
- Admin/review workflows must remain protected; discovery leads are admin-only until verified
- Traceability metadata is admin-only; do not expose raw debug fields on public pages

### Legal content integrity (anti-hallucination)
Do NOT invent:
- legal developments, implementation statuses, enforcement decisions, case law
- publication dates, sources, citations, pinpoints
- authority designations, competent authority maps, binding instruments
- academic publications, speaking engagements, legal research, professional achievements

Distinguish: binding law / proposed law / regulation / agency guidance / enforcement action / soft law / technical standard / governance framework / policy report / best practice / commentary / other

### Citation integrity
- Never invent a pinpoint; if no pinpoint detected → blank + warning, not fabricated precision
- `citationQualityStatus: complete` only when exact pinpoints are actually extracted from the official source
- EU AI Act baseline stays `partial`; EUR-Lex parser at `eurLexAiActParser.ts` not yet full article-by-article
- Publication blocked unless: explicit human approval + official/authoritative primary source + complete core source metadata + citation quality sufficient

### Source hierarchy (do not collapse)
1. official primary sources (legislative, court databases)
2. official court/legislative databases
3. official regulator/agency sources
4. standards bodies/governance frameworks
5. reputable trackers/secondary references
6. informal discovery sources
7. media discovery sources

Official sources control legal authority. Discovery/tracker/media sources generate leads or support corroboration only; never independently support publication.

### Discovery/media rules
- NewsAPI, GDELT, major-press lanes: discovery-only, never legal authority
- Must not reproduce paywalled content; use deterministic AI+legal-regulatory filtering
- Official confirmation required before converting discovery items into authoritative legal conclusions
- GDELT rate limiting: surface honestly as non-fatal constraint, not as "no news exists"
- Unresolved discovery-only items must not be presented publicly as settled law

---

## 3. Architecture Reality

### Product identity
Brand: `C. Saint-Girons, Esq` | `AI Law & Legal Intelligence`
This is a law-firm site AND a private/admin legal monitoring system. The AI Regulation Monitor is one feature among others. The broader site includes professional identity, blog/editorial analysis, legal AI commentary, and future educational sections.

### Technology stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, ESLint, tsx
- Supabase JS, OpenAI (disabled by default), rss-parser, cheerio, zod, framer-motion, lucide-react
- **Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code** (this version has breaking changes from training data)

### Public routes
`/` | `/contact` | `/research` | `/research/[slug]` | `/standards` | `/ai-regulation` | `/ai-regulation/[id]` | `/ai-regulation/europe` | `/ai-regulation/europe/[country]` | `/ai-regulation/united-states` | `/ai-regulation/united-states/[state]` | `/news` | `/news/[slug]` | `/robots.txt` | `/sitemap.xml`

### Admin routes
`/admin/ai-regulation` | `/admin/ai-regulation/[id]` | `/admin/ai-regulation/sources/[sourceId]` | `/admin/ai-regulation/news` | `/admin/ai-regulation/data-quality` | `/admin/ai-regulation/countries` | `/admin/ai-regulation/countries/[slug]`

### Key UX rules
- Nav order: Home → AI Law Hub → Europe → US → Notes → Standards → Contact
- `/ai-regulation` overview order: 5 latest news → region portals → database preview
- `/ai-regulation/europe` order: header → live panel → map → timeline → baseline → country profiles
- `/news` redirects to `/ai-regulation?view=news`
- Live panels (`live-legal-intelligence-panel.tsx`): never show fake skeleton cards; show explicit empty/degraded state
- Mobile hero headline: must not clip on first fold
- `/research` is publicly labeled "Notes & Commentary" — do not imply academic publication history

### Data persistence
- Repository: `src/db/repository.ts` (selection), `src/db/repository-types.ts` (interface + types)
- memory-repository.ts = local/dev; supabase-repository.ts = durable production
- Supabase compat bridge: retries writes with legacy-safe shapes for missing migrations; falls back to process-local storage for governance entities when newer tables are absent. If PGRST204/PGRST205, check compat bridge before adding more fallback logic.

### Database migrations (applied to remote unless noted)
- 001: `regulation_sources`, `raw_regulatory_items`
- 002: Supabase access policies
- 003: `source_references`, `verification_attempts`, `review_events`, `data_quality_findings`
- 004: `scan_jobs`, `news_items`, `source_health_checks`, richer `regulation_sources` columns
- 005: `source_references.source_type` authority granularity values (government/parliament/legislation/policy)
- 006: `country_intelligence` + `country_intelligence_sources` tables — applied 2026-06-08; constraint fixed post-apply to include `soft_law`, `case_law_source`, `guidance_source`; 27 profiles + 77 sources seeded
- 007: `discovery_leads` table
- 008: `transition_review_status` atomic RPC — applied 2026-06-08 (F7 confirmed)
- 009: applied 2026-06-09 — extend `regulation_sources` (ingestion_method, source_category, scrapling_config, crawl_root_url), extend `raw_regulatory_items` (markdown, html_snapshot, content_hash, extraction_method, published_at, fetched_at), add `ingestion_logs` table; migration was made idempotent with `drop policy if exists` before apply

### Review and publication workflow
```
needs_review → approved → published
needs_review → rejected
any → archived
```
- Cannot publish directly from needs_review; must go needs_review → approved → published
- `published` items are public; `approved` items are not yet public
- Implementation: `publicationEligibility.ts`, `memory-repository.ts`, `supabase-repository.ts`
- `discovery_only` items must not be approved or published as if they were official monitor items

### Domain entities
regulatory_source, raw_regulatory_item, ai_regulatory_update, source_reference, verification_attempt, review_event, data_quality_finding, scan_job, news_item, source_health_check, discovery_lead, ingestion_log

### Key source files (authoritative over this document if conflict)
`src/db/repository-types.ts` | `src/db/schema.ts` | `src/agents/ai-regulation/types.ts` | `src/agents/ai-regulation/governance.ts` | `src/agents/ai-regulation/processors/*` | `src/content/ai-regulation/*`

---

## 4. Coordination Rules

### Inter-agent protocol
- Before any non-trivial change: read this file + `PROJECT_LOGBOOK.md` + `AGENT_COORDINATION.md`
- Claim work in `AGENT_COORDINATION.md` before starting; do not touch files owned by another active task
- After meaningful changes: update `PROJECT_LOGBOOK.md` + this file
- Peer code review only when user explicitly requests it
- `AGENT_COORDINATION.md` is the live anti-collision layer; this file is the architectural memory

### Verification sequence (run before declaring completion)
```
npm test
npm run lint
npm run typecheck
npm run build
```

### NY Courts regression rule
Preserve and extend `src/agents/ai-regulation/ny-courts-part-161.regression.test.ts`:
- Expects: `binding_court_rule` classification, effective date `2026-06-01`, `needs_review`/`admin_only` handling
- Runtime: HTTP 403 from this environment — parser-ready but runtime-blocked; preserve honest degraded behavior
- If monitor misses another important development, add a deterministic regression alongside Part 161

---

## 5. Runtime Model (Scan Job Execution)

### Canonical execution path: `queueAndDrainScanJob`
All route/cron callers must use this function. It returns:
```typescript
{
  queuedJob,                         // the job enqueued
  processedJob,                      // the job actually drained and executed
  queuedJobProcessedImmediately,     // boolean
  blockedByRunningJobs,              // ScanJob[] | null — set when healthy running job exists
  blockingRunningJobSummaries,       // structured blocker ownership + freshness details
}
```

### Key functions in `src/agents/ai-regulation/processors/scanJobs.ts`
- `tryStartScanJob(jobId, leaseOwner)` — optimistic claim before execution; stores in resultSummary: `leaseOwner`, `leaseToken`, `leaseAcquiredAt`, `claimedFromStatus`; skips if already claimed
- `drainQueuedScanJobs(options)` — serial drain of all queued jobs; returns `blockedByRunningJobs` when standing down
- `blockingRunningJobSummaries` — structured blocker diagnostics: `leaseOwner`, `startedAt`, `heartbeatAt`, `runningForMs`, `heartbeatAgeMs`, `heartbeatTimeoutMs`, `sourceId`, `trigger`, `requestedBy`
- `processScanJob(jobId)` — safe public entrypoint; rejects already-running or non-queued jobs; claim → execute only
- `recoverStaleRunningScanJobs()` — marks stale running jobs as failed, evaluated via latest lease heartbeat (not startedAt)
- `queueAndRunScanJob()` — compatibility wrapper over queue-drain semantics only; do not reintroduce as a separate execution model

### Lease heartbeat (stored in resultSummary)
Fields: `leaseHeartbeatAt`, `leaseHeartbeatIntervalMs`, `leaseHeartbeatTimeoutMs`
Updated while job is actively being processed. Stale recovery evaluates latest heartbeat, not startedAt.

### leaseOwner values
- `"local-worker"` — scan:worker-local
- `"admin-action"` — admin-triggered scans
- `"vercel-cron-{country}"` — cron routes

### Local worker
- Script: `scripts/run-scan-job-worker.ts` | Command: `npm run scan:worker-local`
- Polls queue, drains serially, uses optimistic claim; exits after configurable idle cycles
- Runtime helper: `src/agents/ai-regulation/processors/scanWorkerRuntime.ts`
- Service hardening: singleton lease file, persisted status/heartbeat file, stop-file request support, signal-aware graceful shutdown
- Helper command: `npm run scan:worker-stop`
- Env: `SCAN_JOB_WORKER_POLL_MS`, `SCAN_JOB_WORKER_MAX_JOBS_PER_CYCLE`, `SCAN_JOB_WORKER_IDLE_EXIT_AFTER`, `SCAN_JOB_WORKER_CONTINUE_ON_ERROR`, `SCAN_JOB_WORKER_STATE_DIR`, `SCAN_JOB_WORKER_SINGLETON_STALE_MS`
- **Limitation**: local-process only; not yet a detached production worker (F3)

### Cron route pattern
All country cron routes: GET/POST → `getCronAuthStatus` + `queueAndDrainScanJob`
Response includes: ok, trigger, regionScope, scanProfile, dataMode, aiEnabled, schedulerGuidance, job (alias for processedJob), queuedJob, processedJob, queuedJobProcessedImmediately, blockedByRunningJobs, blockingRunningJobSummaries, result

**Important limitation**: still a cooperative serial guard, not a fully atomic distributed lock; lease state in resultSummary not normalized into dedicated columns.

---

## 6. Country Monitoring Stack Pattern

### Countries with full live monitoring stacks (9)
FR (france), DE (germany), ES (spain), IT (italy), NL (netherlands), BE (belgium), AT (austria), SE (sweden), IE (ireland)

`getPriorityEuropeCountryProfiles()` includes: FR, DE, ES, IT, NL, PL, SE, IE, BE, AT

### Per-country file set (each full-stack country needs all of these)
1. `{country}NewsSources.ts` — source registry; 5 sources (1 official primary high-cadence, 2 official slower, 2 discovery-only); exports profile IDs, source descriptor, getAgentSourceIds, getSchedulerGuidance
2. `{country}LegalNewsAgent.ts` — news agent; exports `get{Country}LiveLegalIntelligenceData(limit)`, `run{Country}LegalNewsAgentScan(options?)`
3. `src/content/ai-regulation/{country}-ai-intelligence.ts` — snapshot; exports authority map, timeline, verification gaps, `get{Country}AiIntelligenceSnapshot()`
4. `src/app/api/cron/ai-regulation-{country}-scan/route.ts` — protected cron route
5. `src/app/api/cron/ai-regulation-{country}-scan/route.test.ts` — 2 tests (auth rejection + default profile)
6. `scripts/run-{country}-official-legal-scan.ts`, `run-{country}-legal-news-scan.ts`, `run-{country}-verification-scan.ts` — 3 scripts
7. `scanProfiles.ts` entries: 3 profile IDs, 3 sourceStrategy union values, `get{Country}ProfileSourceIds` helper, 3 switch cases in `selectSourcesForScanProfile`
8. `europe-member-state-implementation.ts`: CountrySourceRecord entries + EuropeCountryProfile in `firstWaveProfiles`

### CountrySourceRecord required fields (typecheck-enforced — missing any field causes test or build failure)
`official`, `public`, `runtimeAccessible`, `responseStatus`, `lastCheckedDate`, `parserStatus`, `recommendation`, `publicationDate`, `note`

### Country authority statuses (as of 2026-06-06)
- **FR**: `competent_authority_designated` — CNIL 2025 annual report + official government adaptation bill; full authority map still under review; do not describe as exhaustive
- **DE**: `implementation_in_progress` — official government implementation steps verified; no exhaustive authority map
- **ES**: `implementation_in_progress` — AEPD primary; AESIA + BOE + La Moncloa slower; no exhaustive authority map
- **IT**: `national_implementation_identified` — Garante primary; official national AI law source verified; no exhaustive authority map
- **NL**: `consultation_or_draft_identified` — AP + RDI primary; April 2026 consultation verified; enacted designation instrument NOT verified
- **BE**: `implementation_in_progress` / `low` confidence — APD/GBA primary; federal structure (3 regions, 3 language communities) explicitly a verification gap; current profile covers federal tier only
- **AT**: `implementation_in_progress` / `low` confidence — DSB primary (EDPB member, NOYB/Schrems based in Vienna); RTR role under AI Act = `needs_full_verification`; DSB-NOYB link documented, not used to infer enforcement outcomes
- **PL**: `implementation_in_progress` / `low` — UODO + Ministry of Digitalisation; first-wave profile only; no live stack
- **SE**: `implementation_in_progress` / `low` — IMY (primary, 5-min, candidate_for_monitoring; participated in EDPB ChatGPT investigation) + DIGG + Regeringen (daily); full live stack; DIGG role under AI Act = `preparing_or_partial`; no exhaustive authority map
- **IE**: `implementation_in_progress` / `low` — DPC (lead SA for Meta/Google/Apple/LinkedIn/Microsoft EU establishments, EDPB member) + DETE (AI Act implementation) + gov.ie; full live stack (T-IE1 done)

### Europe citation rule
Do not mark any EU country as `competent_authority_designated` without a verified binding official designation instrument. If unclear, mark `needs_review`. Do not describe any country's monitoring layer as exhaustive.

---

## 7. Known Structural Limitations

These are known and accepted — do not silently "fix" them without understanding the reason:

- Scan jobs execute inline after queueing; no detached production worker yet (F3)
- `discovery_leads` admin/review workflow adoption substantially done but incomplete in edge areas
- `europe-member-state-implementation.ts` still holds the SCALAR structural content (authority maps, implementation measures, per-category notes, latest updates, status labels). EDITORIAL fields (F8B) and the three SOURCE-FAMILY lists (F8C-1) render from the DB with per-field/per-family TS fallback, and sources are admin-editable (F8C-2). Scalar structural fields not yet migrated (F8C-3), so the TS file cannot be fully retired yet
- Findings persistence exists but finding-resolution workflow (resolved/closed state) is incomplete
- Pagination is mixed: public hub flows and some heavy backend surfaces use cursor pagination, but many admin/server surfaces still use offset/page-number pagination (F1 still open)
- Migrations 006, 007, 008 all applied to remote Supabase; migration 006 constraint extended post-apply to include `soft_law`, `case_law_source`, `guidance_source`
- Legifrance runtime: may hit Cloudflare challenge; scan degrades gracefully with explicit zeroResultsReason
- NY Courts Part 161: HTTP 403 from this environment; parser-ready but runtime-blocked; seed + regression remain active
- Some filter option collection helpers still derive choices from broad reads (minor optimization pending)
- Ingestion pipeline (T-ING1): migration 009 applied to remote Supabase; INGESTION_SECRET + FIRECRAWL_API_KEY set in prod env; 8 seed sources registered; `/api/ingestion/run` live and Firecrawl sources operational. Remaining gap: the Scrapling Python sidecar (`scrapling_worker/`) is not yet deployed, so `scrapling`/`hybrid` ingestion methods are non-operational until `SCRAPLING_WORKER_URL` points at a running worker (P-RT2C)

---

## 8. Recent Critical Phases

### F8C-2: Admin source CRUD per country (Claude Code, 2026-06-10) — 397 tests
Country profile editor (`/admin/ai-regulation/countries/[slug]`) gained an "Official sources" section: each stored source is an editable form (title, URL, institution, authority type, runtime accessible, response status, active, note) with Save + Remove buttons (two server actions on one form via `formAction`), plus an "Add a source" form. Three new actions in `countries/actions.ts`: `addCountrySource`, `updateCountrySource`, `removeCountrySource` — all admin-gated, all built on `replaceCountryIntelligenceSources` (load full set → apply single change → write back). New source ids = `country-source-<slug>-custom-<n>` (n = max existing trailing index + 1). authorityType decides the public list (case_law_source → case-law, guidance_source → soft-law, else → regulation). 5 new action tests. NOTE: `'use server'` files may only export async functions — a non-async `export const` there fails the build with "Failed to collect page data"; keep shared constants non-exported or in a separate module.

### F8C-1: Source-family lists rendered from DB (Claude Code, 2026-06-09) — 392 tests
Public country page now renders the three source families (national AI regulation, case-law, soft-law) from the normalized `country_intelligence_sources` table instead of the TS arrays, with per-family fallback to TS when the DB has no sources for that family. New helper `src/agents/ai-regulation/utils/country-intelligence-view.ts` (`groupCountryIntelligenceSourcesByFamily`, 4 tests): groups DB rows by `authorityType` (`case_law_source` → case-law, `guidance_source` → soft-law, else → regulation), sorts by the trailing index in the source id, strips the `family:` note prefix, normalizes nullable institution/runtimeAccessible/responseStatus. Page fetches `listCountryIntelligenceSources(\`country-${slug}\`)` in the existing Promise.all (deterministic id, no waterfall). DB rows were seeded from TS so display is identical until sources are edited. No schema change, no new migration. Source CRUD (F8C-2) and scalar structural fields (F8C-3) remain.

### F8B: Country profile admin editor + public editorial override (Claude Code, 2026-06-09) — 388 tests
Admin editor for `country_intelligence` editorial fields. New files: `src/app/admin/ai-regulation/countries/page.tsx` (index list of all profiles), `src/app/admin/ai-regulation/countries/[slug]/page.tsx` (per-country editor form), `src/app/admin/ai-regulation/countries/actions.ts` (`saveCountryProfileEditorial` server action, `assertAdminServerActionAccess`-gated, `upsertCountryIntelligence`), `actions.test.ts` (4 tests). Editable: publicSummary, implementationNotes, editorialNotes (one per line → `\n`-joined), missingSourceWarnings (one per line), reviewStatus, reviewedBy; `lastReviewedAt` refreshed on save. Structural fields (status/confidence/citation/authority maps) are NOT editable — preserved from existing row to prevent drift/content loss. Public page `src/app/ai-regulation/europe/[country]/page.tsx` now fetches `getCountryIntelligenceBySlug(profile.slug)` in the existing Promise.all and overrides publicSummary/editorialNotes/missingSourceWarnings with DB values when present (empty/null DB field → TS baseline). Discoverability link added to main admin page. `/admin/*` auth via `src/proxy.ts` middleware. Guardrails preserved: editorial text only, no auto-publish, no fabrication, structural legal content untouched.

### T-ING1: Firecrawl + Scrapling dual ingestion pipeline (Claude Code, 2026-06-08) — 384 tests
New ingestion track distinct from the existing cron/scan pipeline. Sources with `ingestion_method = firecrawl | scrapling | hybrid | existing` are routed through a new orchestrator. Firecrawl (Node.js `@mendable/firecrawl-js`) handles broad discovery; Scrapling Python sidecar (`scrapling_worker/` Flask app on port 8765) handles targeted structured extraction from official pages. Hybrid mode: Firecrawl `mapUrl` discovers links, Scrapling extracts each. URL normalization + SHA-256 content hash deduplication before insert. All items land as `raw_regulatory_items` with `processingStatus: "new"` — never auto-published. `INGESTION_SECRET` bearer token protects `/api/ingestion/run`. New tables/columns via migration 009 (pending remote Supabase apply). 8 EU + US seed sources defined in `src/agents/ingestion/seedSources.ts`. Scrapling worker config in `scrapling_worker/extractors/*.json`.

### T-SE1: Sweden live monitoring stack (Claude Code 1, 2026-06-06) — 348 tests
Files: swedenNewsSources.ts, swedenLegalNewsAgent.ts, sweden-ai-intelligence.ts, cron route + test, 3 scripts, scanProfiles entries (sweden_official_legal_scan / sweden_live_news_scan / sweden_verification_scan), page sections.
IMY = primary (high priority, 5-min cadence, candidate_for_monitoring; participated in EDPB ChatGPT investigation); DIGG + Regeringen = daily; swedenRegeringen added as third source; swedenImy upgraded from manual_reference to candidate_for_monitoring.
DIGG role under AI Act = preparing_or_partial; do not claim market-surveillance authority without a verified binding instrument.

### T-AT1: Austria live monitoring stack (Claude Code 1, 2026-06-06) — 343 tests
Files: austriaNewsSources.ts, austriaLegalNewsAgent.ts, austria-ai-intelligence.ts, cron route + test, 3 scripts, scanProfiles entries (austria_official_legal_scan / austria_live_news_scan / austria_verification_scan), page sections.
DSB = primary (high priority, 5-min cadence); RTR = needs_full_verification; DSB-NOYB documented not inferred.

### T-BE1: Belgium live monitoring stack (Claude Code 1, 2026-06-06) — 336 tests
Files: belgiumNewsSources.ts, belgiumLegalNewsAgent.ts, belgium-ai-intelligence.ts, cron route + test, 3 scripts, scanProfiles entries, page sections.
APD/GBA = primary; federal structure complexity explicitly surfaced as a verification gap.

### T-NL1: Netherlands live monitoring stack (Claude Code 1, 2026-06-06) — 331 tests
Files: netherlandsNewsSources.ts, netherlandsLegalNewsAgent.ts, netherlands-ai-intelligence.ts, cron route + test, 3 scripts, scanProfiles entries, page sections.
AP + RDI = primary; April 2026 consultation = only verified milestone; enacted designation instrument not verified.
Note: assessSourceCurrentness called with null descriptor (not a typed Netherlands descriptor) to avoid expanding RegionalMonitoringSourceDescriptor union.

### P-C3: Scan job durability (Codex 1, T-C3A–J, 2026-06-06)
Added in sequence: stale-job recovery (recoverStaleRunningScanJobs), queue drain (drainQueuedScanJobs), queueAndDrainScanJob for all route/cron callers, tryStartScanJob optimistic claim with lease metadata, lease heartbeat (leaseHeartbeatAt/IntervalMs/TimeoutMs), blockedByRunningJobs cooperative serial guard, processScanJob safety entrypoint (rejects non-queued/already-running), scan:worker-local local worker, admin-trigger harmonization (triggerSourceScan → queueAndDrainScanJob).
Result: cooperative serial execution model across all execution paths. Not yet a fully distributed lock.

### T-C4A: Runtime blocker ownership traceability (Codex 1, 2026-06-06)
Added structured `blockingRunningJobSummaries` to queue-drain/runtime results and propagated them through the manual scan route plus all cron routes.
Purpose: explain who is blocking a drain attempt (`leaseOwner`, source/trigger/requestedBy) and how fresh that running lease is (`startedAt`, `heartbeatAt`, `runningForMs`, `heartbeatAgeMs`, `heartbeatTimeoutMs`) without changing lock semantics.

### T-C4B: Local worker service hardening (Codex 1, 2026-06-08)
Added `scanWorkerRuntime.ts` with single-worker lease acquisition, stale-takeover rules, persisted status/heartbeat files, stop-file requests, and release helpers.
`scan:worker-local` now behaves more like a local service for the always-on machine, and `scan:worker-stop` can request a graceful stop without killing the process abruptly.

### T-C4C: Cursor-pagination primitives on heavy backend surfaces (Codex 1, 2026-06-08)
Added cursor-page repository/server contracts and implementations for `scan_jobs` and `discovery_leads`, plus narrow `updateRepository` wrappers for higher layers.
Also aligned `/ai-regulation` database-view pagination to `CursorPaginationControls`, fixing the mixed old/new pagination state that had been breaking global typecheck/lint/build.
Important boundary: this is only a partial `F1` advance; many admin/server surfaces still use offset/page-number pagination.

### T-C4D: Normalized country_intelligence storage groundwork (Codex 1, 2026-06-08)
Added repository contracts, memory/Supabase implementations, Supabase mappers, seed-backed fallback data, and `updateRepository` wrappers for `country_intelligence` + `country_intelligence_sources`.
The normalized rows are derived from the existing Europe profile layer, so this is a first extraction/storage slice only; pages still read `europe-member-state-implementation.ts` directly.

### T-C3B + F5 (Claude Code 1, 2026-06-06)
Admin scan-job section: color-coded status badges + recoverStaleJobs + drainNextQueuedJob server actions wired to P-C3 backend helpers.
F5: Poland (UODO + Ministry), Sweden (IMY + DIGG), Ireland (DPC + Dept Enterprise) added as first-wave profiles in europe-member-state-implementation.ts. getPriorityEuropeCountryProfiles() now includes PL, SE, IE.

### P-C1/P-C2: Discovery leads adoption (Codex 1 + Claude Code 1, 2026-06-05–06)
discovery_leads AiRegulationRepository: 5 methods (listDiscoveryLeads, listDiscoveryLeadsPage, getDiscoveryLeadById, createDiscoveryLead, updateDiscoveryLead). Admin diagnostics, steward, news, detail pages prefer dedicated table. Direct lookup by rawItemId (T-C2C). Lazy fallback on admin news (T-C2D). PaginationControls with pageParamKey on admin coverage panel (T-C2B). Legacy fallback preserved throughout.

---

## 9. Compressed Older History

**Two layers of detail exist across the documentation:**

1. **Full detailed entry** — only T-AT1 in `PROJECT_LOGBOOK.md` (the most recently completed phase; retained for direct handoff context).
2. **Brief summaries** — Section 8 above covers the 6 most recent phases (T-AT1, T-BE1, T-NL1, P-C3, T-C3B+F5, P-C1/P-C2, all from 2026-06-06 or spanning 2026-06-05/06). These brief summaries overlap intentionally with the Phase Index below; they are kept here for agent quick-start without reading the full logbook.
3. **One-liner Phase Index** — `PROJECT_LOGBOOK.md` Phase Index contains one-liner summaries for every phase from Foundation Hardening (early 2025) through T-BE1 (2026-06-06), including T-NL1, P-C3, and T-C3B+F5.

All phases before the Section 8 entries — everything prior to 2026-06-06 — are compressed into Phase Index one-liners in `PROJECT_LOGBOOK.md` and are not individually retained here.
