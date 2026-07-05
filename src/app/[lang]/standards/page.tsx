import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getPublicResearchEntries } from "@/content/research";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { ResearchCard } from "@/components/site/research-card";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Standards & Governance",
  description:
    "Influential soft law, governance frameworks, and technical standards relevant to AI compliance — tracked and clearly distinguished from binding law.",
};

// ISR (T-RT0C): serve from cache, revalidate every 5 min.
export const revalidate = 300;

type Framework = {
  type: string;
  title: string;
  body: string;
  access: string;
};

function getFrameworks(fr: boolean): Framework[] {
  return [
    {
      type: fr ? "Standard technique" : "Technical standard",
      title: "ISO/IEC 42001",
      body: fr
        ? "Système de management de l'IA. Suivi via les métadonnées officielles ISO uniquement — le texte intégral est payant et n'est pas reproduit."
        : "AI management system. Tracked through official ISO metadata only — full text is paywalled and not reproduced.",
      access: fr ? "Métadonnées seules" : "Metadata only",
    },
    {
      type: fr ? "Framework de gouvernance" : "Governance framework",
      title: "NIST AI RMF",
      body: fr
        ? "Framework de référence pour la gestion des risques, l'assurance et les contrôles de cycle de vie. Influent, mais pas contraignant en soi."
        : "Reference framework for risk management, assurance, and lifecycle controls. Influential, but not binding on its own.",
      access: fr ? "Source officielle suivie" : "Official source monitored",
    },
    {
      type: fr ? "Droit souple" : "Soft law",
      title: fr ? "Matériel de politique IA de l'OCDE" : "OECD AI policy materials",
      body: fr
        ? "Politique et gouvernance internationales pouvant orienter les attentes réglementaires nationales, sans être du droit contraignant."
        : "International policy and governance that may shape domestic regulatory expectations, without being binding law.",
      access: fr ? "Source officielle suivie" : "Official source monitored",
    },
    {
      type: fr ? "Bonne pratique" : "Best practice",
      title: "OWASP AIMA",
      body: fr
        ? "Matériel de bonnes pratiques pour la sécurité de l'IA, la maturité de gouvernance et le benchmarking opérationnel."
        : "Best-practice material for AI security, governance maturity, and operational benchmarking.",
      access: fr ? "Source officielle suivie" : "Official source monitored",
    },
  ];
}

export default async function StandardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";

  const publishedUpdates = await updateRepository.listPublicUpdates();
  const relatedResearch = getPublicResearchEntries().filter((entry) =>
    entry.category === "Soft Law & Standards" ||
    entry.tags.some((tag) =>
      ["NIST AI RMF", "ISO/IEC 42001", "OWASP AIMA", "Soft law"].includes(tag),
    ),
  );
  const standardsUpdates = publishedUpdates.filter((update) =>
    update.tags.some((tag) =>
      [
        "authority:soft-law",
        "authority:technical-standard",
        "authority:governance-framework",
        "authority:best-practice",
      ].includes(tag),
    ),
  );

  const frameworks = getFrameworks(fr);
  const principles = fr
    ? [
        "Rien ici n'est du droit contraignant, sauf si une autorité compétente l'incorpore.",
        "On suit la source officielle ; les textes payants ne sont pas reproduits.",
        "Seuls les éléments vérifiés à la source sont publiés.",
      ]
    : [
        "Nothing here is binding law unless a competent authority incorporates it.",
        "We track the official source; paywalled texts are not reproduced.",
        "Only source-verified items are published.",
      ];

  return (
    <SiteShell className="space-y-12">
      {/* Hero — one clear statement, no shouting */}
      <MotionReveal>
        <SectionHeading
          eyebrow={fr ? "Droit souple · Standards · Gouvernance" : "Soft law · Standards · Governance"}
          title={fr ? "Standards & soft law" : "Standards & soft law"}
          description={
            fr
              ? "Frameworks et standards techniques qui façonnent la conformité IA — suivis et clairement distingués du droit contraignant."
              : "Frameworks and technical standards that shape AI compliance — tracked and clearly distinguished from binding law."
          }
        />
      </MotionReveal>

      {/* Principle strip — compact, replaces the big editorial card */}
      <MotionReveal>
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
            {fr ? "La règle" : "The rule"}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {principles.map((p) => (
              <li key={p} className="flex gap-2 text-[13px] leading-6 text-zinc-500">
                <span aria-hidden className="mt-2 size-1 flex-shrink-0 rounded-full bg-[color:var(--color-accent-strong,#c4882a)]" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </MotionReveal>

      {/* Tracked frameworks — flat ledger, grouped by nothing but clearly typed */}
      <section className="space-y-4">
        <MotionReveal>
          <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-950">
            {fr ? "Frameworks & standards suivis" : "Tracked frameworks & standards"}
          </h2>
        </MotionReveal>
        <MotionStagger className="divide-y divide-white/8 border-y border-white/8">
          {frameworks.map((f) => (
            <MotionStaggerItem key={f.title}>
              <div className="grid gap-2 py-4 sm:grid-cols-[0.34fr_0.66fr] sm:gap-6">
                <div>
                  <p className="font-display text-[15px] font-medium tracking-[-0.01em] text-zinc-950">
                    {f.title}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                    {f.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-6 text-zinc-500">{f.body}</p>
                  <span className="mt-2 inline-block rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                    {f.access}
                  </span>
                </div>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      {/* Published updates */}
      <section className="space-y-4">
        <MotionReveal>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-950">
              {fr ? "Éléments publiés" : "Published items"}
            </h2>
            <Link
              href={localeHref(lang, "/ai-regulation")}
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 underline decoration-white/15 underline-offset-4 hover:text-zinc-800"
            >
              {fr ? "Hub Droit de l'IA →" : "AI law hub →"}
            </Link>
          </div>
        </MotionReveal>
        {standardsUpdates.length > 0 ? (
          <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {standardsUpdates.map((update) => (
              <UpdateCard key={update.id} update={update} href={`/ai-regulation/${update.id}`} lang={lang} />
            ))}
          </MotionStagger>
        ) : (
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-zinc-500">
            {fr
              ? "Aucun élément de standards ou soft law publié pour l'instant. La veille est en place ; la visibilité publique dépend de la vérification à la source et de la publication."
              : "No standards or soft-law items published yet. Monitoring is in place; public visibility depends on source verification and publication."}
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
