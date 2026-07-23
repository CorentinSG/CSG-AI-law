import Link from "next/link";

import {
  getFreshnessLabelDisplay,
  type NewsFreshnessLabel,
  type SourceFreshnessStatus,
} from "@/agents/ai-regulation/newsCurrentness";
import {
  getStoryPhaseDisplay,
  type LegalStory,
  type LegalStoryPhase,
} from "@/agents/ai-regulation/storyClustering";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import {
  getLiveReliabilityLabel,
  getLiveStatusBadgeLabel,
} from "@/content/ai-regulation/live-intelligence";
import { formatDisplayDate, formatExactDateTime } from "@/lib/utils";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

// Left border accent by region for at-a-glance geographic identification
function getRegionBorderClass(region: string): string {
  if (region === "Europe" || region.startsWith("EU")) return "border-l-blue-500";
  if (region === "United States" || region === "North America") return "border-l-emerald-500";
  return "border-l-zinc-600";
}

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
  /**
   * Cross-source story clusters. When provided, one corroborated story renders
   * as a single row (phase + source count) instead of N duplicate item rows.
   */
  stories?: LegalStory[];
  lastCheckedAt: string | null;
  activity: LiveSourceActivityItem[];
  itemFreshnessById?: Record<string, NewsFreshnessLabel>;
  lang?: Locale;
}

function getPhaseToneClass(phase: LegalStoryPhase): string {
  switch (phase) {
    case "breaking":
      return "text-emerald-300";
    case "developing":
      return "text-sky-300";
    case "sustained":
      return "text-white/55";
    case "fading":
    default:
      return "text-white/35";
  }
}

function getActivitySummary(activity: LiveSourceActivityItem[]) {
  if (activity.length === 0) {
    return {
      title: "No public signals yet",
      body: "Monitoring continues in the background.",
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
      title: "Source access degraded",
      body: "Tracked sources were blocked or inaccessible; nothing shown until verified.",
    };
  }

  return {
    title: "No newly visible developments",
    body: "No new public legal signals ready to show right now.",
  };
}

export function LiveLegalIntelligencePanel({
  title,
  description,
  regionLabel,
  items,
  stories,
  lastCheckedAt,
  activity,
  itemFreshnessById,
  lang = DEFAULT_LOCALE,
}: LiveLegalIntelligencePanelProps) {
  const emptyState = getActivitySummary(activity);
  const rows =
    stories && stories.length > 0
      ? stories.map((story) => ({
          item: story.primary,
          phase: story.phase,
          corroboration: story.corroboration,
          extraSources: story.members
            .slice(1)
            .filter(
              (member, index, all) =>
                member.sourceName !== story.primary.sourceName &&
                all.findIndex((entry) => entry.sourceName === member.sourceName) === index,
            )
            .slice(0, 3),
        }))
      : items.map((item) => ({
          item,
          phase: null,
          corroboration: null,
          extraSources: [] as AiLawNewsItem[],
        }));

  return (
    <section className="space-y-5">
      {/* Header — flat, no framed console */}
      <div className="space-y-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--color-live,#10b981)] opacity-50" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--color-live,#10b981)]" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
            Live monitoring · {regionLabel}
          </span>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
            {formatExactDateTime(lastCheckedAt)}
          </span>
        </div>
        <h2 className="font-display text-2xl font-medium tracking-[-0.03em] text-white/95 md:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-white/60">{description}</p>
      </div>

      {/* Signals — card rows with region accent */}
      {rows.length > 0 ? (
        <ol className="space-y-3 border-b border-white/8 pb-3">
          {rows.map(({ item, phase, corroboration, extraSources }) => (
            <li
              key={item.id}
              className={`group rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] border-l-2 ${getRegionBorderClass(item.region)}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/45">
                {phase ? (
                  <>
                    <span className={getPhaseToneClass(phase)}>
                      {getStoryPhaseDisplay(phase)}
                    </span>
                    <span aria-hidden className="text-white/25">·</span>
                  </>
                ) : null}
                <span className="text-white/65">{getLiveStatusBadgeLabel(item)}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{getLiveReliabilityLabel(item.sourceReliability)}</span>
                {corroboration && corroboration.sourceCount > 1 ? (
                  <>
                    <span aria-hidden className="text-white/25">·</span>
                    <span className="text-[color:var(--color-accent-strong,#c4882a)]">
                      Corroboré · {corroboration.sourceCount} sources
                    </span>
                  </>
                ) : null}
                {itemFreshnessById?.[item.id] ? (
                  <>
                    <span aria-hidden className="text-white/25">·</span>
                    <span>{getFreshnessLabelDisplay(itemFreshnessById[item.id])}</span>
                  </>
                ) : null}
              </div>

              <h3 className="text-[17px] font-medium leading-6 tracking-[-0.01em] text-white/90 transition-colors group-hover:text-white">
                <Link href={localeHref(lang, `/news/${item.slug}`)}>{item.title}</Link>
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-white/55">{item.shortSummary}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                <span>{item.jurisdiction}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{item.legalArea}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>Publié {formatDisplayDate(item.publicationDate)}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{item.sourceName}</span>
                {item.officialSourceUrl ? (
                  <>
                    <span aria-hidden className="text-white/25">·</span>
                    <a
                      href={item.officialSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[color:var(--color-accent-strong,#c4882a)] transition-colors hover:text-white/80"
                    >
                      source officielle ↗
                    </a>
                  </>
                ) : (
                  <>
                    <span aria-hidden className="text-white/25">·</span>
                    <span className="text-amber-300/80">vérification officielle en attente</span>
                  </>
                )}
                {extraSources.map((member) => (
                  <span key={member.id} className="contents">
                    <span aria-hidden className="text-white/25">·</span>
                    <a
                      href={member.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/55 transition-colors hover:text-white/80"
                    >
                      aussi via {member.sourceName} ↗
                    </a>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="border-y border-white/8 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            État public
          </p>
          <p className="mt-2 font-display text-xl font-medium tracking-[-0.03em] text-white/90">
            {emptyState.title}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">{emptyState.body}</p>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/45">
            Seuls les développements sourcés et publiquement sûrs apparaissent ici — un
            élément s&apos;affiche une fois source, date et vérification prêtes.
          </p>
        </div>
      )}
    </section>
  );
}
