import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
} from "@/agents/ai-regulation/utils/authority";
import { CompactNewsCard } from "@/components/site/compact-news-card";
import { FilterBar } from "@/components/site/filter-bar";
import {
  LegalDatabaseExplorer,
  type ExplorerEntry,
} from "@/components/site/legal-database-explorer";
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
  prepareNewsItemsForDisplay,
  type NormalizedNewsItemRecord,
} from "@/content/ai-regulation/news";
import { getPriorityEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import { internationalAiStandardsBaseline } from "@/content/ai-regulation/international-ai-standards";
import { getPriorityUsStateProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/seo";
import { localeHref } from "@/lib/i18n/href";
import { encodeCursor, parseCursorParam } from "@/lib/pagination";
import type { RegulatoryUpdateFilters } from "@/db/repository-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    alternates: isLocale(lang) ? localeAlternates(lang, "/ai-regulation") : undefined,
    title: fr ? "Hub d'intelligence juridique IA" : "AI Legal Intelligence Hub",
    description: fr
      ? "Un hub unifié d'intelligence juridique sur l'IA combinant développements légaux, veille sourcée et couverture de base de données structurée par région."
      : "A unified AI legal intelligence hub combining legal developments, source-backed monitoring, and region-structured AI law database coverage.",
  };
}

// Stays dynamic (not ISR like the other public /ai-regulation pages, T-RT0C):
// this hub renders from searchParams (filters, tabs, cursor pagination), which
// forces per-request rendering — `revalidate` would have no effect here.
export const dynamic = "force-dynamic";

const newsFilters = [
  { key: "region", label: "Region" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "sourceType", label: "Source type" },
  { key: "verificationStatus", label: "Verification" },
  { key: "topic", label: "Topic" },
  { key: "developmentType", label: "Development" },
  { key: "date", label: "Date" },
];

const buildNewsFilters = (fr: boolean) =>
  fr
    ? [
        { key: "region", label: "Région" },
        { key: "jurisdiction", label: "Juridiction" },
        { key: "sourceType", label: "Type de source" },
        { key: "verificationStatus", label: "Vérification" },
        { key: "topic", label: "Thème" },
        { key: "developmentType", label: "Développement" },
        { key: "date", label: "Date" },
      ]
    : newsFilters;

const pageSize = 18;
// The database view loads a larger page: filtering and search run instantly
// client-side inside LegalDatabaseExplorer, so one request should cover most
// of the published set. The cursor "load more" link handles the tail.
const databasePageSize = 96;

type HubView = "overview" | "news" | "database";

function parseView(value: string | undefined): HubView {
  if (value === "news" || value === "database") {
    return value;
  }
  return "overview";
}

