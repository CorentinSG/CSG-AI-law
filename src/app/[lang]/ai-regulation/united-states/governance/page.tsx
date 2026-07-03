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
  usAiCaseLawEntries,
  usAiCaseLawSources,
} from "@/content/ai-regulation/us-ai-case-law";
import { usAiSoftLawBaseline } from "@/content/ai-regulation/us-ai-soft-law";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "US Governance | United States Hub",
  description:
    "Institutional AI governance actors in the United States — FTC, EEOC, CFPB, case law, and federal soft law.",
};

export const revalidate = 3600;

export default async function UsGovernancePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const publishedCases = usAiCaseLawEntries.filter((e) => e.status === "published");

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "United States", href: "/ai-regulation/united-states" },
            { label: fr ? "Gouvernance" : "Governance", href: "/ai-regulation/united-states/governance" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Acteurs & supervision · États-Unis" : "Actors & oversight · United States"}
          title={fr ? "Gouvernance" : "Governance"}
          description={
            fr
              ? "Agences fédérales de supervision, jurisprudence et instruments de soft law américain — qui supervise quoi, et avec quelle autorité."
              : "Federal oversight agencies, case law, and U.S. soft law instruments — who oversees what, and with what authority."
          }
        />
      </MotionReveal>

      {/* Soft law instruments */}
      {usAiSoftLawBaseline.length > 0 && (
        <section className="space-y-4">
          <MotionReveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Soft law & frameworks fédéraux" : "Soft law & federal frameworks"}
            </p>
          </MotionReveal>
          <MotionStagger className="grid gap-4 md:grid-cols-2">
            {usAiSoftLawBaseline.map((entry) => (
              <MotionStaggerItem key={entry.id}>
                <Card className="h-full rounded-[1.8rem] border-black/6 bg-white shadow-[0_4px_20px_rgba(15,15,15,0.04)]">
                  <CardHeader>
                    <div className="flex flex-wrap items-start gap-2">
                      <CardTitle className="font-display text-base font-medium uppercase tracking-[-0.02em]">
                        {entry.title}
                      </CardTitle>
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] ${
                        entry.bindingStatus === "non_binding"
                          ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}>
                        {entry.bindingStatus.replaceAll("_", " ")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                      {entry.institution}
                      {entry.publicationDate ? ` · ${formatDisplayDate(entry.publicationDate)}` : ""}
                    </p>
                    <p className="text-sm leading-7 text-zinc-600">{entry.summary}</p>
                    <p className="text-sm text-zinc-500">{entry.legalRelevance}</p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-700"
                    >
                      <ArrowUpRight className="size-2.5" />
                      {fr ? "Source officielle" : "Official source"}
                    </a>
                  </CardContent>
                </Card>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </section>
      )}

      {/* Case law */}
      {publishedCases.length > 0 && (
        <section className="space-y-4">
          <MotionReveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Jurisprudence & décisions d’application" : "Case law & enforcement decisions"}
            </p>
          </MotionReveal>
          <MotionStagger className="space-y-3">
            {publishedCases.map((entry) => (
              <MotionStaggerItem key={entry.id}>
                <div className="rounded-[1.6rem] border border-black/6 bg-white p-5 shadow-[0_4px_20px_rgba(15,15,15,0.04)]">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-600">
                      {entry.authorityType.replaceAll("_", " ")}
                    </span>
                    {entry.docketNumber && (
                      <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-600">
                        {entry.docketNumber}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-medium text-zinc-950">{entry.caseName}</p>
                  <p className="mt-1.5 text-sm leading-7 text-zinc-600">{entry.holdingOrOutcome ?? entry.legalSignificance}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                      {entry.court}
                      {entry.date ? ` · ${formatDisplayDate(entry.date)}` : ""}
                    </p>
                    {entry.officialSourceUrl && (
                      <a
                        href={entry.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-sky-600 hover:text-sky-800"
                      >
                        <ArrowUpRight className="size-2.5" />
                        {fr ? "Source officielle" : "Official source"}
                      </a>
                    )}
                  </div>
                </div>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </section>
      )}

      {/* Case law sources */}
      {usAiCaseLawSources.length > 0 && (
        <section className="space-y-4">
          <MotionReveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Sources de jurisprudence surveillées" : "Monitored case law sources"}
            </p>
          </MotionReveal>
          <MotionStagger className="grid gap-3 md:grid-cols-2">
            {usAiCaseLawSources.map((src) => (
              <MotionStaggerItem key={src.id}>
                <div className="rounded-[1.6rem] border border-black/6 bg-zinc-50/60 p-4">
                  <p className="font-medium text-zinc-950">{src.name}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                    {src.institution} · {src.jurisdiction}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{src.note}</p>
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] text-zinc-400 hover:text-zinc-700"
                  >
                    <ArrowUpRight className="size-2.5" />
                    {src.sourceUrl}
                  </a>
                </div>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </section>
      )}

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
