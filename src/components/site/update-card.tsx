import Link from "next/link";

import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
} from "@/agents/ai-regulation/utils/authority";
import { AuthorityBadge } from "@/components/site/authority-badge";
import { MotionStaggerItem } from "@/components/site/motion-stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/utils";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

// Compact monitor-entry card. One kicker line, title, summary, one metadata
// line, source link — no KPI tiles, no boilerplate explainers, no field table.
// The detail page carries the full record; the card only has to earn the click.
export function UpdateCard({
  update,
  href,
  lang = DEFAULT_LOCALE,
}: {
  update: AiRegulatoryUpdate;
  href: string;
  lang?: Locale;
}) {
  const authorityType = deriveUpdateAuthorityType(update);
  const authority = getAuthorityPresentation(authorityType);
  const highSignal =
    update.importanceLevel === "critical" || update.importanceLevel === "high";

  return (
    <MotionStaggerItem className="h-full">
      <Card className="glass-panel-soft group h-full rounded-[1.9rem] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              {update.region}
              {update.country ? ` · ${update.country}` : ""}
            </p>
            <AuthorityBadge
              label={authority.label}
              authorityType={authorityType}
              className="shrink-0 normal-case tracking-[0.12em]"
            />
          </div>
          <CardTitle className="font-display text-lg font-medium leading-snug tracking-[-0.02em] text-zinc-950">
            <Link href={localeHref(lang, href)}>{update.title}</Link>
          </CardTitle>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {formatDisplayDate(update.publicationDate)}
            <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
            {update.legalArea}
            {highSignal ? (
              <>
                <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
                <span className="text-[color:var(--color-accent-strong,#c4882a)]">
                  {update.importanceLevel === "critical"
                    ? "Critical"
                    : "High importance"}
                </span>
              </>
            ) : null}
          </p>
        </CardHeader>
        <CardContent className="flex h-full flex-col justify-between gap-4 text-sm text-zinc-700">
          <p className="line-clamp-3 leading-7">{update.oneSentenceSummary}</p>
          <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
            <span className="min-w-0 truncate text-xs text-zinc-500">
              {update.sourceName}
            </span>
            {update.sourceUrl ? (
              <a
                href={update.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs text-zinc-400 underline decoration-black/10 underline-offset-4 hover:text-zinc-700"
              >
                source ↗
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </MotionStaggerItem>
  );
}
