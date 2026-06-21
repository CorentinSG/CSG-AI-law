import type { HealthSnapshot } from "@/lib/health";
import { cn } from "@/lib/utils";

type Tone = "positive" | "warning" | "critical" | "neutral";

const dotColor: Record<Tone, string> = {
  positive: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
  neutral: "bg-zinc-500",
};

function formatAge(ms: number | null): string {
  if (ms === null) return "never";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export interface OpsHealthInputs {
  snapshot: HealthSnapshot;
  aiEnabled: boolean;
  aiBudgetUsd: number;
}

/** One value per pill: a status dot, a label, and a value. */
function pills({ snapshot, aiEnabled, aiBudgetUsd }: OpsHealthInputs) {
  const scanFresh =
    snapshot.scans.newestSuccessfulScanAgeMs !== null &&
    snapshot.scans.newestSuccessfulScanAgeMs < 1000 * 60 * 60 * 36;
  const backlog = snapshot.review.pendingNeedsReviewCount;

  return [
    {
      label: "Database",
      value: snapshot.database.reachable
        ? `reachable · ${snapshot.dataMode}`
        : "unreachable",
      tone: (snapshot.database.reachable ? "positive" : "critical") as Tone,
    },
    {
      label: "Last successful scan",
      value: formatAge(snapshot.scans.newestSuccessfulScanAgeMs),
      tone: (snapshot.scans.newestSuccessfulScanAt === null
        ? "critical"
        : scanFresh
          ? "positive"
          : "warning") as Tone,
    },
    {
      label: "Worker",
      value:
        snapshot.worker.runningJobs > 0
          ? `${snapshot.worker.runningJobs} running · ${formatAge(snapshot.worker.heartbeatAgeMs)}`
          : "idle",
      tone: (snapshot.worker.runningJobs > 0 ? "positive" : "warning") as Tone,
    },
    {
      label: "Review backlog",
      value: `${backlog} pending`,
      tone: (backlog === 0
        ? "positive"
        : backlog > 100
          ? "critical"
          : "warning") as Tone,
    },
    {
      label: "AI processing",
      value: aiEnabled ? `on · $${aiBudgetUsd}/mo` : "off (default)",
      tone: (aiEnabled ? "positive" : "neutral") as Tone,
    },
  ];
}

/**
 * Compact operational status strip. Server component — no client JS.
 * Shared between the admin dashboard (overview) and the Operations screen.
 */
export function OpsHealthBand(props: OpsHealthInputs) {
  return (
    <div className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-white/5 p-3 sm:grid-cols-2 lg:grid-cols-5">
      {pills(props).map((pill) => (
        <div key={pill.label} className="flex items-start gap-2 px-2 py-1">
          <span
            className={cn(
              "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
              dotColor[pill.tone],
            )}
          />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {pill.label}
            </p>
            <p className="truncate text-sm text-zinc-100">{pill.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
