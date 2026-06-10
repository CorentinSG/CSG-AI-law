import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getSourceRuntimeHealthSummaries } from "@/agents/ai-regulation/sourceRuntimeHealth";
import { summarizeAiPlanning } from "@/app/admin/ai-regulation/ai-planning";
import {
  buildEuropeVerificationSummary,
  classifySourceHealth,
} from "@/app/admin/ai-regulation/diagnostics";
import { env } from "@/lib/env";
import { FilterBar } from "@/components/site/filter-bar";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEuropeCountryVerificationBacklog } from "@/content/ai-regulation/europe-country-profiles";
import {
  getSourceRegistrySummary,
  sourceAuthorityTierLabels,
  sourceDiscoveryRegistry,
} from "@/content/ai-regulation/source-discovery-registry";
import { getUsFederalSourceBacklog } from "@/content/ai-regulation/us-ai-legal-baseline";
import { getUsStateVerificationBacklog } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { getOffsetFromPage, parsePageParam } from "@/lib/pagination";

import {
  recoverStaleJobs,
  drainNextQueuedJob,
} from "./actions";
import { AdminReviewQueue } from "./_components/AdminReviewQueue";
import { AdminSourcePanel } from "./_components/AdminSourcePanel";
import { AdminCoveragePanel } from "./_components/AdminCoveragePanel";
import { AdminAiPanel } from "./_components/AdminAiPanel";
import { AdminFreshnessPanel } from "./_components/AdminFreshnessPanel";

export const dynamic = "force-dynamic";
const reviewQueuePageSize = 18;
const discoveryLeadsPageSize = 10;

const adminFilters = [
  { key: "status", label: "Status" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "legalArea", label: "Legal area" },
  { key: "developmentType", label: "Development type" },
  { key: "importanceLevel", label: "Importance" },
  { key: "publicationDate", label: "Date" },
  { key: "tag", label: "Tag" },
  { key: "sourceName", label: "Source" },
];

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

// Uses listDistinctFilterValues() which selects only lightweight filter columns
// instead of loading all regulatory updates into memory (B1 optimisation).
async function collectOptions() {
  return updateRepository.listDistinctFilterValues("admin");
}

