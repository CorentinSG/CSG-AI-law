import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { hostname } from "node:os";

import { drainQueuedScanJobs } from "@/agents/ai-regulation/processors/scanJobs";
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
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = createScanWorkerConfig(process.env);
  const startedAt = new Date().toISOString();
  let cycle = 0;
  let idleCycles = 0;
  let stopRequested = false;

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

  process.once("SIGINT", () => requestStop("SIGINT"));
  process.once("SIGTERM", () => requestStop("SIGTERM"));

  await acquireScanWorkerLease(config);
  await clearScanWorkerStopRequest(config);

  console.log(`[scan-worker] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[scan-worker] workerId=${config.workerId} AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} pollMs=${config.pollMs} maxJobsPerCycle=${config.maxJobsPerCycle} idleExitAfter=${config.idleExitAfter} continueOnError=${config.continueOnError} heartbeatIntervalMs=${config.heartbeatIntervalMs} heartbeatTimeoutMs=${config.heartbeatTimeoutMs} singletonStaleMs=${config.singletonStaleMs}`,
  );

  await writeStatus("starting");

  try {
    while (true) {
      cycle += 1;

      if (stopRequested || (await scanWorkerStopRequested(config))) {
        requestStop("stop-file-or-signal");
        await writeStatus("stopping");
        break;
      }

      await refreshScanWorkerLeaseHeartbeat(config);

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
  } catch (error) {
    await writeStatus("failed", {
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
