import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import type { ReviewStatus } from "@/db/schema";

export const batchReviewTargetStatuses = ["approved", "rejected", "archived"] as const;
export type BatchReviewTargetStatus = (typeof batchReviewTargetStatuses)[number];

const IMPORTANCE_SCORE: Record<AiRegulatoryUpdate["importanceLevel"], number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
};

const CONFIDENCE_SCORE: Record<AiRegulatoryUpdate["confidenceLevel"], number> = {
  high: 10,
  medium: 5,
  low: 0,
};

const OFFICIAL_AUTHORITY_TYPES = new Set([
  "Binding law",
  "Regulation",
  "Agency guidance",
  "Enforcement action",
]);

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getPriorityScore(update: AiRegulatoryUpdate) {
  const authorityScore = update.authorityType && OFFICIAL_AUTHORITY_TYPES.has(update.authorityType) ? 25 : 0;
  const recentSignal = Math.min(10, Math.floor(toTimestamp(update.detectedDate) / 86_400_000) % 10);
  return (
    IMPORTANCE_SCORE[update.importanceLevel] +
    CONFIDENCE_SCORE[update.confidenceLevel] +
    authorityScore +
    recentSignal
  );
}

function toQueueItem(update: AiRegulatoryUpdate) {
  return {
    id: update.id,
    title: update.title,
    sourceName: update.sourceName,
    jurisdiction: update.jurisdiction,
    region: update.region,
    country: update.country,
    legalArea: update.legalArea,
    authorityType: update.authorityType ?? null,
    importanceLevel: update.importanceLevel,
    confidenceLevel: update.confidenceLevel,
    publicationDate: update.publicationDate,
    detectedDate: update.detectedDate,
    status: update.status,
    priorityScore: getPriorityScore(update),
  };
}

export async function listPrioritizedReviewQueue(options?: { limit?: number }) {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const page = await updateRepository.listUpdatesPage(
    { status: "needs_review" },
    { limit: Math.max(limit * 3, limit), offset: 0 },
  );
  const items = page.items
    .map(toQueueItem)
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        toTimestamp(b.detectedDate) - toTimestamp(a.detectedDate) ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit);

  return {
    total: page.total,
    limit,
    items,
  };
}

export interface BatchReviewInput {
  ids: string[];
  targetStatus: BatchReviewTargetStatus;
  reviewer?: string;
}

export async function batchTransitionReviewStatus(input: BatchReviewInput) {
  const ids = [...new Set(input.ids.map((id) => id.trim()).filter(Boolean))].slice(0, 100);
  const reviewer = input.reviewer?.trim() || "Admin Batch Reviewer";

  const results = [];
  for (const id of ids) {
    try {
      const before = await updateRepository.getUpdate(id);
      if (!before) {
        results.push({
          id,
          status: "failed" as const,
          error: "Regulatory update not found.",
        });
        continue;
      }
      const updated = await updateRepository.updateReviewStatus(
        id,
        input.targetStatus as ReviewStatus,
        reviewer,
      );
      results.push({
        id,
        status: "succeeded" as const,
        previousStatus: before.status,
        nextStatus: updated.status,
      });
    } catch (error) {
      results.push({
        id,
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    requested: ids.length,
    succeeded: results.filter((result) => result.status === "succeeded").length,
    failed: results.filter((result) => result.status === "failed").length,
    targetStatus: input.targetStatus,
    results,
  };
}
