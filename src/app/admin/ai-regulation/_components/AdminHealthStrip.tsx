import type { HealthSnapshot } from "@/lib/health";

function formatAge(ms: number | null): string {
  if (ms === null) return "never";
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Item({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" | "muted" }) {
  const valueClass =
    tone === "danger" ? "text-red-200" : tone === "ok" ? "text-emerald-200" : "text-zinc-200";
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      <span className={`font-mono text-xs ${valueClass}`}>{value}</span>
    </span>
  );
}

/**
 * Compact system-health strip for the dashboard header: data mode, DB
 * reachability, last successful scan, and build version — the operational
 * "is everything wired and live?" line. Reads the `health` snapshot.
 */
export function AdminHealthStrip({ health }: { health: HealthSnapshot }) {
  const dbOk = health.database.reachable;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5">
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dbOk ? "bg-emerald-400" : "bg-red-400"}`} />
        <span className={`text-xs ${dbOk ? "text-emerald-200" : "text-red-200"}`}>
          {dbOk ? "Database reachable" : "Database unreachable"}
        </span>
      </span>
      <Item label="Mode" value={health.dataMode} tone={health.dataMode === "supabase" ? "ok" : "muted"} />
      <Item label="Last scan" value={formatAge(health.scans.newestSuccessfulScanAgeMs)} />
      <Item label="Needs review" value={String(health.review.pendingNeedsReviewCount)} />
      <Item
        label="Build"
        value={`v${health.version.appVersion}${health.version.commit ? ` · ${health.version.commit.slice(0, 7)}` : ""}`}
        tone="muted"
      />
    </div>
  );
}
