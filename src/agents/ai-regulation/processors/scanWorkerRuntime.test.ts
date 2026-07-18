import { mkdtemp, readFile, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  acquireScanWorkerLease,
  clearScanWorkerStopRequest,
  createScanWorkerConfig,
  refreshScanWorkerLeaseHeartbeat,
  releaseScanWorkerLease,
  requestScanWorkerStop,
  scanWorkerStopRequested,
  writeScanWorkerStatus,
  type ScanWorkerStatus,
} from "@/agents/ai-regulation/processors/scanWorkerRuntime";

const tempDirs: string[] = [];

describe("scanWorkerRuntime", () => {
  afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
      await import("node:fs/promises").then(({ rm }) =>
        rm(dir, { recursive: true, force: true }),
      );
    }
  });

  it("creates a config with deterministic state paths", () => {
    const config = createScanWorkerConfig(
      {
        SCAN_JOB_WORKER_STATE_DIR: ".runtime/custom-worker",
        SCAN_JOB_WORKER_HEARTBEAT_INTERVAL_MS: "15",
        SCAN_JOB_WORKER_HEARTBEAT_TIMEOUT_MS: "50",
      } as unknown as NodeJS.ProcessEnv,
      "C:\\repo",
      42,
    );

    expect(config.workerId).toBe("local-worker-42");
    expect(config.heartbeatIntervalMs).toBe(15);
    expect(config.heartbeatTimeoutMs).toBe(50);
    expect(config.schedulerEnabled).toBe(true);
    expect(config.schedulerIntervalMs).toBe(15 * 60 * 1000);
    expect(config.stateDir).toContain(path.join(".runtime", "custom-worker"));
    expect(config.leaseFilePath).toContain("worker-lease.json");
    expect(config.statusFilePath).toContain("worker-status.json");
    expect(config.stopFilePath).toContain("worker-stop");
  });

  it("allows the worker self-scheduler to be tuned or disabled from env", () => {
    const config = createScanWorkerConfig(
      {
        SCAN_JOB_WORKER_ENABLE_SCHEDULER: "false",
        SCAN_JOB_WORKER_SCHEDULER_INTERVAL_MS: "60000",
      } as unknown as NodeJS.ProcessEnv,
      "C:\\repo",
      42,
    );

    expect(config.schedulerEnabled).toBe(false);
    expect(config.schedulerIntervalMs).toBe(60_000);
  });

  it("refuses a second fresh worker lease but allows takeover after stale state", async () => {
    const stateDir = await mkdtemp(path.join(os.tmpdir(), "scan-worker-runtime-"));
    tempDirs.push(stateDir);

    const configA = createScanWorkerConfig(
      {
        SCAN_JOB_WORKER_STATE_DIR: stateDir,
        SCAN_JOB_WORKER_SINGLETON_STALE_MS: "1000",
      } as unknown as NodeJS.ProcessEnv,
      process.cwd(),
      100,
    );
    const configB = createScanWorkerConfig(
      {
        SCAN_JOB_WORKER_STATE_DIR: stateDir,
        SCAN_JOB_WORKER_SINGLETON_STALE_MS: "3",
        SCAN_JOB_WORKER_HEARTBEAT_INTERVAL_MS: "1",
        SCAN_JOB_WORKER_HEARTBEAT_TIMEOUT_MS: "2",
      } as unknown as NodeJS.ProcessEnv,
      process.cwd(),
      200,
    );

    await acquireScanWorkerLease(configA);
    await writeScanWorkerStatus(configA, {
      state: "running",
      workerId: configA.workerId,
      pid: 100,
      hostname: "test-host",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cycle: 1,
      idleCycles: 0,
      stopRequested: false,
    } satisfies ScanWorkerStatus);

    await expect(acquireScanWorkerLease(configA)).rejects.toMatchObject({
      code: "scan_worker_active_lease",
    });

    const staleStatus = {
      state: "running",
      workerId: configA.workerId,
      pid: 100,
      hostname: "test-host",
      startedAt: new Date(Date.now() - 10_000).toISOString(),
      updatedAt: new Date(Date.now() - 10_000).toISOString(),
      cycle: 2,
      idleCycles: 0,
      stopRequested: false,
    } satisfies ScanWorkerStatus;
    await writeScanWorkerStatus(configA, staleStatus);
    const leaseContent = JSON.parse(await readFile(configA.leaseFilePath, "utf8")) as {
      workerId: string;
      pid: number;
      hostname: string;
      acquiredAt: string;
      heartbeatAt: string;
    };
    leaseContent.heartbeatAt = new Date(Date.now() - 10_000).toISOString();
    await writeFile(configA.leaseFilePath, `${JSON.stringify(leaseContent, null, 2)}\n`, "utf8");
    const staleDate = new Date(Date.now() - 10_000);
    await utimes(configA.leaseFilePath, staleDate, staleDate);

    const newLease = await acquireScanWorkerLease(configB);
    expect(newLease.workerId).toBe(configB.workerId);
  });

  it("supports stop requests and heartbeat refresh", async () => {
    const stateDir = await mkdtemp(path.join(os.tmpdir(), "scan-worker-runtime-"));
    tempDirs.push(stateDir);

    const config = createScanWorkerConfig(
      {
        SCAN_JOB_WORKER_STATE_DIR: stateDir,
      } as unknown as NodeJS.ProcessEnv,
      process.cwd(),
      321,
    );

    await acquireScanWorkerLease(config);
    const refreshed = await refreshScanWorkerLeaseHeartbeat(config);
    expect(refreshed?.workerId).toBe(config.workerId);

    expect(await scanWorkerStopRequested(config)).toBe(false);
    await requestScanWorkerStop(config);
    expect(await scanWorkerStopRequested(config)).toBe(true);
    await clearScanWorkerStopRequest(config);
    expect(await scanWorkerStopRequested(config)).toBe(false);

    await releaseScanWorkerLease(config);
  });
});
