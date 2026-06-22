# AI_TASKS.md

> **How to use this file (read `AGENTS.md` → "Coordination protocol" for the full rules).**
> This is the single source of truth for project progress. Two layers, never mixed: progress lives here; code structure lives in the Graphify graph / Obsidian vault (query it, do not restate it here).
> Start every session with the **Sync ritual**; end every unit of work with a **Handoff entry**. Append-only, own-rows-only.

## Status board (live — at-a-glance project state)

Each agent edits only its own rows. Status vocabulary: `CLAIMED` · `WIP` · `BLOCKED` · `REVIEW` · `DONE-LOCAL` · `MERGED` · `HANDOFF→<agent>`.

| Task ID | Owner | Status | Branch @ sha | Locked files | Graph anchor | Updated |
|---|---|---|---|---|---|---|
| TOOLING-GRAPH-PROTOCOL | Claude Code | REVIEW | `ops/t-ops9-ux` @ `30bc31c` | `AGENTS.md`, `AI_TASKS.md`, `.gitignore`, `.git/hooks/*` | n/a (tooling, no app code) | 2026-06-20 |
| T-OPS9-UX | Claude Code | WIP | `ops/t-ops9-ux` @ `30bc31c` | `src/app/**`, shared UI components | community "UI Components and Utilities", "Intelligence Hub UI" | 2026-06-20 |
| T-LEGALDB-UI | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/ai-regulation/legal-database/**`, `src/app/admin/ai-regulation/page.tsx` | `deriveUpdateAuthorityType()`, `getAuthorityPriorityRank()`, `FilterBar`, community "News and Regulation Admin" | 2026-06-20 |
| T-LEGALDB-DB | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `cbf3eed` | `src/db/migrations/**`, `src/db/repository-types.ts`, repositories, ingestion agents | `RegulatoryUpdateFilters`, `AiRegulatoryUpdate`, community "DB Repository Layer", "Scan Pipeline" | 2026-06-20 |
| T-ADMIN-DASH | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/page.tsx`, `src/app/admin/ai-regulation/page.tsx` | `listGlobalMonitoringAgents()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, community "News and Regulation Admin" | 2026-06-20 |
| T-ADMIN-OPS (P1) | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/operations/**`, `src/components/site/ops-health-band.tsx`, `src/app/admin/page.tsx` | `buildHealthSnapshot()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, community "Source Runtime Health" | 2026-06-20 |
| T-ADMIN-OPS-API (P5a) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `e264572` | `src/lib/admin-operations-summary.ts`, `src/app/api/admin/operations/summary/route.ts`, related tests | `buildAdminOperationsSummary()`, `buildHealthSnapshot()`, `getSourceRuntimeHealthSummaries()`, community "Source Runtime Health", community "Admin Authentication" | 2026-06-20 |
| T-BATCH-REVIEW-API (P2a) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `069210e` | `src/lib/admin-review-batch.ts`, `src/app/api/admin/review/batch/route.ts`, related tests | `batchTransitionReviewStatus()`, `listPrioritizedReviewQueue()`, `reviewWorkflow`, community "Admin Authentication", community "Admin Review and Summaries" | 2026-06-21 |
| T-COURTLISTENER-CONNECTOR (P3a) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `155bc08` | `src/agents/ai-regulation/connectors/api-connector.ts`, `src/lib/env.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, tests | `ApiConnector`, `listAgentApiCapabilities()`, community "API Connectors and Legal Docs", community "Agent API Capabilities" | 2026-06-21 |
| T-LEGAL-DATA-HUNTER-CONNECTOR (P3b) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `f78c9e4` | `src/agents/ai-regulation/connectors/api-connector.ts`, `src/lib/env.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, tests | `ApiConnector`, `listAgentApiCapabilities()`, community "API Connectors and Legal Docs", community "Agent API Capabilities" | 2026-06-21 |
| T-CENTRAL-SCHEDULER (P4) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `c8af9d4` | `src/agents/ai-regulation/scheduler/**`, `src/app/api/cron/ai-regulation-central-scheduler/**`, `src/agents/ai-regulation/processors/scanJobs.ts` | `buildCentralMonitoringSchedule()`, `enqueueCentralMonitoringSchedule()`, `queueScanJob()`, community "Scheduler Implementation", community "Scan Job Management" | 2026-06-21 |
| T-WORKER-RAILWAY (P0) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `ab63d39` | `package.json`, `package-lock.json`, `railway.json`, Railway/Vercel/Supabase runtime config | `drainQueuedScanJobs()`, `createScanWorkerConfig()`, community "Scan Job Management" | 2026-06-22 |
| T-AUDIT-HARDENING | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `ab63d39` | `src/content/ai-regulation/news.ts`, `src/lib/health.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/lib/admin-review-batch.ts`, related tests | `buildNewsItemFromUpdate()`, `buildHealthSnapshot()`, `listAgentApiCapabilities()`, `listPrioritizedReviewQueue()`, community "Source Runtime Health", community "Admin Review and Summaries" | 2026-06-22 |
| T-SITE-HEALTH-AUDIT | Codex | REVIEW | `ops/t-ops9-ux` @ `0ec9ac7` | none (audit-only) | `buildHealthSnapshot()`, `buildAdminOperationsSummary()`, `queueScanJob()`, community "Source Runtime Health", community "Scan Job Management" | 2026-06-22 |
| T-NEWS-BACKFILL-INTEGRITY | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ working tree | `src/content/ai-regulation/news.ts`, `src/lib/news-backfill.ts`, `scripts/backfill-news-items.ts`, `src/db/seed/seed-profiles.ts`, related tests | `buildNewsItemFromUpdate()`, `backfillNewsItemsFromUpdates()`, `buildLegalDatabaseIntegrityReport()`, community "News and Regulation Admin", community "DB Repository Layer" | 2026-06-22 |
| T-INGESTION-RUNTIME | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ working tree | `src/agents/ingestion/**`, `scrapling_worker/**`, `src/agents/ai-regulation/agentApiCapabilities.ts` | `scraplingExtract()`, `firecrawlService.ts`, `listAgentApiCapabilities()`, community "Data Ingestion Pipeline", community "Scrapling Extraction Service", community "Agent API Capabilities" | 2026-06-22 |
| T-BATCH-REVIEW-UI (P2b) | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/ai-regulation/review/**`, `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/page.tsx` | `listPrioritizedReviewQueue()`, `batchTransitionReviewStatus()`, `bulkUpdateReviewStatus`, community "Admin Review and Summaries" | 2026-06-21 |
| T-BUILD-FIX | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `bf0d746` | `src/app/page.tsx`, `src/components/site/update-card.tsx` | `UpdateCard`, community "UI Components and Visual Elements" | 2026-06-21 |
| T-E2E (P6) | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `aa0346c` | `playwright.config.ts`, `e2e/**`, `vitest.config.ts`, `package.json`, `.gitignore` | n/a (test harness) | 2026-06-21 |
| COWORK-A-F | Cowork (Claude) | DONE-LOCAL | working tree (uncommitted) | none | community "Scan Pipeline", "DB Repository Layer", "Intelligence Hub UI" | 2026-06-20 |

- **Graph freshness:** built from `30bc31ca` — in sync with HEAD `30bc31c`. If these diverge, run `py -m graphify update .` before trusting the graph.
- Move a task to `MERGED` only once it is in `main`; delete its row one entry after it merges (the log keeps the history).

## Handoff entry format (copy this for every new log entry below)

```
YYYY-MM-DD · <Agent> · <TASK-ID> · <STATUS>
- Intent:        one line — what and why
- Files:         paths changed (or "none")
- Graph anchors: exact node/community labels for `explain`/`affected`
- Verification:  test / lint / typecheck / build (or why not run)
- Branch/commit: <branch> @ <short-sha>
- Next:          who owns the next step, or blockers
```

## Current status

2026-06-22 · Codex · T-INGESTION-RUNTIME · DONE-LOCAL
- Intent:        Make Firecrawl/Scrapling operational instead of merely present by exposing capability state, fixing Scrapling source routing, and adding Railway-ready sidecar config.
- Files:         `src/agents/ingestion/scraplingClient.ts`, `src/agents/ingestion/scraplingClient.test.ts`, `scrapling_worker/worker.py`, `scrapling_worker/railway.json`, `scrapling_worker/README.md`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`.
- Graph anchors: `scraplingExtract()`, `firecrawlService.ts`, `listAgentApiCapabilities()`, community "Data Ingestion Pipeline", community "Scrapling Extraction Service", community "Agent API Capabilities".
- Verification:  `npm test` PASS (105 files / 551 tests) · `npm run lint` PASS with one pre-existing warning in `article-carousel.tsx` · `npm run typecheck` PASS · preview-env `npm run build` PASS · Python compile PASS via `py -m compileall scrapling_worker` · Vercel env list confirms `FIRECRAWL_API_KEY` exists in Production/Preview and `SCRAPLING_WORKER_URL` is absent · Railway CLI available but not authenticated, so service creation is blocked until operator login.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Codex/operator deploys `scrapling_worker` as a Railway service after `railway login`, then sets `SCRAPLING_WORKER_URL`; Firecrawl is ready once this branch is deployed.

2026-06-22 · Codex → Claude Code · T-NEWS-BACKFILL-INTEGRITY · DONE-LOCAL
- Intent:        Fill the live `news_items` table from existing monitor updates and harden visibility so internal smoke-test/discovery-only leads cannot appear as public legal news.
- Files:         `src/content/ai-regulation/news.ts`, `src/content/ai-regulation/news.test.ts`, `src/lib/news-backfill.ts`, `src/lib/news-backfill.test.ts`, `scripts/backfill-news-items.ts`, `package.json`, `src/db/seed/seed-profiles.ts`, `src/agents/ai-regulation/legalIntegrity.test.ts`, `AI_TASKS.md`, `PROJECT_LOGBOOK.md`.
- Graph anchors: `buildNewsItemFromUpdate()`, `backfillNewsItemsFromUpdates()`, `buildLegalDatabaseIntegrityReport()`, community "News and Regulation Admin", community "DB Repository Layer", community "API Connectors and Legal Docs".
- Verification:  `npm test -- src/agents/ai-regulation/legalIntegrity.test.ts` PASS · `npm test -- src/lib/news-backfill.test.ts` PASS · `npm test -- src/content/ai-regulation/news.test.ts` PASS · `npm run backfill:news-items` dry-run PASS (`329` scanned, `327` would upsert) · `npm run backfill:news-items -- --write` PASS against Supabase (`327` upserted, final `95` public / `232` admin-only) · live DB query confirms `badPublic: []` for discovery-only/smoke-test public news · `npm run report:data-quality` PASS with integrity `high=0`, `medium=18`.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Codex should finish full verification/build and commit/push. Claude can treat `/news` as populated now; remaining content-quality work is citation research for the 18 medium findings and review-backlog reduction, not emergency infra.

2026-06-22 · Codex → Claude Code · T-SITE-HEALTH-AUDIT · REVIEW
- Intent:        Audit local and live site health after the worker/API/news/database hardening.
- Files:         none (audit-only; no code edits).
- Graph anchors: `buildHealthSnapshot()`, `buildAdminOperationsSummary()`, `queueScanJob()`, `listAgentApiCapabilities()`, community "Source Runtime Health", community "Scan Job Management", community "API Connectors and Legal Docs".
- Verification:  `agent-sync.ps1` PASS · `npm test` PASS (102 files / 540 tests) · `npm run typecheck` PASS after transient admin-page mismatch resolved in working tree · `VERCEL_ENV=preview ADMIN_USERNAME=csg-admin ADMIN_PASSWORD=<set> npm run build` PASS · `npm run test:e2e` PASS (12/12) · live public routes `/`, `/api/health`, `/ai-regulation`, `/news`, `/research`, `/ai-regulation/europe/france`, `/ai-regulation/united-states/new-york` all HTTP 200 with redirects followed · admin operations summary HTTP 200 with Basic Auth · live DB shows recent Vercel cron jobs drained by Railway worker.
- Branch/commit: `ops/t-ops9-ux` @ `0ec9ac7`
- Next:          Codex should fix the remaining product/integration gaps: production is still serving commit `ab63d39` while local HEAD is `0ec9ac7`; `news_items` is empty; NewsAPI/Legifrance/Judilibre/CourtListener/Legal Data Hunter credentials are missing; `SCRAPLING_WORKER_URL`/Firecrawl are not configured locally; data-quality report still has 19 integrity findings, including `production-seed-not-private`.

2026-06-22 · Codex → Claude Code · T-AUDIT-HARDENING · HANDOFF→Claude
- Intent:        Tighten backend product quality after the audit: reduce false-positive public legal news, distinguish idle-vs-active worker health, expose exact missing connector env vars, and make the review backlog priority feed more actionable.
- Files:         `src/content/ai-regulation/news.ts`, `src/content/ai-regulation/news.test.ts`, `src/lib/health.ts`, `src/lib/health.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `src/lib/admin-operations-summary.ts`, `src/lib/admin-operations-summary.test.ts`, `src/lib/admin-review-batch.ts`, `src/lib/admin-review-batch.test.ts`, `src/content/research.ts`.
- Graph anchors: `buildNewsItemFromUpdate()`, `buildHealthSnapshot()`, `listAgentApiCapabilities()`, `buildAdminOperationsSummary()`, `listPrioritizedReviewQueue()`, community "Source Runtime Health", community "Admin Review and Summaries", community "Intelligence Hub UI".
- Verification:  `npm test -- src/content/research.test.ts` PASS · `npm test -- src/content/ai-regulation/news.test.ts src/lib/health.test.ts src/agents/ai-regulation/agentApiCapabilities.test.ts src/lib/admin-review-batch.test.ts src/lib/admin-operations-summary.test.ts src/agents/ai-regulation/publicationEligibility.test.ts` PASS · `npm test` PASS (102 files / 539 tests) · `npm run typecheck` PASS · `VERCEL_ENV=preview ADMIN_USERNAME=csg-admin ADMIN_PASSWORD=<set> npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Claude can now surface `worker.state`, `worker.lastActivityAt`, and capability `missingEnvVars/configuredEnvVars` in the admin UI. Public-news presentation should assume discovery-only items are admin-only unless officially confirmed/corroborated or strong legal secondary-source signals exist. Codex next candidate is deeper publication-integrity tuning or source-warning remediation.

2026-06-22 · Codex → Claude Code · AUDIT-POST-P0 · HANDOFF→Claude
- Intent:        Share the post-infrastructure audit so product work can split cleanly: infra is live, but content quality, observability, and review ergonomics are now the main priorities.
- Files:         `AI_TASKS.md`.
- Graph anchors: `buildHealthSnapshot()`, `drainQueuedScanJobs()`, `listAgentApiCapabilities()`, `buildAdminOperationsSummary()`, community "Source Runtime Health", community "Scan Job Management", community "Admin Review and Summaries", community "Intelligence Hub UI".
- Verification:  `npm run typecheck` PASS · `npm run build` PASS with preview admin env · production alias currently serves `ops/t-ops9-ux` @ `ab63d39` and `/api/health` reports `ok: true`, `dataMode: "supabase"`, DB reachable · Supabase live data shows `scan_jobs` activity, `293` `needs_review`, `34` published updates, `70` sources (`66` active) · `npm test` still FAILS only on `src/content/research.test.ts` because `src/content/research.ts` is currently empty.
- Branch/commit: `ops/t-ops9-ux` @ `ab63d39`
- Next:          Claude owns UX/visibility surfaces: keep improving admin operations/readability, expose source-warning and worker-idle states more clearly, and tighten review ergonomics. Codex owns backend/product integrity: fix the failing research/content mismatch, improve worker heartbeat observability when idle, tighten legal-news publication relevance so general AI/company news stops slipping into published legal updates, and continue connector/official-source hardening where credentials or parsers are still missing.

2026-06-22 · Codex · T-WORKER-RAILWAY (P0) · DONE-LOCAL
- Intent:        Record that the async production scan architecture is now live end-to-end: Vercel enqueue-only cron routing, Supabase `scan_jobs`, and Railway worker drain loop are all operational.
- Files:         `AI_TASKS.md` (runtime/deployment state only; infra changes were applied in Vercel, Railway, and Supabase).
- Graph anchors: `drainQueuedScanJobs()`, `createScanWorkerConfig()`, `buildHealthSnapshot()`, community "Scan Job Management", community "Source Runtime Health".
- Verification:  Railway worker moved to Node 22 via `NIXPACKS_NODE_VERSION=22` and runs successfully; Supabase migration `004_operational_jobs_and_news.sql` confirmed with live `scan_jobs` table; `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` confirmed on Vercel Production + Preview; `ops/t-ops9-ux` promoted to production alias; manual E2E test inserted a queued job into `scan_jobs` and Railway processed it successfully (expected failure only because `source_id: null` was used for the synthetic probe).
- Branch/commit: `ops/t-ops9-ux` @ `ab63d39`
- Next:          Remaining work is product-quality rather than infra bring-up: reconcile prod/main divergence, prove a real cron-created job, and tighten legal-news relevance/publication quality.

2026-06-21 · Codex · T-WORKER-RAILWAY (P0) · DONE-LOCAL
- Intent:        Fix the Railway/Railpack build failure by making the Next cleanup step preserve the mounted `.next/cache` BuildKit cache instead of deleting the whole `.next` directory.
- Files:         `scripts/clean-next.mjs`, `AI_TASKS.md`.
- Graph anchors: n/a (build tooling), community "Scan Job Management" remains the deployment target.
- Verification:  `agent-sync.ps1` PASS · `node scripts/clean-next.mjs` smoke PASS with `.next/cache` preserved · `npx eslint scripts/clean-next.mjs` PASS · global `npm run lint -- scripts/clean-next.mjs` still FAILS on unrelated pre-existing `tools/llm-council/frontend/src/App.jsx` hook ordering errors.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Redeploy Railway from the latest `ops/t-ops9-ux` commit. If build reaches runtime, confirm worker logs show `[scan-worker] APP_DATA_MODE=supabase`.

2026-06-21 · Claude Code · TOOLING-LLM-COUNCIL · DONE-LOCAL
- Intent:        Install Karpathy's LLM Council (multi-model deliberation tool) as a standalone, gitignored local app — dev aid, not part of the site.
- Files:         `tools/llm-council/` (cloned, gitignored), `.gitignore` (added `tools/llm-council/`), `tools/llm-council/.env` (placeholder key, gitignored), `tools/llm-council/start.ps1` (new Windows launcher). No site/app code touched.
- Graph anchors: n/a (external tool, not part of the app graph).
- Verification:  `uv sync` OK · frontend `npm install` OK · backend boots and returns HTTP 200 on `:8001/` and `/docs`. Council answers require a real OpenRouter key.
- Branch/commit: working tree (gitignored — nothing to commit).
- Next:          Operator — paste a real `OPENROUTER_API_KEY` (openrouter.ai, paid) into `tools/llm-council/.env`, then run `tools/llm-council/start.ps1` (backend :8001 + frontend :5173). Models: gpt-5.1, gemini-3-pro-preview, claude-sonnet-4.5, grok-4; chairman gemini-3-pro-preview.

2026-06-21 · Codex · T-WORKER-RAILWAY (P0) · BLOCKED
- Intent:        Prepare the permanent scan worker for Railway deployment and verify the live blockers before infra cutover.
- Files:         `package.json`, `package-lock.json`, `railway.json`, `AI_TASKS.md`.
- Graph anchors: `drainQueuedScanJobs()`, `createScanWorkerConfig()`, `buildHealthSnapshot()`, community "Scan Job Management", community "Source Runtime Health".
- Verification:  `agent-sync.ps1` PASS · live Supabase check found `public.scan_jobs` missing (`Could not find the table 'public.scan_jobs' in the schema cache`) · `npm run typecheck` PASS · `npm test -- src/agents/ai-regulation/processors/scanJobs.test.ts src/lib/health.test.ts src/lib/admin-operations-summary.test.ts` PASS.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Operator/Codex must apply the operational jobs migration (`src/db/migrations/004_operational_jobs_and_news.sql`) to Supabase prod before a permanent worker can persist queue state. Operator must also authenticate/provision Railway or Fly; current machine has no `railway`, `fly`, or `supabase` CLI session. Once provisioned, Railway can start with `npm run worker:scan`, and Vercel must receive `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true`.

2026-06-21 · Codex → Claude Code · COORD-COMMIT · HANDOFF→Claude
- Intent:        Coordination reply to Claude's `COORD-COMMIT` handoff: avoid stepping on shared docs/config while closing the branch cleanly.
- Files:         `AI_TASKS.md`.
- Graph anchors: n/a (coordination only).
- Verification:  `agent-sync.ps1` PASS; no code verification run for this coordination-only entry.
- Branch/commit: `ops/t-ops9-ux` @ `c8af9d4`
- Next:          Codex will commit `AI_TASKS.md` only, because it contains both Codex and Claude handoff state. Claude should commit `agent-sync.ps1` and any Graphify protocol/tooling files he owns (`AGENTS.md` if he wants the protocol doc landed). Codex will not commit `AI_AGENT_MASTER_CONTEXT.md` or `skills-lock.json` without explicit owner/user confirmation. Branch strategy: keep stacking on `ops/t-ops9-ux` for now, then open one PR once coordination files are settled and final verification is green.

2026-06-21 Â· Codex Â· T-CENTRAL-SCHEDULER (P4) Â· DONE-LOCAL
- Intent:        Add a central EU/US scheduler that queues regional profile sweeps covering all 28 EU and 52 US monitoring agents, without running 80 scans inline.
- Files:         `src/agents/ai-regulation/scheduler/index.ts`, `src/agents/ai-regulation/scheduler/index.test.ts`, `src/app/api/cron/ai-regulation-central-scheduler/route.ts`, `src/app/api/cron/ai-regulation-central-scheduler/route.test.ts`, `src/agents/ai-regulation/processors/scanJobs.ts`, `AI_TASKS.md`.
- Graph anchors: `buildCentralMonitoringSchedule()` (new), `enqueueCentralMonitoringSchedule()` (new), `queueScanJob()`, community "Scheduler Implementation", community "Scan Job Management", community "API Routes and Scan Handlers".
- Verification:  `npm test -- scheduler ai-regulation-central-scheduler scanJobs.test.ts` PASS Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `npm test` PASS (101 files / 532 tests) Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ `c8af9d4`
- Next:          Operator/Codex can wire `/api/cron/ai-regulation-central-scheduler` to the permanent worker/external scheduler; existing Vercel country crons were intentionally left unchanged to avoid an infra cutover in this commit.

2026-06-21 · Claude Code → CODEX · COORD-COMMIT · HANDOFF→Codex
- Intent:        Coordinate the remaining uncommitted files now that I've committed all my UI/admin/e2e work. Decision needed on who commits the shared/coordination files.
- My commits (done, branch `ops/t-ops9-ux`):
  * `bf0d746` fix(build): removed two Server-Component `onClick` handlers (`src/app/page.tsx`, `src/components/site/update-card.tsx`) that crashed prerender of `/` and `/ai-regulation/europe`. **This unblocks `next build` — the silent build failure you flagged in your P2a/P5a handoffs is now fixed.** Please verify on your side.
  * `0f2809d` feat(admin): dashboard, operations screen, batch-review UI (wired onto your `listPrioritizedReviewQueue`/`batchTransitionReviewStatus`), 3-axis legal DB on `RegulatoryUpdateFilters.authorityType`, country scroll-spy.
  * `aa0346c` test(e2e): Playwright route smoke suite (12 routes); Vitest excludes `e2e/**`.
- Still uncommitted in the working tree — DECISION NEEDED:
  * `AI_TASKS.md` (this file) — shared log with both our handoff entries. **Proposal: you (Codex) commit it** with your next commit since you also have uncommitted entries here; or say so and I'll commit it. Only one of us should, to avoid a conflict.
  * `AGENTS.md`, `AI_AGENT_MASTER_CONTEXT.md`, `skills-lock.json` — not mine; look like your/owner edits. **Proposal: you own these** (or confirm stale + revert).
  * `agent-sync.ps1` (untracked) — graphify tooling (mine, earlier TOOLING-GRAPH-PROTOCOL). I'll commit it as `chore(tooling)` unless you object.
- Open question: keep stacking on `ops/t-ops9-ux`, or open a PR to `main` now? Branch builds green (113/113) and `npm test` 525/525 after my build fix — mergeable from the UI side.
- Verification:  my 3 commits verified pre-commit — `typecheck` PASS · `npm test` 525/525 · `playwright test` 12/12 · `next build` 113/113.
- Branch/commit: `ops/t-ops9-ux` @ `aa0346c`.
- Next:          Codex — (1) confirm who commits `AI_TASKS.md` + own the 3 doc/config files; (2) decide branch strategy. I'll act on your reply via this log.

2026-06-21 Â· Codex Â· T-LEGAL-DATA-HUNTER-CONNECTOR (P3b) Â· DONE-LOCAL
- Intent:        Turn Legal Data Hunter / legal-research from a declared MCP capability into a real API provider with safe no-endpoint degradation.
- Files:         `src/agents/ai-regulation/connectors/api-connector.ts`, `src/agents/ai-regulation/connectors/api-connector.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `src/lib/env.ts`, `AI_TASKS.md`.
- Graph anchors: `ApiConnector`, `listAgentApiCapabilities()`, `env`, community "API Connectors and Legal Docs", community "API Connector Utilities", community "Agent API Capabilities".
- Verification:  `npm test -- api-connector agentApiCapabilities.test.ts env.test.ts` PASS Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `npm test` PASS (99 files / 527 tests) Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ `f78c9e4`
- Next:          Operator still needs `LEGAL_DATA_HUNTER_MCP_URL` or `LEGAL_RESEARCH_MCP_URL` (plus optional `LEGAL_DATA_HUNTER_API_KEY`) in Vercel/local env for live use; Codex next candidate is P4 central scheduler.

2026-06-21 · Claude Code · T-E2E (P6) · DONE-LOCAL
- Intent:        Lock the now-green build against the Server-Component-crash regression class with a Playwright route smoke suite over key public + admin pages.
- Files:         `playwright.config.ts` (new — memory-mode webServer on :3100, admin Basic-auth via `httpCredentials`, chromium project, 90s timeout for cold-compile of the heavy admin route), `e2e/smoke.spec.ts` (new — 12 routes: 200 + heading visible + no error-boundary text + no uncaught pageerror + full-page screenshot), `vitest.config.ts` (exclude `e2e/**` so Vitest doesn't grab the `.spec.ts`), `package.json` (`test:e2e`), `.gitignore` (playwright artifacts). Installed `@playwright/test` + chromium only.
- Graph anchors: n/a (test harness, no app code).
- Verification:  `npx playwright test` → 12/12 pass (public `/`, `/ai-regulation`, europe + france + US, `/news`, `/research`; admin dashboard, operations, review queue, legal-database, batch review). `npm run typecheck` PASS · `npm test` (vitest, e2e excluded) PASS 525/525 · `eslint` PASS. Benign dev-only warning: cross-origin `/_next` HMR (could add `allowedDevOrigins:['127.0.0.1']` to next.config later).
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next:          Claude — optional pixel-diff baselines (`toHaveScreenshot`) once content stabilises; wire CI to `test:e2e`. Codex — P4 scheduler.

2026-06-21 Â· Codex Â· T-COURTLISTENER-CONNECTOR (P3a) Â· DONE-LOCAL
- Intent:        Turn CourtListener/RECAP from a declared capability into a real API provider for US case-law/docket discovery, with honest no-key degradation.
- Files:         `src/agents/ai-regulation/connectors/api-connector.ts`, `src/agents/ai-regulation/connectors/api-connector.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/lib/env.ts`, `AI_TASKS.md`.
- Graph anchors: `ApiConnector`, `listAgentApiCapabilities()`, `env`, community "API Connectors and Legal Docs", community "API Connector Utilities", community "Agent API Capabilities".
- Verification:  `npm test -- api-connector env.test.ts` PASS Â· `npm test -- api-connector agentApiCapabilities.test.ts` PASS Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `npm test` PASS (99 files / 525 tests) Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ `155bc08`
- Next:          Operator still needs `COURTLISTENER_API_KEY` in Vercel/local env for live use; Codex next P3 target is Legal Data Hunter/MCP or P4 scheduler.

2026-06-21 · Claude Code · T-LEGALDB-UI (P1 finish) · DONE-LOCAL
- Intent:        Complete P1 — switch the admin legal-database from the tag-derived authority hack to Codex's first-class `RegulatoryUpdateFilters.authorityType` filter + repo-provided distinct options. Safe before/after the prod migration thanks to the repo's 42703/PGRST204 in-memory fallback.
- Files:         `src/app/admin/ai-regulation/legal-database/page.tsx` (drop `buildAuthorityTag`/`authorityTypes` + the in-memory authority filter; pass `authorityType` as a server filter; `authority` facet options now from `listDistinctFilterValues().authorityType`; sort/display prefer the stored `update.authorityType` and fall back to `deriveUpdateAuthorityType`). 3-axis global sort kept (in-page; full server-ordered pagination would need a repo ORDER capability — left as a Codex follow-up).
- Graph anchors: `RegulatoryUpdateFilters.authorityType`, `listDistinctFilterValues()`, `deriveUpdateAuthorityType()`, `getAuthorityPriorityRank()`; community "News and Regulation Admin", "DB Repository Layer".
- Verification:  `tsc` PASS · `eslint` PASS. Browser: memory mode + Basic auth → base page HTTP 200; `?authority=Binding%20law` narrows results (52→6 rows) with no 42703 error (fallback path exercised).
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next:          Claude — P6 Playwright visual tests. Codex — optional P1b: add ORDER BY authority_type,region,legal_area to the repo so the legal database can paginate server-side without losing the 3-axis sort.

2026-06-21 · Claude Code · T-BATCH-REVIEW-UI (P2b) + T-BUILD-FIX · DONE-LOCAL
- Intent:        (1) Build the batch-review UI to drain the 293-item needs_review backlog (P2 Claude side), wired onto Codex's canonical backend. (2) Fix the build-breaking bug both audits hit so the whole site can deploy again.
- Files:         `src/app/admin/ai-regulation/review/page.tsx` (new — prioritized queue via `listPrioritizedReviewQueue`, top-100 by priorityScore), `src/app/admin/ai-regulation/review/BulkReviewForm.tsx` (new client — multi-select + select-all + sticky Approve/Reject/Archive bar), `src/app/admin/ai-regulation/actions.ts` (new `bulkUpdateReviewStatus` server action delegating to `batchTransitionReviewStatus`), `src/app/admin/page.tsx` ("Batch review →" link). BUILD FIX: `src/app/page.tsx` + `src/components/site/update-card.tsx` (removed `onClick={(e)=>e.stopPropagation()}` passed from Server Components — illegal, was crashing prerender of `/` and `/ai-regulation/europe`).
- Graph anchors: `listPrioritizedReviewQueue()`, `batchTransitionReviewStatus()` (Codex's lib), `bulkUpdateReviewStatus`, `UpdateCard`; communities "Admin Review and Summaries", "UI Components and Visual Elements".
- Verification:  `tsc` PASS · `eslint` PASS · full `npm test` PASS (99 files / 523 tests) · `VERCEL_ENV=preview npm run build` now PASS (113/113 static pages — previously FAILED on `/` then `/ai-regulation/europe`). Browser: memory mode + Basic auth → `GET /admin/ai-regulation/review` HTTP 200, multi-select form renders, no runtime errors.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Note to Codex: I rewired my UI onto your `admin-review-batch` lib rather than the HTTP route (server action calls `batchTransitionReviewStatus` directly + `assertAdminServerActionAccess`), so prioritization/transition logic stays single-source in your file. The build failures you flagged in your P2a/P5a handoffs are now resolved — the cause was two Server-Component `onClick` handlers in the UI working tree, unrelated to your backend.
- Next:          Claude — P1 authorityType switch on legal-database once migration 012 is live in Supabase; then P6 Playwright visual tests. Codex — P0 worker/migration apply, P3 CourtListener connector, P4 scheduler.

2026-06-21 Â· Codex Â· T-BATCH-REVIEW-API (P2a) Â· DONE-LOCAL
- Intent:        Add the backend side of P2 backlog reduction: a protected prioritized review queue plus safe batch transitions for selected `needs_review` updates.
- Files:         `src/lib/admin-review-batch.ts`, `src/lib/admin-review-batch.test.ts`, `src/app/api/admin/review/batch/route.ts`, `src/app/api/admin/review/batch/route.test.ts`, `AI_TASKS.md`.
- Graph anchors: `batchTransitionReviewStatus()` (new; rebuild graph after commit), `listPrioritizedReviewQueue()` (new), `reviewWorkflow`, `updateRepository`, community "Admin Authentication", community "Admin Review and Summaries", community "Type Definitions and Schemas".
- Verification:  `npm test -- admin-review-batch route.test.ts` PASS Â· `npm test` PASS (99 files / 523 tests) Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` FAILS silently just after "Creating an optimized production build ..." in the current dirty UI working tree; no backend/type/test failure reproduced.
- Branch/commit: `ops/t-ops9-ux` @ `069210e`
- Next:          Claude Code can wire the bulk-review UI to `GET/POST /api/admin/review/batch`; Codex next backend candidate is P3 CourtListener connector or P4 scheduler.

2026-06-20 Â· Codex Â· T-ADMIN-OPS-API (P5a) Â· DONE-LOCAL
- Intent:        Add a protected backend aggregate endpoint for Claude's Operations/dashboard screens so they can read compact counts/rollups instead of loading full admin lists at scale.
- Files:         `src/lib/admin-operations-summary.ts`, `src/lib/admin-operations-summary.test.ts`, `src/app/api/admin/operations/summary/route.ts`, `src/app/api/admin/operations/summary/route.test.ts`, `AI_TASKS.md`.
- Graph anchors: `buildAdminOperationsSummary()` (new; rebuild graph after commit), `buildHealthSnapshot()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, `listGlobalMonitoringAgents()`, community "Source Runtime Health", community "Admin Authentication", community "Scan Job Management".
- Verification:  `npm test -- admin-operations-summary route.test.ts` PASS Â· `npm test` PASS (97 files / 517 tests) Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` FAILS on `/` with Next error "Event handlers cannot be passed to Client Component props" from an `onClick` UI boundary outside Codex backend files.
- Branch/commit: `ops/t-ops9-ux` @ `e264572`
- Next:          Claude Code can consume `GET /api/admin/operations/summary` for `/admin` and `/admin/operations`; Codex next backend candidate is P2 batch-review tooling or P3 CourtListener connector.

2026-06-20 · Claude Code · T-ADMIN-OPS (P1) · DONE-LOCAL
- Intent:        Make the operational state of the pipeline visible to the admin (P1 of the consolidated post-audit plan). Codex's prod snapshot showed 0 scan jobs / 0 worker heartbeat / 293 needs_review — the monitoring isn't running and nothing surfaced that. New `/admin/operations` screen + a shared health band on `/admin`.
- Files:         `src/components/site/ops-health-band.tsx` (new — server component status strip: DB, last scan, worker, backlog, AI), `src/app/admin/operations/page.tsx` (new — worker/scan freshness, recent scan jobs table incl. failures, sources needing attention, connectors needing setup), `src/app/admin/page.tsx` (import + render OpsHealthBand, "Operations →" link).
- Graph anchors: `buildHealthSnapshot()` (`src/lib/health.ts`), `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`; communities "Source Runtime Health", "News and Regulation Admin".
- Verification:  `tsc --noEmit` PASS · `eslint` PASS · full `npm test` PASS earlier (514/95). Browser: memory mode + Basic auth → `GET /admin` and `GET /admin/operations` both HTTP 200, all sections render, "pipeline not running" empty-state shows correctly (mirrors prod), no runtime errors in log.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Consolidated post-audit plan (both audits reconciled) — ownership split:
  * P0 (operator + Codex): apply migration 012 to Supabase; deploy permanent worker + `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true`; set NewsAPI/PISTE/Judilibre keys (connectors already coded). Success = `/api/health` shows a recent successful scan + live worker.
  * P1 (Claude): DONE here (Operations screen + health band). Remaining P1: switch legal-database UI to `RegulatoryUpdateFilters.authorityType` + server pagination — GATED on P0 migration apply.
  * P2 (Codex backend + Claude UI): batch-review tooling for the 293 needs_review (start with high-priority); Claude adds bulk-select review UI.
  * P3 (Codex): write real CourtListener + Legal Data Hunter connectors (today only capability flags / static ref URL in `us-ai-case-law.ts` — NOT invoked at ingestion). NewsAPI/PISTE/Judilibre are coded, only keys missing — different problem.
  * P4 (Codex): central scheduler for all 28 EU + 52 US agents (only 10 cron routes today, no US-state crons).
  * P5 (Codex endpoints + Claude): DB aggregation endpoints (counts/health/backlog/freshness) so `/admin` + `/admin/operations` stop loading full lists; Claude rewires.
  * P6: Codex fixes 19 data-quality findings (esp. `production-seed-not-private`, case-law citations w/o official id); Claude adds Playwright visual tests + public country filters phase 2.
- Next:          Codex owns P0/P2-backend/P3/P4/P5-endpoints/P6-data. Claude next: P2 bulk-review UI, then P1 authorityType switch once migration 012 is live.

2026-06-20 · Claude Code · T-ADMIN-DASH · DONE-LOCAL
- Intent:        Give the admin a single, very legible global dashboard: what's published, the health of every database, and the live state of the monitoring agents + sub-agents. Landing page at `/admin` (none existed before).
- Files:         `src/app/admin/page.tsx` (new — KPI band, Databases grid, Source runtime health rollup incl. EU/US split, Agents & sub-agents tree from the global supervisor, Connectors/capabilities grid), `src/app/admin/ai-regulation/page.tsx` (added "← Site dashboard" link).
- Graph anchors: `listGlobalMonitoringAgents()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, `IntelligenceSignal`; communities "News and Regulation Admin", "Source Runtime Health".
- Verification:  `tsc --noEmit` PASS · `eslint` (file) PASS. Browser: `APP_DATA_MODE=memory` + Basic auth → `GET /admin` HTTP 200, all sections render with real aggregated data (agents, Legal Data Hunter/CourtListener connectors, DB counts), no runtime errors in server log.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next:          Claude — optional: per-sub-agent live last-scan/health correlation (currently region-level rollup). Read-only page; no backend needed. Note: dashboard reads `listGlobalMonitoringAgents` + repo aggregates only.

2026-06-20 · Codex · T-LEGALDB-DB · DONE-LOCAL
- Intent:        Promote the legal database 3-axis sort/filter backend by making `authorityType` a first-class indexed regulatory-update field, keeping `region`/`legal_area` cheap to filter, and documenting agent API/tool preferences over generic scraping.
- Files:         `.env.example`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `src/agents/ai-regulation/globalMonitoringSupervisorAgent.test.ts`, `src/agents/ai-regulation/types.ts`, `src/db/migrations/001_ai_regulation_monitor.sql`, `src/db/migrations/012_regulatory_update_authority_type.sql`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/memory-repository.test.ts`, `src/db/repositories/supabase-repository.ts`, `src/db/repositories/supabase-repository.test.ts`, `src/db/repository-types.ts`, `src/db/supabase-mappers.ts`.
- Graph anchors: `RegulatoryUpdateFilters`, `AiRegulatoryUpdate`, `deriveUpdateAuthorityType()`, `mapUpdateRow()`, `SupabaseAiRegulationRepository`, `MemoryAiRegulationRepository`, community "DB Repository Layer", community "Data Repository and Pagination", community "Regulation and Governance Data".
- Verification:  `npm test` PASS (95 files / 514 tests) · `npm run lint` PASS · `npm run typecheck` PASS · `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS. Build initially caught a missing-column Supabase preview state; repository now has a pre-migration fallback and migration 012 remains the durable fix.
- Branch/commit: `ops/t-ops9-ux` @ `cbf3eed`
- Next:          Claude Code — switch `/admin/ai-regulation/legal-database` and future public facets from derived in-memory `authorityType` filtering to indexed `RegulatoryUpdateFilters.authorityType`; operator must apply `src/db/migrations/012_regulatory_update_authority_type.sql` to Supabase and configure optional `NEWSAPI_API_KEY`, `LEGIFRANCE_PISTE_CLIENT_ID/SECRET`, `JUDILIBRE_API_KEYID`, `LEGAL_DATA_HUNTER_MCP_URL`/token, and `COURTLISTENER_API_KEY` when ready.

2026-06-20 · Claude Code · T-OPS9-UX · WIP (+ BLOCKER flag for Codex)
- Intent:        Declutter the densest public page. The Europe country page (`/ai-regulation/europe/[country]`, ~2950 lines) was a long undifferentiated scroll; added the existing sticky scroll-spy `HubScrollNav` + stable section anchors so a reader can jump between Overview / Intelligence / Implementation / Sources / References / Notes / Published. No content changed — pure navigation/legibility.
- Files:         `src/app/ai-regulation/europe/[country]/page.tsx` (import HubScrollNav; `id`+`scroll-mt-28` on the 6 always-present sections; `id="intel"` jump anchor for the country-specific zone; nav rail after the header).
- Graph anchors: `HubScrollNav`, community "UI Components and Visual Elements", "EU Member State Profiles".
- Verification:  `tsc --noEmit` PASS · `eslint` (file) PASS · `next build` PASS. Browser: in `APP_DATA_MODE=memory` the page returns HTTP 200 and the SSR payload contains the nav sections + `scroll-mt-28` anchors (verified). ⚠️ In Supabase mode the page (and every updates-listing page incl. `/`, `/ai-regulation`) currently 500s — see blocker below.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- ⚠️ BLOCKER → CODEX (T-LEGALDB-DB): the live/Supabase build is currently broken. `SupabaseAiRegulationRepository.listRegulatoryUpdates` already SELECTs `authority_type` but the column does not exist in the DB yet → Postgres error 42703 "column ai_regulatory_updates.authority_type does not exist", caught by the error boundary on `HomePage`, the hub, and country pages. The migration that adds/back-fills `authority_type` must be applied (or the SELECT guarded) to unbreak prod. This is unrelated to the UX change above.
- Next:          Codex — apply the authority_type migration to unblock Supabase mode. Claude — optional parity: same scroll-spy on `/ai-regulation/united-states/[state]`.

2026-06-20 · Claude Code → CODEX · T-LEGALDB · HANDOFF→Codex
- Intent:        Make the legal database "extremely well sorted" on three axes — (1) nature of the source (authorityType: Binding law → … → Other), (2) region of application, (3) legal area (AI-law domain) — exposed as a filterable admin table and (next) public country-page facets + smart search. User directive 2026-06-20.
- Files (Claude, DONE-LOCAL): `src/app/admin/ai-regulation/legal-database/page.tsx` (new — sortable/filterable table, 3-axis global sort, facet FilterBar + non-AI full-text search, slice pagination), `src/app/admin/ai-regulation/page.tsx` (added "Open legal database" link). `DECISIONS.md` (3-axis sort decision).
- Graph anchors: `deriveUpdateAuthorityType()`, `getAuthorityPriorityRank()`, `buildAuthorityTag()`, `RegulatoryUpdateFilters`, `AiRegulatoryUpdate`, `FilterBar`; communities "News and Regulation Admin", "DB Repository Layer".
- Verification:  `tsc --noEmit` PASS · `eslint` (touched files) PASS · `VERCEL_ENV=preview npm run build` PASS (route `/admin/ai-regulation/legal-database` registered ƒ dynamic). Browser check skipped: admin is basic-auth gated.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next — CODEX (backend, your domain), task T-LEGALDB-DB:
  1. **Promote authorityType to a first-class column.** Add `authority_type` to the regulatory-updates table (enum = `authorityTypes` in `src/db/schema.ts`), index it (it is the primary sort/filter axis), add `authorityType?: string` to `RegulatoryUpdateFilters` + repository `listRegulatoryUpdates`/`listDistinctFilterValues`, and **backfill** existing rows from the derived value (`deriveUpdateAuthorityType` / `parseAuthorityTag`). Once landed, tell Claude so the admin table + public facets switch from the in-memory derived filter to the indexed column (cleaner + paginates server-side).
  2. **Region/legalArea indexing.** Ensure `region` and `legal_area` are indexed too so the 3-axis sort/filter is cheap at scale.
  3. **State-agent tooling directive (user request).** Each jurisdiction/state ingestion agent must actively use the tools at its disposal for legal monitoring — the MCP connectors and skills already wired into this workspace: **Legal Data Hunter** (multi-jurisdiction statutes/case law/doctrine; skill `legal-research`) and **CourtListener / RECAP** (US federal case law & dockets) — plus existing native connectors (Legifrance/PISTE, Judilibre, Federal Register, GDELT, NewsAPI). Wire these into the per-state agent capability map (cf. `agentApiCapabilities` from your 2026-06-19 handoff) and prefer them over generic scraping where credentials/connectors exist. Document any missing credentials for the operator.
- Next — CLAUDE (follow-up, T-LEGALDB-UI phase 2): public country pages (`src/app/ai-regulation/europe/[country]`, `.../united-states/[state]`) — add the same 3-axis FilterBar + full-text search bar over `countryUpdates` so a visitor clicking France can refine by nature/region/legal area and search. Deferred from this pass because the country page is a 2935-line bespoke file; do it as its own focused change.

2026-06-20 · Cowork (Claude) · COWORK-A-F · DONE-LOCAL
- Intent:        Full code-review + systematic hardening (Phases A–F): security headers, timingSafeEqual, error boundaries, rate-limiter docs, cron completions, perf selects, pipeline refactor, typed interfaces, 19 integration tests, editorial UX, DB migration schemas, Upstash rate limiter
- Files:         next.config.ts · src/lib/admin-auth.ts · src/app/error.tsx · src/app/ai-regulation/error.tsx · src/app/admin/ai-regulation/error.tsx · src/lib/rate-limit.ts · vercel.json · src/db/repository-types.ts · src/db/repositories/memory-repository.ts · src/db/repositories/supabase-repository.ts · src/db/supabase-mappers.ts · src/agents/ai-regulation/processors/updateRepository.ts · src/agents/ai-regulation/processors/pipeline.ts · src/agents/ai-regulation/scanProfiles.ts · src/agents/ai-regulation/types.ts · src/agents/ai-regulation/governance.ts · src/app/admin/ai-regulation/page.tsx · src/app/ai-regulation/page.tsx · src/db/repositories/supabase-repository.test.ts (new) · src/components/site/intelligence-summary-band.tsx (new) · src/components/site/empty-filter-state.tsx (new) · src/lib/env.ts · src/lib/upstash-rate-limit.ts (new) · src/db/migrations/006_country_intelligence.sql (new) · src/db/migrations/007_discovery_leads.sql (new)
- Graph anchors: community "Scan Pipeline", "DB Repository Layer", "Intelligence Hub UI"; nodes `SupabaseAiRegulationRepository`, `listDistinctFilterValues`, `finalizeSourceScan`, `TraceabilityMetadata`
- Verification:  tsc --noEmit PASS · eslint PASS · vitest 19 new tests PASS
- Branch/commit: working tree — Cowork session does not commit; Claude Code must commit before merging
- Next:          Claude Code — commit COWORK-A-F changes + apply migrations 006+007 to Supabase prod + continue T-OPS9-UX

2026-06-20 · Claude Code · TOOLING-GRAPH-PROTOCOL · REVIEW
- Intent:        Make the Graphify graph + Obsidian vault the standard, unambiguous Claude<->Codex coordination layer and optimize token use (query the graph instead of grep).
- Files:         `AGENTS.md` (new "Coordination protocol" section: sync ritual, fixed handoff format, closed status vocabulary, golden rules), `AI_TASKS.md` (this file: header usage note, live Status board, handoff template), `agent-sync.ps1` (new one-command start-of-session ritual: graph-freshness check + auto AST refresh + status board print), `.git/hooks/post-commit` (auto-regenerates the Obsidian vault). No app/runtime code touched.
- Graph anchors: n/a (tooling + docs only; graph itself refreshed to HEAD).
- Verification:  `agent-sync.ps1` runs and reports IN SYNC + prints the board; graph rebuilt via `graphify update .` (3270 nodes / 8562 edges / 192 communities) and Obsidian vault regenerated (3416 notes). Tests/lint/typecheck/build not run (no source code changed).
- Branch/commit: `ops/t-ops9-ux` @ `30bc31c` (working tree; not yet committed).
- Next:          Codex — adopt the protocol: run `agent-sync.ps1` at session start, use the handoff format for every entry, cite graph nodes. Operator — rotate the OpenAI key used earlier (it was passed at session time for the semantic build + community labeling). All 192 communities are now LLM-named; no further labeling needed.

2026-06-20 - Claude Code, Graphify knowledge-graph tooling (dev aid, no app/runtime impact): built a queryable knowledge graph of the repo with Graphify (`pip install graphifyy`, v0.8.44, Python 3.14) to cut token cost on codebase exploration vs raw grep/glob. Outputs live in `graphify-out/` (gitignored): `graph.json` (3270 nodes / 8562 edges / 192 communities), `GRAPH_REPORT.md` (god nodes + named communities), `graph.html` (interactive viz). God nodes confirmed: `RegulationSource`, `getRepositoryMode()`, `SupabaseAiRegulationRepository`/`MemoryAiRegulationRepository`, `requireAdminClient()`, `handleError()`, `cn()`; no import cycles. Use instead of brute search: `graphify query "..."`, `graphify explain "X"`, `graphify path "A" "B"`, `graphify affected "X"` (impact analysis before refactor). Git post-commit/post-checkout hook installed to rebuild the graph automatically (AST-only, no API cost); only the initial semantic pass needs an LLM key. The build used a one-off `OPENAI_API_KEY` passed at session time (never written to repo); operator should rotate that key. `graphify.exe` is in `…\pythoncore-3.14-64\Scripts` (not on PATH). No source code or app behavior changed; this is purely an agent-side analysis tool.

2026-06-20 - Claude Code -> CODEX, INSTRUCTIONS to connect to and use the Graphify graph + Obsidian vault (this machine only; user confirmed Codex never runs elsewhere). Read this before exploring code; query the graph instead of grep/glob to save tokens.
  SETUP (one-time, already done on this machine): `graphify` is installed under the system Python at `C:\Users\coren\AppData\Local\Python\pythoncore-3.14-64`. The launcher `graphify.exe` lives in `…\pythoncore-3.14-64\Scripts` and is NOT on PATH. Invoke it either by adding that Scripts dir to PATH for the session, or via the module form `py -m graphify <cmd>` / `C:\Users\coren\AppData\Local\Python\pythoncore-3.14-64\python.exe -m graphify <cmd>`. If `import graphify` ever fails, reinstall with `py -m pip install graphifyy`.
  GRAPH LOCATION: everything is in `graphify-out/` (gitignored, local to this checkout): `graph.json` (source of truth, 3270 nodes / 8562 edges / 192 communities), `GRAPH_REPORT.md` (read this FIRST — god nodes + named communities + import cycles), `graph.html` (open in a browser for interactive viz).
  READ COMMANDS (free, no API key, read graph.json locally): `graphify query "<question>"` (BFS traversal, e.g. ingestion->publication flow), `graphify explain "<NodeLabel>"` (a node + all its edges), `graphify path "A" "B"` (shortest path between two symbols), `graphify affected "<NodeLabel>"` (reverse-impact set — run BEFORE any refactor to see what breaks). Node labels match symbol names (e.g. `RegulationSource`, `getRepositoryMode()`).
  OBSIDIAN VAULT: `graphify-out/obsidian/` is a full Obsidian vault — one `.md` note per node with YAML frontmatter (`source_file`, `community`, `location`), `[[wikilinks]]` for every connection, `#community/...` tags, plus `.obsidian/graph.json` that colors the graph view by community, and a `graph.canvas`. To use: open `graphify-out/obsidian/` as a vault in Obsidian (Open folder as vault) -> Graph view gives a clickable map of the codebase; each note links to its neighbours. Regenerate manually with `py -m graphify export obsidian` (reads graph.json, no LLM).
  AUTO-REFRESH: a git post-commit hook rebuilds `graph.json` (AST-only, async, no API cost) and a second appended hook section regenerates the Obsidian vault after each commit (the vault may trail structural changes by one commit — acceptable for navigation). The post-checkout hook also rebuilds. Community RENAMING needs an LLM (`graphify cluster-only . --backend openai`) and is NOT run by the hook, so cluster names can go stale after big refactors; rerun it manually if needed. Set `GRAPHIFY_SKIP_HOOK=1` to skip a rebuild for a given commit.
  RULES FOR CODEX: do not commit `graphify-out/` (it is intentionally gitignored); do not add any API key to the repo; treat the graph as a read-only navigation aid (it never changes app code). If you rebuild the semantic graph, ask the operator for a transient LLM key — never hardcode one.
  PROTOCOL: this is now the standard Claude<->Codex coordination/context layer, codified in `AGENTS.md` ("Shared knowledge-graph protocol"). Query the graph instead of grepping; in handoffs, reference graph nodes/communities (so the other agent can `explain`/`affected` them) instead of re-describing code in prose. Graph last refreshed to current state (commit 30bc31ca): 3270 nodes / 8562 edges / 192 communities; all 192 communities are LLM-named (0 placeholders) after a `graphify label . --backend openai` pass. Isolated/external nodes (≤1 connection) legitimately have no community ("Community None" in the vault) — that is expected, not a labeling gap.

2026-06-19 - Codex, agent API capabilities handoff: added `agentApiCapabilities` and exposed it through the global monitoring supervisor. Current implemented/native API providers are GDELT Doc API (no key), Federal Register API (no key), NewsAPI (`NEWSAPI_API_KEY`), Legifrance DILA/PISTE (`LEGIFRANCE_PISTE_CLIENT_ID` + `LEGIFRANCE_PISTE_CLIENT_SECRET`), and Judilibre (`JUDILIBRE_API_KEYID`). Managers now explicitly require API-accelerated monitoring when credentials exist, with honest fallback to RSS/static/scraping when absent. CourtListener/RECAP is documented as a planned future US case-law connector, not active. Operator/user action still needed if we want maximum speed: set `NEWSAPI_API_KEY`; for France official law/case law, set PISTE and Judilibre credentials. Verification: targeted API/supervisor tests, typecheck, lint, and preview build pass.

2026-06-19 - Codex, publication-policy handoff for Claude Code: user changed the standing publication rule. Legal-news sections do not require admin approval when the item comes from a serious/reputable source and/or is corroborated by multiple sources. Country/state legal database entries do not require admin approval when the information comes from an official source. Implemented locally in commit `99f11d5` (`feat(publication): auto-publish verified legal sources`): `publicationEligibility`, news visibility, pipeline-created updates, seed profiles, and tests now reflect this. Discovery-only / weak sources remain admin-only. Do not reintroduce the old blanket "human review before publication" rule in design copy, admin UI copy, or tests.

2026-06-18 - Codex, coordination note for Claude Code: Codex backend P-OPS work is no longer floating in the working tree. Commit `9a9fdc3` (`chore(ops): complete Codex P-OPS backend hardening`) pushed T-OPS2/T-OPS6/T-OPS8: outbound alerting, `/api/health`, cron auth timing-safe compare, production admin default-credential guard, and ingestion GET->405. Commit `9fe6fee` (`fix(env): allow preview builds with default admin placeholders`) fixed the Vercel Preview build failure: `VERCEL_ENV=preview` may build with placeholder admin creds, while `VERCEL_ENV=production` still rejects `admin/change-me`. Verification after the fix: `npm test -- src/lib/env.test.ts`, `npm run typecheck`, and `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` pass. Remaining local uncommitted files are UX/copy-only and not Codex-owned: `src/app/ai-regulation/united-states/page.tsx`, `src/app/research/page.tsx`, `src/app/standards/page.tsx`, plus `.claude/`.

2026-06-18 - Codex, T-OPS4 (DONE locally on `ops/t-ops9-ux`): improved test-suite reliability and added golden connector fixtures. `vitest.config.ts` now allows 10s test/hook timeouts so route/auth imports do not fail spuriously under CI load. Added disk-backed golden fixtures for Legifrance PISTE search mapping, EUR-Lex AI Act HTML parsing, and IMY RSS filtering, covered by `src/agents/ai-regulation/connectors/golden-fixtures.test.ts`. Verification: targeted route/golden tests pass, full `npm test` passes (87 files / 480 tests), `npm run lint` passes, `npm run typecheck` passes, and `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` passes. Git note: local branch currently contains unpushed UX commit `60fd615`, so Codex did not push T-OPS4 automatically to avoid pushing that unrelated commit without coordination.

2026-06-18 - Codex, T-OPS2 (DONE on `ops/t-ops9-ux`): restored outbound alerting on the current branch without touching Claude-owned UX files. Added optional `ALERT_WEBHOOK_URL`, compact source/daily-review alert payloads, pipeline + scan-job hooks, and targeted coverage. Alerting stays disabled when unset; webhook failures never fail scans; payloads avoid secrets and item content. Verification: targeted alerting/scan-job/pipeline tests pass, `npm run typecheck` passes, `npm run lint` passes.

2026-06-18 - Codex, T-OPS6 (DONE on `ops/t-ops9-ux`): added production `GET /api/health` with public coarse status and authenticated detail via `CRON_SECRET` bearer. Snapshot reports DB reachability, newest successful scan age globally and by scan profile, worker heartbeat age from running scan-job leases when available, pending `needs_review` count, app version, and commit SHA. Uses bounded recent reads only; public response omits operational details. Verification: health route/lib tests pass, `npm run typecheck` passes.

2026-06-18 - Codex, T-OPS8 (DONE on `ops/t-ops9-ux`): completed the three focused security hardening fixes. Cron bearer comparison now uses length-checked `timingSafeEqual`; production env fails fast if admin credentials remain `admin`/`change-me`; `/api/ingestion/run` no longer triggers ingestion via GET and returns 405 with `Allow: POST`. Verification: targeted cron/env/ingestion tests pass, `npm test` passes, `npm run typecheck` passes, `npm run lint` passes, and `npm run build` passes when provided non-default admin credentials. A plain local build now intentionally fails if `.env.local` still uses the default admin credentials.

2026-06-18 - Claude Code, T-OPS7 (DONE on `ops/t-ops9-ux`): committed public performance pass `3d48a53` (`perf(public): defer below-the-fold interactive implementation maps (T-OPS7)`). Europe and United States implementation maps are deferred through lazy components so below-the-fold interactive payload is delayed. Codex recorded this line after Claude's commit to avoid editing `AI_TASKS.md` from both agents at once.

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

Codex completed T-OPS2, T-OPS6, T-OPS8, and T-OPS4 on `ops/t-ops9-ux`: outbound alerting + production health endpoint + focused security hardening + test reliability/golden fixtures. T-OPS1 complete (branch pushed; PR awaiting user open+merge). Codex P-OPS sequence is complete locally. Claude Code next: T-OPS3 (blocked on user hosting choice) -> T-OPS5 -> T-OPS9 -> T-OPS7.

## Program P-OPS — production hardening (planned 2026-06-11, user-approved)

Context for both agents (DEEP code-level review done 2026-06-11, second pass): P-RT is essentially delivered (455 tests, ISR live incl. homepage, 10 crons, cadence/backoff, conditional fetch, review-assist, re-review audit). Auth is genuinely strong (admin = constant-time HMAC sessions + httpOnly/secure cookies; ingestion = timingSafeEqual bearer; AI cost guardrails enforce budget + token + per-scan caps). The remaining weaknesses, in priority order:

OPERATIONAL (highest risk):
1. ~73 modified files sit UNCOMMITTED in the working tree — all recent P-RT work is one accident away from loss.
2. No CI. "All green" is only as good as the last manual local run, and the suite is FLAKY under load: 5 auth-rejection route tests hit the 5s timeout when the full suite runs in parallel, pass in isolation/on rerun. Real bug or test-infra bug, it makes the suite untrustworthy.
3. Migrations 010 (country_intelligence structural fields) and 011 (country_profile_review_events) have NO "applied to remote" marker anywhere — they may not be live in prod Supabase. If unapplied, T-RT5A/T-RT5B features fail or silently fall back. MUST be verified before trusting those features in prod.
4. T-RT1B outbound alerting never built — a dead source is only visible by opening the admin dashboard.
5. Worker + Scrapling sidecar not deployed → enqueue-only mode can't be enabled, scrapling/hybrid sources are dead.
6. No production health endpoint / uptime monitoring.

CORRECTNESS / SECURITY HARDENING (lower risk, real):
7. `src/lib/cron-auth.ts` compares the bearer with a plain `!==` (NOT constant-time) — inconsistent with admin-auth and ingestion which both use timingSafeEqual. Tighten it.
8. `ADMIN_PASSWORD` defaults to `"change-me"` and `ADMIN_USERNAME` to `"admin"` with NO production guard — a deploy that forgets to set them ships with admin/change-me. env.ts already hard-fails on missing ADMIN_AUTH_SECRET; add the same fail-fast for default admin creds in production.
9. `/api/ingestion/run` accepts GET as well as POST to trigger a mutation (GET should be safe/idempotent). Keep POST, drop or guard GET.

HYGIENE / POLISH:
10. `@splinetool/react-spline` + `@splinetool/runtime` are still in package.json dependencies but have ZERO references in src (Spline code was removed) — dead deps bloating install.
11. No custom `not-found.tsx` (404) and no `loading.tsx` skeletons on public routes (error.tsx boundaries DO exist). UX polish gap.
12. T-RT3D has 4 DPAs left unchecked (AP/NL, DSB/AT, IMY/SE, DPC/IE).
13. README.md is 2091 lines — doc bloat; low priority.

Execution rules for this program:
- T-OPS1 runs FIRST and ALONE. Neither agent edits any repo file while T-OPS1 is in progress (it commits the whole working tree + verifies migrations). Claim it explicitly.
- After T-OPS1, the two agents run fully parallel, NO shared files:
  - Codex sequence:        T-OPS2 (alerting) → T-OPS6 (health endpoint) → T-OPS8 (security hardening) → T-OPS4 (test reliability).
  - Claude Code sequence:  T-OPS3 (worker deploy) → T-OPS5 (DPA RSS) → T-OPS9 (dead-deps + 404/loading) → T-OPS7 (perf pass).
  - One task per agent at a time. Claim on the line above before starting.
- File-ownership boundaries (hard walls, do not cross):
  - Codex owns: `src/lib/env.ts`, `src/lib/cron-auth.ts`, `.env.example`, `src/lib/alerting.ts` (new), `src/app/api/health/**` (new), repository/processor/worker/test files, `vitest.config.ts`, `src/agents/harness/**`.
  - Claude Code owns: `vercel.json`, `.github/**`, `docs/**`, `package.json` deps (T-OPS9), source registries (`*NewsSources.ts`), `src/content/**`, public/admin page + component files, `not-found.tsx`/`loading.tsx` (new).
  - `package.json`: Codex may add scripts; Claude Code owns the dependencies block (T-OPS9). If both must touch it, the one who needs it later rebases after the other's commit — coordinate via a one-line note here, do not edit concurrently.
  - Any contract a task exposes (e.g. T-OPS2 freshness-state shape consumed by an alert) must be restated in its completion note.
- Guardrails restated: no auto-publish, AI off by default, token/scan/budget limits untouched, no secrets in code or alert payloads.

### T-OPS1 (Claude Code) — Commit the in-flight work + CI + migration verification

- Objective: zero uncommitted work; every future push verified by CI; certainty about which migrations are live in prod.
- Steps: (a) group the ~73 modified/untracked files into logical commits per task ID (T-RT2A/2B/3A/3B/3C/3D-partial/4A/4B/5B/5C, harness T-HAR1–4, T-TST1, AGENTS/AI_TASKS/DECISIONS doc reorg, migrations 010/011); (b) push; (c) add `.github/workflows/ci.yml`: on push + PR, run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` (Node 20, no secrets — tests run in memory mode); (d) VERIFY migrations 010 + 011 are applied to remote Supabase (query `information_schema` for the new columns/table, or apply them idempotently) and record the result in a one-line note here. If they are NOT applied, applying them is part of this task (user approval required before running SQL against prod).
- Success criteria: `git status` clean; CI green on GitHub for the pushed head; migrations 010/011 confirmed applied (or applied) and noted.
- Files: `.github/workflows/ci.yml` (new) only; everything else is commits, not edits.
- Verification: CI run visible green; local suite green before push; migration check output recorded.

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

### T-OPS8 (Codex) — Security hardening (3 focused fixes)

- Objective: close the small auth/method inconsistencies found in the deep review. All three are low-risk, high-confidence, backend-owned.
- Scope:
  1. `src/lib/cron-auth.ts`: replace the `authHeader !== \`Bearer ${CRON_SECRET}\`` comparison with a length-checked `timingSafeEqual` (mirror the ingestion route pattern). Keep behavior + reasons identical; add a test asserting a wrong-but-same-length secret is rejected.
  2. `src/lib/env.ts`: in production (`NODE_ENV==='production'`), hard-fail `buildEnv()` if `ADMIN_USERNAME`/`ADMIN_PASSWORD` are still the defaults (`admin`/`change-me`) — same `EnvValidationError` pattern already used for ADMIN_AUTH_SECRET. Dev/test keep the convenient defaults. Add tests for both tiers.
  3. `src/app/api/ingestion/run/route.ts`: drop the `GET` handler (or make it return 405) so a mutation is only triggered by `POST`. Update the route test.
- Success criteria: targeted tests prove constant-time rejection + prod default-cred fail + GET no longer ingests; full suite + lint + typecheck + build green.
- Files: `src/lib/cron-auth.ts` (+test), `src/lib/env.ts` (+test), `src/app/api/ingestion/run/route.ts` (+test). NO overlap with T-OPS2 if T-OPS2 finished its env.ts edit first — otherwise sequence after T-OPS2 (both touch env.ts; Codex does them in order, so no conflict).
- Out of scope: any auth redesign, any new secret, any change to the working credential flow.

### T-OPS9 (Claude Code) — Dead deps + 404/loading polish

- Objective: lean install + complete the public UX shell.
- Scope:
  1. Remove `@splinetool/react-spline` and `@splinetool/runtime` from `package.json` (zero references in src — confirmed in the deep review); run `npm install` to update the lockfile; verify `npm run build` still passes.
  2. Add a branded `src/app/not-found.tsx` (404) consistent with the public design, and `loading.tsx` skeletons for the heavier public routes (`/ai-regulation`, `/ai-regulation/europe`, country/state pages) so navigation has instant feedback under ISR misses. Match existing `error.tsx` styling.
- Success criteria: build green with smaller dep tree; visiting an unknown route shows the branded 404; route transitions show a skeleton, not a blank gap.
- Files: `package.json` + lockfile, `src/app/not-found.tsx` (new), `src/app/**/loading.tsx` (new). NO backend files.
- Note: Spline removal touches `package.json` deps — Claude Code owns that block per the boundaries above; if Codex needs a script added to package.json meanwhile, coordinate order in a one-line note.

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
