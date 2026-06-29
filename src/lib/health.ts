import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { AiRegulatoryUpdate, RegulationSource } from "@/agents/ai-regulation/types";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getRepositoryMode } from "@/db/repository";

export type HealthAccess = "public" | "authenticated";

export interface HealthSnapshot {
  ok: boolean;
  checkedAt: string;
  dataMode: string;
  database: {
    reachable: boolean;
    error: string | null;
  };
  scans: {
    newestSuccessfulScanAgeMs: number | null;
    newestSuccessfulScanAt: string | null;
    byProfile: Record<
      string,
      {
        newestSuccessfulScanAgeMs: number | null;
        newestSuccessfulScanAt: string | null;
      }
    >;
  };
  worker: {
    state: "active" | "idle" | "unknown";
    alive: boolean;
    heartbeatAgeMs: number | null;
    heartbeatAt: string | null;
    lastActivityAgeMs: number | null;
    lastActivityAt: string | null;
    runningJobs: number;
  };
  coverage: {
    state: "healthy" | "degraded";
    zeroSourceProfiles: string[];
  };
  review: {
    pendingNeedsReviewCount: number;
  };
  version: {
    appVersion: string;
    commit: string | null;
  };
  details?: {
    sourcesChecked: number;
    scanJobsChecked: number;
    needsReviewSampleSize: number;
    runningJobIds: string[];
  };
}

const MAX_RECENT_SOURCES = 500;
const MAX_RECENT_JOBS = 100;
const MAX_REVIEW_ITEMS = 500;
const RECENT_IDLE_WORKER_ACTIVITY_MS = 15 * 60 * 1000;
const DEFAULT_WORKER_HEARTBEAT_TIMEOUT_MS = 45_000;

function toTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function ageMs(value: string | null | undefined, now: number) {
  const timestamp = toTimestamp(value);
  return timestamp === null ? null : Math.max(0, now - timestamp);
}

function getScanProfile(job: ScanJob) {
  const value = job.resultSummary?.scanProfile;
  return typeof value === "string" && value.length > 0 ? value : "default";
}

function getExplicitScanProfile(job: ScanJob) {
  const value = job.resultSummary?.scanProfile;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getLeaseHeartbeatAt(job: ScanJob) {
  const value = job.resultSummary?.leaseHeartbeatAt;
  return typeof value === "string" ? value : null;
}

function getLeaseHeartbeatTimeoutMs(job: ScanJob) {
  const value = job.resultSummary?.leaseHeartbeatTimeoutMs;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_WORKER_HEARTBEAT_TIMEOUT_MS;
}

function getJobRecencyAnchor(job: ScanJob) {
  return job.finishedAt ?? job.updatedAt ?? job.createdAt ?? null;
}

function hasSummaryFlag(value: unknown, expected: string) {
  return Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry === expected);
}

function isZeroSourceProfileJob(job: ScanJob) {
  return (
    hasSummaryFlag(job.resultSummary?.configurationWarnings, "scan_profile_resolved_zero_sources") ||
    hasSummaryFlag(job.resultSummary?.failureReasons, "scan_profile_resolved_zero_sources")
  );
}

function getRunningWorkerActivityAt(job: ScanJob, now: number) {
  const heartbeatAt = getLeaseHeartbeatAt(job);
  const heartbeatAgeMs = ageMs(heartbeatAt, now);
  if (heartbeatAgeMs !== null && heartbeatAgeMs <= getLeaseHeartbeatTimeoutMs(job)) {
    return heartbeatAt;
  }

  const startedAt = job.startedAt;
  const startedAgeMs = ageMs(startedAt, now);
  if (startedAgeMs !== null && startedAgeMs <= getLeaseHeartbeatTimeoutMs(job)) {
    return startedAt;
  }

  return null;
}

function findNewestIso(values: Array<string | null | undefined>) {
  let newest: string | null = null;
  let newestTimestamp = -Infinity;
  for (const value of values) {
    const timestamp = toTimestamp(value);
    if (timestamp !== null && timestamp > newestTimestamp) {
      newest = value ?? null;
      newestTimestamp = timestamp;
    }
  }
  return newest;
}

function countNeedsReview(updates: AiRegulatoryUpdate[]) {
  return updates.filter((update) => update.status === "needs_review").length;
}

function getAppVersion() {
  return process.env.npm_package_version ?? "0.1.0";
}

function getCommitSha() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.COMMIT_SHA ??
    null
  );
}

function buildScanSummary(sources: RegulationSource[], jobs: ScanJob[], now: number) {
  const successfulSourceScans = sources.map((source) => source.lastSuccessfulScanAt);
  const successfulJobFinishes = jobs
    .filter((job) => job.status === "succeeded")
    .map((job) => job.finishedAt);
  const newestSuccessfulScanAt = findNewestIso([
    ...successfulSourceScans,
    ...successfulJobFinishes,
  ]);

  const byProfile: HealthSnapshot["scans"]["byProfile"] = {};
  for (const job of jobs) {
    if (job.status !== "succeeded") continue;
    const profile = getScanProfile(job);
    const existing = byProfile[profile]?.newestSuccessfulScanAt ?? null;
    const newest = findNewestIso([existing, job.finishedAt]);
    byProfile[profile] = {
      newestSuccessfulScanAt: newest,
      newestSuccessfulScanAgeMs: ageMs(newest, now),
    };
  }

  return {
    newestSuccessfulScanAgeMs: ageMs(newestSuccessfulScanAt, now),
    newestSuccessfulScanAt,
    byProfile,
  };
}

