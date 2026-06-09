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

export function buildStableHash(input: {
  sourceId?: string;
  title: string;
  url: string;
  publicationDate?: string | null;
  stableId?: string;
  text: string;
}) {
  const value = [
    input.sourceId?.trim().toLowerCase() ?? "",
    input.stableId?.trim().toLowerCase() ?? "",
    normalizeTitle(input.title),
    normalizeUrl(input.url).toLowerCase(),
    input.publicationDate?.trim().toLowerCase() ?? "",
    input.text.trim().slice(0, 500).toLowerCase(),
  ].join("::");

  return createHash("sha256").update(value).digest("hex");
}