async function getPublicNewsItems(afterCursor: import("@/lib/pagination").CursorPosition | null) {
  const result = await updateRepository.getPublicNewsItemsCursorPage({
    limit: pageSize,
    after: afterCursor,
  });

  return {
    ...result,
    items: prepareNewsItemsForDisplay(result.items.map(normalizeNewsItemRecord)),
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
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await routeParams;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const locale: Locale = fr ? "fr" : "en";
  // Every internal link on this page must carry the locale segment. An
  // unprefixed path falls through to `proxy.ts`, which re-negotiates the
  // locale from Accept-Language and can strand a French reader on /en.
  const href = (path: string) => localeHref(locale, path);
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const activeView = parseView(params.view);
  const afterCursor = parseCursorParam(params.after);
  const dbAfterCursor = parseCursorParam(params.dbafter);

  const [updatesPage, newsPage] = await Promise.all([
    updateRepository.listPublicUpdatesCursorPage(params as RegulatoryUpdateFilters, {
      limit: activeView === "database" ? databasePageSize : pageSize,
      after: dbAfterCursor,
    }),
    getPublicNewsItems(afterCursor),
  ]);

  const updates = updatesPage.items;
  const newsOptions = collectNewsOptions(newsPage.items);
  const newsItems = filterNewsItems(newsPage.items, params);

  const hubTabs = [
    { label: fr ? "Aperçu" : "Overview", value: "overview", href: "/ai-regulation?view=overview" },
    { label: fr ? "Actualités IA" : "AI Law News", value: "news", href: "/ai-regulation?view=news" },
    { label: fr ? "Base de données" : "Legal Database", value: "database", href: "/ai-regulation?view=database" },
  ] as const;

  const europeProfiles = getPriorityEuropeCountryProfiles();
  const usProfiles = getPriorityUsStateProfiles();

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

  // Regional totals for the portal cards.
  //
  // These used to be computed by filtering the single fetched page: the news
  // counts saw only the newest 18 rows (so any region absent from that slice
  // read as 0), and the Europe/U.S. database counts were `updatesPage.items
  // .length` — the page size itself, which is why both claimed "18 entries".
  // They are now exact counts over the published tables, fetched head-only.
  // A failure degrades to undefined, which makes the card omit the number
  // entirely — an absent figure rather than a wrong one.
  const regionCounts = await Promise.all(
    (
      [
        ["Europe"],
        ["United States", "North America"],
        ["International"],
      ] as const
    ).flatMap((regions) => [
      updateRepository.countPublicNewsItemsForRegions(regions).catch(() => undefined),
      updateRepository.countPublicUpdatesForRegions(regions).catch(() => undefined),
    ]),
  );
  const [
    europeNewsCount,
    europeDatabaseCount,
    usNewsCount,
    usDatabaseCount,
    internationalNewsCount,
    internationalDatabaseCount,
  ] = regionCounts;

  // Slim, serializable projection for the client-side database explorer.
  const explorerEntries: ExplorerEntry[] = updates.map((update) => {
    const authorityType = deriveUpdateAuthorityType(update);
    return {
      id: update.id,
      href: href(`/ai-regulation/${update.id}`),
      title: update.title,
      summary: update.oneSentenceSummary,
      region: update.region,
      country: update.country ?? "",
      jurisdiction: update.jurisdiction,
      legalArea: update.legalArea,
      authorityType,
      authorityLabel: getAuthorityPresentation(authorityType).label,
      importance: update.importanceLevel,
      date: update.publicationDate,
      sourceName: update.sourceName,
      sourceUrl: update.sourceUrl,
    };
  });

  const regionHubs = [
    { label: "Europe", kicker: fr ? "Cadre UE · États membres" : "EU framework · member states", href: href("/ai-regulation/europe") },
    { label: fr ? "États-Unis" : "United States", kicker: fr ? "Fédéral · niveaux étatiques" : "Federal · state layers", href: href("/ai-regulation/united-states") },
    { label: "International", kicker: fr ? "Standards · gouvernance mondiale" : "Standards · global governance", href: href("/ai-regulation/international") },
  ];

  const dbLoadMoreHref = updatesPage.nextCursor
    ? href(`/ai-regulation?view=database&dbafter=${encodeURIComponent(encodeCursor(updatesPage.nextCursor))}`)
    : null;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <SiteShell className="space-y-10">
      <section className="space-y-6">
        <SectionHeading
          as="h1"
          eyebrow={fr ? "Hub Droit de l'IA" : "AI law hub"}
          title={fr ? "Intelligence juridique IA" : "AI legal intelligence"}
          actions={
            <Link
              href={href(activeView === "news" ? "/ai-regulation?view=database" : "/ai-regulation?view=news")}
              className="text-sm uppercase tracking-[0.16em] text-zinc-800 underline decoration-black/15 underline-offset-4"
            >
              {activeView === "news"
                ? fr
                  ? "Ouvrir la base de données"
                  : "Open legal database"
                : fr
                  ? "Ouvrir les développements légaux"
                  : "Open legal developments"}
            </Link>
          }
        />

        <IntelligenceHubTabs tabs={[...hubTabs]} activeValue={activeView} lang={fr ? "fr" : "en"} />
      </section>

      {activeView === "overview" ? (
        <>
          {/* --- Section 1: Latest AI law news (5 items, compact, scannable) --- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SectionHeading
                eyebrow={fr ? "Dernières actualités IA" : "Latest AI law news"}
                title={fr ? "Développements juridiques récents" : "Recent legal developments"}
              />
              <Link
                href={href("/ai-regulation?view=news")}
                className="shrink-0 text-sm uppercase tracking-[0.16em] text-zinc-600 underline decoration-black/15 underline-offset-4"
              >
                {fr ? "Toutes les actualités →" : "All news →"}
              </Link>
            </div>

            {overviewNewsItems.length > 0 ? (
              <MotionStagger className="grid gap-4" stagger={0.06}>
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
                      {fr
                        ? "Aucun développement juridique public pour l'instant. La couche d'intelligence surveille — les éléments sourcés apparaîtront ici une fois publiés."
                        : "No public legal developments yet. The intelligence layer is monitoring — source-backed items will appear here once published."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* --- Section 2: Region portals — two territories + the transnational layer --- */}
          <section className="space-y-4">
            <SectionHeading
              eyebrow={fr ? "Intelligence régionale" : "Regional intelligence"}
              title={fr ? "Deux territoires, une couche transnationale" : "Two territories, one transnational layer"}
            />
            <MotionStagger className="grid gap-5 lg:grid-cols-3" stagger={0.12}>
              <MotionStaggerItem>
                <RegionPortalCard
                  region="europe"
                  title="Europe"
                  lang={fr ? "fr" : "en"}
                  description="EU AI Act and Member State implementation."
                  href={href("/ai-regulation/europe")}
                  liveLabel="Europe news"
                  liveCount={europeNewsCount}
                  dbCount={europeDatabaseCount}
                  highlights={europeProfiles.map((p) => ({ label: p.countryName, href: `/ai-regulation/europe/${p.slug}` }))}
                  isLive
                />
              </MotionStaggerItem>
              <MotionStaggerItem>
                <RegionPortalCard
                  region="united-states"
                  title={fr ? "États-Unis" : "United States"}
                  lang={fr ? "fr" : "en"}
                  description="Federal and 50-state AI law coverage."
                  href={href("/ai-regulation/united-states")}
                  liveLabel="U.S. news"
                  liveCount={usNewsCount}
                  dbCount={usDatabaseCount}
                  highlights={usProfiles.map((p) => ({ label: p.stateName, href: `/ai-regulation/united-states/${p.slug}` }))}
                  isLive
                />
              </MotionStaggerItem>
              <MotionStaggerItem>
                <RegionPortalCard
                  region="international"
                  title="International"
                  lang={fr ? "fr" : "en"}
                  kickerLabel={fr ? "Couche transnationale" : "Transnational layer"}
                  description="ISO/IEC, OECD, UNESCO, IEEE, and cross-border AI governance instruments."
                  href={href("/ai-regulation/international")}
                  liveLabel="International news"
                  liveCount={internationalNewsCount}
                  dbCount={internationalDatabaseCount}
                  highlights={[...new Set(internationalAiStandardsBaseline.map((e) => e.institution))].map(
                    (institution) => ({ label: institution, href: "/standards" }),
                  )}
                  isLive
                />
              </MotionStaggerItem>
            </MotionStagger>
          </section>

          {/* --- Section 3: Database preview (3 entries) --- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <SectionHeading
                eyebrow={fr ? "Base de données juridique" : "Legal database"}
                title={fr ? "Dernières entrées publiées" : "Latest published monitor entries"}
              />
              <Link
                href={href("/ai-regulation?view=database")}
                className="shrink-0 text-sm uppercase tracking-[0.16em] text-zinc-600 underline decoration-black/15 underline-offset-4"
              >
                {fr ? "Base complète →" : "Full database →"}
              </Link>
            </div>
            <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {overviewUpdates.length > 0 ? (
                overviewUpdates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    lang={locale}
                    href={`/ai-regulation/${update.id}`}
                  />
                ))
              ) : (
                <Card className="rounded-[1.8rem] border-black/6 bg-white/90 shadow-sm md:col-span-2 xl:col-span-3">
                  <CardContent className="p-6">
                    <p className="text-sm text-zinc-500">
                      {fr
                        ? "Aucune entrée publiée pour l'instant. La base de données juridique reste volontairement vide tant qu'une entrée n'est pas vérifiée par source et publiée."
                        : "No published database entries yet. The structured legal database stays intentionally empty until an entry is source-verified and published."}
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
                  {fr ? "Posture des sources" : "Source posture"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <IntelligenceSignal
                    label={fr ? "Vérifié officiellement" : "Officially verified"}
                    value={String(verifiedNewsCount)}
                    tone="positive"
                  />
                  <IntelligenceSignal
                    label={fr ? "Découverte / média" : "Discovery / media"}
                    value={String(discoveryNewsCount)}
                    tone="warning"
                  />
                </div>
              </CardContent>
            </Card>
            <Link
              href={href("/ai-regulation/methodology")}
              className="group flex flex-col justify-between gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.05]"
            >
              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  {fr ? "Comment lire ce hub" : "How to read this hub"}
                </p>
                <p className="text-sm leading-6 text-zinc-500">
                  {fr
                    ? "Niveaux de vérification, classification d'autorité et posture de sourçage et de revue derrière chaque élément publié."
                    : "Verification levels, authority classification, and the source-and-review posture behind every published item."}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 transition-colors group-hover:text-white/80">
                {fr ? "Lire la méthodologie →" : "Read the methodology →"}
              </span>
            </Link>
          </section>
        </>
      ) : null}

      {activeView === "news" ? (
        <>
          <section className="space-y-6">
            <SectionHeading
              eyebrow={fr ? "Actualités IA" : "AI Law News"}
              title={fr ? "Développements juridiques" : "Legal developments"}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <IntelligenceSignal
                label={
                  newsPage.hasMore
                    ? fr
                      ? "Éléments affichés"
                      : "News items shown"
                    : fr
                      ? "Éléments d'actualité"
                      : "News items"
                }
                value={String(newsPage.items.length)}
                tone="informative"
              />
              <IntelligenceSignal
                label={fr ? "Appuyé officiellement" : "Officially supported"}
                value={String(verifiedNewsCount)}
                tone="positive"
              />
              <IntelligenceSignal
                label={fr ? "Issu de découverte" : "Discovery-led"}
                value={String(discoveryNewsCount)}
                tone="warning"
              />
              <IntelligenceSignal
                label={fr ? "Régions" : "Regions"}
                value={fr ? "UE + É.-U. + Intl" : "EU + U.S. + Intl"}
                tone="neutral"
              />
            </div>
          </section>

          <FilterBar
            searchParams={params}
            options={newsOptions}
            basePath={href("/ai-regulation")}
            filters={buildNewsFilters(fr)}
            lang={fr ? "fr" : "en"}
            persistentParams={{ view: "news" }}
          />

          {newsItems.length > 0 ? (
            <MotionStagger className="mx-auto max-w-3xl divide-y divide-white/8 border-y border-white/8">
              {newsItems.map((item) => (
                <NewsCard key={item.id} item={item} lang={fr ? "fr" : "en"} />
              ))}
            </MotionStagger>
          ) : (
            <EmptyFilterState
              resetHref="/ai-regulation?view=news"
              hasActiveFilters={hasActiveFilterParams(params, newsFilters.map((f) => f.key))}
              lang={fr ? "fr" : "en"}
            />
          )}

          <CursorPaginationControls
            basePath={href("/ai-regulation")}
            searchParams={params}
            nextCursorEncoded={newsPage.nextCursor ? encodeCursor(newsPage.nextCursor) : null}
            cursorParamKey="after"
            lang={fr ? "fr" : "en"}
          />
        </>
      ) : null}

      {activeView === "database" ? (
        <>
          <SectionHeading
            eyebrow={fr ? "Base de données juridique structurée" : "Structured legal database"}
            title={fr ? "La base de données du droit de l'IA" : "The AI law database"}
            description={
              fr
                ? "Recherchez et filtrez instantanément les entrées vérifiées par source à travers l'Europe, les États-Unis et la couche transnationale."
                : "Search and filter source-verified entries across Europe, the United States, and the transnational layer — instantly."
            }
          />

          {updates.length > 0 ? (
            <LegalDatabaseExplorer
              entries={explorerEntries}
              regionHubs={regionHubs}
              loadMoreHref={dbLoadMoreHref}
              todayIso={todayIso}
              lang={fr ? "fr" : "en"}
            />
          ) : (
            <EmptyFilterState
              resetHref="/ai-regulation?view=database"
              hasActiveFilters={Boolean(dbAfterCursor)}
              lang={fr ? "fr" : "en"}
              title={!dbAfterCursor ? (fr ? "Aucune entrée publiée pour l'instant" : "No published database entries yet") : undefined}
              body={!dbAfterCursor
                ? fr
                  ? "La base de données juridique reste volontairement vide tant qu'une entrée n'est pas vérifiée par source et publiée."
                  : "The structured legal database stays intentionally empty until an entry is source-verified and published."
                : undefined}
            />
          )}
        </>
      ) : null}
    </SiteShell>
  );
}
