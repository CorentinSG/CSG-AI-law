import type { ScanJob } from "@/agents/ai-regulation/governance";

/**
 * Operational status helpers for the admin dashboard (pure — no I/O).
 *
 * On Vercel there is no long-running worker process to read a status file from,
 * so the worker's health is INFERRED from recent scan-job state in the DB:
 *   - broken  : a running job has exceeded the stale threshold (stuck/abandoned),
 *               or jobs are queued with nothing running (queue not draining)
 *   - active  : a job is currently running within the fresh window
 *   - backlog : jobs are queued and one is running (catching up)
 *   - idle    : nothing running or queued
 */

// Mirrors the 15-minute stale-running threshold used by recoverStaleRunningScanJobs.
export const STALE_RUNNING_MS = 15 * 60 * 1000;
// A queue sitting untouched longer than this with nothing running reads as "worker down".
const STUCK_QUEUE_MS = 10 * 60 * 1000;

export type WorkerState = "idle" | "active" | "backlog" | "broken";

export interface WorkerStatusSummary {
  state: WorkerState;
  label: string;
  tone: "ok" | "warning" | "danger" | "muted";
  runningCount: number;
  queuedCount: number;
  staleRunningCount: number;
  lastFinishedAt: string | null;
  detail: string;
}

function ageMs(value: string | null | undefined, now: number): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, now - t);
}

function jobStartMs(job: ScanJob): string | null {
  return job.startedAt ?? job.updatedAt ?? job.createdAt ?? null;
}

export function deriveWorkerStatus(
  jobs: ScanJob[],
  now: number = Date.now(),
): WorkerStatusSummary {
  const running = jobs.filter((j) => j.status === "running");
  const queued = jobs.filter((j) => j.status === "queued");
  const staleRunning = running.filter((j) => {
    const age = ageMs(jobStartMs(j), now);
    return age !== null && age > STALE_RUNNING_MS;
  });

  const finishedTimes = jobs
    .map((j) => j.finishedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .reverse();
  const lastFinishedAt = finishedTimes[0] ?? null;

  const oldestQueuedAge = queued
    .map((j) => ageMs(j.createdAt, now))
    .filter((v): v is number => v !== null)
    .sort((a, b) => b - a)[0] ?? null;

  const base = {
    runningCount: running.length,
    queuedCount: queued.length,
    staleRunningCount: staleRunning.length,
    lastFinishedAt,
  };

  if (staleRunning.length > 0) {
    return {
      ...base,
      state: "broken",
      label: "Worker stuck",
      tone: "danger",
      detail: `${staleRunning.length} job${staleRunning.length > 1 ? "s" : ""} running past the 15-min stale threshold — recover them.`,
    };
  }

  if (running.length === 0 && queued.length > 0 && (oldestQueuedAge ?? 0) > STUCK_QUEUE_MS) {
    return {
      ...base,
      state: "broken",
      label: "Queue not draining",
      tone: "danger",
      detail: `${queued.length} job${queued.length > 1 ? "s" : ""} queued with nothing running — the worker may be down.`,
    };
  }

  if (running.length > 0) {
    return {
      ...base,
      state: queued.length > 0 ? "backlog" : "active",
      label: queued.length > 0 ? "Catching up" : "Running",
      tone: queued.length > 0 ? "warning" : "ok",
      detail:
        queued.length > 0
          ? `${running.length} running, ${queued.length} queued.`
          : `${running.length} job${running.length > 1 ? "s" : ""} running.`,
    };
  }

  if (queued.length > 0) {
    return {
      ...base,
      state: "backlog",
      label: "Queued",
      tone: "warning",
      detail: `${queued.length} job${queued.length > 1 ? "s" : ""} waiting to be drained.`,
    };
  }

  return {
    ...base,
    state: "idle",
    label: "Idle",
    tone: "muted",
    detail: "No running or queued jobs.",
  };
}
