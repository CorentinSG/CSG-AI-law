import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { europeAiSoftLawBaseline } from "@/content/ai-regulation/europe-ai-soft-law";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Standards & Soft Law EU | Europe Hub",
  description:
    "Technical standards, governance frameworks, and non-binding instruments applicable to AI in Europe — CENELEC, ISO/IEC, EDPB guidance.",
};

export const revalidate = 3600;

const authorityTypeLabelEn: Record<string, string> = {
  soft_law: "Soft law",
  technical_standard: "Technical standard",
  governance_framework: "Governance framework",
  policy_framework: "Policy framework",
  best_practice: "Best practice",
};
const authorityTypeLabelFr: Record<string, string> = {
  soft_law: "Droit souple",
  technical_standard: "Standard technique",
  governance_framework: "Framework de gouvernance",
  policy_framework: "Framework politique",
  best_practice: "Bonne pratique",
};

const bindingStatusColor: Record<string, string> = {
  non_binding: "bg-zinc-50 text-zinc-500 border-zinc-200",
  binding_if_incorporated: "bg-amber-50 text-amber-700 border-amber-200",
  needs_review: "bg-sky-50 text-sky-700 border-sky-200",
};

const bindingStatusLabelEn: Record<string, string> = {
  non_binding: "Non-binding",
  binding_if_incorporated: "Binding if incorporated",
  needs_review: "Legal effect to be verified",
};
const bindingStatusLabelFr: Record<string, string> = {
  non_binding: "Non contraignant",
  binding_if_incorporated: "Contraignant si incorporé",
  needs_review: "Effet juridique à vérifier",
};

export default async function EuropeStandardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const authorityTypeLabel = fr ? authorityTypeLabelFr : authorityTypeLabelEn;
  const bindingStatusLabel = fr ? bindingStatusLabelFr : bindingStatusLabelEn;

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "Europe", href: "/ai-regulation/europe" },
            { label: "Standards & Soft law", href: "/ai-regulation/europe/standards" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Droit souple · Standards · UE" : "Soft law · Standards · EU"}
          title="Standards & Soft law"
          description={
            fr
              ? `${europeAiSoftLawBaseline.length} instruments — standards techniques, frameworks de gouvernance et orientations officielles non contraignantes. Clairement distingués du droit contraignant.`
              : `${europeAiSoftLawBaseline.length} instruments — technical standards, governance frameworks, and official non-binding guidance. Clearly distinguished from binding law.`
          }
        />
      </MotionReveal>

      <MotionStagger className="grid gap-4 md:grid-cols-2">
        {europeAiSoftLawBaseline.map((entry) => (
          <MotionStaggerItem key={entry.id}>
            <div className="flex h-full flex-col rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_4px_20px_rgba(15,15,15,0.04)]">
              <div className="mb-3 flex flex-wrap items-start gap-2">
                <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-600">
                  {authorityTypeLabel[entry.authorityType] ?? entry.authorityType.replaceAll("_", " ")}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] ${
                    bindingStatusColor[entry.bindingStatus] ?? "bg-zinc-50 text-zinc-500 border-zinc-200"
                  }`}
                >
                  {bindingStatusLabel[entry.bindingStatus] ?? entry.bindingStatus.replaceAll("_", " ")}
                </span>
              </div>

              <p className="font-display text-base font-medium uppercase leading-tight tracking-[-0.02em] text-zinc-950">
                {entry.title}
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                {entry.institution}
                {entry.publicationDate ? ` · ${formatDisplayDate(entry.publicationDate)}` : ""}
              </p>

              <p className="mt-3 flex-1 text-sm leading-7 text-zinc-600">{entry.summary}</p>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-400">{fr ? "Pertinence juridique" : "Legal relevance"}</span>{" "}
                {entry.legalRelevance}
              </p>

              {entry.limitations.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {entry.limitations.map((lim, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-500">
                      <span className="mt-2 size-1 flex-shrink-0 rounded-full bg-zinc-300" />
                      {lim}
                    </li>
                  ))}
                </ul>
              )}

              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-700"
              >
                <ArrowUpRight className="size-3" />
                {fr ? "Source officielle" : "Official source"}
              </a>
            </div>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/europe")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-400 underline decoration-black/15 underline-offset-4 hover:text-zinc-700"
        >
          {fr ? "← Retour au hub Europe" : "← Back to Europe hub"}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
