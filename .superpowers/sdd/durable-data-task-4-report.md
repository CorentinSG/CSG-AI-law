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

## Security Review Fix

### Status

Addressed all `CHANGES_REQUESTED` findings without running a live backup or
restore.

### RED evidence

The expanded self-tests failed before implementation:

```text
SECURITY RED exits: backup=1 restore=1
backup failures: URI decomposition, credential-free command builders,
manifest snapshot binding, PGPASSFILE lifecycle
restore failures: destructive confirmation, target identity matching,
equivalent endpoint refusal, exact credential-free pg_restore arguments,
manifest checksum rejection, traversal rejection, snapshot mismatch,
missing-tool and command-failure handling
```

The first GREEN attempt caught a PowerShell 5.1 incompatibility:

```text
Cannot convert argument "options", with value: "2", for "Split"
SECURITY GREEN candidate exits: backup=1 restore=1
```

URI userinfo parsing was changed to index-based parsing before GREEN.

### GREEN evidence

```text
backup self-test: PASS (8 checks)
restore self-test: PASS (13 checks)
npm run typecheck: PASS
Generating route types...
Types generated successfully
```

Checks cover credential-free native arguments, exact dump/restore flags,
missing tools, failed commands, temporary password-file cleanup, destructive
confirmation, target identity, endpoint equivalence, manifest and dump checksum
rejection, artifact path and filename binding, traversal, snapshot counts, and
count mismatch.

### Security changes

- Connection URIs are parsed in PowerShell and removed from the script
  environment before PostgreSQL native tools run.
- Native argv contains only non-secret connection fields, fixed options, fixed
  count-only SQL, and artifact paths.
- Passwords use a random temporary restricted `PGPASSFILE`; cleanup and prior
  environment restoration are in `finally`.
- Restore requires `-ConfirmDisposableTarget` and an exact normalized
  `-ExpectedTargetIdentity`, and refuses the manifest source endpoint.
- Backup captures critical counts in JSON. SHA-256 covers exact manifest bytes,
  while the manifest binds the dump filename and SHA-256.
- Restore compares the target only with backup-time counts and has no source
  connection path.

### Documentation verification

The runbook documents process/environment observability, transcription risk,
the `PGPASSFILE` lifecycle, target recreation, normalized identity, explicit
confirmation, artifact retention, and failure recovery.

### Concerns

Endpoint identity cannot prove that different DNS names or provider proxies do
not reach the same database; dashboard verification remains mandatory. SHA-256
is not an authenticated signature against an attacker able to rewrite artifacts
and checksums, so backup storage access controls remain part of the boundary.
