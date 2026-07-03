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
  europeGovernanceActors,
} from "@/content/ai-regulation/europe-ai-legal-baseline";
import {
  europeAiCaseLawEntries,
  europeAiCaseLawSources,
} from "@/content/ai-regulation/europe-ai-case-law";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "EU Governance | Europe Hub",
  description:
    "Institutional AI governance actors in Europe — AI Office, EDPB, national authorities. Case law and enforcement decisions.",
};

export const revalidate = 3600;

const bindingLabelEn: Record<string, string> = {
  not_binding_by_itself: "Not binding by itself",
  institutional_role_under_binding_law: "Institutional role under binding law",
  needs_article_level_review: "Needs article-level review",
};

const bindingLabelFr: Record<string, string> = {
  not_binding_by_itself: "Non contraignant par lui-même",
  institutional_role_under_binding_law: "Rôle institutionnel sous droit contraignant",
  needs_article_level_review: "Sous revue article par article",
};

export default async function EuropeGovernancePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const bindingLabel = fr ? bindingLabelFr : bindingLabelEn;

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "Europe", href: "/ai-regulation/europe" },
            { label: fr ? "Gouvernance" : "Governance", href: "/ai-regulation/europe/governance" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Acteurs institutionnels · UE" : "Institutional actors · EU"}
          title={fr ? "Gouvernance" : "Governance"}
          description={
            fr
              ? "Les acteurs clés de l'architecture de gouvernance de l'IA en Europe — leur rôle, base légale, et niveau d'autorité."
              : "The key actors in Europe's AI governance architecture — their role, legal basis, and level of authority."
          }
        />
      </MotionReveal>

      {/* Governance actors */}
      <MotionStagger className="grid gap-4 md:grid-cols-2">
        {europeGovernanceActors.map((actor) => (
          <MotionStaggerItem key={actor.id}>
            <Card className="h-full rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <div className="flex flex-wrap items-start gap-2">
                  <CardTitle className="font-display text-lg font-medium uppercase tracking-[-0.03em]">
                    {actor.name}
                  </CardTitle>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-sky-700">
                    {bindingLabel[actor.bindingStatusLabel] ?? actor.bindingStatusLabel.replaceAll("_", " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-7 text-zinc-700">{actor.role}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                  {fr ? "Base légale" : "Legal basis"}
                </p>
                <p className="text-sm text-zinc-600">{actor.legalBasis}</p>
                {actor.responsibilities.length > 0 && (
                  <ul className="space-y-1">
                    {actor.responsibilities.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-600">
                        <span className="mt-2 size-1 flex-shrink-0 rounded-full bg-zinc-300" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      {/* Case law */}
      {europeAiCaseLawEntries.filter((e) => e.status === "published").length > 0 && (
        <section className="space-y-4">
          <MotionReveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Jurisprudence & décisions d’application" : "Case law & enforcement decisions"}
            </p>
          </MotionReveal>
          <MotionStagger className="space-y-3">
            {europeAiCaseLawEntries
              .filter((e) => e.status === "published")
              .map((entry) => (
                <MotionStaggerItem key={entry.id}>
                  <div className="rounded-[1.6rem] border border-black/6 bg-white p-5 shadow-[0_4px_20px_rgba(15,15,15,0.04)]">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-600">
                        {entry.authorityType.replaceAll("_", " ")}
                      </span>
                      {entry.docketOrCaseNumber && (
                        <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-600">
                          {entry.docketOrCaseNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-1.5 text-sm leading-7 text-zinc-600">{entry.shortSummary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                        {entry.courtOrAuthority}
                        {entry.date ? ` · ${formatDisplayDate(entry.date)}` : ""}
                        {entry.country ? ` · ${entry.country}` : ""}
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
      {europeAiCaseLawSources.length > 0 && (
        <section className="space-y-4">
          <MotionReveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Sources de jurisprudence surveillées" : "Monitored case law sources"}
            </p>
          </MotionReveal>
          <MotionStagger className="grid gap-3 md:grid-cols-2">
            {europeAiCaseLawSources.map((src) => {
            const accessBadge = src.runtimeAccessible
              ? "bg-emerald-600 text-white"
              : "border border-zinc-300 text-zinc-700";
            return (
              <MotionStaggerItem key={src.id}>
                <div className="rounded-[1.6rem] border border-black/6 bg-zinc-50/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-950">{src.name}</p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                        {src.institution} · {src.jurisdiction}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] ${accessBadge}`}>
                      {src.runtimeAccessible ? "accessible" : fr ? "manuel" : "manual"}
                    </span>
                  </div>
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
            );
          })}
          </MotionStagger>
        </section>
      )}

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
