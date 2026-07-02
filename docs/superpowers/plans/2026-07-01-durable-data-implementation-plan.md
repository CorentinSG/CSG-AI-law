# Durable Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make queue transitions and legal-data ingestion idempotent, enforce critical database invariants, and prove that Supabase data can be backed up and restored at negligible recurring cost.

**Architecture:** Preserve the existing Next.js, Supabase, and Railway topology. Add an executable schema audit, atomic repository operations backed by Postgres constraints/RPCs, lease-token-aware job completion, and operator-run logical backup verification rather than introducing another service.

**Tech Stack:** TypeScript, Vitest, Supabase/Postgres SQL migrations, PowerShell, Railway worker.

## Global Constraints

- Monthly infrastructure cost remains USD 0 where possible and USD 5 maximum.
- Do not weaken authentication, publication policy, AI defaults, RLS, or AI cost controls.
- Do not overwrite Claude Code's uncommitted UI work.
- Write each regression test first and observe the expected failure.
- Migrations must be additive and idempotent; no destructive production SQL.
- Do not expose, print, or commit credentials or database contents.

---

### Task 1: Executable Schema Integrity Audit

**Files:**
- Create: `src/db/schema-integrity.ts`
- Create: `src/db/schema-integrity.test.ts`
- Create: `scripts/audit-database-schema.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: rows from `information_schema.columns`, `pg_indexes`, `pg_constraint`, and `pg_policies`
- Produces: `evaluateSchemaIntegrity(snapshot): SchemaIntegrityReport` and `npm run audit:database-schema`

- [x] **Step 1: Write failing tests**

Add fixtures proving the audit fails when `raw_regulatory_items.hash` lacks a unique constraint, when `scan_jobs.status` lacks its check constraint, or when an application table lacks RLS; prove a complete fixture returns `{ ok: true, findings: [] }`.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/db/schema-integrity.test.ts
```

Expected: FAIL because `evaluateSchemaIntegrity` does not exist.

- [x] **Step 3: Implement the pure evaluator and redacted runtime script**

Define explicit required columns, indexes, constraints, and RLS policies for `raw_regulatory_items`, `ai_regulatory_updates`, `scan_jobs`, `regulation_sources`, and `news_items`. The script must use `DATABASE_URL`, print only object names and missing invariant classes, and exit nonzero for findings.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/db/schema-integrity.test.ts
npm run audit:database-schema
```

Expected: tests pass; runtime reports either a clean schema or actionable redacted findings.

- [x] **Step 5: Commit**

```powershell
git add src/db/schema-integrity.ts src/db/schema-integrity.test.ts scripts/audit-database-schema.ts package.json package-lock.json
git commit -m "feat(db): add executable schema integrity audit"
```

---

### Task 2: Atomic Raw-Item Deduplication

**Files:**
- Create: `src/db/migrations/013_raw_item_idempotency.sql`
- Modify: `src/db/repository-types.ts`
- Modify: `src/db/repositories/memory-repository.ts`
- Modify: `src/db/repositories/memory-repository.test.ts`
- Modify: `src/db/repositories/supabase-repository.ts`
- Modify: `src/db/repositories/supabase-repository.test.ts`
- Modify: `src/agents/ai-regulation/processors/pipeline.ts`
- Modify: `src/agents/ai-regulation/processors/pipeline.harness.test.ts`

**Interfaces:**
- Consumes: `RawRegulatoryItem` with stable `hash`
- Produces: `upsertRawItem(item): Promise<{ item: RawRegulatoryItem; inserted: boolean }>`

- [x] **Step 1: Write failing concurrency tests**

Add repository and pipeline tests that issue two concurrent writes with the same hash and assert one durable row, one canonical id, and exactly one `inserted: true` result.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/pipeline.harness.test.ts
```

Expected: FAIL because insertion is not an atomic idempotent contract.

- [x] **Step 3: Add the invariant and repository operation**

Add an idempotent unique index on `raw_regulatory_items(hash)` after a preflight duplicate check that raises an actionable exception rather than deleting data. Implement memory parity and a Supabase `upsert(..., { onConflict: "hash", ignoreDuplicates: true })` followed by canonical lookup. Make the pipeline use this single operation.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/pipeline.harness.test.ts
```

Expected: all targeted tests pass.

- [x] **Step 5: Commit**

```powershell
git add src/db/migrations/013_raw_item_idempotency.sql src/db/repository-types.ts src/db/repositories/memory-repository.ts src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/pipeline.ts src/agents/ai-regulation/processors/pipeline.harness.test.ts
git commit -m "fix(db): make raw ingestion idempotent"
```

---

### Task 3: Lease-Token-Safe Job Completion

**Files:**
- Create: `src/db/migrations/014_scan_job_lease_completion.sql`
- Modify: `src/db/repository-types.ts`
- Modify: `src/db/repositories/memory-repository.ts`
- Modify: `src/db/repositories/memory-repository.test.ts`
- Modify: `src/db/repositories/supabase-repository.ts`
- Modify: `src/db/repositories/supabase-repository.test.ts`
- Modify: `src/agents/ai-regulation/processors/scanJobs.ts`
- Modify: `src/agents/ai-regulation/processors/scanJobs.test.ts`

**Interfaces:**
- Consumes: job id, current lease token, terminal patch
- Produces: `completeScanJob(id, leaseToken, patch): Promise<ScanJob | null>`

- [x] **Step 1: Write failing stale-worker tests**

Prove that a worker holding an expired token cannot overwrite a job reclaimed with a new token, while the current lease holder can persist one terminal outcome.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/scanJobs.test.ts
```

