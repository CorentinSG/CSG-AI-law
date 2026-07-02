# Database Backup and Restore

## Safety rules

- Run backups and restore checks manually once per month.
- Never print, paste into command history, or commit either database URL.
- `DATABASE_URL` is the source. It is read by `pg_dump` and count-only queries.
- `RESTORE_TEST_DATABASE_URL` must identify a separate, disposable database.
- Never use the production URL as `RESTORE_TEST_DATABASE_URL`.
- The restore script refuses identical URL strings, but the operator remains
  responsible for confirming that aliases do not resolve to the same database.

## Prerequisites

Install PostgreSQL client tools (`pg_dump`, `pg_restore`, and `psql`) from the
same major version as, or a newer major version than, the hosted PostgreSQL
server. PowerShell 5.1 or later is required. Obtain direct PostgreSQL connection
URLs from the provider and place them only in process environment variables.

Run the credential-free safety checks first:

```powershell
powershell -File scripts/backup-supabase.ps1 -SelfTest
powershell -File scripts/verify-backup-restore.ps1 -SelfTest
```

Expected output ends with `Self-test passed` for each script.

## Monthly backup

Choose an explicit local directory outside the repository, set the source URL
without echoing it, and run:

```powershell
$env:DATABASE_URL = Read-Host "Source DATABASE_URL"
npm run backup:database -- -BackupDirectory "D:\CSG-Backups"
Remove-Item Env:DATABASE_URL
```

The command creates a timestamped custom-format `.dump` and adjacent
`.dump.sha256` manifest. Expected output reports only those two paths. It never
reports the URL or row contents.

## Restoration proof

Create or reset a database that is explicitly disposable. Confirm in the
provider dashboard that it is not production and does not share the production
database identity. Then run:

```powershell
$env:DATABASE_URL = Read-Host "Source DATABASE_URL"
$env:RESTORE_TEST_DATABASE_URL = Read-Host "Disposable RESTORE_TEST_DATABASE_URL"
npm run verify:database-restore -- `
  -DumpPath "D:\CSG-Backups\supabase-YYYYMMDD-HHMMSS.dump" `
  -ManifestPath "D:\CSG-Backups\supabase-YYYYMMDD-HHMMSS.dump.sha256"
Remove-Item Env:DATABASE_URL, Env:RESTORE_TEST_DATABASE_URL
```

The script verifies SHA-256 before calling `pg_restore`, restores only to the
disposable target, and compares counts for critical tables. Expected output
includes `Checksum verified`, one `Count verified` line per table, and
`Restore verification passed`. No row contents are selected or displayed.

## Retention and limitations

Keep at least three successful monthly backup/manifest pairs, with one encrypted
copy on a separate device or storage account. Delete older pairs according to
the firm's retention and legal-hold policy. Always retain each manifest with its
matching dump.

This operator-run approach has no recurring application cost, but storage,
disposable database projects, and provider quotas may have free-tier limits.
Free tiers can pause projects or restrict the number and lifetime of projects.
Check current provider limits before each restoration proof. Do not skip the
proof because a disposable target is unavailable; record it as a failed monthly
control and arrange a safe target.

## Failure recovery

- Missing tool: install compatible PostgreSQL client tools and rerun.
- Dump failure: discard the incomplete dump; the script removes it when
  possible. Fix connectivity or permissions, then create a new backup.
- Checksum failure: do not restore. Recover the matching dump and manifest or
  create a fresh backup.
- Restore failure: discard or recreate only the disposable target, then retry.
  Never redirect the restore command to the source.
- Count mismatch: preserve logs that contain counts only, discard/recreate the
  disposable target, and rerun. If it repeats, treat the backup as unverified.

Record the backup date, operator, retained paths, checksum success, restore
target identity, and count-verification result in the operations log.
