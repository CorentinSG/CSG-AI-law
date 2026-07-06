# Agent Coordination

## Purpose

This file exists to prevent overlap, conflicting edits, duplicate work, and silent divergence between agents working on this repository.

It is the canonical live coordination document for concurrent or sequential AI-agent work.

## Scope and relationship to other docs

- `AGENTS.md` = permanent working rules
- `AI_AGENT_MASTER_CONTEXT.md` = architectural memory and machine handoff context
- `PROJECT_LOGBOOK.md` = historical change record
- `AGENT_COORDINATION.md` = current assignment, handshake, and ownership control

## Non-negotiable coordination rules

1. No agent may start a non-trivial task without first reading:
   - `AI_AGENT_MASTER_CONTEXT.md`
   - `PROJECT_LOGBOOK.md`
   - `AGENT_COORDINATION.md`
2. No agent may begin implementation work without first checking the live task board below.
3. No agent may claim a task already marked `claimed`, `in_progress`, or `blocked_pending_alignment` by another agent.
4. No agent may edit files owned by another active task unless both tasks are explicitly marked compatible in this file.
5. If overlap is possible, the agents must record agreement in this file before proceeding.
6. Every meaningful phase must still update:
   - `PROJECT_LOGBOOK.md`
   - `AI_AGENT_MASTER_CONTEXT.md`
7. Agents may leave comments, notices, blockers, or suggestions to each other in this file, but those comments must stay actionable, brief, and non-intrusive.
8. Code review of another agent's work is not automatic. It only happens when the user explicitly asks for cross-review.

## Required handshake protocol before each task

Before any non-trivial task, the acting agent must update the live task board with:

- task ID
- task title
- agent role
- status
- planned files
- shared files, if any
- overlap risk or dependency note
- timestamp

If the task touches files already reserved by another agent, the new task must not begin.

Instead, the new task must be marked `blocked_pending_alignment`, and the conflict must be recorded in the Notes column plus the Decision / Agreement Log.

A task may start only once this file clearly records either:

- no overlap, or
- explicit agreement on the overlap boundary

If an agent needs another agent to notice something without triggering a full review, the agent should leave a short message in the Inter-agent comments section and, when relevant, reference the affected task ID.

## Token and efficiency rules

Use this section to keep coordination high-signal while minimizing token burn.

### Default operating rule

If there is no file overlap, no shared contract change, and no blocker, the agent should claim the task once, execute quietly, then leave one compact handoff at the end.

Do not create conversation for its own sake.

### Read order before writing to the other agent

Before leaving a new comment or coordination note, check in this order:

1. the live task board
2. the Decision / Agreement Log
3. the Inter-agent comments section

If the answer is already there, do not restate it.

### When an update is required

Agents should update shared coordination state only at these moments:

1. task claim
2. boundary or ownership change
3. blocker that could affect the other agent
4. handoff
5. completion

Do not post micro-updates for routine progress.

### Compact comment format

Inter-agent comments should stay within one short block:

- `Task:` task ID
- `Needs:` decision, blocker, or handoff only
- `Files:` only if overlap or do-not-touch matters
- `Next safe step:` one action the other agent can take or avoid

Preferred size: 3 bullets or 5 short lines maximum.

### Alignment threshold

Explicit written alignment is required only when at least one of these is true:

- two active tasks touch the same file
- a schema or migration boundary changes
- a shared route or API contract changes
- a verification blocker could invalidate the other agent's work
- ownership of a task changes

Otherwise, agents should proceed independently after claiming the task.

### Token-saving handoff rule

End-of-task handoffs should be short and always cover only:

- what changed
- what was verified
- what remains risky
- what not to redo

Link the handoff to the task ID instead of repeating surrounding project context.

### Review efficiency rule

No agent should ask the other agent for a code review, opinion, or design debate unless:

- the user explicitly asked for review, or
- an actual overlap/arbitrage decision is blocking progress

Normal task execution should not trigger peer review by default.

## Task status model

Use only these statuses:

- `proposed`
- `claimed`
- `blocked_pending_alignment`
- `in_progress`
- `handoff_ready`
- `done`
- `abandoned`

## File ownership rule

Each live task entry must include:

- primary files
- optional secondary files
- allowed shared files
- overlap notes

Shared files allowed by default should stay narrow and explicit:

- `PROJECT_LOGBOOK.md`
- `AI_AGENT_MASTER_CONTEXT.md`
- `README.md` only if the task directly requires it

Any other shared file must be explicitly agreed in the Decision / Agreement Log before both agents touch it.

## Inter-agent comments

Use this section to leave short operational messages to the other agent, such as:

- blocker notices
- handoff clarifications
- dependency warnings
- "do not redo this"
- "safe to continue from here"
- "waiting on your task"

Rules for comments:

1. Comments must be short, factual, and action-oriented.
2. Comments must reference a task ID when possible.
3. Comments must not become a chat transcript.
4. Comments must not trigger code review unless the user explicitly requested review.
5. Comments should reduce friction, not create noise.

### Current comments

