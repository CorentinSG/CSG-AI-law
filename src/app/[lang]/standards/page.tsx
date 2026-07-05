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
  title: "Standards & Soft Law",
  description:
    "The layer between binding law and best practice: technical standards, governance frameworks, and soft law that shape AI compliance — sorted by type and clearly distinguished from binding law.",
};

// ISR (T-RT0C): serve from cache, revalidate every 5 min.
export const revalidate = 300;

type Kind = {
  name: string;
  status: string;
  whatItIs: string;
  tracks: string;
  note: string;
  access: string;
};

function getContent(fr: boolean) {
  const kinds: Kind[] = [
    {
      name: fr ? "Standard technique" : "Technical standard",
      status: fr ? "Volontaire — sauf si la loi l'impose" : "Voluntary — unless law requires it",
      whatItIs: fr
        ? "Spécifications formelles pour construire et gérer des systèmes d'IA."
        : "Formal specifications for building and managing AI systems.",
      tracks: "ISO/IEC 42001",
      note: fr
        ? "Système de management de l'IA. Suivi via les métadonnées officielles ISO."
        : "AI management system. Tracked through official ISO metadata.",
      access: fr ? "Métadonnées seules" : "Metadata only",
    },
    {
      name: fr ? "Framework de gouvernance" : "Governance framework",
      status: fr ? "Indicatif" : "Advisory",
      whatItIs: fr
        ? "Approche structurée de gestion des risques et d'assurance, publiée par une autorité."
        : "A structured risk-management and assurance approach published by an authority.",
      tracks: "NIST AI RMF",
      note: fr
        ? "Gestion des risques, assurance et contrôles de cycle de vie."
        : "Risk management, assurance, and lifecycle controls.",
      access: fr ? "Source officielle suivie" : "Official source monitored",
    },
    {
      name: fr ? "Droit souple" : "Soft law",
      status: fr ? "Politique non contraignante" : "Non-binding policy",
      whatItIs: fr
        ? "Politique internationale qui oriente les attentes des régulateurs."
        : "International policy that shapes what regulators come to expect.",
      tracks: fr ? "Matériel IA de l'OCDE" : "OECD AI materials",
      note: fr
        ? "Peut influencer les attentes réglementaires nationales sans être contraignant."
        : "May shape domestic regulatory expectations without being binding.",
      access: fr ? "Source officielle suivie" : "Official source monitored",
    },
    {
      name: fr ? "Bonne pratique" : "Best practice",
      status: fr ? "Guidance informelle" : "Informal guidance",
      whatItIs: fr
        ? "Guidance de la communauté et de l'industrie pour la sécurité et la maturité."
        : "Community and industry guidance for security and maturity.",
      tracks: "OWASP AIMA",
      note: fr
        ? "Sécurité de l'IA, maturité de gouvernance et benchmarking opérationnel."
        : "AI security, governance maturity, and operational benchmarking.",
      access: fr ? "Source officielle suivie" : "Official source monitored",
    },
  ];

  const binding = {
    label: fr ? "Droit contraignant" : "Binding law",
    hint: fr ? "Ailleurs sur le site" : "Elsewhere on the site",
    points: fr
      ? ["Fixé par les législateurs et régulateurs", "Applicable — obligation de conformité", "Fait autorité juridique"]
      : ["Set by legislatures and regulators", "Enforceable — you must comply", "Carries legal authority"],
  };
  const soft = {
    label: fr ? "Standards & soft law" : "Standards & soft law",
    hint: fr ? "Cette page" : "This page",
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

  return { kinds, binding, soft };
}

export default async function StandardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const { kinds, binding, soft } = getContent(fr);

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
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-400">
              {binding.hint}
            </p>
            <p className="mt-2 font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">
              {binding.label}
            </p>
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
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[color:var(--color-accent-strong,#c4882a)]">
              {soft.hint}
            </p>
            <p className="mt-2 font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">
              {soft.label}
            </p>
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

      {/* The four kinds — sorted reference */}
      <section className="space-y-4">
        <MotionReveal>
          <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-950">
            {fr ? "Les quatre types, et ce que nous suivons" : "The four kinds, and what we track"}
          </h2>
        </MotionReveal>
        <MotionStagger className="divide-y divide-white/8 border-y border-white/8">
          {kinds.map((k, i) => (
            <MotionStaggerItem key={k.name}>
              <div className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-[17px] font-medium tracking-[-0.02em] text-zinc-950">
                    <span className="mr-2 font-mono text-[11px] text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                    {k.name}
                  </p>
                  <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    {k.status}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{k.whatItIs}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                    {fr ? "Nous suivons" : "We track"}
                  </span>
                  <span className="font-medium text-zinc-950">{k.tracks}</span>
                  <span aria-hidden className="text-zinc-300">·</span>
                  <span className="text-zinc-500">{k.note}</span>
                  <span className="rounded-full border border-black/8 bg-zinc-50 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-zinc-500">
                    {k.access}
                  </span>
                </div>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      {/* Published items */}
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
              ? "Aucun élément publié pour l'instant. La veille est en place ; la visibilité publique dépend de la vérification à la source et de la publication."
              : "No items published yet. Monitoring is in place; public visibility depends on source verification and publication."}
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
