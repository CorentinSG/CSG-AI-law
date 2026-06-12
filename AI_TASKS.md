# AI_TASKS.md

## Current status

2026-06-12 - Codex, T-OPS2 (CLAIMED/in progress): outbound alerting for stale/degraded source transitions, consecutive scan failures, and optional daily review-backlog digest. Scope owned while open: `src/lib/alerting.ts`, `src/lib/env.ts`, `.env.example`, backend pipeline/scan-job/worker hooks, and targeted tests. Guardrails: optional webhook only, off when unset, no secrets/item content in payloads, alert failures never fail scans.

2026-06-12 — Claude Code, T-OPS7 (DONE, code part): homepage `src/app/page.tsx` switched from `force-dynamic` to ISR (`revalidate = 300`) — build now reports `/` as Static (Revalidate 5m), matching the other public pages; it only reads public non-personalized data so this is safe. Audit: `/ai-regulation` stays dynamic by design (renders from searchParams — ISR inapplicable, documented T-RT0C); ProfilePortrait already uses optimized `next/image` + priority LCP; JarvisOrb is a lightweight framer-motion animation. DEAD CODE found (not deleted per rules): `home-hero-visual.tsx`, `ui/demo.tsx`, `ui/splite.tsx` + the `@splinetool/react-spline` dep are imported by no route — Spline renders nowhere, so there was no homepage Spline cost to cut; safe to remove in a follow-up. 455 tests ✓ build ✓ lint ✓. REMAINING (user, needs running/prod app): run Lighthouse on `/`, `/ai-regulation`, a country page (target ≥90 desktop) + confirm ISR cache response headers in prod. Branch `ops/t-ops7-perf`.

2026-06-12 — Claude Code, T-OPS5 (DONE): verified the 4 remaining DPAs and migrated where a feed genuinely exists. Sweden IMY → added scannable RSS source `src-se-imy-ai` (`https://www.imy.se/nyheter/rss`, verified live RSS 2.0) with Swedish+English AI-term filtering — note: these 4 DPAs were NOT seeded scannable sources (only monitoring descriptors), so IMY is ADDED, completing its existing descriptor id. No-feed/blocked (documented, not wired): AP/NL (site returns HTTP 403 to this runtime — unverifiable, not invented), DSB/AT (no autodiscovery feed), DPC/IE (no autodiscovery feed). 455 tests ✓ typecheck ✓ lint ✓. On branch `ops/t-ops5-imy-rss` (open after T-OPS1 merges).

2026-06-12 — Claude Code, T-OPS1 (DONE pending PR merge): committed the whole working tree on branch `ops/t-ops1-commit-ci` as 6 logical commits by task ID (docs / harness+T-HAR+T-TST1 / runtime T-RT3A·2A·2B / sources T-RT3C·3B·3D / admin T-RT4A·4B·5B·5C / ci) + 9 pre-existing main commits; branch pushed. Added `.github/workflows/ci.yml` (push-to-main + PR: npm ci/test/lint/typecheck/build, Node 20, memory-mode placeholders, no secrets). Local gate green before push: 455 tests ✓ lint ✓ typecheck ✓ build ✓. REMAINING (user): open the PR (no `gh` CLI here) at https://github.com/CorentinSG/CSG-AI-law/pull/new/ops/t-ops1-commit-ci and merge once CI is green — only then is origin/main current. Codex: editing is unblocked; you may start T-OPS2. CI contract: tests assume memory mode; build env placeholders live in the workflow.

2026-06-11 - Codex, T-RT2B (done): added minimal scheduled-source cadence enforcement plus exponential failure backoff / bounded circuit-breaker behavior without any migration. New runtime decisions are derived from existing source health / scan logs (`buildSourceExecutionDecisions`), exposed through `sourceManager.getScheduledExecutionDecisionsForProfile`, and applied only to non-manual scans in the pipeline. When a source is not due or is cooling down after repeated failures, the pipeline records an honest scheduled skip in scan logs/results and does not mutate source freshness fields or source-health snapshots. Added focused execution-decision unit coverage plus a pipeline scheduled-skip integration test. Verification: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass. Remaining risk: this is intentionally conservative and profile-level cron jobs still enqueue normally; the new logic suppresses source work inside scheduled runs rather than introducing per-source queue fan-out.

