import { buildNewsItemFromUpdate } from "@/content/ai-regulation/news";
import type { AiRegulationRepository } from "@/db/repository-types";

export interface NewsBackfillSummary {
  scanned: number;
  upserted: number;
  publicItems: number;
  adminOnlyItems: number;
  skippedTerminalStatus: number;
  missingRawItems: number;
  missingSources: number;
}

const TERMINAL_STATUSES = new Set(["archived", "rejected"]);

export async function backfillNewsItemsFromUpdates(
  repository: AiRegulationRepository,
): Promise<NewsBackfillSummary> {
  const updates = await repository.listRegulatoryUpdates(undefined, "admin");
  const summary: NewsBackfillSummary = {
    scanned: updates.length,
    upserted: 0,
    publicItems: 0,
    adminOnlyItems: 0,
    skippedTerminalStatus: 0,
    missingRawItems: 0,
    missingSources: 0,
  };

  for (const update of updates) {
    if (TERMINAL_STATUSES.has(update.status)) {
      summary.skippedTerminalStatus += 1;
      continue;
    }

    const [rawItem, source] = await Promise.all([
      repository.getRawRegulatoryItemById(update.rawItemId),
      repository.getSourceById(update.sourceId),
    ]);

    if (!rawItem) summary.missingRawItems += 1;
    if (!source) summary.missingSources += 1;

    const news = buildNewsItemFromUpdate({ update, rawItem, source });
    await repository.upsertNewsItem({
      ...news,
      regulatoryUpdateId: update.id,
      rawItemId: update.rawItemId,
    });

    summary.upserted += 1;
    if (news.publicVisibilityStatus === "public") {
      summary.publicItems += 1;
    } else {
      summary.adminOnlyItems += 1;
    }
  }

  return summary;
}
