import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { UsHubMap } from "@/components/site/us-hub-map";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { usStateMapStatuses } from "@/content/ai-regulation/us-map";
import {
  getUsStateAiLawProfiles,
  usStateAiLawStatusTaxonomy,
  type UsStateAiLawStatus,
} from "@/content/ai-regulation/us-state-ai-law-baseline";
import { getUsGeoPaths } from "@/lib/geo-paths";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "All states | United States Hub",
  description:
    "Every U.S. state and territory tracked for AI law — grouped by legal status, from enacted comprehensive law to pending legislation and agency activity.",
};

export const revalidate = 3600;

// Groups shown in descending legal weight. Any status not listed falls into
// the final "other" bucket so every profile is always accounted for.
const GROUP_ORDER: UsStateAiLawStatus[] = [
  "enacted_comprehensive_ai_law",
  "enacted_sector_specific_ai_law",
  "pending_ai_legislation",
  "agency_guidance_or_enforcement",
  "ai_related_privacy_or_automated_decision_rules",
];

const STATUS_DOT: Partial<Record<UsStateAiLawStatus, string>> = {
  enacted_comprehensive_ai_law: "bg-emerald-400",
  enacted_sector_specific_ai_law: "bg-emerald-400/70",
  pending_ai_legislation: "bg-sky-400",
  agency_guidance_or_enforcement: "bg-sky-400/70",
  ai_related_privacy_or_automated_decision_rules: "bg-amber-400",
};

const OTHER_LABEL = { en: "No specific AI law verified", fr: "Aucune loi IA spécifique vérifiée" };

export default async function UsStatesIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";

  const profiles = getUsStateAiLawProfiles();
  const geoPaths = getUsGeoPaths();

  const groups = GROUP_ORDER.map((status) => ({
    status,
    label: usStateAiLawStatusTaxonomy[status].label,
    dot: STATUS_DOT[status] ?? "bg-white/40",
    states: profiles
      .filter((p) => p.aiLawStatus === status)
      .sort((a, b) => a.stateName.localeCompare(b.stateName)),
  })).filter((g) => g.states.length > 0);

  const grouped = new Set(GROUP_ORDER);
  const otherStates = profiles
    .filter((p) => !grouped.has(p.aiLawStatus))
    .sort((a, b) => a.stateName.localeCompare(b.stateName));

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "United States", href: "/ai-regulation/united-states" },
            { label: fr ? "Tous les états" : "All states", href: "/ai-regulation/united-states/states" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Couverture par état · États-Unis" : "Coverage by state · United States"}
          title={fr ? "Les 50 états + DC" : "All 50 states + DC"}
          description={
            fr
              ? `${profiles.length} juridictions suivies, groupées par statut juridique — du droit IA complet adopté jusqu'à l'activité des agences.`
              : `${profiles.length} jurisdictions tracked, grouped by legal status — from enacted comprehensive AI law down to agency activity.`
          }
        />
      </MotionReveal>

      <MotionReveal delay={0.06}>
        <UsHubMap states={usStateMapStatuses} paths={geoPaths} />
      </MotionReveal>

      {groups.map((group) => (
        <section key={group.status} className="space-y-3">
          <MotionReveal>
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <span aria-hidden className={`size-1.5 rounded-full ${group.dot}`} />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/60">
                {group.label}
              </h2>
              <span className="ml-auto font-mono text-[10px] text-white/40">
                {group.states.length}
              </span>
            </div>
          </MotionReveal>
          <MotionStagger className="flex flex-wrap gap-2">
            {group.states.map((state) => (
              <MotionStaggerItem key={state.slug}>
                <Link
                  href={localeHref(lang, `/ai-regulation/united-states/${state.slug}`)}
                  className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  {state.stateName}
                </Link>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </section>
      ))}

      {otherStates.length > 0 && (
        <section className="space-y-3">
          <MotionReveal>
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
              <span aria-hidden className="size-1.5 rounded-full bg-white/30" />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
                {fr ? OTHER_LABEL.fr : OTHER_LABEL.en}
              </h2>
              <span className="ml-auto font-mono text-[10px] text-white/40">
                {otherStates.length}
              </span>
            </div>
          </MotionReveal>
          <MotionStagger className="flex flex-wrap gap-2">
            {otherStates.map((state) => (
              <MotionStaggerItem key={state.slug}>
                <Link
                  href={localeHref(lang, `/ai-regulation/united-states/${state.slug}`)}
                  className="inline-flex rounded-full border border-white/8 bg-white/[0.02] px-3.5 py-1.5 text-[13px] text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white/85"
                >
                  {state.stateName}
                </Link>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </section>
      )}

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/united-states")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/80"
        >
          {fr ? "← Retour au hub United States" : "← Back to United States hub"}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
