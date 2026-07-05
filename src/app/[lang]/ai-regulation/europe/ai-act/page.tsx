import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  europeAiActBaseline,
} from "@/content/ai-regulation/europe-ai-legal-baseline";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "EU AI Act | Europe Hub",
  description:
    "EU AI Act — Regulation (EU) 2024/1689. Risk classification, prohibited practices, GPAI provisions, and phased application calendar.",
};

export const revalidate = 3600;

const COPY: Record<Locale, {
  breadcrumbHub: string;
  breadcrumbEurope: string;
  breadcrumbAct: string;
  eyebrow: string;
  facts: { celex: string; adopted: string; inForce: string; status: string };
  officialText: string;
  sections: {
    id: string;
    label: string;
    field:
      | "riskBasedStructure"
      | "prohibitedPractices"
      | "highRiskSystems"
      | "transparencyObligations"
      | "gpaiModelObligations"
      | "governanceAndEnforcement"
      | "memberStateResponsibilities"
      | "penaltiesAndEnforcementFramework";
  }[];
  applicationCalendar: string;
  keyArticles: string;
  backToHub: string;
}> = {
  en: {
    breadcrumbHub: "AI Law Hub",
    breadcrumbEurope: "Europe",
    breadcrumbAct: "EU AI Act",
    eyebrow: "Binding law · EU",
    facts: { celex: "CELEX", adopted: "Adopted", inForce: "In force", status: "Status" },
    officialText: "Official text (EUR-Lex)",
    sections: [
      { id: "risk", label: "Risk-based structure", field: "riskBasedStructure" },
      { id: "prohibited", label: "Prohibited practices", field: "prohibitedPractices" },
      { id: "high-risk", label: "High-risk systems", field: "highRiskSystems" },
      { id: "transparency", label: "Transparency obligations", field: "transparencyObligations" },
      { id: "gpai", label: "GPAI model obligations", field: "gpaiModelObligations" },
      { id: "governance", label: "Governance & enforcement", field: "governanceAndEnforcement" },
      { id: "member-states", label: "Member State responsibilities", field: "memberStateResponsibilities" },
      { id: "penalties", label: "Penalties", field: "penaltiesAndEnforcementFramework" },
    ],
    applicationCalendar: "Phased application calendar",
    keyArticles: "Key articles and annexes",
    backToHub: "← Back to Europe hub",
  },
  fr: {
    breadcrumbHub: "Hub Droit de l'IA",
    breadcrumbEurope: "Europe",
    breadcrumbAct: "Règlement IA",
    eyebrow: "Droit contraignant · UE",
    facts: { celex: "CELEX", adopted: "Adopté", inForce: "En vigueur", status: "Statut" },
    officialText: "Texte officiel EUR-Lex",
    sections: [
      { id: "risk", label: "Catégories de risque", field: "riskBasedStructure" },
      { id: "prohibited", label: "Pratiques interdites", field: "prohibitedPractices" },
      { id: "high-risk", label: "Systèmes à haut risque", field: "highRiskSystems" },
      { id: "transparency", label: "Obligations de transparence", field: "transparencyObligations" },
      { id: "gpai", label: "Modèles GPAI", field: "gpaiModelObligations" },
      { id: "governance", label: "Gouvernance & enforcement", field: "governanceAndEnforcement" },
      { id: "member-states", label: "Responsabilités nationales", field: "memberStateResponsibilities" },
      { id: "penalties", label: "Sanctions", field: "penaltiesAndEnforcementFramework" },
    ],
    applicationCalendar: "Calendrier d'application",
    keyArticles: "Articles et annexes clés",
    backToHub: "← Retour au hub Europe",
  },
};

export default async function EuAiActPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const act = europeAiActBaseline;
  const t = COPY[lang];

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: t.breadcrumbHub, href: "/ai-regulation" },
            { label: t.breadcrumbEurope, href: "/ai-regulation/europe" },
            { label: t.breadcrumbAct, href: "/ai-regulation/europe/ai-act" },
          ]}
        />
        <SectionHeading
          eyebrow={t.eyebrow}
          title={act.shortTitle}
          description={act.scope}
        />

        {/* Key facts */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t.facts.celex, value: act.celexNumber ?? "—" },
            { label: t.facts.adopted, value: formatDisplayDate(act.dateAdopted) },
            { label: t.facts.inForce, value: formatDisplayDate(act.dateEnteredIntoForce) },
            { label: t.facts.status, value: act.bindingStatusLabel.replaceAll("_", " ") },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.6rem] border border-black/6 bg-white p-4 shadow-[0_4px_20px_rgba(15,15,15,0.04)]"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
                {item.label}
              </p>
              <p className="mt-1.5 font-display text-base font-medium uppercase tracking-[-0.02em] text-zinc-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <a
          href={act.eurLexUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-500 underline decoration-black/15 underline-offset-4 hover:text-zinc-900"
        >
          <ArrowUpRight className="size-3" />
          {t.officialText} — {act.ojPublicationInfo}
        </a>
      </MotionReveal>

      {/* Section cards */}
      <MotionStagger className="grid gap-4 md:grid-cols-2">
        {t.sections.map((card) => (
          <MotionStaggerItem key={card.id}>
            <Card
              id={card.id}
              className="scroll-mt-28 rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
            >
              <CardHeader>
                <CardTitle className="font-display text-lg font-medium uppercase tracking-[-0.03em]">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-zinc-700">{act[card.field]}</p>
              </CardContent>
            </Card>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      {/* Application calendar — dedicated sub-page */}
      <MotionReveal>
        <Link
          id="timeline"
          href={localeHref(lang, "/ai-regulation/europe/ai-act/calendar")}
          className="group flex scroll-mt-28 items-center justify-between gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]"
        >
          <div>
            <p className="font-display text-lg font-medium tracking-[-0.02em] text-zinc-950">
              {t.applicationCalendar}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {lang === "fr"
                ? `${act.phasedApplicationDates.length} échéances officielles, avec leur effet juridique, et les articles clés.`
                : `${act.phasedApplicationDates.length} official deadlines with their legal effect, plus key articles.`}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:text-zinc-700">
            {lang === "fr" ? "Ouvrir →" : "Open →"}
          </span>
        </Link>
      </MotionReveal>

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/europe")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-400 underline decoration-black/15 underline-offset-4 hover:text-zinc-700"
        >
          {t.backToHub}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
