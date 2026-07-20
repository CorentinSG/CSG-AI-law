"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatedHeading } from "@/components/site/animated-heading";
import { FadeIn } from "@/components/site/fade-in";
import { ProfilePortrait } from "@/components/site/profile-portrait";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { LOCALES, type Locale } from "@/lib/i18n/config";

// three.js weighs ~150KB gzip and only paints a decorative background:
// load it after hydration instead of shipping it in the home's initial JS.
const ShaderAnimation = dynamic(
  () =>
    import("@/components/ui/shader-animation").then(
      (mod) => mod.ShaderAnimation,
    ),
  { ssr: false, loading: () => null },
);

export function HeroVideoSection({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const hero = dict.hero;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">

      {/* Shader — full bleed, very subtle */}
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <ShaderAnimation />
      </div>

      {/* Portrait — right 38%, tucked below the nav so the menu bar stays clean.
          The container itself is masked so the photo's rectangular crop
          dissolves into the scene instead of being painted over with black
          (which would occlude the shader and read as a seam). */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-24 z-[1] hidden w-[38%] lg:block"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 48%), linear-gradient(to bottom, transparent 0%, black 32%, black 82%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 48%), linear-gradient(to bottom, transparent 0%, black 32%, black 82%, transparent 100%)",
          maskComposite: "intersect",
        }}
      >
        <ProfilePortrait priority large side className="h-full" />
        {/* quiet darkening so the photo's light studio background sits in the theme */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex h-full flex-col px-8 md:px-12 lg:px-16">

        {/* ── Nav ── */}
        <nav className="flex items-center justify-between py-6">
          <span className="font-display text-[1.05rem] font-medium tracking-[-0.01em] text-white">
            C. Saint-Girons, Esq
          </span>

          <div className="hidden items-center gap-7 text-[13px] text-white/70 md:flex">
            <Link href={`/${lang}/ai-regulation`} className="transition-colors hover:text-white">{dict.nav.aiRegulation}</Link>
            <Link href={`/${lang}/research`} className="transition-colors hover:text-white">{dict.nav.notes}</Link>
            <Link href={`/${lang}/standards`} className="transition-colors hover:text-white">{dict.nav.standards}</Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} />
            <Link
              href={`/${lang}/ai-regulation`}
              className="rounded-lg border border-white/15 px-5 py-2 text-[13px] font-medium text-white/80 transition hover:border-white/35 hover:text-white"
            >
              {dict.nav.openHub}
            </Link>
          </div>
        </nav>

        {/* ── Content — vertically centered ── */}
        <div className="flex flex-1 items-center">
          <div className="max-w-full sm:max-w-[80%] lg:max-w-[50%]">

            <FadeIn delay={80} duration={700}>
              <p className="mb-7 font-mono text-[10.5px] uppercase tracking-[0.32em] text-white/70">
                {hero.eyebrow}
              </p>
            </FadeIn>

            <AnimatedHeading
              text={`${hero.headingLine1}\n${hero.headingLine2}`}
              className="font-display font-medium text-white"
              style={{ letterSpacing: "-0.04em", lineHeight: 1.02, fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
              initialDelay={180}
              charDelay={26}
              duration={480}
            />

            <FadeIn delay={860} duration={900} className="mt-7">
              <p className="max-w-sm text-[15px] leading-[1.75] text-white/68">
                {hero.subtitle}
              </p>
            </FadeIn>

            <FadeIn delay={1260} duration={800} className="mt-9 flex items-center gap-3">
              <Link
                href={`/${lang}/ai-regulation`}
                className="rounded-xl bg-white px-7 py-3 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
              >
                {hero.openHub}
              </Link>
              <Link
                href={`/${lang}/research`}
                className="rounded-xl border border-white/18 px-7 py-3 text-[13px] font-medium text-white/75 transition hover:border-white/36 hover:text-white active:scale-[0.98]"
              >
                {hero.readNotes}
              </Link>
            </FadeIn>

          </div>
        </div>

        {/* ── Bottom strip — anchored metadata ── */}
        <FadeIn delay={1500} duration={700} className="pb-8">
          <div className="flex items-center gap-0 border-t border-white/7 pt-5">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-white/55 pr-6">
              {hero.stat1}
            </span>
            <span className="h-3 w-px bg-white/12 mr-6" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-white/55 pr-6">
              {hero.stat2}
            </span>
            <span className="h-3 w-px bg-white/12 mr-6" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-white/55">
              {hero.stat3}
            </span>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}

function LanguageToggle({ lang }: { lang: Locale }) {
  return (
    <div className="flex items-center rounded-lg border border-white/15 p-0.5 text-[11px] font-medium uppercase tracking-[0.1em]">
      {LOCALES.map((loc) => (
        <Link
          key={loc}
          href={`/${loc}`}
          aria-current={loc === lang ? "page" : undefined}
          className={
            loc === lang
              ? "rounded-md bg-white/15 px-2.5 py-1 text-white"
              : "px-2.5 py-1 text-white/45 transition-colors hover:text-white/80"
          }
        >
          {loc}
        </Link>
      ))}
    </div>
  );
}
