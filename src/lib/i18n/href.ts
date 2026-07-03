import { LOCALES, type Locale } from "@/lib/i18n/config";

/**
 * Prefix an internal app path with its locale segment. Leaves external URLs,
 * hashes, and already-prefixed `/admin` or `/api` paths untouched — those
 * routes are not locale-routed.
 */
export function localeHref(lang: Locale, path: string): string {
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("#") ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  ) {
    return path;
  }
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Parse the locale segment out of a pathname, e.g. `/fr/ai-regulation` -> `fr`. */
export function getLocaleFromPathname(pathname: string | null): Locale {
  const segment = pathname?.split("/")[1];
  return (LOCALES as readonly string[]).includes(segment ?? "")
    ? (segment as Locale)
    : "en";
}

/** Strip the locale segment from a pathname, e.g. `/fr/ai-regulation` -> `/ai-regulation`. */
export function stripLocaleFromPathname(pathname: string | null): string {
  const segment = pathname?.split("/")[1];
  if ((LOCALES as readonly string[]).includes(segment ?? "")) {
    const rest = pathname!.slice(segment!.length + 1);
    return rest === "" ? "/" : rest;
  }
  return pathname ?? "/";
}
