# AI Agent Master Context

Project: `c-saint-girons-ai-law-intelligence` — C. Saint-Girons, Esq | AI Law & Legal Intelligence
Purpose: fast-start machine context for AI agents resuming work. Repository code is the final authority over this file.
Last synchronized: 2026-06-20 (Cowork A–F hardening: HTTP security headers, timingSafeEqual admin auth, error.tsx boundaries, listDistinctFilterValues perf, explicit DB selects, pipeline refactor + finalizeSourceScan extraction, TraceabilityMetadata typed interface, 19 integration tests, IntelligenceSummaryBand, EmptyFilterState, migrations 006+007 authored, AI_PROCESSING_ENABLED deprecated, upstash-rate-limit.ts scaffolded; tsc+lint+tests all green; changes uncommitted in working tree — Claude Code must commit + apply migrations to Supabase)

---

## 1. Active Operating Context

**Current state (2026-06-20):**
- Test suite: green (19 new integration tests added in Cowork A-F session); tsc + lint + vitest all PASS
- **COWORK-A-F uncommitted**: all A-F changes live in the working tree but not committed — Claude Code must commit before merging (see AI_TASKS.md COWORK-A-F entry)
- **Graphify graph**: 3270 nodes / 8562 edges / 192 LLM-named communities; auto-rebuild via git hooks (post-commit, post-checkout); query via `graphify`/`py -m graphify`; graph stored in `graphify-out/` (gitignored)
- **T-OPS9-UX**: WIP on `ops/t-ops9-ux` — Spline dead-deps removal + not-found.tsx + loading.tsx skeletons pending

- **2026-07-16 ops note**: CourtListener token is configured on Vercel/Railway main worker. PISTE credentials are configured too; Judilibre now accepts either direct `JUDILIBRE_API_KEYID` or PISTE OAuth fallback through `LEGIFRANCE_PISTE_CLIENT_ID/SECRET`. Do not print secrets in docs or handoffs.
- **2026-07-17 EUR-Lex ops note**: EUR-Lex SOAP webservice support is implemented as optional `apiProvider: "eurlex"` for `src-eur-lex-ai`; set `EURLEX_USERNAME` and `EURLEX_PASSWORD` only in Vercel/Railway env. Treat results as official EU legal database records, but still verify instrument form, binding status, CELEX/date/pinpoint, and AI relevance before relying on them in the legal database.
- **2026-07-18 live monitoring ops note**: the central scheduler is now wired both as a Hobby-safe daily fallback at `/api/cron/ai-regulation-central-scheduler` in `vercel.json` and as the primary Railway worker self-scheduler. `scripts/run-scan-job-worker.ts` enqueues EU/US/International sweeps by cadence (`live` every 15m, `hourly` every 1h, `daily` every 24h), with recent non-failed duplicate suppression in `enqueueCentralMonitoringSchedule()`. Operators can tune the live interval with `SCAN_JOB_WORKER_ENABLE_SCHEDULER` and `SCAN_JOB_WORKER_SCHEDULER_INTERVAL_MS`.
- **2026-07-18 EU AI entertainment note**: `scripts/backfill-eu-ai-entertainment.ts` publishes the EU-level AI + entertainment baseline for copyright/generative AI, synthetic-media/deepfake labelling, UGC platform filtering, DSA recommender transparency, and creative-sector policy/news. Official EU sources are legal-database entries; the creative-sector reaction item is reliable live-news/discovery only and must not be cited as legal authority without official confirmation.
- **2026-07-18 legal database note**: `scripts/backfill-europe-case-law-baseline.ts` converts `europeAiCaseLawEntries` into published Supabase legal-database entries when they carry official court/regulator source references. It is idempotent by raw-item hash and should be extended before adding ad hoc case-law rows.
- **2026-07-16 International backend note**: International now has dedicated scan profiles, source registry, supervisor/scheduler coverage, and migration `026_international_monitoring_sources.sql` for UNESCO, UN, WIPO, IEEE, international NewsAPI, and international GDELT. Treat this layer as transnational governance/soft law/standards, not binding national law by default.

