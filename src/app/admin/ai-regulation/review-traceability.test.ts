import { describe, expect, it } from "vitest";

import { buildAdminReviewTraceability } from "@/app/admin/ai-regulation/review-traceability";
import { getCitationReferences } from "@/agents/ai-regulation/citations";
import { buildSeedDataset } from "@/db/seed/seed-profiles";

describe("review-traceability", () => {
  it("builds an admin review trace with NY Courts checklist coverage", () => {
    const dataset = buildSeedDataset("demo");
    const update = dataset.updates.find((item) => item.id === "upd-026");
    const rawItem = dataset.rawItems.find((item) => item.id === "raw-028");
    const source = dataset.sources.find((item) => item.id === "src-nycourts-part-161-ai");

    expect(update).toBeTruthy();
    expect(rawItem).toBeTruthy();
    expect(source).toBeTruthy();

    const sourceReferences = getCitationReferences({
      update: update!,
      rawItem: rawItem!,
      source: source!,
    });
    const trace = buildAdminReviewTraceability({
      update: update!,
      rawItem: rawItem!,
      source: source!,
      sourceReferences,
    });

    expect(trace.sourceId).toBe("src-nycourts-part-161-ai");
    expect(trace.officialSource).toBe(true);
    expect(trace.effectiveDate).toBe("2026-06-01");
    expect(trace.publicationStatus).toBe("public");
    expect(trace.checklist).toHaveLength(9);
    expect(trace.checklist.some((item) => item.question.includes("civil and criminal cases"))).toBe(
      true,
    );
    expect(trace.checklist.some((item) => item.question.includes("independent attorney review"))).toBe(
      true,
    );
  });

  it("keeps official auto-published production-safe items public", () => {
    const dataset = buildSeedDataset("production_safe");
    const update = dataset.updates.find((item) => item.id === "upd-026");
    const rawItem = dataset.rawItems.find((item) => item.id === "raw-028");
    const source = dataset.sources.find((item) => item.id === "src-nycourts-part-161-ai");

    const sourceReferences = getCitationReferences({
      update: update!,
      rawItem: rawItem!,
      source: source!,
    });
    const trace = buildAdminReviewTraceability({
      update: update!,
      rawItem: rawItem!,
      source: source!,
      sourceReferences,
    });

    expect(trace.reviewStatus).toBe("published");
    expect(trace.publicationStatus).toBe("public");
    expect(trace.reviewRequired).toBe(false);
  });
});
