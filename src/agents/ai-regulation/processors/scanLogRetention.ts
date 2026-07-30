import { updateRepository } from "./updateRepository";

/**
 * How long scan logs are kept.
 *
 * `regulation_scan_logs` gets one row per source per scan and nothing ever
 * deleted them. It grew until `order by scan_started_at desc limit n` exceeded
 * the statement timeout, which exhausted the connection pool and took the whole
 * database down with it — the outage fixed by migration 032. The index made the
 * read cheap; it did nothing about the growth, so without a retention policy the
 * table keeps growing and only the symptom was treated.
 *
 * 30 days is comfortably beyond what anything reads: the widest consumer is
 * `sourceManager` at the newest 500 rows, then `dataStewardSync` at 150 and the
 * alerting digests at 20. Nothing walks the history.
 */
export const SCAN_LOG_RETENTION_DAYS = 30;

/** Rows deleted per statement. */
const BATCH_SIZE = 500;

/**
 * Batches per run. The first purge faces however many rows have accumulated, and
 * deleting all of them at once would re-create the timeout this exists to
 * prevent. Capping the work per run spreads the initial backlog over several
 * runs and keeps steady-state cost flat.
 */
const MAX_BATCHES_PER_RUN = 10;

export function retentionCutoff(now: Date, days: number = SCAN_LOG_RETENTION_DAYS): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export type ScanLogPurgeResult = {
  deleted: number;
  batches: number;
  /** True when a pass came back short, i.e. nothing older than the cutoff is left. */
  drained: boolean;
};

/**
 * Deletes scan logs older than the retention window, bounded per run.
 *
 * Never throws: retention is housekeeping, and failing it must not take down a
 * scan run. A failure is reported to the caller to log, not raised.
 */
export async function purgeExpiredScanLogs(options?: {
  now?: Date;
  retentionDays?: number;
  batchSize?: number;
  maxBatches?: number;
}): Promise<ScanLogPurgeResult & { error?: string }> {
  const cutoff = retentionCutoff(options?.now ?? new Date(), options?.retentionDays);
  const batchSize = options?.batchSize ?? BATCH_SIZE;
  const maxBatches = options?.maxBatches ?? MAX_BATCHES_PER_RUN;

  let deleted = 0;
  let batches = 0;

  try {
    while (batches < maxBatches) {
      const removed = await updateRepository.purgeScanLogsBefore(cutoff, batchSize);
      batches += 1;
      deleted += removed;
      // A short pass means the backlog is gone; a full one means there is more.
      if (removed < batchSize) return { deleted, batches, drained: true };
    }
    return { deleted, batches, drained: false };
  } catch (error) {
    return {
      deleted,
      batches,
      drained: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
