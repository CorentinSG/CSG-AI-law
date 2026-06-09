import { describe, expect, it } from "vitest";

import {
  buildRegionalLiveSummary,
  filterRegionalLiveItems,
} from "@/content/ai-regulation/live-intelligence";
import type { NormalizedNewsItemRecord } from "@/content/ai-regulation/news";

function createItem(
  overrides: Partial<NormalizedNewsItemRecord>,
): NormalizedNewsItemRecord {
  return {
    id: "news-1",
    title: "Item",
    slug: "item",
    shortSummary: "summary",
    fullSummary: "full",
    detectedAt: "2026-05-31T10:00:00.000Z",
    eventDate: "2026-05-31",
    publicationDate: "2026-05-31",
    lastVerifiedAt: "2026-05-31T10:00:00.000Z",
    sourceName: "Official source",
    sourceUrl: "https://example.com",
    sourceType: "official_source",
    sourceReliability: "official_authority",
    sourceJurisdiction: "European Union",
    jurisdiction: "European Union",
    region: "Europe",
    countryOrState: "",
    legalArea: "AI governance",
    topicTags: [],
    authorityType: "Regulation",
    developmentType: "Regulation",
    verificationStatus: "official_verified",
    officialSourceFound: true,
    officialSourceUrl: "https://official.example.com",
    sourceReferences: [],
    corroboratingSources: [],
    exactDateOfInformation: "2026-05-31",
    datePrecision: "exact",
    citationQuality: "complete",
    publicVisibilityStatus: "public",
    reviewerNotes: "",
    relatedMonitorItemId: "upd-1",
    rawItemId: "raw-1",
    regulatoryUpdateId: "upd-1",
    createdAt: "2026-05-31T10:00:00.000Z",
    updatedAt: "2026-05-31T10:00:00.000Z",
    ...overrides,
  };
}

describe("live regional intelligence filters", () => {
  it("keeps Europe panel limited to Europe-visible items", () => {
    const items = [
      createItem({ id: "eu-1", region: "Europe" }),
      createItem({ id: "us-1", region: "North America", jurisdiction: "United States federal" }),
    ];

    const result = filterRegionalLiveItems(items, "Europe");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("eu-1");
  });

  it("keeps U.S. panel limited to U.S.-visible items", () => {
    const items = [
      createItem({ id: "eu-1", region: "Europe" }),
      createItem({ id: "us-1", region: "North America", jurisdiction: "United States federal" }),
    ];

    const result = filterRegionalLiveItems(items, "North America");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("us-1");
  });

  it("does not expose non-official discovery-only items in public live panels", () => {
    const items = [
      createItem({
        id: "discovery-1",
        sourceType: "informal_discovery_source",
        sourceReliability: "informal_discovery",
        verificationStatus: "discovery_only",
        officialSourceFound: false,
        relatedMonitorItemId: null,
      }),
    ];

    expect(filterRegionalLiveItems(items, "Europe")).toHaveLength(0);
  });

  it("summarizes visible regional live items conservatively", () => {
    const items = [
      createItem({ id: "eu-1", region: "Europe", relatedMonitorItemId: "upd-1" }),
      createItem({ id: "eu-2", region: "Europe", relatedMonitorItemId: null }),
      createItem({ id: "us-1", region: "North America" }),
    ];

    expect(buildRegionalLiveSummary(items, "Europe")).toEqual({
      totalVisible: 2,
      officialLike: 2,
      withMonitorItem: 1,
    });
  });
});
