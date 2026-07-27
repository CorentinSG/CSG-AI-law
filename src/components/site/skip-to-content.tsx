"use client";

import { usePathname } from "next/navigation";

import { getLocaleFromPathname } from "@/lib/i18n/href";

/**
 * First focusable element on every page: lets keyboard and screen-reader users
 * jump past the header navigation straight to `<main>` (WCAG 2.4.1 Bypass
 * Blocks). Visually hidden until focused. Client-side because the locale is
 * read from the pathname, as in `SiteHeader`.
 */
export function SkipToContent({ targetId }: { targetId: string }) {
  const fr = getLocaleFromPathname(usePathname()) === "fr";

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:border focus:border-accent/40 focus:bg-[#0a0a0a] focus:px-5 focus:py-2.5 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-[0.2em] focus:text-white"
    >
      {fr ? "Aller au contenu principal" : "Skip to main content"}
    </a>
  );
}
