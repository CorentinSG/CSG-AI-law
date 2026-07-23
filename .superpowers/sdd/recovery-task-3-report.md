# Recovery Task 3 Report

## Outcome

Replaced the expired Railway scan worker and Scrapling sidecar with a scheduled
GitHub Actions monitoring worker. The implementation commit is
`c3945bb80100aac4bfb19869e9925f2834992638`
(`feat(ops): schedule legal monitoring worker`).

## Files Changed

- Created `.github/workflows/legal-monitoring.yml`.
- Created `docs/operations/github-actions-monitoring.md`.
- Updated `AI_TASKS.md` with the repository handoff status for this task.
- Updated `.env.example`.
- Updated `scripts/run-scan-job-worker.ts` to persist scheduled heartbeat
  metadata and record successful scheduled exits as `completed`.
- Updated `src/agents/ai-regulation/processors/scanWorkerRuntime.ts` and its
  test for scheduled mode, expected interval, and first-empty-cycle exit.
- Updated `src/lib/health.ts` and its test so scheduled worker health remains
  alive for the expected interval plus a five-minute grace period.
- Updated `src/agents/ingestion/scraplingClient.ts` and its test to require an
  explicit `SCRAPLING_WORKER_URL` and remove the Railway fallback.

No migrations, New York files, contact UI, story clustering, corroboration,
OpenAI configuration, or source registries were changed.

## TDD Evidence

### RED

Command:

```text
npm test -- src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts src/lib/health.test.ts src/agents/ingestion/scraplingClient.test.ts
```

Result: exit 1; 3 intended failures and 16 passing tests.

- Scheduled config test failed because `workerMode` was undefined.
- Scheduled-heartbeat health test failed because the worker was `unknown` and
  not alive after 19 minutes.
- Scrapling fallback test failed because production/Supabase mode still
  reported the Railway sidecar as available.

### GREEN

Command:

```text
npm test -- src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts src/lib/health.test.ts src/agents/ingestion/scraplingClient.test.ts
```

Result: exit 0; 3 files passed and 19 tests passed.

## Full Verification

```text
npm test
```

Result: exit 0; 130 files passed and 710 tests passed.

```text
npm run lint
```

Result: exit 0.

```text
npm run typecheck
```

Result: exit 0; Next route types generated and TypeScript completed without
errors.

`git diff --check` completed without whitespace errors before commit.

## Self-Review

- Confirmed the workflow uses only `workflow_dispatch` and the required
  `7,22,37,52 * * * *` schedule, with the requested concurrency,
  permissions, Ubuntu runner, and 40-minute timeout.
- Confirmed Node 20/npm caching, Python 3.12, local gunicorn on
  `127.0.0.1:8765`, health polling, non-echoing required-secret validation,
  optional connector secrets, and `AI_ENABLE_PROCESSING=false`.
- Confirmed `OPENAI_API_KEY` and `pull_request` are absent from the workflow.
- Confirmed scheduled heartbeats carry their mode and expected interval, so
  health uses 15 minutes plus a five-minute grace rather than requiring a
  persistent process.
- Confirmed Scrapling is unavailable without explicit configuration, allowing
  the existing Firecrawl/static fallback path to operate on Vercel.

No implementation defects were found in self-review.

## Concerns

- Before enabling the workflow, repository operators must configure
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY`; optional connector secrets can remain unset.
- No local `actionlint` or YAML parser is installed in this checkout. The
  workflow was manually reviewed, while automated TypeScript, lint, and test
  verification passed.

## Review Follow-up

The review fixes are committed in `bb71efc439f23df07d722b8c205d03b6be247ca2`
(`fix(ops): secure scheduled Scrapling worker`).

### Changed Files

- Updated `.env.example`, `docs/operations/github-actions-monitoring.md`, and
  `scrapling_worker/README.md` with the required matching worker URL and
  bearer token configuration.
- Updated `src/agents/ingestion/scraplingClient.ts` and its test to require
  `SCRAPLING_WORKER_TOKEN` before extraction and send it as a Bearer token.
- Updated `scrapling_worker/worker.py` and added
  `scrapling_worker/test_worker.py` to fail closed when its token is absent
  and reject missing or mismatched Bearer tokens on both extraction routes.
- Updated `scripts/run-scan-job-worker.ts`,
  `src/agents/ai-regulation/processors/scanWorkerRuntime.ts`, and its test so
  only an unrequested scheduled idle exit writes `completed`; requested stops
  write `stopped` and are unhealthy in the existing health semantics.
- Updated `AI_TASKS.md` to record this reviewed fix in the repository handoff.

### RED Evidence

```text
npm test -- src/agents/ingestion/scraplingClient.test.ts src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts
```

Result: exit 1; 2 test files failed, with 3 intended failures and 7 passing
tests. The client omitted `Authorization`, allowed an extraction request with
no token to reach `fetch`, and did not expose terminal-state selection.

```text
py -m unittest scrapling_worker/test_worker.py
```

Result: exit 1; 2 intended auth failures and 1 passing test. The worker
returned HTTP 200 when its server token was unset and when extraction requests
had missing or mismatched Bearer tokens.

### GREEN Evidence

```text
npm test -- src/agents/ingestion/scraplingClient.test.ts src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts
```

Result: exit 0; 2 files and 10 tests passed.

```text
py -m unittest scrapling_worker/test_worker.py
```

Result: exit 0; 3 auth tests passed.

### Follow-up Verification

```text
npm test
```

Result: exit 0; 130 files and 712 tests passed.

```text
npm run lint
```

Result: exit 0.

```text
npm run typecheck
```

Result: exit 0; Next route types generated and TypeScript completed without
errors.

`git diff --check` completed without whitespace errors before the fix commit.

## Stop-File Race Follow-up

The late stop-file recheck is committed in
`1dde0dc1299e714e07ba920297e2317ab3c77ca2`
(`fix(ops): recheck stop file before completion`).

### Changed Files

- Updated `src/agents/ai-regulation/processors/scanWorkerRuntime.ts` so the
  terminal selector asynchronously rechecks an external stop request before it
  returns `completed` for a scheduled idle exit.
- Updated `scripts/run-scan-job-worker.ts` to use that recheck immediately
  before its final heartbeat and call `requestStop` when the stop file appears.
- Updated `src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts` to
  prove the external checker is invoked before completion, a late stop changes
  the terminal heartbeat to `stopped`, and a SIGTERM-style requested stop
  remains `stopped` without an external check.
- Updated `AI_TASKS.md` with the final recovery-task handoff.

### RED Evidence

```text
npm test -- src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts
```

Result: exit 1; 1 file failed with 1 intended failure and 5 passing tests.
The scheduled completion path returned `completed` without invoking the
late-stop checker.

### GREEN Evidence

```text
npm test -- src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts
```

Result: exit 0; 1 file and 6 tests passed.

### Follow-up Verification

```text
npm test
```

Result: exit 0; 130 files and 712 tests passed.

```text
npm run lint
```

Result: exit 0.

```text
npm run typecheck
```

Result: exit 0; Next route types generated and TypeScript completed without
errors.
