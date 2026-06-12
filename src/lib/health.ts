import packageJson from "../../package.json";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getRepositoryMode } from "@/db/repository";

type HealthVisibility = "public" | "private";

type SuccessfulScanSummary = {
  latestSuccessfulScanAt: string | null;
  latestSuccessfulScanAgeMs: number | null;
};

type WorkerHeartbeatSummary = {
  available: boolean;
  heartbeatAt: string | null;
  heartbeatAgeMs: number | null;
  leaseOwner: string | null;
  jobId: string | null;
};

export type HealthResponse = {
  ok: boolean;
  checkedAt: string;
  visibility: HealthVisibility;
  dataMode: string;
  db: {
    reachable: boolean;
  };
  scans: SuccessfulScanSummary & {
    byProfileFamily?: Record<string, SuccessfulScanSummary>;
  };
  worker: WorkerHeartbeatSummary;
  reviewBacklog: {
    needsReviewCount: number | null;
  };
  app: {
    version: string;
    commit: string | null;
  };
  errors?: string[];
};

function toTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function ageMs(value: string | null, nowMs: number) {
  const timestamp = toTimestamp(value);
  return timestamp === null ? null : Math.max(0, nowMs - timestamp);
}

function getScanProfileFamily(errors: string[]) {
  const marker = errors.find((entry) => entry.startsWith("scan_profile="));
  return marker?.slice("scan_profile=".length) || "default";
}

function getLatestSuccessfulScan(logs: Awaited<ReturnType<typeof updateRepository.getScanLogs>>) {
  return logs
    .filter((log) => log.sourceId !== "ops-alerting")
    .filter((log) => log.status === "success" || log.status === "partial_success")
    .sort((a, b) => b.scanFinishedAt.localeCompare(a.scanFinishedAt))[0] ?? null;
}

function summarizeSuccessfulScan(
  logs: Awaited<ReturnType<typeof updateRepository.getScanLogs>>,
  nowMs: number,
): SuccessfulScanSummary {
  const latest = getLatestSuccessfulScan(logs);
  const latestSuccessfulScanAt = latest?.scanFinishedAt ?? null;
  return {
    latestSuccessfulScanAt,
    latestSuccessfulScanAgeMs: ageMs(latestSuccessfulScanAt, nowMs),
  };
}

function summarizeByProfileFamily(
  logs: Awaited<ReturnType<typeof updateRepository.getScanLogs>>,
  nowMs: number,
) {
  const grouped = new Map<string, typeof logs>();
  for (const log of logs) {
    const profile = getScanProfileFamily(log.errors);
    grouped.set(profile, [...(grouped.get(profile) ?? []), log]);
  }

  return Object.fromEntries(
    [...grouped.entries()].map(([profile, profileLogs]) => [
      profile,
      summarizeSuccessfulScan(profileLogs, nowMs),
    ]),
  );
}

function summarizeWorkerHeartbeat(
  jobs: Awaited<ReturnType<typeof updateRepository.getScanJobs>>,
  nowMs: number,
): WorkerHeartbeatSummary {
  const jobsWithHeartbeat = jobs
    .map((job) => {
      const heartbeatAt =
        typeof job.resultSummary?.leaseHeartbeatAt === "string"
          ? job.resultSummary.leaseHeartbeatAt
          : null;
      return { job, heartbeatAt, timestamp: toTimestamp(heartbeatAt) };
    })
    .filter((entry): entry is typeof entry & { heartbeatAt: string; timestamp: number } =>
      typeof entry.heartbeatAt === "string" && typeof entry.timestamp === "number",
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const latest = jobsWithHeartbeat[0];
  if (!latest) {
    return {
      available: false,
      heartbeatAt: null,
      heartbeatAgeMs: null,
      leaseOwner: null,
      jobId: null,
    };
  }

  return {
    available: true,
    heartbeatAt: latest.heartbeatAt,
    heartbeatAgeMs: ageMs(latest.heartbeatAt, nowMs),
    leaseOwner:
      typeof latest.job.resultSummary?.leaseOwner === "string"
        ? latest.job.resultSummary.leaseOwner
        : null,
    jobId: latest.job.id,
  };
}

function getAppCommit(rawEnv: NodeJS.ProcessEnv = process.env) {
  return (
    rawEnv.VERCEL_GIT_COMMIT_SHA ??
    rawEnv.GIT_COMMIT_SHA ??
    rawEnv.COMMIT_SHA ??
    null
  );
}

export async function buildHealthResponse(options?: {
  visibility?: HealthVisibility;
  now?: Date;
  rawEnv?: NodeJS.ProcessEnv;
}): Promise<HealthResponse> {
  const visibility = options?.visibility ?? "public";
  const checkedAtDate = options?.now ?? new Date();
  const checkedAt = checkedAtDate.toISOString();
  const nowMs = checkedAtDate.getTime();
  const errors: string[] = [];

  let scanLogs: Awaited<ReturnType<typeof updateRepository.getScanLogs>> = [];
  let scanJobs: Awaited<ReturnType<typeof updateRepository.getScanJobs>> = [];
  let needsReviewCount: number | null = null;
  let dbReachable = true;

  try {
    const [logs, jobs, updatesPage] = await Promise.all([
      updateRepository.getScanLogs(500),
      updateRepository.getScanJobs(100),
      updateRepository.listUpdatesPage({ status: "needs_review" }, { limit: 1, offset: 0 }),
    ]);
    scanLogs = logs;
    scanJobs = jobs;
    needsReviewCount = updatesPage.total;
  } catch (error) {
    dbReachable = false;
    errors.push(error instanceof Error ? error.message : "Unknown health repository error.");
  }

  const scans = summarizeSuccessfulScan(scanLogs, nowMs);
  const worker = summarizeWorkerHeartbeat(scanJobs, nowMs);
  const detailedScanData =
    visibility === "private"
      ? { byProfileFamily: summarizeByProfileFamily(scanLogs, nowMs) }
      : {};

  return {
    ok: dbReachable,
    checkedAt,
    visibility,
    dataMode: getRepositoryMode(),
    db: {
      reachable: dbReachable,
    },
    scans: {
      ...scans,
      ...detailedScanData,
    },
    worker,
    reviewBacklog: {
      needsReviewCount: visibility === "private" ? needsReviewCount : null,
    },
    app: {
      version: packageJson.version,
      commit: getAppCommit(options?.rawEnv),
    },
    ...(errors.length > 0 && visibility === "private" ? { errors } : {}),
  };
}
