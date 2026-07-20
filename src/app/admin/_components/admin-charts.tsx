import { cn } from "@/lib/utils";

/**
 * Lightweight server-rendered SVG charts for the admin dashboard.
 * No client JS, no chart library — matches the site's hand-drawn SVG approach.
 */

export interface MonthlyPoint {
  label: string;
  a: number;
  b: number;
}

export function MonthlyBars({
  points,
  aLabel,
  bLabel,
}: {
  points: MonthlyPoint[];
  aLabel: string;
  bLabel: string;
}) {
  const width = 640;
  const height = 220;
  const padLeft = 34;
  const padBottom = 26;
  const padTop = 14;
  const chartW = width - padLeft - 8;
  const chartH = height - padTop - padBottom;
  const max = Math.max(1, ...points.flatMap((p) => [p.a, p.b]));
  const group = chartW / Math.max(1, points.length);
  const barW = Math.min(14, group / 3);
  const yFor = (v: number) => padTop + chartH - (v / max) * chartH;
  const gridSteps = 4;

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${aLabel} and ${bLabel} per month`}
      >
        {Array.from({ length: gridSteps + 1 }, (_, i) => {
          const value = Math.round((max / gridSteps) * i);
          const y = yFor(value);
          return (
            <g key={i}>
              <line
                x1={padLeft}
                x2={width - 8}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="rgba(255,255,255,0.35)"
              >
                {value}
              </text>
            </g>
          );
        })}
        {points.map((p, i) => {
          const x0 = padLeft + i * group + group / 2;
          return (
            <g key={p.label}>
              <rect
                x={x0 - barW - 1.5}
                y={yFor(p.a)}
                width={barW}
                height={Math.max(0, padTop + chartH - yFor(p.a))}
                rx={2}
                fill="#34d399"
                opacity={0.85}
              >
                <title>{`${p.label} — ${aLabel}: ${p.a}`}</title>
              </rect>
              <rect
                x={x0 + 1.5}
                y={yFor(p.b)}
                width={barW}
                height={Math.max(0, padTop + chartH - yFor(p.b))}
                rx={2}
                fill="#38bdf8"
                opacity={0.85}
              >
                <title>{`${p.label} — ${bLabel}: ${p.b}`}</title>
              </rect>
              <text
                x={x0}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.45)"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> {aLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> {bLabel}
        </span>
      </div>
    </div>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerLabel: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img" aria-label={centerLabel}>
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="16"
        />
        {total > 0
          ? segments.map((s) => {
              const fraction = s.value / total;
              const dash = fraction * circumference;
              const el = (
                <circle
                  key={s.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="16"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
              offset += dash;
              return el;
            })
          : null}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          fill="white"
        >
          {total}
        </text>
        <text
          x="80"
          y="94"
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.45)"
          style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}
        >
          {centerLabel}
        </text>
      </svg>
      <ul className="min-w-40 flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-zinc-300">{s.label}</span>
            <span className="ml-auto font-mono text-zinc-100">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface BreakdownRow {
  label: string;
  value: number;
  color?: string;
  note?: string;
}

export function BreakdownBars({ rows }: { rows: BreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-zinc-300">{r.label}</span>
            <span className="font-mono text-zinc-100">
              {r.value}
              {r.note ? (
                <span className="ml-2 text-xs text-zinc-500">{r.note}</span>
              ) : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={cn("h-full rounded-full", !r.color && "bg-zinc-400")}
              style={{
                width: `${Math.max(2, (r.value / max) * 100)}%`,
                backgroundColor: r.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ScanStrip({
  scans,
}: {
  scans: Array<{ id: string; status: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {scans.map((s) => (
        <span
          key={s.id}
          title={s.label}
          className={cn(
            "h-4 w-4 rounded-sm",
            s.status === "success"
              ? "bg-emerald-400/80"
              : s.status === "partial_success"
                ? "bg-amber-400/80"
                : "bg-rose-400/80",
          )}
        />
      ))}
    </div>
  );
}
