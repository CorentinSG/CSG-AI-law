import { afterEach, describe, expect, it, vi } from "vitest";

const updateRepository = {
  listUpdatesPage: vi.fn(),
  getUpdate: vi.fn(),
  updateReviewStatus: vi.fn(),
};

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository,
}));

function makeUpdate(overrides: Record<string, unknown>) {
  return {
    id: "upd",
    title: "Untitled",
    sourceName: "Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "France",
    legalArea: "AI governance",
    authorityType: "Other",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    publicationDate: null,
    detectedDate: "2026-06-20T00:00:00.000Z",
    status: "needs_review",
    ...overrides,
  };
}

describe("admin review batch helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a prioritized needs-review queue", async () => {
    updateRepository.listUpdatesPage.mockResolvedValueOnce({
      total: 3,
      items: [
        makeUpdate({ id: "low", title: "Low", importanceLevel: "low", confidenceLevel: "low" }),
        makeUpdate({
          id: "official",
          title: "Official",
          importanceLevel: "high",
          confidenceLevel: "high",
          authorityType: "Binding law",
        }),
        makeUpdate({ id: "medium", title: "Medium", importanceLevel: "medium" }),
      ],
    });

    const { listPrioritizedReviewQueue } = await import("@/lib/admin-review-batch");
    const queue = await listPrioritizedReviewQueue({ limit: 2 });

    expect(updateRepository.listUpdatesPage).toHaveBeenCalledWith(
      { status: "needs_review" },
      { limit: 6, offset: 0 },
    );
    expect(queue.total).toBe(3);
    expect(queue.items.map((item) => item.id)).toEqual(["official", "medium"]);
    expect(queue.items[0].priorityScore).toBeGreaterThan(queue.items[1].priorityScore);
    expect(queue.items[0].priorityReasons).toEqual(
      expect.arrayContaining(["official_authority_type", "high_confidence"]),
    );
  });

  it("transitions unique ids and reports per-item failures", async () => {
    updateRepository.getUpdate
      .mockResolvedValueOnce(makeUpdate({ id: "a", status: "needs_review" }))
      .mockResolvedValueOnce(null);
    updateRepository.updateReviewStatus.mockResolvedValueOnce(
      makeUpdate({ id: "a", status: "approved" }),
    );

    const { batchTransitionReviewStatus } = await import("@/lib/admin-review-batch");
    const result = await batchTransitionReviewStatus({
      ids: ["a", "a", "missing"],
      targetStatus: "approved",
      reviewer: "Ops",
    });

    expect(updateRepository.updateReviewStatus).toHaveBeenCalledOnce();
    expect(updateRepository.updateReviewStatus).toHaveBeenCalledWith("a", "approved", "Ops");
    expect(result).toMatchObject({
      requested: 2,
      succeeded: 1,
      failed: 1,
      targetStatus: "approved",
    });
    expect(result.results).toEqual([
      { id: "a", status: "succeeded", previousStatus: "needs_review", nextStatus: "approved" },
      { id: "missing", status: "failed", error: "Regulatory update not found." },
    ]);
  });
});
