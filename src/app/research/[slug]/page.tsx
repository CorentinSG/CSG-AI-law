import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPublicResearchEntries,
  getPublicResearchEntryBySlug,
  getRelatedResearchEntries,
} from "@/content/research";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { ResearchCard } from "@/components/site/research-card";
import { ResearchStatusBadge } from "@/components/site/research-status-badge";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";

type ResearchArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPublicResearchEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: ResearchArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getPublicResearchEntryBySlug(slug);

  if (!entry) {
    return {
      title: "Notes & Commentary",
    };
  }

  return {
    title: entry.title,
    description: entry.summary,
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
  const { slug } = await params;
  const entry = getPublicResearchEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const relatedEntries = getRelatedResearchEntries(entry, 3);

  return (
    <SiteShell className="space-y-14 md:space-y-20">
      <section className="space-y-6">
        <BreadcrumbNav
          items={[
            { label: "Home", href: "/" },
            { label: "Notes & Commentary", href: "/research" },
            { label: entry.title.slice(0, 30) + (entry.title.length > 30 ? "…" : ""), href: `/research/${entry.slug}` },
          ]}
        />

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {entry.category}
            </p>
            <ResearchStatusBadge status={entry.status} />
          </div>
          <h1 className="max-w-5xl font-serif text-4xl leading-[0.96] text-zinc-950 md:text-6xl">
            {entry.title}
          </h1>
          <p className="max-w-4xl text-lg leading-8 text-zinc-600">
            {entry.subtitle}
          </p>
        </div>

        <Card className="glass-panel-soft rounded-[2rem] border-black/6 text-zinc-950">
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Author
              </p>
              <p className="text-sm text-zinc-800">{entry.author}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Reading time
              </p>
              <p className="text-sm text-zinc-800">{entry.readingTime}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Status
              </p>
              <p className="text-sm text-zinc-800">
                {entry.status === "published" ? "Public note" : "Note in development"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Jurisdiction
              </p>
              <p className="text-sm text-zinc-800">
                {entry.jurisdiction ?? "General / cross-jurisdictional"}
              </p>
            </div>
            {entry.publishedAt ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Published</p>
                <p className="text-sm text-zinc-800">{entry.publishedAt}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="space-y-10">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">
              Abstract
            </p>
            <p className="max-w-4xl text-base leading-8 text-zinc-700 md:text-lg">
              {entry.abstract}
            </p>
          </div>

          <div className="space-y-10">
            {entry.body.map((section) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="font-serif text-3xl text-zinc-950">
                  {section.heading}
                </h2>
                <div className="space-y-4 text-base leading-8 text-zinc-700">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="space-y-3 text-base leading-8 text-zinc-700">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-3 size-1.5 rounded-full bg-zinc-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {entry.references?.length ? (
            <section className="space-y-4 border-t border-black/6 pt-8">
              <h2 className="font-serif text-3xl text-zinc-950">Sources and references</h2>
              <div className="space-y-3 text-sm leading-7 text-zinc-700">
                {entry.references.map((reference) => (
                  <div key={reference.label}>
                    {reference.href ? (
                      <Link
                        href={reference.href}
                        className="text-zinc-900 underline decoration-black/15 underline-offset-4"
                      >
                        {reference.label}
                      </Link>
                    ) : (
                      <span className="text-zinc-900">{reference.label}</span>
                    )}
                    {reference.note ? <p>{reference.note}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="space-y-5">
          <Card className="glass-panel-soft rounded-[2rem] border-black/6 text-zinc-950">
            <CardContent className="space-y-4 p-6">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                Editorial context
              </p>
              <p className="text-sm leading-7 text-zinc-700">
                This section publishes notes, commentary, and legal analysis for
                informational purposes only and does not constitute legal advice.
              </p>
              {entry.updatedAt ? (
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Last updated {entry.updatedAt}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glass-panel-soft rounded-[2rem] border-black/6 text-zinc-950">
            <CardContent className="space-y-4 p-6">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                Tags
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
              Related notes
            </p>
            <h2 className="font-serif text-3xl text-zinc-950">Continue reading</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedEntries.map((related) => (
              <ResearchCard
                key={related.slug}
                href={`/research/${related.slug}`}
                category={related.category}
                title={related.title}
                description={related.summary}
                status={related.status === "published" ? "Public note" : "Note forthcoming"}
                meta={`${related.readingTime}${related.jurisdiction ? ` · ${related.jurisdiction}` : ""}`}
                tags={related.tags}
              />
            ))}
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
