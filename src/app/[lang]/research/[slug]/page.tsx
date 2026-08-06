import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  getPublicResearchEntries,
  getPublicResearchEntryBySlug,
  getRelatedResearchEntries,
} from "@/content/research";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger } from "@/components/site/motion-stagger";
import {
  ArticleLanguageProvider,
  ArticleLanguageSwitcher,
  ArticleReadingTime,
  ArticleTitle,
  ResearchArticleBody,
} from "@/components/site/research-article-body";
import { ResearchCard } from "@/components/site/research-card";
import { ResearchStatusBadge } from "@/components/site/research-status-badge";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { jsonLdString, localeAlternates, researchArticleJsonLd } from "@/lib/seo";
import { getDictionary } from "../../dictionaries";

type ResearchArticlePageProps = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    getPublicResearchEntries().map((entry) => ({ lang, slug: entry.slug })),
  );
}

export async function generateMetadata({
  params,
}: ResearchArticlePageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const entry = getPublicResearchEntryBySlug(slug);

  if (!entry) {
    const fallback = isLocale(lang)
      ? (await getDictionary(lang)).research.metaTitle
      : "Notes & Commentary";
    return { title: fallback };
  }

  return {
    title: entry.title,
    description: entry.summary,
    alternates: isLocale(lang) ? localeAlternates(lang, `/research/${entry.slug}`) : undefined,
    openGraph: {
      title: `${entry.title} | C. Saint-Girons, Esq — AI Law & Legal Intelligence`,
      description: entry.summary,
      type: "article",
    },
  };
}

export default async function ResearchArticlePage({
  params,
}: ResearchArticlePageProps) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const entry = getPublicResearchEntryBySlug(slug);
  if (!entry) notFound();

  const t = (await getDictionary(lang)).research.article;
  // Only surface published notes as "related" — forthcoming notes are not shown
  // publicly (they stay in the registry for admin).
  const relatedEntries = getRelatedResearchEntries(entry, 3).filter(
    (related) => related.status === "published",
  );

  return (
    <ArticleLanguageProvider entry={entry} lang={lang}>
    <SiteShell className="space-y-14 md:space-y-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(researchArticleJsonLd(entry, lang)) }}
      />
      <MotionReveal className="space-y-6">
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: t.home, href: "/" },
            { label: t.notesCommentary, href: "/research" },
            {
              label:
                entry.title.slice(0, 30) +
                (entry.title.length > 30 ? "…" : ""),
              href: `/research/${entry.slug}`,
            },
          ]}
        />

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {entry.category}
            </p>
            <ResearchStatusBadge status={entry.status} />
          </div>
          <ArticleTitle />
          <ArticleLanguageSwitcher />
        </div>

        <Card className="glass-panel-soft rounded-[2rem] border-black/6 text-zinc-950">
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                {t.author}
              </p>
              <p className="text-sm text-zinc-800">{entry.author}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                {t.readingTime}
              </p>
              <ArticleReadingTime />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                {t.status}
              </p>
              <p className="text-sm text-zinc-800">
                {entry.status === "published" ? t.publicNote : t.noteInDevelopment}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                {t.jurisdiction}
              </p>
              <p className="text-sm text-zinc-800">
                {entry.jurisdiction ?? t.generalJurisdiction}
              </p>
            </div>
            {entry.publishedAt ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  {t.published}
                </p>
                <p className="text-sm text-zinc-800">{entry.publishedAt}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </MotionReveal>

      {entry.image ? (
        <MotionReveal>
          <div className="relative h-[18rem] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] md:h-[28rem]">
            <Image
              src={entry.image}
              alt={entry.title}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              priority
            />
          </div>
        </MotionReveal>
      ) : null}

      <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="space-y-10">
          
          <ResearchArticleBody
            t={{ abstract: t.abstract, references: t.references }}
          />
        </article>

        <aside className="space-y-5">
          <Card className="glass-panel-soft rounded-[2rem] border-black/6 text-zinc-950">
            <CardContent className="space-y-4 p-6">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                {t.editorialContext}
              </p>
              <p className="text-sm leading-7 text-zinc-700">{t.disclaimer}</p>
              {entry.updatedAt ? (
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {t.lastUpdated} {entry.updatedAt}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glass-panel-soft rounded-[2rem] border-black/6 text-zinc-950">
            <CardContent className="space-y-4 p-6">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                {t.tags}
              </p>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-black/8 bg-white/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      {relatedEntries.length ? (
        <section className="space-y-8 border-t border-black/6 pt-12">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {t.relatedNotes}
            </p>
            <h2 className="font-serif text-3xl text-zinc-950">
              {t.continueReading}
            </h2>
          </div>
          <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedEntries.map((related) => (
              <ResearchCard
                key={related.slug}
                lang={lang}
                href={`/research/${related.slug}`}
                category={related.category}
                title={related.title}
                description={related.summary}
                status={
                  related.status === "published"
                    ? t.publicNote
                    : t.noteForthcoming
                }
                meta={`${related.readingTime}${related.jurisdiction ? ` · ${related.jurisdiction}` : ""}`}
                tags={related.tags}
              />
            ))}
          </MotionStagger>
        </section>
      ) : null}
    </SiteShell>
    </ArticleLanguageProvider>
  );
}
