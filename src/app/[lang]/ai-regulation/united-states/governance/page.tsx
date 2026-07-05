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

      {/* Case law — dedicated sub-page */}
      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/united-states/case-law")}
          className="group flex items-center justify-between gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]"
        >
          <div>
            <p className="font-display text-lg font-medium tracking-[-0.02em] text-zinc-950">
              {fr ? "Jurisprudence & décisions d’application" : "Case law & enforcement decisions"}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {fr
                ? "Décisions publiées et sources de jurisprudence surveillées — sur leur propre page."
                : "Published decisions and monitored case-law sources — on their own page."}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:text-zinc-700">
            {fr ? "Ouvrir →" : "Open →"}
          </span>
        </Link>
      </MotionReveal>

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