function buildWorkerSummary(jobs: ScanJob[], now: number) {
  const runningJobs = jobs.filter((job) => job.status === "running");
  const heartbeatAt = findNewestIso(runningJobs.map(getLeaseHeartbeatAt));
  const activeRunningActivityAt = findNewestIso(
    runningJobs.map((job) => getRunningWorkerActivityAt(job, now)),
  );
  const finishedActivityAt = findNewestIso(
    jobs
      .filter((job) => job.status !== "running")
      .map((job) => job.finishedAt),
  );
  const lastActivityAt = findNewestIso([activeRunningActivityAt, finishedActivityAt]);
  const lastActivityAgeMs = ageMs(lastActivityAt, now);
  const state: HealthSnapshot["worker"]["state"] =
    activeRunningActivityAt
      ? "active"
      : lastActivityAt
        ? "idle"
        : "unknown";
  return {
    state,
    alive:
      state === "active" ||
      (state === "idle" &&
        lastActivityAgeMs !== null &&
        lastActivityAgeMs <= RECENT_IDLE_WORKER_ACTIVITY_MS),
    heartbeatAgeMs: ageMs(heartbeatAt, now),
    heartbeatAt,
    lastActivityAgeMs,
    lastActivityAt,
    runningJobs: runningJobs.length,
  };
}

function buildCoverageSummary(jobs: ScanJob[]): HealthSnapshot["coverage"] {
  const newestJobByProfile = new Map<string, ScanJob>();

  for (const job of jobs) {
    if (job.status !== "succeeded" && job.status !== "partial_success") {
      continue;
    }

    const profile = getExplicitScanProfile(job);
    if (!profile) {
      continue;
    }
    const existing = newestJobByProfile.get(profile);
    const currentTimestamp = toTimestamp(getJobRecencyAnchor(job)) ?? -Infinity;
    const existingTimestamp = existing
      ? (toTimestamp(getJobRecencyAnchor(existing)) ?? -Infinity)
      : -Infinity;

    if (!existing || currentTimestamp >= existingTimestamp) {
      newestJobByProfile.set(profile, job);
    }
  }

  const zeroSourceProfiles = Array.from(newestJobByProfile.entries())
    .filter(([, job]) => isZeroSourceProfileJob(job))
    .map(([profile]) => profile)
    .sort();

  return {
    state: zeroSourceProfiles.length > 0 ? "degraded" : "healthy",
    zeroSourceProfiles,
  };
}

function toPublicSnapshot(snapshot: HealthSnapshot): HealthSnapshot {
  return {
    ...snapshot,
    details: undefined,
    scans: {
      ...snapshot.scans,
      byProfile: Object.fromEntries(
        Object.entries(snapshot.scans.byProfile).map(([profile, value]) => [
          profile,
          {
            newestSuccessfulScanAgeMs: value.newestSuccessfulScanAgeMs,
            newestSuccessfulScanAt: value.newestSuccessfulScanAt,
          },
        ]),
      ),
    },
  };
}

export async function buildHealthSnapshot(options?: {
  access?: HealthAccess;
  now?: Date;
}): Promise<HealthSnapshot> {
  const access = options?.access ?? "public";
  const checkedAt = (options?.now ?? new Date()).toISOString();
  const now = Date.parse(checkedAt);
  const dataMode = getRepositoryMode();

  try {
    const [sources, jobs, needsReviewPage] = await Promise.all([
      updateRepository.getSources(),
      updateRepository.getScanJobs(MAX_RECENT_JOBS),
      updateRepository.listUpdatesPage(
        { status: "needs_review" },
        { limit: MAX_REVIEW_ITEMS, offset: 0 },
      ),
    ]);

    const worker = buildWorkerSummary(jobs, now);
    const coverage = buildCoverageSummary(jobs);
    const snapshot: HealthSnapshot = {
      ok: coverage.state === "healthy",
      checkedAt,
      dataMode,
      database: {
        reachable: true,
        error: null,
      },
      scans: buildScanSummary(sources.slice(0, MAX_RECENT_SOURCES), jobs, now),
      worker,
      coverage,
      review: {
        pendingNeedsReviewCount:
          typeof needsReviewPage.total === "number"
            ? needsReviewPage.total
            : countNeedsReview(needsReviewPage.items),
      },
      version: {
        appVersion: getAppVersion(),
        commit: getCommitSha(),
      },
      details:
        access === "authenticated"
          ? {
              sourcesChecked: Math.min(sources.length, MAX_RECENT_SOURCES),
              scanJobsChecked: jobs.length,
              needsReviewSampleSize: needsReviewPage.items.length,
              runningJobIds: jobs
                .filter((job) => job.status === "running")
                .map((job) => job.id),
            }
          : undefined,
    };

    return access === "authenticated" ? snapshot : toPublicSnapshot(snapshot);
  } catch (error) {
    const snapshot: HealthSnapshot = {
      ok: false,
      checkedAt,
      dataMode,
      database: {
        reachable: false,
        error: error instanceof Error ? error.message : "Unknown health check error.",
      },
      scans: {
        newestSuccessfulScanAgeMs: null,
        newestSuccessfulScanAt: null,
        byProfile: {},
      },
      worker: {
        state: "unknown",
        alive: false,
        heartbeatAgeMs: null,
        heartbeatAt: null,
        lastActivityAgeMs: null,
        lastActivityAt: null,
        runningJobs: 0,
      },
      coverage: {
        state: "degraded",
        zeroSourceProfiles: [],
      },
      review: {
        pendingNeedsReviewCount: 0,
      },
      version: {
        appVersion: getAppVersion(),
        commit: getCommitSha(),
      },
      details:
        access === "authenticated"
          ? {
              sourcesChecked: 0,
              scanJobsChecked: 0,
              needsReviewSampleSize: 0,
              runningJobIds: [],
            }
          : undefined,
    };

    return access === "authenticated" ? snapshot : toPublicSnapshot(snapshot);
  }
}
