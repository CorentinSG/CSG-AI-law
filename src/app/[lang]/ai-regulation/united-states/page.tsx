import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { UsHubMap } from "@/components/site/us-hub-map";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import {
  filterRegionalLiveItems,
  getRegionalLastCheckedAt,
} from "@/content/ai-regulation/live-intelligence";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";
import { usStateMapStatuses } from "@/content/ai-regulation/us-map";
import { getPriorityUsStateProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { getUsGeoPaths } from "@/lib/geo-paths";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "United States Hub",
  description:
    "United States AI regulation monitoring — federal legislation, state-level activity, agency guidance, and source-verified legal intelligence.",
};

export const revalidate = 300;

function getUsTiles(fr: boolean) {
  return [
    {
      href: "/ai-regulation/united-states/federal",
      eyebrow: fr ? "Droit fédéral" : "Federal law",
      title: "Federal",
      description: fr
        ? "EO 14110, OMB memos, NIST AI RMF, projets de loi au Congrès, actions des agences."
        : "EO 14110, OMB memos, NIST AI RMF, Congressional bills, and agency actions.",
      sub: [
        { href: "/ai-regulation/united-states/federal#eo14110", label: "EO 14110" },
        { href: "/ai-regulation/united-states/federal#omb", label: "OMB Policy" },
        { href: "/ai-regulation/united-states/federal#nist", label: "NIST AI RMF" },
        { href: "/ai-regulation/united-states/federal#congress", label: fr ? "Congrès" : "Congress" },
      ],
    },
    {
      href: "/ai-regulation/united-states/timeline",
      eyebrow: fr ? "Chronologie" : "Timeline",
      title: "Timeline",
      description: fr
        ? "Jalons officiels fédéraux et états — de l'EO jusqu'aux projets législatifs récents."
        : "Official federal and state milestones — from the EO through recent legislative proposals.",
      sub: [],
    },
    {
      href: "/ai-regulation/united-states/governance",
      eyebrow: fr ? "Acteurs & droit" : "Actors & law",
      title: fr ? "Gouvernance" : "Governance",
      description: fr
        ? "FTC, EEOC, CFPB, jurisprudence et soft law fédérale — qui supervise quoi."
        : "FTC, EEOC, CFPB, case law, and federal soft law — who oversees what.",
      sub: [],
    },
  ];
}

export default async function UnitedStatesAiRegulationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const usTiles = getUsTiles(fr);
  const [updates, newsItems, sources, sourceHealthChecks] = await Promise.all([
    updateRepository.listPublicUpdates({ region: "North America" }),
    updateRepository.getPublicNewsItems(30),
    updateRepository.getSources(),
    updateRepository.getSourceHealthChecks(undefined, 30),
  ]);

  const priorityStates = getPriorityUsStateProfiles();
  const geoPaths = getUsGeoPaths();

  const regionalLiveItems = filterRegionalLiveItems(
    newsItems.map(normalizeNewsItemRecord),
    "North America",
  ).slice(0, 5);

  const liveLastCheckedAt = getRegionalLastCheckedAt(
    sourceHealthChecks,
    sources,
    "North America",
  );

  return (
    <SiteShell className="space-y-12">
      {/* ── Header ── */}
      <MotionReveal className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-500">
            {fr ? "Hub d'intelligence" : "Intelligence hub"}
          </p>
          <h1 className="font-display text-7xl font-medium uppercase leading-none tracking-[-0.05em] text-zinc-950">
            United States
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-500">
            {fr
              ? "Droit fédéral, états actifs et agences de supervision."
              : "Federal law, active states, and oversight agencies."}
          </p>
        </div>
        <Link
          href={localeHref(lang, "/ai-regulation/europe")}
          className="mt-2 shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 underline decoration-black/15 underline-offset-4 transition-colors hover:text-zinc-900"
        >
          {fr ? "Hub UE →" : "EU hub →"}
        </Link>
      </MotionReveal>

      {/* ── Split hero: live feed + map ── */}
      <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
        {/* Live feed — flat ledger, no framed box */}
        <MotionReveal delay={0.06}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--color-live,#10b981)] opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--color-live,#10b981)]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
                {fr ? "Moniteur juridique US" : "Live US legal monitor"}
              </span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                {liveLastCheckedAt ? formatDisplayDate(liveLastCheckedAt) : "—"}
              </span>
            </div>

            {regionalLiveItems.length > 0 ? (
              <ol className="flex-1 divide-y divide-white/8">
                {regionalLiveItems.map((item) => (
                  <li key={item.id} className="group py-3.5">
                    <p className="line-clamp-2 text-[15px] font-medium leading-6 text-white/90">
                      {item.title}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                      {item.jurisdiction && <span className="text-white/60">{item.jurisdiction}</span>}
                      {item.jurisdiction && <span aria-hidden className="text-white/25">·</span>}
                      <span>{item.publicationDate ? formatDisplayDate(item.publicationDate) : "—"}</span>
                      {(item.officialSourceUrl ?? item.sourceUrl) && (
                        <>
                          <span aria-hidden className="text-white/25">·</span>
                          <a
                            href={item.officialSourceUrl ?? item.sourceUrl ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[color:var(--color-accent-strong,#c4882a)] transition-colors hover:text-white/80"
                          >
                            <ExternalLink className="size-2.5" />
                            {item.sourceName}
                          </a>
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex flex-1 items-center py-10">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                  {fr ? "Aucun signal récent" : "No recent signals"}
                </p>
              </div>
            )}

            <div className="border-t border-white/10 pt-3">
              <Link
                href={localeHref(lang, "/ai-regulation")}
                className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-white/80"
              >
                {fr ? "Tous les signaux US →" : "All US signals →"}
              </Link>
            </div>
          </div>
        </MotionReveal>

        {/* Map */}
        <MotionReveal delay={0.12}>
          <UsHubMap states={usStateMapStatuses} paths={geoPaths} />
        </MotionReveal>
      </section>

      {/* ── Sub-navigation tiles ── */}
      <section className="space-y-5">
        <MotionReveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            {fr ? "Sections de cette zone" : "Sections in this area"}
          </p>
        </MotionReveal>

        <MotionStagger className="grid gap-3 sm:grid-cols-3">
          {usTiles.map((tile) => (
            <MotionStaggerItem key={tile.href}>
              <Link
                href={localeHref(lang, tile.href)}
                className="group flex h-full flex-col rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_4px_20px_rgba(15,15,15,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(15,15,15,0.08)]"
              >
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-400">
                  {tile.eyebrow}
                </p>
                <p className="font-display text-xl font-medium uppercase leading-tight tracking-[-0.03em] text-zinc-950">
                  {tile.title}
                </p>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">
                  {tile.description}
                </p>
                <div className="mt-4 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:text-zinc-700">
                  {fr ? "Explorer" : "Explore"}
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        {/* Federal sub-sub-tiles */}
        <MotionReveal delay={0.08}>
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5">
            <p className="mb-3 font-mono text-[8.5px] uppercase tracking-[0.24em] text-zinc-400">
              {fr ? "Dans Federal" : "Inside Federal"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {usTiles[0].sub.map((s) => (
                <Link
                  key={s.href}
                  href={localeHref(lang, s.href)}
                  className="flex items-center gap-2 rounded-[1.2rem] border border-dashed border-black/10 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-600 transition-colors hover:border-black/20 hover:bg-zinc-100/60 hover:text-zinc-900"
                >
                  <span className="size-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </MotionReveal>
      </section>

      {/* ── Priority state pills ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            {fr ? "États prioritaires" : "Priority states"}
          </p>
          <Link
            href={localeHref(lang, "/ai-regulation/united-states/states")}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/80"
          >
            {fr ? "Les 50 états →" : "All 50 states →"}
          </Link>
        </div>
        <MotionStagger className="flex flex-wrap gap-2">
          {priorityStates.slice(0, 10).map((state) => (
            <MotionStaggerItem key={state.stateCode}>
              <Link
                href={localeHref(lang, `/ai-regulation/united-states/${state.slug}`)}
                className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white px-3.5 py-2 text-sm text-zinc-700 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
              >
                <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-zinc-400">
                  {state.stateCode}
                </span>
                {state.stateName}
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      {/* ── Published updates strip ── */}
      {updates.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Dernières mises à jour" : "Latest updates"}
            </p>
            <Link
              href={localeHref(lang, "/ai-regulation")}
              className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-zinc-400 underline decoration-black/15 underline-offset-4 hover:text-zinc-600"
            >
              {fr ? "Voir tout →" : "View all →"}
            </Link>
          </div>
          <MotionStagger className="grid gap-4 md:grid-cols-3">
            {updates.slice(0, 3).map((update) => (
              <MotionStaggerItem key={update.id}>
                <UpdateCard update={update} href={`/ai-regulation/${update.id}`} lang={lang} />
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </section>
      )}
    </SiteShell>
  );
}
