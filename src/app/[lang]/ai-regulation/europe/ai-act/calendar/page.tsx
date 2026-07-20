import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { europeAiActBaseline } from "@/content/ai-regulation/europe-ai-legal-baseline";
import { formatDisplayDate } from "@/lib/utils";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "Application Calendar | EU AI Act",
  description:
    "Phased application calendar of the EU AI Act — the official application deadlines with their legal effect, plus key articles and annexes.",
};

export const revalidate = 3600;

export default async function EuAiActCalendarPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fr = lang === "fr";
  const act = europeAiActBaseline;

  return (
    <SiteShell className="space-y-10">
      <MotionReveal>
        <BreadcrumbNav
          lang={lang}
          items={[
            { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
            { label: "Europe", href: "/ai-regulation/europe" },
            { label: "EU AI Act", href: "/ai-regulation/europe/ai-act" },
            { label: fr ? "Calendrier" : "Calendar", href: "/ai-regulation/europe/ai-act/calendar" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Échéances officielles · UE" : "Official deadlines · EU"}
          title={fr ? "Calendrier d'application" : "Application calendar"}
          description={
            fr
              ? `${act.phasedApplicationDates.length} échéances officielles du EU AI Act — chaque date avec son effet juridique.`
              : `${act.phasedApplicationDates.length} official EU AI Act deadlines — each date with its legal effect.`
          }
        />
      </MotionReveal>

      {/* Phased application dates */}
      <MotionStagger className="space-y-3">
        {act.phasedApplicationDates.map((entry, i) => (
          <MotionStaggerItem key={i}>
            <div className="flex gap-4 rounded-[1.6rem] border border-black/6 bg-white p-4 shadow-[0_4px_20px_rgba(15,15,15,0.04)]">
              <div className="flex-shrink-0 text-right">
                <p className="font-display text-sm font-medium uppercase tracking-[-0.02em] text-zinc-950">
                  {formatDisplayDate(entry.date)}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] ${
                    entry.confidence === "high"
                      ? "bg-emerald-50 text-emerald-700"
                      : entry.confidence === "medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-zinc-50 text-zinc-500"
                  }`}
                >
                  {entry.confidence}
                </span>
              </div>
              <div className="min-w-0 flex-1 border-l border-black/6 pl-4">
                <p className="font-medium text-zinc-950">{entry.label}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{entry.legalEffect}</p>
              </div>
            </div>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      {/* Key articles */}
      {act.keyArticlesChaptersAnnexes.length > 0 && (
        <section className="space-y-3">
          <MotionReveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              {fr ? "Articles et annexes clés" : "Key articles and annexes"}
            </p>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <div className="flex flex-wrap gap-2">
              {act.keyArticlesChaptersAnnexes.map((ref) => (
                <span
                  key={ref}
                  className="rounded-full border border-black/6 bg-zinc-50 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600"
                >
                  {ref}
                </span>
              ))}
            </div>
          </MotionReveal>
        </section>
      )}

      <MotionReveal>
        <Link
          href={localeHref(lang, "/ai-regulation/europe/ai-act")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-400 underline decoration-black/15 underline-offset-4 hover:text-zinc-700"
        >
          {fr ? "← Retour au EU AI Act" : "← Back to the EU AI Act"}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
