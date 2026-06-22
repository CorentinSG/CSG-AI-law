import { describe, expect, it } from "vitest";

import {
  countQueuedJobs,
  countStaleRunningJobs,
  workerDisplay,
} from "@/app/admin/ai-regulation/system-status";
import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { HealthSnapshot } from "@/lib/health";

const NOW = new Date("2026-06-11T12:00:00.000Z").getTime();
function minsAgo(m: number) {
  return new Date(NOW - m * 60_000).toISOString();
}

function job(overrides: Partial<ScanJob> & { id: string; status: ScanJob["status"] }): ScanJob {
  return {
    sourceId: null,
    trigger: "manual",
    requestedBy: "admin-action",
    startedAt: null,
    finishedAt: null,
    createdAt: minsAgo(1),
    updatedAt: minsAgo(1),
    resultSummary: {},
    errorMessage: null,
    ...overrides,
  } as ScanJob;
}

function worker(overrides: Partial<HealthSnapshot["worker"]>): HealthSnapshot["worker"] {
  return {
    state: "idle",
    heartbeatAgeMs: null,
    heartbeatAt: null,
    lastActivityAgeMs: null,
    lastActivityAt: null,
    runningJobs: 0,
    ...overrides,
  };
}

describe("system-status helpers", () => {
  it("countStaleRunningJobs flags running jobs past the threshold", () => {
    const jobs = [
      job({ id: "a", status: "running", startedAt: minsAgo(20) }),
      job({ id: "b", status: "running", startedAt: minsAgo(2) }),
      job({ id: "c", status: "queued" }),
    ];
    expect(countStaleRunningJobs(jobs, NOW)).toBe(1);
    expect(countQueuedJobs(jobs)).toBe(1);
  });

  it("workerDisplay reports Stuck when a stale running job exists", () => {
    const d = workerDisplay(worker({ state: "active", runningJobs: 1 }), 1, 0);
    expect(d.label).toBe("Stuck");
    expect(d.tone).toBe("danger");
  });

  it("workerDisplay shows Running for an active worker with no queue", () => {
    const d = workerDisplay(worker({ state: "active", runningJobs: 2 }), 0, 0);
    expect(d.label).toBe("Running");
    expect(d.tone).toBe("ok");
    expect(d.state).toBe("active");
  });

  it("workerDisplay shows Catching up when active with a queue", () => {
    const d = workerDisplay(worker({ state: "active", runningJobs: 1 }), 0, 3);
    expect(d.label).toBe("Catching up");
    expect(d.tone).toBe("warning");
  });

  it("workerDisplay shows Idle for an idle worker", () => {
    const d = workerDisplay(worker({ state: "idle" }), 0, 0);
    expect(d.label).toBe("Idle");
    expect(d.tone).toBe("muted");
  });

  it("workerDisplay shows Unknown when the worker has no recorded activity", () => {
    const d = workerDisplay(worker({ state: "unknown" }), 0, 0);
    expect(d.label).toBe("Unknown");
    expect(d.state).toBe("unknown");
  });
});
