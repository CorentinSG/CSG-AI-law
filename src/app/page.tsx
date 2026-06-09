import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getFeaturedResearchEntry, getPublicResearchEntries } from "@/content/research";
import { HeroIntro } from "@/components/site/hero-intro";
import { JarvisOrb } from "@/components/site/jarvis-orb";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger } from "@/components/site/motion-stagger";
import { NewYorkSignals } from "@/components/site/new-york-signals";
import { ProfilePortrait } from "@/components/site/profile-portrait";
import { ResearchCard } from "@/components/site/research-card";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";

export const metadata: Metadata = {
  title: "AI Law & Legal Intelligence",
  description:
    "Attorney-led AI law, legal intelligence, regulatory monitoring, and comparative analysis focused on artificial intelligence governance and legal systems.",
};

export const dynamic = "force-dynamic";

const entryPoints = [
  {
    eyebrow: "01",
    title: "Notes",
    description: "Writing and commentary.",
    href: "/research",
  },
  {
    eyebrow: "02",
    title: "AI law hub",
    description: "Live legal intelligence plus the reviewed legal database.",
    href: "/ai-regulation",
  },
  {
    eyebrow: "03",
    title: "Standards",
    description: "Frameworks and soft law.",
    href: "/standards",
  },
];

export default async function HomePage() {
  const [publishedUpdates, homeNewsItems] = await Promise.all([
    updateRepository.listPublicUpdates(),
    updateRepository.getPublicNewsItems(3),
  ]);
  const featuredUpdate = publishedUpdates[0];
  const featuredResearch = getFeaturedResearchEntry();
  const homeResearch = getPublicResearchEntries().slice(0, 2);
  const homeNews = homeNewsItems.map(normalizeNewsItemRecord).slice(0, 3);

  return (
    <SiteShell className="space-y-14 md:space-y-20">
      <section className="hero-grid new-york-wash glass-panel-strong noise-overlay relative isolate overflow-hidden rounded-[2.8rem] border border-white/40 px-6 py-8 md:px-10 md:py-12 lg:min-h-[84vh] lg:px-14 lg:py-16">
        <div className="absolute inset-y-0 right-0 w-[74%] bg-[linear-gradient(270deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08)_42%,rgba(255,255,255,0)_78%)]" />
        <NewYorkSignals />
        <div className="absolute inset-y-0 right-[-8rem] top-0 z-0 hidden w-[44rem] lg:block xl:right-[-10rem] xl:w-[52rem]">
          <ProfilePortrait priority large side ghost className="h-full" />
        </div>
        <div className="absolute left-6 top-6 z-10">
          <JarvisOrb className="hidden md:flex" label="Jarvis layer" />
        </div>
        <div className="relative z-10 max-w-[35rem] pt-8 lg:pt-14">
          <HeroIntro />
        </div>
      </section>

      {/* --- AI Law Hub: featured entry point + live news preview --- */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="AI legal intelligence"
          title="AI Law Hub"
          description="Live legal news, verified database, Europe and United States coverage."
        />

        {/* Hub portal card with live news preview */}
        <Link
          href="/ai-regulation"
          className="group block rounded-[2.2rem] border border-black/6 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.06),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,248,252,0.97))] p-6 shadow-[0_20px_60px_rgba(15,15,15,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(15,15,15,0.08)] md:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-emerald-600">
                Live monitoring
              </p>
            </div>
            <span className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-zinc-600 transition group-hover:border-black/15 group-hover:bg-zinc-50">
              Open hub →
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[1.2rem] border border-black/5 bg-white/80 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">Europe</p>
              <p className="mt-1 text-sm font-medium text-zinc-900">EU AI Act · Member States · EDPB</p>
            </div>
            <div className="rounded-[1.2rem] border border-black/5 bg-white/80 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">United States</p>
              <p className="mt-1 text-sm font-medium text-zinc-900">Federal · 50 states · Agencies</p>
            </div>
            <div className="rounded-[1.2rem] border border-black/5 bg-white/80 px-4 py-3 sm:col-span-2 lg:col-span-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">Database</p>
              <p className="mt-1 text-sm font-medium text-zinc-900">Verified · Human-reviewed · Sourced</p>
            </div>
          </div>

          {/* Latest 3 news as compact items */}
          {homeNews.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                Latest developments
              </p>
              {homeNews.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[1rem] border border-black/4 bg-white/60 px-4 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.verificationStatus === "official_verified" || item.verificationStatus === "corroborated"
                      ? "bg-emerald-500"
                      : item.verificationStatus === "media_reported"
                        ? "bg-amber-400"
                        : "bg-zinc-300"
                  }`} />
                  <p className="min-w-0 flex-1 truncate text-sm text-zinc-800">{item.title}</p>
                  <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                    {item.region}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </Link>
      </section>

      {/* --- Secondary entry points: Notes + Standards --- */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="Also on this site"
          title="Notes and standards"
        />
        <MotionStagger className="grid gap-4 lg:grid-cols-2">
          {entryPoints.filter((e) => e.href !== "/ai-regulation").map((entry) => (
            <Link
              key={entry.title}
              href={entry.href}
              className="glass-panel-soft noise-overlay block rounded-[2rem] p-6 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                {entry.eyebrow}
              </p>
              <h3 className="mt-4 font-display text-[1.6rem] font-medium uppercase tracking-[-0.05em] text-zinc-950">
                {entry.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-700">
                {entry.description}
              </p>
            </Link>
          ))}
        </MotionStagger>
      </section>

      {featuredResearch ? (
        <section className="grid gap-5 border-t border-black/6 pt-12 lg:grid-cols-[1.25fr_0.75fr]">
          <SectionHeading
            eyebrow="Selected note"
            title="A quieter editorial layer"
            description="Short notes and commentary on AI governance, legal practice, and legal intelligence."
            actions={
              <Link
                href={`/research/${featuredResearch.slug}`}
                scroll={false}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-zinc-700"
              >
                Open note
                <ArrowUpRight className="size-4" />
              </Link>
            }
          />
          <MotionStagger className="grid gap-5">
            {homeResearch.slice(0, 1).map((entry) => (
              <ResearchCard
                key={entry.slug}
                href={`/research/${entry.slug}`}
                category={entry.category}
                title={entry.title}
                description={entry.summary}
                status={entry.status === "published" ? "Public note" : "Note forthcoming"}
                meta={`${entry.readingTime}${entry.jurisdiction ? ` · ${entry.jurisdiction}` : ""}`}
                tags={entry.tags}
              />
            ))}
          </MotionStagger>
        </section>
      ) : null}

      {featuredUpdate ? (
        <MotionReveal className="glass-panel-soft noise-overlay rounded-[2rem] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">
                Live legal database
              </p>
              <p className="max-w-2xl text-sm leading-7 text-zinc-800">
                The public legal database remains limited to reviewed and published items.
              </p>
            </div>
            <Link
              href={`/ai-regulation/${featuredUpdate.id}`}
              scroll={false}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-zinc-800"
            >
              Open latest item
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </MotionReveal>
      ) : null}
    </SiteShell>
  );
}
