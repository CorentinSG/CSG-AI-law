"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

/**
 * Condensed navigation for the home page. The hero carries its own transparent
 * nav that scrolls away with it; this bar fades in once the hero is out of view
 * so the page below the fold is never left without navigation. Matches the
 * DESIGN.md nav spec: transparent at the top, condensing on scroll.
 */
export function HomeScrollNav({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Reveal once the viewport has scrolled roughly past the full-screen hero.
    const onScroll = () =>
      setShown(window.scrollY > window.innerHeight * 0.85);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Portal to <body> so the fixed bar escapes the page-transition wrapper, whose
  // filter/transform would otherwise trap `position: fixed` in its own box.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-black/70 backdrop-blur-xl transition-all duration-300 ${
        shown
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 md:px-12 lg:px-16">
        <Link
          href={`/${lang}`}
          className="font-display text-[0.95rem] font-medium tracking-[-0.01em] text-white"
        >
          C. Saint-Girons, Esq
        </Link>

        <div className="hidden items-center gap-7 text-[13px] text-white/70 md:flex">
          <Link href={`/${lang}/ai-regulation`} className="transition-colors hover:text-white">
            {dict.nav.aiRegulation}
          </Link>
          <Link href={`/${lang}/research`} className="transition-colors hover:text-white">
            {dict.nav.notes}
          </Link>
          <Link href={`/${lang}/standards`} className="transition-colors hover:text-white">
            {dict.nav.standards}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-white/15 p-0.5 text-[11px] font-medium uppercase tracking-[0.1em]">
            {LOCALES.map((loc) => (
              <Link
                key={loc}
                href={`/${loc}`}
                aria-current={loc === lang ? "page" : undefined}
                className={
                  loc === lang
                    ? "rounded-md bg-white/15 px-2.5 py-1 text-white"
                    : "px-2.5 py-1 text-white/55 transition-colors hover:text-white/80"
                }
              >
                {loc}
              </Link>
            ))}
          </div>
          <Link
            href={`/${lang}/ai-regulation`}
            className="rounded-lg bg-white px-4 py-1.5 text-[13px] font-medium text-black transition hover:bg-white/90"
          >
            {dict.nav.openHub}
          </Link>
        </div>
      </nav>
    </div>,
    document.body,
  );
}
