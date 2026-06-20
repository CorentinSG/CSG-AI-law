import Link from "next/link";

import type {
  AiRegulatoryUpdate,
  RegulationSource,
  ReviewAssistMetadata,
} from "@/agents/ai-regulation/types";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
} from "@/agents/ai-regulation/utils/authority";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import {
  createSource,
  triggerSourceScan,
  updateReviewStatus,
} from "@/app/admin/ai-regulation/actions";
import { EmptyFilterState, hasActiveFilterParams } from "@/components/site/empty-filter-state";
import { PaginationControls } from "@/components/site/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PagedResult } from "@/db/repository-types";

interface AiPlanEntry {
  regulatoryUpdateId?: string | null;
  modelUsed: string;
  estimatedCostUsd: number;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
}

interface Props {
  updates: AiRegulatoryUpdate[];
  sourceById: Map<string, RegulationSource>;
  sources: RegulationSource[];
  params: Record<string, string>;
  page: number;
  updatesPage: PagedResult<AiRegulatoryUpdate>;
  latestAiResultByUpdateId: Map<string, AiPlanEntry>;
  reviewAssistByUpdateId: Map<string, ReviewAssistMetadata>;
  reviewQueuePageSize: number;
  adminFilters: { key: string; label: string }[];
}

export function AdminReviewQueue({
  updates,
  sourceById,
  sources,
  params,
  page,
  updatesPage,
  latestAiResultByUpdateId,
  reviewAssistByUpdateId,
  reviewQueuePageSize,
  adminFilters,
}: Props) {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Review queue</CardTitle>
            <p className="text-xs text-zinc-500">
              Ordered for review: items needing review first, then by source
              authority (binding law → other), then most recently detected.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {updates.length > 0 ? updates.map((update) => {
              const authorityType = deriveUpdateAuthorityType(update);
              const authority = getAuthorityPresentation(authorityType);
              const isDiscoveryLead = isDiscoveryOnlySource(sourceById.get(update.sourceId) ?? null);

              return (
                <div
                  key={update.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                        {update.jurisdiction} / {update.developmentType} / {update.status}
                      </p>
                      <Link
                        href={`/admin/ai-regulation/${update.id}`}
                        className="text-lg font-medium text-white"
                      >
                        {update.title}
                      </Link>
                      <p className="text-sm text-zinc-300">{update.oneSentenceSummary}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-100">
                          {authority.label}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                          Requires human review
                        </span>
                        {latestAiResultByUpdateId.get(update.id) ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">
                            AI-enriched draft
                          </span>
                        ) : null}
                        {isDiscoveryLead ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
                            Non-official discovery lead - requires verification
                          </span>
                        ) : null}
                        {!update.publishedAt ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
                            Not publicly visible
                          </span>
                        ) : null}
                      </div>
                      {latestAiResultByUpdateId.get(update.id) ? (
                        <p className="text-xs text-emerald-200">
                          AI-generated content available / model{" "}
                          {latestAiResultByUpdateId.get(update.id)?.modelUsed} / est. $
                          {latestAiResultByUpdateId.get(update.id)?.estimatedCostUsd.toFixed(4)}
                        </p>
                      ) : null}
                      <p className="text-xs text-zinc-500">{authority.shortNote}</p>
                      {(() => {
                        const assist = reviewAssistByUpdateId.get(update.id);
                        if (!assist) return null;
                        const c = assist.suggestedClassification;
                        return (
                          <div className="mt-2 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200">
                              AI suggestion · unverified — human review still required
                            </p>
                            <p className="mt-1 text-xs text-violet-100">
                              {c.developmentType} · {c.legalArea} · {c.jurisdiction} · importance{" "}
                              {c.importanceLevel} · confidence {c.confidenceLevel}
                            </p>
                            <p className="mt-1 text-xs text-violet-200">
                              {assist.suggestedSummary.oneSentenceSummary}
                            </p>
                            <p className="mt-1 text-[10px] text-violet-300/70">
                              Suggested by {assist.modelUsed}. Not applied to the record and never a
                              basis for publication.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {update.status === "needs_review" && !isDiscoveryLead ? (
                        <>
                          <form action={updateReviewStatus}>
                            <input type="hidden" name="updateId" value={update.id} />
                            <input type="hidden" name="status" value="approved" />
                            <button className="rounded-xl bg-white px-3 py-2 text-sm text-zinc-950">
                              Approve
                            </button>
                          </form>
                          <form action={updateReviewStatus}>
                            <input type="hidden" name="updateId" value={update.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="rounded-xl border border-red-400/40 px-3 py-2 text-sm text-red-200">
                              Reject
                            </button>
                          </form>
                        </>
                      ) : null}
                      {update.status === "approved" && !isDiscoveryLead ? (
                        <form action={updateReviewStatus}>
                          <input type="hidden" name="updateId" value={update.id} />
                          <input type="hidden" name="status" value="published" />
                          <button className="rounded-xl bg-emerald-300 px-3 py-2 text-sm font-medium text-emerald-950">
                            Publish
                          </button>
                        </form>
                      ) : null}
                      {update.status !== "archived" ? (
                        <form action={updateReviewStatus}>
                          <input type="hidden" name="updateId" value={update.id} />
                          <input type="hidden" name="status" value="archived" />
                          <button className="rounded-xl border border-white/15 px-3 py-2 text-sm text-zinc-200">
                            Archive
                          </button>
                        </form>
                      ) : null}
                      {update.status === "needs_review" && isDiscoveryLead ? (
                        <form action={updateReviewStatus}>
                          <input type="hidden" name="updateId" value={update.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button className="rounded-xl border border-red-400/40 px-3 py-2 text-sm text-red-200">
                            Reject
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <EmptyFilterState
                resetHref="/admin/ai-regulation"
                resetLabel="Clear filters"
                hasActiveFilters={hasActiveFilterParams(params, adminFilters.map((f) => f.key))}
                title={updatesPage.total === 0 ? "Review queue is empty" : undefined}
                body={updatesPage.total === 0
                  ? "No items are currently in the review queue. Trigger a scan or check back after the next scheduled run."
                  : undefined}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual scan</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={triggerSourceScan} className="space-y-3">
                <select
                  name="sourceId"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">All active sources</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
                <button className="w-full rounded-xl bg-white px-4 py-2 text-sm text-zinc-950">
                  Run scan
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add source</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createSource} className="grid gap-3">
                <input
                  required
                  name="name"
                  placeholder="Source name"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  required
                  name="sourceUrl"
                  placeholder="Official source URL"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="jurisdiction"
                  placeholder="Jurisdiction"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="region"
                  placeholder="Region"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="country"
                  placeholder="Country"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-100">
                  Save source
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <PaginationControls
        basePath="/admin/ai-regulation"
        searchParams={params}
        page={page}
        pageSize={reviewQueuePageSize}
        total={updatesPage.total}
      />
    </>
  );
}
