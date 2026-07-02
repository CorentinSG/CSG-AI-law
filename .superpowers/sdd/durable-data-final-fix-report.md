# Durable Data Final Fix Report

Date: 2026-07-02
Branch: `ops/t-ops9-ux`
Status: `DONE-LOCAL`; database rollout remains operator-gated
Implementation range: `7df6848..HEAD` (exclusive base, inclusive HEAD)

## Findings Closed

1. Heartbeat and stale recovery now use repository CAS operations backed by
   lease-token/status RPC predicates. Recovery also compares the observed
   heartbeat so a renewed lease cannot be reclaimed. Terminal and race
   regressions cover heartbeat-after-completion and completion-versus-recovery.
2. The schema audit reads `pg_index` structural fields for columns, uniqueness,
   validity, and predicates. RLS checks validate enabled state, command, roles,
   `USING`, and `WITH CHECK`; check constraints validate columns, validation
   state, and complete intended domains.
3. `015_durable_data_integrity.sql` idempotently enables RLS and adds
   service-role policies for `regulation_sources`, `raw_regulatory_items`, and
   `scan_jobs`. It was created and statically tested but not applied live.
4. Raw metadata and provenance now update through one transactional RPC.
   References merge by canonical `(raw_item_id, url, source_role)` identity, so
   repaired provenance is retained and insertion failure rolls metadata back.
5. Missing RPC 013 falls back to database-backed raw lookup/insert/provenance
   repair. Missing RPC 014 reads the actual `scan_jobs` row and performs a
   status-plus-lease CAS update; it no longer depends on an empty process map.
6. Plan, task report, progress ledger, and `AI_TASKS.md` use
   `7df6848..HEAD` semantics and distinguish local completion from unapplied
   migrations and live restore work.

## TDD Evidence

- Schema audit RED: 11 behavioral failures for structural uniqueness, policy
  contracts, index columns, and weakened domains. GREEN: 18/18.
- Lease RED: missing heartbeat/recovery methods and an unrestricted recovery
  overwrite. GREEN: 48/48 repository and processor tests.
- Supabase/migration RED: 7 failures for both `PGRST202` paths, transactional
  metadata, migration 015, and lease CAS. GREEN: 55/55.
- Full suite GREEN: 107 test files and 612 tests.

## Verification

- Backend-owned ESLint: PASS, zero findings.
- `npm run typecheck`: PASS.
- Preview-env `npm run build`: PASS; 121 static pages generated.
- `scripts/backup-supabase.ps1 -SelfTest`: PASS.
- `scripts/verify-backup-restore.ps1 -SelfTest`: PASS.
- `npm run audit:database-schema`: correctly BLOCKED with
  `blocked_missing_credentials DATABASE_URL`; no secret was printed.
- Global `npm run lint`: FAIL only in Claude-owned UI files at
  `europe/ai-act/page.tsx:113`, `europe/governance/page.tsx:94`, and
  `united-states/governance/page.tsx:101`, plus two unrelated warnings.

## Commits And Push

- Code: `7beac0c` (`fix(db): close durable data review findings`).
- Documentation: the commit containing this report.
- Push target: `origin/ops/t-ops9-ux`. The final push result is reported in the
  caller handoff because a commit cannot contain evidence of its own later push.

## Remaining Operator Gates

1. Provide an explicitly disposable database and `DATABASE_URL`.
2. Apply migrations 001-015 twice there and rerun the schema audit.
3. Exercise concurrent raw insertion, metadata rollback/retention, heartbeat
   rejection, completion/recovery races, and a distinct-target logical restore.
4. Separately approve production migrations 013-015.
5. After approved migration, run one controlled official-source scan and verify
   canonical provenance plus one lease-consistent terminal job.

No live migration, production scan, dump, or restore was performed.
