-- Statement timeouts on the monitoring bookkeeping reads.
--
-- Run 30411998773 failed 17 of 20 scan jobs, almost all of them on two queries:
--
--   Failed to list scan logs           | code=57014 canceling statement due to statement timeout
--   Failed to list source health checks| code=57014 canceling statement due to statement timeout
--
-- Neither is a scanning failure — both are the worker's bookkeeping reads, and
-- both sort a grown table with no index to sort by:
--
--   listScanLogs()            order by scan_started_at desc limit n
--     regulation_scan_logs has only regulation_scan_logs_source_id_idx(source_id),
--     so the ordering is a full sort of the table.
--
--   listSourceHealthChecks()  order by checked_at desc limit n
--     source_health_checks has source_health_checks_source_idx(source_id, checked_at desc).
--     That serves the per-source variant, but the leading column is source_id, so
--     it cannot serve the unfiltered listing — also a full sort.
--
-- A descending index on the ordering column turns each into an index scan that
-- stops after `limit` rows.
--
-- CONCURRENTLY so neither table's writes are blocked while the index builds; the
-- worker writes to both on every scan. It cannot run inside a transaction block,
-- so apply these two statements one at a time rather than pasting the file as a
-- single batch.

create index concurrently if not exists regulation_scan_logs_started_at_idx
  on regulation_scan_logs (scan_started_at desc);

create index concurrently if not exists source_health_checks_checked_at_idx
  on source_health_checks (checked_at desc);
