import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";

import { getEuropeLiveLegalIntelligenceData } from "@/agents/ai-regulation/euLegalNewsAgent";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { EuropeHubMap } from "@/components/site/europe-hub-map";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { getPriorityEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import { europeCountryStatuses } from "@/content/ai-regulation/europe-map";
import { getEuropeGeoPaths } from "@/lib/geo-paths";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Europe Hub",
  description:
    "European Union AI regulation monitoring — AI Act milestones, governance actors, member state profiles, and live legal intelligence.",
};

export const revalidate = 300;

function getEuTiles(fr: boolean) {
  return [
    {
      href: "/ai-regulation/europe/ai-act",
      eyebrow: fr ? "Droit contraignant" : "Binding law",
      title: "EU AI Act",
      description: fr
        ? "Texte de référence, classifications de risque, obligations par catégorie et provisions GPAI."
        : "Reference text, risk classifications, obligations by category, and GPAI provisions.",
      sub: [
        { href: "/ai-regulation/europe/ai-act#risk", label: fr ? "Catégories de risque" : "Risk categories" },
        { href: "/ai-regulation/europe/ai-act#prohibited", label: fr ? "Pratiques interdites" : "Prohibited practices" },
        { href: "/ai-regulation/europe/ai-act#gpai", label: fr ? "Modèles GPAI" : "GPAI models" },
        { href: "/ai-regulation/europe/ai-act/calendar", label: fr ? "Calendrier d'application" : "Application calendar" },
      ],
    },
    {
      href: "/ai-regulation/europe/governance",
      eyebrow: fr ? "Acteurs & droit dérivé" : "Actors & secondary law",
      title: fr ? "Gouvernance" : "Governance",
      description: fr
        ? "AIBF, EDPB et autorités nationales — rôles, base légale, niveau d'autorité."
        : "AI Office, EDPB, and national authorities — roles, legal basis, authority level.",
      sub: [],
    },
    {
      href: "/ai-regulation/europe/case-law",
      eyebrow: fr ? "Décisions & enforcement" : "Decisions & enforcement",
      title: fr ? "Jurisprudence" : "Case law",
      description: fr
        ? "Décisions publiées et sources de jurisprudence surveillées."
        : "Published decisions and monitored case-law sources.",
      sub: [],
    },
    {
      href: "/ai-regulation/europe/timeline",
      eyebrow: fr ? "Chronologie" : "Timeline",
      title: "Timeline",
      description: fr
        ? "Jalons officiels depuis le projet AIA jusqu'aux premières échéances d'application."
        : "Official milestones from the AI Act proposal through the first application deadlines.",
      sub: [],
    },
    {
      href: "/ai-regulation/europe/standards",
      eyebrow: fr ? "Droit souple" : "Soft law",
      title: "Standards & Soft law",
      description: fr
        ? "CENELEC, ISO/IEC, orientations EDPB, frameworks CEN et instruments non contraignants."
        : "CENELEC, ISO/IEC, EDPB guidance, CEN frameworks, and non-binding instruments.",
      sub: [],
    },
  ];
}

export default async function EuropeAiRegulationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const euTiles = getEuTiles(fr);

  const [updates, euLiveData] = await Promise.all([
    updateRepository.listPublicUpdates({ region: "Europe" }),
    getEuropeLiveLegalIntelligenceData(6),
  ]);

  const countryProfiles = getPriorityEuropeCountryProfiles();
  const geoPaths = getEuropeGeoPaths();

  return (
    <SiteShell className="space-y-12">
      {/* ── Header ── */}
      <MotionReveal className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-500">
            {fr ? "Hub d'intelligence" : "Intelligence hub"}
          </p>
          <h1 className="font-display text-7xl font-medium uppercase leading-none tracking-[-0.05em] text-zinc-950">
            Europe
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-500">
            {fr
              ? "Ce qui a changé, ce qui est contraignant, qui se déplace."
              : "What changed, what is binding, what is moving."}
          </p>
        </div>
        <Link
          href={localeHref(lang, "/ai-regulation/united-states")}
          className="mt-2 shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 underline decoration-black/15 underline-offset-4 transition-colors hover:text-zinc-900"
        >
          {fr ? "Hub US →" : "US hub →"}
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
                {fr ? "Moniteur juridique UE" : "EU legal monitor"}
              </span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                {euLiveData.lastCheckedAt
                  ? formatDisplayDate(euLiveData.lastCheckedAt)
                  : "—"}
              </span>
            </div>

            <ol className="flex-1 divide-y divide-white/8">
              {euLiveData.items.slice(0, 5).map(({ item }) => (
                <li key={item.id} className="group py-3.5">
                  <p className="line-clamp-2 text-[15px] font-medium leading-6 text-white/90">
                    {item.title}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                    {item.jurisdiction && <span className="text-white/60">{item.jurisdiction}</span>}
                    {item.jurisdiction && <span aria-hidden className="text-white/25">·</span>}
                    <span>
                      {item.publicationDate ? formatDisplayDate(item.publicationDate) : "—"}
                    </span>
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

            <div className="border-t border-white/10 pt-3">
              <Link
                href={localeHref(lang, "/ai-regulation")}
                className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-white/80"
              >
                {fr ? "Tous les signaux UE →" : "All EU signals →"}
              </Link>
            </div>
          </div>
        </MotionReveal>

        {/* Map */}
        <MotionReveal delay={0.12}>
          <EuropeHubMap countries={europeCountryStatuses} paths={geoPaths} />
        </MotionReveal>
      </section>

      {/* ── Sub-navigation tiles ── */}
      <section className="space-y-5">
        <MotionReveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            {fr ? "Sections de cette zone" : "Sections in this area"}
          </p>
        </MotionReveal>

        <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {euTiles.map((tile) => (
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

        {/* AI Act sub-sub-tiles */}
        <MotionReveal delay={0.08}>
          <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.02] p-5">
            <p className="mb-3 font-mono text-[8.5px] uppercase tracking-[0.24em] text-zinc-400">
              {fr ? "Dans EU AI Act" : "Inside the EU AI Act"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {euTiles[0].sub.map((s) => (
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

      {/* ── Country profile pills ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            {fr ? "Profils pays prioritaires" : "Priority country profiles"}
          </p>
        </div>
        <MotionStagger className="flex flex-wrap gap-2">
          {countryProfiles.slice(0, 9).map((profile) => (
            <MotionStaggerItem key={profile.slug}>
              <Link
                href={localeHref(lang, `/ai-regulation/europe/${profile.slug}`)}
                className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white px-3.5 py-2 text-sm text-zinc-700 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
              >
                <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-zinc-400">
                  {profile.countryCode}
                </span>
                {profile.countryName}
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
