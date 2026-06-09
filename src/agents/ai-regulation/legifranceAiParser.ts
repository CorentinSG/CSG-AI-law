import type * as cheerio from "cheerio";

import {
  buildExcerpt,
  buildStableCandidateId,
  normalizeWhitespace,
  parseVisibleDate,
  resolveAbsoluteUrl,
} from "@/agents/ai-regulation/connectors/connector-utils";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";
import type { AuthorityType, DevelopmentType, LegalArea } from "@/db/schema";

function inferLegifranceDevelopmentType(
  title: string,
  url: string,
): DevelopmentType | undefined {
  const haystack = `${title} ${url}`.toLowerCase();

  if (/délibération|deliberation|recommandation/.test(haystack)) {
    return "Agency guidance";
  }
  if (/décret|decret|arrêté|arrete|ordonnance|loi/.test(haystack)) {
    return "Other official regulatory development";
  }
  if (/décision|decision|arrêt|arret|jugement/.test(haystack)) {
    return "Other official regulatory development";
  }

  return undefined;
}

function inferLegifranceAuthorityType(
  title: string,
  url: string,
): AuthorityType | undefined {
  const haystack = `${title} ${url}`.toLowerCase();

  if (/délibération|deliberation|recommandation/.test(haystack)) {
    return "Agency guidance";
  }
  if (/décret|decret|arrêté|arrete|ordonnance|loi/.test(haystack)) {
    return "Binding law";
  }

  return undefined;
}

function inferLegifranceLegalArea(title: string): LegalArea {
  const haystack = title.toLowerCase();

  if (/cnil|rgpd|donnée|donnee|privacy|data/.test(haystack)) {
    return "Data protection";
  }
  if (/service public|administration|public/.test(haystack)) {
    return "Public sector use of AI";
  }

  return "AI governance";
}

function buildLegifranceCandidate(input: {
  source: RegulationSource;
  title: string;
  href: string;
  publicationDate?: string | null;
  excerpt: string;
  contentType: string;
  listingDateText?: string | null;
}) {
  const url = resolveAbsoluteUrl(input.href, input.source.sourceUrl);

  return {
    stableId: buildStableCandidateId({
      sourceId: input.source.id,
      title: input.title,
      url,
      publicationDate: input.publicationDate,
    }),
    title: input.title,
    url,
    text: input.excerpt,
    excerpt: input.excerpt,
    publicationDate: input.publicationDate ?? null,
    sourceName: input.source.name,
    sourceId: input.source.id,
    jurisdictionHint: input.source.jurisdiction,
    developmentTypeHint: inferLegifranceDevelopmentType(input.title, url),
    legalAreaHint: inferLegifranceLegalArea(input.title),
    authorityTypeHint: inferLegifranceAuthorityType(input.title, url),
    metadata: {
      contentType: input.contentType,
      listingDateText: input.listingDateText ?? null,
    },
  } satisfies ExtractedCandidateItem;
}

export function isLegifranceSourceUrl(url: string) {
  return /legifrance\.gouv\.fr/i.test(url);
}

export function isLegifranceChallengePage(html: string) {
  const lower = html.toLowerCase();
  return (
    lower.includes("just a moment") ||
    lower.includes("cf-mitigated") ||
    lower.includes("challenges.cloudflare.com")
  );
}

function parseLegifranceSearchResults(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $("main a[href*='/jorf/id/'], main a[href*='/cnil/id/'], main a[href*='/juri/id/']")
    .slice(0, 14)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const container = link.closest("article, li, section, div");
      const dateText = normalizeWhitespace(
        container.find("time, .date, [class*='date']").first().text(),
      );
      const publicationDate = parseVisibleDate(
        container.find("time").first().attr("datetime") ?? dateText,
      );
      const context = normalizeWhitespace(
        container.find("p, .description, .textUnderTitle").first().text(),
      );

      if (!href || !title) return null;

      return buildLegifranceCandidate({
        source,
        title,
        href,
        publicationDate,
        excerpt: buildExcerpt(
          [title, context || "Official Legifrance AI-related legal-text search result."]
            .filter(Boolean)
            .join(" "),
        ),
        contentType: "legifrance_search_result",
        listingDateText: dateText || null,
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseLegifranceJorfIssue(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const issueDateText = normalizeWhitespace(
    $("main h1, h1").first().text() || $("title").first().text(),
  );
  const issueDate = parseVisibleDate(issueDateText);

  return $("main a[href*='/jorf/id/'], main a[href*='/cnil/id/']")
    .slice(0, 18)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());

      if (!href || !title) return null;

      return buildLegifranceCandidate({
        source,
        title,
        href,
        publicationDate: issueDate,
        excerpt: buildExcerpt(
          `${title}. Official Legifrance JORF issue listing relevant to AI-related French legal developments.`,
        ),
        contentType: "legifrance_jorf_issue",
        listingDateText: issueDateText || null,
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseLegifranceSingleTextPage(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const title = normalizeWhitespace($("main h1, h1").first().text());
  if (!title) return [];

  const dateText = normalizeWhitespace(
    $("main").text().match(/JORF n°.*?du\s+\d{1,2}\s+[A-Za-zéûôàî]+\s+\d{4}/i)?.[0] ??
      $("main time, time").first().text(),
  );
  const publicationDate = parseVisibleDate(dateText);
  const excerpt = buildExcerpt(
    normalizeWhitespace(
      [
        title,
        $("main p").slice(0, 2).text(),
        "Official Legifrance legal text page.",
      ].join(" "),
    ),
  );

  return [
    buildLegifranceCandidate({
      source,
      title,
      href: source.sourceUrl,
      publicationDate,
      excerpt,
      contentType: "legifrance_text_page",
      listingDateText: dateText || null,
    }),
  ];
}

export function parseLegifranceAiMaterials(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const searchResults = parseLegifranceSearchResults($, source);
  if (searchResults.length > 0) return searchResults;

  const jorfIssueResults = parseLegifranceJorfIssue($, source);
  if (jorfIssueResults.length > 0) return jorfIssueResults;

  return parseLegifranceSingleTextPage($, source);
}
