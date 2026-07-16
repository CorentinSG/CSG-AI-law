import type { MetadataRoute } from "next";

import {
  getPublicResearchEntries,
} from "@/content/research";
import { getEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import { getUsStateAiLawProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { env } from "@/lib/env";
import { LOCALES } from "@/lib/i18n/config";

interface RouteEntry {
  path: string;
  lastModified: Date | string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

/** Expand one logical route into one sitemap entry per locale, each declaring
 * the others as hreflang alternates so search engines don't treat /en and /fr
 * versions of the same page as duplicate content. */
function localizeEntries(siteUrl: string, entries: RouteEntry[]): MetadataRoute.Sitemap {
  return entries.flatMap((entry) =>
    LOCALES.map((locale) => ({
      url: `${siteUrl}/${locale}${entry.path}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${siteUrl}/${l}${entry.path}`]),
        ),
      },
    })),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: RouteEntry[] = [
    { path: "", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { path: "/research", lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { path: "/ai-regulation", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { path: "/news", lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { path: "/ai-regulation/europe", lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { path: "/ai-regulation/united-states", lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { path: "/ai-regulation/international", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { path: "/ai-regulation/methodology", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { path: "/ai-regulation/europe/ai-act", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { path: "/ai-regulation/europe/ai-act/calendar", lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { path: "/ai-regulation/europe/governance", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/europe/case-law", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/europe/standards", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/europe/timeline", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/united-states/federal", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { path: "/ai-regulation/united-states/governance", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/united-states/case-law", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/united-states/timeline", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { path: "/ai-regulation/united-states/states", lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { path: "/practice-areas", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { path: "/standards", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { path: "/contact", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const researchRoutes: RouteEntry[] = getPublicResearchEntries().map((entry) => ({
    path: `/research/${entry.slug}`,
    lastModified: entry.updatedAt ?? entry.publishedAt ?? now,
    changeFrequency: entry.status === "published" ? "monthly" : "weekly",
    priority: entry.featured ? 0.8 : 0.7,
  }));

  // All 27 EU member state country pages — priority scaled by implementation depth.
  // First-wave profiles (deeply verified) get higher priority.
  const allEuropeProfiles = getEuropeCountryProfiles();
  const europeCountryRoutes: RouteEntry[] = allEuropeProfiles.map((profile) => ({
    path: `/ai-regulation/europe/${profile.slug}`,
    lastModified: profile.lastReviewedDate,
    changeFrequency: "weekly",
    // First-wave profiles have source references; stubs are needs_review.
    priority: profile.sourceReferences.length > 0 ? 0.75 : 0.55,
  }));

  // All 50 US states + DC pages — priority scaled by law status.
  const allUsStateProfiles = getUsStateAiLawProfiles();
  const usStateRoutes: RouteEntry[] = allUsStateProfiles.map((profile) => ({
    path: `/ai-regulation/united-states/${profile.slug}`,
    lastModified: profile.lastReviewedDate,
    changeFrequency: "weekly",
    priority:
      profile.aiLawStatus === "enacted_comprehensive_ai_law" ||
      profile.aiLawStatus === "enacted_sector_specific_ai_law"
        ? 0.75
        : profile.aiLawStatus === "pending_ai_legislation"
          ? 0.65
          : 0.55,
  }));

  return localizeEntries(siteUrl, [
    ...staticRoutes,
    ...researchRoutes,
    ...europeCountryRoutes,
    ...usStateRoutes,
  ]);
}
