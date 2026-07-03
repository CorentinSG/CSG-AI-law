import type { Metadata } from "next";
import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { CompactNewsCard } from "@/components/site/compact-news-card";
import { FilterBar } from "@/components/site/filter-bar";
import { IntelligenceHubTabs } from "@/components/site/intelligence-hub-tabs";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { NewsCard } from "@/components/site/news-card";
import { CursorPaginationControls } from "@/components/site/pagination-controls";
import { RegionPortalCard } from "@/components/site/region-portal-card";
import { SectionHeading } from "@/components/site/section-heading";
import { EmptyFilterState, hasActiveFilterParams } from "@/components/site/empty-filter-state";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  filterNewsItems,
  normalizeNewsItemRecord,
  type NormalizedNewsItemRecord,
} from "@/content/ai-regulation/news";
import {
  getEuropeCountryProfiles,
  getPriorityEuropeCountryProfiles,
} from "@/content/ai-regulation/europe-country-profiles";
import {
  getPriorityUsStateProfiles,
  getUsStateAiLawProfiles,
} from "@/content/ai-regulation/us-state-ai-law-baseline";
import { encodeCursor, parseCursorParam } from "@/lib/pagination";
import type { RegulatoryUpdateFilters } from "@/db/repository-types";

export const metadata: Metadata = {
  title: "AI Legal Intelligence Hub",
  description:
    "A unified AI legal intelligence hub combining legal developments, source-backed monitoring, and region-structured AI law database coverage.",
};

// Stays dynamic (not ISR like the other public /ai-regulation pages, T-RT0C):
// this hub renders from searchParams (filters, tabs, cursor pagination), which
// forces per-request rendering — `revalidate` would have no effect here.
export const dynamic = "force-dynamic";

const databaseFilters = [
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "region", label: "Region" },
  { key: "legalArea", label: "Legal area" },
  { key: "developmentType", label: "Development type" },
  { key: "importanceLevel", label: "Importance" },
  { key: "publicationDate", label: "Date" },
  { key: "tag", label: "Tag" },
  { key: "sourceName", label: "Source" },
];

const newsFilters = [
  { key: "region", label: "Region" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "sourceType", label: "Source type" },
  { key: "verificationStatus", label: "Verification" },
  { key: "topic", label: "Topic" },
  { key: "developmentType", label: "Development" },
  { key: "date", label: "Date" },
];

const pageSize = 18;

type HubView = "overview" | "news" | "database";

function parseView(value: string | undefined): HubView {
  if (value === "news" || value === "database") {
    return value;
  }
  return "overview";
}

// Uses listDistinctFilterValues() — fetches only lightweight filter columns
// instead of loading all public updates into memory (B1 optimisation).
async function collectDatabaseOptions() {
  return updateRepository.listDistinctFilterValues("public");
}

async function getPublicNewsItems(afterCursor: import("@/lib/pagination").CursorPosition | null) {
  const result = await updateRepository.getPublicNewsItemsCursorPage({
    limit: pageSize,
    after: afterCursor,
  });

  return {
    ...result,
    items: result.items.map(normalizeNewsItemRecord),
  };
}

function collectNewsOptions(items: NormalizedNewsItemRecord[]) {
  return {
    region: Array.from(new Set(items.map((item) => item.region))).sort(),
    jurisdiction: Array.from(new Set(items.map((item) => item.jurisdiction))).sort(),
    sourceType: Array.from(new Set(items.map((item) => item.sourceType))).sort(),
    verificationStatus: Array.from(
      new Set(items.map((item) => item.verificationStatus)),
    ).sort(),
    topic: Array.from(new Set(items.flatMap((item) => item.topicTags))).sort(),
    developmentType: Array.from(
      new Set(items.map((item) => item.developmentType)),
    ).sort(),
    date: Array.from(
      new Set(items.map((item) => item.publicationDate).filter(Boolean)),
    ).sort() as string[],
  };
}

