import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Scale, FileText, ShieldCheck } from "lucide-react";

import { HeroVideoSection } from "@/components/site/hero-video-section";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";
import { getDictionary } from "./dictionaries";

export const revalidate = 300;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return {
    title: "C. Saint-Girons, Esq — AI Law & Legal Intelligence",
    description:
      "Attorney-led AI regulatory monitoring — source-verified, structured for legal practice.",
    alternates: {
      canonical: `${siteUrl}/${lang}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${siteUrl}/${l}`])),
    },
  };
}

const ENTRY_ICONS = [Scale, FileText, ShieldCheck];
const ENTRY_HREFS = ["/ai-regulation", "/research", "/standards"];

export default async function HomePage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const home = dict.home;

  return (
    <div className="bg-[#080808] text-white">
      {/* ── Full-screen hero ── */}
      <HeroVideoSection dict={dict} lang={lang} />

      {/* ── Intelligence metrics strip ── */}
      <div className="border-y border-white/8">
        <MotionStagger
          className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/8 md:grid-cols-4"
          stagger={0.08}
        >
          {home.stats.map((stat) => (
            <MotionStaggerItem key={stat.label}>
              <div className="flex flex-col gap-1.5 bg-[#080808] px-8 py-7">
                <span
                  className="font-display text-3xl font-medium text-white md:text-4xl"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {stat.value}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  {stat.label}
                </span>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      {/* ── About / Identity ── */}
      <section className="px-6 py-24 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <MotionReveal>
            <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.32em] text-white/30">
              {home.aboutEyebrow}
            </p>
          </MotionReveal>

          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-20">
            {/* Left — headline + links */}
            <MotionReveal>
              <h2
                className="font-display text-4xl font-medium text-white md:text-5xl lg:text-6xl"
                style={{ letterSpacing: "-0.04em", lineHeight: 1.05 }}
              >
                {home.aboutHeadingLine1}<br />{home.aboutHeadingLine2}<br />{home.aboutHeadingLine3}
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-white/50">
                {home.aboutBody}
              </p>
              <div className="mt-8 flex gap-6">
                <Link
                  href={`/${lang}/research`}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55 underline decoration-white/15 underline-offset-4 transition hover:text-white/80"
                >
                  {home.readNotes}
                </Link>
                <Link
                  href={`/${lang}/contact`}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55 underline decoration-white/15 underline-offset-4 transition hover:text-white/80"
                >
                  {home.contact}
                </Link>
              </div>
            </MotionReveal>

            {/* Right — capabilities grid */}
            <MotionStagger className="grid gap-px bg-white/8 sm:grid-cols-2" stagger={0.07} delay={0.1}>
              {home.capabilities.map((cap) => (
                <MotionStaggerItem key={cap.title}>
                  <div className="flex flex-col gap-3 bg-[#080808] p-6">
                    <div className="h-px w-8 bg-accent/60" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                      {cap.title}
                    </p>
                    <p className="text-sm leading-6 text-white/42">
                      {cap.desc}
                    </p>
                  </div>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </div>
      </section>

      {/* ── Explore ── */}
      <section className="border-t border-white/8 px-6 py-20 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <MotionReveal>
            <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.32em] text-white/30">
              {home.exploreEyebrow}
            </p>
          </MotionReveal>
          <MotionStagger className="grid gap-px bg-white/8 sm:grid-cols-3" stagger={0.1}>
            {home.entryPoints.map((entry, i) => {
              const Icon = ENTRY_ICONS[i];
              return (
                <MotionStaggerItem key={entry.label}>
                  <Link
                    href={`/${lang}${ENTRY_HREFS[i]}`}
                    className="group flex flex-col justify-between gap-10 bg-[#080808] p-8 transition-colors duration-300 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between">
                      <Icon className="size-5 text-white/20 transition-colors duration-300 group-hover:text-accent/60" />
                      <ArrowUpRight className="size-4 text-white/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/50" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-white/90">{entry.label}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                        {entry.description}
                      </p>
                    </div>
                  </Link>
                </MotionStaggerItem>
              );
            })}
          </MotionStagger>
        </div>
      </section>

      {/* ── Intelligence posture strip ── */}
      <MotionReveal>
        <section className="border-t border-white/8 px-6 py-14 md:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="liquid-glass rounded-2xl border border-white/10 px-8 py-8 md:px-12">
              <div className="grid gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                    {home.postureEyebrow}
                  </p>
                  <p
                    className="mt-4 max-w-xl font-display text-2xl font-medium text-white md:text-3xl"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    {home.postureHeadlineLine1}<br />
                    {home.postureHeadlineLine2}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/45">
                    {home.postureBody}
                  </p>
                </div>
                <div className="flex items-end">
                  <Link
                    href={`/${lang}/ai-regulation`}
                    className="whitespace-nowrap rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                  >
                    {home.postureCta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 px-6 py-10 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/22">
            {home.footerTagline}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/22">
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