Expected: FAIL because terminal updates currently key only on job id.

- [x] **Step 3: Implement compare-and-set completion**

Add an idempotent Postgres RPC that updates only a `running` job whose `result_summary->>leaseToken` matches. Implement repository parity and route every successful or failed terminal transition through `completeScanJob`.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/scanJobs.test.ts
```

Expected: all targeted tests pass, including stale-token rejection.

- [x] **Step 5: Commit**

```powershell
git add src/db/migrations/014_scan_job_lease_completion.sql src/db/repository-types.ts src/db/repositories/memory-repository.ts src/db/repositories/memory-repository.test.ts src/db/repositories/supabase-repository.ts src/db/repositories/supabase-repository.test.ts src/agents/ai-regulation/processors/scanJobs.ts src/agents/ai-regulation/processors/scanJobs.test.ts
git commit -m "fix(queue): protect completion with lease tokens"
```

---

### Task 4: Logical Backup and Restoration Proof

**Files:**
- Create: `scripts/backup-supabase.ps1`
- Create: `scripts/verify-backup-restore.ps1`
- Create: `docs/operations/database-backup-and-restore.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DATABASE_URL`, local PostgreSQL client tools
- Produces: timestamped custom-format dump, SHA-256 manifest, isolated restore verification report

- [x] **Step 1: Write script contract tests**

Add Pester-independent PowerShell self-check modes that verify missing credentials fail before execution, output paths stay under the requested backup directory, and generated commands use `pg_dump --format=custom --no-owner --no-acl`.

- [x] **Step 2: Verify RED**

Run:

```powershell
powershell -File scripts/backup-supabase.ps1 -SelfTest
powershell -File scripts/verify-backup-restore.ps1 -SelfTest
```

Expected: FAIL because the scripts do not exist.

- [x] **Step 3: Implement backup, isolated restore, and runbook**

The backup script must never echo `DATABASE_URL`; write a checksum manifest beside the dump. The restore script must require a separate `RESTORE_TEST_DATABASE_URL`, restore into that disposable target, compare table counts for critical tables, and drop nothing outside that target. Document Supabase free-tier limitations and a monthly operator cadence.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
powershell -File scripts/backup-supabase.ps1 -SelfTest
powershell -File scripts/verify-backup-restore.ps1 -SelfTest
```

Expected: both self-tests pass. Run a live backup/restore only when the disposable restore URL is explicitly configured.

- [x] **Step 5: Commit**

```powershell
git add scripts/backup-supabase.ps1 scripts/verify-backup-restore.ps1 docs/operations/database-backup-and-restore.md package.json package-lock.json
git commit -m "feat(ops): add verified logical database backups"
```

---

### Task 5: Durable Data Release Gate

**Files:**
- Modify only when required by failures: files owned by Tasks 1-4
- Coordination: `AI_TASKS.md`

**Interfaces:**
- Consumes: Tasks 1-4
- Produces: verified migration/runtime evidence and Claude Code handoff

- [ ] **Step 1: Run the complete local gate**

2026-07-02: `npm test`, `npm run typecheck`, preview `npm run build`, and both
PowerShell self-tests pass. Global lint remains unchecked because it fails only
in Claude-owned UI files:
`src/app/ai-regulation/europe/ai-act/page.tsx:113`,
`src/app/ai-regulation/europe/governance/page.tsx:94`, and
`src/app/ai-regulation/united-states/governance/page.tsx:101`.

```powershell
npm test
npm run lint
npm run typecheck
$env:VERCEL_ENV="preview"
$env:ADMIN_USERNAME="build-verifier"
$env:ADMIN_PASSWORD="temporary-build-password-not-for-runtime"
npm run build
```

Expected: backend checks pass. Report exact Claude-owned UI lint failures without rewriting those files.

- [ ] **Step 2: Verify migrations against a disposable database**

2026-07-02: operator-gated. No disposable database or `DATABASE_URL` was
available, so migrations 001-014 were not applied and the runtime schema audit
reported `blocked_missing_credentials`. Migrations 013 and 014 remain unapplied
to production by this task.

Apply migrations 001-014 twice to prove idempotence, run `npm run audit:database-schema`, then exercise concurrent raw-item insertion and stale-token completion.

- [ ] **Step 3: Verify backup restoration**

2026-07-02: waiting for an explicitly identified disposable restore target.
Both backup and restore self-tests pass; no live dump or restore was run.

Create one logical dump and restore it into the disposable target. Confirm critical table counts and checksum verification without printing row contents or credentials.

- [ ] **Step 4: Controlled production rollout**

2026-07-02: operator-gated. No production migrations, live restore, or
post-migration production scan was performed.

Push the backend commits, apply migrations 013-014 only after explicit operator approval, then queue one official-source scan and confirm one canonical raw row and a lease-consistent terminal job.

- [x] **Step 5: Handoff and commit**

2026-07-02: release-gate documentation and coordination handoff prepared for
the `docs(ops): hand off durable data phase` commit.

Update only Codex-owned status rows and add one handoff citing `RawRegulatoryItem`, `AiRegulationRepository`, `executeClaimedScanJob()`, community "DB Repository Layer", community "Scan Job Management", and community "Data Ingestion Pipeline".

```powershell
git add AI_TASKS.md
git commit -m "docs(ops): hand off durable data phase"
```
