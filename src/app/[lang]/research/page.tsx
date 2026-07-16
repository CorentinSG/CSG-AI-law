import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, PenLine } from "lucide-react";

import { getPublicResearchEntries } from "@/content/research";
import {
  ArticleCarousel,
  type ArticleCarouselItem,
} from "@/components/site/article-carousel";
import { MotionReveal } from "@/components/site/motion-reveal";
import { ResearchCard } from "@/components/site/research-card";
import { MotionStagger } from "@/components/site/motion-stagger";
import { SiteShell } from "@/components/site/shell";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/research">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = (await getDictionary(lang)).research;
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function ResearchPage({
  params,
}: PageProps<"/[lang]/research">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = (await getDictionary(lang)).research;
  const publicEntries = getPublicResearchEntries();
  const published = publicEntries.filter((e) => e.status === "published");
  const forthcoming = publicEntries.filter((e) => e.status === "forthcoming");

  const carouselItems: ArticleCarouselItem[] = published.map((entry) => ({
    id: entry.slug,
    title: entry.title,
    description: entry.summary,
    href: `/${lang}/research/${entry.slug}`,
    image: entry.image,
    category: entry.category,
    meta: entry.readingTime,
  }));

  return (
    <SiteShell className="space-y-20">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <MotionReveal className="space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-500">
          {t.eyebrow}
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-6xl">
          {t.title}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600">{t.intro}</p>
      </MotionReveal>

      {/* ── Published articles ───────────────────────────────── */}
      {carouselItems.length > 0 ? (
        <section className="-mx-6 space-y-6 border-t border-black/6 pt-16 md:-mx-10 lg:-mx-16">
          <div className="px-6 md:px-10 lg:px-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {t.publishedLabel}
            </p>
          </div>
          <ArticleCarousel items={carouselItems} readLabel={t.readLabel} />
        </section>
      ) : null}

      {/* ── Forthcoming notes — announced, not yet published ──── */}
      {forthcoming.length > 0 ? (
        <section className="space-y-6 border-t border-black/6 pt-16">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-600">
                {t.forthcomingLabel}
              </p>
              <h2 className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-900">
                {t.forthcomingHeading}
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-xs leading-6 text-zinc-500 sm:block">
              {t.forthcomingNote}
            </p>
          </div>
          <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {forthcoming.map((entry) => (
              <ResearchCard
                key={entry.slug}
                category={entry.category}
                title={entry.title}
                description={entry.summary}
                href={`/${lang}/research/${entry.slug}`}
                status="forthcoming"
                meta={entry.readingTime}
                tags={entry.tags}
              />
            ))}
          </MotionStagger>
        </section>
      ) : null}

      {carouselItems.length === 0 && forthcoming.length === 0 ? (
        <MotionReveal>
          <section className="border-t border-black/6 pt-16">
            <div className="flex flex-col items-center gap-8 rounded-[2.5rem] border border-black/6 bg-zinc-50/60 px-8 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-sm">
                <PenLine className="size-6 text-zinc-400" />
              </div>
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                  {t.emptyLabel}
                </p>
                <h2 className="font-display text-3xl font-medium uppercase tracking-[-0.04em] text-zinc-900">
                  {t.emptyHeading}
                </h2>
                <p className="mx-auto max-w-md text-sm leading-7 text-zinc-500">
                  {t.emptyBody}
                </p>
              </div>
              <Link
                href={`/${lang}/ai-regulation`}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700 underline decoration-black/15 underline-offset-4 hover:text-zinc-900"
              >
                {t.emptyCta}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </MotionReveal>
      ) : null}
    </SiteShell>
  );
}
