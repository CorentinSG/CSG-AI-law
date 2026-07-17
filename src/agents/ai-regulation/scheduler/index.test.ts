import { afterEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/agents/ai-regulation/processors/scanJobs", () => ({
  queueScanJob,
}));

describe("central monitoring scheduler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds a central plan covering every EU, US, and International monitoring agent", () => {
    const plan = buildCentralMonitoringSchedule();

    expect(plan.euAgents).toBe(28);
    expect(plan.usAgents).toBe(52);
    expect(plan.internationalAgents).toBe(10);
    expect(plan.totalAgents).toBe(90);
    expect(plan.items).toHaveLength(9);
    expect(plan.items.filter((item) => item.region === "eu")).toHaveLength(3);
    expect(plan.items.filter((item) => item.region === "us")).toHaveLength(3);
    expect(plan.items.filter((item) => item.region === "international")).toHaveLength(3);
    expect(plan.items.every((item) => item.agentCount > 0)).toBe(true);
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
});
