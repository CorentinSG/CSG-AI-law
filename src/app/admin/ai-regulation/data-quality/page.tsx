import Link from "next/link";

import { buildLegalIntelligenceDataStewardReport } from "@/agents/ai-regulation/dataSteward";
import { loadDiscoveryLeadRecords } from "@/agents/ai-regulation/utils/discovery-lead-records";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { PaginationControls } from "@/components/site/pagination-controls";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOffsetFromPage, parsePageParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const findingsPageSize = 20;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

function priorityClasses(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }
  if (priority === "medium") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  return "border-white/10 bg-white/5 text-zinc-200";
}

function statusText(value: string) {
  return value.replaceAll("_", " ");
}

function readinessTone(total: number) {
  if (total === 0) {
    return "positive" as const;
  }
  if (total <= 6) {
    return "informative" as const;
  }
  return "warning" as const;
}

export default async function AiRegulationDataQualityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const page = parsePageParam(params.page, 1);
  const [updates, rawItems, sources, scanLogs, persistedFindings, discoveryLeadRecords] = await Promise.all([
    updateRepository.listUpdates(),
    updateRepository.getRawItems(250),
    updateRepository.getSources(),
    updateRepository.getScanLogs(120),
    updateRepository.getDataQualityFindingsPage(undefined, {
      limit: findingsPageSize,
      offset: getOffsetFromPage(page, findingsPageSize),
    }),
    loadDiscoveryLeadRecords({ limit: 250 }),
  ]);
  const report = buildLegalIntelligenceDataStewardReport({
    updates,
    rawItems,
    sources,
    scanLogs,
    discoveryLeads: discoveryLeadRecords,
  });

  const sourceAttention = report.sources.filter(
    (source) => source.reviewPriority !== "low",
  );
  const europeNeedsReview = report.europeCoverage.filter(
    (entry) => entry.quality.reviewPriority !== "low",
  );
  const usNeedsReview = report.usCoverage.filter(
    (entry) => entry.quality.reviewPriority !== "low",
  );
  const publicCitationWarnings = report.citationFindings.filter(
    (finding) => finding.status === "published",
  );
  const readinessSignals = [
    {
      label: "Public citation risk",
      value: String(publicCitationWarnings.length),
      note: "Published items carrying citation or source-quality warnings.",
      tone: readinessTone(publicCitationWarnings.length),
    },
    {
      label: "Source attention",
      value: String(sourceAttention.length),
      note: "Sources with access, parser, or freshness signals requiring action.",
      tone: readinessTone(sourceAttention.length),
    },
    {
      label: "Europe review gaps",
      value: String(europeNeedsReview.length),
      note: "Member State or EU-level entries that still need human verification.",
      tone: readinessTone(europeNeedsReview.length),
    },
    {
      label: "U.S. review gaps",
      value: String(usNeedsReview.length),
      note: "Federal or state entries that still need source-backed follow-up.",
      tone: readinessTone(usNeedsReview.length),
    },
  ];

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <section className="space-y-3">
        <Link
          href="/admin/ai-regulation"
          className="text-sm text-zinc-400 underline decoration-white/10 underline-offset-4"
        >
          Back to review queue
        </Link>
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Data governance
        </p>
        <h1 className="font-serif text-4xl text-white">
          Legal Intelligence Data Steward
        </h1>
        <p className="max-w-3xl text-zinc-300">
          Read-only stewardship layer for source health, citation completeness,
          freshness, verification status, and Europe/U.S. coverage gaps. This
          page does not publish, modify, or approve items.
        </p>
        <p className="text-sm text-zinc-500">
          Generated: {formatDateTime(report.generatedAt)}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
          <CardHeader className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-sky-100/80">
              Reliability snapshot
            </p>
            <CardTitle className="text-2xl text-white">
              One-screen view of legal database trust, freshness, and review pressure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="max-w-2xl text-sm leading-7 text-zinc-300">
              This admin surface translates raw governance signals into a readable operational picture:
              what is strong, what is drifting, and what could weaken public legal credibility if left unattended.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {readinessSignals.map((signal) => (
                <IntelligenceSignal
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  note={signal.note}
                  tone={signal.tone}
                  theme="dark"
                  className="bg-black/20"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader>
            <CardTitle>Readiness ladder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                title: "Strong",
                body: "Official source present, citations are precise, freshness is healthy, and no critical blocking warnings exist.",
                tone: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
              },
              {
                title: "Watch closely",
                body: "The item or source is still usable, but citation, access, or freshness quality is starting to slip.",
                tone: "border-sky-400/25 bg-sky-500/10 text-sky-100",
              },
              {
                title: "Needs intervention",
                body: "Missing official support, stale coverage, or unstable sources are creating real review debt.",
                tone: "border-amber-400/25 bg-amber-500/10 text-amber-100",
              },
            ].map((step) => (
              <div key={step.title} className={`rounded-2xl border p-4 ${step.tone}`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em]">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-7">{step.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <IntelligenceSignal
          label="High priority queue"
          value={String(report.summary.highPriorityReviewItems)}
          note="Items at the front of the review queue because they affect source trust, public posture, or citation safety."
          tone="warning"
          theme="dark"
        />
        <IntelligenceSignal
          label="Sources needing attention"
          value={String(report.summary.sourceAttention)}
          note="Active or important sources that are stale, blocked, parser-fragile, or otherwise need manual follow-up."
          tone="warning"
          theme="dark"
        />
        <IntelligenceSignal
          label="Citation warnings"
          value={String(report.summary.citationWarnings)}
          note="Structured citation gaps that make legal claims harder to defend publicly."
          tone="informative"
          theme="dark"
        />
        <IntelligenceSignal
          label="Persisted findings"
          value={String(persistedFindings.total)}
          note="Saved stewardship findings already written into the database for recurring follow-up."
          tone="neutral"
          theme="dark"
        />
        <IntelligenceSignal
          label="Discovery backlog"
          value={String(report.summary.discoveryLeadsNeedingVerification)}
          note="Non-official leads still waiting for official confirmation or rejection."
          tone="warning"
          theme="dark"
        />
        <IntelligenceSignal
          label="Europe checks"
          value={String(report.summary.europeCoverageFindings)}
          note="Coverage diagnostics watching the Europe baseline for source, freshness, and implementation-status gaps."
          tone="informative"
          theme="dark"
        />
        <IntelligenceSignal
          label="Europe maintenance"
          value={String(report.summary.europeMaintenanceItems)}
          note="Prioritized Europe-only maintenance queue for implementation, citation, source, timeline, and case-law follow-up."
          tone="warning"
          theme="dark"
        />
        <IntelligenceSignal
          label="U.S. checks"
          value={String(report.summary.usCoverageFindings)}
          note="Coverage diagnostics watching the U.S. baseline for state, federal, and source-verification gaps."
          tone="informative"
          theme="dark"
        />
        <IntelligenceSignal
          label="Stale or due"
          value={String(report.summary.staleOrDueCoverageItems)}
          note="Baseline entries that should be refreshed before they drift too far from current legal reality."
          tone="warning"
          theme="dark"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>How to read this dashboard</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Source health",
                "Tells you whether a source is still reachable, stable, and worth trusting operationally.",
              ],
              [
                "Citation quality",
                "Shows whether the legal claim is tied to precise, reviewable source metadata rather than a vague link.",
              ],
              [
                "Freshness",
                "Highlights country, state, timeline, and baseline entries that are drifting out of date.",
              ],
              [
                "Priority",
                "Translates data-risk into a practical review order for the team.",
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
            <CardTitle>Fast risk snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-red-200">
                Public-source risk
              </p>
              <p className="mt-3 text-2xl text-white">{publicCitationWarnings.length}</p>
              <p className="mt-2 text-sm text-zinc-300">
                Published items currently carrying citation warnings that deserve renewed human attention.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Latest scheduled scan
              </p>
              <p className="mt-3 text-lg text-white">
                {report.latestScheduledScan
                  ? formatDateTime(report.latestScheduledScan.scanStartedAt)
                  : "Not found"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                This helps separate stale data from a monitoring loop that simply has not run recently.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Review priority queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.reviewQueue.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      {item.area.replaceAll("_", " ")} / {item.entityType}
                    </p>
                    {item.href ? (
                      <Link href={item.href} className="mt-1 block font-medium text-white">
                        {item.title}
                      </Link>
                    ) : (
                      <p className="mt-1 font-medium text-white">{item.title}</p>
                    )}
                    <p className="mt-2 text-sm text-zinc-300">{item.reason}</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {item.suggestedAction}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${priorityClasses(item.priority)}`}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stewardship policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p>Official sources control legal authority.</p>
            <p>Discovery and media sources remain private until verified.</p>
            <p>Freshness warnings never delete data; they create review work.</p>
            <p>Publication still requires human review and published status.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Europe maintenance queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.europeMaintenanceQueue.slice(0, 14).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      europe / {item.entityType}
                    </p>
                    {item.href ? (
                      <Link href={item.href} className="mt-1 block font-medium text-white">
                        {item.title}
                      </Link>
                    ) : (
                      <p className="mt-1 font-medium text-white">{item.title}</p>
                    )}
                    <p className="mt-2 text-sm text-zinc-300">{item.reason}</p>
                    <p className="mt-2 text-sm text-zinc-500">{item.suggestedAction}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${priorityClasses(item.priority)}`}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source health attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sourceAttention.slice(0, 12).map((source) => (
              <div
                key={source.sourceId}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/ai-regulation/sources/${source.sourceId}`}
                      className="font-medium text-white"
                    >
                      {source.sourceName}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-400">
                      {source.latestScanStatus} / response{" "}
                      {source.latestResponseStatus ?? "n/a"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${priorityClasses(source.reviewPriority)}`}
                  >
                    {source.reviewPriority}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-300">
                  {source.accessibilityWarnings[0] ??
                    source.parserWarnings[0] ??
                    source.reliabilityNotes[0] ??
                    "No specific source warning."}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  fetched {source.itemsFetched ?? "n/a"} / new{" "}
                  {source.newItemsDetected} / duplicates {source.duplicatesDetected}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discovery leads needing verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.discoveryFindings.slice(0, 12).map((lead) => (
              <div
                key={lead.rawItemId}
                className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4"
              >
                <p className="font-medium text-white">{lead.headline}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-200">
                  {statusText(lead.verificationStatus)} / official source{" "}
                  {lead.officialSourceFound ? "found" : "missing"}
                </p>
                <p className="mt-2 text-sm text-zinc-300">{lead.reviewerNotes}</p>
                <a
                  href={lead.outboundUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-xs text-zinc-500 underline decoration-white/10 underline-offset-4"
                >
                  Discovery URL
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Europe coverage diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {europeNeedsReview.slice(0, 14).map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{entry.title}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {entry.entityType} / {statusText(entry.status)} /{" "}
                  {statusText(entry.quality.freshnessStatus)}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.warnings[0] ?? entry.summary}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  sources {entry.sourceCount} / citation{" "}
                  {statusText(entry.quality.citationQuality)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>United States coverage diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usNeedsReview.slice(0, 14).map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{entry.title}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {entry.entityType} / {statusText(entry.status)} /{" "}
                  {statusText(entry.quality.freshnessStatus)}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.warnings[0] ?? entry.summary}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  sources {entry.sourceCount} / citation{" "}
                  {statusText(entry.quality.citationQuality)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Persisted data quality findings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {persistedFindings.items.map((finding) => (
              <div
                key={finding.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{finding.findingType.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {finding.entityType} / {finding.scope.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${priorityClasses(finding.severity)}`}
                  >
                    {finding.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{finding.message}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  status {statusText(finding.status)} / last detected {formatDateTime(finding.lastDetectedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <PaginationControls
        basePath="/admin/ai-regulation/data-quality"
        searchParams={params}
        page={page}
        pageSize={findingsPageSize}
        total={persistedFindings.total}
      />

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Missing or weak citations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {report.citationFindings.slice(0, 16).map((finding) => (
              <div
                key={finding.updateId}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <Link
                  href={finding.href}
                  className="font-medium text-white"
                >
                  {finding.title}
                </Link>
                <p className="mt-1 text-sm text-zinc-400">
                  {finding.status} / {statusText(finding.citationQuality)}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {finding.warnings[0] ?? "Citation requires review."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
