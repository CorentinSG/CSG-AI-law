const frenchMonthMap: Record<string, string> = {
  janvier: "01",
  fevrier: "02",
  "février": "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  aout: "08",
  "août": "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  decembre: "12",
  "décembre": "12",
};

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function resolveAbsoluteUrl(href: string | undefined, baseUrl: string) {
  if (!href) return baseUrl;

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

export function buildStableCandidateId(input: {
  sourceId?: string;
  title: string;
  url: string;
  publicationDate?: string | null;
  externalId?: string | null;
}) {
  const basis = [
    input.sourceId ?? "source",
    input.externalId ?? "",
    normalizeWhitespace(input.title).toLowerCase(),
    input.url.trim().toLowerCase(),
    input.publicationDate ?? "",
  ]
    .filter(Boolean)
    .join("::");

  return basis || input.url.trim().toLowerCase();
}

export function buildExcerpt(value: string, limit = 320) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

export function parseVisibleDate(value: string | null | undefined) {
  if (!value) return null;

  const normalized = normalizeWhitespace(value)
    .replace(",", "")
    .replace(/\u00a0/g, " ");

  const native = new Date(normalized);
  if (!Number.isNaN(native.getTime())) {
    return native.toISOString().slice(0, 10);
  }

  const slashMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const yearMonthMatch = normalized.match(/\b(\d{4})-(\d{2})\b|\b(\d{4})\/(\d{2})\b|\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (yearMonthMatch) {
    const [, yearA, monthA, yearB, monthB, yearC, monthC, dayC] = yearMonthMatch;
    if (yearC && monthC && dayC) {
      return `${yearC}-${monthC}-${dayC}`;
    }
    const year = yearA ?? yearB;
    const month = monthA ?? monthB;
    if (year && month) {
      return `${year}-${month}-01`;
    }
  }

  const frenchMatch = normalized.match(
    /(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/i,
  );
  if (!frenchMatch) return null;

  const [, day, monthLabel, year] = frenchMatch;
  const month = frenchMonthMap[monthLabel.toLowerCase()];
  if (!month) return null;

  return `${year}-${month}-${day.padStart(2, "0")}`;
}
