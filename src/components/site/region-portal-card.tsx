import Link from "next/link";

interface RegionPortalCardProps {
  region: "europe" | "united-states" | "international";
  title: string;
  description: string;
  href: string;
  liveLabel?: string;
  liveCount?: number;
  dbCount?: number;
  highlights: { label: string; href: string }[];
  isLive?: boolean;
}

// Dark frosted glass with a faint regional tint. The site renders on a near-black
// body and .dark-site whitens the zinc text, so these backgrounds must be dark —
// a light fill here would put white text on a white card.
const regionGradients = {
  europe:
    "bg-[radial-gradient(ellipse_at_top_left,rgba(129,140,248,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
  "united-states":
    "bg-[radial-gradient(ellipse_at_top_right,rgba(248,113,113,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
  international:
    "bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
};

const regionAccent = {
  europe: "text-indigo-300",
  "united-states": "text-red-300",
  international: "text-teal-300",
};

export function RegionPortalCard({
  region,
  title,
  description,
  href,
  liveLabel,
  liveCount,
  dbCount,
  highlights,
  isLive = true,
}: RegionPortalCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-[2.2rem] border border-black/6 p-7 shadow-[0_22px_60px_rgba(15,15,15,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_rgba(15,15,15,0.08)] ${regionGradients[region]}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            ) : null}
            <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${regionAccent[region]}`}>
              {isLive ? "Live monitoring" : "Monitoring"}
            </p>
          </div>
          <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950 md:text-3xl">
            {title}
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-zinc-600 transition group-hover:border-black/15 group-hover:bg-zinc-50">
          Open hub →
        </span>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm leading-7 text-zinc-700">{description}</p>

      {/* Stats */}
      <div className="mt-5 flex flex-wrap gap-3">
        {liveCount !== undefined ? (
          <div className="rounded-[1.2rem] border border-black/6 bg-white/80 px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">
              {liveLabel ?? "Legal news"}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-950">{liveCount} items</p>
          </div>
        ) : null}
        {dbCount !== undefined ? (
          <div className="rounded-[1.2rem] border border-black/6 bg-white/80 px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">
              Published
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-950">{dbCount} entries</p>
          </div>
        ) : null}
      </div>

      {/* Country/state chips */}
      {highlights.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {highlights.slice(0, 6).map((h) => (
            <span
              key={h.label}
              className="rounded-full border border-black/6 bg-white/70 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-zinc-600"
            >
              {h.label}
            </span>
          ))}
          {highlights.length > 6 ? (
            <span className="rounded-full border border-black/6 bg-white/70 px-2.5 py-1 text-xs text-zinc-400">
              +{highlights.length - 6} more
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
