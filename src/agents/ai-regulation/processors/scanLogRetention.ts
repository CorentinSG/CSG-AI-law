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
 * Runs one bounded purge loop. Never throws: retention is housekeeping, and
 * failing it must not take down a scan run — a failure is reported to the
 * caller to log, with whatever was already deleted still counted.
 */
async function runBoundedPurge(
  purgeBatch: (cutoffIso: string, batchSize: number) => Promise<number>,
  options: { cutoffIso: string; batchSize: number; maxBatches: number },
): Promise<ScanLogPurgeResult & { error?: string }> {
  let deleted = 0;
  let batches = 0;

  try {
    while (batches < options.maxBatches) {
      const removed = await purgeBatch(options.cutoffIso, options.batchSize);
      batches += 1;
      deleted += removed;
      // A short pass means the backlog is gone; a full one means there is more.
      if (removed < options.batchSize) return { deleted, batches, drained: true };
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

/** Deletes scan logs older than the retention window, bounded per run. */
export async function purgeExpiredScanLogs(options?: {
  now?: Date;
  retentionDays?: number;
  batchSize?: number;
  maxBatches?: number;
}): Promise<ScanLogPurgeResult & { error?: string }> {
  return runBoundedPurge((cutoff, batch) => updateRepository.purgeScanLogsBefore(cutoff, batch), {
    cutoffIso: retentionCutoff(options?.now ?? new Date(), options?.retentionDays),
    batchSize: options?.batchSize ?? BATCH_SIZE,
    maxBatches: options?.maxBatches ?? MAX_BATCHES_PER_RUN,
  });
}

/**
 * Health checks share the scan logs' growth profile — one row per source per
 * scan, nothing read past the newest 500 (`sourceRuntimeHealth`) — so they
 * share the 30-day window.
 */
export const SOURCE_HEALTH_CHECK_RETENTION_DAYS = SCAN_LOG_RETENTION_DAYS;

/**
 * Findings are a quality paper trail, not scan noise, so only *resolved*
 * findings are ever purged, and after a longer window. An unresolved finding is
 * kept indefinitely: deleting an open problem is how it gets forgotten. If the
 * same defect recurs after its resolved record is purged, the detector will
 * simply file it again.
 */
export const RESOLVED_FINDING_RETENTION_DAYS = 90;

export type OperationalRetentionReport = {
  scanLogs: ScanLogPurgeResult & { error?: string };
  sourceHealthChecks: ScanLogPurgeResult & { error?: string };
  resolvedFindings: ScanLogPurgeResult & { error?: string };
};

/**
 * The worker's once-per-run housekeeping: every operational table that grows
 * per-scan gets the same bounded treatment that stopped `regulation_scan_logs`
 * taking the database down. Sequential on purpose — three concurrent delete
 * loops would compete for the same pool the scan needs next.
 */
export async function purgeExpiredOperationalRecords(options?: {
  now?: Date;
  batchSize?: number;
  maxBatches?: number;
}): Promise<OperationalRetentionReport> {
  const now = options?.now ?? new Date();
  const batchSize = options?.batchSize ?? BATCH_SIZE;
  const maxBatches = options?.maxBatches ?? MAX_BATCHES_PER_RUN;

  const scanLogs = await purgeExpiredScanLogs({ now, batchSize, maxBatches });
  const sourceHealthChecks = await runBoundedPurge(
    (cutoff, batch) => updateRepository.purgeSourceHealthChecksBefore(cutoff, batch),
    {
      cutoffIso: retentionCutoff(now, SOURCE_HEALTH_CHECK_RETENTION_DAYS),
      batchSize,
      maxBatches,
    },
  );
  const resolvedFindings = await runBoundedPurge(
    (cutoff, batch) => updateRepository.purgeResolvedDataQualityFindingsBefore(cutoff, batch),
    {
      cutoffIso: retentionCutoff(now, RESOLVED_FINDING_RETENTION_DAYS),
      batchSize,
      maxBatches,
    },
  );

  return { scanLogs, sourceHealthChecks, resolvedFindings };
}
