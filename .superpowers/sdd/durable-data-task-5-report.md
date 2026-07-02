# Durable Data Task 5 Report

Date: 2026-07-02
Branch: `ops/t-ops9-ux`
Status: `DONE-LOCAL` with operator-gated production work outstanding

## Verification

- `npm test`: PASS, 107 test files and 592 tests.
- `npm run lint`: FAIL, limited to Claude-owned UI errors:
  - `src/app/ai-regulation/europe/ai-act/page.tsx:113`
  - `src/app/ai-regulation/europe/governance/page.tsx:94`
  - `src/app/ai-regulation/united-states/governance/page.tsx:101`
  - Two non-blocking warnings were also reported.
- `npm run typecheck`: PASS.
- Preview-env `npm run build`: PASS, 121 static pages generated.
- `scripts/backup-supabase.ps1 -SelfTest`: PASS.
- `scripts/verify-backup-restore.ps1 -SelfTest`: PASS.
- `npm run audit:database-schema`: BLOCKED with
  `blocked_missing_credentials`; no credential value was printed.

## Documentation

- Updated every durable-data plan checkbox to match actual state.
- Marked Tasks 1-4 implementation, tests, and commits complete.
- Left the complete local gate unchecked because global lint is not green.
- Left disposable-database verification, live restore, and controlled
  production rollout unchecked with dated notes.
- Replaced only Codex's `T-SITE-HEALTH-AUDIT` status-board row with
  `T-DURABLE-DATA` at `DONE-LOCAL`.
- Added exactly one durable-data handoff at the top of `## Current status`.
- Updated the ignored scratch ledger.

## Commit And Push

- Durable-data implementation range: `7df6848..HEAD` (exclusive base,
  inclusive current branch tip).
- Documentation commit: `f3a5587` (`docs(ops): hand off durable data phase`).
- Push result: PASS; `ops/t-ops9-ux` pushed to `origin` through `f3a5587`.

## Blockers And Operator Steps

1. Fix the three Claude-owned UI lint errors, then rerun global lint.
2. Provide an explicitly disposable database target and `DATABASE_URL`.
3. Apply migrations 001-015 twice to that disposable target.
4. Rerun `npm run audit:database-schema`.
5. Exercise concurrent raw-item insertion and stale-token completion.
6. Create and verify a logical dump against a distinct disposable restore
   target.
7. Separately approve production migrations 013-015 before applying them.
8. After approved production migration, queue one official-source scan and
   verify one canonical raw row and lease-consistent terminal completion.

No production migration or live restore was performed.
