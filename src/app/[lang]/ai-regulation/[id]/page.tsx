import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { assessCitationQuality, getCitationReferences } from "@/agents/ai-regulation/citations";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
} from "@/agents/ai-regulation/utils/authority";
import { AuthorityBadge } from "@/components/site/authority-badge";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatDisplayDate } from "@/lib/utils";

// Stays dynamic (not ISR like the other public /ai-regulation pages, T-RT0C):
// this is a single published monitor-item detail. If an item is unpublished
// (e.g. a legal correction), it must drop from public immediately — the review
// action does not revalidate this exact path, so caching it would risk serving
// withdrawn legal content for up to the revalidate window. Keep it per-request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const update = await updateRepository.getPublicUpdate(id);
  if (!update) {
    return {};
  }
  const title = `${update.title} | AI Law Intelligence`;
  const description = update.oneSentenceSummary;
  const canonical = `${env.NEXT_PUBLIC_SITE_URL}/ai-regulation/${update.id}`;

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

export default async function LegalUpdateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const update = await updateRepository.getPublicUpdate(id);
  if (!update) {
    notFound();
  }
  const [rawItem, source] = await Promise.all([
    updateRepository.getRawItem(update.rawItemId),
    updateRepository.getSource(update.sourceId),
  ]);

  const authorityType = deriveUpdateAuthorityType(update);
  const authority = getAuthorityPresentation(authorityType);
  const sourceReferences = getCitationReferences({ update, rawItem, source });
  const citationAssessment = assessCitationQuality(sourceReferences);
  const hubPath =
    update.region === "Europe"
      ? "/ai-regulation/europe"
      : update.region === "North America"
        ? "/ai-regulation/united-states"
        : null;

  return (
    <SiteShell className="space-y-8">
      {/* Breadcrumb */}
      <BreadcrumbNav
        items={[
          { label: "AI Law Hub", href: "/ai-regulation" },
          ...(hubPath
            ? [{ label: update.region === "Europe" ? "Europe" : "United States", href: hubPath }]
            : []),
          { label: "Database entry", href: `/ai-regulation/${update.id}` },
        ]}
      />

      {/* Header */}
      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <AuthorityBadge label={authority.label} authorityType={authorityType} />
          <span className="inline-flex items-center rounded-full border border-black/6 bg-zinc-50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">
            {update.region}
          </span>
          <span className="inline-flex items-center rounded-full border border-black/6 bg-zinc-50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-600">
            {update.developmentType}
          </span>
        </div>

        <h1 className="max-w-4xl font-display text-4xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-5xl">
          {update.title}
        </h1>

        <p className="max-w-3xl text-lg leading-8 text-zinc-700">{update.oneSentenceSummary}</p>

        {/* Source CTA */}
        {update.sourceUrl ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={update.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              Open official source
              <span aria-hidden>↗</span>
            </a>
            <span className="text-sm text-zinc-500">{update.sourceName}</span>
          </div>
        ) : null}
      </section>

      {/* Key signals */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <IntelligenceSignal
          label="Authority type"
          value={authority.label}
          note="What kind of legal or quasi-legal signal this entry represents."
          tone="informative"
        />
        <IntelligenceSignal
          label="Source"
          value={update.sourceName}
          note="The originating institution or official publication attached to this entry."
          tone="neutral"
        />
        <IntelligenceSignal
          label="Citation quality"
          value={citationAssessment.qualityStatus.replaceAll("_", " ")}
          note="Source references are checked before publication. Entries remain traceable to their sources."
          tone={citationAssessment.qualityStatus === "complete" ? "positive" : "warning"}
        />
        <IntelligenceSignal
          label="Publication date"
          value={formatDisplayDate(update.publicationDate)}
          note="Date of the underlying legal development or official publication."
          tone="neutral"
        />
      </section>

      {/* Main content + metadata sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Content sections */}
        <Card className="rounded-[2rem] border-black/6 bg-white/90 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardHeader>
            <CardTitle>Legal intelligence summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-7 text-zinc-700">
            {update.summary ? (
              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Summary</p>
                <p>{update.summary}</p>
              </section>
            ) : null}
            {update.whatHappened ? (
              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">What happened</p>
                <p>{update.whatHappened}</p>
              </section>
            ) : null}
            {update.whyItMatters ? (
              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Why it matters</p>
                <p>{update.whyItMatters}</p>
              </section>
            ) : null}
            {update.practicalImpact ? (
              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Practical legal impact</p>
                <p>{update.practicalImpact}</p>
              </section>
            ) : null}
          </CardContent>
        </Card>

        {/* Metadata sidebar */}
        <Card className="rounded-[2rem] border-black/6 bg-zinc-50/80 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="space-y-5 p-7 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Details</p>

            {/* Date + importance */}
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              {([
                ["Publication", formatDisplayDate(update.publicationDate)],
                ["Detected", formatDisplayDate(update.detectedDate)],
                ["Importance", update.importanceLevel],
                ["Confidence", update.confidenceLevel],
                ["Jurisdiction", update.jurisdiction],
                ["Legal area", update.legalArea],
                ...(update.country ? [["Country / state", update.country]] : []),
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="contents">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">{label}</span>
                  <span className="text-right text-zinc-700">{value}</span>
                </div>
              ))}
            </div>

            {/* Affected parties */}
            {update.affectedParties.length > 0 ? (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">Affected parties</p>
                <ul className="space-y-1 text-xs text-zinc-600">
                  {update.affectedParties.map((p) => <li key={p} className="flex gap-1"><span className="text-zinc-300">—</span>{p}</li>)}
                </ul>
              </div>
            ) : null}

            {/* Key obligations */}
            {update.keyObligations.length > 0 ? (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">Key obligations</p>
                <ul className="space-y-1 text-xs text-zinc-600">
                  {update.keyObligations.map((item) => <li key={item} className="flex gap-1"><span className="text-zinc-300">—</span>{item}</li>)}
                </ul>
              </div>
            ) : null}

            {/* Compliance deadlines */}
            {update.complianceDeadlines.length > 0 ? (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">Compliance deadlines</p>
                <ul className="space-y-1 text-xs text-zinc-600">
                  {update.complianceDeadlines.map((item) => <li key={item} className="flex gap-1"><span className="text-amber-400">!</span>{item}</li>)}
                </ul>
              </div>
            ) : null}

            {/* Enforcement risk */}
            {update.enforcementRisk ? (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">Enforcement risk</p>
                <p className="text-xs text-zinc-600">{update.enforcementRisk}</p>
              </div>
            ) : null}

            {/* Tags */}
            {update.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {update.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-full border border-black/6 bg-white px-2 py-0.5 text-xs text-zinc-600">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Source note */}
            <div className="rounded-[1.2rem] border border-black/6 bg-white p-4 text-xs text-zinc-600">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400 mb-2">Editorial note</p>
              <p>{authority.adminNotes[0] ?? "This entry is source-verified and published, and remains traceable to its official sources."}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Official sources */}
      {sourceReferences.length > 0 ? (
        <section className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
            Official source references
          </p>
          <div className="rounded-[1.8rem] border border-black/6 bg-zinc-50/60 p-5">
            <p className="mb-4 text-sm text-zinc-500">
              Source references make this legal database entry auditable. Each entry shows the institution, exact document title, official URL, date trail, and available pinpoints.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {sourceReferences.map((reference) => (
                <div
                  key={`${reference.sourceRole}-${reference.url}`}
                  className="rounded-[1.5rem] border border-black/6 bg-white p-5 text-sm"
                >
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="rounded-full border border-black/6 bg-zinc-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                      {reference.sourceRole.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full border border-black/6 bg-zinc-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                      {reference.sourceType.replaceAll("_", " ")}
                    </span>
                    {reference.authorityType ? (
                      <span className="rounded-full border border-black/6 bg-zinc-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                        {reference.authorityType}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-medium text-zinc-950">{reference.institution}</p>
                  <p className="mt-1 text-zinc-600">{reference.title}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400">
                    {reference.publicationDate ? (
                      <span>Published {formatDisplayDate(reference.publicationDate)}</span>
                    ) : null}
                    {reference.lastVerifiedAt ? (
                      <span>Verified {formatDisplayDate(reference.lastVerifiedAt)}</span>
                    ) : null}
                  </div>
                  {reference.pinpoint && Object.values(reference.pinpoint).some(Boolean) ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      Pinpoint: {Object.entries(reference.pinpoint)
                        .filter(([, v]) => v)
                        .map(([k, v]) => `${k} ${v}`)
                        .join("; ")}
                    </p>
                  ) : null}
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block truncate text-sm font-medium text-zinc-950 underline decoration-black/15 underline-offset-4 hover:text-zinc-600"
                  >
                    Official source ↗
                  </a>
                  {reference.notes ? (
                    <p className="mt-2 text-xs text-zinc-400">{reference.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Legal disclaimer */}
      <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
        This entry is part of a source-verified legal intelligence database, not legal advice. It is traceable to its official sources. Verify applicable law with qualified legal counsel before taking action.
      </div>
    </SiteShell>
  );
}
