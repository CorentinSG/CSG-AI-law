import type { Metadata } from "next";

import { MotionReveal } from "@/components/site/motion-reveal";
import { ProfilePortrait } from "@/components/site/profile-portrait";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Professional contact page for research collaborations, writing, speaking, and inquiries related to the developing AI law and legal intelligence platform.",
};

export default function ContactPage() {
  return (
    <SiteShell className="space-y-20">
      <MotionReveal className="space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-600">
          Contact
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-6xl">
          Contact
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-zinc-700">
          This page is intended for professional inquiries related to research,
          writing, speaking, and collaborations at the intersection of
          artificial intelligence, law, regulation, legal intelligence, and
          legal technology.
        </p>
      </MotionReveal>

      <SectionHeading
        eyebrow="Professional inquiries"
        title="Research, writing, speaking, and collaboration"
        description="A full contact workflow is not built yet, but the platform now offers a clearer professional point of contact for future editorial, research, and institutional conversations."
      />

      <MotionReveal>
      <section className="grid gap-8 border-t border-black/6 pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <ProfilePortrait className="max-w-[24rem]" />
        </div>

        <Card className="rounded-[2rem] border-black/6 bg-white text-zinc-950 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="space-y-4 p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">
              Current contact posture
            </p>
            <p className="text-base leading-7 text-zinc-700">
              The site can already serve as a point of contact for research
              collaborations, speaking opportunities, writing inquiries, and
              professional conversations related to AI law and legal
              intelligence.
            </p>
            <p className="text-base leading-7 text-zinc-700">
              A fuller direct-contact or newsletter workflow may be introduced
              later, but only once it fits the same editorial and review
              posture as the rest of the platform.
            </p>
            <p className="text-base leading-7 text-zinc-700">
              Content on this site is provided for legal research and
              informational purposes only and does not constitute legal advice.
            </p>
            <div className="rounded-[1.4rem] border border-black/10 bg-white/60 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-600">
                Contact channel
              </p>
              <p className="mt-2 text-base leading-7 text-zinc-700">
                Direct public contact details are intentionally not published in
                this phase. A dedicated professional contact method can be added
                later once the site&apos;s broader editorial workflow is
                finalized.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
      </MotionReveal>
    </SiteShell>
  );
}
