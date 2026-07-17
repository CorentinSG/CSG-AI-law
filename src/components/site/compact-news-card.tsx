"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { getNewsVerificationLabel, type AiLawNewsItem } from "@/content/ai-regulation/news";
import { formatDisplayDate } from "@/lib/utils";
import { getLocaleFromPathname, localeHref } from "@/lib/i18n/href";

// Verification dot: green = official/corroborated, amber = media/needs_review,
// gray = discovery. Always paired with the worded label in the footer.
function VerificationDot({ status }: { status: string }) {
  const color =
    status === "official_verified" || status === "corroborated" || status === "published_news"
      ? "bg-emerald-500"
      : status === "needs_review" || status === "media_reported"
        ? "bg-amber-400"
        : "bg-zinc-500";
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}

// Region roundel — a small lit instrument tile instead of a flat gray box.
const REGION_TILE: Record<string, { code: string; glow: string; ring: string; text: string }> = {
  europe: {
    code: "EU",
    glow: "bg-[radial-gradient(circle_at_35%_30%,rgba(129,140,248,0.28),transparent_70%)]",
    ring: "border-indigo-300/25",
    text: "text-indigo-300",
  },
  "united-states": {
    code: "US",
    glow: "bg-[radial-gradient(circle_at_35%_30%,rgba(248,113,113,0.26),transparent_70%)]",
    ring: "border-red-300/25",
    text: "text-red-300",
  },
  other: {
    code: "INT",
    glow: "bg-[radial-gradient(circle_at_35%_30%,rgba(45,212,191,0.24),transparent_70%)]",
    ring: "border-teal-300/25",
    text: "text-teal-300",
  },
};

function regionTile(region: string) {
  if (region === "Europe" || region.startsWith("EU")) return REGION_TILE.europe;
  if (region === "United States" || region === "North America") return REGION_TILE["united-states"];
  return REGION_TILE.other;
}

function RegionRoundel({ region }: { region: string }) {
  const t = regionTile(region);
  return (
    <div
      aria-hidden
      className={`relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white/[0.03] ${t.ring}`}
    >
      <span className={`absolute inset-0 ${t.glow}`} />
      <span className={`relative font-mono text-[10px] font-medium uppercase tracking-[0.18em] ${t.text}`}>
        {t.code}
      </span>
    </div>
  );
}

interface CompactNewsCardProps {
  item: AiLawNewsItem;
  /** When true, display the card horizontally (default); false = compact vertical */
  horizontal?: boolean;
}

export function CompactNewsCard({ item, horizontal = true }: CompactNewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const lang = getLocaleFromPathname(usePathname());
  const hasImage = Boolean(item.imageUrl) && !imgError;

  if (horizontal) {
    return (
      <article className="group relative flex items-center gap-5 rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-4 pr-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {/* Thumbnail when available; lit region roundel otherwise */}
        {hasImage ? (
          <div className="relative h-[64px] w-[88px] shrink-0 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
            <Image
              src={item.imageUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="88px"
              onError={() => setImgError(true)}
              unoptimized
            />
          </div>
        ) : (
          <RegionRoundel region={item.region} />
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <VerificationDot status={item.verificationStatus} />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
              {item.region}
              <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
              {formatDisplayDate(item.publicationDate)}
            </p>
          </div>
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-zinc-950">
            <Link
              href={localeHref(lang, `/news/${item.slug}`)}
              className="after:absolute after:inset-0"
            >
              {item.title}
            </Link>
          </h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-zinc-400">
            <span className="text-zinc-500">{item.sourceName}</span>
            <span aria-hidden className="text-zinc-300">·</span>
            <span>{getNewsVerificationLabel(item)}</span>
            {item.sourceUrl ? (
              <>
                <span aria-hidden className="text-zinc-300">·</span>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative z-10 inline-flex items-center gap-1 text-accent-strong transition-colors hover:text-zinc-800"
                >
                  <ArrowUpRight className="size-2.5" />
                  source
                </a>
              </>
            ) : null}
          </p>
        </div>

        {/* Trailing arrow — slides in on hover */}
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 -translate-x-1 text-zinc-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-zinc-600 group-hover:opacity-100"
        />
      </article>
    );
  }

  // Compact vertical (for denser layouts)
  return (
    <article className="group relative rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_16px_40px_rgba(0,0,0,0.38)]">
      <div className="flex items-center gap-2">
        <VerificationDot status={item.verificationStatus} />
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
          {item.region}
          <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
          {formatDisplayDate(item.publicationDate)}
        </p>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-zinc-950">
        <Link href={localeHref(lang, `/news/${item.slug}`)} className="after:absolute after:inset-0">
          {item.title}
        </Link>
      </h3>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-zinc-400">
        <span className="text-zinc-500">{item.sourceName}</span>
        <span aria-hidden className="text-zinc-300">·</span>
        <span>{getNewsVerificationLabel(item)}</span>
      </p>
    </article>
  );
}
