# Durable Data Task 2 Report

## Status

DONE

## RED Evidence

Command:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/pipeline.harness.test.ts
```

Observed exit code 1. Expected failures:

- `repository.upsertRawItem is not a function`
- migration `013_raw_item_idempotency.sql` did not exist
- pipeline atomic-upsert mock had zero calls

## GREEN Evidence

Exact required test command exited 0:

```text
Test Files  3 passed (3)
Tests       67 passed (67)
Duration    1.18s
```

Exact required typecheck command exited 0:

```text
> next typegen && tsc --noEmit
Generating route types...
Types generated successfully
```

`git diff --check` on all owned implementation and test paths exited 0. It
reported only Git's existing LF-to-CRLF checkout warnings.

## Files

- `src/db/migrations/013_raw_item_idempotency.sql`
- `src/db/repository-types.ts`
- `src/db/repositories/memory-repository.ts`
- `src/db/repositories/memory-repository.test.ts`
- `src/db/repositories/supabase-repository.ts`
- `src/db/repositories/supabase-repository.test.ts`
- `src/agents/ai-regulation/processors/pipeline.ts`
- `src/agents/ai-regulation/processors/pipeline.harness.test.ts`
- `.superpowers/sdd/durable-data-task-2-report.md`

## Implementation

- Added the `upsertRawItem` repository contract with an explicit insertion
  result.
- Memory writes perform the hash check and insertion in one synchronous
  critical section before yielding.
- Supabase writes use `ON CONFLICT (hash) DO NOTHING` semantics. A successful
  insert returns its row; a conflict fetches and returns the canonical row.
  No pre-read determines whether insertion occurred.
- Source-reference provenance is created only by the winning insert.
- The pipeline uses the atomic operation and records conflict losers as
  duplicates without creating updates or additional raw rows.
- Migration 013 checks for existing duplicate non-null hashes and raises an
  actionable exception before creating an idempotent partial unique index.
  It contains no row deletion or rewriting.

## Self-review

- Concurrent memory callers receive one canonical id and exactly one
  `inserted: true`.
- Database uniqueness is the serialization point for concurrent Supabase
  workers.
- Existing `createRawRegulatoryItem` remains available for compatibility, but
  ingestion no longer uses its racy pre-read/create sequence.
- The migration is additive, repeatable, and preserves legacy rows when it
  detects a conflict.
- Only contract-owned files are included in the commit.

## Commit

Implementation commit: `5b2e27ca5b1145d311c687e7b3c8e02b32e7fb10`

## Concerns

None.
