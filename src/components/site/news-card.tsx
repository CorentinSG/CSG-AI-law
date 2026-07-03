import Link from "next/link";

import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import { getNewsSourceSignal } from "@/lib/news-source-signal";
import { formatDisplayDate } from "@/lib/utils";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

// Verification signal is never color-alone: a dot pairs with a worded label.
const signalDot: Record<string, string> = {
  official: "bg-emerald-400",
  press: "bg-sky-400",
  discovery: "bg-amber-400",
};

/**
 * A single news development, rendered as a flat ledger row (title + one meta
 * line), not a framed card. Meant to sit inside a hairline-divided list. The
 * full "at a glance" breakdown lives on the item's own page.
 */
export function NewsCard({ item, lang = DEFAULT_LOCALE }: { item: AiLawNewsItem; lang?: Locale }) {
  const signal = getNewsSourceSignal(item);
  return (
    <article className="group py-5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-2 size-1.5 flex-shrink-0 rounded-full ${signalDot[signal.tone] ?? "bg-white/40"}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-medium leading-6 tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
            <Link href={localeHref(lang, `/news/${item.slug}`)}>{item.title}</Link>
          </h2>

          <p className="mt-2 text-[14px] leading-6 text-white/55">{item.shortSummary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            <span className="text-white/60">{item.region}</span>
            <span aria-hidden className="text-white/25">·</span>
            <span>{formatDisplayDate(item.publicationDate)}</span>
            <span aria-hidden className="text-white/25">·</span>
            <span>{item.sourceName}</span>
            <span aria-hidden className="text-white/25">·</span>
            <span className="text-white/60">{signal.label}</span>
            {item.sourceUrl ? (
              <>
                <span aria-hidden className="text-white/25">·</span>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[color:var(--color-accent-strong,#c4882a)] transition-colors hover:text-white/80"
                >
                  source ↗
                </a>
              </>
            ) : null}
          </div>

          {signal.caveat ? (
            <p className="mt-2.5 text-[12.5px] leading-5 text-amber-300/80">
              {signal.caveat}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
