import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Methodology | AI Law Hub",
  description:
    "How the AI-law monitor works: verification levels, authority classification, source provenance, and the human review posture behind every published item.",
};

export const revalidate = 3600;

type Row = { key: string; term: string; body: string };

const COPY = {
  en: {
    breadcrumbHub: "AI Law Hub",
    breadcrumbMethodology: "Methodology",
    eyebrow: "How we verify · Trust",
    title: "Methodology",
    description:
      "This is a legal-intelligence instrument, not a news feed. Every public item is classified, traced to a source, and reviewed before it can carry legal authority. Here is exactly how.",
    verificationTitle: "Verification levels",
    verificationIntro:
      "Each development is placed at one of three levels. Only the first two ever reach the public legal-authority layer.",
    verification: [
      { key: "official", term: "Official — verified", body: "Sourced from an official authority (regulator, court, legislature) with a traceable URL and date. Publishable." },
      { key: "corroborated", term: "Corroborated", body: "Reported by multiple serious, reputable legal-regulatory sources that agree. Publishable with its source trail." },
      { key: "discovery", term: "Discovery-only", body: "A single, weak, informal, or unverified lead. Stays admin-only until an official source or corroboration is found — it never appears as public legal news." },
    ] as Row[],
    authorityTitle: "Authority classification",
    authorityIntro:
      "Legal weight is never flattened. Each item is labeled so a reader can tell binding law from everything softer at a glance.",
    authority: [
      { key: "binding", term: "Binding law", body: "In force and legally binding (e.g. a regulation, statute, or final rule)." },
      { key: "proposed", term: "Proposed law", body: "Draft or pending legislation not yet in force." },
      { key: "guidance", term: "Agency guidance", body: "Interpretive or advisory material from an authority — persuasive, not binding by itself." },
      { key: "enforcement", term: "Enforcement", body: "Concrete action: a decision, order, settlement, or case." },
      { key: "soft", term: "Soft law", body: "Frameworks, recommendations, and policy instruments without direct binding force." },
      { key: "standards", term: "Standards", body: "Technical norms (ISO/IEC, CEN/CENELEC) — binding only where law incorporates them." },
    ] as Row[],
    checksTitle: "What we check on every item",
    checks: [
      { key: "1", term: "1 · Authority", body: "What kind of legal signal is this — binding, proposed, guidance, enforcement, soft law, or standards?" },
      { key: "2", term: "2 · Source trail", body: "Can the claim be traced to a real source? Every public entry links to institution, official URL, and date." },
      { key: "3", term: "3 · Review posture", body: "Has it been reviewed? Public items are reviewed before publication; discovery leads stay outside the public authority layer." },
      { key: "4", term: "4 · Regional structure", body: "Where does it belong? Europe and United States coverage stay separate, structured by jurisdiction, not by generic AI news." },
    ] as Row[],
    neverTitle: "What we never do",
    never: [
      "Invent publications, dates, or source-backed claims.",
      "Auto-publish weak, informal, or unverified leads.",
      "Present algorithm-generated text as legal analysis.",
    ],
    back: "← Back to the hub",
  },
  fr: {
    breadcrumbHub: "Hub Droit de l'IA",
    breadcrumbMethodology: "Méthodologie",
    eyebrow: "Comment nous vérifions · Confiance",
    title: "Méthodologie",
    description:
      "Ceci est un instrument d'intelligence juridique, pas un fil d'actualité. Chaque élément public est classé, tracé jusqu'à sa source et relu avant de pouvoir porter une autorité juridique. Voici exactement comment.",
    verificationTitle: "Niveaux de vérification",
    verificationIntro:
      "Chaque développement est placé à l'un de trois niveaux. Seuls les deux premiers atteignent la couche d'autorité juridique publique.",
    verification: [
      { key: "official", term: "Officiel — vérifié", body: "Issu d'une autorité officielle (régulateur, juridiction, législateur) avec URL et date traçables. Publiable." },
      { key: "corroborated", term: "Corroboré", body: "Rapporté par plusieurs sources juridiques sérieuses et réputées qui concordent. Publiable avec sa piste de sources." },
      { key: "discovery", term: "Découverte seule", body: "Un signal unique, faible, informel ou non vérifié. Reste réservé à l'admin jusqu'à une source officielle ou une corroboration — n'apparaît jamais en actualité juridique publique." },
    ] as Row[],
    authorityTitle: "Classification d'autorité",
    authorityIntro:
      "Le poids juridique n'est jamais aplati. Chaque élément est étiqueté pour distinguer d'un coup d'œil le droit contraignant de tout ce qui l'est moins.",
    authority: [
      { key: "binding", term: "Droit contraignant", body: "En vigueur et juridiquement contraignant (règlement, loi, règle finale)." },
      { key: "proposed", term: "Droit proposé", body: "Projet ou proposition législative pas encore en vigueur." },
      { key: "guidance", term: "Guidance d'agence", body: "Matériel interprétatif ou consultatif d'une autorité — persuasif, non contraignant en soi." },
      { key: "enforcement", term: "Enforcement", body: "Action concrète : décision, ordonnance, transaction ou affaire." },
      { key: "soft", term: "Droit souple", body: "Frameworks, recommandations et instruments de politique sans force contraignante directe." },
      { key: "standards", term: "Standards", body: "Normes techniques (ISO/IEC, CEN/CENELEC) — contraignantes seulement si le droit les incorpore." },
    ] as Row[],
    checksTitle: "Ce que nous vérifions sur chaque élément",
    checks: [
      { key: "1", term: "1 · Autorité", body: "Quel type de signal juridique : contraignant, proposé, guidance, enforcement, droit souple ou standards ?" },
      { key: "2", term: "2 · Piste de sources", body: "Le fait est-il traçable jusqu'à une source réelle ? Chaque entrée publique renvoie à l'institution, l'URL officielle et la date." },
      { key: "3", term: "3 · Posture de revue", body: "A-t-il été relu ? Les éléments publics sont relus avant publication ; les signaux de découverte restent hors de la couche d'autorité publique." },
      { key: "4", term: "4 · Structure régionale", body: "Où se place-t-il ? Europe et États-Unis restent séparés, structurés par juridiction, pas par actualité IA générique." },
    ] as Row[],
    neverTitle: "Ce que nous ne faisons jamais",
    never: [
      "Inventer des publications, des dates ou des affirmations prétendument sourcées.",
      "Publier automatiquement des signaux faibles, informels ou non vérifiés.",
      "Présenter un texte généré par algorithme comme une analyse juridique.",
    ],
    back: "← Retour au hub",
  },
} as const;

