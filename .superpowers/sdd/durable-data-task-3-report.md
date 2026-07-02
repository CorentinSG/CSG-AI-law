# Durable Data Task 3 Report

## Status

Implemented lease-token-safe terminal scan-job completion.

## RED Evidence

Command:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/scanJobs.test.ts
```

Observed: 3 failed, 81 passed. The memory repository lacked
`completeScanJob`, the Supabase RPC/migration did not exist, and the processor
accepted a stale worker's unrestricted completion and emitted its result.

## GREEN Evidence

Exact final test summary:

```text
Test Files  3 passed (3)
Tests       84 passed (84)
Duration    8.05s
```

Exact final typecheck summary:

```text
Generating route types...
Types generated successfully
```

Both commands exited 0. Vitest also printed the existing
`vite-tsconfig-paths` deprecation warning.

## Files

- `src/db/migrations/014_scan_job_lease_completion.sql`
- `src/db/repository-types.ts`
- `src/db/repositories/memory-repository.ts`
- `src/db/repositories/memory-repository.test.ts`
- `src/db/repositories/supabase-repository.ts`
- `src/db/repositories/supabase-repository.test.ts`
- `src/agents/ai-regulation/processors/scanJobs.ts`
- `src/agents/ai-regulation/processors/scanJobs.test.ts`
- `.superpowers/sdd/durable-data-task-3-report.md`

## Commit

Message: `fix(queue): protect completion with lease tokens`

SHA: the commit containing this report; run `git rev-parse HEAD`.

## Self-Review

- Completion requires a running job, matching lease token, and terminal status.
- The RPC can mutate only terminal status, finish/update timestamps, summary,
  and error fields; identity, source, request, trigger, and start time are fixed.
- RPC execution is restricted to `service_role`.
- Memory and Supabase legacy fallback behavior match the database predicate.
- Success and failure terminal paths use `completeScanJob`.
- Rejected stale completion returns an honest
  `scan_job_completion_rejected` error with no authoritative job and no alert.
- Existing heartbeat and claim paths remain unchanged.
- Only task-owned files and this required report are included.

## Concerns

- The migration was verified statically and was not applied to a live Supabase
  database in this task.
- Existing unrelated UI and package changes remain untouched and uncommitted.

## Review Findings Follow-Up

### RED Evidence

Command:

```powershell
npm test -- src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/scanJobs.test.ts
```

Exact result:

```text
Test Files  1 failed | 1 passed (2)
Tests       5 failed | 60 passed (65)
Duration    8.26s
```

All five Supabase behavioral tests failed because
`completeScanJobWithClient` did not exist. The processor failure-race
regression passed against the existing lease-rejection path.

An intermediate full targeted run produced 91/91 passing tests and the
following expected typecheck failure before the legacy result fields were
normalized:

```text
src/db/repositories/supabase-repository.ts(449,7): error TS2322
src/db/repositories/supabase-repository.ts(450,7): error TS2322
src/db/repositories/supabase-repository.ts(451,7): error TS2322
```

### GREEN Evidence

Command:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/scanJobs.test.ts
npm run typecheck
```

Exact final result:

```text
Test Files  3 passed (3)
Tests       91 passed (91)
Duration    9.36s

Generating route types...
Types generated successfully
```

Both commands exited 0. Vitest printed the existing
`vite-tsconfig-paths` deprecation warning.

### Follow-Up Changes

- Added behavioral fake-client coverage for RPC payload/result mapping, stale
  token rejection, exactly-once completion, and restricted fields.
- Added behavioral legacy-fallback coverage for valid exactly-once completion
  and rejection of omitted, queued, and running statuses.
- Centralized Supabase completion in `completeScanJobWithClient`; both RPC and
  fallback now accept only `succeeded`, `partial_success`, or `failed`.
- Added a processor regression proving a reclaimed worker whose scan throws
  cannot persist failure state or emit a backlog alert.
