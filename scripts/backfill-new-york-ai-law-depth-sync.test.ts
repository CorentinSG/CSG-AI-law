import { describe, expect, it } from "vitest";

import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import type { RegulatoryUpdateDraftInput } from "@/db/repository-types";
import {
  collectAllPages,
  diffEditableUpdate,
} from "./backfill-new-york-ai-law-depth-sync";

function update(overrides: Partial<AiRegulatoryUpdate> = {}): AiRegulatoryUpdate {
  return {
    id: "update-1",
    sourceId: "new-york-ai-law-depth",
    rawItemId: "raw-1",
    title: "RAISE Act",
    sourceName: "New York Governor",
    sourceUrl: "https://example.test/raise",
    jurisdiction: "New York",
    region: "North America",
    country: "United States",
    developmentType: "Statute",
    legalArea: "AI governance",
    authorityType: "Binding law",
    publicationDate: "2025-12-01",
    detectedDate: "2026-07-19",
    oneSentenceSummary: "Old",
    summary: "Old",
    whatHappened: "Old",
    whyItMatters: "Old",
    practicalImpact: "Old",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "Old",
    importanceLevel: "high",
    confidenceLevel: "high",
    tags: ["new-york-ai-law-watch"],
    status: "published",
    reviewedBy: "system:auto-official-source",
    reviewedAt: "2026-07-19T04:20:00.000Z",
    publishedAt: "2026-07-19T04:20:00.000Z",
    createdAt: "2026-07-19T04:20:00.000Z",
    updatedAt: "2026-07-19T04:20:00.000Z",
    ...overrides,
  };
}

function desired(overrides: Partial<RegulatoryUpdateDraftInput> = {}): RegulatoryUpdateDraftInput {
  const existing = update();
  return {
    sourceId: existing.sourceId,
    rawItemId: existing.rawItemId,
    title: existing.title,
    sourceName: existing.sourceName,
    sourceUrl: existing.sourceUrl,
    jurisdiction: existing.jurisdiction,
    region: existing.region,
    country: existing.country,
    developmentType: existing.developmentType,
    legalArea: existing.legalArea,
    authorityType: existing.authorityType,
    publicationDate: existing.publicationDate,
    detectedDate: existing.detectedDate,
    oneSentenceSummary: existing.oneSentenceSummary,
    summary: existing.summary,
    whatHappened: existing.whatHappened,
    whyItMatters: existing.whyItMatters,
    practicalImpact: existing.practicalImpact,
    affectedParties: existing.affectedParties,
    keyObligations: existing.keyObligations,
    complianceDeadlines: existing.complianceDeadlines,
    enforcementRisk: existing.enforcementRisk,
    importanceLevel: existing.importanceLevel,
    confidenceLevel: existing.confidenceLevel,
    tags: existing.tags,
    status: existing.status,
    reviewedBy: existing.reviewedBy,
    reviewedAt: existing.reviewedAt,
    publishedAt: existing.publishedAt,
    ...overrides,
  };
}

describe("diffEditableUpdate", () => {
  it("returns a complete editable snapshot when a published value changed", () => {
    const existing = update();
    const patch = diffEditableUpdate(
      existing,
      desired({
        publicationDate: "2025-12-19",
        summary: "Corrected RAISE Act summary",
      }),
    );

    expect(patch).toMatchObject({
      publicationDate: "2025-12-19",
      summary: "Corrected RAISE Act summary",
      affectedParties: existing.affectedParties,
      keyObligations: existing.keyObligations,
      complianceDeadlines: existing.complianceDeadlines,
      tags: existing.tags,
    });
  });

  it("returns null when the published update already matches the corpus", () => {
    const existing = update();
    expect(diffEditableUpdate(existing, desired())).toBeNull();
  });
});

describe("collectAllPages", () => {
  it("collects every page instead of trusting the first PostgREST window", async () => {
    const calls: number[] = [];
    const items = await collectAllPages(async (offset, limit) => {
      calls.push(offset);
      const all = ["a", "b", "c", "d", "e"];
      const pageItems = all.slice(offset, offset + limit);
      return {
        items: pageItems,
        total: all.length,
        limit,
        offset,
        hasMore: offset + pageItems.length < all.length,
      };
    }, 2);

    expect(items).toEqual(["a", "b", "c", "d", "e"]);
    expect(calls).toEqual([0, 2, 4]);
  });
});
