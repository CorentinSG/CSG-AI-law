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
});
