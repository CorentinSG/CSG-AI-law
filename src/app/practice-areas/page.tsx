import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLegalDomains,
  legalDomainSourcingPrinciple,
  type LegalDomainStatus,
} from "@/content/legal-domains";

export const metadata: Metadata = {
  title: "Practice Areas",
  description:
    "Legal-intelligence practice areas: AI law and governance, privacy and data protection, and cloud law — monitored from official sources with human review.",
};

// Static taxonomy content; served as cached HTML via ISR like the other public pages.
export const revalidate = 300;

const statusStyles: Record<LegalDomainStatus, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  in_development: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  planned: "border-zinc-400/30 bg-zinc-400/10 text-zinc-600",
};

export default function PracticeAreasPage() {
  const domains = getLegalDomains();

  return (
    <SiteShell className="space-y-12 md:space-y-16">
      <section className="space-y-4">
        <SectionHeading
          eyebrow="Legal intelligence"
          title="Practice areas"
          description="The legal domains this platform covers, each built on the same official-source, human-reviewed model. Domains still in development are clearly marked and never imply coverage that does not yet exist."
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
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
                      Open hub
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
            <Link key={domain.slug} href={domain.hubHref} className="group block">
              {card}
            </Link>
          ) : (
            <div key={domain.slug} aria-disabled className="block">
              {card}
            </div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white/60 px-6 py-6 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
          How sourcing works
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700">
          {legalDomainSourcingPrinciple}
        </p>
      </section>
    </SiteShell>
  );
}
