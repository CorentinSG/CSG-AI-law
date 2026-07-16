import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";
import type { AiRegulatoryUpdate, RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";

const REVIEWER = "system:auto-backlog-reducer";

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function numberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sourceBucket(update: AiRegulatoryUpdate) {
  if (update.sourceName === "Country legal baseline curator") return "country_legal_baseline";
  if (/nist|ico|nydfs/i.test(update.sourceName)) return "trusted_guidance_source";
  return "other";
}

async function assessEligibleBacklog() {
  const updates = await updateRepository.listUpdates();
  const needsReview = updates.filter((update) => update.status === "needs_review");
  const rawItems = await updateRepository.getRawItems(50000);
  const rawById = new Map(rawItems.map((rawItem) => [rawItem.id, rawItem]));
  const sources = await updateRepository.getSources();
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  const eligible: Array<{
    update: AiRegulatoryUpdate;
    rawItem: RawRegulatoryItem | null;
    source: RegulationSource | null;
    reason: string;
  }> = [];
  const blockedReasons = new Map<string, number>();

  for (const update of needsReview) {
    const sourceReferences = update.rawItemId
      ? await updateRepository.getSourceReferencesForRawItem(update.rawItemId, 50)
      : [];
    const assessment = evaluatePublicationEligibility({
      update,
      rawItem: rawById.get(update.rawItemId) ?? null,
      source: sourceById.get(update.sourceId) ?? null,
      sourceReferences,
    });

    if (assessment.eligible) {
      eligible.push({
        update,
        rawItem: rawById.get(update.rawItemId) ?? null,
        source: sourceById.get(update.sourceId) ?? null,
        reason: assessment.recommendedAction,
      });
      continue;
    }

    for (const reason of assessment.blockingReasons) {
      blockedReasons.set(reason, (blockedReasons.get(reason) ?? 0) + 1);
    }
  }

  return { needsReview, eligible, blockedReasons };
}

async function main() {
  const dryRun = boolEnv(process.env.REDUCE_REVIEW_BACKLOG_DRY_RUN, true);
  const limit = numberEnv(process.env.REDUCE_REVIEW_BACKLOG_LIMIT, 100);
  const { needsReview, eligible, blockedReasons } = await assessEligibleBacklog();
  const selected = eligible.slice(0, limit);
  const results = [];

  for (const item of selected) {
    const update = item.update;
    if (dryRun) {
      results.push({
        id: update.id,
        status: "dry_run",
        title: update.title,
        sourceName: update.sourceName,
        country: update.country,
        authorityType: update.authorityType,
      });
      continue;
    }

    try {
      const approved = await updateRepository.updateReviewStatus(update.id, "approved", REVIEWER);
      const published = await updateRepository.updateReviewStatus(approved.id, "published", REVIEWER);
      results.push({
        id: update.id,
        status: "published",
        previousStatus: update.status,
        nextStatus: published.status,
        title: update.title,
        sourceName: update.sourceName,
        country: update.country,
        authorityType: update.authorityType,
      });
    } catch (error) {
      results.push({
        id: update.id,
        status: "failed",
        title: update.title,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const bySourceBucket = new Map<string, number>();
  const byAuthority = new Map<string, number>();
  for (const item of selected) {
    bySourceBucket.set(sourceBucket(item.update), (bySourceBucket.get(sourceBucket(item.update)) ?? 0) + 1);
    byAuthority.set(
      item.update.authorityType ?? "unknown",
      (byAuthority.get(item.update.authorityType ?? "unknown") ?? 0) + 1,
    );
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun,
        totalNeedsReviewBefore: needsReview.length,
        eligibleBefore: eligible.length,
        selected: selected.length,
        succeeded: results.filter((result) => result.status === "published" || result.status === "dry_run").length,
        failed: results.filter((result) => result.status === "failed").length,
        bySourceBucket: Object.fromEntries([...bySourceBucket.entries()].sort((a, b) => b[1] - a[1])),
        byAuthority: Object.fromEntries([...byAuthority.entries()].sort((a, b) => b[1] - a[1])),
        topBlockingReasons: Object.fromEntries([...blockedReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)),
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(`[reduce-review-backlog] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
