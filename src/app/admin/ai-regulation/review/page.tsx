import Link from "next/link";

import { listPrioritizedReviewQueue } from "@/lib/admin-review-batch";
import { SiteShell } from "@/components/site/shell";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";

import { BulkReviewForm, type BulkReviewItem } from "./BulkReviewForm";

export const dynamic = "force-dynamic";

const queueLimit = 100;

export default async function BulkReviewPage() {
  // Codex's canonical prioritized queue: importance + confidence + authority
  // + recency. Returns the full backlog `total` plus the top `limit` items.
  const queue = await listPrioritizedReviewQueue({ limit: queueLimit });

  const total = queue.total;
  const highPriorityCount = queue.items.filter(
    (u) => u.importanceLevel === "critical" || u.importanceLevel === "high",
  ).length;

  const items: BulkReviewItem[] = queue.items.map((update) => ({
    id: update.id,
    title: update.title,
    meta: `${update.country} · ${update.legalArea} · ${update.sourceName}`,
    authorityLabel: update.authorityType ?? "—",
    importance: update.importanceLevel,
    priorityReasons: update.priorityReasons,
  }));

  return (
    <SiteShell className="space-y-6" variant="admin" showFooter={false}>
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Admin · AI Regulation
        </p>
        <h1 className="font-serif text-4xl text-white">Batch review</h1>
        <p className="max-w-3xl text-zinc-300">
          Drain the review backlog fast: items are ordered by importance, then
          source authority. Select many and approve, reject, or archive in one
          action. Approving here publishes per the standing publication policy;
          when in doubt, open the item first.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/admin/ai-regulation"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            ← Review queue
          </Link>
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <IntelligenceSignal theme="dark" tone={total > 0 ? "warning" : "positive"} label="Pending review" value={String(total)} />
        <IntelligenceSignal theme="dark" tone={highPriorityCount > 0 ? "warning" : "neutral"} label="High / critical" value={String(highPriorityCount)} note="reviewed first" />
        <IntelligenceSignal theme="dark" tone="neutral" label="Shown here" value={String(items.length)} note={total > items.length ? `top ${items.length} of ${total}` : "all pending"} />
      </section>

      {items.length === 0 ? (
        <p className="rounded-[1.4rem] border border-white/10 bg-white/5 p-8 text-center text-sm text-zinc-400">
          Nothing waiting for review. The queue is clear.
        </p>
      ) : (
        <BulkReviewForm items={items} />
      )}

      {total > items.length ? (
        <p className="text-center text-xs text-zinc-500">
          Showing the {items.length} highest-priority items. Clear these and the
          next batch surfaces automatically.
        </p>
      ) : null}
    </SiteShell>
  );
}
