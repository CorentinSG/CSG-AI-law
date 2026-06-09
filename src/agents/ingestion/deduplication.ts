import { createHash } from "node:crypto";

/**
 * Normalize a URL for deduplication: lowercase scheme+host, strip trailing slash,
 * remove common tracking params, sort remaining query params.
 */
export function normalizeUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return rawUrl.trim().toLowerCase();
  }

  // Lowercase scheme + host
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  // Remove common tracking / session query parameters
  const trackingParams = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "fbclid", "gclid", "msclkid", "ref", "referrer", "source", "campaign",
    "sessionid", "sid",
  ];
  for (const p of trackingParams) {
    url.searchParams.delete(p);
  }

  // Sort remaining query params for stable comparison
  url.searchParams.sort();

  // Remove trailing slash from pathname (but keep bare root "/")
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  // Remove fragment — we don't treat #anchors as distinct pages
  url.hash = "";

  return url.toString();
}

/**
 * Compute a SHA-256 content hash from title + markdown body.
 * Used for semantic deduplication independent of URL.
 */
export function computeContentHash(title: string, body: string): string {
  const normalized = `${title.trim()}\n\n${body.trim()}`;
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
