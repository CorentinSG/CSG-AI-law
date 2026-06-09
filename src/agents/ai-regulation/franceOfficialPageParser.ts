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

const aiKeywordPattern =
  /intelligence artificielle|artificial intelligence|algorith|ia\b|machine learning|apprentissage automatique/i;

function buildInstitutionalCandidate(input: {
  source: RegulationSource;
  title: string;
  href: string;
  publicationDate?: string | null;
  excerpt: string;
  contentType: string;
  authorityTypeHint?: AuthorityType;
  developmentTypeHint?: DevelopmentType;
  legalAreaHint?: LegalArea;
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
    developmentTypeHint: input.developmentTypeHint,
    legalAreaHint: input.legalAreaHint ?? "AI governance",
    authorityTypeHint: input.authorityTypeHint,
    metadata: {
      contentType: input.contentType,
    },
  } satisfies ExtractedCandidateItem;
}

function detectPageDate($: cheerio.CheerioAPI) {
  const timeValue =
    $("time[datetime]").first().attr("datetime") ??
    $('meta[property="article:published_time"]').attr("content") ??
    $('meta[name="date"]').attr("content") ??
    $('meta[property="og:updated_time"]').attr("content") ??
    $("time").first().text();

  const parsed = parseVisibleDate(timeValue ?? "");
  if (parsed) return parsed;

  const bodyText = normalizeWhitespace($("main, article, body").first().text());
  const match = bodyText.match(
    /\b(\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4})\b/i,
  );

  return parseVisibleDate(match?.[1] ?? "");
}

function buildCurrentPageExcerpt($: cheerio.CheerioAPI, fallbackTitle: string) {
  const candidateText = normalizeWhitespace(
    [
      $("main p").slice(0, 3).text(),
      $("article p").slice(0, 3).text(),
      $('meta[name="description"]').attr("content") ?? "",
    ]
      .filter(Boolean)
      .join(" "),
  );

  return buildExcerpt(candidateText || fallbackTitle);
}

function getInstitutionalTitle($: cheerio.CheerioAPI) {
  return normalizeWhitespace(
    $("main h1, h1").first().text() ||
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $('meta[itemprop="name"]').attr("content") ||
      $("title").first().text(),
  );
}

function collectRelatedLinks(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
  options: {
    maxItems: number;
    allowedHrefPattern?: RegExp;
    titleHint: string;
    defaultAuthorityType: AuthorityType;
    defaultDevelopmentType: DevelopmentType;
  },
) {
  const sourceHost = new URL(source.sourceUrl).hostname.replace(/^www\./, "");
  const seen = new Set<string>();

  return $("a[href]")
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());

      if (!href || !title) return null;
      const looksLikeTargetedOfficialLink =
        options.allowedHrefPattern?.test(href) &&
        /arianeweb|decision|pourvoi|arr[Ãªe]t|\.pdf/i.test(href);
      if (!aiKeywordPattern.test(`${title} ${href}`) && !looksLikeTargetedOfficialLink) {
        return null;
      }
      if (options.allowedHrefPattern && !options.allowedHrefPattern.test(href)) return null;

      const resolved = resolveAbsoluteUrl(href, source.sourceUrl);
      const resolvedHost = new URL(resolved).hostname.replace(/^www\./, "");
      if (resolvedHost !== sourceHost) return null;
      if (seen.has(resolved)) return null;
      seen.add(resolved);

      const nearbyText = normalizeWhitespace(
        link.closest("li, p, section, div, article").text(),
      );

      return buildInstitutionalCandidate({
        source,
        title,
        href: resolved,
        publicationDate: detectPageDate($),
        excerpt: buildExcerpt(
          nearbyText || `${title}. Official French AI-related institutional resource.`,
        ),
        contentType: options.titleHint,
        authorityTypeHint:
          /arianeweb|decision|pourvoi|arr[êe]t/i.test(`${title} ${href}`)
            ? "Other"
            : options.defaultAuthorityType,
        developmentTypeHint:
          /charte|rapport|préconisations|preconisations|avis/i.test(`${title} ${href}`)
            ? options.defaultDevelopmentType
            : options.defaultDevelopmentType,
        legalAreaHint: "AI governance",
      });
    })
    .get()
    .filter(Boolean)
    .slice(0, options.maxItems) as ExtractedCandidateItem[];
}

