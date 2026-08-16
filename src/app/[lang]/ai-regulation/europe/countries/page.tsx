import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import {
  europeImplementationStatusTaxonomy,
  getEuropeCountryProfilesByEvidenceStrength,
  type EuropeImplementationConfidence,
  type EuropeImplementationStatus,
} from "@/content/ai-regulation/europe-country-profiles";
import { isLocale } from "@/lib/i18n/config";
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
      ? localeAlternates(lang, "/ai-regulation/europe/countries")
      : undefined,
    title: "AI Act implementation by member state | Europe Hub",
    description:
      "Every EU member state, grouped by how far its national AI Act implementation has been verified — designated competent authorities, draft frameworks, and work in progress.",
  };
}

export const revalidate = 3600;

const statusLabelFr: Record<EuropeImplementationStatus, string> = {
  competent_authority_designated: "Autorité compétente désignée",
  national_implementation_identified: "Mesure nationale identifiée",
  consultation_or_draft_identified: "Projet ou consultation en cours",
  implementation_in_progress: "Mise en œuvre en cours",
  eu_framework_applies: "Cadre européen applicable",
  no_specific_national_implementation_verified: "Aucune mesure nationale vérifiée",
  needs_review: "À vérifier",
  not_applicable: "Sans objet",
};

const confidenceLabel: Record<
  EuropeImplementationConfidence,
  { en: string; fr: string; className: string }
> = {
  high: {
    en: "High confidence",
    fr: "Confiance haute",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  medium: {
    en: "Medium confidence",
    fr: "Confiance moyenne",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  low: {
    en: "Low confidence",
    fr: "Confiance faible",
    className: "border-zinc-200 bg-zinc-50 text-zinc-500",
  },
  needs_review: {
    en: "To be reviewed",
    fr: "À vérifier",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
};

export default async function EuropeCountriesIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";

  const profiles = getEuropeCountryProfilesByEvidenceStrength();

  // Grouped in the same evidence order the sort already produced, so a country
  // moves group automatically when its verified status changes.
  const groups: { status: EuropeImplementationStatus; profiles: typeof profiles }[] = [];
  for (const profile of profiles) {
    const last = groups.at(-1);
    if (last && last.status === profile.implementationStatus) last.profiles.push(profile);
    else groups.push({ status: profile.implementationStatus, profiles: [profile] });
  }

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "Europe", href: "/ai-regulation/europe" },
            {
              label: fr ? "Tous les pays" : "All countries",
              href: "/ai-regulation/europe/countries",
            },
          ]}
        />
        <SectionHeading
          as="h1"
          eyebrow={fr ? "États membres · Acte IA" : "Member states · AI Act"}
          title={fr ? "Mise en œuvre par pays" : "Implementation by country"}
          description={
            fr
              ? `Les ${profiles.length} États membres, regroupés selon le niveau de preuve vérifié pour leur mise en œuvre nationale de l'acte IA. Chaque désignation est lue dans une source officielle — texte de loi, journal officiel ou acte de gouvernement.`
              : `All ${profiles.length} member states, grouped by the strength of verified evidence for their national AI Act implementation. Every designation is read at an official source — statute text, gazette record, or government act.`
          }
        />
      </MotionReveal>

      {groups.map((group) => {
        const taxonomy = europeImplementationStatusTaxonomy[group.status];
        return (
          <section key={group.status} className="space-y-4">
            <MotionReveal>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-base font-medium uppercase leading-tight tracking-[-0.02em] text-zinc-950">
                  {fr ? statusLabelFr[group.status] : taxonomy.label}
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
                  {group.profiles.length} {fr ? "pays" : group.profiles.length === 1 ? "country" : "countries"}
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-7 text-zinc-600">
                {taxonomy.shortExplanation}
              </p>
            </MotionReveal>

            <MotionStagger className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {group.profiles.map((profile) => {
                const confidence = confidenceLabel[profile.implementationConfidence];
                return (
                  <MotionStaggerItem key={profile.slug}>
                    <Link
                      href={localeHref(lang, `/ai-regulation/europe/${profile.slug}`)}
                      className="flex h-full flex-col rounded-[1.4rem] border border-black/6 bg-white p-4 shadow-[0_4px_20px_rgba(15,15,15,0.04)] transition-all hover:-translate-y-px hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-medium uppercase tracking-[-0.01em] text-zinc-950">
                          <span className="mr-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-zinc-400">
                            {profile.countryCode}
                          </span>
                          {profile.countryName}
                        </span>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] ${confidence.className}`}
                        >
                          {fr ? confidence.fr : confidence.en}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-zinc-600">
                        {profile.publicSummary}
                      </p>
                      {profile.nationalImplementationMeasures.length > 0 && (
                        <p className="mt-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-400">
                          {profile.nationalImplementationMeasures.length}{" "}
                          {fr
                            ? profile.nationalImplementationMeasures.length === 1
                              ? "mesure vérifiée"
                              : "mesures vérifiées"
                            : profile.nationalImplementationMeasures.length === 1
                              ? "verified measure"
                              : "verified measures"}
                        </p>
                      )}
                    </Link>
                  </MotionStaggerItem>
                );
              })}
            </MotionStagger>
          </section>
        );
      })}
    </SiteShell>
  );
}
