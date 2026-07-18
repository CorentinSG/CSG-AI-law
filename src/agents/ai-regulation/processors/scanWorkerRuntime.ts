import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import path from "node:path";

function parseNonNegativeInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export type ScanWorkerConfig = {
  pollMs: number;
  maxJobsPerCycle: number;
  idleExitAfter: number;
  continueOnError: boolean;
  schedulerEnabled: boolean;
  schedulerIntervalMs: number;
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  singletonStaleMs: number;
  stateDir: string;
  leaseFilePath: string;
  statusFilePath: string;
  stopFilePath: string;
  workerId: string;
};

export type ScanWorkerLeaseRecord = {
  workerId: string;
  pid: number;
  hostname: string;
  acquiredAt: string;
  heartbeatAt: string;
};

export type ScanWorkerStatus = {
  state:
    | "starting"
    | "running"
    | "idle"
    | "blocked"
    | "stopping"
    | "stopped"
    | "failed";
  workerId: string;
  pid: number;
  hostname: string;
  startedAt: string;
  updatedAt: string;
  cycle: number;
  idleCycles: number;
  stopRequested: boolean;
  lastSummary?: Record<string, unknown>;
  lastError?: string | null;
};

export function createScanWorkerConfig(
  env: NodeJS.ProcessEnv,
  cwd = process.cwd(),
  pid = process.pid,
): ScanWorkerConfig {
  const pollMs = parseNonNegativeInt(env.SCAN_JOB_WORKER_POLL_MS, 30_000);
  const heartbeatIntervalMs = Math.max(
    1,
    parseNonNegativeInt(env.SCAN_JOB_WORKER_HEARTBEAT_INTERVAL_MS, 10_000),
  );
  const heartbeatTimeoutMs = Math.max(
    heartbeatIntervalMs + 1,
    parseNonNegativeInt(env.SCAN_JOB_WORKER_HEARTBEAT_TIMEOUT_MS, 45_000),
  );
  const stateDir = env.SCAN_JOB_WORKER_STATE_DIR
    ? path.resolve(cwd, env.SCAN_JOB_WORKER_STATE_DIR)
    : path.resolve(cwd, ".runtime", "scan-worker");
  const singletonStaleMs = Math.max(
    heartbeatTimeoutMs * 3,
    parseNonNegativeInt(
      env.SCAN_JOB_WORKER_SINGLETON_STALE_MS,
      Math.max(120_000, heartbeatTimeoutMs * 3),
    ),
  );

  return {
    pollMs,
    maxJobsPerCycle: Math.max(
      1,
      parseNonNegativeInt(env.SCAN_JOB_WORKER_MAX_JOBS_PER_CYCLE, 5),
    ),
    idleExitAfter: parseNonNegativeInt(env.SCAN_JOB_WORKER_IDLE_EXIT_AFTER, 0),
    continueOnError: env.SCAN_JOB_WORKER_CONTINUE_ON_ERROR !== "false",
    schedulerEnabled: env.SCAN_JOB_WORKER_ENABLE_SCHEDULER !== "false",
    schedulerIntervalMs: Math.max(
      60_000,
      parseNonNegativeInt(
        env.SCAN_JOB_WORKER_SCHEDULER_INTERVAL_MS,
        15 * 60 * 1000,
      ),
    ),
    heartbeatIntervalMs,
    heartbeatTimeoutMs,
    singletonStaleMs,
    stateDir,
    leaseFilePath: path.join(stateDir, "worker-lease.json"),
    statusFilePath: path.join(stateDir, "worker-status.json"),
    stopFilePath: path.join(stateDir, "worker-stop"),
    workerId: env.SCAN_JOB_WORKER_ID?.trim() || `local-worker-${pid}`,
  };
}

async function ensureStateDir(stateDir: string) {
  await mkdir(stateDir, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function getFileAgeMs(filePath: string, now = Date.now()) {
  try {
    const fileStat = await stat(filePath);
    return Math.max(0, now - fileStat.mtimeMs);
  } catch {
    return null;
  }
}

export async function acquireScanWorkerLease(config: ScanWorkerConfig) {
  await ensureStateDir(config.stateDir);
  const now = new Date().toISOString();
  const existingLease = await readJsonFile<ScanWorkerLeaseRecord>(config.leaseFilePath);
  const existingStatus = await readJsonFile<ScanWorkerStatus>(config.statusFilePath);

  if (existingLease) {
    const heartbeatAgeFromLease = await getFileAgeMs(config.leaseFilePath);
    const statusHeartbeatAge =
      existingStatus?.updatedAt != null
        ? Math.max(0, Date.now() - Date.parse(existingStatus.updatedAt))
        : null;
    const freshestAge = [heartbeatAgeFromLease, statusHeartbeatAge]
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => a - b)[0];

    if (typeof freshestAge === "number" && freshestAge < config.singletonStaleMs) {
      throw Object.assign(
        new Error(
          `Another scan worker lease is still active (${existingLease.workerId}).`,
        ),
        {
          code: "scan_worker_active_lease" as const,
          lease: existingLease,
          status: existingStatus,
        },
      );
    }
  }

  const lease: ScanWorkerLeaseRecord = {
    workerId: config.workerId,
    pid: process.pid,
    hostname: hostname(),
    acquiredAt: now,
    heartbeatAt: now,
  };
  await writeJsonFile(config.leaseFilePath, lease);
  return lease;
}

export async function refreshScanWorkerLeaseHeartbeat(config: ScanWorkerConfig) {
  const existingLease = await readJsonFile<ScanWorkerLeaseRecord>(config.leaseFilePath);
  if (!existingLease || existingLease.workerId !== config.workerId) {
    return null;
  }
  const nextLease = {
    ...existingLease,
    heartbeatAt: new Date().toISOString(),
  };
  await writeJsonFile(config.leaseFilePath, nextLease);
  return nextLease;
}

export async function writeScanWorkerStatus(
  config: ScanWorkerConfig,
  status: ScanWorkerStatus,
) {
  await ensureStateDir(config.stateDir);
  await writeJsonFile(config.statusFilePath, status);
}

export async function requestScanWorkerStop(config: ScanWorkerConfig) {
  await ensureStateDir(config.stateDir);
  await writeFile(config.stopFilePath, `${new Date().toISOString()}\n`, "utf8");
}

export async function scanWorkerStopRequested(config: ScanWorkerConfig) {
  try {
    await stat(config.stopFilePath);
    return true;
  } catch {
    return false;
  }
}

export async function clearScanWorkerStopRequest(config: ScanWorkerConfig) {
  await rm(config.stopFilePath, { force: true });
}

export async function releaseScanWorkerLease(config: ScanWorkerConfig) {
  await rm(config.leaseFilePath, { force: true });
}
