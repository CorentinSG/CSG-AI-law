import type { HealthSnapshot } from "@/lib/health";
import { workerDisplay } from "@/app/admin/ai-regulation/system-status";

const tone: Record<string, { dot: string; chip: string; ring: string }> = {
  ok: { dot: "bg-emerald-400", chip: "text-emerald-200", ring: "border-emerald-400/30" },
  warning: { dot: "bg-amber-400", chip: "text-amber-200", ring: "border-amber-400/30" },
  danger: { dot: "bg-red-400", chip: "text-red-200", ring: "border-red-400/40" },
  muted: { dot: "bg-zinc-500", chip: "text-zinc-300", ring: "border-white/10" },
};

function metricTone(value: number, warnAt: number, dangerAt: number): "ok" | "warning" | "danger" {
  if (value >= dangerAt) return "danger";
  if (value >= warnAt) return "warning";
  return "ok";
}

function formatAge(ms: number | null): string {
  if (ms === null) return "no activity yet";
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Metric({
  label,
  value,
  hint,
  t,
}: {
  label: string;
  value: string | number;
  hint?: string;
  t: "ok" | "warning" | "danger" | "muted";
}) {
  return (
    <div className={`rounded-2xl border bg-black/20 p-4 ${tone[t].ring}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone[t].chip}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/**
 * At-a-glance operational health band for the top of the admin dashboard:
 * worker state (from the canonical `health.worker` contract), queue depth,
 * sources at risk, and review backlog — legible without scrolling.
 */
export function AdminSystemStatusBand({
  worker,
  staleRunningCount,
  queuedCount,
  sourcesAtRisk,
  sourcesInaccessible,
  reviewBacklog,
}: {
  worker: HealthSnapshot["worker"];
  staleRunningCount: number;
  queuedCount: number;
  sourcesAtRisk: number;
  sourcesInaccessible: number;
  reviewBacklog: number;
}) {
  const display = workerDisplay(worker, staleRunningCount, queuedCount);
  const w = tone[display.tone];
  const queueDepth = worker.runningJobs + queuedCount;
  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div className={`rounded-2xl border bg-black/30 p-4 ${w.ring}`}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            Worker · <span className="text-zinc-400">{display.state}</span>
          </p>
          <span className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${w.dot} ${
                display.tone === "ok" ? "animate-pulse" : ""
              }`}
            />
            <span className={`text-xs uppercase tracking-[0.18em] ${w.chip}`}>{display.label}</span>
          </span>
        </div>
        <p className={`mt-2 text-2xl font-semibold ${w.chip}`}>{display.label}</p>
        <p className="mt-1 text-xs text-zinc-400">{display.detail}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Last activity: {formatAge(worker.lastActivityAgeMs)}
        </p>
      </div>

      <Metric
        label="Queue depth"
        value={queueDepth}
        hint={`${worker.runningJobs} running · ${queuedCount} queued`}
        t={staleRunningCount > 0 ? "danger" : queueDepth > 0 ? "warning" : "ok"}
      />
      <Metric
        label="Sources at risk"
        value={sourcesAtRisk}
        hint={sourcesInaccessible > 0 ? `${sourcesInaccessible} inaccessible` : "stale or degraded"}
        t={sourcesInaccessible > 0 ? "danger" : metricTone(sourcesAtRisk, 1, 5)}
      />
      <Metric
        label="Review backlog"
        value={reviewBacklog}
        hint="needs_review items awaiting a decision"
        t={metricTone(reviewBacklog, 1, 25)}
      />
    </section>
  );
}