function parseConseilEtatAiPage(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const title = getInstitutionalTitle($);
  if (!title) return [];
  const publicationDate = detectPageDate($);

  const currentPage = buildInstitutionalCandidate({
    source,
    title,
    href: source.sourceUrl,
    publicationDate,
    excerpt: buildCurrentPageExcerpt($, title),
    contentType: "conseil_etat_ai_page",
    authorityTypeHint: /charte/i.test(title) ? "Governance framework" : "Policy report",
    developmentTypeHint: /charte/i.test(title) ? "Code of practice" : "Policy report",
    legalAreaHint: "AI governance",
  });

  const related = collectRelatedLinks($, source, {
    maxItems: 4,
    allowedHrefPattern: /intelligence-artificielle|arianeweb|\.pdf/i,
    titleHint: "conseil_etat_related_ai_link",
    defaultAuthorityType: "Policy report",
    defaultDevelopmentType: "Policy report",
  });

  return [currentPage, ...related.filter((item) => item.url !== source.sourceUrl)];
}

function parseCourCassationAiPage(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const title = getInstitutionalTitle($);
  if (!title) return [];
  const publicationDate = detectPageDate($);

  const currentPage = buildInstitutionalCandidate({
    source,
    title,
    href: source.sourceUrl,
    publicationDate,
    excerpt: buildCurrentPageExcerpt($, title),
    contentType: "cour_cassation_ai_page",
    authorityTypeHint: "Policy report",
    developmentTypeHint: "Policy report",
    legalAreaHint: "Access to justice",
  });

  const related = collectRelatedLinks($, source, {
    maxItems: 5,
    allowedHrefPattern: /intelligence-artificielle|lia-dans-la-justice|\.pdf/i,
    titleHint: "cour_cassation_related_ai_link",
    defaultAuthorityType: "Policy report",
    defaultDevelopmentType: "Policy report",
  });

  return [currentPage, ...related.filter((item) => item.url !== source.sourceUrl)];
}

function parseDefenseurDesDroitsAiPage(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const title = getInstitutionalTitle($);
  if (!title) return [];
  const publicationDate = detectPageDate($);

  const currentPage = buildInstitutionalCandidate({
    source,
    title,
    href: source.sourceUrl,
    publicationDate,
    excerpt: buildCurrentPageExcerpt($, title),
    contentType: "defenseur_des_droits_ai_page",
    authorityTypeHint: "Policy report",
    developmentTypeHint: "Government announcement",
    legalAreaHint: "Other",
  });

  const related = collectRelatedLinks($, source, {
    maxItems: 4,
    allowedHrefPattern: /intelligence-artificielle|algorith|biometr/i,
    titleHint: "defenseur_des_droits_related_ai_link",
    defaultAuthorityType: "Policy report",
    defaultDevelopmentType: "Government announcement",
  });

  return [currentPage, ...related.filter((item) => item.url !== source.sourceUrl)];
}

export function isConseilEtatSourceUrl(url: string) {
  return /conseil-etat\.fr/i.test(url);
}

export function isCourCassationSourceUrl(url: string) {
  return /courdecassation\.fr/i.test(url);
}

export function isDefenseurDesDroitsSourceUrl(url: string) {
  return /defenseurdesdroits\.fr/i.test(url);
}

export function parseFranceOfficialAiPage(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
) {
  if (isConseilEtatSourceUrl(source.sourceUrl)) {
    return parseConseilEtatAiPage($, source);
  }
  if (isCourCassationSourceUrl(source.sourceUrl)) {
    return parseCourCassationAiPage($, source);
  }
  return parseDefenseurDesDroitsAiPage($, source);
}