export default async function AiRegulationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const activeView = parseView(params.view);
  const afterCursor = parseCursorParam(params.after);
  const dbAfterCursor = parseCursorParam(params.dbafter);

  const [updatesPage, databaseOptions, newsPage] = await Promise.all([
    updateRepository.listPublicUpdatesCursorPage(params as RegulatoryUpdateFilters, {
      limit: pageSize,
      after: dbAfterCursor,
    }),
    collectDatabaseOptions(),
    getPublicNewsItems(afterCursor),
  ]);

  const updates = updatesPage.items;
  const newsOptions = collectNewsOptions(newsPage.items);
  const newsItems = filterNewsItems(newsPage.items, params);

  const hubTabs = [
    { label: "Overview", value: "overview", href: "/ai-regulation?view=overview" },
    { label: "AI Law News", value: "news", href: "/ai-regulation?view=news" },
    { label: "Legal Database", value: "database", href: "/ai-regulation?view=database" },
  ] as const;

  const europeProfiles = getPriorityEuropeCountryProfiles();
  const allEuropeProfiles = getEuropeCountryProfiles();
  const usProfiles = getPriorityUsStateProfiles();
  const allUsProfiles = getUsStateAiLawProfiles();

  const verifiedNewsCount = newsPage.items.filter(
    (item) =>
      item.verificationStatus === "official_verified" ||
      item.verificationStatus === "corroborated" ||
      item.verificationStatus === "published_news",
  ).length;
  const discoveryNewsCount = newsPage.items.filter(
    (item) =>
      item.verificationStatus === "discovery_only" ||
      item.verificationStatus === "media_reported" ||
      item.verificationStatus === "needs_official_source",
  ).length;

  const overviewNewsItems = newsPage.items.slice(0, 5);
  const overviewUpdates = updates.slice(0, 3);

  // Region-filtered news for portal cards
  const europeNewsCount = newsPage.items.filter((i) => i.region === "Europe").length;
  const usNewsCount = newsPage.items.filter(
    (i) => i.region === "United States" || i.region === "North America",
  ).length;

  return (
    <SiteShell className="space-y-10">
      <section className="space-y-6">
        <SectionHeading
          eyebrow="AI law hub"
          title="AI legal intelligence"
          actions={
            <Link
              href={activeView === "news" ? "/ai-regulation?view=database" : "/ai-regulation?view=news"}
              className="text-sm uppercase tracking-[0.16em] text-zinc-800 underline decoration-black/15 underline-offset-4"
            >
              {activeView === "news" ? "Open legal database" : "Open legal developments"}
            </Link>
          }
        />

        <IntelligenceHubTabs tabs={[...hubTabs]} activeValue={activeView} />
      </section>

      {activeView === "overview" ? (
        <>
          {/* --- Section 1: Latest AI law news (5 items, compact, scannable) --- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SectionHeading
                eyebrow="Latest AI law news"
                title="Recent legal developments"
              />
              <Link
                href="/ai-regulation?view=news"
                className="shrink-0 text-sm uppercase tracking-[0.16em] text-zinc-600 underline decoration-black/15 underline-offset-4"
              >
                All news →
              </Link>
            </div>

            {overviewNewsItems.length > 0 ? (
              <MotionStagger className="grid gap-3" stagger={0.06}>
                {overviewNewsItems.map((item) => (
                  <MotionStaggerItem key={item.id}>
                    <CompactNewsCard item={item} horizontal />
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            ) : (
              <Card className="rounded-[1.8rem] border-black/6 bg-white/90 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-zinc-200" />
                    <p className="text-sm text-zinc-500">
                      No public legal developments yet. The intelligence layer is monitoring — source-backed items will appear here once published.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* --- Section 2: Region portals — Europe + US --- */}
          <section className="space-y-4">
            <SectionHeading
              eyebrow="Regional intelligence"
              title="Europe and United States"
            />
            <MotionStagger className="grid gap-5 lg:grid-cols-2" stagger={0.12}>
              <MotionStaggerItem>
                <RegionPortalCard
                  region="europe"
                  title="Europe"
                  description="EU AI Act and Member State implementation."
                  href="/ai-regulation/europe"
                  liveLabel="Europe news"
                  liveCount={europeNewsCount}
                  dbCount={updatesPage.items.length}
                  highlights={europeProfiles.map((p) => ({ label: p.countryName, href: `/ai-regulation/europe/${p.slug}` }))}
                  isLive
                />
              </MotionStaggerItem>
              <MotionStaggerItem>
                <RegionPortalCard
                  region="united-states"
                  title="United States"
                  description="Federal and 50-state AI law coverage."
                  href="/ai-regulation/united-states"
                  liveLabel="U.S. news"
                  liveCount={usNewsCount}
                  dbCount={updatesPage.items.length}
                  highlights={usProfiles.map((p) => ({ label: p.stateName, href: `/ai-regulation/united-states/${p.slug}` }))}
                  isLive
                />
              </MotionStaggerItem>
            </MotionStagger>
          </section>

          {/* --- Section 3: Database preview (3 entries) --- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SectionHeading
                eyebrow="Legal database"
                title="Latest published monitor entries"
              />
              <Link
                href="/ai-regulation?view=database"
                className="shrink-0 text-sm uppercase tracking-[0.16em] text-zinc-600 underline decoration-black/15 underline-offset-4"
              >
                Full database →
              </Link>
            </div>
            <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {overviewUpdates.length > 0 ? (
                overviewUpdates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    href={`/ai-regulation/${update.id}`}
                  />
                ))
              ) : (
                <Card className="rounded-[1.8rem] border-black/6 bg-white/90 shadow-sm md:col-span-2 xl:col-span-3">
                  <CardContent className="p-6">
                    <p className="text-sm text-zinc-500">
                      No published database entries yet. The structured legal database stays intentionally empty until a human reviewer approves and manually publishes an entry.
                    </p>
                  </CardContent>
                </Card>
              )}
            </MotionStagger>
          </section>

          {/* --- Section 4: Source posture (compact) --- */}
          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[2rem] border-black/6 bg-white/90 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardContent className="space-y-4 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  Source posture
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <IntelligenceSignal
                    label="Officially verified"
                    value={String(verifiedNewsCount)}
                    tone="positive"
                  />
                  <IntelligenceSignal
                    label="Discovery / media"
                    value={String(discoveryNewsCount)}
                    tone="warning"
                  />
                </div>
              </CardContent>
            </Card>
            <Link
              href="/ai-regulation/methodology"
              className="group flex flex-col justify-between gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]"
            >
              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  How to read this hub
                </p>
                <p className="text-sm leading-6 text-zinc-500">
                  Verification levels, authority classification, and the source-and-review
                  posture behind every published item.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 transition-colors group-hover:text-white/80">
                Read the methodology →
              </span>
            </Link>
          </section>
        </>
      ) : null}

      {activeView === "news" ? (
        <>
          <section className="space-y-6">
            <SectionHeading
              eyebrow="AI Law News"
              title="Legal developments"
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <IntelligenceSignal
                label={newsPage.hasMore ? "News items shown" : "News items"}
                value={String(newsPage.items.length)}
                tone="informative"
              />
              <IntelligenceSignal
                label="Officially supported"
                value={String(verifiedNewsCount)}
                tone="positive"
              />
              <IntelligenceSignal
                label="Discovery-led"
                value={String(discoveryNewsCount)}
                tone="warning"
              />
              <IntelligenceSignal
                label="Regions"
                value="Europe + U.S."
                tone="neutral"
              />
            </div>
          </section>

          <FilterBar
            searchParams={params}
            options={newsOptions}
            basePath="/ai-regulation"
            filters={newsFilters}
            persistentParams={{ view: "news" }}
          />

          {newsItems.length > 0 ? (
            <MotionStagger className="mx-auto max-w-3xl divide-y divide-white/8 border-y border-white/8">
              {newsItems.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </MotionStagger>
          ) : (
            <EmptyFilterState
              resetHref="/ai-regulation?view=news"
              hasActiveFilters={hasActiveFilterParams(params, newsFilters.map((f) => f.key))}
            />
          )}

          <CursorPaginationControls
            basePath="/ai-regulation"
            searchParams={params}
            nextCursorEncoded={newsPage.nextCursor ? encodeCursor(newsPage.nextCursor) : null}
            cursorParamKey="after"
          />
        </>
      ) : null}

      {activeView === "database" ? (
        <>
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Structured legal database"
              title="The AI law database"
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-[2rem] border-black/6 bg-white/90 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
                <CardContent className="space-y-5 p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                        Europe
                      </p>
                      <p className="mt-3 font-display text-3xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                        EU framework and Member State profiles
                      </p>
                    </div>
                    <Link
                      href="/ai-regulation/europe"
                      className="text-sm uppercase tracking-[0.16em] text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Europe hub
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {europeProfiles.map((profile) => (
                      <Link
                        key={profile.slug}
                        href={`/ai-regulation/europe/${profile.slug}`}
                        className="rounded-full border border-black/8 bg-zinc-50 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-700 transition hover:bg-zinc-100"
                      >
                        {profile.countryName}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-black/6 bg-white/90 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
                <CardContent className="space-y-5 p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                        United States
                      </p>
                      <p className="mt-3 font-display text-3xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                        Federal layer and state-by-state subparts
                      </p>
                    </div>
                    <Link
                      href="/ai-regulation/united-states"
                      className="text-sm uppercase tracking-[0.16em] text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      U.S. hub
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {usProfiles.map((profile) => (
                      <Link
                        key={profile.slug}
                        href={`/ai-regulation/united-states/${profile.slug}`}
                        className="rounded-full border border-black/8 bg-zinc-50 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-700 transition hover:bg-zinc-100"
                      >
                        {profile.stateName}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <FilterBar
            searchParams={params}
            options={databaseOptions}
            basePath="/ai-regulation"
            filters={databaseFilters}
            persistentParams={{ view: "database" }}
          />

          {updates.length > 0 ? (
            <Card className="rounded-[2rem] border-black/6 bg-white/70 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardContent className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
                {updates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    href={`/ai-regulation/${update.id}`}
                  />
                ))}
              </CardContent>
            </Card>
          ) : (
            <EmptyFilterState
              resetHref="/ai-regulation?view=database"
              hasActiveFilters={hasActiveFilterParams(params, databaseFilters.map((f) => f.key))}
              title={!dbAfterCursor ? "No published database entries yet" : undefined}
              body={!dbAfterCursor
                ? "The structured legal database stays intentionally empty until a human reviewer approves and manually publishes an entry."
                : undefined}
            />
          )}

          <CursorPaginationControls
            basePath="/ai-regulation"
            searchParams={params}
            nextCursorEncoded={updatesPage.nextCursor ? encodeCursor(updatesPage.nextCursor) : null}
            cursorParamKey="dbafter"
          />
        </>
      ) : null}
    </SiteShell>
  );
}
