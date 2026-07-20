import { env } from "@/lib/env";
import { LOCALES } from "@/lib/i18n/config";

/**
 * Locale-aware canonical + hreflang alternates for a public page.
 *
 * Every public route lives under /{lang}, so a canonical without the locale
 * prefix points at a 307 redirect whose target depends on the crawler's
 * Accept-Language — which breaks indexing consolidation. Server-only (reads
 * env), do not import from client components.
 */
export function pageAlternates(lang: string, path: string) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `${siteUrl}/${lang}${normalized}`,
    languages: {
      ...Object.fromEntries(
        LOCALES.map((locale) => [locale, `${siteUrl}/${locale}${normalized}`]),
      ),
      "x-default": `${siteUrl}/en${normalized}`,
    },
  };
}
