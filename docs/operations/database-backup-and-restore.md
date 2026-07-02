# Database Backup and Restore

## Safety rules

- Run a backup and restoration proof once per month.
- Never place a database URL directly on a `pg_dump`, `pg_restore`, or `psql`
  command line. Native process arguments can be visible to other local users,
  process monitors, job logs, and endpoint-security tooling.
- `DATABASE_URL` is consumed only by the backup PowerShell process.
  `RESTORE_TEST_DATABASE_URL` is consumed only by the restore PowerShell
  process. Each script removes its URL environment variable after parsing, but
  parent-process environments and interactive history can remain observable.
- The restore target must be newly created or fully recreated for each proof,
  disposable, and separate from the source.
- Never use production as `RESTORE_TEST_DATABASE_URL`.

## Prerequisites

Install PowerShell 5.1 or later and PostgreSQL client tools (`pg_dump`,
`pg_restore`, and `psql`) from the same or a newer major version than the
server. Use a private operator workstation. Restrict the backup directory to the
operator because dumps and manifests contain confidential metadata and data.

Run the credential-free checks:

```powershell
powershell -File scripts/backup-supabase.ps1 -SelfTest
powershell -File scripts/verify-backup-restore.ps1 -SelfTest
```

Each command must end with `Self-test passed`.

## Credential handling

The scripts parse the connection URI in memory. Native tools receive only
non-secret host, port, username, and database arguments. Immediately before
execution, the script writes the password to a randomly named temporary
`PGPASSFILE`, removes inherited permissions, grants access only to the current
Windows user, and points PostgreSQL tools to it through `PGPASSFILE`. A `finally`
block removes the file and restores the prior environment even when a command
fails.

The password is never printed. Still treat process environments, memory,
PowerShell transcription, crash dumps, and security-product telemetry as
potentially observable. Disable transcription for the session if firm policy
allows, avoid shared machines, and close the shell after the operation.

## Monthly backup

```powershell
$env:DATABASE_URL = Read-Host "Source DATABASE_URL"
npm run backup:database -- -BackupDirectory "D:\CSG-Backups"
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
```

Expected output names a timestamped `.dump` and `.dump.manifest.json`. The
manifest contains the dump filename, dump SHA-256, normalized source endpoint
identity, and count-only snapshots for critical tables. Its adjacent
`.manifest.json.sha256` covers the complete manifest bytes, including the
snapshot counts. Keep all three files together.

## Restoration proof

1. Create or fully recreate a database intended only for this proof.
2. In the provider dashboard, record its host, port, and database name.
3. Form the expected normalized identity as lowercase `host:port/database`.
   Use `5432` when the URI omits a port.
4. Confirm that identity differs from `sourceIdentity` in the integrity-checked
   manifest. DNS aliases still require operator investigation.
5. Set the target URL, pass the exact expected identity, and include the
   destructive confirmation switch:

```powershell
$env:RESTORE_TEST_DATABASE_URL = Read-Host "Disposable RESTORE_TEST_DATABASE_URL"
npm run verify:database-restore -- `
  -DumpPath "D:\CSG-Backups\supabase-YYYYMMDD-HHMMSS.dump" `
  -ManifestPath "D:\CSG-Backups\supabase-YYYYMMDD-HHMMSS.dump.manifest.json" `
  -ManifestChecksumPath "D:\CSG-Backups\supabase-YYYYMMDD-HHMMSS.dump.manifest.json.sha256" `
  -ExpectedTargetIdentity "disposable.example:5432/csg_restore_test" `
  -ConfirmDisposableTarget
Remove-Item Env:RESTORE_TEST_DATABASE_URL -ErrorAction SilentlyContinue
```

The script refuses to invoke `pg_restore` unless confirmation is present, the
expected identity matches the parsed target, the normalized target differs from
the manifest source identity, all artifact paths are bound, and both integrity
checks pass. It restores only to the target and compares target counts with the
backup-time snapshot. It never reconnects to the source or selects row content.

Expected output ends with `Restore verification passed against confirmed
disposable target <identity>`.

## Retention and limitations

Keep at least three successful monthly artifact sets, including one encrypted
copy on separate storage, subject to firm retention and legal-hold policy.
Provider free tiers may limit project count, lifetime, storage, or availability.
If no disposable target is available, record the monthly control as incomplete;
never substitute production or an unconfirmed database.

## Failure recovery

- Missing tool or failed backup: remove incomplete artifacts, correct the local
  tool or connection issue, and create a fresh backup.
- Manifest or dump checksum failure: do not restore; recover the matching
  artifact set or create a new backup.
- Identity or confirmation refusal: stop and verify the target in the provider
  dashboard. Do not bypass or edit the integrity-protected source identity.
- Restore failure: delete and recreate only the disposable target, then retry.
- Count mismatch: treat the backup as unverified, retain count-only logs, delete
  and recreate the disposable target, and repeat once before investigating the
  backup process.
- Suspected leaked credential: rotate it immediately and securely delete any
  unexpected password file or transcript.

Record the operator, date, artifact paths, manifest hash result, recreated target
identity, explicit confirmation, restore result, and count comparison.
