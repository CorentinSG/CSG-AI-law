import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/research", "/ai-regulation", "/standards", "/contact"],
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
