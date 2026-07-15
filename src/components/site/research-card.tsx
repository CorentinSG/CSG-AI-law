import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MotionStaggerItem } from "@/components/site/motion-stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

// Content-state styling so readers instantly tell what is live vs. announced.
const statusStyles: Record<string, string> = {
  published: "border-emerald-300/50 bg-emerald-50 text-emerald-700",
  forthcoming: "border-amber-300/60 bg-amber-50 text-amber-700",
  draft: "border-zinc-300 bg-zinc-100 text-zinc-500",
};

const statusLabels: Record<string, string> = {
  published: "Published",
  forthcoming: "Forthcoming",
  draft: "Draft",
};

export function ResearchCard({
  category,
  title,
  description,
  href,
  status,
  meta,
  tags,
  lang = DEFAULT_LOCALE,
}: {
  category: string;
  title: string;
  description: string;
  href?: string;
  status?: string;
  meta?: string;
  tags?: string[];
  lang?: Locale;
}) {
  const isForthcoming = status === "forthcoming";
  const statusKey = status?.toLowerCase() ?? "";
  const content = (
    <MotionStaggerItem className="h-full">
      <Card
        className={`glass-panel-soft premium-sheen h-full rounded-[1.9rem] text-zinc-900 transition duration-300 ${
          isForthcoming
            ? "border-dashed border-amber-300/50"
            : "hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,15,0.08)]"
        }`}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">{category}</p>
            {status ? (
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${
                  statusStyles[statusKey] ?? "border-black/8 bg-zinc-50 text-zinc-600"
                }`}
              >
                {statusLabels[statusKey] ?? status}
              </span>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
              {title}
            </CardTitle>
            {!isForthcoming ? (
              <ArrowRight className="mt-1 size-4 shrink-0 text-zinc-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            ) : null}
          </div>
          {meta ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{meta}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-zinc-700">
          <p className="line-clamp-2">{description}</p>
          {tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/8 bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </MotionStaggerItem>
  );

  if (!href) return content;

  return (
    <Link href={localeHref(lang, href)} className="group block h-full">
      {content}
    </Link>
  );
}
