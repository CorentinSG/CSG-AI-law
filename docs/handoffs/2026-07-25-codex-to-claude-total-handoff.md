# Total Project Handoff: Codex to Claude Code

Date: 2026-07-25

## Ownership

Claude Code is now the sole owner of the entire project: frontend, backend,
database, ingestion, monitoring, operations, security, tests, content, and
coordination. Codex has no active tasks, file locks, or operational duties.
Historical references assigning work to Codex are superseded by this handoff.

## Canonical State

- Canonical branch before this handoff PR: `origin/main` at `dd1f5ea`.
- Vercel production deployment for `dd1f5ea` completed successfully.
- Last complete local verification: 723 Vitest tests, lint, typecheck, and
  production build all passed.
- Open PR #22 is Claude-owned contact work. It was stale/conflicted at handoff;
  rebase or rebuild it from current `main` before merging.
- `origin/archive/pre-recovery-local-main-2026-07-23` at `6b7fa9c` is a safety archive
  of the former divergent local main. Never merge it wholesale.

## Delivered by Codex

- PR #25 replaced the expired Railway workers with scheduled GitHub Actions.
- PR #26 restored and corrected the 60-entry New York AI-law corpus.
- PR #27 reconciled production New York data: 60 total, 60 published, 60 unique.
- PR #28 added migration 031 and schema drift tripwires. Source only.
- PR #29 made stale scheduled-worker heartbeat checks return HTTP 503.
- PR #30 contained automatic story similarity so it cannot manufacture
  verification, publication-grade corroboration, or public visibility.

## Operator Gates Still Open

1. Live verification confirmed that GitHub Actions monitoring is not
   operational. The 10 most recent inspected scheduled runs failed because
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` are all missing. The worker health endpoint
   returned HTTP 503. See
   `docs/handoffs/2026-07-26-github-actions-monitoring-verification.md`.
2. After adding secrets, manually dispatch **Legal Monitoring**, inspect its
   logs, then verify `/api/health?check=worker` becomes healthy.
3. Production migration history remains unknown. Obtain a dedicated read-only
   session-pooler `DATABASE_URL`, audit production first, then decide which
   migrations to apply. Migration 031 was not applied by Codex.
4. Do not use the rejected migration-runner prototype directly. Its preserved
   branch is explicitly marked NO-MERGE below.

## Preserved Handoff Branches

- `handoff/claude-aggressive-news-radars-2026-07-25` at `9e39cb1`: unmerged
  France, EU, and New York aggressive-news source work. Rebase onto current
  `main`, split into focused PRs, verify selectors/source IDs, and keep generic
  navigation links from becoming publication-grade evidence.
- `handoff/claude-db-runner-no-merge-2026-07-25` at `7743139`: audit/runner
  prototype. **NO-MERGE as-is.** Known problems include production-startup
  coupling to `DATABASE_URL`, overridable psql routing arguments, no enforced
  production baseline, incomplete schema coverage, and CI scheduling conflicts.
- `handoff/claude-ny-backfill-review-archive-2026-07-25` at `68df5ea`: archived
  New York sync experiment. PR #27 is the canonical production reconciliation;
  use this branch only for forensic comparison.

## Technical Backlog Now Owned by Claude

1. Execute the master integrity backlog from
   `docs/superpowers/plans/2026-07-20-master-improvement-plan.md`, beginning
   with read-only production forensics, RLS, deduplication, creation-time
   publication eligibility, verification events, leases, pagination, queue
   starvation, backups, real OpenAI usage accounting, and real-Postgres tests.
2. Finish monitoring coverage: schedule country live/verification profiles,
   honor per-source frequency, add bounded retry/concurrency, fix registry/seed
   ID drift, and add New York dedicated profiles.
3. Persist story identity and source sets across scans, add per-source
   high-water marks and freshness SLAs, and prevent same-publisher aliases or
   opposing events from being treated as independent confirmation.
4. Resolve PR #22 from current `main`, not from its stale mixed history.

## Cleanup Notes

- Codex-owned live Status-board rows were removed because their code is already
  in `main`; the historical log remains unchanged.
- OneDrive blocked physical deletion of some old worktree directories. They are
  not active ownership and must not be treated as canonical checkouts.
- `PROJECT_LOGBOOK.md` and `AGENT_COORDINATION.md` remain frozen historical
  archives, per `AGENTS.md`.

## Claude First Session

1. Pull current `main`.
2. Run `pwsh -File agent-sync.ps1`.
3. Read this file, the live `AI_TASKS.md` board, and `DECISIONS.md`.
4. Rebuild Graphify if its recorded commit differs from `HEAD`.
5. Claim the next task in `AI_TASKS.md`; no Codex coordination is required.
