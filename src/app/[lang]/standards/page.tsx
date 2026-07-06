import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getPublicResearchEntries } from "@/content/research";
import { europeAiSoftLawBaseline } from "@/content/ai-regulation/europe-ai-soft-law";
import { usAiSoftLawBaseline } from "@/content/ai-regulation/us-ai-soft-law";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { ResearchCard } from "@/components/site/research-card";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { StandardsExplorer, type StandardsInstrument } from "@/components/site/standards-explorer";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";
import { formatDisplayDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Standards & Soft Law",
  description:
    "Every technical standard, governance framework, and soft-law instrument tracked for AI compliance — searchable, filterable, and clearly distinguished from binding law.",
};

// ISR (T-RT0C): serve from cache, revalidate every 5 min.
export const revalidate = 300;

function buildInstruments(): StandardsInstrument[] {
  const eu = europeAiSoftLawBaseline.map((e) => ({
    id: `eu-${e.id}`,
    title: e.title,
    institution: e.institution,
    region: "Europe" as const,
    type: e.authorityType,
    binding: e.bindingStatus,
    access: (e.authorityType === "technical_standard" ? "metadata" : "monitored") as
      | "metadata"
      | "monitored",
    summary: e.summary,
    sourceUrl: e.sourceUrl,
  }));
  const us = usAiSoftLawBaseline.map((e) => ({
    id: `us-${e.id}`,
    title: e.title,
    institution: e.institution,
    region: "United States" as const,
    type: e.authorityType,
    binding: e.bindingStatus,
    access: (e.authorityType === "technical_standard" ? "metadata" : "monitored") as
      | "metadata"
      | "monitored",
    summary: e.summary,
    sourceUrl: e.sourceUrl,
  }));
  return [...eu, ...us].sort((a, b) => a.title.localeCompare(b.title));
}