2026-06-11 - Codex, T-RT2A (done): added an env-flagged enqueue-only mode for admin/cron scan routes via `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true`. `queueAndDrainScanJob` now accepts `executionMode`, and when set to `enqueue_only` it only queues work after stale-job recovery, returning an honest queued-only shape (`processedJob: null`, `queuedJobProcessedImmediately: false`) without inline drain attempts. Wired the admin API plus all country/global cron routes to pass `drain` vs `enqueue_only`, documented the flag in `.env.example`, and added focused processor/route coverage. Verification: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass. Remaining risk: this is route-level only by design; admin server actions still use the existing inline-drain path and should not be “fixed” accidentally unless we explicitly widen the scope.

2026-06-11 - Codex, T-RT3A (done): added a shared conditional fetch layer for connectors with reusable `ETag` / `Last-Modified` validators plus content-hash short-circuit fallback. RSS/API/static connectors now skip unchanged sources cleanly, and pipeline source updates persist `runtimeFetchState` in `source.config` for reuse on the next scan. Added focused conditional-fetch + pipeline coverage. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.

2026-06-11 - Codex, T-RT5B (done): added persisted country-profile `needs_re_review` support and a dedicated country-profile editorial audit trail. Added `src/db/migrations/011_country_profile_review_audit.sql`, repository/memory/Supabase support for `country_profile_review_events`, deterministic `computeCountryNeedsReReview`, and admin action logging on country editorial saves. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.

2026-06-11 - Codex, T-RT4A (done): added backend-only opt-in AI review-assist metadata persistence on `rawMetadata.reviewAssist` when live AI processing is explicitly allowed and succeeds. Metadata stores AI-suggested classification/summary for admin review only and does not alter publication/citation safeguards. Targeted pipeline coverage added. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.

2026-06-11 - Codex, T-HAR4 (done): extended deterministic built-in harness replay runners to more pure backend pipeline stages: `ai_planning_batch`, `scan_diagnostics_messages`, `scan_status_derivation`, and `deduplicator_hash`, with explicit replay-runner precedence and targeted harness coverage. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

2026-06-11 - Codex, T-HAR3 (done): added deterministic built-in harness replay runners for additional local pipeline stages beyond relevance filtering: `ai_classifier`, `deadline_extractor`, `obligation_extractor`, and `ai_summarizer`, with targeted harness coverage and updated runner docs. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

2026-06-11 - Codex, T-HAR2 (done): strengthened the harness replay/regression layer with built-in replay runners, reusable regression-case fixtures, a generic fixture-backed regression test, CLI regression export support, and key-order-stable replay comparison so real failures can become deterministic regression artifacts faster. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

