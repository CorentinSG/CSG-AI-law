import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { EuAiTimeline } from "@/components/site/eu-ai-timeline";
import { MotionReveal } from "@/components/site/motion-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "EU Timeline | Europe Hub",
  description:
    "Official timeline of AI regulation in Europe — from the AI Act proposal through the first application deadlines.",
};

export const revalidate = 3600;

export default async function EuropeTimelinePage({
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
            { label: "Europe", href: "/ai-regulation/europe" },
            { label: "Timeline", href: "/ai-regulation/europe/timeline" },
          ]}
        />
        <SectionHeading
          eyebrow={fr ? "Chronologie officielle · UE" : "Official timeline · EU"}
          title="Timeline EU"
          description={
            fr
              ? `${euAiTimelineEntries.length} jalons officiels — du projet de règlement jusqu'aux premières échéances d'application du EU AI Act.`
              : `${euAiTimelineEntries.length} official milestones — from the regulation proposal through the first EU AI Act application deadlines.`
          }
        />
      </MotionReveal>

      <MotionReveal delay={0.1}>
        <EuAiTimeline entries={euAiTimelineEntries} />
      </MotionReveal>

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
