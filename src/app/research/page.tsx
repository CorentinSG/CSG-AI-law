import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

import { getPublicResearchEntries } from "@/content/research";
import {
  ArticleCarousel,
  type ArticleCarouselItem,
} from "@/components/site/article-carousel";
import { MotionReveal } from "@/components/site/motion-reveal";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Notes & Commentary",
  description:
    "Notes, commentary, and legal analysis on AI regulation, governance, legal ethics, legal technology, and comparative AI law.",
};

export default function ResearchPage() {
  const published = getPublicResearchEntries().filter(
    (e) => e.status === "published",
  );

  const carouselItems: ArticleCarouselItem[] = published.map((entry) => ({
    id: entry.slug,
    title: entry.title,
    description: entry.summary,
    href: `/research/${entry.slug}`,
    image: entry.image ?? "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1080&q=80",
    category: entry.category,
    meta: entry.readingTime,
  }));

  return (
    <SiteShell className="space-y-20">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <MotionReveal className="space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-500">
          Notes &amp; Commentary
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-6xl">
          Analyse juridique de l&rsquo;IA
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600">
          Notes et commentaires sur la régulation de l&rsquo;IA, la gouvernance, l&rsquo;éthique juridique
          et le droit comparé — rédigés par Corentin Saint-Girons.
        </p>
      </MotionReveal>

      {/* ── Articles ─────────────────────────────────────────── */}
      {carouselItems.length > 0 ? (
        <section className="-mx-6 space-y-6 border-t border-black/6 pt-16 md:-mx-10 lg:-mx-16">
          <div className="px-6 md:px-10 lg:px-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              Notes publiées
            </p>
          </div>
          <ArticleCarousel items={carouselItems} />
        </section>
      ) : (
        <MotionReveal>
          <section className="border-t border-black/6 pt-16">
            <div className="flex flex-col items-center gap-8 rounded-[2.5rem] border border-black/6 bg-zinc-50/60 px-8 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-sm">
                <PenLine className="size-6 text-zinc-400" />
              </div>
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                  En cours de rédaction
                </p>
                <h2 className="font-display text-3xl font-medium uppercase tracking-[-0.04em] text-zinc-900">
                  Notes à venir
                </h2>
                <p className="mx-auto max-w-md text-sm leading-7 text-zinc-500">
                  Les premières notes sur la régulation de l&rsquo;IA, le droit comparé et la gouvernance
                  seront publiées prochainement.
                </p>
              </div>
              <Link
                href="/ai-regulation"
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700 underline decoration-black/15 underline-offset-4 hover:text-zinc-900"
              >
                Consulter le moniteur IA en attendant
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </MotionReveal>
      )}
    </SiteShell>
  );
}
