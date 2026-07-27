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
  // The duplicate check reads the dedupe window by time, not by row count.
  getScanJobsCreatedSince: vi.fn(async (): Promise<ScanJob[]> => []),
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
    updateRepository.getScanJobsCreatedSince.mockResolvedValue([]);
  });

  it("builds a central plan covering every EU, US, and International monitoring agent", () => {
    const plan = buildCentralMonitoringSchedule();

    expect(plan.euAgents).toBe(28);
    expect(plan.usAgents).toBe(52);
    expect(plan.internationalAgents).toBe(10);
    expect(plan.totalAgents).toBe(90);
    expect(plan.items).toHaveLength(27);
    expect(plan.items.filter((item) => item.region === "eu")).toHaveLength(3);
    expect(plan.items.filter((item) => item.region === "us")).toHaveLength(3);
    expect(plan.items.filter((item) => item.region === "international")).toHaveLength(3);
    expect(plan.items.every((item) => item.agentCount > 0)).toBe(true);
  });

  it("wires the per-country live-news and verification profiles into the plan", () => {
    const countryItems = buildCentralMonitoringSchedule().items.filter(
      (item) => item.region === "country",
    );

    // Nine countries x two lanes. `<country>_official_legal_scan` is left out on
    // purpose: it already runs daily from the per-country vercel.json crons.
    expect(countryItems).toHaveLength(18);
    expect(countryItems.map((item) => item.scanProfile)).toEqual(
      expect.arrayContaining([
        "france_live_news_scan",
        "france_verification_scan",
        "germany_live_news_scan",
        "sweden_verification_scan",
      ]),
    );
    expect(
      countryItems.every((item) =>
        item.scanProfile.endsWith("_live_news_scan")
          ? item.cadence === "live"
          : item.cadence === "hourly",
      ),
    ).toBe(true);
    expect(
      countryItems.some((item) => item.scanProfile.endsWith("_official_legal_scan")),
    ).toBe(false);
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

  it("staggers country lanes so one cycle activates a single country", async () => {
    vi.useFakeTimers();
    // Countries rotate alphabetically on a 15-minute window; index 2 is France.
    vi.setSystemTime(new Date(2 * 15 * 60 * 1000));

    try {
      const result = await enqueueCentralMonitoringSchedule({
        regions: ["country"],
      });

      expect(result.queuedJobs).toHaveLength(2);
      expect(queueScanJob).toHaveBeenCalledWith(
        expect.objectContaining({ scanProfile: "france_live_news_scan" }),
      );
      expect(queueScanJob).toHaveBeenCalledWith(
        expect.objectContaining({ scanProfile: "france_verification_scan" }),
      );
      expect(result.skippedJobCount).toBe(16);
      expect(
        result.skippedJobs.every((job) => job.reason === "staggered_country_wave"),
      ).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("advances the country stagger to the next window", async () => {
    vi.useFakeTimers();
    // Index 3 is Germany.
    vi.setSystemTime(new Date(3 * 15 * 60 * 1000));

    try {
      const result = await enqueueCentralMonitoringSchedule({
        regions: ["country"],
        cadences: ["live"],
      });

      expect(result.queuedJobCount).toBe(1);
      expect(queueScanJob).toHaveBeenCalledWith(
        expect.objectContaining({
          scanProfile: "germany_live_news_scan",
          resultSummary: expect.objectContaining({
            schedulerRegion: "country",
            schedulerCadence: "live",
            coveredAgentIds: ["germany"],
          }),
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads the scan-job history once per invocation instead of once per plan item", async () => {
    await enqueueCentralMonitoringSchedule({});

    expect(updateRepository.getScanJobsCreatedSince).toHaveBeenCalledTimes(1);
  });

  it("skips recent duplicate sweeps to keep worker restarts and Vercel cron from piling up jobs", async () => {
    updateRepository.getScanJobsCreatedSince.mockResolvedValueOnce([
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
