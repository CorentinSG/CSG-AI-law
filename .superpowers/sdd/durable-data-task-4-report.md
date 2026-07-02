# Durable Data Task 4 Report

## Status

Implemented and committed as `4fcde8b`
(`feat(ops): add verified logical database backups`).

## RED evidence

Command:

```powershell
powershell -File scripts/backup-supabase.ps1 -SelfTest
powershell -File scripts/verify-backup-restore.ps1 -SelfTest
```

Observed before implementation:

```text
PASS: missing DATABASE_URL fails before external execution
FAIL: output path remains inside explicit backup directory - Not implemented
FAIL: pg_dump uses required logical backup flags - Not implemented
FAIL: restore requires RESTORE_TEST_DATABASE_URL - Expected '*RESTORE_TEST_DATABASE_URL*', got 'Not implemented'
FAIL: restore refuses identical source and target URLs - Expected '*distinct*', got 'Not implemented'
FAIL: restore accepts a distinct disposable target - Not implemented
RED exits: backup=1 restore=1
```

## GREEN evidence

```text
PASS: missing DATABASE_URL fails before external execution
PASS: output path remains inside explicit backup directory
PASS: pg_dump uses required logical backup flags
Self-test passed: backup safety checks
PASS: restore requires RESTORE_TEST_DATABASE_URL
PASS: restore refuses identical source and target URLs
PASS: restore accepts a distinct disposable target
Self-test passed: restore safety checks
GREEN exits: backup=0 restore=0
```

Final required verification:

```text
package.json valid
backup self-test: PASS (3 checks)
restore self-test: PASS (3 checks)
npm run typecheck: PASS
Generating route types...
Types generated successfully
```

No live backup or restore was run. No clearly distinct disposable
`RESTORE_TEST_DATABASE_URL` was provided, so attempting a live proof would have
violated the task's database-safety constraint.

## Files

- `scripts/backup-supabase.ps1`
- `scripts/verify-backup-restore.ps1`
- `docs/operations/database-backup-and-restore.md`
- `package.json` (two operator scripts only)

The report is committed separately so it can cite the immutable implementation
SHA. Unrelated UI, lockfile, package, plan, and prior backend working-tree
changes were not staged.

## Self-review

- Credential validation occurs before tool discovery or external execution.
- URLs are passed as argument-array values and are never written to output.
- Dump output is canonicalized beneath an explicit directory.
- `pg_dump` uses custom format, no owner, and no ACL flags.
- SHA-256 is created beside the dump and verified before restoration.
- Restore requires a nonempty target and refuses an identical source URL.
- `pg_restore` receives only the disposable target URL.
- Source access during verification is limited to fixed count-only queries.
- No source drop, schema mutation, or row-content query exists.
- Failed dump output is removed when possible; command failures are nonzero.

## Documentation verification

The runbook covers prerequisites, monthly cadence, exact commands, expected
output, retention, free-tier limitations, failure recovery, credential cleanup,
and the mandatory disposable-target rule.

## Concerns

String inequality cannot prove that two differently written URLs or DNS aliases
reach different database instances. The operator must verify target identity in
the provider dashboard. A real monthly control is not complete until an
authorized operator supplies a disposable database and records a successful
restore/count comparison.
