import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { HealthSnapshot } from "@/lib/health";

/**
 * Dashboard worker presentation (pure — no I/O).
 *
 * The canonical worker state + lastActivity come from `buildHealthSnapshot`
 * (`health.worker`). On top of that contract we layer a "stuck" signal derived
 * from recent scan jobs: a running job past the stale threshold means the
 * worker (or that job) is wedged even if health still reports "active".
 */

// Mirrors the 15-minute stale-running threshold used by recoverStaleRunningScanJobs.
export const STALE_RUNNING_MS = 15 * 60 * 1000;

function jobStartMs(job: ScanJob): string | null {
  return job.startedAt ?? job.updatedAt ?? job.createdAt ?? null;
}

function ageMs(value: string | null | undefined, now: number): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, now - t);
}

export function countStaleRunningJobs(jobs: ScanJob[], now: number = Date.now()): number {
  return jobs.filter((job) => {
    if (job.status !== "running") return false;
    const age = ageMs(jobStartMs(job), now);
    return age !== null && age > STALE_RUNNING_MS;
  }).length;
}

export function countQueuedJobs(jobs: ScanJob[]): number {
  return jobs.filter((job) => job.status === "queued").length;
}

export type WorkerDisplayTone = "ok" | "warning" | "danger" | "muted";

export interface WorkerDisplay {
  /** Raw health.worker.state (active | idle | unknown). */
  state: HealthSnapshot["worker"]["state"];
  label: string;
  tone: WorkerDisplayTone;
  detail: string;
}

/**
 * Map the canonical health worker state (+ live job context) to a dashboard
 * display: friendly label, tone, and a one-line detail.
 */
export function workerDisplay(
  worker: HealthSnapshot["worker"],
  staleRunningCount: number,
  queuedCount: number,
): WorkerDisplay {
  if (staleRunningCount > 0) {
    return {
      state: worker.state,
      label: "Stuck",
      tone: "danger",
      detail: `${staleRunningCount} job${staleRunningCount > 1 ? "s" : ""} running past the 15-min stale threshold — recover them.`,
    };
  }
  if (worker.state === "active") {
    return {
      state: "active",
      label: queuedCount > 0 ? "Catching up" : "Running",
      tone: queuedCount > 0 ? "warning" : "ok",
      detail:
        queuedCount > 0
          ? `${worker.runningJobs} running, ${queuedCount} queued.`
          : `${worker.runningJobs} job${worker.runningJobs === 1 ? "" : "s"} running.`,
    };
  }
  if (queuedCount > 0) {
    return {
      state: worker.state,
      label: "Queued",
      tone: "warning",
      detail: `${queuedCount} job${queuedCount > 1 ? "s" : ""} waiting to be drained.`,
    };
  }
  if (worker.state === "idle") {
    return { state: "idle", label: "Idle", tone: "muted", detail: "No running or queued jobs." };
  }
  return {
    state: "unknown",
    label: "Unknown",
    tone: "muted",
    detail: "No worker activity recorded yet.",
  };
}
