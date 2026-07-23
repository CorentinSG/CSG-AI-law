"use client";

import { usePathname } from "next/navigation";

import { getLocaleFromPathname } from "@/lib/i18n/href";

// Site-wide transparency notice: the project is still under active
// construction and its aggregated legal information is not yet guaranteed
// reliable. Intentionally persistent (not dismissible) and slim so it stays
// honest without dominating the page. Locale is derived from the pathname —
// same pattern as the header/footer — so it needs no dict prop and works on
// every route.
export function SiteNotice() {
  const fr = getLocaleFromPathname(usePathname()) === "fr";

  return (
    <div className="border-b border-amber-400/15 bg-amber-400/[0.06]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-6 py-2 text-center">
        <span aria-hidden className="relative flex size-1.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
        </span>
        <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-amber-200/90">
          {fr
            ? "Site en construction — les informations peuvent ne pas être fiables à 100 % et sont susceptibles d'évoluer."
            : "Site under construction — information may not be fully reliable yet and is subject to change."}
        </p>
      </div>
    </div>
  );
}
