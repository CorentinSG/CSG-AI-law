import { randomUUID } from "node:crypto";

import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { runDataStewardSync } from "@/agents/ai-regulation/processors/dataStewardSync";
import { alertOnDailyReviewBacklog } from "@/lib/alerting";
import {
  runAiRegulationScan,
  type ScanTrigger,
} from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";

const DEFAULT_STALE_SCAN_JOB_AFTER_MS = 15 * 60 * 1000;
const DEFAULT_SCAN_JOB_FETCH_LIMIT = 100;
const DEFAULT_SCAN_JOB_LEASE_OWNER = "scan-worker";
const DEFAULT_SCAN_JOB_HEARTBEAT_INTERVAL_MS = 10_000;
const DEFAULT_SCAN_JOB_HEARTBEAT_TIMEOUT_MS = 45_000;

export type QueueScanJobDispatchResult = {
  queuedJob: ScanJob;
  processedJob: ScanJob | null;
  queuedJobProcessedImmediately: boolean;
  blockedByRunningJobs: string[];
  blockingRunningJobSummaries: BlockingRunningJobSummary[];
  result: Awaited<ReturnType<typeof runAiRegulationScan>>;
  stewardship: {
    syncedCount: number;
    highPriorityReviewItems: number;
  } | null;
};

export type QueueAndDrainScanJobInput = {
  sourceId?: string;
  trigger: ScanTrigger;
  requestedBy: string;
  scanProfile?: ScanProfileId;
  leaseOwner?: string;
  executionMode?: "drain" | "enqueue_only";
};

export type BlockingRunningJobSummary = {
  jobId: string;
  sourceId: string | null;
  trigger: ScanTrigger;
  requestedBy: string;
  status: ScanJob["status"];
  leaseOwner: string | null;
  startedAt: string | null;
  heartbeatAt: string | null;
  runningForMs: number | null;
  heartbeatAgeMs: number | null;
  heartbeatTimeoutMs: number;
  blockedReason: "healthy_running_job";
};

function isClaimFailure(error: unknown): error is Error & { code: "scan_job_claim_failed" } {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "scan_job_claim_failed"
  );
}

async function claimScanJobForProcessing(
  jobId: string,
  options?: {
    leaseOwner?: string;
    heartbeatIntervalMs?: number;
    heartbeatTimeoutMs?: number;
  },
) {
  const startedAt = new Date().toISOString();
  return updateRepository.tryStartScanJob(jobId, {
    startedAt,
    leaseOwner: options?.leaseOwner ?? DEFAULT_SCAN_JOB_LEASE_OWNER,
    leaseToken: randomUUID(),
    leaseHeartbeatAt: startedAt,
    leaseHeartbeatIntervalMs:
      options?.heartbeatIntervalMs ?? DEFAULT_SCAN_JOB_HEARTBEAT_INTERVAL_MS,
    leaseHeartbeatTimeoutMs:
      options?.heartbeatTimeoutMs ?? DEFAULT_SCAN_JOB_HEARTBEAT_TIMEOUT_MS,
  });
}

function getLeaseHeartbeatTimeoutMs(job: ScanJob, fallback: number) {
  const fromSummary = job.resultSummary?.leaseHeartbeatTimeoutMs;
  return typeof fromSummary === "number" && Number.isFinite(fromSummary) && fromSummary > 0
    ? fromSummary
    : fallback;
}

function getLeaseHeartbeatAt(job: ScanJob) {
  const fromSummary = job.resultSummary?.leaseHeartbeatAt;
  return typeof fromSummary === "string" ? fromSummary : null;
}

function getLeaseHeartbeatIntervalMs(job: ScanJob, fallback: number) {
  const fromSummary = job.resultSummary?.leaseHeartbeatIntervalMs;
  return typeof fromSummary === "number" && Number.isFinite(fromSummary) && fromSummary > 0
    ? fromSummary
    : fallback;
}

