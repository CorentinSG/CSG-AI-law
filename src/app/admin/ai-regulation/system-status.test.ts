import { describe, expect, it } from "vitest";

import { deriveWorkerStatus } from "@/app/admin/ai-regulation/system-status";
import type { ScanJob } from "@/agents/ai-regulation/governance";

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

describe("deriveWorkerStatus", () => {
  it("idle when nothing is running or queued", () => {
    const s = deriveWorkerStatus(
      [job({ id: "a", status: "succeeded", finishedAt: minsAgo(30) })],
      NOW,
    );
    expect(s.state).toBe("idle");
    expect(s.lastFinishedAt).toBe(minsAgo(30));
  });

  it("active when a fresh job is running", () => {
    const s = deriveWorkerStatus([job({ id: "a", status: "running", startedAt: minsAgo(2) })], NOW);
    expect(s.state).toBe("active");
    expect(s.tone).toBe("ok");
    expect(s.runningCount).toBe(1);
  });

  it("backlog when running plus queued", () => {
    const s = deriveWorkerStatus(
      [
        job({ id: "a", status: "running", startedAt: minsAgo(1) }),
        job({ id: "b", status: "queued", createdAt: minsAgo(1) }),
      ],
      NOW,
    );
    expect(s.state).toBe("backlog");
    expect(s.queuedCount).toBe(1);
  });

  it("broken when a running job exceeds the stale threshold", () => {
    const s = deriveWorkerStatus([job({ id: "a", status: "running", startedAt: minsAgo(20) })], NOW);
    expect(s.state).toBe("broken");
    expect(s.tone).toBe("danger");
    expect(s.staleRunningCount).toBe(1);
  });

  it("broken when the queue is stuck with nothing running", () => {
    const s = deriveWorkerStatus([job({ id: "a", status: "queued", createdAt: minsAgo(15) })], NOW);
    expect(s.state).toBe("broken");
    expect(s.label).toMatch(/not draining/i);
  });
});