export default async function AdminAiRegulationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const page = parsePageParam(params.page, 1);
  const leadsPage = parsePageParam(params.leadsPage, 1);
  const [updatesPage, sources, scanLogs, processingLogs, rawItems, scanJobs, options, sourceHealthChecks, discoveryLeadsPage, runtimeHealth] = await Promise.all([
    updateRepository.listUpdatesPage(params, {
      limit: reviewQueuePageSize,
      offset: getOffsetFromPage(page, reviewQueuePageSize),
    }),
    updateRepository.getSources(),
    updateRepository.getScanLogs(24),
    updateRepository.getProcessingLogs(60),
    updateRepository.getRawItems(120),
    updateRepository.getScanJobsPage({
      limit: 12,
      offset: 0,
    }),
    collectOptions(),
    updateRepository.getSourceHealthChecks(undefined, 200),
    // T-C2B: paged discovery leads so the admin panel no longer loads a fixed flat list
    updateRepository.listDiscoveryLeadsPage("unresolved", {
      limit: discoveryLeadsPageSize,
      offset: getOffsetFromPage(leadsPage, discoveryLeadsPageSize),
    }),
    getSourceRuntimeHealthSummaries(),
  ]);
  const updates = updatesPage.items;
  const aiPlanning = summarizeAiPlanning(processingLogs, rawItems);
  const latestAiResultByUpdateId = new Map(
    aiPlanning.enrichedOpenAiResults
      .filter((entry) => entry.regulatoryUpdateId)
      .map((entry) => [entry.regulatoryUpdateId!, entry]),
  );

  const latestLogBySource = new Map(
    sources.map((source) => [
      source.id,
      scanLogs.find((log) => log.sourceId === source.id) ?? null,
    ]),
  );
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const latestSuccessfulLogBySource = new Map(
    sources.map((source) => [
      source.id,
      scanLogs.find((log) => log.sourceId === source.id && log.status === "success") ?? null,
    ]),
  );
  const europeVerification = buildEuropeVerificationSummary();
  const europeCountryProfiles = getEuropeCountryVerificationBacklog();
  const usFederalSourceBacklog = getUsFederalSourceBacklog();
  const usStateBacklog = getUsStateVerificationBacklog();
  const sourceRegistrySummary = getSourceRegistrySummary();
  const mediaDiscoveryReferences = sourceDiscoveryRegistry.filter(
    (entry) => entry.authorityTier === "media_discovery_source",
  );
  const reviewNeededCount = updates.filter((update) => update.status === "needs_review").length;
  const approvedCount = updates.filter((update) => update.status === "approved").length;
  const discoveryCount = discoveryLeadsPage.total;
  const sourceAttentionCount = sources.filter((source) => {
    const latestLog = latestLogBySource.get(source.id) ?? null;
    const summary = classifySourceHealth(source, latestLog);
    return summary.tone === "warning" || summary.tone === "danger";
  }).length;

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Private admin review
        </p>
        <h1 className="font-serif text-4xl text-white">AI Regulation Monitoring Agent</h1>
        <p className="max-w-3xl text-zinc-300">
          Human review remains mandatory. New AI-generated drafts enter the queue
          as <strong>needs_review</strong> and cannot be published until approved.
        </p>
        <Link
          href="/admin/ai-regulation/data-quality"
          className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
        >
          Open data governance dashboard
        </Link>
        <Link
          href="/admin/ai-regulation/news"
          className="ml-3 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
        >
          Open AI Law News review
        </Link>
        <Link
          href="/admin/ai-regulation/sources"
          className="ml-3 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
        >
          Open source diagnostics
        </Link>
        <Link
          href="/admin/ai-regulation/countries"
          className="ml-3 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
        >
          Edit country profiles
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <IntelligenceSignal
          label="Needs review"
          value={String(reviewNeededCount)}
          note="Items still waiting for a human legal/editorial decision before they can move forward."
          tone="warning"
          theme="dark"
        />
        <IntelligenceSignal
          label="Approved queue"
          value={String(approvedCount)}
          note="Items that are already approved but not yet manually published."
          tone="informative"
          theme="dark"
        />
        <IntelligenceSignal
          label="Discovery leads"
          value={String(discoveryCount)}
          note="Non-official leads visible to admin, kept outside the public legal-authority layer."
          tone="warning"
          theme="dark"
        />
        <IntelligenceSignal
          label="Sources under watch"
          value={String(sourceAttentionCount)}
          note="Sources with freshness, parser, accessibility, or reliability signals that deserve a closer look."
          tone="informative"
          theme="dark"
        />
      </section>

      <section>
        <AdminFreshnessPanel summaries={runtimeHealth} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>How to read the admin review desk</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Review queue",
                "The operational core: drafts, approvals, and publication-safe next actions.",
              ],
              [
                "Source hierarchy",
                "Shows which inputs are official authority and which ones are only discovery or corroboration material.",
              ],
              [
                "Country / state backlog",
                "Surfaces where the legal baseline is still incomplete or under-verified.",
              ],
              [
                "AI guardrails",
                "Keeps processing bounded, reviewable, and disabled by default unless explicitly enabled.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                  {title}
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fast operations snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Europe backlog
              </p>
              <p className="mt-3 text-2xl text-white">{europeCountryProfiles.length}</p>
              <p className="mt-2 text-sm text-zinc-400">
                Country-level verification entries currently surfaced for Europe review.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                U.S. backlog
              </p>
              <p className="mt-3 text-2xl text-white">{usStateBacklog.length}</p>
              <p className="mt-2 text-sm text-zinc-400">
                State-level baseline entries still needing stronger source verification.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Scan jobs visible
              </p>
              <p className="mt-3 text-2xl text-white">{scanJobs.items.length}</p>
              <p className="mt-2 text-sm text-zinc-400">
                Recent scan runs visible on this page for operational context.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                AI processing posture
              </p>
              <p className="mt-3 text-lg text-white">
                {env.AI_ENABLE_PROCESSING ? "Enabled" : "Disabled by default"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Guardrails stay visible so operations never mistake planning scaffolding for auto-publishing authority.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Source hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Registry entries
                </p>
                <p className="mt-2 text-sm text-zinc-100">{sourceRegistrySummary.total}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Non-publishable discovery
                </p>
                <p className="mt-2 text-sm text-zinc-100">
                  {sourceRegistrySummary.nonPublishableDiscovery}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(sourceRegistrySummary.byTier).map(([tier, count]) => (
                <div
                  key={tier}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <p className="text-sm text-zinc-300">
                    {sourceAuthorityTierLabels[tier as keyof typeof sourceAuthorityTierLabels]}
                  </p>
                  <p className="text-sm text-zinc-100">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media discovery references</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-400">
              Specialist press and media sources are manual discovery references only.
              Paywalled content must not be scraped or reproduced. Official sources
              control before any publication.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {mediaDiscoveryReferences.slice(0, 6).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="font-medium text-white">{entry.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {entry.sourceStatus.replaceAll("_", " ")} /{" "}
                    {entry.monitoringRole.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm text-amber-200">
                    Media discovery lead - not legal authority. Requires official verification.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <FilterBar
        searchParams={params}
        options={options}
        basePath="/admin/ai-regulation"
        filters={adminFilters}
      />

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-medium text-white">Verification queue filters</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { href: "/admin/ai-regulation?tag=discovery_only", label: "Discovery only" },
            {
              href: "/admin/ai-regulation?tag=official_source_not_yet_identified",
              label: "Needs official source",
            },
            {
              href: "/admin/ai-regulation?tag=official_source_candidate_identified",
              label: "Official source found",
            },
            { href: "/admin/ai-regulation?status=approved", label: "Ready to publish" },
            { href: "/admin/ai-regulation?status=rejected", label: "Rejected" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-zinc-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent scan jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Durability actions — T-C3B */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-zinc-500">
                Stale running jobs (exceeded 15 min) can be marked failed; queued jobs can be drained on demand.
              </p>
              <form action={recoverStaleJobs}>
                <button
                  type="submit"
                  className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/20"
                >
                  Recover stale running jobs
                </button>
              </form>
              <form action={drainNextQueuedJob}>
                <button
                  type="submit"
                  className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-500/20"
                >
                  Drain next queued job
                </button>
              </form>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {scanJobs.items.map((job) => {
                const statusColor =
                  job.status === "succeeded"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : job.status === "running"
                      ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                      : job.status === "queued"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                        : job.status === "partial_success"
                          ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
                          : "border-red-400/30 bg-red-500/10 text-red-100";
                const summary = job.resultSummary ?? {};
                return (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${statusColor}`}>
                        {job.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {job.trigger} / {job.requestedBy}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {job.sourceId ?? "all active sources"}
                    </p>
                    {typeof summary.sourcesProcessed === "number" ? (
                      <p className="mt-1 text-xs text-zinc-400">
                        {summary.sourcesProcessed} sources · {String(summary.totalNew ?? 0)} new · {String(summary.totalFound ?? 0)} found
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDateTime(job.startedAt)} → {formatDateTime(job.finishedAt)}
                    </p>
                    {job.errorMessage ? (
                      <p className="mt-2 text-xs text-red-200">{job.errorMessage}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <AdminReviewQueue
        updates={updates}
        sourceById={sourceById}
        sources={sources}
        params={params}
        page={page}
        updatesPage={updatesPage}
        latestAiResultByUpdateId={latestAiResultByUpdateId}
        reviewQueuePageSize={reviewQueuePageSize}
        adminFilters={adminFilters}
      />

      <AdminSourcePanel
        sources={sources}
        latestLogBySource={latestLogBySource}
        latestSuccessfulLogBySource={latestSuccessfulLogBySource}
        scanLogs={scanLogs}
        sourceHealthChecks={sourceHealthChecks}
      />

      <AdminCoveragePanel
        europeVerification={europeVerification}
        europeCountryProfiles={europeCountryProfiles}
        discoveryLeadsPage={discoveryLeadsPage}
        leadsPage={leadsPage}
        leadsPageSize={discoveryLeadsPageSize}
        params={params}
        usStateBacklog={usStateBacklog}
        usFederalSourceBacklog={usFederalSourceBacklog}
        sources={sources}
        sourceHealthChecks={sourceHealthChecks}
      />

      <AdminAiPanel
        aiPlanning={aiPlanning}
        sources={sources}
        processingLogs={processingLogs}
      />
    </SiteShell>
  );
}
