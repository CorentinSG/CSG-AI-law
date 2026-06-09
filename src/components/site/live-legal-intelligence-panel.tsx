import Link from "next/link";

import {
  getFreshnessLabelDisplay,
  getSourceFreshnessDisplay,
  type NewsFreshnessLabel,
  type SourceFreshnessStatus,
} from "@/agents/ai-regulation/newsCurrentness";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import {
  getLiveReliabilityLabel,
  getLiveStatusBadgeLabel,
} from "@/content/ai-regulation/live-intelligence";
import { Card, CardContent } from "@/components/ui/card";
import { formatDisplayDate, formatExactDateTime } from "@/lib/utils";

interface LiveSourceActivityItem {
  sourceId: string;
  sourceName: string;
  checkedAt: string;
  responseStatus: number | null;
  parserStatus: string;
  activeRecommendation: string;
  currentness?: {
    freshnessStatus: SourceFreshnessStatus;
  };
}

interface LiveLegalIntelligencePanelProps {
  title: string;
  description: string;
  regionLabel: string;
  items: AiLawNewsItem[];
  lastCheckedAt: string | null;
  activity: LiveSourceActivityItem[];
  itemFreshnessById?: Record<string, NewsFreshnessLabel>;
}

function getActivitySummary(activity: LiveSourceActivityItem[]) {
  if (activity.length === 0) {
    return {
      title: "No public signals yet",
      body:
        "This live desk is active, but no source-backed developments are publicly visible yet for this region. Official-source monitoring and verification continue in the background.",
    };
  }

  const blockedCount = activity.filter(
    (entry) =>
      entry.responseStatus === 401 ||
      entry.responseStatus === 403 ||
      entry.currentness?.freshnessStatus === "source_inaccessible",
  ).length;

  if (blockedCount === activity.length) {
    return {
      title: "Monitoring is active, but source access is degraded",
      body:
        "Recent checks reached the monitoring layer, but the tracked sources were blocked or inaccessible from this runtime. Nothing is shown publicly until the system can verify source-backed signals safely.",
    };
  }

  return {
    title: "No newly visible developments",
    body:
      "The monitoring loop is running, but there are no new public legal signals ready to show right now. This can mean the latest checks returned duplicates, older material, or leads still waiting for verification.",
  };
}

function getStatusTone(item: Pick<
  AiLawNewsItem,
  "verificationStatus" | "officialSourceFound" | "sourceType"
>) {
  if (
    item.verificationStatus === "published_news" ||
    item.verificationStatus === "official_verified" ||
    item.officialSourceFound
  ) {
    return "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";
  }

  if (item.verificationStatus === "corroborated") {
    return "border-blue-300/30 bg-blue-400/10 text-blue-100";
  }

  return "border-amber-300/30 bg-amber-400/10 text-amber-100";
}

export function LiveLegalIntelligencePanel({
  title,
  description,
  regionLabel,
  items,
  lastCheckedAt,
  activity,
  itemFreshnessById,
}: LiveLegalIntelligencePanelProps) {
  const emptyState = getActivitySummary(activity);

  return (
    <Card className="group relative overflow-hidden rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(7,13,24,0.96),rgba(17,24,39,0.9))] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent opacity-80" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(circle_at_left,rgba(56,189,248,0.12),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-6 h-px animate-pulse bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent" />
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                Live monitoring
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
                {regionLabel}
              </span>
            </div>
            <div className="space-y-3">
              <p className="font-display text-3xl font-medium uppercase tracking-[-0.05em] text-white">
                {title}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-zinc-300">
                {description}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Last checked
                </p>
                <p className="mt-2 text-sm text-zinc-100">
                  {formatExactDateTime(lastCheckedAt)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Watching
                </p>
                <p className="mt-2 text-sm text-zinc-100">
                  Official sources + verified discovery leads
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Visible now
                </p>
                <p className="mt-2 text-sm text-zinc-100">
                  {items.length} source-backed legal signals
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              Source activity
            </p>
            {activity.length > 0 ? (
              activity.map((entry) => (
                <div
                  key={`${entry.sourceId}-${entry.checkedAt}`}
                  className="rounded-[1.2rem] border border-white/8 bg-black/10 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {entry.sourceName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        checked {formatExactDateTime(entry.checkedAt)}
                      </p>
                    </div>
                    <div className="text-right text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                      <p>{entry.responseStatus ?? "n/a"}</p>
                      <p className="mt-1">{entry.parserStatus.replaceAll("_", " ")}</p>
                      {entry.currentness ? (
                        <p className="mt-1 text-[10px] text-zinc-500">
                          {getSourceFreshnessDisplay(entry.currentness.freshnessStatus)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
                No recent source-health snapshot is publicly available yet for this region.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {items.length > 0 ? (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_12px_35px_rgba(8,15,28,0.14)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.07]"
              >
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${getStatusTone(item)}`}
                  >
                    {getLiveStatusBadgeLabel(item)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {getLiveReliabilityLabel(item.sourceReliability)}
                  </span>
                  {itemFreshnessById?.[item.id] ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                      {getFreshnessLabelDisplay(itemFreshnessById[item.id])}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-white">
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </p>
                  <p className="text-sm leading-7 text-zinc-300">{item.shortSummary}</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Source
                    </p>
                    <p className="mt-2 text-sm text-zinc-100">{item.sourceName}</p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-zinc-400 underline decoration-white/10 underline-offset-4"
                    >
                      Open original source
                    </a>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Dates
                    </p>
                    <p className="mt-2 text-sm text-zinc-100">
                      Published {formatDisplayDate(item.publicationDate)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Event{" "}
                      {item.exactDateOfInformation
                        ? formatDisplayDate(item.exactDateOfInformation)
                        : "date requires verification"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Detected {formatExactDateTime(item.detectedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span>{item.jurisdiction}</span>
                  <span>{item.sourceType.replaceAll("_", " ")}</span>
                  <span>{item.legalArea}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {item.officialSourceUrl ? (
                    <a
                      href={item.officialSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs uppercase tracking-[0.18em] text-cyan-100 underline decoration-cyan-300/25 underline-offset-4"
                    >
                      Official source
                    </a>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.18em] text-amber-200">
                      Official verification pending
                    </span>
                  )}
                  {item.relatedMonitorItemId ? (
                    <Link
                      href={`/ai-regulation/${item.relatedMonitorItemId}`}
                      className="text-xs uppercase tracking-[0.18em] text-zinc-200 underline decoration-white/10 underline-offset-4"
                    >
                      Verified monitor item
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="xl:col-span-3">
              <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-white/[0.04] p-6">
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Public live state
                    </p>
                    <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-white">
                      {emptyState.title}
                    </p>
                    <p className="text-sm leading-7 text-zinc-300">{emptyState.body}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.3rem] border border-white/10 bg-black/10 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Why nothing is listed
                      </p>
                      <p className="mt-3 text-sm leading-7 text-zinc-300">
                        This panel shows only source-backed developments that are safe to expose publicly. Unverified discovery leads and private review drafts stay out of sight.
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-white/10 bg-black/10 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        What happens next
                      </p>
                      <p className="mt-3 text-sm leading-7 text-zinc-300">
                        New official or corroborated developments will appear here only after the monitoring layer has source, date, and verification posture ready to show clearly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
