import { describe, expect, it, vi, beforeEach } from "vitest";
import { syncLegalIntelligenceDataStewardFindings } from "@/agents/ai-regulation/dataSteward";

const { upsertDataQualityFinding } = vi.hoisted(() => ({
  upsertDataQualityFinding: vi.fn(),
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: {
    upsertDataQualityFinding,
  },
}));

describe("syncLegalIntelligenceDataStewardFindings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists source, discovery, citation, and coverage findings", async () => {
    const result = await syncLegalIntelligenceDataStewardFindings({
      generatedAt: "2026-05-31T18:00:00.000Z",
      summary: {
        sourceFindings: 1,
        sourceAttention: 1,
        europeCoverageFindings: 1,
        usCoverageFindings: 0,
        citationWarnings: 1,
        discoveryLeadsNeedingVerification: 1,
        highPriorityReviewItems: 2,
        staleOrDueCoverageItems: 1,
        europeMaintenanceItems: 1,
      },
      latestScheduledScan: null,
      sources: [
        {
          sourceId: "src-1",
          sourceName: "Example Source",
          active: true,
          freshnessStatus: "stale",
          lastReviewedAt: "2026-05-01T00:00:00.000Z",
          latestResponseStatus: 403,
          latestScanStatus: "failed",
          itemsFetched: 0,
          newItemsDetected: 0,
          duplicatesDetected: 0,
          parserWarnings: ["Parser issue"],
          accessibilityWarnings: ["Access blocked"],
          reliabilityNotes: ["Needs review"],
          reviewPriority: "high",
        },
      ],
      europeCoverage: [
        {
          id: "eu-country-france",
          area: "europe",
          entityType: "country",
          title: "France",
          status: "needs_review",
          summary: "Baseline under review",
          sourceCount: 0,
          warnings: ["No official source verified yet"],
          quality: {
            sourceCompleteness: "missing_official_source",
            citationQuality: "missing_official_source",
            verificationStatus: "needs_review",
            freshnessStatus: "stale",
            confidenceLevel: "needs_review",
            publicReadiness: "needs_review",
            publicationEligible: false,
            missingFields: ["implementationStatus"],
            staleWarnings: ["Review overdue"],
            sourceAccessibilityWarnings: [],
            reviewPriority: "high",
          },
        },
      ],
      usCoverage: [],
      citationFindings: [
        {
          updateId: "upd-1",
          title: "Update",
          status: "published",
          region: "Europe",
          jurisdiction: "European Union",
          citationQuality: "partial",
          publicationEligible: false,
          warnings: ["Missing article pinpoint"],
          sourceCount: 1,
          href: "/admin/ai-regulation/upd-1",
        },
      ],
      discoveryFindings: [
        {
          discoveryLeadId: "lead-1",
          rawItemId: "raw-1",
          headline: "Discovery lead",
          detectedAt: "2026-05-31T18:00:00.000Z",
          discoverySourceUrl: "https://example.com/discovery",
          outboundUrl: "https://example.com/outbound",
          verificationStatus: "needs_official_source",
          officialSourceFound: false,
          corroboratingSourceCount: 0,
          publicVisibilityAllowed: false,
          reviewerNotes: "Needs official verification.",
          reviewPriority: "high",
        },
      ],
      reviewQueue: [],
      europeMaintenanceQueue: [],
    });

    expect(result.syncedCount).toBe(4);
    expect(upsertDataQualityFinding).toHaveBeenCalledTimes(4);
    expect(upsertDataQualityFinding).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "source",
        entityId: "src-1",
        findingType: "source_health_attention",
      }),
    );
  });
  // A scan that has already succeeded and persisted its results must not be
  // reported as failed because this bookkeeping write hit the pooler.
  describe("resilience", () => {
    function minimalReport(sourceCount: number) {
      return {
        generatedAt: "2026-08-03T18:00:00.000Z",
        summary: {
          sourceFindings: sourceCount,
          sourceAttention: sourceCount,
          europeCoverageFindings: 0,
          usCoverageFindings: 0,
          citationWarnings: 0,
          discoveryLeadsNeedingVerification: 0,
          highPriorityReviewItems: 0,
          staleOrDueCoverageItems: 0,
          europeMaintenanceItems: 0,
        },
        latestScheduledScan: null,
        sources: Array.from({ length: sourceCount }, (_, index) => ({
          sourceId: `src-${index}`,
          sourceName: `Source ${index}`,
          active: true,
          freshnessStatus: "stale" as const,
          reviewPriority: "high" as const,
          lastReviewedAt: "2026-05-01T00:00:00.000Z",
          lastScannedAt: null,
          latestResponseStatus: 200,
          latestScanStatus: "success",
          itemsFetched: 0,
          newItemsDetected: 0,
          duplicatesDetected: 0,
          accessibilityWarnings: ["stale source"],
          parserWarnings: [],
          reliabilityNotes: [],
        })),
        europeCoverage: [],
        usCoverage: [],
        citationFindings: [],
        discoveryFindings: [],
        reviewQueue: [],
        europeMaintenanceQueue: [],
      } as unknown as Parameters<typeof syncLegalIntelligenceDataStewardFindings>[0];
    }

    it("reports a failed write instead of throwing", async () => {
      upsertDataQualityFinding
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("upstream connect error: connection timeout"))
        .mockResolvedValue({});

      const result = await syncLegalIntelligenceDataStewardFindings(minimalReport(3));

      expect(result.syncedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.error).toContain("connection timeout");
    });

    // The pooler answered "upstream connect error" precisely because every
    // finding was upserted at once.
    it("never opens more than a handful of writes at a time", async () => {
      let inFlight = 0;
      let peak = 0;
      upsertDataQualityFinding.mockImplementation(async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return {};
      });

      const result = await syncLegalIntelligenceDataStewardFindings(minimalReport(20));

      expect(result.syncedCount).toBe(20);
      expect(peak).toBeLessThanOrEqual(4);
    });
  });
});
