import { beforeEach, describe, expect, it, vi } from "vitest";

const updateRepository = {
  updateRawItemMetadata: vi.fn(),
  addVerificationAttempt: vi.fn(),
  addProcessingLog: vi.fn(),
};
const discoveryLeadRepository = {
  updateDiscoveryLead: vi.fn(),
};
const loadDiscoveryLeadRecords = vi.fn();

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository,
}));

vi.mock("@/agents/ai-regulation/utils/discovery-lead-records", () => ({
  loadDiscoveryLeadRecords,
}));

vi.mock("@/db/repository", () => ({
  getAiRegulationRepository: () => discoveryLeadRepository,
}));

describe("runRecurringVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks official and corroborating URLs for dedicated discovery leads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    loadDiscoveryLeadRecords.mockResolvedValueOnce([
      {
        lead: {
          id: "lead-1",
          rawItemId: "raw-1",
          sourceId: "src-discovery",
          headline: "Lead",
          discoverySourceUrl: "https://aiweekly.co/ai-news-today",
          outboundUrl: "https://example.com/non-official",
          detectedAt: "2026-05-01T00:00:00.000Z",
          possibleJurisdiction: "OECD",
          possibleTopic: "AI governance",
          possibleLegalArea: null,
          possibleAuthorityType: null,
          status: "unresolved",
          officialSourceFound: false,
          officialSourceUrl: "https://example.gov/official",
          corroboratingSourceCount: 0,
          corroboratingSourceUrls: ["https://example.org/corroborating"],
          convertedUpdateId: null,
          reviewerNotes: "Needs verification",
          lastVerifiedAt: null,
          staleAt: null,
          publicVisibilityAllowed: false,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
        rawItem: {
          id: "raw-1",
          sourceId: "src-discovery",
          rawTitle: "Lead",
          rawUrl: "https://aiweekly.co/ai-news-today",
          rawText: "Lead",
          rawMetadata: {
            discoveryLead: true,
            possibleOfficialSourceUrl: "https://example.gov/official",
            corroboratingSourceUrls: ["https://example.org/corroborating"],
            verification: {
              initialDetectionSource: "AI Weekly / AI News Today",
              initialSourceOfficial: false,
              initialSourceType: "discovery_source",
              sourceUrl: "https://aiweekly.co/ai-news-today",
              detectedAt: "2026-05-01T00:00:00.000Z",
              lastVerifiedAt: null,
              verificationStatus: "needs_official_source",
              officialSourceFound: false,
              officialSourceUrl: "https://example.gov/official",
              corroboratingSourcesCount: 0,
              corroboratingSourceUrls: ["https://example.org/corroborating"],
              confidenceLevel: "low",
              reviewerNotes: "Needs verification",
              publicVisibilityAllowed: false,
              nextSuggestedVerificationSource: "Check official source",
              notPublishableReason: "Needs official source",
              stale: false,
            },
          },
          detectedAt: "2026-05-01T00:00:00.000Z",
          hash: "raw-1",
          duplicateOf: null,
          processingStatus: "new",
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
        source: {
          id: "src-discovery",
          name: "AI Weekly / AI News Today",
          jurisdiction: "OECD",
          region: "International",
          country: "International",
          sourceUrl: "https://aiweekly.co/ai-news-today",
          sourceType: "static_page",
          scanFrequency: "daily",
          active: true,
          lastScannedAt: null,
          notes: "discovery",
          reliabilityLevel: "low",
          preferredExtractionMethod: "html_static",
          config: {
            sourceCategory: "discovery_source",
          },
          createdAt: "2026-05-31T00:00:00.000Z",
          updatedAt: "2026-05-31T00:00:00.000Z",
        },
        verification: null,
        storageMode: "dedicated",
      },
    ]);

    const { runRecurringVerification } = await import(
      "@/agents/ai-regulation/processors/recurringVerification"
    );
    const summary = await runRecurringVerification({ limit: 5 });

    expect(summary.checked).toBe(1);
    expect(summary.officialSourceFound).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(updateRepository.updateRawItemMetadata).toHaveBeenCalledWith(
      "raw-1",
      expect.objectContaining({
        possibleOfficialSourceFound: true,
        corroboratingSourceFound: true,
        discoveryVerificationStatus: "official_source_found",
      }),
    );
    expect(updateRepository.addVerificationAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptType: "corroboration_check",
        sourceUrl: "https://example.org/corroborating",
        resultStatus: "corroborated",
      }),
    );
    expect(discoveryLeadRepository.updateDiscoveryLead).toHaveBeenCalledWith(
      "lead-1",
      expect.objectContaining({
        status: "official_source_found",
        officialSourceFound: true,
        corroboratingSourceCount: 1,
      }),
    );
  });

  it("supports restricting recurring verification to France-only sources", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    loadDiscoveryLeadRecords.mockResolvedValueOnce([
      {
        lead: {
          id: "lead-fr",
          rawItemId: null,
          sourceId: "src-france",
          headline: "France official item",
          discoverySourceUrl: "https://www.cnil.fr/fr/example",
          outboundUrl: "https://www.cnil.fr/fr/example",
          detectedAt: "2026-05-01T00:00:00.000Z",
          possibleJurisdiction: "France",
          possibleTopic: "AI",
          possibleLegalArea: null,
          possibleAuthorityType: null,
          status: "unresolved",
          officialSourceFound: false,
          officialSourceUrl: null,
          corroboratingSourceCount: 0,
          corroboratingSourceUrls: [],
          convertedUpdateId: null,
          reviewerNotes: null,
          lastVerifiedAt: null,
          staleAt: null,
          publicVisibilityAllowed: false,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
        rawItem: null,
        source: {
          id: "src-france",
          name: "CNIL AI and Algorithms",
          jurisdiction: "France",
          region: "Europe",
          country: "France",
          sourceUrl: "https://www.cnil.fr/fr/rss.xml",
          sourceType: "RSS",
          scanFrequency: "daily",
          active: true,
          lastScannedAt: null,
          notes: "official",
          reliabilityLevel: "high",
          preferredExtractionMethod: "rss",
          config: {},
          createdAt: "2026-05-31T00:00:00.000Z",
          updatedAt: "2026-05-31T00:00:00.000Z",
        },
        verification: null,
        storageMode: "dedicated",
      },
      {
        lead: {
          id: "lead-discovery",
          rawItemId: null,
          sourceId: "src-discovery",
          headline: "Discovery lead",
          discoverySourceUrl: "https://aiweekly.co/ai-news-today",
          outboundUrl: "https://example.gov/official",
          detectedAt: "2026-05-01T00:00:00.000Z",
          possibleJurisdiction: "France",
          possibleTopic: "AI",
          possibleLegalArea: null,
          possibleAuthorityType: null,
          status: "unresolved",
          officialSourceFound: false,
          officialSourceUrl: "https://example.gov/official",
          corroboratingSourceCount: 0,
          corroboratingSourceUrls: [],
          convertedUpdateId: null,
          reviewerNotes: null,
          lastVerifiedAt: null,
          staleAt: null,
          publicVisibilityAllowed: false,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
        rawItem: null,
        source: {
          id: "src-discovery",
          name: "AI Weekly / AI News Today",
          jurisdiction: "OECD",
          region: "International",
          country: "International",
          sourceUrl: "https://aiweekly.co/ai-news-today",
          sourceType: "static_page",
          scanFrequency: "daily",
          active: true,
          lastScannedAt: null,
          notes: "discovery",
          reliabilityLevel: "low",
          preferredExtractionMethod: "html_static",
          config: {
            sourceCategory: "discovery_source",
          },
          createdAt: "2026-05-31T00:00:00.000Z",
          updatedAt: "2026-05-31T00:00:00.000Z",
        },
        verification: null,
        storageMode: "dedicated",
      },
    ]);

    const { runRecurringVerification } = await import(
      "@/agents/ai-regulation/processors/recurringVerification"
    );
    const summary = await runRecurringVerification({
      limit: 5,
      sourceFilter: (source) => source.country === "France",
    });

    expect(summary.checked).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(updateRepository.updateRawItemMetadata).not.toHaveBeenCalled();
    expect(discoveryLeadRepository.updateDiscoveryLead).not.toHaveBeenCalled();
  });
});
