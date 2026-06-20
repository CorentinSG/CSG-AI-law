import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanJob } from "@/agents/ai-regulation/governance";

const jobs: ScanJob[] = [];

const updateRepository = {
  getScanJobs: vi.fn(async (limit?: number) =>
    typeof limit === "number" ? jobs.slice(0, limit) : jobs.slice(),
  ),
  getScanJob: vi.fn(async (jobId: string) => jobs.find((job) => job.id === jobId) ?? null),
  createScanJob: vi.fn(async (input) => {
    const timestamp = "2026-06-06T10:00:00.000Z";
    const job: ScanJob = {
      ...input,
      id: `job-${jobs.length + 1}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    jobs.unshift(job);
    return job;
  }),
  updateScanJob: vi.fn(async (jobId: string, patch: Partial<ScanJob>) => {
    const job = jobs.find((entry) => entry.id === jobId);
    if (!job) {
      throw new Error(`Scan job ${jobId} not found.`);
    }
    Object.assign(job, patch, { updatedAt: "2026-06-06T10:00:01.000Z" });
    return job;
  }),
  tryStartScanJob: vi.fn(async (jobId: string, input) => {
    const job = jobs.find((entry) => entry.id === jobId);
    if (!job) {
      throw new Error(`Scan job ${jobId} not found.`);
    }
    if (job.status !== "queued" || job.startedAt || job.finishedAt) {
      return null;
    }
    Object.assign(job, {
      status: "running",
      startedAt: input.startedAt,
      finishedAt: null,
      errorMessage: null,
      resultSummary: {
        ...job.resultSummary,
        leaseOwner: input.leaseOwner,
        leaseToken: input.leaseToken,
        leaseAcquiredAt: input.startedAt,
        claimedFromStatus: "queued",
      },
      updatedAt: "2026-06-06T10:00:01.000Z",
    });
    return job;
  }),
};

const runAiRegulationScan = vi.fn();
const runDataStewardSync = vi.fn();
const alertOnDailyReviewBacklog = vi.fn();

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository,
}));

vi.mock("@/agents/ai-regulation/processors/pipeline", () => ({
  runAiRegulationScan,
}));

vi.mock("@/agents/ai-regulation/processors/dataStewardSync", () => ({
  runDataStewardSync,
}));

vi.mock("@/lib/alerting", () => ({
  alertOnDailyReviewBacklog,
}));

function makeScanResult(overrides?: Partial<Record<string, unknown>>) {
  return [
    {
      sourceId: "src-1",
      sourceName: "Example Source",
      status: "succeeded",
      trigger: "manual",
      scanProfile: "default",
      startedAt: "2026-06-06T10:00:00.000Z",
      finishedAt: "2026-06-06T10:01:00.000Z",
      itemsFound: 1,
      newItemsDetected: 1,
      duplicatesDetected: 0,
      processingFailures: 0,
      warnings: [],
      errors: [],
      ...overrides,
    },
  ];
}

describe("scanJobs durability helpers", () => {
  beforeEach(() => {
    jobs.length = 0;
    vi.clearAllMocks();
    runDataStewardSync.mockResolvedValue({
      persisted: {
        syncedCount: 0,
      },
      report: {
        summary: {
          highPriorityReviewItems: 0,
        },
      },
    });
    alertOnDailyReviewBacklog.mockResolvedValue(undefined);
  });

  it("marks stale running jobs as failed before they linger silently", async () => {
    jobs.push(
      {
        id: "job-stale",
        sourceId: "src-1",
        trigger: "cron",
        requestedBy: "scheduler",
        status: "running",
        startedAt: "2026-06-06T09:00:00.000Z",
        finishedAt: null,
        resultSummary: { scanProfile: "default" },
        errorMessage: null,
        createdAt: "2026-06-06T08:59:00.000Z",
        updatedAt: "2026-06-06T09:00:00.000Z",
      },
      {
        id: "job-fresh",
        sourceId: "src-2",
        trigger: "cron",
        requestedBy: "scheduler",
        status: "running",
        startedAt: "2026-06-06T10:16:00.000Z",
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: "2026-06-06T10:15:00.000Z",
        updatedAt: "2026-06-06T10:16:00.000Z",
      },
    );

    const { recoverStaleRunningScanJobs } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const recovered = await recoverStaleRunningScanJobs({
      now: "2026-06-06T10:30:00.000Z",
      staleAfterMs: 15 * 60 * 1000,
    });

    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({
      id: "job-stale",
      status: "failed",
      errorMessage:
        "Marked failed after exceeding the running-job timeout without completion.",
      resultSummary: expect.objectContaining({
        recoveredAsStale: true,
      }),
    });
    expect(jobs.find((job) => job.id === "job-fresh")?.status).toBe("running");
  });

  it("uses the latest lease heartbeat when deciding whether a running job is stale", async () => {
    jobs.push({
      id: "job-heartbeat-fresh",
      sourceId: "src-heartbeat",
      trigger: "cron",
      requestedBy: "scheduler",
      status: "running",
      startedAt: "2026-06-06T09:00:00.000Z",
      finishedAt: null,
      resultSummary: {
        leaseHeartbeatAt: "2026-06-06T10:29:30.000Z",
        leaseHeartbeatTimeoutMs: 45_000,
      },
      errorMessage: null,
      createdAt: "2026-06-06T08:59:00.000Z",
      updatedAt: "2026-06-06T10:29:30.000Z",
    });

    const { recoverStaleRunningScanJobs } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const recovered = await recoverStaleRunningScanJobs({
      now: "2026-06-06T10:30:00.000Z",
      staleAfterMs: 15 * 60 * 1000,
    });

    expect(recovered).toHaveLength(0);
    expect(jobs.find((job) => job.id === "job-heartbeat-fresh")?.status).toBe("running");
  });

  it("rejects direct execution of a job that is already running", async () => {
    jobs.push({
      id: "job-running-direct",
      sourceId: "src-running",
      trigger: "manual",
      requestedBy: "admin",
      status: "running",
      startedAt: "2026-06-06T10:00:00.000Z",
      finishedAt: null,
      resultSummary: {
        leaseOwner: "local-worker",
        leaseToken: "lease-running",
      },
      errorMessage: null,
      createdAt: "2026-06-06T09:59:00.000Z",
      updatedAt: "2026-06-06T10:00:00.000Z",
    });

    const { processScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );

    await expect(processScanJob("job-running-direct")).rejects.toMatchObject({
      message: "Scan job job-running-direct is already running and cannot be re-executed directly.",
      code: "scan_job_already_running",
    });
    expect(runAiRegulationScan).not.toHaveBeenCalled();
  });

  it("returns structured blocker ownership details when a healthy running job blocks queue draining", async () => {
    const now = new Date();
    const startedAt = new Date(now.getTime() - 30_000).toISOString();
    const heartbeatAt = new Date(now.getTime() - 10_000).toISOString();

    jobs.push({
      id: "job-running-blocker",
      sourceId: "src-blocker",
      trigger: "scheduled",
      requestedBy: "vercel-cron",
      status: "running",
      startedAt,
      finishedAt: null,
      resultSummary: {
        leaseOwner: "local-worker",
        leaseHeartbeatAt: heartbeatAt,
        leaseHeartbeatTimeoutMs: 45_000,
      },
      errorMessage: null,
      createdAt: startedAt,
      updatedAt: heartbeatAt,
    });

    const { queueAndDrainScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const queued = await queueAndDrainScanJob({
      sourceId: "src-next",
      trigger: "manual",
      requestedBy: "admin-api",
    });

    expect(queued.processedJob).toBeNull();
    expect(queued.blockedByRunningJobs).toEqual(["job-running-blocker"]);
    expect(queued.blockingRunningJobSummaries).toEqual([
      expect.objectContaining({
        jobId: "job-running-blocker",
        sourceId: "src-blocker",
        trigger: "scheduled",
        requestedBy: "vercel-cron",
        leaseOwner: "local-worker",
        blockedReason: "healthy_running_job",
        heartbeatTimeoutMs: 45_000,
      }),
    ]);
    expect(runAiRegulationScan).not.toHaveBeenCalled();
  });

  it("processes the oldest queued scan job when draining the queue", async () => {
    jobs.push(
      {
        id: "job-newer",
        sourceId: "src-2",
        trigger: "manual",
        requestedBy: "Admin",
        status: "queued",
        startedAt: null,
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: "2026-06-06T10:10:00.000Z",
        updatedAt: "2026-06-06T10:10:00.000Z",
      },
      {
        id: "job-older",
        sourceId: "src-1",
        trigger: "cron",
        requestedBy: "scheduler",
        status: "queued",
        startedAt: null,
        finishedAt: null,
        resultSummary: {
          scanProfile: "eu_official_legal_scan",
        },
        errorMessage: null,
        createdAt: "2026-06-06T09:55:00.000Z",
        updatedAt: "2026-06-06T09:55:00.000Z",
      },
    );
    runAiRegulationScan.mockResolvedValue(makeScanResult());

    const { processNextQueuedScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const processed = await processNextQueuedScanJob();

    expect(processed?.job.id).toBe("job-older");
    expect(runAiRegulationScan).toHaveBeenCalledWith("src-1", {
      trigger: "cron",
      scanJobId: "job-older",
      scanProfile: "eu_official_legal_scan",
    });
    expect(jobs.find((job) => job.id === "job-older")?.status).toBe("succeeded");
  });

  it("skips a queued job that was already claimed and processes the next claimable one", async () => {
    jobs.push(
      {
        id: "job-raced",
        sourceId: "src-raced",
        trigger: "cron",
        requestedBy: "scheduler",
        status: "queued",
        startedAt: null,
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: "2026-06-06T09:50:00.000Z",
        updatedAt: "2026-06-06T09:50:00.000Z",
      },
      {
        id: "job-next",
        sourceId: "src-next",
        trigger: "cron",
        requestedBy: "scheduler",
        status: "queued",
        startedAt: null,
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: "2026-06-06T09:55:00.000Z",
        updatedAt: "2026-06-06T09:55:00.000Z",
      },
    );
    updateRepository.tryStartScanJob.mockImplementationOnce(async () => null);
    runAiRegulationScan.mockResolvedValue(makeScanResult());

    const { processNextQueuedScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const processed = await processNextQueuedScanJob({
      leaseOwner: "queue-drain",
    });

    expect(processed?.job.id).toBe("job-next");
    expect(runAiRegulationScan).toHaveBeenCalledWith("src-next", {
      trigger: "cron",
      scanJobId: "job-next",
      scanProfile: undefined,
    });
  });

  it("recovers stale jobs before queue-and-run starts a new inline execution", async () => {
    jobs.push({
      id: "job-stale",
      sourceId: "src-stale",
      trigger: "cron",
      requestedBy: "scheduler",
      status: "running",
      startedAt: "2026-06-05T08:00:00.000Z",
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
      createdAt: "2026-06-06T07:59:00.000Z",
      updatedAt: "2026-06-06T08:00:00.000Z",
    });
    runAiRegulationScan.mockResolvedValue(makeScanResult());

    const { queueAndRunScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const processed = await queueAndRunScanJob({
      sourceId: "src-live",
      trigger: "manual",
      requestedBy: "Admin",
      scanProfile: "official_baseline_scan",
    });

    expect(jobs.find((job) => job.id === "job-stale")?.status).toBe("failed");
    expect(processed.job.status).toBe("succeeded");
    expect(runAiRegulationScan).toHaveBeenCalledWith("src-live", {
      trigger: "manual",
      scanJobId: processed.job.id,
      scanProfile: "official_baseline_scan",
    });
  });

  it("queue-and-run now reuses queue-drain semantics and reports blocking jobs honestly", async () => {
    const freshStartedAt = new Date(Date.now() - 60_000).toISOString();
    const freshCreatedAt = new Date(Date.now() - 120_000).toISOString();
    jobs.push({
      id: "job-running",
      sourceId: "src-running",
      trigger: "scheduled",
      requestedBy: "cron",
      status: "running",
      startedAt: freshStartedAt,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
      createdAt: freshCreatedAt,
      updatedAt: freshStartedAt,
    });

    const { queueAndRunScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const processed = await queueAndRunScanJob({
      sourceId: "src-live",
      trigger: "manual",
      requestedBy: "admin-action",
      scanProfile: "official_baseline_scan",
    });

    expect(processed.job.status).toBe("queued");
    expect(processed.queuedJobProcessedImmediately).toBe(false);
    expect(processed.blockedByRunningJobs).toEqual(["job-running"]);
    expect(runAiRegulationScan).not.toHaveBeenCalled();
  });

  it("returns both queued and processed job metadata when draining a newly enqueued job", async () => {
    runAiRegulationScan.mockResolvedValue(makeScanResult());

    const { queueAndDrainScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const drained = await queueAndDrainScanJob({
      sourceId: "src-live",
      trigger: "manual",
      requestedBy: "admin-api",
      scanProfile: "official_baseline_scan",
    });

    expect(drained.queuedJob.id).toBe(drained.processedJob?.id);
    expect(drained.queuedJobProcessedImmediately).toBe(true);
    expect(drained.processedJob?.status).toBe("succeeded");
  });

  it("can enqueue a job without inline draining when route mode is queue-only", async () => {
    const { queueAndDrainScanJob } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const queued = await queueAndDrainScanJob({
      sourceId: "src-live",
      trigger: "scheduled",
      requestedBy: "vercel-cron",
      executionMode: "enqueue_only",
    });

    expect(queued.queuedJob.status).toBe("queued");
    expect(queued.processedJob).toBeNull();
    expect(queued.queuedJobProcessedImmediately).toBe(false);
    expect(queued.blockedByRunningJobs).toEqual([]);
    expect(runAiRegulationScan).not.toHaveBeenCalled();
  });

  it("can drain multiple queued jobs serially for a local worker-style runner", async () => {
    jobs.push(
      {
        id: "job-1",
        sourceId: "src-1",
        trigger: "scheduled",
        requestedBy: "cron",
        status: "queued",
        startedAt: null,
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: "2026-06-06T09:00:00.000Z",
        updatedAt: "2026-06-06T09:00:00.000Z",
      },
      {
        id: "job-2",
        sourceId: "src-2",
        trigger: "scheduled",
        requestedBy: "cron",
        status: "queued",
        startedAt: null,
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: "2026-06-06T09:10:00.000Z",
        updatedAt: "2026-06-06T09:10:00.000Z",
      },
    );
    runAiRegulationScan.mockResolvedValue(makeScanResult());

    const { drainQueuedScanJobs } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );
    const summary = await drainQueuedScanJobs({
      maxJobs: 2,
    });

    expect(summary).toMatchObject({
      attempted: 2,
      processedCount: 2,
      failedCount: 0,
    });
    expect(summary.processedJobs.map((entry) => entry.jobId)).toEqual(["job-1", "job-2"]);
    expect(jobs.find((job) => job.id === "job-1")?.status).toBe("succeeded");
    expect(jobs.find((job) => job.id === "job-2")?.status).toBe("succeeded");
  });

  it("does not drain or inline-process a queued job when a healthy running job already exists", async () => {
    const freshStartedAt = new Date(Date.now() - 60_000).toISOString();
    const freshCreatedAt = new Date(Date.now() - 120_000).toISOString();
    jobs.push(
      {
        id: "job-running",
        sourceId: "src-running",
        trigger: "scheduled",
        requestedBy: "cron",
        status: "running",
        startedAt: freshStartedAt,
        finishedAt: null,
        resultSummary: {},
        errorMessage: null,
        createdAt: freshCreatedAt,
        updatedAt: freshStartedAt,
      },
    );

    const { queueAndDrainScanJob, drainQueuedScanJobs } = await import(
      "@/agents/ai-regulation/processors/scanJobs"
    );

    const queued = await queueAndDrainScanJob({
      sourceId: "src-next",
      trigger: "manual",
      requestedBy: "admin-api",
      scanProfile: "official_baseline_scan",
    });
    const drained = await drainQueuedScanJobs({
      maxJobs: 2,
    });

    expect(queued.processedJob).toBeNull();
    expect(queued.blockedByRunningJobs).toEqual(["job-running"]);
    expect(drained).toMatchObject({
      attempted: 0,
      processedCount: 0,
      failedCount: 0,
      blockedByRunningJobs: ["job-running"],
    });
    expect(runAiRegulationScan).not.toHaveBeenCalled();
  });
});
