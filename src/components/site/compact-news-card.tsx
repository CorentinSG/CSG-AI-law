"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { getNewsVerificationLabel, type AiLawNewsItem } from "@/content/ai-regulation/news";
import { formatDisplayDate } from "@/lib/utils";
import { getLocaleFromPathname, localeHref } from "@/lib/i18n/href";

// Verification dot: green = official/corroborated, amber = media/needs_review, gray = discovery
function VerificationDot({ status }: { status: string }) {
  const color =
    status === "official_verified" || status === "corroborated" || status === "published_news"
      ? "bg-emerald-500"
      : status === "needs_review" || status === "media_reported"
        ? "bg-amber-400"
        : "bg-zinc-300";
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />;
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
      <article className="group flex gap-4 rounded-[1.6rem] border border-black/6 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,15,15,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,15,15,0.07)]">
        {/* Optional thumbnail */}
        {hasImage ? (
          <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-[0.9rem] bg-zinc-100">
            <Image
              src={item.imageUrl!}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
              onError={() => setImgError(true)}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[0.9rem] bg-zinc-50">
            <span className={`font-mono text-[9px] uppercase tracking-[0.18em] ${
              item.region === "Europe" ? "text-indigo-400" : "text-red-400"
            }`}>
              {item.region === "Europe" ? "EU" : "US"}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <VerificationDot status={item.verificationStatus} />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
              {item.region} · {formatDisplayDate(item.publicationDate)}
            </p>
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-950">
            <Link href={localeHref(lang, `/news/${item.slug}`)} className="hover:underline decoration-black/15 underline-offset-4">
              {item.title}
            </Link>
          </h3>
          <div className="flex items-center gap-3">
            <p className="text-xs text-zinc-500">{item.sourceName}</p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 underline decoration-black/10 underline-offset-4 hover:text-zinc-700"
              >
                source ↗
              </a>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  // Compact vertical (for denser layouts)
  return (
    <article className="rounded-[1.4rem] border border-black/6 bg-white/90 p-4 shadow-[0_6px_18px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,15,15,0.07)]">
      <div className="flex items-center gap-2">
        <VerificationDot status={item.verificationStatus} />
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
          {item.region} · {formatDisplayDate(item.publicationDate)}
        </p>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-zinc-950">
        <Link href={localeHref(lang, `/news/${item.slug}`)} className="hover:underline">
          {item.title}
        </Link>
      </h3>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xs text-zinc-500">{item.sourceName}</p>
        <span className="text-zinc-200">·</span>
        <p className="text-xs text-zinc-400">{getNewsVerificationLabel(item)}</p>
      </div>
    </article>
  );
}
