import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanJob } from "@/agents/ai-regulation/governance";
import type { AiRegulatoryUpdate, RegulationSource } from "@/agents/ai-regulation/types";

const mocks = vi.hoisted(() => ({
  getRepositoryMode: vi.fn(() => "memory"),
  updateRepository: {
    getSources: vi.fn(),
    getScanJobs: vi.fn(),
    listUpdatesPage: vi.fn(),
  },
}));

vi.mock("@/db/repository", () => ({
  getRepositoryMode: mocks.getRepositoryMode,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: mocks.updateRepository,
}));

function makeSource(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-1",
    name: "Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "EU",
    sourceUrl: "https://example.eu",
    sourceType: "API",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: "2026-06-18T10:00:00.000Z",
    lastSuccessfulScanAt: "2026-06-18T10:00:00.000Z",
    lastFailedScanAt: null,
    latestResponseStatus: 200,
    latestItemsFetched: 1,
    latestNewItemsDetected: 1,
    latestDuplicatesDetected: 0,
    latestParserWarnings: [],
    latestAccessibilityIssue: null,
    sourceReliabilityNotes: null,
    notes: "",
    reliabilityLevel: "high",
    preferredExtractionMethod: "api",
    createdAt: "2026-06-18T09:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
    ...overrides,
  };
}

function makeJob(overrides: Partial<ScanJob> = {}): ScanJob {
  return {
    id: "job-1",
    sourceId: null,
    trigger: "scheduled",
    requestedBy: "worker",
    status: "succeeded",
    startedAt: "2026-06-18T09:58:00.000Z",
    finishedAt: "2026-06-18T10:00:00.000Z",
    resultSummary: { scanProfile: "official_legal_scan" },
    errorMessage: null,
    createdAt: "2026-06-18T09:58:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
    ...overrides,
  };
}

function makeUpdate(overrides: Partial<AiRegulatoryUpdate> = {}): AiRegulatoryUpdate {
  return {
    id: "upd-1",
    sourceId: "src-1",
    rawItemId: "raw-1",
    title: "Update",
    sourceName: "Source",
    sourceUrl: "https://example.eu/update",
    jurisdiction: "European Union",
    region: "Europe",
    country: "EU",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    publicationDate: null,
    detectedDate: "2026-06-18T10:00:00.000Z",
    oneSentenceSummary: "Summary.",
    summary: "Summary.",
    whatHappened: "A thing happened.",
    whyItMatters: "It matters.",
    practicalImpact: "Review required.",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "Low.",
    importanceLevel: "medium",
    confidenceLevel: "high",
    tags: [],
    status: "needs_review",
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildHealthSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    mocks.updateRepository.getSources.mockResolvedValue([makeSource()]);
    mocks.updateRepository.getScanJobs.mockResolvedValue([
      makeJob(),
      makeJob({
        id: "job-running",
        status: "running",
        finishedAt: null,
        resultSummary: {
          scanProfile: "live_news_discovery_scan",
          leaseHeartbeatAt: "2026-06-18T10:04:30.000Z",
        },
      }),
    ]);
    mocks.updateRepository.listUpdatesPage.mockResolvedValue({
      items: [makeUpdate()],
      total: 7,
      limit: 500,
      offset: 0,
      hasMore: false,
    });
  });

  it("returns a coarse public health snapshot", async () => {
    const { buildHealthSnapshot } = await import("@/lib/health");

    const snapshot = await buildHealthSnapshot({
      access: "public",
      now: new Date("2026-06-18T10:05:00.000Z"),
    });

    expect(snapshot).toMatchObject({
      ok: true,
      dataMode: "memory",
      database: { reachable: true, error: null },
      scans: {
        newestSuccessfulScanAgeMs: 300_000,
        byProfile: {
          official_legal_scan: {
            newestSuccessfulScanAgeMs: 300_000,
          },
        },
      },
      worker: {
        heartbeatAgeMs: 30_000,
        runningJobs: 1,
      },
      review: {
        pendingNeedsReviewCount: 7,
      },
    });
    expect(snapshot.details).toBeUndefined();
  });

  it("includes operational details for authenticated checks", async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "abc123";
    const { buildHealthSnapshot } = await import("@/lib/health");

    const snapshot = await buildHealthSnapshot({
      access: "authenticated",
      now: new Date("2026-06-18T10:05:00.000Z"),
    });

    expect(snapshot.version.commit).toBe("abc123");
    expect(snapshot.details).toEqual({
      sourcesChecked: 1,
      scanJobsChecked: 2,
      needsReviewSampleSize: 1,
      runningJobIds: ["job-running"],
    });
  });

  it("returns an unhealthy snapshot when repository reads fail", async () => {
    mocks.updateRepository.getSources.mockRejectedValueOnce(new Error("database unavailable"));
    const { buildHealthSnapshot } = await import("@/lib/health");

    const snapshot = await buildHealthSnapshot({
      access: "authenticated",
      now: new Date("2026-06-18T10:05:00.000Z"),
    });

    expect(snapshot.ok).toBe(false);
    expect(snapshot.database).toEqual({
      reachable: false,
      error: "database unavailable",
    });
    expect(snapshot.details).toMatchObject({
      sourcesChecked: 0,
      scanJobsChecked: 0,
    });
  });
});
