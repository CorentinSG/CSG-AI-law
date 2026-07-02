# Durable Data Task 1 Report

## Status

DONE_WITH_CONCERNS

## RED Evidence

Command:

```powershell
npm test -- src/db/schema-integrity.test.ts
```

Expected failure observed before implementation: Vitest could not resolve
`./schema-integrity`; the suite reported one failed test file and zero tests
because the production module did not exist.

## Implementation

- Added a pure `evaluateSchemaIntegrity(snapshot)` evaluator.
- Defined explicit columns, indexes, constraints, and RLS policies for
  `raw_regulatory_items`, `ai_regulatory_updates`, `scan_jobs`,
  `regulation_sources`, and `news_items`.
- Added regression fixtures for the raw-item hash unique index, scan-job
  status check, application-table RLS policy, and a complete snapshot.
- Added a read-only PostgreSQL catalog audit using `DATABASE_URL`.
- Restricted CLI output to object names, invariant classes, and bounded
  status/error classes. Connection strings and database contents are never
  printed.

## Files Changed

- `src/db/schema-integrity.ts`
- `src/db/schema-integrity.test.ts`
- `scripts/audit-database-schema.ts`
- `package.json`
- `package-lock.json`

The package files were staged from clean `HEAD` snapshots with only the audit
script and `pg` dependency changes applied. Unrelated uncommitted UI and
`three` package edits were excluded from the implementation commit.

## Verification

- `npm test -- src/db/schema-integrity.test.ts`: PASS, 4/4 tests.
- `npm test`: PASS, 107 files and 568 tests.
- Owned-file ESLint: PASS.
- `npm run typecheck`: PASS.
- `npm run audit:database-schema`: BLOCKED as required,
  `blocked_missing_credentials DATABASE_URL`; no credential value printed.
- `npm run lint`: BLOCKED by three pre-existing uncommitted UI
  `react/no-unescaped-entities` errors and unrelated warnings.
- `npm run build`: BLOCKED during page-data collection because existing
  production admin credentials use prohibited default values.

## Commit

Implementation commit:
`97d3059cacad3ae51dadd5c5d523b9b9f4839810`

Commit message:
`feat(db): add executable schema integrity audit`

## Self-Review

- Confirmed the evaluator is deterministic and performs no I/O.
- Compared required objects with migrations `001`, `002`, and `004`.
- Confirmed catalog queries are read-only and parameterize table names.
- Confirmed findings expose schema object names and invariant classes only.
- Confirmed missing credentials exit nonzero without attempting a connection.
- Confirmed the implementation commit contains only owned code and package
  changes.

## Concerns

- A live schema audit could not run because `DATABASE_URL` is absent.
- The current migrations appear not to provide the required unique hash index
  or RLS policies for every audited application table, so a configured live
  audit is expected to produce actionable findings.
- Repository-wide lint and build remain blocked by unrelated worktree and
  environment issues described above.
- `AI_TASKS.md` was not changed because the user explicitly limited file
  ownership; this overrides the general coordination handoff edit rule.

## Review Fixes

### RED Evidence

After replacing the generated fixture with independent PostgreSQL catalog
rows, `npm test -- src/db/schema-integrity.test.ts` failed 4 of 7 tests for
the expected reasons:

- unique-index findings used an inconsistent `raw_regulatory_items.hash`
  object name;
- policies with `relrowsecurity = false` were accepted;
- a same-named `scan_jobs_status_check` containing only `queued` and
  `running` was accepted;
- `created_at_extra` passed as the `created_at` index column.

### Changes

- Added `pg_class.relrowsecurity` to the runtime snapshot and require both
  enabled RLS and the expected policy.
- Replaced the self-derived complete fixture with independent, realistic
  `information_schema`, `pg_indexes`, `pg_constraint`, `pg_class`, and
  `pg_policies` rows.
- Validate the exact five-value `scan_jobs.status` domain.
- Parse and compare complete ordered index column lists.
- Standardized unique-index finding names as `<table>.<index>`.

### Exact Verification

- `npm test -- src/db/schema-integrity.test.ts`: PASS; 1 file, 7 tests.
- `npx eslint src/db/schema-integrity.ts src/db/schema-integrity.test.ts scripts/audit-database-schema.ts`:
  PASS; exit code 0, no findings.
- `npm run typecheck`: PASS; Next route types generated and `tsc --noEmit`
  exited 0.

### Review Concerns

- The existing Vitest configuration prints a Vite `vite-tsconfig-paths`
  deprecation warning; it is unrelated and outside the owned files.
- Live database verification remains dependent on a configured
  `DATABASE_URL`.

## Critical Runtime Mapping Fix

### RED

Added a pure runtime mapping regression with uniquely tagged table, column,
index, constraint, and policy rows.

`npm test -- src/db/schema-integrity.test.ts` exited 1: 1 of 8 tests failed
with `TypeError: mapCatalogQueryResults is not a function`; the prior 7 tests
passed.

### Fix

- Added and exported `mapCatalogQueryResults`.
- Defined its input as the exact query-result tuple order: tables, columns,
  indexes, constraints, policies.
- Passed the CLI's complete `Promise.all` result directly through the mapper,
  removing the incorrect shifted destructuring.

### GREEN

- `npm test -- src/db/schema-integrity.test.ts`: PASS; 1 file, 8 tests.
- `npx eslint src/db/schema-integrity.ts src/db/schema-integrity.test.ts scripts/audit-database-schema.ts`:
  PASS; exit code 0, no findings.
- `npm run typecheck`: PASS; Next route types generated and `tsc --noEmit`
  exited 0.

### Remaining Concern

Vitest still prints the existing unrelated `vite-tsconfig-paths` deprecation
warning.