export default async function StandardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";

  const instruments = buildInstruments();

  const publishedUpdates = await updateRepository.listPublicUpdates();
  const standardsUpdates = publishedUpdates
    .filter((update) =>
      update.tags.some((tag) =>
        [
          "authority:soft-law",
          "authority:technical-standard",
          "authority:governance-framework",
          "authority:best-practice",
        ].includes(tag),
      ),
    )
    .slice(0, 8);
  const relatedResearch = getPublicResearchEntries().filter((entry) =>
    entry.category === "Soft Law & Standards" ||
    entry.tags.some((tag) =>
      ["NIST AI RMF", "ISO/IEC 42001", "OWASP AIMA", "Soft law"].includes(tag),
    ),
  );

  const binding = {
    hint: fr ? "Ailleurs sur le site" : "Elsewhere on the site",
    label: fr ? "Droit contraignant" : "Binding law",
    points: fr
      ? ["Fixé par les législateurs et régulateurs", "Applicable — obligation de conformité", "Fait autorité juridique"]
      : ["Set by legislatures and regulators", "Enforceable — you must comply", "Carries legal authority"],
  };
  const soft = {
    hint: fr ? "Cette page" : "This page",
    label: fr ? "Standards & soft law" : "Standards & soft law",
    points: fr
      ? [
          "Fixé par organismes de normalisation, agences, industrie",
          "Non applicable en soi",
          "Montre ce qu'est une bonne pratique — jusqu'à adoption par une autorité",
        ]
      : [
          "Set by standards bodies, agencies, and industry",
          "Not enforceable on its own",
          "Shows what good looks like — until an authority adopts it",
        ],
  };

  return (
    <SiteShell className="space-y-14">
      {/* Hero */}
      <MotionReveal>
        <SectionHeading
          eyebrow={fr ? "Droit souple · Standards" : "Soft law · Standards"}
          title={fr ? "Standards & soft law" : "Standards & soft law"}
          description={
            fr
              ? "La couche entre le droit contraignant et la simple bonne pratique : ce qui façonne la conformité IA sans être obligatoire — jusqu'à ce qu'une autorité l'adopte."
              : "The layer between binding law and plain best practice: what shapes AI compliance without being mandatory — until an authority adopts it."
          }
        />
      </MotionReveal>

      {/* The distinction — the one thing to understand */}
      <MotionReveal>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.02] p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-400">{binding.hint}</p>
            <p className="mt-2 font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">{binding.label}</p>
            <ul className="mt-4 space-y-2">
              {binding.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-6 text-zinc-500">
                  <span aria-hidden className="mt-2 size-1 flex-shrink-0 rounded-full bg-zinc-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.6rem] border border-[color:var(--color-accent-strong,#c4882a)]/30 bg-[color:var(--color-accent,#9a6b1f)]/[0.08] p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[color:var(--color-accent-strong,#c4882a)]">{soft.hint}</p>
            <p className="mt-2 font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">{soft.label}</p>
            <ul className="mt-4 space-y-2">
              {soft.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-6 text-zinc-600">
                  <span aria-hidden className="mt-2 size-1 flex-shrink-0 rounded-full bg-[color:var(--color-accent-strong,#c4882a)]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MotionReveal>

      {/* What we track — the full, real inventory with search + filters */}
      <section className="space-y-5">
        <MotionReveal>
          <div className="space-y-1">
            <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-950">
              {fr ? "Ce que nous suivons" : "What we track"}
            </h2>
            <p className="text-sm leading-6 text-zinc-500">
              {fr
                ? `${instruments.length} instruments officiels — normes techniques, frameworks de gouvernance et soft law en Europe et aux États-Unis. Recherche et filtres ci-dessous.`
                : `${instruments.length} official instruments — technical standards, governance frameworks, and soft law across Europe and the United States. Search and filter below.`}
            </p>
          </div>
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <StandardsExplorer instruments={instruments} lang={lang} />
        </MotionReveal>
      </section>

      {/* Latest developments — compact ledger */}
      <section className="space-y-4">
        <MotionReveal>
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-950">
                {fr ? "Derniers développements" : "Latest developments"}
              </h2>
              <p className="text-sm leading-6 text-zinc-500">
                {fr
                  ? "Développements vérifiés à la source sur ces standards, à mesure qu'ils sont publiés."
                  : "Source-verified developments about these standards, as they are published."}
              </p>
            </div>
            <Link
              href={localeHref(lang, "/ai-regulation")}
              className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-800 sm:inline"
            >
              {fr ? "Hub Droit de l'IA →" : "AI law hub →"}
            </Link>
          </div>
        </MotionReveal>
        {standardsUpdates.length > 0 ? (
          <MotionStagger className="divide-y divide-white/8 border-y border-white/8">
            {standardsUpdates.map((update) => (
              <MotionStaggerItem key={update.id}>
                <Link
                  href={localeHref(lang, `/ai-regulation/${update.id}`)}
                  className="group flex items-start justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium leading-6 text-zinc-950 transition-colors group-hover:text-white">
                      {update.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-zinc-400">
                      <span className="text-zinc-500">{update.jurisdiction}</span>
                      <span aria-hidden className="text-zinc-300">·</span>
                      <span>{formatDisplayDate(update.publicationDate)}</span>
                      <span aria-hidden className="text-zinc-300">·</span>
                      <span>{update.sourceName}</span>
                    </p>
                  </div>
                  <span aria-hidden className="mt-1 shrink-0 font-mono text-[11px] text-zinc-400 transition-colors group-hover:text-zinc-700">→</span>
                </Link>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        ) : (
          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-zinc-500">
            {fr
              ? "Rien de nouveau à afficher pour l'instant — les développements apparaissent ici une fois vérifiés à la source et publiés."
              : "Nothing new to show yet — developments appear here once source-verified and published."}
          </div>
        )}
      </section>

      {/* Related research */}
      {relatedResearch.length > 0 && (
        <section className="space-y-4">
          <MotionReveal>
            <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-950">
              {fr ? "Notes de recherche liées" : "Related research notes"}
            </h2>
          </MotionReveal>
          <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedResearch.map((entry) => (
              <ResearchCard
                key={entry.slug}
                lang={lang}
                href={`/research/${entry.slug}`}
                category={entry.category}
                title={entry.title}
                description={entry.summary}
                status={entry.status === "published" ? "Published" : "Research note forthcoming"}
                meta={entry.jurisdiction ?? "International / comparative"}
                tags={entry.tags}
              />
            ))}
          </MotionStagger>
        </section>
      )}
    </SiteShell>
  );
}