function getLeaseOwner(job: ScanJob) {
  const fromSummary = job.resultSummary?.leaseOwner;
  return typeof fromSummary === "string" ? fromSummary : null;
}

function summarizeBlockingRunningJob(
  job: ScanJob,
  nowTimestamp: number,
): BlockingRunningJobSummary {
  const startedAtTimestamp = toTimestamp(job.startedAt);
  const heartbeatAt = getLeaseHeartbeatAt(job);
  const heartbeatAtTimestamp = toTimestamp(heartbeatAt);
  const heartbeatTimeoutMs = getLeaseHeartbeatTimeoutMs(
    job,
    DEFAULT_SCAN_JOB_HEARTBEAT_TIMEOUT_MS,
  );

  return {
    jobId: job.id,
    sourceId: job.sourceId ?? null,
    trigger: job.trigger as ScanTrigger,
    requestedBy: job.requestedBy,
    status: job.status,
    leaseOwner: getLeaseOwner(job),
    startedAt: job.startedAt ?? null,
    heartbeatAt,
    runningForMs:
      startedAtTimestamp === null ? null : Math.max(0, nowTimestamp - startedAtTimestamp),
    heartbeatAgeMs:
      heartbeatAtTimestamp === null ? null : Math.max(0, nowTimestamp - heartbeatAtTimestamp),
    heartbeatTimeoutMs,
    blockedReason: "healthy_running_job",
  };
}

function summarizeBlockingRunningJobs(
  jobs: ScanJob[],
  nowTimestamp = Date.now(),
) {
  return jobs.map((job) => summarizeBlockingRunningJob(job, nowTimestamp));
}

function summarizeJobResult(
  result: Awaited<ReturnType<typeof runAiRegulationScan>>,
): Record<string, unknown> {
  return {
    sourcesProcessed: result.length,
    totalFound: result.reduce((sum, entry) => sum + entry.itemsFound, 0),
    totalNew: result.reduce((sum, entry) => sum + entry.newItemsDetected, 0),
    totalDuplicates: result.reduce(
      (sum, entry) => sum + entry.duplicatesDetected,
      0,
    ),
    totalFailures: result.reduce(
      (sum, entry) => sum + entry.processingFailures,
      0,
    ),
    triggers: Array.from(new Set(result.map((entry) => entry.trigger))),
    scanProfiles: Array.from(new Set(result.map((entry) => entry.scanProfile ?? "default"))),
  };
}

