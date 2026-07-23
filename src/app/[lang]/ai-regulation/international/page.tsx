import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { buildLiveStoryFeed } from "@/agents/ai-regulation/storyClustering";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { StandardsExplorer, type StandardsInstrument } from "@/components/site/standards-explorer";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent } from "@/components/ui/card";
import { internationalAiStandardsBaseline } from "@/content/ai-regulation/international-ai-standards";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";
import { formatDisplayDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "International AI Law Hub",
  description:
    "International AI law and governance monitoring: ISO/IEC standards, OECD, UNESCO, IEEE, and cross-border AI governance instruments.",
};

export const revalidate = 300;

function isInternationalSignal(input: {
  region?: string | null;
  jurisdiction?: string | null;
  sourceName?: string | null;
  tags?: string[];
}) {
  const haystack = [
    input.region,
    input.jurisdiction,
    input.sourceName,
    ...(input.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(international|global|oecd|unesco|iso|iec|ieee|council of europe|standards?)\b/.test(
    haystack,
  );
}

function buildInternationalInstruments(): StandardsInstrument[] {
  return internationalAiStandardsBaseline
    .map((entry) => ({
      id: `intl-${entry.id}`,
      title: entry.title,
      institution: entry.institution,
      region: "International" as const,
      type: entry.authorityType,
      binding: entry.bindingStatus,
      access: (entry.authorityType === "technical_standard" ? "metadata" : "monitored") as
        | "metadata"
        | "monitored",
      summary: entry.summary,
      sourceUrl: entry.sourceUrl,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default async function InternationalAiRegulationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";

  // Window widened from 40 so story clustering sees enough items to group
  // cross-source duplicates instead of a thin top-of-feed slice.
  const [updates, newsItems] = await Promise.all([
    updateRepository.listPublicUpdates(),
    updateRepository.getPublicNewsItems(120),
  ]);

  const internationalUpdates = updates.filter(isInternationalSignal).slice(0, 6);
  // Clustered into cross-source stories before the display cap, so the same
  // development reported by several sources renders as one corroborated row.
  const internationalStories = buildLiveStoryFeed(
    newsItems.map(normalizeNewsItemRecord).filter(isInternationalSignal),
    { limit: 6 },
  );
  const instruments = buildInternationalInstruments();

  return (
    <SiteShell className="space-y-12">
      <MotionReveal className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-500">
              {fr ? "Hub international" : "International hub"}
            </p>
            <span className="rounded-full border border-teal-300/25 bg-teal-400/[0.08] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-teal-300">
              {fr ? "Couche transnationale" : "Transnational layer"}
            </span>
          </div>
          <h1 className="font-display text-7xl font-medium uppercase leading-none tracking-[-0.05em] text-zinc-950">
            International
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-500">
            {fr
              ? "Standards ISO/IEC, principes OCDE, UNESCO, IEEE et instruments transnationaux qui structurent la gouvernance de l'IA — au-dessus des juridictions nationales."
              : "ISO/IEC standards, OECD principles, UNESCO, IEEE, and cross-border instruments shaping AI governance — above national jurisdictions."}
          </p>
        </div>
        <Link
          href={localeHref(lang, "/ai-regulation")}
          className="mt-2 shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 underline decoration-black/15 underline-offset-4 transition-colors hover:text-zinc-900"
        >
          {fr ? "Overview →" : "Overview →"}
        </Link>
      </MotionReveal>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <MotionReveal delay={0.06}>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--color-live,#10b981)] opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--color-live,#10b981)]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
                {fr ? "Veille internationale" : "Live international monitor"}
              </span>
            </div>

            {internationalStories.length > 0 ? (
              <ol className="flex-1 divide-y divide-white/8">
                {internationalStories.map((story) => {
                  const item = story.primary;
                  return (
                  <li key={story.id} className="group py-3.5">
                    <p className="line-clamp-2 text-[15px] font-medium leading-6 text-white/90">
                      {item.title}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                      {(story.phase === "breaking" || story.phase === "developing") && (
                        <>
                          <span className={story.phase === "breaking" ? "text-emerald-300" : "text-sky-300"}>
                            {story.phase === "breaking" ? "Breaking" : "Developing"}
                          </span>
                          <span aria-hidden className="text-white/25">-</span>
                        </>
                      )}
                      {story.corroboration.sourceCount > 1 && (
                        <>
                          <span className="text-[color:var(--color-accent-strong,#c4882a)]">
                            {story.corroboration.sourceCount} sources
                          </span>
                          <span aria-hidden className="text-white/25">-</span>
                        </>
                      )}
                      <span className="text-white/60">{item.jurisdiction || item.region}</span>
                      <span aria-hidden className="text-white/25">-</span>
                      <span>{item.publicationDate ? formatDisplayDate(item.publicationDate) : "-"}</span>
                      {(item.officialSourceUrl ?? item.sourceUrl) && (
                        <>
                          <span aria-hidden className="text-white/25">-</span>
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
                  );
                })}
              </ol>
            ) : (
              <div className="flex flex-1 items-center py-10">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                  {fr ? "Aucun signal international recent" : "No recent international signals"}
                </p>
              </div>
            )}
          </div>
        </MotionReveal>

        <MotionReveal delay={0.12}>
          <Card className="h-full rounded-[2rem] border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <CardContent className="flex h-full flex-col justify-between gap-7 p-7">
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-teal-300">
                  {fr ? "Corpus suivi" : "Tracked corpus"}
                </p>
                <p className="font-display text-4xl font-medium uppercase leading-none tracking-[-0.05em] text-zinc-950">
                  {instruments.length} instruments
                </p>
                <p className="text-sm leading-7 text-zinc-500">
                  {fr
                    ? "Une couche internationale distincte du droit contraignant national ou régional — jamais présentée comme du droit dur par défaut."
                    : "An international layer kept distinct from national or regional binding law — never presented as hard law by default."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["ISO/IEC", "OECD", "UNESCO", "IEEE", "G7/GPAI"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-700"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </MotionReveal>
      </section>

      <section className="space-y-5">
        <MotionReveal>
          <SectionHeading
            eyebrow={fr ? "Standards internationaux" : "International standards"}
            title={fr ? "Instruments suivis" : "Tracked instruments"}
            description={
              fr
                ? "Ces instruments sont classes comme standards, droit souple ou gouvernance. Ils ne sont pas du droit contraignant sauf incorporation officielle."
                : "These instruments are classified as standards, soft law, or governance. They are not binding law unless officially incorporated."
            }
          />
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <StandardsExplorer instruments={instruments} lang={lang} />
        </MotionReveal>
      </section>

      <section className="space-y-4">
        <MotionReveal>
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow={fr ? "Base juridique" : "Legal database"}
              title={fr ? "Entrees internationales publiees" : "Published international entries"}
            />
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href={localeHref(lang, "/standards")}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 underline decoration-black/15 underline-offset-4 hover:text-zinc-800"
              >
                {fr ? "Standards →" : "Standards →"}
              </Link>
              <Link
                href={localeHref(lang, "/ai-regulation/methodology")}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 underline decoration-black/15 underline-offset-4 hover:text-zinc-800"
              >
                {fr ? "Méthodologie →" : "Methodology →"}
              </Link>
            </div>
          </div>
        </MotionReveal>

        {internationalUpdates.length > 0 ? (
          <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {internationalUpdates.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                href={`/ai-regulation/${update.id}`}
              />
            ))}
          </MotionStagger>
        ) : (
          <Card className="rounded-[1.8rem] border-black/6 bg-white/90 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm leading-6 text-zinc-500">
                {fr
                  ? "Aucune entree internationale publiee pour l'instant. Les standards restent visibles dans le corpus tant qu'aucune actualite sourcee n'est publiee."
                  : "No published international database entries yet. Standards remain visible in the corpus until source-backed developments are published."}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </SiteShell>
  );
}