function Ledger({ rows }: { rows: readonly Row[] }) {
  return (
    <MotionStagger className="divide-y divide-white/8 border-y border-white/8">
      {rows.map((row) => (
        <MotionStaggerItem key={row.key}>
          <div className="grid gap-1 py-4 sm:grid-cols-[0.32fr_0.68fr] sm:gap-6">
            <p className="font-display text-[15px] font-medium tracking-[-0.01em] text-white/90">
              {row.term}
            </p>
            <p className="text-sm leading-6 text-white/60">{row.body}</p>
          </div>
        </MotionStaggerItem>
      ))}
    </MotionStagger>
  );
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = COPY[lang];

  return (
    <SiteShell className="space-y-14">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: t.breadcrumbHub, href: "/ai-regulation" },
            { label: t.breadcrumbMethodology, href: "/ai-regulation/methodology" },
          ]}
        />
        <SectionHeading eyebrow={t.eyebrow} title={t.title} description={t.description} />
      </MotionReveal>

      <section className="space-y-4">
        <MotionReveal>
          <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-white/90">
            {t.verificationTitle}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/55">{t.verificationIntro}</p>
        </MotionReveal>
        <Ledger rows={t.verification} />
      </section>

      <section className="space-y-4">
        <MotionReveal>
          <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-white/90">
            {t.authorityTitle}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/55">{t.authorityIntro}</p>
        </MotionReveal>
        <Ledger rows={t.authority} />
      </section>

      <section className="space-y-4">
        <MotionReveal>
          <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-white/90">
            {t.checksTitle}
          </h2>
        </MotionReveal>
        <Ledger rows={t.checks} />
      </section>

      <section className="space-y-4">
        <MotionReveal>
          <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-white/90">
            {t.neverTitle}
          </h2>
        </MotionReveal>
        <MotionStagger className="space-y-2.5">
          {t.never.map((line) => (
            <MotionStaggerItem key={line}>
              <p className="flex gap-3 text-sm leading-6 text-white/60">
                <span aria-hidden className="mt-2 size-1 flex-shrink-0 rounded-full bg-[color:var(--color-accent-strong,#c4882a)]" />
                {line}
              </p>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/80"
        >
          {t.back}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