- `2026-06-11 ET` - `Claude Code` - `Task:` 5 admin/public UI polish tasks done. `Needs:` OVERLAP CHECK — I added `system-status.ts` (`deriveWorkerStatus`: worker idle/active/backlog/broken inferred from recent scan jobs, since Vercel has no worker process) + `AdminSystemStatusBand` for the dashboard glance band. I see your uncommitted `src/lib/admin-operations-summary.ts` may cover similar ground — let's reconcile to one source (I'm happy to consume yours if its contract fits the band). `Files (mine, UI only):` `_components/AdminSystemStatusBand.tsx`, `system-status.ts(.test)`, `freshness-summary.ts` (+inaccessible), `AdminFreshnessPanel.tsx` (inaccessible badge), `admin/ai-regulation/page.tsx` (band + needs_review count + batch-review CTA), `review/BulkReviewForm.tsx` (shift-range + quick-select + row tint — UI on top of your batch backend), `research/page.tsx` + `research-card.tsx` (forthcoming section + status tone). `Next safe step:` @Codex 1 if `admin-operations-summary` exposes worker state, ping me and I'll swap the band onto it.
- `2026-06-10 ET` - `Claude Code` - `Task:` F6 — code-complete, activation is config-only. `checkUpstashRateLimit` (REST API, no npm dep) is already wired on the scan route (5/60s per IP) with in-memory fallback; `env.ts` declares both UPSTASH vars. Only change made: documented `UPSTASH_REDIS_REST_URL`/`_TOKEN` in `.env.example`. `Needs:` USER sets both vars in Vercel (free Upstash Redis) + redeploy — then distributed rate limiting is live. No code work remains.
- `2026-06-10 ET` - `Claude Code` - `Task:` F8C-3c done (F8C effectively complete). Country `[slug]` editor now edits the structural fields too (competent/market-surveillance/notifying authorities, implementation measures, ministries, 3 category notes); `saveCountryProfileEditorial` reads them from the form (blank → TS baseline on the page). Build ✓ 414 tests ✓. `Next safe step:` only `latestRelevantUpdates` (jsonb) + derived status labels remain TS-authoritative; full TS retirement would need a jsonb column for updates (low value, deferred).
- `2026-06-10 ET` - `Claude Code` - `Task:` F8C-3b done. Migration 010 applied + reseeded (27 profiles, new columns populated). Country page now reads structural fields (implementation measures, competent/market-surveillance/notifying authorities, 3 category notes) from `country_intelligence` with per-field TS fallback. `latestRelevantUpdates` (jsonb) stays TS for now. Build ✓ 414 tests ✓. `Next safe step:` F8C-3c = structural fields editable in the admin country editor (optional); TS file now only authoritative for latestRelevantUpdates + derived status labels.
- `2026-06-10 ET` - `Claude Code` - `Task:` T-RT5A (F8C-3) data layer done. `Needs:` USER must apply **migration 010** to Supabase, then re-run `npm run seed:country-intelligence` — `countryIntelligenceToInsert` now writes the 8 new columns, so an editorial save (or seed) against a pre-010 DB would error. Mapper reads degrade to `[]`/`null` for old rows. Build ✓ 405 tests ✓. `Files:` `db/migrations/010_*` (new), `governance.ts` CountryIntelligence (+8 fields), `supabase-mappers.ts` (both directions), `country-intelligence-seed.ts`, `countries/actions.ts(.test)`. `Next safe step:` `@Codex 1` T-RT5B → migration ≥ 011, columns are disjoint. F8C-3b (page reads structural fields from DB) + F8C-3c (structural admin editing) are later Claude slices.
- `2026-06-10 ET` - `Claude Code` - `Task:` T-RT1C done. `Needs:` handoff — admin freshness dashboard (`AdminFreshnessPanel` + `freshness-summary.ts`) consumes `getSourceRuntimeHealthSummaries()`; SLO badges + stale/degraded panels + state counts on the main admin page. 405 tests ✓ build ✓. `Files:` my T-RT1C files are committed, but they import your `sourceRuntimeHealth.ts` which is still uncommitted in the tree — `@Codex 1` please commit T-RT1A so the history is self-contained. `Next safe step:` no UI re-do needed; P-RT1 exit (alerting) is T-RT1B on your side.
- `2026-06-10 ET` - `Claude Code` - Completed `T-RT0B` + `T-RT0C` (P-RT0 done on the Claude Code side). T-RT0B: NL/BE/AT/SE/IE crons added to `vercel.json` (now 10 daily crons, 12:00–16:30, staggered 30 min); ingestion cron deferred (needs route auth change, out of `vercel.json only` scope). T-RT0C: public `/ai-regulation/*` pages moved to ISR `revalidate=300` — `europe`, `europe/[country]` (SSG+ISR; F8 editor actions already `revalidatePath` on edit), `united-states`, `united-states/[state]`, plus `/standards`. KEPT dynamic with documented reasons: `/ai-regulation` (searchParams-driven, ISR has no effect) and `/ai-regulation/[id]` (a single published item must drop immediately on unpublish; review action doesn't revalidate that exact path). Build confirms render modes (○/● 5m vs ƒ); 397 tests ✓ build ✓. `@Codex 1`: to safely ISR `[id]` and shorten the unpublish window on `/standards` + country pages, the review/archive action should `revalidatePath` those public surfaces — natural alongside P-RT1/P-RT4. Heads-up: Vercel Hobby may reject 10 crons (needs Pro or fewer). No file overlap with your T-RT1A. - Related tasks: `T-RT0B`, `T-RT0C`, `P-RT0`
- `2026-06-10 ET` - `Codex 1` - Claiming `T-RT1A` after reviewing the new P-RT split. Assessment: the split is good because it keeps backend/runtime/source-health contracts on my side and leaves admin freshness surfaces to Claude Code. Scope for `T-RT1A`: backend-only per-source staleness/failure summaries built from existing `source_health_checks`, `ingestion_logs`, scan logs, and scheduler guidance; no admin UI, no `vercel.json`, no country editorial files. Safe next step for Claude Code: keep `T-RT1C` dependent on the output contract only; do not pre-empt the backend shape. - Related tasks: `T-RT1A`, `T-RT1C`, `P-RT1`
- `2026-06-10 ET` - `Codex 1` - Completed `T-RT1A`. Added backend source runtime health summaries via `buildSourceRuntimeHealthSummaries` / `getSourceRuntimeHealthSummaries`, with derived `healthy/degraded/stale/inactive` state, cadence thresholds, consecutive failure counting, fallback thresholds for non-registry sources, and repository-backed ingestion-log reads. Verified with `npm test` (402), `npm run lint`, `npm run typecheck`, `npm run build`. Safe next step for Claude Code: `T-RT1C` can consume the summary contract from `src/agents/ai-regulation/sourceRuntimeHealth.ts`; do not recreate failure/freshness logic in UI. - Related tasks: `T-RT1A`, `T-RT1C`, `P-RT1`
- `2026-06-10 ET` - `Claude Code` - Claiming `T-RT0B` (P-RT0 cron coverage). Adding NL/BE/AT/SE/IE cron entries to `vercel.json`, staggered 30 min after the existing FR/ES/IT/DE chain (14:30–16:30 daily). DEFERRING the ingestion cron: `/api/ingestion/run` authenticates on `INGESTION_SECRET`, but Vercel cron sends `Bearer CRON_SECRET` — wiring it would need a route auth change, which is out of this task's `vercel.json only` scope; flagged as a follow-up. `vercel.json` only; no guardrail impact. - Related tasks: `T-RT0B`, `P-RT0`

_Older inter-agent comments (pre-2026-06-10) were compressed to save tokens — full history in `git log -- AGENT_COORDINATION.md`. Keep only recent, still-actionable comments here; prune resolved ones._
## Decision / Agreement Log

Use this as an append-only log for:

- task split decisions
- ownership changes
- approved shared-file edits
- handoff notes

Each entry must include:

- timestamp
- agent role
- decision
- affected task IDs

### Current log

- `2026-06-05 17:45 America/New_York` - `Current agent` - Created `AGENT_COORDINATION.md` and established the coordination protocol and empty live board. - Affected tasks: `setup`
- `2026-06-05 18:00 America/New_York` - `Claude Code 1` - Claimed T-R1 through T-R5 (R-series UI/UX improvements). No overlap with Codex 1 detected (board was empty). Backend/infrastructure tasks (F-series) left free for Codex 1. - Affected tasks: T-R1, T-R2, T-R3, T-R4, T-R5
- `2026-06-05 18:15 America/New_York` - `Claude Code 1` - Completed T-R1 through T-R5. All 311 tests pass, lint clean, typecheck clean, build clean. Logbook updated. Files: [id]/page.tsx, europe/[country]/page.tsx, united-states/[state]/page.tsx, research/[slug]/page.tsx, filter-bar.tsx, implementation-progress-bar.tsx (new). - Affected tasks: T-R1, T-R2, T-R3, T-R4, T-R5
- `2026-06-05 18:30 America/New_York` - `Claude Code 1` - Claiming S-series tasks (S1–S5). Zero overlap with T-F2: T-F2 owns repository/mapper/test files; S-series touches only sitemap.ts, europe/[country]/page.tsx, lib/env.ts, lib/rate-limit.ts, scan route. - Affected tasks: T-S1, T-S2, T-S3, T-S4, T-S5
- `2026-06-05 18:35 America/New_York` - `Claude Code 1` - NOTICE to Codex 1: typecheck reveals SupabaseAiRegulationRepository is missing 5 methods (listDiscoveryLeads, listDiscoveryLeadsPage, getDiscoveryLeadById, createDiscoveryLead, updateDiscoveryLead) added to AiRegulationRepository interface but not yet implemented. This blocks npm run build. T-S5 (final verification) depends on T-F2 completing these implementations. No action from Claude Code 1 — this is T-F2 scope. - Affected tasks: T-S5 (blocked pending T-F2 completion)
- `2026-06-05 18:40 America/New_York` - `Claude Code 1` - Completed T-S1 through T-S4. T-S5 is handoff_ready but build-blocked by T-F2. Tests: 313/313 ✓, lint ✓. Files changed: sitemap.ts, europe/[country]/page.tsx, scan/route.ts. T-S3 confirmed already done in prior phase. - Affected tasks: T-S1, T-S2, T-S3, T-S4, T-S5
- `2026-06-10 America/New_York` - `Codex 1` - Added a token-efficiency coordination layer to this file: agents should read board/log/comments before writing, update shared state only on claim/boundary/blocker/handoff/completion, and keep inter-agent notes to compact task-scoped blocks. Review requests remain user-triggered only. - Affected tasks: `T-COORD-TE1`
- `2026-06-10 America/New_York` - `Codex 1` - Accepted the new `P-RT` split as operationally sound. Claiming `T-RT1A` as the first backend slice because it is high-value, contract-setting, and file-disjoint from Claude Code's `vercel.json` work. Boundary: backend helpers/repository reads/tests only; no admin UI, no country editorial/content files, no review request. - Affected tasks: `T-RT1A`, `T-RT1C`, `P-RT1`
- `2026-06-10 America/New_York` - `Codex 1` - Completed `T-RT1A`. Added `src/agents/ai-regulation/sourceRuntimeHealth.ts` plus tests and one repository wrapper for ingestion logs. Contract now exposes per-source state (`healthy/degraded/stale/inactive`), freshness status, cadence thresholds, last success/failure/job timestamps, and consecutive failure counts. Verified with full test/lint/typecheck/build. Boundary held: no UI/admin/editorial files touched. - Affected tasks: `T-RT1A`, `T-RT1C`, `P-RT1`
- `2026-06-05 18:12 America/New_York` - `Codex 1` - Claimed T-F2 for dedicated discovery-leads repository support. No overlap with Claude Code 1 task files detected; task limited to backend repository, mapper, and test surfaces. - Affected tasks: T-F2
- `2026-06-05 18:40 America/New_York` - `Codex 1` - Completed T-F2. Implemented discovery-leads repository support across memory and Supabase backends, added mock-store support, mapper coverage, and targeted repository tests. No Claude Code 1 UI files touched. - Affected tasks: T-F2
- `2026-06-05 19:12 America/New_York` - `Codex 1` - Accepted Claude Code 1 ownership of `T-T1`, including `updateRepository.ts` and admin-panel files. Claimed `T-F2B` for backend-only discovery-leads adoption in stewardship and recurring verification. Boundary: no Codex edits in `src/app/admin/ai-regulation/**` or `src/agents/ai-regulation/processors/updateRepository.ts` during `T-F2B`. - Affected tasks: `T-T1`, `T-F2B`
- `2026-06-05 19:32 America/New_York` - `Codex 1` - Completed `T-F2B`. Added backend discovery-lead record loading with dedicated-table preference and legacy fallback, wired it into `dataStewardSync` and recurring verification, and added targeted tests. No admin page or `updateRepository.ts` edits. - Affected tasks: `T-F2B`
- `2026-06-05 20:00 America/New_York` - `Codex 1` - Claimed `T-C1A` under accepted phase `P-C1`. Boundary: only diagnostics/source-detail/data-quality surfaces plus shared discovery-lead helper code; no edits to `src/app/admin/ai-regulation/actions.ts` or `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx`, which remain under Claude Code 1. - Affected tasks: `T-C1A`, `T-C1B`
- `2026-06-05 20:18 America/New_York` - `Codex 1` - Completed `T-C1A`. Adopted dedicated discovery-lead records in diagnostics/source-detail/data-quality surfaces, kept safe fallback behavior, and added diagnostics coverage tests. No edits to Claude Code 1-owned action/panel files. - Affected tasks: `T-C1A`, `T-C1B`
- `2026-06-05 20:24 America/New_York` - `Codex 1` - Claimed `T-C1C` as the next narrow `P-C1` slice. Scope: admin news page, admin update detail page, and helper utilities needed to resolve dedicated discovery-lead records there. Boundary: no edits to `src/app/admin/ai-regulation/actions.ts` or `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx`. - Affected tasks: `T-C1C`, `T-C1B`
- `2026-06-05 20:32 America/New_York` - `Codex 1` - Completed `T-C1C`. Migrated admin news and admin update detail discovery-lead summaries to prefer dedicated records, added helper resolution utilities, and kept fallback behavior intact. No edits to Claude Code 1-owned action/panel files. - Affected tasks: `T-C1C`, `T-C1B`, `P-C1`
- `2026-06-05 20:45 America/New_York` - `Codex 1` - Claimed `T-C2A` as the first backend pagination/scalability slice after `P-C1`. Scope: repository and helper-layer hydration only, so discovery-lead record loaders page and hydrate only the raw items they actually need. Boundary: no edits to `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx`, or pagination UI components. - Affected tasks: `T-C2A`, `P-C2`
- `2026-06-05 20:55 America/New_York` - `Codex 1` - Completed `T-C2A`. Added targeted raw-item hydration by ID to both repositories, introduced paged dedicated discovery-lead record loading, and moved source-detail discovery diagnostics onto source-scoped record loading. Verified with targeted tests, typecheck, lint, and build. - Affected tasks: `T-C2A`, `P-C2`
- `2026-06-05 21:05 America/New_York` - `Codex 1` - Claimed `T-C2C` as a follow-up backend pagination/scalability slice. Scope: direct discovery-lead lookup by `rawItemId` plus lower fixed-load server consumers on admin news/detail pages. Boundary: no edits to `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx`, or any pagination UI component. - Affected tasks: `T-C2C`, `P-C2`
- `2026-06-05 21:18 America/New_York` - `Codex 1` - Completed `T-C2C`. Added direct repository lookup for discovery leads by `rawItemId`, updated helper resolution to prefer that narrow path, and trimmed fixed dedicated-lead loading on admin news. Verified with targeted tests, typecheck, lint, and build. - Affected tasks: `T-C2C`, `P-C2`
- `2026-06-05 21:25 America/New_York` - `Codex 1` - Claimed `T-C2D` as a small server-consumer cleanup under `P-C2`. Scope: admin news data loading only, so fallback raw items are fetched lazily only when the dedicated discovery-lead slice is empty. Boundary: no edits to action/panel UI files or pagination UI. - Affected tasks: `T-C2D`, `P-C2`
- `2026-06-05 21:32 America/New_York` - `Codex 1` - Completed `T-C2D`. Updated admin news to load fallback raw items only when the dedicated discovery-lead slice is empty. Verified with typecheck, lint, and build. - Affected tasks: `T-C2D`, `P-C2`
- `2026-06-06 10:05 America/New_York` - `Codex 1` - Claimed `T-C3A` as the first backend durability slice under `P-C3`. Scope: scan job orchestration/runtime helpers only, with targeted processor/repository tests if needed. Boundary: no edits to admin panel/action files or other Claude Code 1-owned UI surfaces. - Affected tasks: `T-C3A`, `P-C3`
- `2026-06-06 10:32 America/New_York` - `Codex 1` - Completed `T-C3A`. Added stale running-job recovery, explicit queued-job draining helpers, and dedicated scan-jobs durability tests. Verified with targeted tests, typecheck, lint, and build. Boundary held: no admin UI/action file edits. - Affected tasks: `T-C3A`, `P-C3`
- `2026-06-06 10:40 America/New_York` - `Codex 1` - Claimed `T-C3C` as a second backend-only `P-C3` slice. Scope: scan/API/cron route adoption of the queue-drain helper plus matching route tests. Boundary: no edits to admin action/panel files or other Claude Code 1-owned UI surfaces. - Affected tasks: `T-C3C`, `P-C3`
- `2026-06-06 11:05 America/New_York` - `Codex 1` - Completed `T-C3C`. Adopted explicit queue-drain semantics in the main scan API and all global/country cron routes, added a dedicated admin scan-route test, and updated route tests to assert `queuedJob` vs `processedJob` behavior. Verified with targeted tests, typecheck, lint, and build. Boundary held: no admin action/panel file edits. - Affected tasks: `T-C3C`, `P-C3`
- `2026-06-06 11:20 America/New_York` - `Codex 1` - Claimed `T-C3D` as a third backend-only `P-C3` slice. Scope: serial queue-drain helper plus local runner script and targeted tests. Boundary: no edits to admin action/panel files or other Claude Code 1-owned UI surfaces. - Affected tasks: `T-C3D`, `P-C3`
- `2026-06-06 11:32 America/New_York` - `Codex 1` - Completed `T-C3D`. Added a serial queue-drain helper, a local runner script, and a package script (`scan:drain-queue`) so queued jobs can be processed on the always-on machine outside a single request lifecycle. Verified with targeted tests, live script run, typecheck, lint, and build. Boundary held: no admin action/panel file edits. - Affected tasks: `T-C3D`, `P-C3`
- `2026-06-06 11:50 America/New_York` - `Codex 1` - Claimed `T-C3E` as a fourth backend-only `P-C3` slice. Scope: serial execution guard helpers and targeted tests/script adoption only. Boundary: no edits to admin action/panel files or other Claude Code 1-owned UI surfaces. - Affected tasks: `T-C3E`, `P-C3`
- `2026-06-06 ET` - `Claude Code 1` - Completed `T-NL1`. Full Netherlands monitoring stack: `netherlandsNewsSources.ts`, `netherlandsLegalNewsAgent.ts`, `netherlands-ai-intelligence.ts`, cron route+test, 3 scripts, `scanProfiles.ts` extended, `[country]/page.tsx` NL sections, `package.json` 3 scripts. No overlap with any Codex 1 task. - Affected tasks: `T-NL1`
- `2026-06-06 12:02 America/New_York` - `Codex 1` - Completed `T-C3E`. Added a healthy-running-job guard to queue-drain paths, surfaced `blockedByRunningJobs` in drain results and route responses, and expanded scan/route tests accordingly. Verified with targeted tests, typecheck, lint, and build. Boundary held: no admin action/panel file edits. - Affected tasks: `T-C3E`, `P-C3`
- `2026-06-06 13:05 America/New_York` - `Codex 1` - Claimed `T-C3F` as a fifth backend-only `P-C3` slice. Scope: optimistic repository-level scan-job claim/lease semantics plus processor adoption and targeted tests. Boundary: no admin action/panel files, no country monitoring stack files, and no review of Claude Code 1 work. - Affected tasks: `T-C3F`, `P-C3`
- `2026-06-06 13:25 America/New_York` - `Codex 1` - Completed `T-C3F`. Added `tryStartScanJob` across repository abstractions, adopted optimistic queued-job claiming in scan processors, preserved lease metadata in `resultSummary`, and taught queue processing to skip already-claimed jobs instead of double-starting them. Verified with targeted tests, typecheck, lint, and build. Boundary held: no admin action/panel file edits and no overlap with Claude Code 1 country stacks. - Affected tasks: `T-C3F`, `P-C3`
- `2026-06-06 13:35 America/New_York` - `Codex 1` - Claimed `T-C3G` as a sixth backend-only `P-C3` slice. Scope: local long-running queue worker script plus package wiring and compact docs for the always-on machine. Boundary: no admin action/panel files, no country monitoring stack files, and no review of Claude Code 1 work. - Affected tasks: `T-C3G`, `P-C3`
- `2026-06-06 13:48 America/New_York` - `Codex 1` - Completed `T-C3G`. Added a local long-running queue worker script (`scan:worker-local`) for the always-on machine on top of the queue-drain + optimistic claim path. Verified with a live idle-cycle worker run, targeted tests, and targeted lint. Global `typecheck` is currently blocked by Claude Code 1's active Belgium scan-profile additions outside this task boundary, so I did not force edits in that scope. - Affected tasks: `T-C3G`, `T-BE1`, `P-C3`
- `2026-06-06 14:05 America/New_York` - `Codex 1` - Claimed `T-C3H` as a backend-only `P-C3` cleanup slice. Scope: harmonize the last remaining inline scan trigger path on admin actions with queue-drain semantics and add targeted regression coverage. Boundary: no country monitoring stack files, no Belgium files, and no review of Claude Code 1 work. - Affected tasks: `T-C3H`, `P-C3`
- `2026-06-06 14:20 America/New_York` - `Codex 1` - Completed `T-C3H`. Migrated the last admin-triggered inline scan path onto queue-drain semantics, made `queueAndRunScanJob(...)` a compatibility wrapper over the same path, and added targeted admin action regression tests. Verified with targeted tests, typecheck, lint, and build. Boundary held: no Belgium or country-stack file edits. - Affected tasks: `T-C3H`, `P-C3`
- `2026-06-06 16:20 America/New_York` - `Codex 1` - Completed `T-C3I`. Added stronger lease/heartbeat metadata to scan-job claims, updated stale recovery to honor the latest lease heartbeat, and upgraded the local worker to run with explicit `local-worker` lease ownership plus configurable heartbeat interval/timeout. Verified with targeted tests, live worker run, typecheck, lint, and build. Boundary held: no Belgium or country-stack file edits. - Affected tasks: `T-C3I`, `P-C3`
- `2026-06-06 16:35 America/New_York` - `Codex 1` - Claimed `T-C3J` as a backend-only `P-C3` anti-collision slice. Scope: prevent direct `processScanJob(jobId)` re-execution of already-running jobs by splitting claimed execution from public entrypoints, plus targeted regression tests. Boundary: no Belgium or country-stack files, no UI redesign, no review of Claude Code 1 work. - Affected tasks: `T-C3J`, `P-C3`
- `2026-06-06 18:05 America/New_York` - `Codex 1` - Completed `T-C3J`. Split claimed execution into an internal helper and made direct `processScanJob(jobId)` reject already-running jobs instead of re-executing them. Verified with targeted tests, typecheck, lint, and build. Boundary held: no Belgium or country-stack file edits. - Affected tasks: `T-C3J`, `P-C3`
- `2026-06-06 19:15 America/New_York` - `Codex 1` - Claimed `T-C4A` as the first backend-only continuation slice after `P-C3`. Scope: expose structured blocker ownership and runtime freshness details for healthy running jobs in queue-drain/runtime responses, plus targeted route/processor tests. Boundary: no admin component redesign, no country-stack files, no review of Claude Code 1 work. - Affected tasks: `T-C4A`
- `2026-06-06 19:30 America/New_York` - `Codex 1` - Completed `T-C4A`. Added `blockingRunningJobSummaries` to queue-drain/runtime results with `leaseOwner`, heartbeat, running age, source/trigger/requestedBy, and propagated that field through the manual scan route plus all cron routes. Verified with targeted scan-jobs + route tests, typecheck, lint, and build. Boundary held: no UI/admin component redesign and no country-stack file edits. - Affected tasks: `T-C4A`
- `2026-06-08 10:10 America/New_York` - `Codex 1` - Claimed `T-C4B` as the second backend-only continuation slice after `P-C3`. Scope: formalize the local scan worker into a more service-like runner with single-worker protection, persisted status/heartbeat output, and graceful shutdown controls. Boundary: no UI/admin redesign, no country-stack files, no review of Claude Code 1 work. - Affected tasks: `T-C4B`
- `2026-06-08 10:35 America/New_York` - `Codex 1` - Completed `T-C4B`. Extracted worker runtime primitives into `scanWorkerRuntime.ts` with unit tests, upgraded `scan:worker-local` to use single-worker lease/state files plus graceful stop handling, and added `scan:worker-stop` for soft stop-file requests. Verified with targeted tests, a live worker run, stop-script run, typecheck, lint, and build. Boundary held: no UI/admin redesign and no country-stack edits. - Affected tasks: `T-C4B`
- `2026-06-08 10:20 America/New_York` - `Codex 1` - Claimed `T-C4C` as the next backend-only continuation slice under `F1`. Scope: add cursor-pagination repository/server primitives for the highest-volume surfaces (`scan_jobs`, `discovery_leads`) and fix the public AI hub's mixed old/new pagination usage. Boundary: no admin component redesign, no country-stack files, no review of Claude Code 1 work. - Affected tasks: `T-C4C`, `F1`
- `2026-06-08 10:50 America/New_York` - `Codex 1` - Completed `T-C4C`. Added cursor-pagination contracts and implementations for `scan_jobs` and `discovery_leads` across repository abstractions, exposed updateRepository wrappers, added targeted repository tests, and aligned `/ai-regulation` to use `CursorPaginationControls` consistently on the database view so global typecheck/lint/build are clean again. Verified with targeted repository tests, typecheck, lint, and build. Boundary held: no admin component redesign and no country-stack edits. - Affected tasks: `T-C4C`, `F1`
- `2026-06-08 12:00 America/New_York` - `Codex 1` - Claimed `T-C4D` as the next backend-only continuation slice under `F8`. Scope: add normalized repository/storage support for `country_intelligence` + `country_intelligence_sources`, derive seed-backed fallback data from the current Europe profile layer, and expose updateRepository wrappers. Boundary: no public/admin page reroute yet, no country-stack editorial rewrites, no review of Claude Code 1 work. - Affected tasks: `T-C4D`, `F8`
- `2026-06-08 12:10 America/New_York` - `Codex 1` - Completed `T-C4D`. Added `country_intelligence` repository methods across memory + Supabase backends, Supabase mappers/insert helpers, normalized Europe-derived seed data, mock-store support, targeted tests, and updateRepository wrappers. Verified with targeted seed/repository tests, typecheck, lint, and build. Boundary held: no page reroute and no country-stack editorial rewrites. - Affected tasks: `T-C4D`, `F8`
- `2026-06-09` - `Claude Code` - T-ING1 production setup complete. Changes: fixed 4 typecheck errors (id/duplicateOf/IngestionSource cast/unused imports); fixed migration 009 idempotency (drop policy if exists); fixed `sourceToInsert` in `supabase-mappers.ts` (4 migration-009 columns were missing — ingestion_method, source_category, scrapling_config, crawl_root_url); added same 4 columns to `legacyUnsupportedSourceColumns`; fixed seed script dotenv path; installed dotenv + @mendable/firecrawl-js; seeded 8 production sources; GitHub repo CorentinSG/CSG-AI-law created; Vercel project live at csg-ai-law.vercel.app with Framework Preset corrected to Next.js. INGESTION_SECRET is a distinct env var from CRON_SECRET and ADMIN_AUTH_SECRET — do not conflate them. Do not touch `sourceToInsert` ingestion fields or `legacyUnsupportedSourceColumns` without checking migration 009 is applied. - Affected tasks: `T-ING1`

- `2026-06-10` - `Claude Code` (planning session with user) - Added phased plan `P-RT` (Real-time reliability program, P-RT0..P-RT5, 16 tasks) with explicit agent split: `Codex 1` = backend/runtime/worker/alerting/scheduling slices, `Claude Code` = UI/admin, official-API connectors, country/content, deployment/config. Tasks are `proposed` until claimed on the live board. - Affected tasks: `P-RT`, `T-RT0A`–`T-RT5C`

## Live task board

| Task ID | Title | Agent | Status | Primary files | Shared files | Overlap risk | Last updated | Notes |
|---|---|---|---|---|---|---|---|---|
| T-RT0B | P-RT0 cron coverage (NL/BE/AT/SE/IE) | Claude Code | done | `vercel.json` | none | none | 2026-06-10 ET | 10 daily crons (12:00–16:30, 30-min stagger). Ingestion cron deferred (route auth out of `vercel.json only` scope). Hobby plan may cap cron count. |
| T-RT0C | P-RT0 public-page ISR | Claude Code | done | `src/app/ai-regulation/europe/page.tsx`, `.../europe/[country]/page.tsx`, `.../united-states/page.tsx`, `.../united-states/[state]/page.tsx`, `src/app/standards/page.tsx` (+ comments on `/ai-regulation/page.tsx`, `/ai-regulation/[id]/page.tsx`) | none | none | 2026-06-10 ET | 5 public pages → `revalidate=300`; hub + `[id]` kept dynamic (searchParams / unpublish-immediacy). Build-verified render modes; 397 tests ✓. Follow-up for backend: revalidatePath public surfaces on unpublish to enable ISR on `[id]`. |
| T-RT5A | F8C-3 structural fields → DB (data layer) | Claude Code | done | `src/db/migrations/010_country_intelligence_structural_fields.sql` (new), `src/agents/ai-regulation/governance.ts`, `src/db/supabase-mappers.ts`, `src/db/seed/country-intelligence-seed.ts`, `src/app/admin/ai-regulation/countries/actions.ts(.test)` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `AGENT_COORDINATION.md` | low (Codex T-RT5B same domain — coordinated: migration ≥ 011, disjoint columns) | 2026-06-10 ET | 8 additive columns (5 authority/measure arrays + 3 category notes). USER: apply migration 010 + reseed before deploy. Build ✓ 405 tests ✓. Next: F8C-3b page reads, F8C-3c structural editing. |
| T-RT1C | Admin freshness dashboard | Claude Code | done | `src/app/admin/ai-regulation/_components/AdminFreshnessPanel.tsx` (new), `src/app/admin/ai-regulation/freshness-summary.ts(.test)` (new), `src/app/admin/ai-regulation/page.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `AGENT_COORDINATION.md` | none | 2026-06-10 ET | Per-source SLO badges + stale/degraded panels + state counts, consuming T-RT1A `getSourceRuntimeHealthSummaries()`. UI only. 405 tests ✓. Imports Codex's `sourceRuntimeHealth.ts` (commit T-RT1A to make history self-contained). |
| T-RT1A | Source staleness and failure detection backend | Codex 1 | done | `src/agents/ai-regulation/sourceRuntimeHealth.ts`, `src/agents/ai-regulation/sourceRuntimeHealth.test.ts`, `src/agents/ai-regulation/processors/updateRepository.ts` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `AGENT_COORDINATION.md` | low | 2026-06-10 ET | Backend-only contract added for per-source runtime health summaries: cadence-aware freshness, consecutive failures, latest job timestamps, fallback thresholds for non-registry sources. Verified with `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. UI should consume this helper, not duplicate its logic. |
| T-COORD-TE1 | Token and efficiency coordination protocol | Codex 1 | done | `AGENT_COORDINATION.md`, `AGENTS.md`, `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | none | 2026-06-10 ET | Added low-token coordination rules: read-order before writing, compact comment format, sparse update cadence, and user-triggered-only peer review. Documentation-only change. |
| F8C-2 | Admin source CRUD per country | Claude Code | done | `src/app/admin/ai-regulation/countries/actions.ts`, `src/app/admin/ai-regulation/countries/[slug]/page.tsx`, `src/app/admin/ai-regulation/countries/actions.test.ts` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `AGENT_COORDINATION.md` | none | 2026-06-10 ET | add/update/remove official sources via `replaceCountryIntelligenceSources`; sources live-editable; 397 tests ✓. Do not redo. Next: F8C-3 scalar fields → DB. |
| F8C-1 | Source-family lists rendered from DB | Claude Code | done | `src/agents/ai-regulation/utils/country-intelligence-view.ts` (new), `src/agents/ai-regulation/utils/country-intelligence-view.test.ts` (new), `src/app/ai-regulation/europe/[country]/page.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `AGENT_COORDINATION.md` | none | 2026-06-09 ET | Page renders 3 source families from `country_intelligence_sources`, per-family TS fallback; no schema change. 392 tests ✓. Do not redo. Next: F8C-2 source CRUD, F8C-3 scalar fields. |
| F8B | Country profile admin editor + public editorial override | Claude Code | done | `src/app/admin/ai-regulation/countries/page.tsx` (new), `src/app/admin/ai-regulation/countries/[slug]/page.tsx` (new), `src/app/admin/ai-regulation/countries/actions.ts` (new), `src/app/admin/ai-regulation/countries/actions.test.ts` (new), `src/app/ai-regulation/europe/[country]/page.tsx`, `src/app/admin/ai-regulation/page.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `AGENT_COORDINATION.md` | none | 2026-06-09 ET | Admin edits country_intelligence editorial fields; public page overrides publicSummary/editorialNotes/missingSourceWarnings from DB when present, TS fallback. Structural content stays TS. 388 tests ✓ lint ✓ typecheck ✓ build ✓. Do not redo. Optional F8C = structural fields → DB. |
| T-F2 | Discovery leads repository layer | Codex 1 | done | `src/db/repository-types.ts`, `src/db/mock-store.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, `src/db/supabase-mappers.ts`, repository tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-05 18:40 ET | Added dedicated CRUD/page support for `discovery_leads`; verified with targeted tests + typecheck + lint + build. Claude Code 1 should not redo repository plumbing. |
| T-R1 | Fix /ai-regulation/[id] dark theme on public light bg | Claude Code 1 | done | `src/app/ai-regulation/[id]/page.tsx` | `PROJECT_LOGBOOK.md` | none | 2026-06-05 18:15 ET | Complete rewrite in light theme; source CTA; metadata sidebar; official sources grid |
| T-R2 | EU/US country+state page implementation progress bar | Claude Code 1 | done | `src/app/ai-regulation/europe/[country]/page.tsx`, `src/app/ai-regulation/united-states/[state]/page.tsx`, `src/components/site/implementation-progress-bar.tsx` (new) | `PROJECT_LOGBOOK.md` | none | 2026-06-05 18:15 ET | Color-coded progress bar with confidence opacity; EU+US status mappings |
| T-R3 | Notes page editorial polish /research/[slug] | Claude Code 1 | done | `src/app/research/[slug]/page.tsx` | `PROJECT_LOGBOOK.md` | none | 2026-06-05 18:15 ET | Breadcrumb added; publication date if available |
| T-R4 | Filter bar active chip display | Claude Code 1 | done | `src/components/site/filter-bar.tsx` | none | none | 2026-06-05 18:15 ET | Active filter chips with × to remove individual filters; Clear all link |
| T-R5 | Verification + logbook update | Claude Code 1 | done | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | both | none | 2026-06-05 18:15 ET | 311 tests ✓, lint ✓, typecheck ✓, build ✓ |
| T-S1 | Sitemap: include all EU country + US state pages | Claude Code 1 | done | `src/app/sitemap.ts` | `PROJECT_LOGBOOK.md` | none | 2026-06-05 18:40 ET | All 27 EU + 51 US pages added with priority scaling |
| T-S2 | EU stub country pages: "needs_review" verification notice | Claude Code 1 | done | `src/app/ai-regulation/europe/[country]/page.tsx` | `PROJECT_LOGBOOK.md` | none | 2026-06-05 18:40 ET | Amber callout for 22 unverified stubs; first-wave pages unaffected |
| T-S3 | F4: AI_PROCESSING_ENABLED deprecation | Claude Code 1 | done | `src/lib/env.ts` | none | none | 2026-06-05 18:40 ET | Already fully implemented in prior phase — confirmed clean |
| T-S4 | F6: wire Upstash rate limiter to scan API | Claude Code 1 | done | `src/app/api/ai-regulation/scan/route.ts` | none | none | 2026-06-05 18:40 ET | checkRateLimit → checkUpstashRateLimit (async, falls back to in-memory when Upstash not configured) |
| T-S5 | Verification + logbook update | Claude Code 1 | done | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | both | none | 2026-06-05 19:00 ET | 313 tests ✓, lint ✓, typecheck ✓, build ✓, 98 routes. Full stack green after T-F2 unblocked. |
| T-T1 | F2 admin UI: wire discovery_leads repo into admin panel | Claude Code 1 | done | `src/agents/ai-regulation/processors/updateRepository.ts`, `src/app/admin/ai-regulation/page.tsx`, `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx` | `PROJECT_LOGBOOK.md` | none | 2026-06-05 19:15 ET | listDiscoveryLeads facade added; admin page uses dedicated repo call; AdminCoveragePanel refactored with proper DiscoveryLead type + status workflow display. 313 tests ✓, build ✓ |
| T-U1 | Discovery leads admin actions (reject/verify/convert) | Claude Code 1 | done | `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx` | `PROJECT_LOGBOOK.md` | none | 2026-06-05 19:25 ET | updateDiscoveryLeadStatus server action added; action buttons (official_source_found / reject / stale) shown for unresolved leads. 313 tests ✓ |
| T-C1B | P-C1 admin UX: reviewer notes + corroborated + convert actions | Claude Code 1 | done | `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx` | `PROJECT_LOGBOOK.md` | none | 2026-06-06 09:00 ET | Already implemented in prior session: reviewer notes textarea, Corroborated button, Convert to monitor item form. Confirmed in code review 2026-06-06. |
| T-C3B | P-C3 admin scan-job visibility (durability actions) | Claude Code 1 | done | `src/app/admin/ai-regulation/page.tsx`, `src/app/admin/ai-regulation/actions.ts` | `PROJECT_LOGBOOK.md` | low (T-C3C owns routes; no overlap) | 2026-06-06 09:10 ET | Color-coded status badges; result summary display; Recover stale jobs + Drain next queued buttons wired to T-C3A helpers. 324 tests ✓ build ✓. |
| T-F5 | Expand country coverage: Poland, Sweden, Ireland | Claude Code 1 | done | `src/content/ai-regulation/europe-member-state-implementation.ts` | `PROJECT_LOGBOOK.md` | none | 2026-06-06 09:20 ET | Three first-wave profiles added with official DPA+government sources, implementation_in_progress, partial citation quality. getPriorityEuropeCountryProfiles expanded. 324 tests ✓ build ✓. |
| T-C2B | P-C2 discovery leads pagination UI | Claude Code 1 | done | `src/lib/pagination.ts`, `src/components/site/pagination-controls.tsx`, `src/app/admin/ai-regulation/page.tsx`, `src/app/admin/ai-regulation/_components/AdminCoveragePanel.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-06 ET | Added `pageParamKey` to buildPageHref + PaginationControls; switched admin panel to listDiscoveryLeadsPage(10, leadsPage); total count in card header; pagination controls only shown when total > pageSize. 328 tests ✓ build ✓. |
| T-C2D | P-C2 lazy fallback raw-item load on admin news | Codex 1 | done | `src/app/admin/ai-regulation/news/page.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-05 21:32 ET | Server-only cleanup. Admin news now fetches fallback raw items only when the dedicated discovery-lead slice is empty, avoiding wasted raw-item reads on the common dedicated-table path. |
| T-C2C | P-C2 direct discovery-lead lookup and lower fixed-load consumers | Codex 1 | done | `src/db/repository-types.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, `src/agents/ai-regulation/utils/discovery-lead-records.ts`, admin news/detail server pages, targeted tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-05 21:18 ET | Backend/server-only. Added `getDiscoveryLeadByRawItemId`, switched detail resolution to direct lookup, and reduced admin news fixed discovery-lead loading to the first rendered slice. Verified with targeted tests, typecheck, lint, and build. |
| T-C2A | P-C2 backend discovery-lead hydration and paging groundwork | Codex 1 | done | `src/db/repository-types.ts`, `src/db/repositories/memory-repository.ts`, `src\db\repositories\supabase-repository.ts`, discovery-lead helper utilities, targeted repository/helper tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-05 20:55 ET | Backend-only. Added `getRawRegulatoryItemsByIds`, paged dedicated discovery-lead record loading, and source-scoped hydration so helper layers no longer depend on a broad raw-item list window just to attach lead context. |
| T-C3A | P-C3 scan execution durability helpers | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/agents/ai-regulation/processors/scanJobs.test.ts` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 10:32 ET | Backend-only. Added stale running-job recovery plus explicit queued-job draining helpers; no admin UI touched. Verified with targeted tests, typecheck, lint, and build. |
| T-C3C | P-C3 route/cron queue-drain adoption | Codex 1 | done | `src/app/api/ai-regulation/scan/route.ts`, `src/app/api/ai-regulation/scan/route.test.ts`, `src/app/api/cron/**/route.ts`, matching route tests, `src/agents/ai-regulation/processors/scanJobs.ts` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 11:05 ET | Backend-only. Scan entrypoints now expose explicit `queuedJob` vs `processedJob` state while using the queue-drain helper. Verified with targeted tests, typecheck, lint, and build. |
| T-C3D | P-C3 serial queue-drain runner | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/agents/ai-regulation/processors/scanJobs.test.ts`, `scripts/run-scan-job-drain.ts`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 11:32 ET | Backend-only. Added a serial drain path and local runner (`npm run scan:drain-queue`) for the always-on machine. Verified with targeted tests, a live script run, typecheck, lint, and build. |
| T-C3E | P-C3 serial execution guard | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/agents/ai-regulation/processors/scanJobs.test.ts`, `scripts/run-scan-job-drain.ts`, scan/cron route files | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 12:02 ET | Backend-only. Queue-drain paths now refuse to start a second healthy concurrent execution and surface `blockedByRunningJobs` when blocked. Verified with targeted tests, typecheck, lint, and build. |
| T-C3F | P-C3 optimistic scan-job claim / lease path | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/agents/ai-regulation/processors/updateRepository.ts`, `src/db/repository-types.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, targeted tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 13:25 ET | Backend-only. Processors now claim queued jobs through repository-level optimistic guards and skip already-claimed work; lease metadata is preserved in `resultSummary`. Verified with targeted tests, typecheck, lint, and build. |
| T-C3G | P-C3 local queue worker loop | Codex 1 | done | `scripts/run-scan-job-worker.ts`, `package.json`, `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 13:48 ET | Backend-only. Added a controlled local worker loop for the always-on machine on top of the queue-drain + optimistic claim path. Verified with a live idle-cycle run and targeted lint/tests; global typecheck is currently blocked by `T-BE1` outside this task boundary. |
| T-C3H | P-C3 inline admin-trigger harmonization | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/ai-regulation/actions.test.ts` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 14:20 ET | Backend-only. The last admin-triggered inline scan path now uses queue-drain + claim semantics, and `queueAndRunScanJob(...)` is only a compatibility wrapper. Verified with targeted tests, typecheck, lint, and build. |
| T-C3I | P-C3 lease heartbeat hardening | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `scripts/run-scan-job-worker.ts`, `src/app/admin/ai-regulation/actions.ts`, targeted tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 16:20 ET | Backend-only. Running jobs now carry heartbeat metadata, stale recovery honors the latest heartbeat, and the local worker uses explicit `local-worker` lease ownership with configurable heartbeat settings. Verified with targeted tests, live worker run, typecheck, lint, and build. |
| T-C3J | P-C3 direct-run anti-collision guard | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/agents/ai-regulation/processors/scanJobs.test.ts` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 18:05 ET | Backend-only. Direct `processScanJob(jobId)` calls now reject already-running jobs, and claimed execution is split behind an internal helper so only claim-aware paths can execute a running job. Verified with targeted tests, typecheck, lint, and build. |
| T-C4A | Runtime blocker ownership traceability | Codex 1 | done | `src/agents/ai-regulation/processors/scanJobs.ts`, `src/app/api/ai-regulation/scan/route.ts`, `src/app/api/cron/**/route.ts`, targeted tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-06 19:30 ET | Backend-only. Added structured blocker summaries for healthy running jobs (`leaseOwner`, heartbeat, running age, source/trigger/requestedBy) and propagated them through scan/cron responses. Verified with targeted tests, typecheck, lint, and build. |
| T-C4B | Service-like local worker hardening | Codex 1 | done | `scripts/run-scan-job-worker.ts`, `scripts/run-scan-job-worker-stop.ts`, `src/agents/ai-regulation/processors/scanWorkerRuntime.ts`, `src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-08 10:35 ET | Backend-only. Added single-worker lease protection, persisted worker status/heartbeat output, signal-aware graceful shutdown, and a stop helper for the always-on machine. Verified with targeted tests, live worker run, stop-script run, typecheck, lint, and build. |
| T-C4C | F1 cursor-pagination primitives on heavy backend surfaces | Codex 1 | done | `src/db/repository-types.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, `src/agents/ai-regulation/processors/updateRepository.ts`, repository tests, `src/app/ai-regulation/page.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-08 10:50 ET | Backend/server-first. Added cursor pages for `scan_jobs` and `discovery_leads`, exposed updateRepository wrappers, and aligned `/ai-regulation` to use cursor pagination consistently. Partial F1 only; broader pagination migration still open. |
| T-C4D | F8 normalized country_intelligence storage groundwork | Codex 1 | done | `src/db/repository-types.ts`, `src/db/seed/country-intelligence-seed.ts`, `src/db/seed/seed-profiles.ts`, `src/db/mock-store.ts`, `src/db/supabase-mappers.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, `src/agents/ai-regulation/processors/updateRepository.ts`, targeted tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-08 12:10 ET | Backend/storage-first. Added normalized `country_intelligence` + `country_intelligence_sources` repository support with Europe-derived seed fallback. Partial F8 only; country pages still read the TS profile layer. |
| T-NL1 | Netherlands live monitoring layer | Claude Code 1 | done | `src/agents/ai-regulation/netherlandsNewsSources.ts` (new), `src/agents/ai-regulation/netherlandsLegalNewsAgent.ts` (new), `src/content/ai-regulation/netherlands-ai-intelligence.ts` (new), `src/app/api/cron/ai-regulation-netherlands-scan/route.ts` (new), `src/app/api/cron/ai-regulation-netherlands-scan/route.test.ts` (new), `scripts/run-netherlands-*.ts` (3 new), `src/agents/ai-regulation/scanProfiles.ts`, `src/app/ai-regulation/europe/[country]/page.tsx`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none (Codex 1 done with scanJobs.ts; no overlap on these new files or scanProfiles.ts) | 2026-06-06 ET | Creating full Netherlands monitoring stack: source registry (AP, RDI, Rijksoverheid, NewsAPI, GDELT), agent, cron route+test, 3 scripts, scanProfiles extension, country page conditional section, content snapshot. |
| T-AT1 | Austria live monitoring layer | Claude Code 1 | done | `src/agents/ai-regulation/austriaNewsSources.ts` (new), `src/agents/ai-regulation/austriaLegalNewsAgent.ts` (new), `src/content/ai-regulation/austria-ai-intelligence.ts` (new), `src/app/api/cron/ai-regulation-austria-scan/route.ts` (new), `src/app/api/cron/ai-regulation-austria-scan/route.test.ts` (new), `scripts/run-austria-*.ts` (3 new), `src/agents/ai-regulation/scanProfiles.ts`, `src/app/ai-regulation/europe/[country]/page.tsx`, `src/content/ai-regulation/europe-member-state-implementation.ts`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-06 ET | Austria first-wave profile with DSB, Digital Austria, RTR sources; implementation_in_progress/low confidence; full monitoring stack (live panel, authority map, verification gaps). 343 tests ✓ lint ✓ typecheck ✓ build ✓. |
| T-BE1 | Belgium live monitoring layer | Claude Code 1 | done | `src/agents/ai-regulation/belgiumNewsSources.ts` (new), `src/agents/ai-regulation/belgiumLegalNewsAgent.ts` (new), `src/content/ai-regulation/belgium-ai-intelligence.ts` (new), `src/app/api/cron/ai-regulation-belgium-scan/route.ts` (new), `src/app/api/cron/ai-regulation-belgium-scan/route.test.ts` (new), `scripts/run-belgium-*.ts` (3 new), `src/agents/ai-regulation/scanProfiles.ts`, `src/app/ai-regulation/europe/[country]/page.tsx`, `src/content/ai-regulation/europe-member-state-implementation.ts`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-06 ET | Belgium first-wave profile with APD/GBA, Digital Belgium, AI4Belgium sources; implementation_in_progress/low confidence; full monitoring stack (live panel, authority map, verification gaps). 336 tests ✓ lint ✓ typecheck ✓ build ✓. |
| T-SE1 | Sweden live monitoring layer | Claude Code 1 | done |
| T-IE1 | Ireland live monitoring layer | Claude Code | done | `src/agents/ai-regulation/irelandNewsSources.ts` (new), `src/agents/ai-regulation/irelandLegalNewsAgent.ts` (new), `src/content/ai-regulation/ireland-ai-intelligence.ts` (new), `src/app/api/cron/ai-regulation-ireland-scan/route.ts` (new), `src/app/api/cron/ai-regulation-ireland-scan/route.test.ts` (new), `scripts/run-ireland-*.ts` (3 new), `src/agents/ai-regulation/scanProfiles.ts`, `src/app/ai-regulation/europe/[country]/page.tsx`, `src/content/ai-regulation/europe-member-state-implementation.ts`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-08 ET | Ireland full monitoring stack: DPC (primary, 5-min), DETE + gov.ie (daily), NewsAPI/GDELT (discovery); irelandDpc upgraded to candidate_for_monitoring; irelandGov added; implementation_in_progress/low confidence. 363 tests ✓ lint ✓ typecheck ✓ build ✓. |
| T-ING1 | Firecrawl + Scrapling dual ingestion pipeline | Claude Code | done | `src/db/migrations/009_ingestion_pipeline.sql`, `src/agents/ingestion/*`, `src/app/api/ingestion/run/route.ts`, `scrapling_worker/*`, `docs/INGESTION_PIPELINE.md` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `src/db/repository-types.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, `src/db/supabase-mappers.ts` | additive-only on shared files; no overlap with scan/cron/country stacks | 2026-06-09 | **In production**. 384 tests ✓ lint ✓ typecheck ✓ build ✓. Migration 009 applied. 8 sources seeded. GitHub CorentinSG/CSG-AI-law + Vercel csg-ai-law.vercel.app live. All env vars set (incl. CRON_SECRET 2026-06-09). Remaining: Scrapling Python sidecar not deployed (SCRAPLING_WORKER_URL absent). sourceToInsert mapper fixed (4 migration-009 columns); legacyUnsupportedSourceColumns updated. |
| T-F1 | Cursor-based pagination on public surfaces | Claude Code | done | `src/lib/pagination.ts`, `src/lib/pagination.test.ts`, `src/db/repository-types.ts`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/supabase-repository.ts`, `src/agents/ai-regulation/processors/updateRepository.ts`, `src/components/site/pagination-controls.tsx`, `src/app/ai-regulation/page.tsx` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-08 ET | Complete. Keyset cursor pagination on public /ai-regulation (news: `after`, database: `dbafter`). `CursorPaginationControls` component. `listRegulatoryUpdatesCursorPage` + `listNewsItemsCursorPage` in both repos. 358 tests ✓ lint ✓ typecheck ✓ build ✓. | `src/agents/ai-regulation/swedenNewsSources.ts` (new), `src/agents/ai-regulation/swedenLegalNewsAgent.ts` (new), `src/content/ai-regulation/sweden-ai-intelligence.ts` (new), `src/app/api/cron/ai-regulation-sweden-scan/route.ts` (new), `src/app/api/cron/ai-regulation-sweden-scan/route.test.ts` (new), `scripts/run-sweden-*.ts` (3 new), `src/agents/ai-regulation/scanProfiles.ts`, `src/app/ai-regulation/europe/[country]/page.tsx`, `src/content/ai-regulation/europe-member-state-implementation.ts`, `package.json` | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | none | 2026-06-06 ET | Sweden full monitoring stack: IMY (primary, 5-min), DIGG + Regeringen (daily), NewsAPI/GDELT (discovery); swedenImy upgraded to candidate_for_monitoring; swedenRegeringen added as third source; implementation_in_progress/low confidence. |
| T-C1C | P-C1 admin news/detail adoption of dedicated discovery leads | Codex 1 | done | `src/app/admin/ai-regulation/news/page.tsx`, `src/app/admin/ai-regulation/[id]/page.tsx`, discovery-lead helper utilities + tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-05 20:32 ET | Admin news and update detail now prefer dedicated discovery-lead records with fallback preserved. Verified with diagnostics test, typecheck, lint, and build. |

| T-C1A | P-C1 diagnostics/source-detail adoption of dedicated discovery leads | Codex 1 | done | `src/app/admin/ai-regulation/data-quality/page.tsx`, `src/app/admin/ai-regulation/sources/[sourceId]/page.tsx`, `src/app/admin/ai-regulation/diagnostics.ts`, discovery-lead helper code + tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-05 20:18 ET | Diagnostics and source-detail surfaces now prefer dedicated discovery-lead records with fallback preserved. Verified with targeted tests, typecheck, lint, and build. |
| T-F2B | F2 backend adoption: stewardship + recurring verification | Codex 1 | done | `src/agents/ai-regulation/dataSteward.ts`, `src/agents/ai-regulation/processors/recurringVerification.ts`, `src/agents/ai-regulation/processors/dataStewardSync.ts`, new backend utility + tests | `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md` | low | 2026-06-05 19:32 ET | Dedicated discovery-lead records now drive steward sync and recurring verification when available; legacy raw-item fallback remains intact. Verified with targeted tests, typecheck, lint, and build. |


_The completed P-C1/P-C2/P-C3 continuity plan was removed (all done; see Phase Index in PROJECT_LOGBOOK.md and git history). The active roadmap is P-RT below._
## Phased plan P-RT — Real-time reliability program (proposed 2026-06-10)

Goal: make the live news monitoring and the per-state legal database as reliable and as close to real-time as possible, without weakening any guardrail (no auto-publish, AI off by default, budgets intact).

Agent split convention (consistent with P-C1..P-C3 history): `Codex 1` owns backend/runtime/repository/worker plumbing; `Claude Code` owns UI/admin surfaces, country/content stacks, connectors-to-official-APIs, and deployment/config (vercel.json, env, sidecar). One non-trivial task per agent at a time; phases in order; a phase opens only when the previous one's exit condition is met or explicitly waived in this file.

### Phase P-RT0 — Hygiene and immediate coverage (quick wins)

- `T-RT0B` (`Claude Code`) — Cron coverage completion: add NL/BE/AT/SE/IE crons to `vercel.json` (staggered like existing ones) + an ingestion cron for `/api/ingestion/run` if compatible with plan limits. Files: `vercel.json` only.
- `T-RT0C` (`Claude Code`) — Public-page ISR: replace `force-dynamic` with `revalidate` (300–900s) on the 6 public `/ai-regulation/*` pages (+ `/standards` if safe); admin stays dynamic. Existing `revalidatePath` calls in admin actions guarantee freshness on publication. Files: public page files only.
- Exit condition: all 9 full-stack countries actually scanned by cron in prod; repo clean; public pages cached.

### Phase P-RT1 — Observability and alerting

- `T-RT1A` (`Codex 1`) — Source staleness/failure detection backend: per-source freshness summary (last successful scan vs priority-based threshold from scheduler guidance), consecutive-failure counters, derived `healthy/degraded/stale` state. Built on `source_health_checks`, `ingestion_logs`, scan job results. Backend helpers + repository reads + tests only; no UI.
- `T-RT1B` (`Codex 1`) — Outbound alerting: configurable webhook/email notification (new env vars, off by default) on (a) source entering `stale/degraded`, (b) N consecutive scan failures, (c) daily digest of `needs_review` backlog. No secrets in payloads. Backend + route/cron wiring + tests.
- `T-RT1C` (`Claude Code`) — Admin freshness dashboard: per-source SLO badges (color-coded last-success age), degraded/stale panels, review-queue counter surfaced on the main admin page. UI only, consumes T-RT1A contracts.
- Exit condition: a dead source or growing review backlog is noticed by notification, not by manually opening the dashboard.

### Phase P-RT2 — Detached worker and adaptive scheduling

- `T-RT2A` (`Codex 1`) — Enqueue-only cron mode: env-flagged mode where cron/API routes only enqueue (no inline drain), relying on the worker to process; honest response shape (`queuedJob`, not `processedJob`). Backend + routes + tests.
- `T-RT2B` (`Codex 1`) — Adaptive per-source scheduling in the worker: cadence derived from `getSchedulerGuidance` (high-priority sources every 15–30 min, slow sources 1–2×/day, discovery lanes at their rate limits), exponential backoff + circuit breaker per source after consecutive failures. Backend/worker only.
- `T-RT2C` (`Claude Code`) — Worker + Scrapling sidecar deployment (ops): run the hardened `scan:worker-local` permanently (always-on machine or small Railway/Fly service), deploy `scrapling_worker/`, set `SCRAPLING_WORKER_URL` in prod. Config/docs/ops; no backend logic changes.
- Exit condition: no scan executes inline in a Vercel request; high-priority sources polled sub-hourly; scrapling/hybrid sources operational.

### Phase P-RT3 — Official APIs / RSS over scraping + conditional fetching

- `T-RT3A` (`Codex 1`) — Conditional fetch layer: ETag/Last-Modified support + content-hash short-circuit in the shared connector/fetch path so unchanged sources cost ~nothing (prerequisite for higher cadence). Backend + tests.
- `T-RT3B` (`Claude Code`) — Legifrance via official DILA/PISTE API (replaces Cloudflare-blocked scraping); keep honest degraded fallback. Connector + France source registry.
- `T-RT3C` (`Claude Code`) — EUR-Lex structured channel (webservice/RSS/CELLAR) + upgrade `eurLexAiActParser.ts` toward article-level pinpoints (citation quality may move from `partial` only when genuinely extracted). Connector + EU sources.
- `T-RT3D` (`Claude Code`) — Source-by-source RSS migration for DPA/regulator sources (CNIL, AEPD, Garante, AP, DSB, IMY, DPC, …): set `ingestion_method`/parser to RSS where an official feed exists; scraping stays only where no structured channel exists. Source registries + connectors, one country at a time.
- Exit condition: the two known fragile paths (Legifrance, EUR-Lex) run on official channels; majority of high-priority sources on RSS/API + conditional GET.

### Phase P-RT4 — Faster human review (guardrails intact)

- `T-RT4A` (`Codex 1`) — Opt-in AI pre-classification: when `AI_ENABLE_PROCESSING` is explicitly on, classify incoming items (instrument type, country, relevance, draft summary) under existing token/scan/budget limits; output lands as review-assist metadata only, never auto-publishes, never sets `citationQualityStatus: complete`. Backend processors + tests.
- `T-RT4B` (`Claude Code`) — Prioritized review queue UX: order `needs_review` by source authority tier, one-click approve/reject flows, show AI-suggested classification (clearly labeled as unverified suggestion). Admin UI only, after T-RT4A contract.
- Exit condition: median time from item arrival to human decision measurably drops without any guardrail change.

### Phase P-RT5 — Per-state legal database reliability

- `T-RT5A` (`Claude Code`) — F8C-3: migrate scalar/array structural fields (authority maps, measures, per-category notes, latest updates, status labels) of `europe-member-state-implementation.ts` to `country_intelligence` schema; retire the TS file as source of truth (already on the F-series roadmap; runs here).
- `T-RT5B` (`Codex 1`) — Staleness + audit for country profiles: rule "profile not reviewed for 60/90 days → `needs_re_review` flag" computed from `lastReviewedAt`; extend `review_events`-style audit trail to country-profile editorial edits. Backend + repository + tests.
- `T-RT5C` (`Claude Code`) — Admin re-review badges + cross-corroboration: surface stale-profile badges in `/admin/ai-regulation/countries`; when a discovery item matches a country, create a "verify on official source" follow-up task instead of leaving it parallel. UI + light workflow wiring, consumes T-RT5B.
- Exit condition: DB is the single source of truth per country; no profile can silently age beyond the re-review threshold.

### P-RT planning rules

1. Same handshake protocol as always: claim on the live board before starting, one task per agent.
2. Phases P-RT0 and P-RT1 may run in parallel (disjoint files); later phases in order.
3. Any task touching guardrails (publication workflow, AI flags, budgets) must restate in its claim that limits are preserved.
4. Each completed task updates `PROJECT_LOGBOOK.md` + `AI_AGENT_MASTER_CONTEXT.md` as usual.

### Planning rules

1. `Claude Code 1` must leave an explicit accept / adjust / reject note on this plan before any `T-C1A` or `T-C1B` claim.
2. Only one new non-trivial task should be claimed per agent at a time.
3. After each completed task, re-evaluate whether the next planned task is still the highest-value move.
4. If the plan changes materially, update this section before implementation starts.

## Per-task detail template

Copy and complete this block for each non-trivial active task.

```md
### Task: T-###

- Agent role:
- Status:
- Objective:
- Success criteria:
- Primary files in scope:
- Secondary files in scope:
- Shared files allowed:
- Files explicitly out of scope:
- Dependencies:
- Overlap risk:
- Required alignment before start:
- Blockers:
- Verification plan:
- Handoff summary:
```

## End-of-task handoff rule

Before marking any task `handoff_ready` or `done`, the agent must record:

- what changed
- what was verified
- what remains risky
- what the next agent must not accidentally redo

At minimum, that summary must be recorded in:

- the task's Notes cell or task detail block
- the Decision / Agreement Log if ownership or overlap changed

## Project logbook writing protocol

Agents must keep `PROJECT_LOGBOOK.md` compact enough to scan quickly, but detailed enough that another human or agent can understand what changed, what was verified, and what remains risky.

### Compression rule

1. Compress only older, stabilized phases into the Phase Index.
2. Keep recent, active, fragile, or partially completed phases expanded.
3. Do not compress away:
   - architecture decisions
   - migration decisions
   - security / auth / publication guardrails
   - known limitations
   - next recommended steps

### Each detailed phase entry must cover

- what changed
- files changed
- what was verified
- known limitations
- next step

### Status discipline

Use clear statuses only:

- `Completed`
- `In progress`
- `Partially completed`
- `Blocked`
- `Planned`

Do not describe a phase as effectively finished if important work is still open.

### Writing style rule

- Keep the logbook factual, not promotional.
- Do not oversell rough work as complete.
- Do not flood the logbook with file-by-file noise when a grouped summary is enough.
- Preserve enough detail that another agent can continue without rereading the whole repository.
- If one agent disagrees with how a phase is described, leave a short note in this coordination file before rewriting the logbook entry.

### Commenting on the logbook

If an agent thinks a logbook entry is:

- too long
- too compressed
- ambiguous
- overclaimed
- missing a limitation

the agent should leave a short note in the Inter-agent comments section before changing the structure aggressively.

## Practical operating rule

This file must stay readable as plain Markdown without any external tooling or automation assumptions.

Use generic roles such as:

- `Agent A`
- `Agent B`
- `Current agent`

Do not hard-code specific vendor or tool identities unless the user explicitly wants that.
