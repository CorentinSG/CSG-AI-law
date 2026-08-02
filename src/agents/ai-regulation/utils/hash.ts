import { createHash } from "node:crypto";

export function normalizeUrl(url: string) {
  try {
    const normalized = new URL(url);
    normalized.hash = "";
    for (const key of [...normalized.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) {
        normalized.searchParams.delete(key);
      }
    }
    if (normalized.pathname !== "/" && normalized.pathname.endsWith("/")) {
      normalized.pathname = normalized.pathname.slice(0, -1);
    }
    return normalized.toString();
  } catch {
    return url.trim();
  }
}

export function normalizeTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Identity is source + stableId + title + URL — nothing else. The hash once
// included publicationDate and a text prefix, which made identity track
// *presentation*: official pages that republish the same document with a
// shifted date or reworded lede minted a fresh "unique" item on every scan
// (the same EU AI Office page appeared three times on the public hub).
export function buildStableHash(input: {
  sourceId?: string;
  title: string;
  url: string;
  stableId?: string;
}) {
  const value = [
    input.sourceId?.trim().toLowerCase() ?? "",
    input.stableId?.trim().toLowerCase() ?? "",
    normalizeTitle(input.title),
    normalizeUrl(input.url).toLowerCase(),
  ].join("::");

  return createHash("sha256").update(value).digest("hex");
}

/**
 * In-memory key for "same logical item" checks against rows written before
 * the hash composition above changed. Same source URL + same normalized
 * title = same item, whatever date or excerpt the source shows today.
 */
export function buildIdentityKey(url: string, title: string) {
  return `${normalizeUrl(url).toLowerCase()}::${normalizeTitle(title)}`;
}
