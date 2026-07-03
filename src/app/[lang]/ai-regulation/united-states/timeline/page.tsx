import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { UsAiTimeline } from "@/components/site/us-ai-timeline";
import { MotionReveal } from "@/components/site/motion-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { usFederalTimelineEntries } from "@/content/ai-regulation/us-ai-legal-baseline";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "US Timeline | United States Hub",
  description:
    "Official timeline of U.S. AI regulation — federal milestones and state actions, verified and classified.",
};

export const revalidate = 3600;

export default async function UsTimelinePage({
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
            { label: "Timeline", href: "/ai-regulation/united-states/timeline" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Chronologie officielle · États-Unis" : "Official timeline · United States"}
          title="Timeline US"
          description={
            fr
              ? `${usFederalTimelineEntries.length} jalons fédéraux vérifiés — de l'EO 14110 jusqu'aux projets législatifs récents.`
              : `${usFederalTimelineEntries.length} verified federal milestones — from EO 14110 through recent legislative proposals.`
          }
        />
      </MotionReveal>

      <MotionReveal delay={0.1}>
        <UsAiTimeline entries={usFederalTimelineEntries} />
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
