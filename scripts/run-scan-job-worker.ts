import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { hostname } from "node:os";

import { enqueueCentralMonitoringSchedule } from "@/agents/ai-regulation/scheduler";
import { drainQueuedScanJobs } from "@/agents/ai-regulation/processors/scanJobs";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  acquireScanWorkerLease,
  clearScanWorkerStopRequest,
  createScanWorkerConfig,
  refreshScanWorkerLeaseHeartbeat,
  releaseScanWorkerLease,
  scanWorkerStopRequested,
  writeScanWorkerStatus,
  type ScanWorkerStatus,
} from "@/agents/ai-regulation/processors/scanWorkerRuntime";
import type { ScanJob } from "@/agents/ai-regulation/governance";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

const WORKER_HEARTBEAT_TRIGGER = "worker_heartbeat";
// Hard safety floor for the live cadence. The effective live interval comes
// from SCAN_JOB_WORKER_SCHEDULER_INTERVAL_MS (default 15 min in
// createScanWorkerConfig); operators can lower it down to this floor for
// near-real-time monitoring without being silently clamped back to 15 min.
const LIVE_SCHEDULER_INTERVAL_FLOOR_MS = 5 * 60 * 1000;
const HOURLY_SCHEDULER_INTERVAL_MS = 60 * 60 * 1000;
const DAILY_SCHEDULER_INTERVAL_MS = 24 * 60 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = createScanWorkerConfig(process.env);
  const startedAt = new Date().toISOString();
  let cycle = 0;
  let idleCycles = 0;
  let stopRequested = false;
  let heartbeatJob: ScanJob | null = null;
  const lastSchedulerRunAtByCadence = new Map<string, number>();
  let lastSchedulerSummary: Record<string, unknown> | null = null;

  const writeStatus = async (
    state: ScanWorkerStatus["state"],
    extras?: Partial<ScanWorkerStatus>,
  ) => {
    await writeScanWorkerStatus(config, {
      state,
      workerId: config.workerId,
      pid: process.pid,
      hostname: hostname(),
      startedAt,
      updatedAt: new Date().toISOString(),
      cycle,
      idleCycles,
      stopRequested,
      lastError: null,
      ...extras,
    });
  };

  const requestStop = (reason: string) => {
    if (!stopRequested) {
      stopRequested = true;
      console.log(`[scan-worker] graceful stop requested (${reason})`);
    }
  };

  const writePersistentHeartbeat = async (
    state: ScanWorkerStatus["state"] | "completed",
    extras?: Record<string, unknown>,
  ) => {
    const heartbeatAt = new Date().toISOString();
    const resultSummary = {
      workerHeartbeatAt: heartbeatAt,
      workerHeartbeatTimeoutMs: Math.max(
        config.pollMs + config.heartbeatTimeoutMs,
        config.pollMs * 2,
      ),
      workerMode: config.workerMode,
      workerExpectedIntervalMs: config.expectedIntervalMs,
      workerId: config.workerId,
      hostname: hostname(),
      pid: process.pid,
      state,
      cycle,
      idleCycles,
      startedAt,
      dataMode: getRepositoryMode(),
      aiEnabled: env.AI_ENABLE_PROCESSING,
      ...extras,
    };

    if (heartbeatJob) {
      heartbeatJob = await updateRepository.updateScanJob(heartbeatJob.id, {
        status: "succeeded",
        startedAt,
        finishedAt: heartbeatAt,
        errorMessage: null,
        resultSummary,
      });
      return heartbeatJob;
    }

    heartbeatJob = await updateRepository.createScanJob({
      sourceId: null,
      trigger: WORKER_HEARTBEAT_TRIGGER,
      requestedBy: config.workerId,
      status: "succeeded",
      startedAt,
      finishedAt: heartbeatAt,
      resultSummary,
      errorMessage: null,
    });
    return heartbeatJob;
  };

  process.once("SIGINT", () => requestStop("SIGINT"));
  process.once("SIGTERM", () => requestStop("SIGTERM"));

  await acquireScanWorkerLease(config);
  await clearScanWorkerStopRequest(config);

  console.log(`[scan-worker] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[scan-worker] workerId=${config.workerId} AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} pollMs=${config.pollMs} maxJobsPerCycle=${config.maxJobsPerCycle} idleExitAfter=${config.idleExitAfter} continueOnError=${config.continueOnError} schedulerEnabled=${config.schedulerEnabled} schedulerIntervalMs=${config.schedulerIntervalMs} heartbeatIntervalMs=${config.heartbeatIntervalMs} heartbeatTimeoutMs=${config.heartbeatTimeoutMs} singletonStaleMs=${config.singletonStaleMs}`,
  );

  await writeStatus("starting");
  await writePersistentHeartbeat("starting");

  try {
    while (true) {
      cycle += 1;

      if (stopRequested || (await scanWorkerStopRequested(config))) {
        requestStop("stop-file-or-signal");
        await writeStatus("stopping");
        break;
      }

      await refreshScanWorkerLeaseHeartbeat(config);

      if (config.schedulerEnabled) {
        const now = Date.now();
        const cadenceRuns = [
          {
            cadence: "live" as const,
            intervalMs: Math.max(config.schedulerIntervalMs, LIVE_SCHEDULER_INTERVAL_FLOOR_MS),
          },
          { cadence: "hourly" as const, intervalMs: HOURLY_SCHEDULER_INTERVAL_MS },
          { cadence: "daily" as const, intervalMs: DAILY_SCHEDULER_INTERVAL_MS },
        ];

        for (const cadenceRun of cadenceRuns) {
          const lastRunAt = lastSchedulerRunAtByCadence.get(cadenceRun.cadence) ?? 0;
          if (now - lastRunAt < cadenceRun.intervalMs) {
            continue;
          }

          lastSchedulerRunAtByCadence.set(cadenceRun.cadence, now);
          try {
            const schedulerResult = await enqueueCentralMonitoringSchedule({
              trigger: "scheduled",
              requestedBy: `${config.workerId}:self-scheduler`,
              cadences: [cadenceRun.cadence],
              dedupeWindowMs: cadenceRun.intervalMs,
            });
            lastSchedulerSummary = {
              cadence: cadenceRun.cadence,
              queuedJobCount: schedulerResult.queuedJobCount,
              skippedJobCount: schedulerResult.skippedJobCount,
              totalPlanItems: schedulerResult.plan.items.length,
            };
            console.log(
              `[scan-worker] self-scheduler cadence=${cadenceRun.cadence} queued=${schedulerResult.queuedJobCount} skipped=${schedulerResult.skippedJobCount}`,
            );
          } catch (error) {
            lastSchedulerSummary = {
              cadence: cadenceRun.cadence,
              error: error instanceof Error ? error.message : "Unknown scheduler error",
            };
            console.error(
              `[scan-worker] self-scheduler cadence=${cadenceRun.cadence} failed: ${
                error instanceof Error ? error.message : "Unknown scheduler error"
              }`,
            );
          }
        }
      }

      const summary = await drainQueuedScanJobs({
        maxJobs: config.maxJobsPerCycle,
        continueOnError: config.continueOnError,
        leaseOwner: "local-worker",
        heartbeatIntervalMs: config.heartbeatIntervalMs,
        heartbeatTimeoutMs: config.heartbeatTimeoutMs,
      });

      console.log(
        JSON.stringify(
          {
            ok: true,
            cycle,
            workerId: config.workerId,
            dataMode: getRepositoryMode(),
            aiEnabled: env.AI_ENABLE_PROCESSING,
            summary,
          },
          null,
          2,
        ),
      );

      const didWork =
        summary.processedCount > 0 ||
        summary.failedCount > 0 ||
        summary.blockedByRunningJobs.length > 0;

      if (didWork) {
        idleCycles = 0;
      } else {
        idleCycles += 1;
      }

      await writeStatus(didWork ? "running" : "idle", {
        lastSummary: summary as Record<string, unknown>,
        ...(lastSchedulerSummary ? { schedulerSummary: lastSchedulerSummary } : {}),
      });
      await writePersistentHeartbeat(didWork ? "running" : "idle", {
        lastSummary: summary as Record<string, unknown>,
        ...(lastSchedulerSummary ? { schedulerSummary: lastSchedulerSummary } : {}),
      });

      if (config.idleExitAfter > 0 && idleCycles >= config.idleExitAfter) {
        console.log(
          `[scan-worker] exiting after ${idleCycles} idle cycle(s) with no queued work.`,
        );
        break;
      }

      if (stopRequested) {
        await writeStatus("stopping");
        break;
      }

      await sleep(config.pollMs);
    }

    await writeStatus("stopped");
    await writePersistentHeartbeat(
      config.workerMode === "scheduled" ? "completed" : "stopped",
    );
  } catch (error) {
    await writeStatus("failed", {
      lastError: error instanceof Error ? error.message : "Unknown error",
    });
    await writePersistentHeartbeat("failed", {
      lastError: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  } finally {
    await releaseScanWorkerLease(config);
    await clearScanWorkerStopRequest(config);
  }
}

main().catch((error) => {
  console.error(
    `[scan-worker] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
