import { env } from "@/lib/env";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { ResearchEntry } from "@/content/research";

/**
 * Canonical + hreflang alternates for a locale-prefixed path.
 *
 * Every public page lives under /{lang}, so each one has a sibling in the other
 * locale. Without `languages`, Google treats /en/x and /fr/x as unrelated pages
 * competing for the same queries; with it, they are one document in two
 * languages. The home page hand-rolled this — this is the same shape for
 * everyone else.
 */
export function localeAlternates(lang: Locale, path: string) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `${siteUrl}/${lang}${suffix}`,
    languages: Object.fromEntries(
      LOCALES.map((locale) => [locale, `${siteUrl}/${locale}${suffix}`]),
    ),
  };
}

/**
 * schema.org Article for a research entry — built from the entry's own fields
 * and nothing else. No field is invented: a missing date stays absent rather
 * than defaulting to today, because a fabricated datePublished on a legal
 * analysis is worse than none.
 */
export function researchArticleJsonLd(entry: ResearchEntry, lang: Locale) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.summary,
    author: { "@type": "Person", name: entry.author },
    inLanguage: lang,
    mainEntityOfPage: `${siteUrl}/${lang}/research/${entry.slug}`,
    ...(entry.publishedAt ? { datePublished: entry.publishedAt } : {}),
    ...(entry.updatedAt ? { dateModified: entry.updatedAt } : {}),
    articleSection: entry.category,
    keywords: entry.tags.join(", "),
  };
}

/**
 * Serializes JSON-LD for a <script> tag. `<` is escaped so page content can
 * never close the script element early — the standard defence when embedding
 * JSON in HTML.
 */
export function jsonLdString(value: object): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
