import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = {
  listSources: vi.fn(),
  listDiscoveryLeadsPage: vi.fn(),
  listDiscoveryLeads: vi.fn(),
  getDiscoveryLeadByRawItemId: vi.fn(),
  getRawRegulatoryItemById: vi.fn(),
  getSourceById: vi.fn(),
  getRawRegulatoryItemsByIds: vi.fn(),
  listRawRegulatoryItems: vi.fn(),
};

vi.mock("@/db/repository", () => ({
  getAiRegulationRepository: () => repository,
}));

import {
  findDiscoveryLeadRecordByRawItemId,
  loadDiscoveryLeadRecordsBySourceId,
  loadDiscoveryLeadRecordsPage,
} from "@/agents/ai-regulation/utils/discovery-lead-records";

describe("discovery lead record helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hydrates only the raw items attached to the dedicated page slice", async () => {
    repository.listSources.mockResolvedValue([
      { id: "src-a", name: "Source A" },
      { id: "src-b", name: "Source B" },
    ]);
    repository.listDiscoveryLeadsPage.mockResolvedValue({
      items: [
        {
          id: "lead-1",
          rawItemId: "raw-2",
          sourceId: "src-a",
          headline: "Lead 1",
          discoverySourceUrl: "https://example.com/1",
          outboundUrl: "https://example.com/1",
          detectedAt: "2026-06-05T20:00:00.000Z",
          possibleJurisdiction: null,
          possibleTopic: null,
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
          createdAt: "2026-06-05T20:00:00.000Z",
          updatedAt: "2026-06-05T20:00:00.000Z",
        },
      ],
      total: 1,
      limit: 25,
      offset: 0,
      hasMore: false,
    });
    repository.getRawRegulatoryItemsByIds.mockResolvedValue([
      {
        id: "raw-2",
        sourceId: "src-a",
        rawTitle: "Raw 2",
        rawUrl: "https://official.example/raw-2",
        rawText: "raw text",
        rawMetadata: {},
        detectedAt: "2026-06-05T20:00:00.000Z",
        hash: "hash-2",
        duplicateOf: null,
        processingStatus: "processed",
        createdAt: "2026-06-05T20:00:00.000Z",
        updatedAt: "2026-06-05T20:00:00.000Z",
      },
    ]);

    const page = await loadDiscoveryLeadRecordsPage({ limit: 25, offset: 0 });

    expect(repository.getRawRegulatoryItemsByIds).toHaveBeenCalledWith(["raw-2"]);
    expect(page.items[0]?.rawItem?.id).toBe("raw-2");
    expect(page.total).toBe(1);
  });

  it("filters dedicated records by source before hydrating raw items", async () => {
    repository.listSources.mockResolvedValue([
      { id: "src-a", name: "Source A" },
      { id: "src-b", name: "Source B" },
    ]);
    repository.listDiscoveryLeads.mockResolvedValue([
      {
        id: "lead-a",
        rawItemId: "raw-a",
        sourceId: "src-a",
        headline: "Lead A",
        discoverySourceUrl: "https://example.com/a",
        outboundUrl: "https://example.com/a",
        detectedAt: "2026-06-05T20:00:00.000Z",
        possibleJurisdiction: null,
        possibleTopic: null,
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
        createdAt: "2026-06-05T20:00:00.000Z",
        updatedAt: "2026-06-05T20:00:00.000Z",
      },
      {
        id: "lead-b",
        rawItemId: "raw-b",
        sourceId: "src-b",
        headline: "Lead B",
        discoverySourceUrl: "https://example.com/b",
        outboundUrl: "https://example.com/b",
        detectedAt: "2026-06-05T20:00:00.000Z",
        possibleJurisdiction: null,
        possibleTopic: null,
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
        createdAt: "2026-06-05T20:00:00.000Z",
        updatedAt: "2026-06-05T20:00:00.000Z",
      },
    ]);
    repository.getRawRegulatoryItemsByIds.mockResolvedValue([
      {
        id: "raw-b",
        sourceId: "src-b",
        rawTitle: "Raw B",
        rawUrl: "https://official.example/raw-b",
        rawText: "raw text",
        rawMetadata: {},
        detectedAt: "2026-06-05T20:00:00.000Z",
        hash: "hash-b",
        duplicateOf: null,
        processingStatus: "processed",
        createdAt: "2026-06-05T20:00:00.000Z",
        updatedAt: "2026-06-05T20:00:00.000Z",
      },
    ]);

    const records = await loadDiscoveryLeadRecordsBySourceId("src-b", { limit: 50 });

    expect(repository.getRawRegulatoryItemsByIds).toHaveBeenCalledWith(["raw-b"]);
    expect(records).toHaveLength(1);
    expect(records[0]?.lead.sourceId).toBe("src-b");
  });

  it("resolves a dedicated lead directly by raw item id without loading the full backlog", async () => {
    repository.getDiscoveryLeadByRawItemId.mockResolvedValue({
      id: "lead-direct",
      rawItemId: "raw-direct",
      sourceId: "src-a",
      headline: "Direct lead",
      discoverySourceUrl: "https://example.com/direct",
      outboundUrl: "https://example.com/direct",
      detectedAt: "2026-06-05T20:00:00.000Z",
      possibleJurisdiction: null,
      possibleTopic: null,
      possibleLegalArea: null,
      possibleAuthorityType: null,
      status: "official_source_found",
      officialSourceFound: true,
      officialSourceUrl: "https://official.example/direct",
      corroboratingSourceCount: 0,
      corroboratingSourceUrls: [],
      convertedUpdateId: null,
      reviewerNotes: null,
      lastVerifiedAt: null,
      staleAt: null,
      publicVisibilityAllowed: false,
      createdAt: "2026-06-05T20:00:00.000Z",
      updatedAt: "2026-06-05T20:00:00.000Z",
    });
    repository.getRawRegulatoryItemById.mockResolvedValue({
      id: "raw-direct",
      sourceId: "src-a",
      rawTitle: "Direct raw item",
      rawUrl: "https://official.example/direct",
      rawText: "raw text",
      rawMetadata: {},
      detectedAt: "2026-06-05T20:00:00.000Z",
      hash: "hash-direct",
      duplicateOf: null,
      processingStatus: "processed",
      createdAt: "2026-06-05T20:00:00.000Z",
      updatedAt: "2026-06-05T20:00:00.000Z",
    });
    repository.getSourceById.mockResolvedValue({ id: "src-a", name: "Source A" });

    const record = await findDiscoveryLeadRecordByRawItemId("raw-direct");

    expect(repository.getDiscoveryLeadByRawItemId).toHaveBeenCalledWith("raw-direct");
    expect(repository.listDiscoveryLeadsPage).not.toHaveBeenCalled();
    expect(record?.lead.id).toBe("lead-direct");
  });
});
