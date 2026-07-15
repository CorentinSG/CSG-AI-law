import { afterEach, describe, expect, it, vi } from "vitest";

const buildHealthSnapshot = vi.fn();
const listAgentApiCapabilities = vi.fn();
const listGlobalMonitoringAgents = vi.fn();
const getSourceRuntimeHealthSummaries = vi.fn();
const getCountryDatabaseReadiness = vi.fn();
const updateRepository = {
  listUpdatesPage: vi.fn(),
  getNewsItemsPage: vi.fn(),
  getPublicNewsItemsPage: vi.fn(),
  getSources: vi.fn(),
  getScanJobs: vi.fn(),
  listDiscoveryLeadsPage: vi.fn(),
  listCountryIntelligence: vi.fn(),
  getDataQualityFindings: vi.fn(),
};

vi.mock("@/lib/health", () => ({
  buildHealthSnapshot,
}));

vi.mock("@/agents/ai-regulation/agentApiCapabilities", () => ({
  listAgentApiCapabilities,
}));

vi.mock("@/agents/ai-regulation/globalMonitoringSupervisorAgent", () => ({
  listGlobalMonitoringAgents,
}));

vi.mock("@/agents/ai-regulation/sourceRuntimeHealth", () => ({
  getSourceRuntimeHealthSummaries,
}));

vi.mock("@/lib/country-database-readiness", () => ({
  getCountryDatabaseReadiness,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository,
}));

describe("buildAdminOperationsSummary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds compact operations aggregates for the admin dashboard", async () => {
    const now = new Date("2026-06-20T12:00:00.000Z");
    buildHealthSnapshot.mockResolvedValueOnce({
      ok: true,
      worker: {
        alive: true,
        state: "active",
        heartbeatAgeMs: 1000,
        heartbeatAt: now.toISOString(),
        lastActivityAgeMs: 1000,
        lastActivityAt: now.toISOString(),
        runningJobs: 1,
      },
      coverage: {
        state: "healthy",
        zeroSourceProfiles: [],
      },
      scans: { newestSuccessfulScanAgeMs: 2000, newestSuccessfulScanAt: now.toISOString(), byProfile: {} },
    });
    updateRepository.listUpdatesPage
      .mockResolvedValueOnce({ total: 7, items: [], limit: 1, offset: 0, hasMore: true })
      .mockResolvedValueOnce({ total: 2, items: [], limit: 1, offset: 0, hasMore: true })
      .mockResolvedValueOnce({ total: 3, items: [], limit: 1, offset: 0, hasMore: true })
      .mockResolvedValueOnce({ total: 1, items: [], limit: 1, offset: 0, hasMore: false })
      .mockResolvedValueOnce({ total: 4, items: [], limit: 1, offset: 0, hasMore: true });
    updateRepository.getNewsItemsPage.mockResolvedValueOnce({ total: 10, items: [], limit: 1, offset: 0, hasMore: true });
    updateRepository.getPublicNewsItemsPage.mockResolvedValueOnce({ total: 6, items: [], limit: 1, offset: 0, hasMore: true });
    updateRepository.getSources.mockResolvedValueOnce([
      { active: true },
      { active: false },
    ]);
    getSourceRuntimeHealthSummaries.mockResolvedValueOnce([
      { state: "healthy" },
      { state: "degraded" },
      { state: "inactive" },
    ]);
    updateRepository.getScanJobs.mockResolvedValueOnce([
      { status: "queued" },
      { status: "running" },
      { status: "partial_success" },
      { status: "failed" },
    ]);
    updateRepository.listDiscoveryLeadsPage.mockResolvedValueOnce({ total: 5, items: [], limit: 1, offset: 0, hasMore: true });
    updateRepository.listCountryIntelligence.mockResolvedValueOnce([
      { reviewStatus: "verified" },
      { reviewStatus: "needs_review" },
      { reviewStatus: "needs_review" },
    ]);
    updateRepository.getDataQualityFindings.mockResolvedValueOnce([
      { severity: "high" },
      { severity: "medium" },
      { severity: "medium" },
    ]);
    getCountryDatabaseReadiness.mockResolvedValueOnce({
      summary: {
        total: 3,
        ready: 1,
        degraded: 1,
        needsBackfill: 1,
        blocked: 0,
        averageScore: 71,
      },
      blockers: [
        {
          country: "Albania",
          status: "needs_backfill",
          score: 52,
          blockers: ["empty_country_database"],
          failingSources: [],
        },
      ],
      countries: [],
      checkedAt: now.toISOString(),
    });
    listAgentApiCapabilities.mockReturnValue([
      {
        id: "newsapi",
        label: "NewsAPI",
        status: "missing_credentials",
        envVars: ["NEWSAPI_API_KEY"],
        missingEnvVars: ["NEWSAPI_API_KEY"],
        configuredEnvVars: [],
        userAction: "Set key",
      },
      { id: "gdelt", label: "GDELT", status: "available", envVars: [], missingEnvVars: [], configuredEnvVars: [] },
    ]);
    listGlobalMonitoringAgents.mockReturnValue({
      regionalSupervisors: [
        { managedAgents: [{ id: "fr" }, { id: "de" }] },
        { managedAgents: [{ id: "ny" }] },
      ],
      crossFunctionalAgents: [{ id: "design" }],
    });

    const { buildAdminOperationsSummary } = await import("@/lib/admin-operations-summary");
    const summary = await buildAdminOperationsSummary({ now });

    expect(summary.checkedAt).toBe("2026-06-20T12:00:00.000Z");
    expect(summary.content.regulatoryUpdates).toMatchObject({
      total: 17,
      byStatus: {
        needs_review: 7,
        approved: 2,
        published: 3,
        rejected: 1,
        archived: 4,
      },
    });
    expect(summary.content.news).toMatchObject({ total: 10, public: 6, adminOnly: 4 });
    expect(summary.operations.sources).toMatchObject({
      total: 2,
      active: 1,
      byRuntimeState: { healthy: 1, degraded: 1, stale: 0, inactive: 1 },
    });
    expect(summary.operations.countryReadiness).toMatchObject({
      summary: {
        total: 3,
        ready: 1,
        degraded: 1,
        needsBackfill: 1,
        blocked: 0,
        averageScore: 71,
      },
      topBlockers: [
        {
          country: "Albania",
          status: "needs_backfill",
          score: 52,
          blockers: ["empty_country_database"],
          failingSources: [],
        },
      ],
    });
    expect(summary.operations.scanJobs.byStatus).toMatchObject({
      queued: 1,
      running: 1,
      partial_success: 1,
      failed: 1,
      succeeded: 0,
      cancelled: 0,
    });
    expect(summary.operations).toMatchObject({
      worker: {
        alive: true,
      },
      coverage: {
        state: "healthy",
        zeroSourceProfiles: [],
      },
    });
    expect(summary.agents).toMatchObject({
      regionalSupervisors: 2,
      managedAgents: 3,
      crossFunctionalAgents: 1,
    });
    expect(summary.agents.capabilities.missing).toEqual([
      {
        id: "newsapi",
        label: "NewsAPI",
        status: "missing_credentials",
        envVars: ["NEWSAPI_API_KEY"],
        missingEnvVars: ["NEWSAPI_API_KEY"],
        configuredEnvVars: [],
        userAction: "Set key",
      },
    ]);
  });
});
