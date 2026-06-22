import { describe, expect, it, vi } from "vitest";

import type { AiRegulatoryUpdate, RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import type { NewsItemRecord } from "@/agents/ai-regulation/governance";
import type { AiRegulationRepository } from "@/db/repository-types";
import { backfillNewsItemsFromUpdates } from "@/lib/news-backfill";

function update(overrides: Partial<AiRegulatoryUpdate> = {}): AiRegulatoryUpdate {
  return {
    id: "upd-1",
    sourceId: "src-1",
    rawItemId: "raw-1",
    title: "Official AI law update",
    sourceName: "Federal Register",
    sourceUrl: "https://www.federalregister.gov/documents/example",
    jurisdiction: "United States federal",
    region: "North America",
    country: "United States",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    publicationDate: "2026-06-01",
    detectedDate: "2026-06-02T00:00:00.000Z",
    oneSentenceSummary: "An official legal update was detected.",
    summary: "An official legal update was detected from a primary source.",
    whatHappened: "The agency published guidance.",
    whyItMatters: "It matters for AI governance.",
    practicalImpact: "Teams should review it.",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "Needs review.",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    tags: ["AI governance", "regulation"],
    status: "needs_review",
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

function rawItem(overrides: Partial<RawRegulatoryItem> = {}): RawRegulatoryItem {
  return {
    id: "raw-1",
    sourceId: "src-1",
    rawTitle: "Official AI law update",
    rawUrl: "https://www.federalregister.gov/documents/example",
    rawText: "Official metadata.",
    rawMetadata: {
      sourceReferences: [
        {
          sourceRole: "primary",
          title: "Official AI law update",
          institution: "Federal Register",
          url: "https://www.federalregister.gov/documents/example",
          sourceType: "official",
          authorityType: "Agency guidance",
          publicationDate: "2026-06-01",
          retrievedAt: "2026-06-02T00:00:00.000Z",
          lastVerifiedAt: "2026-06-02T00:00:00.000Z",
          reliabilityLevel: "high",
          verificationStatus: "verified",
        },
      ],
    },
    detectedAt: "2026-06-02T00:00:00.000Z",
    hash: "hash",
    duplicateOf: null,
    processingStatus: "processed",
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

function source(overrides: Partial<RegulationSource> = {}): RegulationSource {
  return {
    id: "src-1",
    name: "Federal Register",
    jurisdiction: "United States federal",
    region: "North America",
    country: "United States",
    sourceUrl: "https://www.federalregister.gov/",
    sourceType: "API",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "Official source.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "api",
    config: {},
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function repository(updates: AiRegulatoryUpdate[]) {
  const upsertNewsItem = vi.fn(async (input) => ({
    id: `news-${input.regulatoryUpdateId}`,
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...input,
  }) as NewsItemRecord);

  return {
    listRegulatoryUpdates: vi.fn(async () => updates),
    getRawRegulatoryItemById: vi.fn(async () => rawItem()),
    getSourceById: vi.fn(async () => source()),
    upsertNewsItem,
  } as unknown as AiRegulationRepository;
}

describe("backfillNewsItemsFromUpdates", () => {
  it("upserts public and admin-only news items while skipping terminal statuses", async () => {
    const repo = repository([
      update({ id: "upd-public", rawItemId: "raw-public" }),
      update({ id: "upd-archived", rawItemId: "raw-archived", status: "archived" }),
      update({ id: "upd-rejected", rawItemId: "raw-rejected", status: "rejected" }),
    ]);

    const result = await backfillNewsItemsFromUpdates(repo);

    expect(result.scanned).toBe(3);
    expect(result.upserted).toBe(1);
    expect(result.publicItems).toBe(1);
    expect(result.skippedTerminalStatus).toBe(2);
    expect(repo.upsertNewsItem).toHaveBeenCalledOnce();
  });
});
