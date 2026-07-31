import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";
import { isLocale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/seo";
import { localeHref } from "@/lib/i18n/href";
import {
  getLegalDomains,
  legalDomainSourcingPrinciple,
  type LegalDomainStatus,
} from "@/content/legal-domains";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    alternates: isLocale(lang) ? localeAlternates(lang, "/practice-areas") : undefined,
    title: fr ? "Domaines de pratique" : "Practice Areas",
    description: fr
      ? "Domaines de pratique en intelligence juridique : droit et gouvernance de l'IA, vie privée et protection des données, et droit du cloud — surveillés et vérifiés à partir de sources officielles."
      : "Legal-intelligence practice areas: AI law and governance, privacy and data protection, and cloud law — monitored and verified from official sources.",
  };
}

// Static taxonomy content; served as cached HTML via ISR like the other public pages.
export const revalidate = 300;

const statusStyles: Record<LegalDomainStatus, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  in_development: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  planned: "border-zinc-400/30 bg-zinc-400/10 text-zinc-600",
};

export default async function PracticeAreasPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const domains = getLegalDomains();

  return (
    <SiteShell className="space-y-12 md:space-y-16">
      <section className="space-y-4">
        <SectionHeading
          as="h1"
          eyebrow={fr ? "Intelligence juridique" : "Legal intelligence"}
          title={fr ? "Domaines de pratique" : "Practice areas"}
          description={
            fr
              ? "Les domaines juridiques couverts par cette plateforme, chacun construit sur le même modèle vérifié à partir de sources officielles. Les domaines encore en développement sont clairement signalés et n'impliquent jamais une couverture qui n'existe pas encore."
              : "The legal domains this platform covers, each built on the same official-source, source-verified model. Domains still in development are clearly marked and never imply coverage that does not yet exist."
          }
        />
      </section>

      <MotionStagger className="grid gap-5 lg:grid-cols-3" stagger={0.1}>
        {domains.map((domain) => {
          const card = (
            <Card className="h-full border-black/6 bg-white/70 transition-transform duration-300 hover:-translate-y-0.5">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${statusStyles[domain.status]}`}
                  >
                    {domain.statusLabel}
                  </span>
                  {domain.hubHref ? (
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-zinc-600">
                      {fr ? "Ouvrir le hub" : "Open hub"}
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-2xl text-zinc-950">{domain.title}</h2>
                  <p className="text-sm leading-6 text-zinc-700">{domain.tagline}</p>
                </div>

                <p className="text-sm leading-6 text-zinc-600">{domain.description}</p>

                <p className="mt-auto border-t border-black/5 pt-3 text-xs leading-5 text-zinc-500">
                  {domain.coverageNote}
                </p>
              </CardContent>
            </Card>
          );

          return domain.hubHref ? (
            <Link
              key={domain.slug}
              href={localeHref(fr ? "fr" : "en", domain.hubHref)}
              className="group block"
            >
              {card}
            </Link>
          ) : (
            <div key={domain.slug} aria-disabled className="block">
              {card}
            </div>
          );
        })}
      </MotionStagger>

      <MotionReveal>
      <section className="rounded-[2rem] border border-black/5 bg-white/60 px-6 py-6 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
          {fr ? "Comment fonctionne le sourçage" : "How sourcing works"}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
          {legalDomainSourcingPrinciple}
        </p>
      </section>
      </MotionReveal>
    </SiteShell>
  );
}
