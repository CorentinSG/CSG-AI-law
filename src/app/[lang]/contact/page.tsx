import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, FileText, Mail, Mic, Scale } from "lucide-react";

import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Professional contact for research collaborations, writing, speaking, and inquiries related to AI law and legal intelligence.",
};

// Single place to change the published contact address.
const CONTACT_EMAIL = "corentinsaintgirons18@gmail.com";

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
      {/* ── Hero ── */}
      <MotionReveal className="space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-strong">
          Contact
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-medium tracking-[-0.05em] text-zinc-950 md:text-6xl">
          Start a conversation
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600">
          For professional inquiries at the intersection of artificial
          intelligence, law, and legal intelligence — research, writing,
          speaking, and collaborations.
        </p>
      </MotionReveal>

      {/* ── Channel + portrait ── */}
      <MotionReveal>
        <section className="grid gap-6 border-t border-white/8 pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          {/* Primary channel */}
          <div className="glass-panel flex flex-col justify-between gap-10 rounded-[2rem] p-8 md:p-10">
            <div className="space-y-4">
              <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                <Mail className="size-3.5 text-accent-strong" aria-hidden />
                Direct channel
              </p>
              <p className="font-display text-2xl font-medium tracking-[-0.03em] text-zinc-950 md:text-3xl">
                One inbox, read personally.
              </p>
              <p className="max-w-md text-sm leading-7 text-zinc-600">
                Write in English or French. Include who you are, the context,
                and what you have in mind — a focused paragraph beats a long
                brief.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
              >
                {CONTACT_EMAIL}
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Replies within a few days
              </span>
            </div>
          </div>

          {/* Portrait */}
          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d]">
            <Image
              src="/images/profile/corentin-saint-girons-hero-v2.png"
              alt="Portrait of Corentin Saint-Girons"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="font-display text-lg font-medium tracking-[-0.02em] text-white">
                C. Saint-Girons, Esq
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
                AI Law &amp; Legal Intelligence
              </p>
            </div>
          </div>
        </section>
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
              <div className="flex h-full flex-col gap-3 bg-[#0b0b0b] p-7">
                <item.icon className="size-5 text-accent-strong" aria-hidden />
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
