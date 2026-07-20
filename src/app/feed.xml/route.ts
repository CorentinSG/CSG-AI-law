import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";
import { env } from "@/lib/env";

export const revalidate = 900;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toRfc822(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString();
}

/**
 * Public RSS feed of published AI-law news items. This is the monitor's
 * first outbound distribution channel: readers and aggregators can subscribe
 * instead of having to revisit the site.
 */
export async function GET() {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const records = await updateRepository.getPublicNewsItems(50);
  const items = records.map(normalizeNewsItemRecord);

  const entries = items
    .map((item) => {
      const link = item.relatedMonitorItemId
        ? `${siteUrl}/en/ai-regulation/${item.relatedMonitorItemId}`
        : `${siteUrl}/en/news/${item.slug}`;
      const pubDate = toRfc822(item.publicationDate ?? item.detectedAt);
      const descriptionParts = [
        item.shortSummary,
        `Source: ${item.sourceName} (${item.sourceUrl})`,
        `Jurisdiction: ${item.jurisdiction}`,
        `Verification: ${item.verificationStatus.replaceAll("_", " ")}`,
      ];
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(item.id)}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        `      <category>${escapeXml(item.legalArea)}</category>`,
        `      <description>${escapeXml(descriptionParts.join(" — "))}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const lastBuildDate = toRfc822(items[0]?.detectedAt ?? null) ?? new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>C. Saint-Girons — AI Law &amp; Legal Intelligence</title>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <description>Source-verified AI law and regulation developments across Europe, the United States, and the international layer.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
