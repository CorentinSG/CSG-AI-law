# Recovery Task 3 Report

## Outcome

Replaced the expired Railway scan worker and Scrapling sidecar with a scheduled
GitHub Actions monitoring worker. The implementation commit is
`c3945bb80100aac4bfb19869e9925f2834992638`
(`feat(ops): schedule legal monitoring worker`).

## Files Changed

- Created `.github/workflows/legal-monitoring.yml`.
- Created `docs/operations/github-actions-monitoring.md`.
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
