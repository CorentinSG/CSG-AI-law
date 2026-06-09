/**
 * Opaque keyset cursor for stable forward-only pagination on public surfaces.
 * Encodes the last item's sort position so the next-page query can resume
 * exactly where the current page ended, regardless of new items inserted above.
 */
export interface CursorPosition {
  /** publication_date ISO string, or empty string "" when the item has no date. */
  date: string;
  /** ISO timestamp tiebreaker — createdAt for regulatory updates, detectedAt for news items. */
  tiebreaker: string;
}

export function encodeCursor(cursor: CursorPosition): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(
  encoded: string | undefined | null,
): CursorPosition | null {
  if (!encoded) return null;
  try {
    const obj = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    );
    if (
      obj !== null &&
      typeof obj === "object" &&
      typeof obj.date === "string" &&
      typeof obj.tiebreaker === "string"
    ) {
      return { date: obj.date, tiebreaker: obj.tiebreaker };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseCursorParam(
  value: string | string[] | undefined,
): CursorPosition | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return decodeCursor(raw);
}

export function parsePageParam(value: string | string[] | undefined, fallback = 1) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getOffsetFromPage(page: number, pageSize: number) {
  return Math.max(0, (page - 1) * pageSize);
}

export function buildCursorHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  nextCursor: string,
  cursorParamKey = "after",
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (!current || key === cursorParamKey) continue;
    params.set(key, current);
  }
  params.set(cursorParamKey, nextCursor);
  return `${basePath}?${params.toString()}`;
}

export function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  nextPage: number,
  pageParamKey = "page",
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (!current || current === "all" || key === pageParamKey) continue;
    params.set(key, current);
  }
  if (nextPage > 1) {
    params.set(pageParamKey, String(nextPage));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
