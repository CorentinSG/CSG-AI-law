import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  buildSourceVerificationSummary,
  classifySourceHealth,
  formatDiagnosticsSummary,
} from "@/app/admin/ai-regulation/diagnostics";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

export default async function AdminSourceDiagnosticsPage() {
  const [sources, scanLogs, sourceHealthChecks] = await Promise.all([
    updateRepository.getSources(),
    updateRepository.getScanLogs(60),
    updateRepository.getSourceHealthChecks(undefined, 160),
  ]);

  const latestLogBySource = new Map(
    sources.map((source) => [
      source.id,
      scanLogs.find((log) => log.sourceId === source.id) ?? null,
    ]),
  );

  const orderedSources = [...sources].sort((left, right) => {
    const leftHealth = classifySourceHealth(left, latestLogBySource.get(left.id) ?? null);
    const rightHealth = classifySourceHealth(right, latestLogBySource.get(right.id) ?? null);
    const rank = { danger: 0, warning: 1, neutral: 2, success: 3 } as const;

    if (rank[leftHealth.tone] !== rank[rightHealth.tone]) {
      return rank[leftHealth.tone] - rank[rightHealth.tone];
    }

    return left.name.localeCompare(right.name);
  });

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Private source diagnostics
        </p>
        <h1 className="font-serif text-4xl text-white">Official and discovery source watchlist</h1>
        <p className="max-w-3xl text-zinc-300">
          This page turns source diagnostics into a readable review index: what is healthy,
          what is blocked, and which connectors still need attention before their outputs can
          be trusted operationally.
        </p>
        <Link
          href="/admin/ai-regulation"
          className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
        >
          Back to admin review desk
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Sources indexed
          </p>
          <p className="mt-2 font-display text-lg font-medium uppercase tracking-[-0.04em] text-zinc-100">
            {sources.length}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Needs attention
          </p>
          <p className="mt-2 font-display text-lg font-medium uppercase tracking-[-0.04em] text-zinc-100">
            {
              orderedSources.filter((source) => {
                const health = classifySourceHealth(
                  source,
                  latestLogBySource.get(source.id) ?? null,
                );
                return health.tone === "danger" || health.tone === "warning";
              }).length
            }
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Recent health checks
          </p>
          <p className="mt-2 font-display text-lg font-medium uppercase tracking-[-0.04em] text-zinc-100">
            {sourceHealthChecks.length}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Latest logs loaded
          </p>
          <p className="mt-2 font-display text-lg font-medium uppercase tracking-[-0.04em] text-zinc-100">
            {scanLogs.length}
          </p>
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Source diagnostics index</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            {orderedSources.map((source) => {
              const latestLog = latestLogBySource.get(source.id) ?? null;
              const health = classifySourceHealth(source, latestLog);
              const verification = buildSourceVerificationSummary(
                source,
                sourceHealthChecks.filter((check) => check.sourceId === source.id),
              );
              const diagnostics = formatDiagnosticsSummary(latestLog);

              return (
                <div
                  key={source.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="font-medium text-white">{source.name}</p>
                      <p className="text-sm text-zinc-400">
                        {source.id} / {source.jurisdiction} / {source.sourceType}
                      </p>
                      <p className="text-sm text-zinc-300">
                        {health.label}: {health.detail}
                      </p>
                      <p className="text-sm text-zinc-300">
                        {verification.label}: {verification.detail}
                      </p>
                    </div>
                    <Link
                      href={`/admin/ai-regulation/sources/${source.id}`}
                      className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100"
                    >
                      Open source detail
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                        Last scanned
                      </p>
                      <p className="mt-2 text-sm text-zinc-100">
                        {formatDateTime(source.lastScannedAt)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                        Latest response
                      </p>
                      <p className="mt-2 text-sm text-zinc-100">
                        {source.latestResponseStatus ?? diagnostics.sourceResponseStatus ?? "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
