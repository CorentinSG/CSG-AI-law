import type { WorkerStatusSummary } from "@/app/admin/ai-regulation/system-status";

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
 * At-a-glance operational health band for the top of the admin dashboard
 * (T-RT readability): worker state, queue depth, sources at risk, review
 * backlog — so the global state is legible without scrolling the page.
 */
export function AdminSystemStatusBand({
  worker,
  sourcesAtRisk,
  sourcesInaccessible,
  reviewBacklog,
  queueDepth,
}: {
  worker: WorkerStatusSummary;
  sourcesAtRisk: number;
  sourcesInaccessible: number;
  reviewBacklog: number;
  queueDepth: number;
}) {
  const w = tone[worker.tone];
  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div className={`rounded-2xl border bg-black/30 p-4 ${w.ring}`}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Worker</p>
          <span className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${w.dot} ${
                worker.state === "active" ? "animate-pulse" : ""
              }`}
            />
            <span className={`text-xs uppercase tracking-[0.18em] ${w.chip}`}>{worker.label}</span>
          </span>
        </div>
        <p className={`mt-2 text-2xl font-semibold ${w.chip}`}>
          {worker.state === "idle"
            ? "Idle"
            : worker.state === "broken"
              ? "Needs attention"
              : worker.state === "backlog"
                ? "Catching up"
                : "Running"}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{worker.detail}</p>
      </div>

      <Metric
        label="Queue depth"
        value={queueDepth}
        hint={`${worker.runningCount} running · ${worker.queuedCount} queued`}
        t={worker.staleRunningCount > 0 ? "danger" : queueDepth > 0 ? "warning" : "ok"}
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
