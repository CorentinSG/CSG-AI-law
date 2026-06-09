import type { MetadataRoute } from "next";

import {
  getPublicResearchEntries,
} from "@/content/research";
import { getEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import { getUsStateAiLawProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/research`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/ai-regulation`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/news`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/ai-regulation/europe`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/ai-regulation/united-states`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/standards`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const researchPages: MetadataRoute.Sitemap = getPublicResearchEntries().map(
    (entry) => ({
      url: `${siteUrl}/research/${entry.slug}`,
      lastModified: entry.updatedAt ?? entry.publishedAt ?? now,
      changeFrequency: entry.status === "published" ? "monthly" : "weekly",
      priority: entry.featured ? 0.8 : 0.7,
    }),
  );

  // All 27 EU member state country pages — priority scaled by implementation depth.
  // First-wave profiles (deeply verified) get higher priority.
  const allEuropeProfiles = getEuropeCountryProfiles();
  const europeCountryPages: MetadataRoute.Sitemap = allEuropeProfiles.map((profile) => ({
    url: `${siteUrl}/ai-regulation/europe/${profile.slug}`,
    lastModified: profile.lastReviewedDate,
    changeFrequency: "weekly" as const,
    // First-wave profiles have source references; stubs are needs_review.
    priority: profile.sourceReferences.length > 0 ? 0.75 : 0.55,
  }));

  // All 50 US states + DC pages — priority scaled by law status.
  const allUsStateProfiles = getUsStateAiLawProfiles();
  const usStatePages: MetadataRoute.Sitemap = allUsStateProfiles.map((profile) => ({
    url: `${siteUrl}/ai-regulation/united-states/${profile.slug}`,
    lastModified: profile.lastReviewedDate,
    changeFrequency: "weekly" as const,
    priority:
      profile.aiLawStatus === "enacted_comprehensive_ai_law" ||
      profile.aiLawStatus === "enacted_sector_specific_ai_law"
        ? 0.75
        : profile.aiLawStatus === "pending_ai_legislation"
          ? 0.65
          : 0.55,
  }));

  return [
    ...staticPages,
    ...researchPages,
    ...europeCountryPages,
    ...usStatePages,
  ];
}
