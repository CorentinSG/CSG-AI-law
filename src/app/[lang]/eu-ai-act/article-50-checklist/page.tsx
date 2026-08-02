import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

import { Article50Checklist } from "@/components/site/article-50-checklist";
import {
  Article50Scenarios,
  Article50Triage,
} from "@/components/site/article-50-scenarios";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { article50Sources } from "@/content/ai-regulation/article-50-checklist";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: isLocale(lang)
      ? localeAlternates(lang, "/eu-ai-act/article-50-checklist")
      : undefined,
    title: "Article 50 compliance checklist | EU AI Act",
    description:
      "Interactive checklist for the EU AI Act transparency obligations under Article 50, applicable from 2 August 2026. Controls by role for providers, deployers, legal, product, editorial, and procurement teams.",
  };
}

export const revalidate = 3600;

const COPY: Record<
  Locale,
  {
    breadcrumbHub: string;
    breadcrumbEurope: string;
    breadcrumbAct: string;
    breadcrumbChecklist: string;
    eyebrow: string;
    title: string;
    description: string;
    howTo: string;
    howToBody: string[];
    bannerTitle: string;
    bannerBody: string;
    triageTitle: string;
    triageEyebrow: string;
    scenariosTitle: string;
    scenariosEyebrow: string;
    scenariosIntro: string;
    checklistTitle: string;
    checklistEyebrow: string;
    sources: string;
    disclaimer: string;
    back: string;
  }
> = {
  en: {
    breadcrumbHub: "AI Law Hub",
    breadcrumbEurope: "Europe",
    breadcrumbAct: "EU AI Act",
    breadcrumbChecklist: "Article 50 checklist",
    eyebrow: "Binding law · EU · Applies 2 August 2026",
    title: "Article 50 compliance checklist",
    description:
      "Article 50 creates transparency duties for providers and deployers of certain AI systems. Work through the controls below by role, mark what is done, and keep the evidence each control produces.",
    howTo: "How to use this checklist",
    howToBody: [
      "Start with the legal and compliance controls: the first question is not “do we use AI?” but which business units are providers, which are deployers, and which outputs reach people directly. A single company is often both.",
      "Filter by role to give each team its own working list. Your progress is saved in this browser only — nothing is transmitted or stored on a server.",
      "Article 50 does not replace the GDPR. For emotion recognition and biometric categorisation, a notice is necessary but not sufficient: a lawful basis, and possibly a DPIA, are still required.",
    ],
    bannerTitle: "Indicative guidance only — not legal advice",
    bannerBody:
      "This tool summarises official EU materials for information purposes. It does not constitute legal advice, completing it does not establish compliance, and borderline situations turn on specific facts. Have counsel review your own circumstances.",
    triageEyebrow: "Step 1 · Situation triage",
    triageTitle: "Which obligations apply to you?",
    checklistEyebrow: "Step 2 · Controls",
    checklistTitle: "Work through the controls",
    scenariosEyebrow: "Step 3 · Edge cases",
    scenariosTitle: "Scenario library",
    scenariosIntro:
      "Twenty concrete situations — including the edge cases that trip teams up: legacy systems, employees, non-EU entities, artistic works, internal-only text, law-enforcement uses. Each card states what applies and the common traps.",
    sources: "Primary sources",
    disclaimer:
      "This checklist is provided for informational purposes only and does not constitute legal advice, nor does it create a lawyer-client relationship. It reflects the Commission guidance and official materials available at the time of writing, and simplifies questions that may turn on specific facts. Verify against the primary sources below and take advice on your own circumstances.",
    back: "← Back to the EU AI Act",
  },
  fr: {
    breadcrumbHub: "Hub Droit de l'IA",
    breadcrumbEurope: "Europe",
    breadcrumbAct: "Règlement IA",
    breadcrumbChecklist: "Checklist article 50",
    eyebrow: "Droit contraignant · UE · Applicable le 2 août 2026",
    title: "Checklist de conformité — article 50",
    description:
      "L'article 50 crée des obligations de transparence pour les fournisseurs et les déployeurs de certains systèmes d'IA. Parcourez les contrôles ci-dessous par rôle, cochez ce qui est fait, et conservez les preuves produites par chaque contrôle.",
    howTo: "Comment utiliser cette checklist",
    howToBody: [
      "Commencez par les contrôles juridiques : la première question n'est pas « utilisons-nous de l'IA ? » mais quelles entités sont fournisseurs, lesquelles sont déployeurs, et quels résultats atteignent directement des personnes. Une même société est souvent les deux.",
      "Filtrez par rôle pour donner à chaque équipe sa propre liste de travail. Votre progression est enregistrée dans ce navigateur uniquement — rien n'est transmis ni stocké sur un serveur.",
      "L'article 50 ne remplace pas le RGPD. Pour la reconnaissance des émotions et la catégorisation biométrique, l'information est nécessaire mais pas suffisante : une base légale, et le cas échéant une AIPD, restent requises.",
    ],
    bannerTitle: "Outil purement indicatif — pas un conseil juridique",
    bannerBody:
      "Cet outil synthétise des documents officiels de l'UE à des fins d'information. Il ne constitue pas un conseil juridique, le compléter n'établit pas votre conformité, et les situations limites dépendent des faits propres à chaque cas. Faites examiner votre situation par un avocat.",
    triageEyebrow: "Étape 1 · Triage par situation",
    triageTitle: "Quelles obligations s'appliquent à vous ?",
    checklistEyebrow: "Étape 2 · Contrôles",
    checklistTitle: "Déroulez les contrôles",
    scenariosEyebrow: "Étape 3 · Cas limites",
    scenariosTitle: "Bibliothèque de scénarios",
    scenariosIntro:
      "Vingt situations concrètes — y compris les cas limites qui piègent les équipes : systèmes existants, salariés, entités hors UE, œuvres artistiques, textes internes, usages répressifs. Chaque fiche indique ce qui s'applique et les pièges fréquents.",
    sources: "Sources primaires",
    disclaimer:
      "Cette checklist est fournie à titre informatif uniquement. Elle ne constitue pas un conseil juridique et ne crée aucune relation avocat-client. Elle reflète les orientations de la Commission et les documents officiels disponibles à la date de rédaction, et simplifie des questions qui peuvent dépendre de circonstances particulières. Vérifiez auprès des sources primaires ci-dessous et faites analyser votre situation.",
    back: "← Retour au règlement IA",
  },
};

