import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import {
  usFederalBaselineEntries,
} from "@/content/ai-regulation/us-ai-legal-baseline";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Federal | United States Hub",
  description:
    "U.S. federal AI law — EO 14110, OMB Policy, NIST AI RMF, agency actions, and pending Congressional legislation.",
};

export const revalidate = 3600;

const bindingColor: Record<string, string> = {
  binding: "bg-emerald-50 text-emerald-700 border-emerald-200",
  non_binding: "bg-zinc-50 text-zinc-500 border-zinc-200",
  needs_review: "bg-amber-50 text-amber-700 border-amber-200",
};

const bindingLabelEn: Record<string, string> = {
  binding: "Binding",
  non_binding: "Non-binding",
  needs_review: "Status to be verified",
};
const bindingLabelFr: Record<string, string> = {
  binding: "Contraignant",
  non_binding: "Non contraignant",
  needs_review: "Statut à vérifier",
};

const authorityTypeLabelEn: Record<string, string> = {
  federal_hard_law: "Federal hard law",
  federal_legislative_activity: "Legislative activity",
  federal_agency_guidance: "Agency guidance",
  federal_agency_enforcement: "Agency enforcement",
  federal_rulemaking: "Rulemaking",
  soft_law: "Soft law",
  technical_standard: "Technical standard",
  case_law_source: "Case law source",
};
const authorityTypeLabelFr: Record<string, string> = {
  federal_hard_law: "Droit fédéral",
  federal_legislative_activity: "Activité législative",
  federal_agency_guidance: "Guidance d'agence",
  federal_agency_enforcement: "Enforcement d'agence",
  federal_rulemaking: "Règlementation",
  soft_law: "Droit souple",
  technical_standard: "Standard technique",
  case_law_source: "Source jurisprudentielle",
};

export default async function UsFederalPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const bindingLabel = fr ? bindingLabelFr : bindingLabelEn;
  const authorityTypeLabel = fr ? authorityTypeLabelFr : authorityTypeLabelEn;

  // Chunk the long flat list into sections by legal weight so the page scans
  // as a structured reference instead of a wall of instruments.
  const GROUP_DEFS: { key: string; label: string; types: string[] }[] = [
    { key: "binding", label: fr ? "Droit contraignant" : "Binding law", types: ["federal_hard_law"] },
    {
      key: "agency",
      label: fr ? "Guidance & règlementation d'agence" : "Agency guidance & rulemaking",
      types: ["federal_agency_guidance", "federal_agency_enforcement", "federal_rulemaking"],
    },
    { key: "legislative", label: fr ? "Activité législative" : "Legislative activity", types: ["federal_legislative_activity"] },
    {
      key: "soft",
      label: fr ? "Droit souple & standards" : "Soft law & standards",
      types: ["soft_law", "technical_standard", "case_law_source"],
    },
  ];
  const covered = new Set(GROUP_DEFS.flatMap((g) => g.types));
  const groups = [
    ...GROUP_DEFS.map((g) => ({
      ...g,
      entries: usFederalBaselineEntries.filter((e) => g.types.includes(e.authorityType)),
    })),
    {
      key: "other",
      label: fr ? "Autres instruments" : "Other instruments",
      types: [],
      entries: usFederalBaselineEntries.filter((e) => !covered.has(e.authorityType)),
    },
  ].filter((g) => g.entries.length > 0);

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "United States", href: "/ai-regulation/united-states" },
            { label: "Federal", href: "/ai-regulation/united-states/federal" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Droit fédéral · États-Unis" : "Federal law · United States"}
          title="Federal"
          description={
            fr
              ? `${usFederalBaselineEntries.length} instruments fédéraux vérifiés — droit contraignant, guidance d'agence, et activité législative.`
              : `${usFederalBaselineEntries.length} verified federal instruments — binding law, agency guidance, and legislative activity.`
          }
        />
      </MotionReveal>

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-500">
              {group.label}
            </h2>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">
              {group.entries.length}
            </span>
          </div>
          <MotionStagger className="space-y-4">
            {group.entries.map((entry) => (
              <MotionStaggerItem key={entry.id}>
            <div
              id={entry.id}
              className="scroll-mt-28 rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_4px_20px_rgba(15,15,15,0.04)]"
            >
              <div className="mb-3 flex flex-wrap items-start gap-2">
                <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-600">
                  {authorityTypeLabel[entry.authorityType] ?? entry.authorityType.replaceAll("_", " ")}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] ${
                    bindingColor[entry.bindingStatus] ?? "bg-zinc-50 text-zinc-500 border-zinc-200"
                  }`}
                >
                  {bindingLabel[entry.bindingStatus] ?? entry.bindingStatus.replaceAll("_", " ")}
                </span>
              </div>

              <p className="font-display text-xl font-medium uppercase leading-tight tracking-[-0.03em] text-zinc-950">
                {entry.shortTitle}
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                {entry.sourceInstitution}
                {entry.publicationDate ? ` · ${formatDisplayDate(entry.publicationDate)}` : ""}
                {entry.effectiveDate
                  ? ` · ${fr ? "En vigueur" : "Effective"} ${formatDisplayDate(entry.effectiveDate)}`
                  : ""}
              </p>

              <p className="mt-3 text-sm leading-7 text-zinc-700">{entry.summary}</p>

              {entry.keyObligations.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 font-mono text-[8.5px] uppercase tracking-[0.2em] text-zinc-400">
                    {fr ? "Obligations clés" : "Key obligations"}
                  </p>
                  <ul className="space-y-1.5">
                    {entry.keyObligations.map((ob, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                        <span className="mt-2 size-1 flex-shrink-0 rounded-full bg-zinc-300" />
                        {ob}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.enforcementRelevance && (
                <p className="mt-3 border-t border-black/5 pt-3 text-sm leading-6 text-zinc-500">
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-400">
                    {fr ? "Pertinence enforcement" : "Enforcement relevance"}
                  </span>{" "}
                  {entry.enforcementRelevance}
                </p>
              )}

              <a
                href={entry.officialSourceUrl}
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
        </section>
      ))}

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/united-states")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-400 underline decoration-black/15 underline-offset-4 hover:text-zinc-700"
        >
          {fr ? "← Retour au hub United States" : "← Back to United States hub"}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
