import { afterEach, describe, expect, it, vi } from "vitest";

import type { ScanJob } from "@/agents/ai-regulation/governance";
import {
  buildCentralMonitoringSchedule,
  enqueueCentralMonitoringSchedule,
} from "@/agents/ai-regulation/scheduler";

const { queueScanJob } = vi.hoisted(() => ({
  queueScanJob: vi.fn(async (input) => ({
    id: `job-${input.scanProfile}`,
    resultSummary: input.resultSummary,
  })),
}));

const updateRepository = vi.hoisted(() => ({
  getScanJobs: vi.fn(async (): Promise<ScanJob[]> => []),
}));

vi.mock("@/agents/ai-regulation/processors/scanJobs", () => ({
  queueScanJob,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository,
}));

describe("central monitoring scheduler", () => {
  afterEach(() => {
    vi.clearAllMocks();
    updateRepository.getScanJobs.mockResolvedValue([]);
  });

  it("builds a central plan covering every EU, US, and International monitoring agent", () => {
    const plan = buildCentralMonitoringSchedule();

    expect(plan.euAgents).toBe(28);
    expect(plan.usAgents).toBe(52);
    expect(plan.internationalAgents).toBe(10);
    expect(plan.totalAgents).toBe(90);
    expect(plan.items).toHaveLength(10);
    expect(plan.items.filter((item) => item.region === "eu")).toHaveLength(4);
    expect(plan.items.filter((item) => item.region === "us")).toHaveLength(3);
    expect(plan.items.filter((item) => item.region === "international")).toHaveLength(3);
    expect(plan.items.every((item) => item.agentCount > 0)).toBe(true);

    const fastLane = plan.items.find((item) => item.id === "official-fast");
    expect(fastLane?.scanProfile).toBe("official_fast_scan");
    expect(fastLane?.cadence).toBe("hourly");
  });

  it("queues selected regional/cadence sweeps with agent coverage metadata", async () => {
    const result = await enqueueCentralMonitoringSchedule({
      trigger: "scheduled",
      requestedBy: "test-scheduler",
      regions: ["us"],
      cadences: ["live"],
    });

    expect(result.queuedJobCount).toBe(1);
    expect(queueScanJob).toHaveBeenCalledWith({
      trigger: "scheduled",
      requestedBy: "test-scheduler",
      scanProfile: "live_news_discovery_scan",
      resultSummary: expect.objectContaining({
        scheduler: "central-monitoring-scheduler",
        schedulerRegion: "us",
        schedulerCadence: "live",
        coveredAgentCount: 52,
      }),
    });
  });

  it("queues International sweeps with source coverage metadata", async () => {
    const result = await enqueueCentralMonitoringSchedule({
      trigger: "scheduled",
      requestedBy: "test-scheduler",
      regions: ["international"],
      cadences: ["daily"],
    });

    expect(result.queuedJobCount).toBe(1);
    expect(queueScanJob).toHaveBeenCalledWith({
      trigger: "scheduled",
      requestedBy: "test-scheduler",
      scanProfile: "international_official_legal_scan",
      resultSummary: expect.objectContaining({
        scheduler: "central-monitoring-scheduler",
        schedulerRegion: "international",
        schedulerCadence: "daily",
        coveredAgentCount: 10,
      }),
    });
  });

  it("skips recent duplicate sweeps to keep worker restarts and Vercel cron from piling up jobs", async () => {
    updateRepository.getScanJobs.mockResolvedValueOnce([
      {
        id: "job-existing",
        sourceId: null,
        trigger: "scheduled",
        requestedBy: "central-monitoring-scheduler",
        status: "succeeded",
        startedAt: new Date(Date.now() - 60_000).toISOString(),
        finishedAt: new Date().toISOString(),
        resultSummary: {
          scanProfile: "live_news_discovery_scan",
          schedulerPlanItemId: "us-live-news",
        },
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const result = await enqueueCentralMonitoringSchedule({
      trigger: "scheduled",
      requestedBy: "test-scheduler",
      regions: ["us"],
      cadences: ["live"],
    });

    expect(result.queuedJobCount).toBe(0);
    expect(result.skippedJobCount).toBe(1);
    expect(result.skippedJobs).toEqual([
      expect.objectContaining({
        existingJobId: "job-existing",
        scanProfile: "live_news_discovery_scan",
        reason: "recent_duplicate",
      }),
    ]);
    expect(queueScanJob).not.toHaveBeenCalled();
  });
});