function deriveJobStatus(
  result: Awaited<ReturnType<typeof runAiRegulationScan>>,
): ScanJob["status"] {
  const statuses = new Set(result.map((entry) => entry.status));
  if (statuses.has("failed")) return "failed";
  if (statuses.has("partial_success")) return "partial_success";
  return "succeeded";
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function sortJobsByCreatedAtAscending(a: ScanJob, b: ScanJob) {
  return (toTimestamp(a.createdAt) ?? 0) - (toTimestamp(b.createdAt) ?? 0);
}

function isStaleRunningScanJob(
  job: ScanJob,
  nowTimestamp: number,
  staleAfterMs: number,
) {
  if (job.status !== "running" || job.finishedAt) {
    return false;
  }

  const staleThresholdMs = getLeaseHeartbeatTimeoutMs(job, staleAfterMs);
  const heartbeatAt = toTimestamp(getLeaseHeartbeatAt(job));
  const startedAt = toTimestamp(job.startedAt);
  const freshnessAnchor = heartbeatAt ?? startedAt;
  if (freshnessAnchor === null) {
    return false;
  }

  return nowTimestamp - freshnessAnchor > staleThresholdMs;
}

function startScanJobHeartbeat(job: ScanJob) {
  const leaseToken =
    typeof job.resultSummary?.leaseToken === "string"
      ? job.resultSummary.leaseToken
      : null;
  const leaseOwner =
    typeof job.resultSummary?.leaseOwner === "string"
      ? job.resultSummary.leaseOwner
      : DEFAULT_SCAN_JOB_LEASE_OWNER;
  if (!leaseToken) {
    return () => {};
  }

  const intervalMs = getLeaseHeartbeatIntervalMs(
    job,
    DEFAULT_SCAN_JOB_HEARTBEAT_INTERVAL_MS,
  );
  const timer = setInterval(() => {
    const heartbeatAt = new Date().toISOString();
    void updateRepository
      .updateScanJob(job.id, {
        resultSummary: {
          ...job.resultSummary,
          leaseOwner,
          leaseToken,
          leaseHeartbeatAt: heartbeatAt,
          leaseHeartbeatIntervalMs: intervalMs,
          leaseHeartbeatTimeoutMs: getLeaseHeartbeatTimeoutMs(
            job,
            DEFAULT_SCAN_JOB_HEARTBEAT_TIMEOUT_MS,
          ),
        },
      })
      .catch(() => {
        // Heartbeat failures should not crash the in-flight worker loop.
      });
  }, intervalMs);

  return () => clearInterval(timer);
}

async function executeClaimedScanJob(processingJob: ScanJob) {
  const stopHeartbeat = startScanJobHeartbeat(processingJob);

  try {
    const result = await runAiRegulationScan(processingJob.sourceId ?? undefined, {
      trigger: processingJob.trigger as ScanTrigger,
      scanJobId: processingJob.id,
      scanProfile:
        typeof processingJob.resultSummary?.scanProfile === "string"
          ? (processingJob.resultSummary.scanProfile as ScanProfileId)
          : undefined,
    });
    const finishedAt = new Date().toISOString();
    const status = deriveJobStatus(result);
    const summary = summarizeJobResult(result);
    const stewardship = await runDataStewardSync();

    const updatedJob = await updateRepository.updateScanJob(processingJob.id, {
      status,
      finishedAt,
      resultSummary: {
        ...processingJob.resultSummary,
        ...summary,
        dataStewardFindingsSynced: stewardship.persisted.syncedCount,
        highPriorityReviewItems: stewardship.report.summary.highPriorityReviewItems,
      },
    });
    await alertOnDailyReviewBacklog({
      job: updatedJob,
      needsReviewBacklogSize: stewardship.report.summary.highPriorityReviewItems,
    });

    return {
      job: updatedJob,
      result,
      stewardship: {
        syncedCount: stewardship.persisted.syncedCount,
        highPriorityReviewItems: stewardship.report.summary.highPriorityReviewItems,
      },
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const updatedJob = await updateRepository.updateScanJob(processingJob.id, {
      status: "failed",
      finishedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown scan job error.",
      resultSummary: {
        ...processingJob.resultSummary,
      },
    });

    throw Object.assign(
      new Error(updatedJob.errorMessage ?? "Scan job failed."),
      { job: updatedJob },
    );
  } finally {
    stopHeartbeat();
  }
}

async function getHealthyRunningScanJobs(options?: {
  staleAfterMs?: number;
  limit?: number;
}) {
  const jobs = await updateRepository.getScanJobs(
    options?.limit ?? DEFAULT_SCAN_JOB_FETCH_LIMIT,
  );
  const nowTimestamp = Date.now();
  const staleAfterMs = options?.staleAfterMs ?? DEFAULT_STALE_SCAN_JOB_AFTER_MS;

  return jobs
    .filter((job) => job.status === "running" && !job.finishedAt)
    .filter((job) => !isStaleRunningScanJob(job, nowTimestamp, staleAfterMs))
    .sort(sortJobsByCreatedAtAscending);
}

export async function queueScanJob(input: {
  sourceId?: string;
  trigger: ScanTrigger;
  requestedBy: string;
  scanProfile?: ScanProfileId;
}) {
  return updateRepository.createScanJob({
    sourceId: input.sourceId ?? null,
    trigger: input.trigger,
    requestedBy: input.requestedBy,
    status: "queued",
    startedAt: null,
    finishedAt: null,
    resultSummary: input.scanProfile ? { scanProfile: input.scanProfile } : {},
    errorMessage: null,
  });
}

export async function recoverStaleRunningScanJobs(options?: {
  now?: string;
  staleAfterMs?: number;
  limit?: number;
}) {
  const jobs = await updateRepository.getScanJobs(
    options?.limit ?? DEFAULT_SCAN_JOB_FETCH_LIMIT,
  );
  const nowTimestamp = toTimestamp(options?.now) ?? Date.now();
  const staleAfterMs = options?.staleAfterMs ?? DEFAULT_STALE_SCAN_JOB_AFTER_MS;
  const recoveredJobs: ScanJob[] = [];

  for (const job of jobs) {
    if (!isStaleRunningScanJob(job, nowTimestamp, staleAfterMs)) {
      continue;
    }

    recoveredJobs.push(
      await updateRepository.updateScanJob(job.id, {
        status: "failed",
        finishedAt: new Date(nowTimestamp).toISOString(),
        errorMessage:
          "Marked failed after exceeding the running-job timeout without completion.",
        resultSummary: {
          ...job.resultSummary,
          recoveredAsStale: true,
        },
      }),
    );
  }

  return recoveredJobs;
}

export async function processScanJob(jobId: string) {
  const job = await updateRepository.getScanJob(jobId);
  if (!job) {
    throw new Error(`Scan job ${jobId} not found.`);
  }
  if (job.status === "running" && !job.finishedAt) {
    throw Object.assign(
      new Error(`Scan job ${job.id} is already running and cannot be re-executed directly.`),
      {
        code: "scan_job_already_running" as const,
        job,
      },
    );
  }
  if (job.status !== "queued") {
    throw Object.assign(
      new Error(`Scan job ${job.id} is not queued and cannot be started again.`),
      {
        code: "scan_job_not_queueable" as const,
        job,
      },
    );
  }
  const claimedJob = await claimScanJobForProcessing(job.id);

  if (!claimedJob) {
    const current = await updateRepository.getScanJob(job.id);
    throw Object.assign(
      new Error(`Scan job ${job.id} could not be claimed for processing.`),
      {
        code: "scan_job_claim_failed" as const,
        job: current ?? job,
      },
    );
  }

  return executeClaimedScanJob(claimedJob);
}

export async function processNextQueuedScanJob(options?: {
  limit?: number;
  leaseOwner?: string;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
}) {
  const jobs = await updateRepository.getScanJobs(
    options?.limit ?? DEFAULT_SCAN_JOB_FETCH_LIMIT,
  );
  const queuedJobs = jobs
    .filter((job) => job.status === "queued")
    .sort(sortJobsByCreatedAtAscending);

  if (queuedJobs.length === 0) {
    return null;
  }

  for (const nextQueuedJob of queuedJobs) {
    try {
      const claimedJob = await claimScanJobForProcessing(nextQueuedJob.id, {
        leaseOwner: options?.leaseOwner,
        heartbeatIntervalMs: options?.heartbeatIntervalMs,
        heartbeatTimeoutMs: options?.heartbeatTimeoutMs,
      });

      if (!claimedJob) {
        continue;
      }

      return executeClaimedScanJob(claimedJob);
    } catch (error) {
      if (isClaimFailure(error)) {
        continue;
      }
      throw error;
    }
  }

  return null;
}

export async function queueAndRunScanJob(input: {
  sourceId?: string;
  trigger: ScanTrigger;
  requestedBy: string;
  scanProfile?: ScanProfileId;
}) {
  const drained = await queueAndDrainScanJob(input);
  return {
    job: drained.processedJob ?? drained.queuedJob,
    queuedJob: drained.queuedJob,
    queuedJobProcessedImmediately: drained.queuedJobProcessedImmediately,
    blockedByRunningJobs: drained.blockedByRunningJobs,
    blockingRunningJobSummaries: drained.blockingRunningJobSummaries,
    result: drained.result,
    stewardship: drained.stewardship,
  };
}

export async function queueAndDrainScanJob(
  input: QueueAndDrainScanJobInput,
): Promise<QueueScanJobDispatchResult> {
  await recoverStaleRunningScanJobs();
  const queuedJob = await queueScanJob(input);

  if (input.executionMode === "enqueue_only") {
    return {
      queuedJob,
      processedJob: null,
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [],
      stewardship: null,
    };
  }

  const blockingRunningJobs = await getHealthyRunningScanJobs();

  if (blockingRunningJobs.length > 0) {
    return {
      queuedJob,
      processedJob: null,
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: blockingRunningJobs.map((job) => job.id),
      blockingRunningJobSummaries: summarizeBlockingRunningJobs(
        blockingRunningJobs,
      ),
      result: [],
      stewardship: null,
    };
  }

  const processed = await processNextQueuedScanJob({
    leaseOwner: input.leaseOwner,
  });

  if (!processed) {
    return {
      queuedJob,
      processedJob: null,
      queuedJobProcessedImmediately: false,
      blockedByRunningJobs: [],
      blockingRunningJobSummaries: [],
      result: [],
      stewardship: null,
    };
  }

  return {
    queuedJob,
    processedJob: processed.job,
    queuedJobProcessedImmediately: processed.job.id === queuedJob.id,
    blockedByRunningJobs: [],
    blockingRunningJobSummaries: [],
    result: processed.result,
    stewardship: processed.stewardship,
  };
}

export async function drainQueuedScanJobs(options?: {
  maxJobs?: number;
  limitPerFetch?: number;
  continueOnError?: boolean;
  leaseOwner?: string;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
}) {
  await recoverStaleRunningScanJobs({
    limit: options?.limitPerFetch,
  });
  const blockingRunningJobs = await getHealthyRunningScanJobs({
    limit: options?.limitPerFetch,
  });

  if (blockingRunningJobs.length > 0) {
    return {
      attempted: 0,
      processedCount: 0,
      failedCount: 0,
      blockedByRunningJobs: blockingRunningJobs.map((job) => job.id),
      blockingRunningJobSummaries: summarizeBlockingRunningJobs(
        blockingRunningJobs,
      ),
      processedJobs: [],
      failures: [],
    };
  }

  const maxJobs = Math.max(0, options?.maxJobs ?? 1);
  const continueOnError = options?.continueOnError ?? false;
  const processedJobs: Array<{
    jobId: string;
    status: ScanJob["status"];
    resultCount: number;
  }> = [];
  const failures: Array<{
    jobId: string | null;
    errorMessage: string;
  }> = [];

  for (let index = 0; index < maxJobs; index += 1) {
    try {
      const processed = await processNextQueuedScanJob({
        limit: options?.limitPerFetch,
        leaseOwner: options?.leaseOwner ?? "queue-drain",
        heartbeatIntervalMs: options?.heartbeatIntervalMs,
        heartbeatTimeoutMs: options?.heartbeatTimeoutMs,
      });

      if (!processed) {
        break;
      }

      processedJobs.push({
        jobId: processed.job.id,
        status: processed.job.status,
        resultCount: processed.result.length,
      });
    } catch (error) {
      const failedJobId =
        error && typeof error === "object" && "job" in error
          ? ((error as { job?: { id?: string } }).job?.id ?? null)
          : null;

      failures.push({
        jobId: failedJobId,
        errorMessage:
          error instanceof Error ? error.message : "Unknown queue-drain error.",
      });

      if (!continueOnError) {
        break;
      }
    }
  }

  return {
    attempted: processedJobs.length + failures.length,
    processedCount: processedJobs.length,
    failedCount: failures.length,
    blockedByRunningJobs: [],
    blockingRunningJobSummaries: [],
    processedJobs,
    failures,
  };
}
