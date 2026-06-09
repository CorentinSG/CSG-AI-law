import * as cheerio from "cheerio";

export interface EurLexSubdivisionReference {
  id: string;
  label: string;
  title: string;
}

export interface EurLexAiActParseResult {
  canonicalUrl: string | null;
  celexNumber: string | null;
  officialTitle: string | null;
  chapters: EurLexSubdivisionReference[];
  articles: EurLexSubdivisionReference[];
  annexes: EurLexSubdivisionReference[];
  warnings: string[];
}

function normalizeText(value: string) {
  return value.replace(/`+/g, "").replace(/\s+/g, " ").trim();
}

function parseCanonicalUrl($: cheerio.CheerioAPI) {
  const canonicalHref =
    $('link[rel="canonical"]').attr("href") ??
    $('meta[property="og:url"]').attr("content") ??
    null;

  return canonicalHref ? canonicalHref.trim() : null;
}

function parseCelexNumber(canonicalUrl: string | null) {
  if (!canonicalUrl) return null;

  const match = canonicalUrl.match(/\/eli\/reg\/(\d{4})\/(\d+)\/oj/i);
  if (!match) return null;

  return `3${match[1]}R${match[2].padStart(4, "0")}`;
}

function extractOfficialTitle($: cheerio.CheerioAPI) {
  const candidates = [
    $("#title").text(),
    $(".eli-main-title").first().text(),
    $(".oj-doc-ti").first().text(),
    $("title").text(),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function extractStructuredEntries(
  $: cheerio.CheerioAPI,
  selector: string,
  labelSelector: string,
  titleSelector: string,
) {
  return $(selector)
    .toArray()
    .map((element) => {
      const node = $(element);
      const id = node.attr("id")?.trim() ?? "";
      const label = normalizeText(node.find(labelSelector).first().text());
      const title = normalizeText(node.find(titleSelector).first().text());

      if (!id || !label || !title) return null;

      return {
        id,
        label,
        title,
      };
    })
    .filter((entry): entry is EurLexSubdivisionReference => entry !== null);
}

export function parseEurLexAiActHtml(html: string): EurLexAiActParseResult {
  const $ = cheerio.load(html);
  const canonicalUrl = parseCanonicalUrl($);
  const celexNumber = parseCelexNumber(canonicalUrl);
  const officialTitle = extractOfficialTitle($);

  const chapters = extractStructuredEntries(
    $,
    "div.eli-subdivision[id^='cpt_']",
    "p.oj-ti-section-1",
    "div.eli-title",
  );
  const articles = extractStructuredEntries(
    $,
    "div.eli-subdivision[id^='art_']",
    "p.oj-ti-art",
    "div.eli-title",
  );
  const annexes = $("div.eli-container[id^='anx_']")
    .toArray()
    .map((element) => {
      const node = $(element);
      const id = node.attr("id")?.trim() ?? "";
      const labels = node
        .find("p.oj-doc-ti")
        .toArray()
        .map((labelNode) => normalizeText($(labelNode).text()))
        .filter(Boolean);

      const [label = "", title = ""] = labels;
      if (!id || !label || !title) return null;

      return {
        id,
        label,
        title,
      };
    })
    .filter((entry): entry is EurLexSubdivisionReference => entry !== null);

  const warnings: string[] = [];

  if (!canonicalUrl) warnings.push("Canonical EUR-Lex URL was not detected.");
  if (!celexNumber) warnings.push("CELEX number could not be derived from canonical URL.");
  if (!officialTitle) warnings.push("Official title could not be extracted from the HTML.");
  if (articles.length === 0) warnings.push("No AI Act articles were extracted from the HTML.");
  if (annexes.length === 0) warnings.push("No AI Act annexes were extracted from the HTML.");

  return {
    canonicalUrl,
    celexNumber,
    officialTitle,
    chapters,
    articles,
    annexes,
    warnings,
  };
}
