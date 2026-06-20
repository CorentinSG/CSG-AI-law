import Link from "next/link";

import { buildDiscoveryLeadSummary } from "@/app/admin/ai-regulation/diagnostics";
import { getAdminEuLegalNewsOverview } from "@/agents/ai-regulation/euLegalNewsAgent";
import { getAdminFranceLegalNewsOverview } from "@/agents/ai-regulation/franceLegalNewsAgent";
import { getAdminGermanyLegalNewsOverview } from "@/agents/ai-regulation/germanyLegalNewsAgent";
import { getAdminItalyLegalNewsOverview } from "@/agents/ai-regulation/italyLegalNewsAgent";
import { getAdminSpainLegalNewsOverview } from "@/agents/ai-regulation/spainLegalNewsAgent";
import { getMediaDomainScore } from "@/agents/ai-regulation/mediaDomainScoring";
import { scanProfiles } from "@/agents/ai-regulation/scanProfiles";
import { loadDiscoveryLeadRecordsPage } from "@/agents/ai-regulation/utils/discovery-lead-records";
import { aiLawNewsSourceConfigs } from "@/content/ai-regulation/news-sources";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { buildDiscoveryLeadRecordSummary } from "@/app/admin/ai-regulation/diagnostics";
import { PaginationControls } from "@/components/site/pagination-controls";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOffsetFromPage, parsePageParam } from "@/lib/pagination";
import { formatDisplayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const pageSize = 24;

export default async function AdminAiLawNewsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const page = parsePageParam(params.page, 1);
  const countryFilter = params.country;
  const [
    newsItems,
    sources,
    euOverview,
    franceOverview,
    germanyOverview,
    spainOverview,
    italyOverview,
    discoveryLeadRecordPage,
  ] = await Promise.all([
    updateRepository.getNewsItemsPage({
      limit: pageSize,
      offset: getOffsetFromPage(page, pageSize),
    }),
    updateRepository.getSources(),
    getAdminEuLegalNewsOverview(60),
    getAdminFranceLegalNewsOverview(40),
    getAdminGermanyLegalNewsOverview(40),
    getAdminSpainLegalNewsOverview(40),
    getAdminItalyLegalNewsOverview(40),
    loadDiscoveryLeadRecordsPage({ limit: 24, offset: 0 }),
  ]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const latestNews = newsItems.items.map(normalizeNewsItemRecord);
  const fallbackRawItems =
    discoveryLeadRecordPage.items.length === 0
      ? await updateRepository.getRawItems(24)
      : [];
  const discoveryLeads =
    discoveryLeadRecordPage.items.length > 0
      ? discoveryLeadRecordPage.items
          .map((record) => ({
            key: record.lead.id,
            summary: buildDiscoveryLeadRecordSummary(record),
          }))
      : fallbackRawItems
          .filter((item) => isDiscoveryOnlySource(sourceById.get(item.sourceId) ?? null))
          .map((item) => ({ key: item.id, summary: buildDiscoveryLeadSummary(item) }))
          .filter(
            (entry): entry is {
              key: string;
              summary: NonNullable<ReturnType<typeof buildDiscoveryLeadSummary>>;
            } => entry.summary !== null,
          )
          .slice(0, 24);
  const regionFilter = params.region;
  const verificationFilter = params.verificationStatus;
  const sourceTypeFilter = params.sourceType;
  const filteredLatestNews = latestNews
    .filter((item) => {
      if (regionFilter && regionFilter !== "all" && item.region !== regionFilter) {
        return false;
      }
      if (countryFilter && countryFilter !== "all" && item.countryOrState !== countryFilter) {
        return false;
      }
      if (
        verificationFilter &&
        verificationFilter !== "all" &&
        item.verificationStatus !== verificationFilter
      ) {
        return false;
      }
      if (
        sourceTypeFilter &&
        sourceTypeFilter !== "all" &&
        item.sourceType !== sourceTypeFilter
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const mediaScoreDelta = getMediaDomainScore(b).score - getMediaDomainScore(a).score;
      if (mediaScoreDelta !== 0) {
        return mediaScoreDelta;
      }
      const dateA = a.publicationDate ?? a.detectedAt;
      const dateB = b.publicationDate ?? b.detectedAt;
      return dateB.localeCompare(dateA);
    });

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <section className="space-y-3">
        <Link
          href="/admin/ai-regulation"
          className="text-sm text-zinc-400 underline decoration-white/10 underline-offset-4"
        >
          Back to AI Regulation admin
        </Link>
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Admin news intelligence
        </p>
        <h1 className="font-serif text-4xl text-white">AI Law News review</h1>
        <p className="max-w-3xl text-zinc-300">
          News and legal-development leads are broader than the verified monitor.
          Non-official items stay discovery-only until official-source verification
          and human review.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["News candidates", newsItems.total],
          ["Discovery leads", discoveryLeads.length],
          ["News source configs", aiLawNewsSourceConfigs.length],
          [
            "Manual-only sources",
            aiLawNewsSourceConfigs.filter((source) => source.manualOnly).length,
          ],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                {label}
              </p>
              <p className="mt-3 text-2xl text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Germany continuous monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-300">
              The Germany agent keeps a dedicated official-source watch over BfDI AI materials,
              the BfDI AI-model consultation, Federal Government implementation pages, and
              Bundestag implementation materials. Lightweight Germany live monitoring is centered
              on BfDI, while parliamentary and government implementation sources stay on a slower cadence.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Germany items tracked
                </p>
                <p className="mt-2 text-2xl text-white">{germanyOverview.items.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  High-priority Germany review
                </p>
                <p className="mt-2 text-2xl text-white">
                  {germanyOverview.items.filter((entry) => entry.reviewPriority === "high").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Germany source snapshots
                </p>
                <p className="mt-2 text-2xl text-white">{germanyOverview.sourceHealthChecks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Germany review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {germanyOverview.items.slice(0, 5).map((entry) => (
              <div
                key={entry.item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{entry.item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {entry.reviewPriority} / {entry.classification.developmentType} /{" "}
                  {entry.verification.verificationStatus}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.classification.rankingReason}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  conversion {entry.conversion.conversionStatus} / source{" "}
                  {entry.item.sourceName} / media rank {entry.mediaDomain.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>EU Legal News Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-300">
              The EU agent watches official EU and Member State sources, then
              cross-checks discovery leads before any database conversion. Hard-law,
              guidance, case-law, and enforcement signals are ranked before softer
              commentary.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  EU items tracked
                </p>
                <p className="mt-2 text-2xl text-white">{euOverview.items.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  High-priority review
                </p>
                <p className="mt-2 text-2xl text-white">
                  {euOverview.items.filter((entry) => entry.reviewPriority === "high").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  EU source configs
                </p>
                <p className="mt-2 text-2xl text-white">{euOverview.euSourceConfigs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EU review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {euOverview.items.slice(0, 5).map((entry) => (
              <div
                key={entry.item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{entry.item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {entry.reviewPriority} / {entry.classification.developmentType} /{" "}
                  {entry.verification.verificationStatus}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.classification.rankingReason}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  conversion {entry.conversion.conversionStatus} / source{" "}
                  {entry.item.sourceName} / media rank {entry.mediaDomain.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>France continuous monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-300">
              The France agent keeps a dedicated official-source watch over CNIL,
              Legifrance, the Conseil d&apos;Etat, the Cour de cassation, and the
              Defender of Rights. Lightweight France live monitoring is centered on
              CNIL; heavier legal-text and judicial sources stay on a slower cadence.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  France items tracked
                </p>
                <p className="mt-2 text-2xl text-white">{franceOverview.items.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  High-priority France review
                </p>
                <p className="mt-2 text-2xl text-white">
                  {franceOverview.items.filter((entry) => entry.reviewPriority === "high").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  France source snapshots
                </p>
                <p className="mt-2 text-2xl text-white">{franceOverview.sourceHealthChecks.length}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Breaking
                </p>
                <p className="mt-2 text-2xl text-white">{franceOverview.summary.breakingSignals}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Current
                </p>
                <p className="mt-2 text-2xl text-white">{franceOverview.summary.currentSignals}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  High urgency
                </p>
                <p className="mt-2 text-2xl text-white">{franceOverview.summary.highUrgencySignals}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Watch / stale
                </p>
                <p className="mt-2 text-2xl text-white">
                  {franceOverview.summary.watchSignals + franceOverview.summary.staleSignals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>France monitoring cadence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live target</p>
              <p className="mt-2 text-sm text-zinc-300">
                {franceOverview.schedulerGuidance.liveTarget}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Safe fallback</p>
              <p className="mt-2 text-sm text-zinc-300">
                {franceOverview.schedulerGuidance.safeFallback}
              </p>
            </div>
            <div className="space-y-2">
              {franceOverview.schedulerGuidance.notes.map((note) => (
                <p key={note} className="text-sm text-zinc-400">
                  {note}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>France source health watch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {franceOverview.sourceHealthChecks.map((entry) => (
              <div
                key={`${entry.check.sourceId}-${entry.check.checkedAt}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">
                  {entry.descriptor?.label ?? entry.check.sourceId}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {formatDisplayDate(entry.check.checkedAt)} / status {entry.check.responseStatus ?? "n/a"} /{" "}
                  {entry.check.parserStatus.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.currentness.freshnessStatus.replaceAll("_", " ")} / recommendation{" "}
                  {entry.check.activeRecommendation.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>France review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {franceOverview.items.slice(0, 8).map((entry) => (
              <div
                key={entry.item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.reviewPriority}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.item.verificationStatus.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.classification.developmentType}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.currentness.freshnessLabel}
                  </span>
                </div>
                <p className="mt-3 font-medium text-white">{entry.item.title}</p>
                <p className="mt-2 text-sm text-zinc-300">{entry.classification.rankingReason}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  source {entry.item.sourceName} / conversion {entry.conversion.conversionStatus} / score{" "}
                  {entry.currentness.currentnessScore} / media rank {entry.mediaDomain.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Spain continuous monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-300">
              The Spain agent keeps a dedicated official-source watch over AEPD, AESIA, BOE,
              and La Moncloa. Lightweight Spain live monitoring is centered on AEPD, while
              legal-text and government-implementation sources stay on a slower cadence.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Spain items tracked
                </p>
                <p className="mt-2 text-2xl text-white">{spainOverview.items.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  High-priority Spain review
                </p>
                <p className="mt-2 text-2xl text-white">
                  {spainOverview.items.filter((entry) => entry.reviewPriority === "high").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Spain source snapshots
                </p>
                <p className="mt-2 text-2xl text-white">{spainOverview.sourceHealthChecks.length}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Breaking</p>
                <p className="mt-2 text-2xl text-white">{spainOverview.summary.breakingSignals}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Current</p>
                <p className="mt-2 text-2xl text-white">{spainOverview.summary.currentSignals}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">High urgency</p>
                <p className="mt-2 text-2xl text-white">{spainOverview.summary.highUrgencySignals}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Watch / stale</p>
                <p className="mt-2 text-2xl text-white">
                  {spainOverview.summary.watchSignals + spainOverview.summary.staleSignals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spain monitoring cadence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live target</p>
              <p className="mt-2 text-sm text-zinc-300">
                {spainOverview.schedulerGuidance.liveTarget}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Safe fallback</p>
              <p className="mt-2 text-sm text-zinc-300">
                {spainOverview.schedulerGuidance.safeFallback}
              </p>
            </div>
            <div className="space-y-2">
              {spainOverview.schedulerGuidance.notes.map((note) => (
                <p key={note} className="text-sm text-zinc-400">
                  {note}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Spain source health watch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {spainOverview.sourceHealthChecks.map((entry) => (
              <div
                key={`${entry.check.sourceId}-${entry.check.checkedAt}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">
                  {entry.descriptor?.label ?? entry.check.sourceId}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {formatDisplayDate(entry.check.checkedAt)} / status {entry.check.responseStatus ?? "n/a"} /{" "}
                  {entry.check.parserStatus.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.currentness.freshnessStatus.replaceAll("_", " ")} / recommendation{" "}
                  {entry.check.activeRecommendation.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spain review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {spainOverview.items.slice(0, 8).map((entry) => (
              <div
                key={entry.item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.reviewPriority}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.item.verificationStatus.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.classification.developmentType}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                    {entry.currentness.freshnessLabel}
                  </span>
                </div>
                <p className="mt-3 font-medium text-white">{entry.item.title}</p>
                <p className="mt-2 text-sm text-zinc-300">{entry.classification.rankingReason}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  source {entry.item.sourceName} / conversion {entry.conversion.conversionStatus} / score{" "}
                  {entry.currentness.currentnessScore} / media rank {entry.mediaDomain.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Italy continuous monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-300">
              The Italy agent keeps a dedicated official-source watch over the Garante,
              AgID, Normattiva, and the Digital Transformation Department. Lightweight
              Italy live monitoring is centered on the Garante, while legislative and
              government-implementation sources stay on a slower cadence.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Italy items tracked
                </p>
                <p className="mt-2 text-2xl text-white">{italyOverview.items.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  High-priority Italy review
                </p>
                <p className="mt-2 text-2xl text-white">
                  {italyOverview.items.filter((entry) => entry.reviewPriority === "high").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Italy source snapshots
                </p>
                <p className="mt-2 text-2xl text-white">{italyOverview.sourceHealthChecks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Italy review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {italyOverview.items.slice(0, 5).map((entry) => (
              <div
                key={entry.item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{entry.item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {entry.reviewPriority} / {entry.classification.developmentType} /{" "}
                  {entry.verification.verificationStatus}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {entry.classification.rankingReason}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  conversion {entry.conversion.conversionStatus} / source{" "}
                  {entry.item.sourceName} / media rank {entry.mediaDomain.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              ["all", "All regions"],
              ["Europe", "Europe"],
              ["North America", "United States"],
            ].map(([value, label]) => (
              <Link
                key={`region-${value}`}
                href={`/admin/ai-regulation/news?region=${encodeURIComponent(value)}`}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-300"
              >
                {label}
              </Link>
            ))}
            {[
              ["all", "All countries"],
              ["France", "France"],
              ["Germany", "Germany"],
              ["Spain", "Spain"],
              ["Italy", "Italy"],
            ].map(([value, label]) => (
              <Link
                key={`country-${value}`}
                href={`/admin/ai-regulation/news?country=${encodeURIComponent(value)}`}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-300"
              >
                {label}
              </Link>
            ))}
            {[
              ["official_verified", "Official source"],
              ["corroborated", "Corroborated"],
              ["discovery_only", "Discovery"],
              ["needs_official_source", "Needs source"],
            ].map(([value, label]) => (
              <Link
                key={`verification-${value}`}
                href={`/admin/ai-regulation/news?verificationStatus=${encodeURIComponent(value)}`}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-zinc-300"
              >
                {label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(scanProfiles).map((profile) => (
              <div
                key={profile.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{profile.label}</p>
                <p className="mt-2 text-sm text-zinc-300">{profile.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  target {profile.targetInterval}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Latest news candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredLatestNews.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-150 hover:bg-white/5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {item.sourceType.replaceAll("_", " ")} /{" "}
                      {item.verificationStatus.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-sm text-zinc-300">{item.shortSummary}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      source {item.sourceName} / published{" "}
                      {formatDisplayDate(item.publicationDate)} / event{" "}
                      {item.exactDateOfInformation
                        ? formatDisplayDate(item.exactDateOfInformation)
                        : "not detected"} / media rank {getMediaDomainScore(item).label}
                    </p>
                  </div>
                  {item.relatedMonitorItemId ? (
                    <Link
                      href={`/admin/ai-regulation/${item.relatedMonitorItemId}`}
                      className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 transition-colors duration-150 hover:border-white/20 hover:bg-white/8 active:scale-[0.98]"
                    >
                      Monitor item
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>News source configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiLawNewsSourceConfigs.map((source) => (
              <div
                key={source.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-medium text-white">{source.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {source.sourceType.replaceAll("_", " ")} /{" "}
                  {source.reliabilityLevel.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm text-zinc-300">{source.notes}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  active {String(source.active)} / manual {String(source.manualOnly)} /
                  parser {source.parserStatus.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Private discovery leads</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {discoveryLeads.map(({ key, summary }) => (
              <div
                key={key}
                className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4"
              >
                <p className="font-medium text-white">{summary.headline}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-200">
                  {summary.verificationStatus.replaceAll("_", " ")} / official source{" "}
                  {summary.possibleOfficialSourceFound ? "found" : "missing"}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  {summary.reviewerNotes}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  detected {formatDisplayDate(summary.detectedDate)} / source{" "}
                  {summary.discoverySourceName}
                </p>
                <a
                  href={summary.outboundUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-xs text-zinc-400 underline decoration-white/10 underline-offset-4"
                >
                  Outbound URL
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <PaginationControls
        basePath="/admin/ai-regulation/news"
        searchParams={params}
        page={page}
        pageSize={pageSize}
        total={newsItems.total}
      />
    </SiteShell>
  );
}