export default async function Article50ChecklistPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = COPY[lang];

  return (
    <SiteShell className="space-y-10">
      <MotionReveal className="space-y-6">
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: t.breadcrumbHub, href: "/ai-regulation" },
            { label: t.breadcrumbEurope, href: "/ai-regulation/europe" },
            { label: t.breadcrumbAct, href: "/ai-regulation/europe/ai-act" },
            {
              label: t.breadcrumbChecklist,
              href: "/eu-ai-act/article-50-checklist",
            },
          ]}
        />
        <SectionHeading
          as="h1"
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
        />

        {/* Prominent indicative-use notice — this is not legal advice. */}
        <div
          role="note"
          className="flex items-start gap-3 rounded-[1.8rem] border border-amber-400/30 bg-amber-400/[0.05] p-5"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-display text-sm font-medium tracking-[-0.01em] text-zinc-950">
              {t.bannerTitle}
            </p>
            <p className="mt-1 max-w-4xl text-[13px] leading-6 text-zinc-600 hyphens-auto text-justify">
              {t.bannerBody}
            </p>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-black/6 bg-zinc-50 p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
            {t.howTo}
          </p>
          <div className="mt-3 space-y-3">
            {t.howToBody.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-4xl text-sm leading-7 text-zinc-700 hyphens-auto text-justify"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </MotionReveal>

      {/* Step 1 — situation triage */}
      <MotionReveal className="space-y-5 border-t border-black/6 pt-8">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
            {t.triageEyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-medium tracking-[-0.02em] text-zinc-950">
            {t.triageTitle}
          </h2>
        </div>
        <Article50Triage lang={lang} />
      </MotionReveal>

      {/* Step 2 — the controls themselves */}
      <div className="space-y-5 border-t border-black/6 pt-8">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
            {t.checklistEyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-medium tracking-[-0.02em] text-zinc-950">
            {t.checklistTitle}
          </h2>
        </div>
        <Article50Checklist lang={lang} />
      </div>

      {/* Step 3 — scenario library */}
      <MotionReveal className="space-y-5 border-t border-black/6 pt-8">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
            {t.scenariosEyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-medium tracking-[-0.02em] text-zinc-950">
            {t.scenariosTitle}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-500 hyphens-auto text-justify">
            {t.scenariosIntro}
          </p>
        </div>
        <Article50Scenarios lang={lang} />
      </MotionReveal>

      {/* Primary sources */}
      <MotionReveal className="space-y-4 border-t border-black/6 pt-8">
        <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">
          {t.sources}
        </h2>
        <ul className="space-y-3">
          {article50Sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-1.5 text-sm leading-6 text-zinc-900 underline decoration-black/15 underline-offset-4 hover:decoration-black/40"
              >
                <ArrowUpRight className="mt-1 size-3 shrink-0" />
                {source.label}
              </a>
              <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
                {source.note}
              </p>
            </li>
          ))}
        </ul>
      </MotionReveal>

      <MotionReveal>
        <p className="max-w-4xl text-[11px] leading-5 text-zinc-500 hyphens-auto text-justify">
          {t.disclaimer}
        </p>
      </MotionReveal>

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/europe/ai-act")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-400 underline decoration-black/15 underline-offset-4 hover:text-zinc-700"
        >
          {t.back}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
