import Link from "next/link";

import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
} from "@/agents/ai-regulation/utils/authority";
import { AuthorityBadge } from "@/components/site/authority-badge";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { MotionStaggerItem } from "@/components/site/motion-stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/utils";

export function UpdateCard({
  update,
  href,
}: {
  update: AiRegulatoryUpdate;
  href: string;
}) {
  const authorityType = deriveUpdateAuthorityType(update);
  const authority = getAuthorityPresentation(authorityType);

  return (
    <MotionStaggerItem className="h-full">
      <Card className="glass-panel-soft h-full rounded-[1.9rem] shadow-[0_18px_45px_rgba(15,15,15,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,15,0.08)]">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            <span>{update.region}</span>
            <span>{update.jurisdiction}</span>
            <AuthorityBadge
              label={authority.label}
              authorityType={authorityType}
              className="normal-case tracking-[0.12em]"
            />
            <span>{update.developmentType}</span>
            <span>{update.importanceLevel}</span>
          </div>
          <CardTitle className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
            <Link href={href}>{update.title}</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-700">
          <p className="leading-7">{update.oneSentenceSummary}</p>

          {/* Key metadata: date + importance */}
          <div className="grid gap-3 md:grid-cols-2">
            <IntelligenceSignal
              label="Publication date"
              value={formatDisplayDate(update.publicationDate)}
              note="Date of the underlying development or official publication."
              tone="informative"
            />
            <IntelligenceSignal
              label="Importance"
              value={update.importanceLevel}
              note={authority.shortNote}
              tone={update.importanceLevel === "critical" || update.importanceLevel === "high" ? "warning" : "neutral"}
            />
          </div>

          {/* Quick-scan metadata */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-xs">
            <span className="text-zinc-400">Source</span>
            <span className="font-medium text-zinc-800 truncate">{update.sourceName}</span>
            <span className="text-zinc-400">Legal area</span>
            <span className="text-zinc-700">{update.legalArea}</span>
            {update.country ? (
              <>
                <span className="text-zinc-400">Country / state</span>
                <span className="text-zinc-700">{update.country}</span>
              </>
            ) : null}
          </div>

          {/* Tags + source link */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {update.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/6 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
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