2026-06-11 - Codex, T-TST1 (done): stabilized backend test/typecheck hygiene by removing avoidable dynamic-import overhead in the slow Vitest files (`dataSteward-sync`, `aiSmokeTest-fallback`, `admin actions`) with hoisted mocks + static imports, and aligned `memory-repository.test.ts` with the current `CountryIntelligenceInput` shape. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` now pass.

2026-06-11 - Codex, T-HAR1 (done): wired minimal harness trace capture into `src/agents/ai-regulation/processors/pipeline.ts` so source-scan, candidate-processing, and OpenAI-processing failures emit structured `failure_report=` messages; `scanDiagnostics` now preserves structured messages verbatim; targeted pipeline/harness tests added and passing.

2026-06-11 — Claude Code, T-RT4B + T-RT5C (DONE — Codex contracts T-RT4A/T-RT5B now landed): (T-RT4B) review queue is prioritized (needs_review → authority tier → recency via `getAuthorityPriorityRank`) AND now surfaces the opt-in AI review-assist suggestion (`rawMetadata.reviewAssist`) in `AdminReviewQueue.tsx`, clearly labeled "AI suggestion · unverified", never applied to the record. (T-RT5C) `countries/page.tsx` shows the persisted `needsReReview` flag as a badge (overdue/due-soon tone via shared `country-review.ts` thresholds) AND lists unresolved discovery leads matching each country (`listDiscoveryLeads` grouped by `possibleJurisdiction`) with a "Verify on official source" follow-up action. Full suite 455 tests ✓ typecheck ✓ lint ✓.

2026-06-11 — Claude Code, T-RT3B: implemented the official Legifrance DILA/PISTE API connector (`apiProvider: "legifrance"` in `api-connector.ts`, OAuth2 client-credentials, defensive result mapping) with tested missing-credential + error fallbacks; declared `LEGIFRANCE_PISTE_CLIENT_ID/SECRET` (env.ts + .env.example); wired activation knobs on `src-fr-legifrance-ai` (stays on scraping fallback until PISTE creds exist — live path unverified, no credentials).

2026-06-11 — Claude Code, T-RT3D (in progress, one country at a time): migrated to verified official RSS feeds with mandatory AI-term filtering — Italy Garante `src-it-garante-ai` (`/o/gpdp-rss/rss?t=news`), Germany BfDI `src-de-bfdi-ai` (`/SiteGlobals/Functions/RSSFeed/Allgemein/rssnewsfeed.xml?nn=252136&archiv=true`), Italy AgID `src-it-agid-ai` (`/it/rss.xml`). No-feed (stay scraped, verified): Spain AEPD (email newsletter only), Spain AESIA (no autodiscovery feed). Not yet checked: non-seeded DPAs (AP/NL, DSB/AT, IMY/SE, DPC/IE). Bundesregierung/Bundestag are parliament/govt single-doc anchors, out of DPA/regulator scope.

2026-06-11 — Claude Code delivered T-RT3C: EUR-Lex structured document channel for the AI Act + article-level pinpoint extraction in `eurLexAiActParser.ts` (CELEX + article/annex/chapter/recital, only when genuinely extracted), wired into `static-page-connector.ts`, with source `src-eur-lex-ai-act` registered.

2026-06-10 — Claude Code delivered the minimal agent harness (`src/agents/harness/`, `scripts/replay-failure.ts`). Future wiring into `processors/pipeline.ts` is unassigned.

## Claude Code owns

- Frontend structure
- UX and product flow
- High-level architecture
- Large refactors when assigned

## Codex owns

- Backend routes
- Database schema
- Tests
- Scripts
- Focused implementation patches when assigned

## Locked files

None currently. (`src/agents/harness/` was authored by Claude Code; Codex may extend it via the wiring task below.)

## Active task

Codex owns T-OPS2 (CLAIMED/in progress): outbound alerting. T-OPS1 complete (branch pushed; PR awaiting user open+merge). Editing unblocked. Codex sequence after T-OPS2: T-OPS6 → T-OPS4. Claude Code next: T-OPS3 (blocked on user hosting choice) → T-OPS5 → T-OPS7.

## Program P-OPS — production hardening (planned 2026-06-11, user-approved)

Context for both agents (full review done 2026-06-11): P-RT is essentially delivered (455 tests, ISR live, 10 crons, cadence/backoff, conditional fetch, review-assist, re-review audit). The remaining weaknesses are operational, in priority order: (1) ~73 modified files are sitting UNCOMMITTED in the working tree, (2) there is no CI — "all green" claims are only as good as the last local run, and the full suite is flaky under load (5 auth-rejection route tests hit the 5s timeout when the whole suite runs, pass in isolation and on rerun), (3) T-RT1B outbound alerting was never built — a dead source is still only visible by opening the admin dashboard, (4) the worker and the Scrapling sidecar are not deployed, so enqueue-only mode cannot be enabled and scrapling/hybrid sources are dead, (5) T-RT3D has 4 DPAs left unchecked (AP/NL, DSB/AT, IMY/SE, DPC/IE), (6) no production health endpoint / uptime monitoring.

Execution rules for this program:
- T-OPS1 runs FIRST and ALONE. Neither agent edits any repo file while T-OPS1 is in progress (it commits the whole working tree). Claim it explicitly.
- After T-OPS1: Codex sequence is T-OPS2 → T-OPS6 → T-OPS4. Claude Code sequence is T-OPS3 → T-OPS5 → T-OPS7. One task per agent at a time.
- File-ownership boundaries during the program: `src/lib/env.ts` + `.env.example` belong to Codex while T-OPS2 is open (Claude must not touch them); `vercel.json`, `.github/**`, `docs/**`, source registries and `src/content/**` belong to Claude Code; repository/processor/test files belong to Codex. Any contract a task exposes must be stated in its completion note so the consumer task can start.
- Guardrails restated: no auto-publish, AI off by default, token/scan/budget limits untouched, no secrets in code or alert payloads.

### T-OPS1 (Claude Code) — Commit the in-flight work + CI pipeline

- Objective: zero uncommitted work; every future push verified by CI instead of trusting local runs.
- Steps: (a) group the ~73 modified/untracked files into logical commits per task ID (T-RT2A/2B/3A/3B/3C/3D-partial/4A/4B/5B/5C, harness T-HAR1–4, T-TST1, AGENTS/AI_TASKS/DECISIONS doc reorg); (b) push; (c) add `.github/workflows/ci.yml`: on push + PR, run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` (Node 20, no secrets needed — tests run in memory mode).
- Success criteria: `git status` clean; CI workflow green on GitHub for the pushed head.
- Files: `.github/workflows/ci.yml` (new) only; everything else is commits, not edits.
- Verification: CI run visible green; local suite green before push.

### T-OPS2 (Codex) — Outbound alerting (delivers the missing T-RT1B)

- Objective: failures announce themselves; nobody has to open the dashboard to learn a source died.
- Scope: new `src/lib/alerting.ts` posting JSON to `ALERT_WEBHOOK_URL` (new env var, optional, feature OFF when unset — works with Slack/Discord-style webhooks). Trigger points: (a) a source transitions to `stale`/`degraded` per the T-RT1A freshness summaries, (b) N consecutive scan failures on one source (reuse the backoff counters from T-RT2B), (c) optional daily digest of `needs_review` backlog size, emitted at most once per day (guard via existing scan-log/state, no new table). Fire-and-forget with short timeout; alerting failure must NEVER fail a scan. No item content or secrets in payloads — source id, state, counts, timestamps only.
- Success criteria: unit tests for trigger conditions + payload shape; a forced-failure test proves scans succeed when the webhook is down; env documented in `.env.example`.
- Files: `src/lib/alerting.ts` (new), `src/lib/env.ts`, `.env.example`, hooks in `processors/pipeline.ts` / `scanJobs.ts` / worker runtime, targeted tests.
- Out of scope: any UI, any email provider integration (webhook only for now).

### T-OPS3 (Claude Code) — Deploy worker + Scrapling sidecar, enable enqueue-only (ops)

- Objective: no scan ever executes inline in a Vercel request; scrapling/hybrid sources become operational; high-priority sources actually polled sub-hourly via the worker loop (cadence logic from T-RT2B already decides per-source due-ness).
- Steps: (a) stand up the hardened worker (`scan:worker-local`) as a permanent process on the always-on machine OR a small Railway/Fly service — needs user choice; (b) deploy `scrapling_worker/` alongside it and set `SCRAPLING_WORKER_URL` in Vercel; (c) once the worker heartbeat is verified live, set `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` in Vercel; (d) write `docs/RUNBOOK.md`: start/stop/monitor the worker, what to check when a cron returns queued-only, how to roll back the flag.
- Success criteria: worker heartbeat file/status fresh in production; a cron-triggered job is drained by the worker (leaseOwner `local-worker`), not inline; one scrapling-method source produces items.
- Files: `docs/RUNBOOK.md` (new), deployment configs; NO changes to backend logic (T-RT2A/2B shipped the code paths — do not modify them).
- Depends on: user decisions (hosting choice, env var setting in Vercel dashboard).

### T-OPS4 (Codex) — Test-suite reliability + golden connector fixtures

- Objective: CI never cries wolf; parser drift on official sources is caught deterministically.
- Scope: (a) fix the flaky full-suite failures — the auth-rejection tests in cron/scan route tests time out at 5s under parallel load (pass in isolation): raise per-test timeout where justified, or reduce worker parallelism in `vitest.config.ts`, or isolate whatever shared state (rate-limiter import, env loading) makes them slow under load — diagnose first, then fix root cause; (b) add recorded golden fixtures (real saved RSS/API/HTML payloads) for each high-priority connector path (Legifrance PISTE mapping, EUR-Lex parser, the migrated RSS feeds) as deterministic regression tests via the existing harness fixture layer (T-HAR2–4).
- Success criteria: 3 consecutive full-suite runs green; new fixture tests fail when a parser's mapping is changed deliberately (prove with a temporary mutation, then revert).
- Files: `vitest.config.ts`, route test files, `src/agents/harness/**` fixtures, connector tests.

### T-OPS5 (Claude Code) — Finish T-RT3D: remaining DPA RSS migration

- Objective: every high-priority regulator source uses an official structured feed when one exists.
- Scope: verify and migrate AP (NL), DSB (AT), IMY (SE), DPC (IE) to verified official RSS feeds with the mandatory AI-term filtering, same pattern as Garante/BfDI/AgID; where no feed exists, record that honestly in the source note (like AEPD/AESIA) and leave scraping in place. Do not invent feed URLs — verify each one responds with real XML before committing it.
- Success criteria: each of the 4 sources either on a verified feed or explicitly documented as no-feed; tests updated; suite green.
- Files: source registries (`{country}NewsSources.ts`), seeds, source notes.

### T-OPS6 (Codex) — Production health endpoint

- Objective: one URL tells an external monitor whether the system is alive end to end.
- Scope: `GET /api/health` returning JSON: db reachable, newest successful scan age (global + per profile family), worker heartbeat age when available, pending `needs_review` count, app version/commit. Cheap queries only (no broad scans). Auth: allow unauthenticated but return only coarse booleans/ages publicly, full detail with `CRON_SECRET` bearer. Tests for both auth tiers.
- Success criteria: endpoint answers <1s against Supabase; route tests green.
- Files: `src/app/api/health/route.ts` (+ test), small repository read helpers if needed.

### T-OPS7 (Claude Code) — Public performance pass

- Objective: fast public pages measured, not assumed.
- Scope: verify ISR actually serves cached HTML in prod (response headers); audit the homepage Spline runtime cost (`@splinetool/*` is heavy — lazy-load it or replace with a static visual on mobile if it tanks the score); lazy-load below-the-fold heavy components; run Lighthouse on `/`, `/ai-regulation`, one country page; fix what the audit surfaces within UI files.
- Success criteria: Lighthouse performance ≥ 90 on the three audited pages (desktop), no regression in tests/build.
- Files: public page/components files only.

### User actions needed (not agent work)

1. Choose worker hosting (always-on machine vs Railway/Fly ~5€/mo) — blocks T-OPS3.
2. Create a webhook for alerts (Slack/Discord) and set `ALERT_WEBHOOK_URL` in Vercel — activates T-OPS2.
3. Register for Legifrance PISTE credentials (free, piste.gouv.fr) and set the two env vars — activates the T-RT3B connector.
4. Optional: point an uptime monitor (e.g. UptimeRobot, free) at `/api/health` once T-OPS6 ships.

## Handoff rule

Keep handoffs under 15 bullet points. Do not use this file as a chat log.

## Execution rule

Every non-trivial task should have:

- Assumptions
- Success criteria
- Files likely to change
- Verification command or explanation if verification is unavailable
