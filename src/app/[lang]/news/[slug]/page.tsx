import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger } from "@/components/site/motion-stagger";
import { SourceTypeBadge, VerificationBadge } from "@/components/site/legal-status-badge";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNewsVerificationLabel,
  normalizeNewsItemRecord,
} from "@/content/ai-regulation/news";
import { env } from "@/lib/env";
import { formatDisplayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getPublicNewsItem(slug: string) {
  const item = await updateRepository.getPublicNewsItemBySlug(slug);
  return item ? normalizeNewsItemRecord(item) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicNewsItem(slug);
  if (!item) return {};
  const title = `${item.title} | AI Law News`;
  const description = item.shortSummary;
  const canonical = `${env.NEXT_PUBLIC_SITE_URL}/news/${item.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "C. Saint-Girons, Esq - AI Law & Legal Intelligence",
      type: "article",
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublicNewsItem(slug);
  if (!item) notFound();
  const sourceReferences = await updateRepository.getSourceReferencesForRawItem(
    item.rawItemId,
    20,
  );

  const regionHub =
    item.region === "Europe"
      ? { label: "Europe", href: "/ai-regulation/europe" }
      : item.region === "United States" || item.region === "North America"
        ? { label: "United States", href: "/ai-regulation/united-states" }
        : null;

  return (
    <SiteShell className="space-y-8">
      {/* Breadcrumb */}
      <MotionReveal>
      <BreadcrumbNav
        items={[
          { label: "AI Law Hub", href: "/ai-regulation" },
          { label: "AI Law News", href: "/ai-regulation?view=news" },
          ...(regionHub ? [regionHub] : []),
          { label: "Item", href: `/news/${item.slug}` },
        ]}
      />

      {/* Header */}
      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <VerificationBadge status={item.verificationStatus} />

          <SourceTypeBadge sourceType={item.sourceType} />
          <span className="inline-flex items-center rounded-full border border-black/6 bg-zinc-50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">
            {item.region}
          </span>
        </div>

        <h1 className="max-w-4xl font-display text-4xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-5xl">
          {item.title}
        </h1>

        <p className="max-w-3xl text-lg leading-8 text-zinc-700">{item.shortSummary}</p>

        {/* Primary CTA — read original source */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            Read original source
            <span aria-hidden>↗</span>
          </a>
          {item.officialSourceUrl && item.officialSourceUrl !== item.sourceUrl ? (
            <a
              href={item.officialSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
            >
              Official source
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>

        {/* Source + dates meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-zinc-500">
          <span>
            <span className="font-medium text-zinc-700">{item.sourceName}</span>
          </span>
          {item.publicationDate ? (
            <span>Published {formatDisplayDate(item.publicationDate)}</span>
          ) : null}
          {item.exactDateOfInformation ? (
            <span>Event date: {formatDisplayDate(item.exactDateOfInformation)}</span>
          ) : (
            <span className="text-zinc-400">Exact event date not detected</span>
          )}
        </div>
      </section>
      </MotionReveal>

      {/* Summary + metadata */}
      <MotionReveal delay={0.1}>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Full summary */}
        <Card className="rounded-[2rem] border-black/6 bg-white/90 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="space-y-4 p-7 text-sm leading-7 text-zinc-700">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              Summary
            </p>
            <p>{item.fullSummary}</p>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800">
              This entry belongs to the AI Law News layer. It becomes legal-authority-grade only when
              supported by official source citations. Refer to the verified database
              for source-backed legal conclusions.
            </div>
          </CardContent>
        </Card>

        {/* Metadata panel */}
        <Card className="rounded-[2rem] border-black/6 bg-zinc-50/80 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="space-y-3 p-7 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              Metadata
            </p>
            {[
              ["Source", item.sourceName],
              ["Source type", item.sourceType.replaceAll("_", " ")],
              ["Reliability", item.sourceReliability.replaceAll("_", " ")],
              ["Jurisdiction", item.jurisdiction],
              ["Legal area", item.legalArea],
              ["Authority signal", item.authorityType.replaceAll("_", " ")],
              ["Verification", getNewsVerificationLabel(item)],
              ["Citation quality", item.citationQuality.replaceAll("_", " ")],
              ["Detected", formatDisplayDate(item.detectedAt)],
              ["Last verified", formatDisplayDate(item.lastVerifiedAt)],
            ].map(([label, value]) =>
              value ? (
                <div key={label} className="flex justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400 shrink-0">
                    {label}
                  </span>
                  <span className="text-right text-zinc-700">{value}</span>
                </div>
              ) : null,
            )}
          </CardContent>
        </Card>
      </div>
      </MotionReveal>

      {/* Source references */}
      {sourceReferences.length > 0 ? (
        <MotionReveal delay={0.15}>
        <section className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
            Source references and verification trail
          </p>
          <MotionStagger className="grid gap-3 md:grid-cols-2">
            {sourceReferences.map((reference) => (
              <div
                key={`${reference.sourceRole}-${reference.url}`}
                className="rounded-[1.6rem] border border-black/6 bg-white/80 p-5 text-sm text-zinc-700"
              >
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-black/6 bg-zinc-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                    {reference.sourceRole.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full border border-black/6 bg-zinc-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                    {reference.sourceType.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 font-medium text-zinc-950">
                  {reference.institution}
                </p>
                <p className="mt-1 text-zinc-600">{reference.title}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400">
                  {reference.publicationDate ? (
                    <span>Published {formatDisplayDate(reference.publicationDate)}</span>
                  ) : null}
                  {reference.lastVerifiedAt ? (
                    <span>Verified {formatDisplayDate(reference.lastVerifiedAt)}</span>
                  ) : null}
                </div>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block truncate text-sm text-zinc-500 underline decoration-black/10 underline-offset-4 hover:text-zinc-900"
                >
                  {reference.url}
                </a>
                {reference.notes ? (
                  <p className="mt-2 text-xs text-zinc-400">{reference.notes}</p>
                ) : null}
              </div>
            ))}
          </MotionStagger>
        </section>
        </MotionReveal>
      ) : null}

      {/* Link to monitor item */}
      {item.relatedMonitorItemId ? (
        <Link
          href={`/ai-regulation/${item.relatedMonitorItemId}`}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
        >
          View verified database entry
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          Official verification pending — no verified database entry yet.
        </div>
      )}
    </SiteShell>
  );
}
