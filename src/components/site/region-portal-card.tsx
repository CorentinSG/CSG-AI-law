import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface RegionPortalCardProps {
  region: "europe" | "united-states" | "international";
  title: string;
  /** Kept in the API for callers, but no longer rendered — the card stays
   *  minimal: kicker, title, one stat line, a few chips. */
  description?: string;
  href: string;
  liveLabel?: string;
  liveCount?: number;
  dbCount?: number;
  highlights: { label: string; href: string }[];
  isLive?: boolean;
  /** Kicker text override — e.g. "Transnational layer" for the international
   *  portal, which is a cross-cutting layer rather than a third territory. */
  kickerLabel?: string;
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
  href,
  liveCount,
  dbCount,
  highlights,
  isLive = true,
  kickerLabel,
}: RegionPortalCardProps) {
  const stats = [
    liveCount !== undefined ? `${liveCount} news` : null,
    dbCount !== undefined ? `${dbCount} entries` : null,
  ].filter(Boolean);

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col gap-5 rounded-[2.2rem] border border-white/10 p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${regionGradients[region]}`}
    >
      {/* Kicker + trailing arrow */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          ) : null}
          <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${regionAccent[region]}`}>
            {kickerLabel ?? (isLive ? "Live monitoring" : "Monitoring")}
          </p>
        </div>
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/70"
        />
      </div>

      {/* Title + one quiet stat line */}
      <div className="space-y-2">
        <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950 md:text-3xl">
          {title}
        </p>
        {stats.length > 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {stats.join(" · ")}
          </p>
        ) : null}
      </div>

      {/* A few destination chips */}
      {highlights.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {highlights.slice(0, 4).map((h) => (
            <span
              key={h.label}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600"
            >
              {h.label}
            </span>
          ))}
          {highlights.length > 4 ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-zinc-400">
              +{highlights.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
