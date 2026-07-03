import Link from "next/link";

import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import { formatDisplayDate } from "@/lib/utils";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

interface IntelligenceSummaryBandProps {
  recentUpdates: Pick<
    AiRegulatoryUpdate,
    "id" | "title" | "region" | "jurisdiction" | "developmentType" | "publicationDate" | "sourceName"
  >[];
  recentNews: Pick<
    AiLawNewsItem,
    "id" | "title" | "region" | "publicationDate" | "detectedAt" | "verificationStatus" | "sourceName"
  >[];
  europeCount: number;
  usCount: number;
  totalPublished: number;
  lang?: Locale;
}

function VerificationDot({ status }: { status: string }) {
  const isVerified =
    status === "official_verified" ||
    status === "corroborated" ||
    status === "published_news";
  return (
    <span
      className={[
        "inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full",
        isVerified ? "bg-emerald-500" : "bg-amber-400",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

export function IntelligenceSummaryBand({
  recentUpdates,
  recentNews,
  europeCount,
  usCount,
  totalPublished,
  lang = DEFAULT_LOCALE,
}: IntelligenceSummaryBandProps) {
  const hasUpdates = recentUpdates.length > 0;
  const hasNews = recentNews.length > 0;

  return (
    <div className="rounded-[2rem] border border-black/6 bg-white/80 shadow-[0_8px_32px_rgba(15,15,15,0.04)] backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 px-7 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
            Intelligence summary
          </p>
        </div>
        <p className="font-mono text-[10px] text-zinc-400">
          {totalPublished} published database {totalPublished === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="grid gap-0 divide-y divide-black/5 md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* Column 1: What changed — recent DB entries */}
        <div className="px-6 py-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-400">
            What changed
          </p>
          <div className="mt-3 space-y-3">
            {hasUpdates ? (
              recentUpdates.map((item) => (
                <Link
                  key={item.id}
                  href={localeHref(lang, `/ai-regulation/${item.id}`)}
                  className="block group"
                >
                  <p className="text-[12px] font-medium leading-5 text-zinc-800 group-hover:text-zinc-950 line-clamp-2">
                    {item.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-zinc-400">
                    {item.region}
                    {item.publicationDate
                      ? ` · ${formatDisplayDate(item.publicationDate)}`
                      : ""}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-[12px] text-zinc-400">
                No published database entries yet.
              </p>
            )}
          </div>
          {hasUpdates && (
            <Link
              href={localeHref(lang, "/ai-regulation?view=database")}
              className="mt-4 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-700"
            >
              Open legal database →
            </Link>
          )}
        </div>

        {/* Column 2: What to watch — recent news signals */}
        <div className="px-6 py-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-400">
            What to watch
          </p>
          <div className="mt-3 space-y-3">
            {hasNews ? (
              recentNews.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="mt-[5px]">
                    <VerificationDot status={item.verificationStatus} />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium leading-5 text-zinc-800 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] text-zinc-400">
                      {item.sourceName}
                      {(item.publicationDate ?? item.detectedAt)
                        ? ` · ${formatDisplayDate((item.publicationDate ?? item.detectedAt)!)}`
                        : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-zinc-400">
                No recent developments yet.
              </p>
            )}
          </div>
          {hasNews && (
            <Link
              href={localeHref(lang, "/ai-regulation?view=news")}
              className="mt-4 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-700"
            >
              Open AI Law News →
            </Link>
          )}
        </div>

        {/* Column 3: Regional coverage */}
        <div className="px-6 py-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-400">
            Regional coverage
          </p>
          <div className="mt-3 space-y-3">
            <Link
              href={localeHref(lang, "/ai-regulation/europe")}
              className="flex items-center justify-between group"
            >
              <span className="text-[12px] text-zinc-700 group-hover:text-zinc-950">Europe hub</span>
              <span className="font-mono text-[10px] text-zinc-400">
                {europeCount} states tracked
              </span>
            </Link>
            <div className="h-px bg-black/5" />
            <Link
              href={localeHref(lang, "/ai-regulation/united-states")}
              className="flex items-center justify-between group"
            >
              <span className="text-[12px] text-zinc-700 group-hover:text-zinc-950">United States hub</span>
              <span className="font-mono text-[10px] text-zinc-400">
                {usCount} states tracked
              </span>
            </Link>
          </div>
          <div className="mt-4 rounded-xl border border-black/5 bg-zinc-50 p-3">
            <p className="text-[11px] leading-5 text-zinc-500">
              Europe and U.S. remain structurally separate. Official sources
              control legal authority on both sides.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
