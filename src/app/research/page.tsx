import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Gavel,
  Globe2,
  Scale,
  Shield,
} from "lucide-react";

import {
  getFeaturedResearchEntry,
  getPublicResearchEntries,
  getResearchCategoryCounts,
  type ResearchCategory,
} from "@/content/research";
import { FeatureCard } from "@/components/site/feature-card";
import { ResearchCard } from "@/components/site/research-card";
import { ResearchStatusBadge } from "@/components/site/research-status-badge";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Notes & Commentary",
  description:
    "Notes, commentary, and legal analysis on AI regulation, governance, legal ethics, legal technology, and comparative AI law.",
};

const categoryIcons: Partial<Record<ResearchCategory, typeof Gavel>> = {
  "AI Regulation": Gavel,
  "Comparative AI Law": Scale,
  "Soft Law & Standards": Shield,
  "AI & Legal Ethics": FileText,
  "Legal Technology": Globe2,
  "Legal Intelligence Systems": FileText,
};

export default function ResearchPage() {
  const featuredEntry = getFeaturedResearchEntry();
  const publicEntries = getPublicResearchEntries();
  const categoryCounts = getResearchCategoryCounts();
  const forthcomingEntries = publicEntries.filter((entry) => entry.status === "forthcoming");
  const publishedEntries = publicEntries.filter((entry) => entry.status === "published");

  return (
    <SiteShell className="space-y-20">
      <section className="space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-600">
          Notes &amp; Commentary
        </p>
        <h1 className="max-w-5xl font-display text-5xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-6xl">
          Notes, commentary, and legal analysis on AI law
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-zinc-700">
          Notes and commentary on AI regulation, governance, and legal technology.
        </p>
      </section>

      {featuredEntry ? (
        <Card className="glass-panel-soft rounded-[2.2rem] border-black/6 text-zinc-950">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">
                  Featured note
                </p>
                <ResearchStatusBadge status={featuredEntry.status} />
              </div>
              <div className="space-y-3">
                <h2 className="max-w-4xl font-display text-4xl font-medium uppercase leading-tight tracking-[-0.05em] text-zinc-950 md:text-5xl">
                  {featuredEntry.title}
                </h2>
                <p className="max-w-3xl text-base leading-8 text-zinc-700 md:text-lg">
                  {featuredEntry.subtitle}
                </p>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-zinc-800">
                {featuredEntry.summary}
              </p>
              <Link
                href={`/research/${featuredEntry.slug}`}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-zinc-800 underline decoration-black/15 underline-offset-4"
              >
                Open note
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-600">
                Editorial context
              </p>
              <div className="space-y-2 text-sm leading-7 text-zinc-800">
                <p>Author: {featuredEntry.author}</p>
                <p>Category: {featuredEntry.category}</p>
                <p>Reading time: {featuredEntry.readingTime}</p>
                <p>
                  Status: {featuredEntry.status === "published" ? "Public note" : "Forthcoming"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-8 border-t border-black/6 pt-16">
        <SectionHeading
          eyebrow="Categories"
          title="An organized editorial structure"
          description="Organized by recurring lines of inquiry."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categoryCounts.map((item) => {
            const Icon = categoryIcons[item.category] ?? FileText;
            return (
              <FeatureCard
                key={item.category}
                icon={Icon}
                eyebrow="Editorial category"
                title={item.category}
                description={`${item.count} public note${item.count > 1 ? "s" : ""} currently visible in this category.`}
                cta="Editorial structure in progress"
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-8 border-t border-black/6 pt-16">
        <SectionHeading
          eyebrow="Published notes"
          title="Current public notes"
          description="Public notes and commentary; forthcoming ones are marked."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {publishedEntries.map((entry) => (
            <ResearchCard
              key={entry.slug}
              href={`/research/${entry.slug}`}
              category={entry.category}
              title={entry.title}
              description={entry.summary}
              status="Public note"
              meta={`${entry.readingTime}${entry.jurisdiction ? ` · ${entry.jurisdiction}` : ""}`}
              tags={entry.tags}
            />
          ))}
        </div>
      </section>

      <section className="space-y-8 border-t border-black/6 pt-16">
        <SectionHeading
          eyebrow="In development"
          title="Forthcoming notes and commentary topics"
          description="Previews of where the section is heading."
          actions={
            <Link
              href="/ai-regulation"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-zinc-800"
            >
              See the live monitor
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {forthcomingEntries.map((entry) => (
            <ResearchCard
              key={entry.slug}
              href={`/research/${entry.slug}`}
              category={entry.category}
              title={entry.title}
              description={entry.summary}
              status="Note in development"
              meta={entry.jurisdiction ?? "Cross-jurisdictional"}
              tags={entry.tags}
            />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
