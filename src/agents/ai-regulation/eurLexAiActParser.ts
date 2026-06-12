import * as cheerio from "cheerio";

import {
  buildExcerpt,
  buildStableCandidateId,
} from "@/agents/ai-regulation/connectors/connector-utils";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";

/** CELEX number of Regulation (EU) 2024/1689 (the EU AI Act). */
export const AI_ACT_CELEX = "32024R1689";

export interface EurLexSubdivisionReference {
  id: string;
  label: string;
  title: string;
}

/**
 * Article-level pinpoint genuinely extracted from an EUR-Lex reference.
 * Fields are only populated when actually derived from the URL/CELEX — never
 * inferred or fabricated — so downstream citation-quality scoring can move past
 * `missing_pinpoint`/`partial` only on real evidence.
 */
export interface EurLexPinpoint {
  CELEX?: string;
  article?: string;
  annex?: string;
  chapter?: string;
  recital?: string;
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

/** Extract a CELEX number from any EUR-Lex URL form (ELI path or CELEX query). */
export function extractCelexFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const eliMatch = url.match(/\/eli\/reg\/(\d{4})\/(\d+)\/oj/i);
  if (eliMatch) {
    return `3${eliMatch[1]}R${eliMatch[2].padStart(4, "0")}`;
  }

  const celexMatch = url.match(/(?:CELEX[:%][^&#]*?|uri=CELEX:)\s*([0-9][0-9A-Z]{8,})/i);
  if (celexMatch) {
    return celexMatch[1].toUpperCase();
  }

  return null;
}

/**
 * Parse an EUR-Lex subdivision anchor (e.g. `#art_5`, `#anx_III`, `#cpt_II`,
 * `#rct_12`) into a pinpoint fragment. Only recognised, genuinely-present
 * subdivisions are returned; unknown fragments yield an empty object.
 */
export function parseEurLexSubdivisionFragment(urlOrId: string | null | undefined): EurLexPinpoint {
  if (!urlOrId) return {};

  const fragment = (urlOrId.split("#")[1] ?? urlOrId).trim();
  if (!fragment) return {};

  const article = fragment.match(/^art_(\w+)/i);
  if (article) return { article: article[1].toUpperCase() };

  const annex = fragment.match(/^anx_(\w+)/i);
  if (annex) return { annex: annex[1].toUpperCase() };

  const chapter = fragment.match(/^cpt_(\w+)/i);
  if (chapter) return { chapter: chapter[1].toUpperCase() };

  const recital = fragment.match(/^rct_(\w+)/i);
  if (recital) return { recital: recital[1].toUpperCase() };

  return {};
}

/**
 * Derive an article-level pinpoint from an EUR-Lex reference. CELEX is taken
 * from the URL (or the explicit fallback) and the article/annex/chapter/recital
 * comes from the URL fragment. Returns `null` when nothing concrete is found,
 * so callers never attach an empty pinpoint.
 */
export function deriveEurLexPinpoint(input: {
  url: string | null | undefined;
  celexNumber?: string | null;
}): EurLexPinpoint | null {
  const celex = extractCelexFromUrl(input.url) ?? input.celexNumber ?? null;
  const subdivision = parseEurLexSubdivisionFragment(input.url);

  const pinpoint: EurLexPinpoint = { ...subdivision };
  if (celex) pinpoint.CELEX = celex;

  return Object.keys(pinpoint).length > 0 ? pinpoint : null;
}

/** True for EUR-Lex official document pages (ELI or legal-content), as opposed
 * to the unstable HTML search surface handled elsewhere. */
export function isEurLexDocumentUrl(url: string): boolean {
  if (!/eur-lex\.europa\.eu/i.test(url)) return false;
  return /\/eli\/|\/legal-content\//i.test(url) && !/search\.html/i.test(url);
}

/**
 * Build candidate items from an official EUR-Lex AI Act document page. Emits a
 * single document-level candidate carrying a genuinely-extracted pinpoint
 * (CELEX, plus article/annex when the source URL targets one), the official
 * title and canonical URL. The extracted subdivision inventory is surfaced in
 * metadata for downstream pinpoint enrichment without fabricating per-article
 * authority claims.
 */
export function buildEurLexAiActCandidates(input: {
  html: string;
  source: RegulationSource;
}): ExtractedCandidateItem[] {
  const { html, source } = input;
  const parsed = parseEurLexAiActHtml(html);

  const canonicalUrl = parsed.canonicalUrl ?? source.sourceUrl;
  const title =
    parsed.officialTitle ?? "Regulation (EU) 2024/1689 (Artificial Intelligence Act)";
  const pinpoint = deriveEurLexPinpoint({
    url: source.sourceUrl,
    celexNumber: parsed.celexNumber,
  });

  const targetedArticle = pinpoint?.article
    ? parsed.articles.find((article) => article.id === `art_${pinpoint.article}`)
    : undefined;
  const targetedAnnex = pinpoint?.annex
    ? parsed.annexes.find((annex) => annex.id === `anx_${pinpoint.annex}`)
    : undefined;

  const excerptParts = [
    title,
    targetedArticle ? `${targetedArticle.label}: ${targetedArticle.title}.` : "",
    targetedAnnex ? `${targetedAnnex.label}: ${targetedAnnex.title}.` : "",
    "Official EUR-Lex consolidated AI Act text captured via the structured document channel.",
  ].filter(Boolean);

  return [
    {
      stableId: buildStableCandidateId({
        sourceId: source.id,
        title,
        url: canonicalUrl,
        externalId: parsed.celexNumber ?? AI_ACT_CELEX,
      }),
      title,
      url: canonicalUrl,
      text: buildExcerpt(excerptParts.join(" ")),
      excerpt: buildExcerpt(excerptParts.join(" ")),
      publicationDate: null,
      sourceName: source.name,
      sourceId: source.id,
      jurisdictionHint: source.jurisdiction,
      developmentTypeHint: "Regulation",
      legalAreaHint: "AI governance",
      authorityTypeHint: "Binding law",
      metadata: {
        contentType: "eur_lex_ai_act_document",
        canonicalUrl,
        celexNumber: parsed.celexNumber ?? AI_ACT_CELEX,
        pinpoint: pinpoint ?? undefined,
        chapterCount: parsed.chapters.length,
        articleCount: parsed.articles.length,
        annexCount: parsed.annexes.length,
        parserWarnings: parsed.warnings,
      },
    },
  ];
}
