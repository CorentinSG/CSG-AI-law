import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getSourceRuntimeHealthSummaries } from "@/agents/ai-regulation/sourceRuntimeHealth";
import { listAgentApiCapabilities } from "@/agents/ai-regulation/agentApiCapabilities";
import { buildHealthSnapshot } from "@/lib/health";
import { env } from "@/lib/env";
import { OpsHealthBand } from "@/components/site/ops-health-band";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

const jobStatusTone: Record<string, string> = {
  succeeded: "text-emerald-300",
  running: "text-sky-300",
  queued: "text-zinc-300",
  failed: "text-red-300",
  cancelled: "text-zinc-400",
};

export default async function AdminOperationsPage() {
  const [snapshot, scanJobs, health, capabilities] = await Promise.all([
    buildHealthSnapshot({ access: "authenticated" }),
    updateRepository.getScanJobs(25),
    getSourceRuntimeHealthSummaries(),
    Promise.resolve(listAgentApiCapabilities()),
  ]);

  const aiEnabled = env.AI_PROCESSING_ENABLED;
  const failedJobs = scanJobs.filter((job) => job.status === "failed");
  const attentionSources = health
    .filter((h) => h.state === "degraded" || h.state === "stale" || h.state === "inactive")
    .sort((a, b) => b.consecutiveFailures - a.consecutiveFailures);
  const missingCredentials = capabilities.filter((c) => c.status !== "available");

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      {/* Header */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Admin · Operations
        </p>
        <h1 className="font-serif text-4xl text-white">Operations</h1>
        <p className="max-w-3xl text-zinc-300">
          Live operational state of the monitoring pipeline: worker heartbeat,
          scan jobs, source health, and the credentials each connector still
          needs. This is the screen to check first when something looks stalled.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            ← Site dashboard
          </Link>
          <Link
            href="/admin/ai-regulation/sources"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Source diagnostics →
          </Link>
        </div>
      </section>

      <OpsHealthBand
        snapshot={snapshot}
        aiEnabled={aiEnabled}
        aiBudgetUsd={env.AI_MONTHLY_BUDGET_USD}
      />

      {/* Worker & scan freshness */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Worker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Running jobs</span>
              <span>{snapshot.worker.runningJobs}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Last heartbeat</span>
              <span>{formatDateTime(snapshot.worker.heartbeatAt)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Last successful scan</span>
              <span>{formatDateTime(snapshot.scans.newestSuccessfulScanAt)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Pending review</span>
              <span>{snapshot.review.pendingNeedsReviewCount}</span>
            </div>
            {snapshot.worker.runningJobs === 0 &&
            snapshot.scans.newestSuccessfulScanAt === null ? (
              <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-amber-200">
                No worker heartbeat and no successful scan recorded yet — the
                monitoring pipeline is not running. Deploy/enable the scan worker
                to start ingestion.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Scan freshness by profile</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(snapshot.scans.byProfile).length === 0 ? (
              <p className="text-sm text-zinc-400">
                No successful scans recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-white/5 text-sm">
                {Object.entries(snapshot.scans.byProfile).map(([profile, value]) => (
                  <li key={profile} className="flex justify-between gap-3 py-2">
                    <span className="text-zinc-200">{profile}</span>
                    <span className="text-zinc-400">
                      {formatDateTime(value.newestSuccessfulScanAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent scan jobs */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Recent scan jobs {failedJobs.length > 0 ? `· ${failedJobs.length} failed` : ""}
        </h2>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="overflow-x-auto p-0">
            {scanJobs.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400">
                No scan jobs recorded. Once the worker runs, jobs appear here.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Trigger</th>
                    <th className="px-4 py-2 font-medium">Started</th>
                    <th className="px-4 py-2 font-medium">Finished</th>
                    <th className="px-4 py-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {scanJobs.map((job) => (
                    <tr key={job.id} className="border-b border-white/5 align-top">
                      <td className={cn("px-4 py-2 font-medium", jobStatusTone[job.status] ?? "text-zinc-300")}>
                        {job.status}
                      </td>
                      <td className="px-4 py-2 text-zinc-400">{job.trigger}</td>
                      <td className="px-4 py-2 text-zinc-400">{formatDateTime(job.startedAt)}</td>
                      <td className="px-4 py-2 text-zinc-400">{formatDateTime(job.finishedAt)}</td>
                      <td className="px-4 py-2 text-red-300/80">{job.errorMessage ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Sources needing attention */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Sources needing attention · {attentionSources.length}
        </h2>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-0">
            {attentionSources.length === 0 ? (
              <p className="p-5 text-sm text-zinc-400">
                All sources healthy.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {attentionSources.slice(0, 25).map((source) => (
                  <li key={source.sourceId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-100">{source.sourceName}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {source.jurisdiction} · {source.reasons[0] ?? source.state}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 uppercase tracking-[0.14em]",
                          source.state === "inactive"
                            ? "bg-zinc-500/15 text-zinc-300"
                            : "bg-amber-500/15 text-amber-200",
                        )}
                      >
                        {source.state}
                      </span>
                      <span className="text-zinc-500">
                        {source.consecutiveFailures} fails
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Missing credentials / connectors */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Connectors needing setup · {missingCredentials.length}
        </h2>
        {missingCredentials.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-5 text-sm text-zinc-400">
              All declared connectors are configured.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {missingCredentials.map((cap) => (
              <Card key={cap.id} className="border-white/10 bg-white/5">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <p className="text-sm font-medium text-zinc-100">{cap.label}</p>
                  </div>
                  <p className="font-mono text-[11px] text-zinc-500">
                    {cap.envVars.join(", ") || "no env vars declared"}
                  </p>
                  {cap.userAction ? (
                    <p className="text-sm leading-6 text-amber-200/80">{cap.userAction}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
