import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Database, FileText, Globe, Landmark, ShieldCheck } from "lucide-react";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getFeaturedResearchEntry, getPublicResearchEntries } from "@/content/research";
import { HeroIntro } from "@/components/site/hero-intro";
import { HeroSignalField } from "@/components/site/hero-signal-field";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger } from "@/components/site/motion-stagger";
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

// T-OPS7: the homepage only reads public, non-personalized published data
// (no searchParams/cookies), so it is served as cached HTML via ISR instead of
// re-rendering per request — same 300s cadence as the other public pages.
export const revalidate = 300;

const entryPoints = [
  { title: "Notes", href: "/research", icon: FileText },
  { title: "AI law hub", href: "/ai-regulation", icon: Database },
  { title: "Standards", href: "/standards", icon: ShieldCheck },
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
      <section className="relative isolate overflow-hidden rounded-[2.8rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,248,245,0.72))] px-6 py-10 shadow-[0_30px_90px_rgba(15,15,15,0.05)] md:px-12 md:py-14 lg:min-h-[80vh] lg:px-16 lg:py-20">
        <HeroSignalField className="absolute inset-0 z-0" />
        <div className="absolute inset-y-0 right-[-8rem] top-0 z-0 hidden w-[44rem] lg:block xl:right-[-10rem] xl:w-[52rem]">
          <ProfilePortrait priority large side ghost className="h-full" />
        </div>
        <div className="relative z-10 max-w-[35rem] pt-4 lg:pt-10">
          <HeroIntro />
        </div>
      </section>

      {/* --- AI Law Hub: featured entry point + live news preview --- */}
      <section className="space-y-4">
        <SectionHeading
          title="AI Law Hub"
        />

        {/* Hub portal card with live news preview */}
        <MotionReveal>
        <Link
          href="/ai-regulation"
          className="premium-sheen group block rounded-[2.2rem] border border-black/6 bg-[radial-gradient(ellipse_at_top_left,rgba(30,41,59,0.05),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,248,252,0.97))] p-6 shadow-[0_20px_60px_rgba(15,15,15,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,15,15,0.08)] md:p-8"
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

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-black/5 bg-white/80 px-4 py-3 transition group-hover:border-black/10">
              <Globe className="size-5 text-indigo-500/80" />
              <p className="text-sm font-medium text-zinc-900">Europe</p>
            </div>
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-black/5 bg-white/80 px-4 py-3 transition group-hover:border-black/10">
              <Landmark className="size-5 text-indigo-500/80" />
              <p className="text-sm font-medium text-zinc-900">United States</p>
            </div>
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-black/5 bg-white/80 px-4 py-3 transition group-hover:border-black/10">
              <Database className="size-5 text-indigo-500/80" />
              <p className="text-sm font-medium text-zinc-900">Database</p>
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
        </MotionReveal>
      </section>

      {/* --- Secondary entry points: Notes + Standards --- */}
      <section className="space-y-4">
        <SectionHeading
          title="Notes and standards"
        />
        <MotionStagger className="grid gap-4 lg:grid-cols-2">
          {entryPoints.filter((e) => e.href !== "/ai-regulation").map((entry) => (
            <Link
              key={entry.title}
              href={entry.href}
              className="glass-panel-soft premium-sheen group flex items-center justify-between gap-4 rounded-[2rem] p-6 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong transition group-hover:scale-105">
                  <entry.icon className="size-5" />
                </span>
                <h3 className="font-display text-[1.6rem] font-medium uppercase tracking-[-0.05em] text-zinc-950">
                  {entry.title}
                </h3>
              </div>
              <ArrowUpRight className="size-5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900" />
            </Link>
          ))}
        </MotionStagger>
      </section>

      {featuredResearch ? (
        <section className="grid gap-5 border-t border-black/6 pt-12 lg:grid-cols-[1.25fr_0.75fr]">
          <SectionHeading
            eyebrow="Selected note"
            title="A quieter editorial layer"
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
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">
                Live legal database
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