**Previous state (2026-06-10, preserved for reference):**
- Test suite: 402 tests | lint | typecheck | build — all green
- **Production deployment**: site live at https://csg-ai-law.vercel.app — GitHub repo CorentinSG/CSG-AI-law (private); Vercel project csg-ai-law; Framework Preset: Next.js; env vars set: APP_DATA_MODE=supabase, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_AUTH_SECRET, CRON_SECRET, INGESTION_SECRET, FIRECRAWL_API_KEY, AI_ENABLE_PROCESSING=false; SCRAPLING_WORKER_URL not yet set
- 9 EU countries with full live monitoring stack: FR, DE, ES, IT, NL, BE, AT, SE, IE
- 1 EU country with first-wave profile only (no live stack): PL
- Scan runtime: P-C3 complete — queue-drain semantics, optimistic claim, lease heartbeat, blockedByRunningJobs guard, local worker, structured blocker ownership summaries
- **P-RT1A done**: backend source runtime health summaries now exist in `src/agents/ai-regulation/sourceRuntimeHealth.ts`, combining `source_health_checks`, scan logs, scan jobs, and ingestion logs into per-source `healthy/degraded/stale/inactive` states with cadence-aware thresholds and consecutive failure counts
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
- **F6** ✓ — Upstash Redis rate limiting activated 2026-06-11: `UPSTASH_REDIS_REST_URL`/`_TOKEN` set in Vercel; scan route now distributed-rate-limited (5/60s per IP), in-memory fallback retained for local/dev
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
- LOCUS-v1 (`https://huggingface.co/datasets/davidyinyan/LOCUS-v1`) is U.S.-only local-law discovery corpus material, not official legal authority. LOCUS hits may become private `DiscoveryLead` records only, with `requiresOfficialSource=true` in reviewer metadata and `publicVisibilityAllowed=false`; conversion requires accessible official municipal/county text, verified jurisdiction/date/citation/pinpoint, AI relevance, and admin review.
- CourtListener/RECAP is registered as an optional U.S. case-law discovery source (`src-us-courtlistener-ai`). Runtime accepts `COURTLISTENER_API_KEY` or `COURTLISTENER_API_TOKEN`; without one it must degrade honestly as missing credentials. CourtListener accelerates discovery only: official court citations, dates, jurisdiction, docket/case identifiers, and legal relevance remain mandatory before verified legal-database reliance.
- Public Standards coverage now includes a dedicated International lane (`internationalAiStandardsBaseline`) for ISO/IEC AI standards, OECD AI Principles, UNESCO AI Ethics Recommendation, and IEEE 7000. Treat these as standards, governance frameworks, or soft law; they are not binding law unless incorporated by a legal/procurement/contractual source.
- Public AI Regulation overview now links three region hubs: Europe, United States, and International. The International hub route is `/ai-regulation/international` and surfaces international standards, soft law, global-governance signals, and published international database entries without collapsing them into EU or U.S. law.

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
- Token-efficiency rule: before writing to the other agent, check the live board, then the Decision / Agreement Log, then Inter-agent comments; only write on claim, ownership change, blocker, handoff, or completion

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
- Self-scheduler: enabled by default; enqueues the central EU/US/International monitoring plan by cadence (`live` 15m, `hourly` 1h, `daily` 24h) and relies on scheduler-level duplicate suppression when Vercel cron also fires
- Runtime helper: `src/agents/ai-regulation/processors/scanWorkerRuntime.ts`
- Service hardening: singleton lease file, persisted status/heartbeat file, stop-file request support, signal-aware graceful shutdown
- Helper command: `npm run scan:worker-stop`
- Env: `SCAN_JOB_WORKER_POLL_MS`, `SCAN_JOB_WORKER_MAX_JOBS_PER_CYCLE`, `SCAN_JOB_WORKER_IDLE_EXIT_AFTER`, `SCAN_JOB_WORKER_CONTINUE_ON_ERROR`, `SCAN_JOB_WORKER_ENABLE_SCHEDULER`, `SCAN_JOB_WORKER_SCHEDULER_INTERVAL_MS`, `SCAN_JOB_WORKER_STATE_DIR`, `SCAN_JOB_WORKER_SINGLETON_STALE_MS`
- Production: Railway Node 22 worker drains Supabase `scan_jobs`; `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` keeps Vercel routes from inline-draining

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

## 8. Recent Phases (compressed)

Per-phase prose lives in `PROJECT_LOGBOOK.md` (one-liner Phase Index) and `git log`. This section is intentionally short to save tokens.

**Latest milestone (2026-06-22):** async scan infra live (Railway Node-22 worker + Supabase `scan_jobs` + Vercel enqueue-only cron) and end-to-end monitoring proven — a real queued job was drained by the worker to `succeeded`; `/api/health` returns ok=true (DB reachable, worker idle, no stuck jobs). Scrapling extraction bug fixed (old import + missing fetchers extra). Firecrawl still needs an E2E run from the runtime that holds `FIRECRAWL_API_KEY` (not exercisable locally).

**Admin/UX hardening (2026-06-10→11):** dashboard system-status band reading the canonical `health.worker` (state/lastActivity) + stuck-job signal; integrations/env-vars panel from `listAgentApiCapabilities()`; batch-review queue with `priorityReasons` + shift-range/quick-select; news views signal discovery/admin-only sources; system-health strip. F8 complete (country content fully DB-backed + editable); F6 Upstash rate limiting active; P-RT0 done.

For anything older, read the Phase Index in `PROJECT_LOGBOOK.md`, not this file.
