import type { SourceRuntimeHealthSummary } from "@/agents/ai-regulation/sourceRuntimeHealth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  runtimeHealthTone,
  summarizeRuntimeHealth,
} from "@/app/admin/ai-regulation/freshness-summary";

const toneClass: Record<string, string> = {
  danger: "border-red-400/30 bg-red-500/10 text-red-100",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  ok: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  muted: "border-white/10 bg-white/5 text-zinc-300",
};

const stateLabel: Record<string, string> = {
  stale: "Stale",
  degraded: "Degraded",
  healthy: "Healthy",
  inactive: "Inactive",
};

function formatHoursSince(hours: number | null) {
  if (hours === null) return "no success yet";
  if (hours < 1) return "under 1h ago";
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function StateBadge({ state }: { state: SourceRuntimeHealthSummary["state"] }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${
        toneClass[runtimeHealthTone(state)]
      }`}
    >
      {stateLabel[state]}
    </span>
  );
}

export function AdminFreshnessPanel({
  summaries,
}: {
  summaries: SourceRuntimeHealthSummary[];
}) {
  const rollup = summarizeRuntimeHealth(summaries);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span>Source freshness (runtime SLO)</span>
          <span className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em]">
            <span className={`rounded-full border px-2.5 py-1 ${toneClass.danger}`}>
              {rollup.stale} stale
            </span>
            <span className={`rounded-full border px-2.5 py-1 ${toneClass.warning}`}>
              {rollup.degraded} degraded
            </span>
            <span className={`rounded-full border px-2.5 py-1 ${toneClass.ok}`}>
              {rollup.healthy} healthy
            </span>
            <span className={`rounded-full border px-2.5 py-1 ${toneClass.muted}`}>
              {rollup.inactive} inactive
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-400">
          Per-source freshness against each source&apos;s expected cadence, built
          from health checks, scan logs, scan jobs, and ingestion logs. Sources
          needing attention are listed first.
          {rollup.highPriorityAtRisk > 0 ? (
            <span className="text-amber-200">
              {" "}
              {rollup.highPriorityAtRisk} high-priority source
              {rollup.highPriorityAtRisk > 1 ? "s" : ""} at risk.
            </span>
          ) : null}
        </p>

        {rollup.needsAttention.length === 0 ? (
          <div className={`rounded-2xl border p-4 text-sm ${toneClass.ok}`}>
            All monitored sources are within their freshness SLO.
          </div>
        ) : (
          rollup.needsAttention.map((source) => (
            <div
              key={source.sourceId}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StateBadge state={source.state} />
                  <span className="font-medium text-white">{source.sourceName}</span>
                  {source.priorityBand === "high" ? (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                      high priority
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-zinc-500">
                  {source.jurisdiction} · {source.recommendedCadence.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-sm text-zinc-300 md:grid-cols-2">
                <p>Last success: {formatHoursSince(source.hoursSinceSuccess)}</p>
                <p>
                  Consecutive failures: {source.consecutiveFailures}
                  {source.latestResponseStatus !== null
                    ? ` · HTTP ${source.latestResponseStatus}`
                    : ""}
                </p>
              </div>
              {source.reasons.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                  {source.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>— {reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
