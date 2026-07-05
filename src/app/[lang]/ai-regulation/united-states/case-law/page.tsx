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
  usAiCaseLawEntries,
  usAiCaseLawSources,
} from "@/content/ai-regulation/us-ai-case-law";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Case Law | United States Hub",
  description:
    "AI-related case law and enforcement decisions in the United States — court decisions and agency actions, plus the monitored case-law sources behind them.",
};

export const revalidate = 3600;

export default async function UsCaseLawPage({
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
            { label: fr ? "Jurisprudence" : "Case law", href: "/ai-regulation/united-states/case-law" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Décisions & enforcement · États-Unis" : "Decisions & enforcement · United States"}
          title={fr ? "Jurisprudence" : "Case law"}
          description={
            fr
              ? "Décisions de justice et actions d'agences liées à l'IA aux États-Unis, et les sources de jurisprudence surveillées."
              : "AI-related court decisions and agency actions in the United States, and the monitored case-law sources behind them."
          }
        />
      </MotionReveal>

      {/* Decisions */}
      {publishedCases.length > 0 ? (
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
      ) : (
        <MotionReveal>
          <div className="border-y border-white/8 py-8">
            <p className="text-sm leading-7 text-zinc-500">
              {fr
                ? "Aucune décision publiée pour le moment. Les décisions apparaissent ici une fois vérifiées à la source."
                : "No published decisions yet. Decisions appear here once source-verified."}
            </p>
          </div>
        </MotionReveal>
      )}

      {/* Monitored sources */}
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
