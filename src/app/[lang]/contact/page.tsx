import type { Metadata } from "next";
import Image from "next/image";
import { FileText, Mic, Scale } from "lucide-react";

import { ContactChannel } from "@/components/site/contact-channel";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Professional contact for research collaborations, writing, speaking, and inquiries related to AI law and legal intelligence.",
};

const INQUIRY_TYPES = [
  {
    icon: Scale,
    title: "Research collaborations",
    desc: "Comparative AI law, regulatory monitoring, and legal intelligence systems.",
  },
  {
    icon: FileText,
    title: "Writing & commentary",
    desc: "Editorial contributions, legal analysis, and co-authored notes.",
  },
  {
    icon: Mic,
    title: "Speaking & teaching",
    desc: "Panels, seminars, and guest lectures on AI regulation and legal technology.",
  },
];

export default function ContactPage() {
  return (
    <SiteShell className="space-y-16">
      {/* ── Hero + portrait ── */}
      <MotionReveal>
        <section className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          {/* Intro */}
          <div className="space-y-5 lg:pr-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-strong">
              Contact
            </p>
            <h1 className="max-w-2xl font-display text-5xl font-medium tracking-[-0.05em] text-zinc-950 md:text-6xl">
              Start a conversation
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600">
              For professional inquiries at the intersection of artificial
              intelligence, law, and legal intelligence — research, writing,
              speaking, and collaborations.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Replies within a few days · English or French
            </p>
          </div>

          {/* Portrait — framed on the face, full head-and-shoulders */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/40">
              <Image
                src="/images/profile/corentin-saint-girons-hero-v2.png"
                alt="Portrait of Corentin Saint-Girons"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 32vw"
                className="object-cover object-[center_22%]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 pt-16">
                <p className="font-display text-lg font-medium tracking-[-0.02em] text-white">
                  C. Saint-Girons, Esq
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                  AI Law &amp; Legal Intelligence
                </p>
              </div>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* ── Direct channel (interactive, email revealed on request) ── */}
      <MotionReveal delay={0.05}>
        <ContactChannel />
      </MotionReveal>

      {/* ── What this covers ── */}
      <section className="space-y-8">
        <MotionReveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent-strong">
            What this covers
          </p>
        </MotionReveal>
        <MotionStagger className="grid gap-px overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/8 sm:grid-cols-3" stagger={0.08}>
          {INQUIRY_TYPES.map((item) => (
            <MotionStaggerItem key={item.title}>
              <div className="group flex h-full flex-col gap-3 bg-[#0b0b0b] p-7 transition-colors duration-300 hover:bg-[#101010]">
                <item.icon
                  className="size-5 text-accent-strong transition-transform duration-300 group-hover:scale-110"
                  aria-hidden
                />
                <p className="text-base font-medium text-zinc-950">{item.title}</p>
                <p className="text-sm leading-6 text-zinc-600">{item.desc}</p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      {/* ── Disclaimer ── */}
      <MotionReveal>
        <p className="border-t border-white/8 pt-8 text-xs leading-6 text-zinc-500">
          Contacting this address does not create an attorney–client
          relationship. Content on this site is provided for research and
          informational purposes only and does not constitute legal advice.
        </p>
      </MotionReveal>
    </SiteShell>
  );
}
