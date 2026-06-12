import * as cheerio from "cheerio";

import {
  buildExcerpt,
  buildStableCandidateId,
  normalizeWhitespace,
  parseVisibleDate,
  resolveAbsoluteUrl,
} from "@/agents/ai-regulation/connectors/connector-utils";
import { fetchTextWithConditionalCaching } from "@/agents/ai-regulation/connectors/conditional-fetch";
import {
  isConseilEtatSourceUrl,
  isCourCassationSourceUrl,
  isDefenseurDesDroitsSourceUrl,
  parseFranceOfficialAiPage,
} from "@/agents/ai-regulation/franceOfficialPageParser";
import {
  isLegifranceChallengePage,
  isLegifranceSourceUrl,
  parseLegifranceAiMaterials,
} from "@/agents/ai-regulation/legifranceAiParser";
import {
  buildEurLexAiActCandidates,
  isEurLexDocumentUrl,
} from "@/agents/ai-regulation/eurLexAiActParser";
import type {
  ConnectorScanResult,
  SourceConnector,
} from "@/agents/ai-regulation/connectors/types";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";
import { authorityTypes } from "@/db/schema";
import type { AuthorityType, DevelopmentType, LegalArea } from "@/db/schema";

function uniqueByUrl(items: ExtractedCandidateItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function getConfiguredCrawlDelayMs(source: RegulationSource) {
  const delaySeconds = source.config?.crawlDelaySeconds;
  if (typeof delaySeconds !== "number" || !Number.isFinite(delaySeconds)) {
    return 0;
  }

  return Math.max(0, delaySeconds) * 1000;
}

// P-SRC1: any official source can opt into honest degradation instead of a
// scan-breaking throw when the runtime is blocked (HTTP error / fetch failure).
// Generalizes the bespoke Legifrance / NY-Courts handling via config so new
// official-page sources can be registered safely before a dedicated parser or
// an allowed access path (e.g. the Scrapling worker) exists.
function shouldHonestlyDegrade(source: RegulationSource) {
  return source.config?.honestDegradeOnError === true;
}

async function waitForCrawlDelay(source: RegulationSource) {
  const delayMs = getConfiguredCrawlDelayMs(source);
  if (delayMs === 0) return;

  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function buildCandidateItem(input: {
  source: RegulationSource;
  title: string;
  href: string;
  publicationDate?: string | null;
  excerpt: string;
  developmentTypeHint?: DevelopmentType;
  legalAreaHint?: LegalArea;
  authorityTypeHint?: AuthorityType;
  metadata?: Record<string, unknown>;
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
    legalAreaHint: input.legalAreaHint,
    authorityTypeHint: input.authorityTypeHint,
    metadata: input.metadata ?? {},
  } satisfies ExtractedCandidateItem;
}

function parseWhiteHouse(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $("li.wp-block-post, .wp-block-post")
    .slice(0, 20)
    .map((_, element) => {
      const container = $(element);
      const link = container.find("h2 a, .wp-block-post-title a").first();
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const category = normalizeWhitespace(
        container.find(".taxonomy-category, .wp-block-post-terms").text(),
      );
      const dateText = normalizeWhitespace(
        container.find(".wp-block-post-date time").first().text(),
      );
      const publicationDate = parseVisibleDate(dateText);
      const excerpt = buildExcerpt(
        [title, category, dateText].filter(Boolean).join(". "),
      );

      if (!href || !title) return null;

      const url = resolveAbsoluteUrl(href, source.sourceUrl);
      const item: ExtractedCandidateItem = {
        stableId: buildStableCandidateId({
          sourceId: source.id,
          title,
          url,
          publicationDate,
        }),
        title,
        url,
        text: excerpt,
        excerpt,
        publicationDate,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: source.jurisdiction,
        developmentTypeHint: /executive orders/i.test(category)
          ? "Executive order"
          : /proclamations/i.test(category)
            ? "Government announcement"
            : undefined,
        legalAreaHint: /ai|artificial intelligence/i.test(title) ? "AI governance" : undefined,
        metadata: {
          category,
          listingDateText: dateText,
          contentType: "white_house_listing",
        },
      };

      return item;
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseCnil(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const sectionIntro = normalizeWhitespace(
    $(".articles-associes")
      .prevAll("div, p")
      .slice(0, 2)
      .text(),
  );

  return $(".articles-associes .article")
    .slice(0, 12)
    .map((_, element) => {
      const container = $(element);
      const link = container.find(".titre a").first();
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const dateText = normalizeWhitespace(container.find(".date").first().text());
      const publicationDate = parseVisibleDate(dateText);
      const text = buildExcerpt(
        [title, sectionIntro, "CNIL official AI and algorithms resource."]
          .filter(Boolean)
          .join(" "),
      );

      if (!href || !title) return null;

      const url = resolveAbsoluteUrl(href, source.sourceUrl);
      const item: ExtractedCandidateItem = {
        stableId: buildStableCandidateId({
          sourceId: source.id,
          title,
          url,
          publicationDate,
        }),
        title,
        url,
        text,
        excerpt: text,
        publicationDate,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: source.jurisdiction,
        legalAreaHint: /rgpd|protection|données|donnees|webscraping/i.test(title)
          ? "Data protection"
          : "AI governance",
        developmentTypeHint: /webinaire|outil|guide|recommandation/i.test(title)
          ? "Agency guidance"
          : undefined,
        metadata: {
          listingDateText: dateText,
          contentType: "cnil_associated_article",
          pageSection: "articles_associes",
        },
      };

      return item;
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseOecd(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $("app-post-card .card--post, .card--post")
    .slice(0, 20)
    .map((_, element) => {
      const container = $(element);
      const link = container.find("a.ghost").first();
      const href = link.attr("href");
      const title = normalizeWhitespace(container.find("h4, h3").first().text());
      const excerpt = buildExcerpt(
        normalizeWhitespace(container.find(".excerpt").first().text()) || title,
      );
      const category = normalizeWhitespace(
        container.find(".has-text-link").first().text(),
      );
      const dateText = normalizeWhitespace(
        container.find(".xsmall-meta span").first().text(),
      );
      const publicationDate = parseVisibleDate(dateText);

      if (!href || !title) return null;

      const url = resolveAbsoluteUrl(href, source.sourceUrl);
      const item: ExtractedCandidateItem = {
        stableId: buildStableCandidateId({
          sourceId: source.id,
          title,
          url,
          publicationDate,
        }),
        title,
        url,
        text: [title, excerpt, category].filter(Boolean).join(" "),
        excerpt,
        publicationDate,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: source.jurisdiction,
        legalAreaHint: /government|public|transparency|procurement/i.test(
          `${title} ${excerpt} ${category}`,
        )
          ? "Public sector use of AI"
          : "AI governance",
        developmentTypeHint: /government|intergovernmental/i.test(category)
          ? "Policy report"
          : undefined,
        authorityTypeHint: /principles|recommendation|framework/i.test(
          `${title} ${excerpt} ${category}`,
        )
          ? "Soft law"
          : "Policy report",
        metadata: {
          category,
          listingDateText: dateText,
          contentType: "oecd_post_card",
        },
      };

      return item;
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseEdpb(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $(".views-row .node--type-edpb-publication, .views-row")
    .slice(0, 16)
    .map((_, element) => {
      const container = $(element);
      const link = container.find("h4 a, .node__title a").first();
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const dateText = normalizeWhitespace(
        container.find(".news-date, time, .date").first().text(),
      );
      const publicationType = normalizeWhitespace(
        container.find(".publication-type-list a").first().text(),
      );
      const topics = container
        .find(".topic-list a")
        .map((__, topic) => normalizeWhitespace($(topic).text()))
        .get()
        .filter(Boolean);
      const publicationDate = parseVisibleDate(dateText);
      const excerpt = buildExcerpt(
        [title, publicationType, topics.join(", ")]
          .filter(Boolean)
          .join(". "),
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate,
        excerpt,
        developmentTypeHint: /consultation/i.test(publicationType)
          ? "Public consultation"
          : "Agency guidance",
        legalAreaHint: "Data protection",
        authorityTypeHint: "Agency guidance",
        metadata: {
          publicationType,
          topics,
          listingDateText: dateText,
          contentType: "edpb_topic_listing",
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseNist(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const selectors = [
    "aside .usa-sidenav__item a[href*='ai-risk-management-framework']",
    "main a[href*='/itl/ai-risk-management-framework/']",
    "main a[href*='/programs-projects/concept-note-ai-rmf-profile-']",
    "main a[href*='/publications/artificial-intelligence-risk-management-framework']",
    "main a[href*='nvlpubs.nist.gov']",
    "main a[href*='/document/about-nist-ai-rmf']",
  ].join(", ");

  return $(selectors)
    .slice(0, 18)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const context = normalizeWhitespace(
        link.closest("li, p, div, section").text() || "",
      );
      const dateText = normalizeWhitespace(
        link.closest("li, p, div, section")
          .find("time, .date")
          .first()
          .text(),
      );
      const publicationDate = parseVisibleDate(dateText);
      const excerpt = buildExcerpt(
        context.length > title.length
          ? context
          : `NIST AI RMF resource: ${title}. Official framework material from the NIST AI Risk Management Framework hub.`,
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate,
        excerpt,
        developmentTypeHint: /\.pdf$/i.test(href) ? "Standards document" : "Agency guidance",
        legalAreaHint: "AI governance",
        authorityTypeHint: "Governance framework",
        metadata: {
          listingDateText: dateText,
          contentType: "nist_ai_rmf_link",
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseCfpb(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const pageTitle = normalizeWhitespace($("main h1").first().text());
  const pageDate = parseVisibleDate(
    $("time[datetime]").last().attr("datetime") ??
      $("time").last().text(),
  );

  return $("main a[href*='ai-compliance-plan']")
    .slice(0, 4)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text()) || pageTitle;
      const excerpt = buildExcerpt(
        normalizeWhitespace(
          link.closest("p, div, section").prevAll("p").slice(0, 2).text() ||
            link.closest("p, div, section").text() ||
            pageTitle,
        ),
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate: pageDate,
        excerpt,
        developmentTypeHint: "Agency guidance",
        legalAreaHint: "Financial services",
        authorityTypeHint: "Agency guidance",
        metadata: {
          contentType: "cfpb_ai_compliance_plan",
          pageTitle,
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseSec(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const pageDate = parseVisibleDate(
    $(".date-modified .nowrap").first().text(),
  );

  return $("main a[href*='ai-compliance-plan'], main a[href*='ai-use-case']")
    .slice(0, 12)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const sectionHeading = normalizeWhitespace(
        link.parent().prevAll("h4").first().text(),
      );
      const excerpt = buildExcerpt(
        normalizeWhitespace(
          [sectionHeading, link.closest("p, li").text()].filter(Boolean).join(". "),
        ) || title,
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate: pageDate,
        excerpt,
        developmentTypeHint: /compliance plan/i.test(title)
          ? "Agency guidance"
          : "Government announcement",
        legalAreaHint: "Financial services",
        authorityTypeHint: "Agency guidance",
        metadata: {
          sectionHeading,
          contentType: "sec_ai_resources",
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseNydfs(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const aiSection = $("section")
    .filter((_, element) =>
      /artificial intelligence/i.test(
        normalizeWhitespace($(element).find("h2").first().text()),
      ),
    )
    .first();

  return aiSection
    .find("a[href]")
    .slice(0, 8)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const excerpt = buildExcerpt(
        normalizeWhitespace(
          aiSection.find(".wysiwyg--field-webny-wysiwyg-body").first().text(),
        ) || title,
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        excerpt,
        developmentTypeHint: /guidance|letter/i.test(title)
          ? "Agency guidance"
          : "Government announcement",
        legalAreaHint: "Financial services",
        authorityTypeHint: "Agency guidance",
        metadata: {
          contentType: "nydfs_ai_section",
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseIco(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const pageDate = parseVisibleDate(
    $('meta[name="DC.Date"]').attr("content") ??
      $("time[datetime]").first().attr("datetime") ??
      "",
  );

  return $("main h3 a[href], .rich-text h3 a[href]")
    .slice(0, 12)
    .map((_, element) => {
      const link = $(element);
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const excerpt = buildExcerpt(
        normalizeWhitespace(
          link.closest("h3").next("p").text() ||
            link.parent().parent().next("p").text(),
        ) || title,
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate: pageDate,
        excerpt,
        developmentTypeHint: "Agency guidance",
        legalAreaHint: /biometric/i.test(title)
          ? "Biometric identification"
          : "Data protection",
        authorityTypeHint: "Agency guidance",
        metadata: {
          contentType: "ico_ai_guidance_link",
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function isNyCourtsAiSourceUrl(url: string) {
  return (
    /nycourts\.gov/i.test(url) &&
    (/\/rules\/chiefadmin\/161\.shtml/i.test(url) ||
      /\/rules\/chief-admin-100-161/i.test(url))
  );
}

function parseNyCourtsAiMaterials(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const pageText = normalizeWhitespace($("main, body").text());
  const items: ExtractedCandidateItem[] = [];
  const detailTitle =
    normalizeWhitespace($("h1").first().text()) ||
    "PART 161. Use of Artificial Intelligence Technology";

  if (/part 161\.\s*use of artificial intelligence technology/i.test(pageText)) {
    const addedMatch = pageText.match(/Added Part 161 on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
    const effectiveMatch = pageText.match(/effective\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
    const publicationDate = parseVisibleDate(addedMatch?.[1] ?? "");
    const effectiveDate = parseVisibleDate(effectiveMatch?.[1] ?? "");
    const scope: string[] = [];
    if (/civil cases?|civil actions?/i.test(pageText)) scope.push("civil cases");
    if (/criminal cases?|criminal matters?/i.test(pageText)) scope.push("criminal cases");
    const orderLink = $("a[href]")
      .filter((_, element) => {
        const href = $(element).attr("href") ?? "";
        return /administrativeorder|a\.o\.|comments\/pdf/i.test(href);
      })
      .first();
    const orderHref = orderLink.attr("href");
    const orderUrl = orderHref
      ? resolveAbsoluteUrl(orderHref, source.sourceUrl)
      : null;

    items.push({
      stableId: buildStableCandidateId({
        sourceId: source.id,
        title: detailTitle,
        url: source.sourceUrl,
        publicationDate,
        externalId: "nycourts-part-161",
      }),
      title: detailTitle,
      url: source.sourceUrl,
      text: buildExcerpt(
        "Official New York State Unified Court System Part 161 rule governing use of artificial intelligence technology in preparing court papers. Added March 25, 2026 and effective June 1, 2026. Attorneys and parties using AI must independently ensure that filings contain no fabricated or fictitious authorities or other material.",
      ),
      excerpt: buildExcerpt(
        "Official NY Courts Part 161 rule on AI use in court papers, including effective date and attorney review obligations.",
      ),
      publicationDate,
      sourceName: source.name,
      sourceId: source.id,
      jurisdictionHint: source.jurisdiction,
      developmentTypeHint: "Final rule",
      legalAreaHint: "Professional responsibility",
      authorityTypeHint: "Binding law",
      metadata: {
        contentType: "nycourts_part_161_rule",
        effectiveDate,
        historicalNoteDate: publicationDate,
        administrativeOrderId: "AO/75/2026",
        administrativeOrderUrl: orderUrl,
        authorityClassification: "binding_court_rule",
        applicableForum: "New York State Unified Court System",
        scope,
      },
    });

    if (orderUrl) {
      items.push({
        stableId: buildStableCandidateId({
          sourceId: source.id,
          title: "Administrative Order of the Chief Administrative Judge adding Part 161 (AO/75/2026)",
          url: orderUrl,
          publicationDate,
          externalId: "nycourts-ao-75-2026",
        }),
        title:
          "Administrative Order of the Chief Administrative Judge adding Part 161 (AO/75/2026)",
        url: orderUrl,
        text: buildExcerpt(
          "Official New York Courts administrative order AO/75/2026 adding Part 161 to the Rules of the Chief Administrator, effective June 1, 2026.",
        ),
        excerpt: buildExcerpt(
          "Official NY Courts administrative order promulgating Part 161, effective June 1, 2026.",
        ),
        publicationDate,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: source.jurisdiction,
        developmentTypeHint: "Other official regulatory development",
        legalAreaHint: "Professional responsibility",
        authorityTypeHint: "Binding law",
        metadata: {
          contentType: "nycourts_administrative_order_pdf",
          effectiveDate,
          administrativeOrderId: "AO/75/2026",
          authorityClassification: "administrative_court_rule_order",
          applicableForum: "New York State Unified Court System",
          scope,
        },
      });
    }

    return items;
  }

  const listingLink = $("a[href*='/rules/chiefadmin/161.shtml']").first();
  const href = listingLink.attr("href");
  const title = normalizeWhitespace(listingLink.text());

  if (href && title) {
    return [
      buildCandidateItem({
        source,
        title,
        href,
        excerpt: buildExcerpt(
          "Official New York Courts chief-admin rules index linking to Part 161 on use of artificial intelligence technology.",
        ),
        developmentTypeHint: "Final rule",
        legalAreaHint: "Professional responsibility",
        authorityTypeHint: "Binding law",
        metadata: {
          contentType: "nycourts_chief_admin_listing",
          authorityClassification: "binding_court_rule",
          applicableForum: "New York State Unified Court System",
        },
      }),
    ];
  }

  return [];
}

function detectPossibleOfficialSource(url: string, sourceLabel: string) {
  const lowerUrl = url.toLowerCase();
  const lowerSourceLabel = sourceLabel.toLowerCase();
  const officialSignals = [
    ".gov/",
    ".gov",
    ".gouv.fr",
    ".bund.de",
    ".europa.eu",
    "legifrance.gouv.fr",
    "cnil.fr",
    "edpb.europa.eu",
    "edps.europa.eu",
    "nist.gov",
    "whitehouse.gov",
    "federalregister.gov",
    "aepd.es",
    "garanteprivacy.it",
    "autoriteitpersoonsgegevens.nl",
    "rijksoverheid.nl",
    "bundestag.de",
    "boe.es",
  ];
  const sourceSignals = [
    "commission.europa.eu",
    "europa.eu",
    "cnil.fr",
    "edpb",
    "edps",
    "whitehouse.gov",
    "federalregister.gov",
    "ftc.gov",
    "sec.gov",
    "consumerfinance.gov",
    "eeoc.gov",
    "nist.gov",
    "legifrance",
    "aepd",
    "garante",
    "autoriteit",
    "rijksoverheid",
  ];

  return (
    officialSignals.some((signal) => lowerUrl.includes(signal)) ||
    sourceSignals.some((signal) => lowerSourceLabel.includes(signal))
  );
}

function detectPossibleJurisdiction(title: string, outboundUrl: string, sourceLabel: string) {
  const haystack = `${title} ${outboundUrl} ${sourceLabel}`.toLowerCase();

  if (/cnil|france|legifrance|gouv\.fr/.test(haystack)) return "France";
  if (
    /european|eu ai act|eu ai office|eur-lex|commission\.europa|edpb|edps|cjeu|europa\.eu/.test(
      haystack,
    )
  ) {
    return "European Union";
  }
  if (
    /ftc|white house|federal register|u\.s\.|united states|cfpb|sec|eeoc|nist|ca\.gov|ny\.gov/.test(
      haystack,
    )
  ) {
    return "United States";
  }

  return "Needs verification";
}

function detectPossibleTopic(title: string, beat: string) {
  const haystack = `${title} ${beat}`.toLowerCase();

  if (/case|court|tribunal|judge|lawsuit|litigation|decision/.test(haystack)) {
    return "Possible case law";
  }
  if (/enforcement|fine|penalt|investigation|probe/.test(haystack)) {
    return "Possible enforcement";
  }
  if (/standard|nist|iso|owasp|framework|code/.test(haystack)) {
    return "Possible soft law or standards";
  }
  if (/guidance|consultation|draft|regulation|law|ai act|policy/.test(haystack)) {
    return "Possible regulation or guidance";
  }

  return "Needs verification";
}

function buildDiscoveryMetadata(input: {
  source: RegulationSource;
  title: string;
  outboundUrl: string;
  sourceLabel?: string;
  relativeTime?: string;
  beat?: string;
  score?: string;
  isAlert?: boolean;
  excerpt?: string;
}) {
  const possibleOfficialSourceFound = detectPossibleOfficialSource(
    input.outboundUrl,
    input.sourceLabel ?? "",
  );
  const possibleJurisdiction = detectPossibleJurisdiction(
    input.title,
    input.outboundUrl,
    input.sourceLabel ?? "",
  );
  const possibleTopic = detectPossibleTopic(input.title, input.beat ?? "");

  return {
    contentType: "informal_discovery_lead",
    discoveryLead: true,
    discoveryHeadline: input.title,
    discoverySourceName: input.source.name,
    discoverySourceUrl: input.source.sourceUrl,
    discoveryOutboundUrl: input.outboundUrl,
    discoveryDetectedDate: new Date().toISOString(),
    discoveryRelativeTime: input.relativeTime ?? null,
    discoveryBeat: input.beat ?? null,
    discoveryScore: input.score ?? null,
    discoveryAlert: input.isAlert ?? false,
    discoverySourceLabel: input.sourceLabel ?? null,
    discoveryExcerpt: input.excerpt ?? null,
    possibleJurisdiction,
    possibleTopic,
    possibleOfficialSourceFound,
    possibleOfficialSourceUrl: possibleOfficialSourceFound ? input.outboundUrl : null,
    corroboratingSourceFound: false,
    corroboratingSourceUrl: null,
    discoveryVerificationStatus: possibleOfficialSourceFound
      ? "official_source_candidate_identified"
      : "official_source_not_yet_identified",
    discoveryConversionStatus: "discovery_only",
    discoveryReviewerNotes:
      "Non-official discovery lead - requires official verification and cross-source corroboration.",
  };
}

function parseAiWeeklyDiscovery(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $("#live-stories .dash__story, .dash__stories .dash__story")
    .slice(0, 24)
    .map((_, element) => {
      const container = $(element);
      const link = container.find("a.dash__story-headline").first();
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const sourceLabel = normalizeWhitespace(
        container.find(".dash__story-source").first().text(),
      );
      const relativeTime = normalizeWhitespace(
        container.find(".dash__story-time").first().text(),
      );
      const beat = normalizeWhitespace(container.attr("data-beat") ?? "");
      const score = normalizeWhitespace(
        container.find(".dash__story-score").first().text(),
      );
      const isAlert = container.find(".dash__alert-badge").length > 0;

      if (!href || !title) return null;

      const metadata = buildDiscoveryMetadata({
        source,
        title,
        outboundUrl: href,
        sourceLabel,
        relativeTime,
        beat,
        score,
        isAlert,
      });
      const excerpt = buildExcerpt(
        [
          `AI Weekly discovery lead.`,
          sourceLabel ? `Outbound source: ${sourceLabel}.` : "",
          beat ? `Beat: ${beat}.` : "",
          relativeTime ? `Seen ${relativeTime}.` : "",
          "Non-official discovery lead; official-source verification is required before publication.",
        ]
          .filter(Boolean)
          .join(" "),
      );

      return buildCandidateItem({
        source,
        title,
        href,
        excerpt,
        legalAreaHint:
          /privacy|data protection|biometric|dpa/i.test(title)
            ? "Data protection"
            : /ethics|lawyer|professional responsibility/i.test(title)
              ? "Professional responsibility"
              : /court|decision|litigation/i.test(title)
                ? "Access to justice"
                : "AI governance",
        metadata,
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseGlobalPolicyWatchDiscovery(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $("article, .post, .type-post")
    .slice(0, 12)
    .map((_, element) => {
      const container = $(element);
      const link = container
        .find(
          "h1 a, h2 a, h3 a, .entry-title a, .lxb_af-template_tags-get_linked_post_title-link",
        )
        .first();
      const href = link.attr("href");
      const title = normalizeWhitespace(link.text());
      const dateText = normalizeWhitespace(
        container.find("time, .posted-on, .entry-date, [class*='date']").first().text(),
      );
      const publicationDate = parseVisibleDate(
        container.find("time").first().attr("datetime") ?? dateText,
      );
      const categories = container
        .find(".cat-links a, .post-categories a, a[rel='category tag'], a[href*='/category/']")
        .map((__, category) => normalizeWhitespace($(category).text()))
        .get()
        .filter(Boolean);
      const excerptText = normalizeWhitespace(
        container.find(".entry-summary, .excerpt, .lxb_af-post_content, p").first().text(),
      );

      if (!href || !title) return null;

      const excerpt = buildExcerpt(
        [
          excerptText || title,
          "Informal Global Policy Watch discovery lead.",
          "Official-source verification and cross-source corroboration are required before publication.",
        ].join(" "),
      );
      const categoryText = categories.join(", ");
      const metadata = buildDiscoveryMetadata({
        source,
        title,
        outboundUrl: href,
        sourceLabel: "Global Policy Watch",
        relativeTime: dateText || undefined,
        beat: categoryText || undefined,
        excerpt,
      });

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate,
        excerpt,
        legalAreaHint:
          /privacy|data protection|gdpr|dpa/i.test(`${title} ${excerpt}`)
            ? "Data protection"
            : /employment|workplace/i.test(`${title} ${excerpt}`)
              ? "Employment"
              : /copyright|generative/i.test(`${title} ${excerpt}`)
                ? "Copyright and generative AI"
                : "AI governance",
        metadata: {
          ...metadata,
          contentType: "global_policy_watch_discovery_lead",
          categories,
          listingDateText: dateText || null,
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseEurLexSearch(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  return $(".SearchResult")
    .slice(0, 12)
    .map((_, element) => {
      const container = $(element);
      const titleLink = container.find("h2 a.title").first();
      const href = titleLink.attr("href");
      const title = normalizeWhitespace(titleLink.text());
      const metadataText = normalizeWhitespace(
        container.find(".textUnderTitle").first().text(),
      );
      const celexNumber = normalizeWhitespace(
        container
          .find("dt")
          .filter((__, dt) => $(dt).text().includes("CELEX number"))
          .next("dd")
          .first()
          .text(),
      );
      const form = normalizeWhitespace(
        container
          .find("dt")
          .filter((__, dt) => $(dt).text().includes("Form"))
          .next("dd")
          .first()
          .text(),
      );
      const documentDate = normalizeWhitespace(
        container
          .find("dt")
          .filter((__, dt) => $(dt).text().includes("Date of document"))
          .next("dd")
          .first()
          .text(),
      );
      const legalStatus = normalizeWhitespace(
        container.find(".DocStatus").first().text(),
      );
      const eli = container.find("a[href*='data.europa.eu/eli']").first().attr("href");
      const publicationDate = parseVisibleDate(documentDate || metadataText);
      const excerpt = buildExcerpt(
        [
          title,
          form,
          legalStatus,
          metadataText,
          celexNumber ? `CELEX ${celexNumber}` : "",
        ]
          .filter(Boolean)
          .join(". "),
      );

      if (!href || !title) return null;

      return buildCandidateItem({
        source,
        title,
        href,
        publicationDate,
        excerpt,
        developmentTypeHint: /regulation/i.test(form)
          ? "Regulation"
          : /directive|decision/i.test(form)
            ? "Other official regulatory development"
            : /proposal/i.test(title)
              ? "Proposed rule"
              : /communication|working document|report/i.test(title)
                ? "Policy report"
                : undefined,
        legalAreaHint: "AI governance",
        authorityTypeHint: /recommendation/i.test(form)
          ? "Soft law"
          : /working document|communication|report/i.test(title)
            ? "Policy report"
            : /proposal/i.test(title)
              ? "Proposed law"
              : /regulation|directive|decision/i.test(form)
                ? "Regulation"
                : undefined,
        metadata: {
          celexNumber,
          form,
          legalStatus,
          eli: eli ?? null,
          listingDateText: metadataText,
          documentDateText: documentDate,
          contentType: "eur_lex_search_result",
        },
      });
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function parseOwaspAima(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const title = normalizeWhitespace($("h1").first().text()) || "OWASP AI Maturity Assessment";
  const description = normalizeWhitespace(
    $('meta[name="description"]').attr("content") ??
      $("main p").slice(0, 2).text(),
  );
  const roadmapText = normalizeWhitespace($("#sec-roadmap, #div-roadmap, body").text());
  const releaseDateMatch = roadmapText.match(
    /On\s+([A-Za-z]+),?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\s+Version\s+1\.0/i,
  );
  const publicationDate = releaseDateMatch
    ? parseVisibleDate(
        `${releaseDateMatch[1]} ${releaseDateMatch[2]} ${releaseDateMatch[3]}`,
      )
    : null;
  const toolkitLink = $('a[href*="OWASP-AIMA_V1.pdf"]').first().attr("href");
  const excerpt = buildExcerpt(
    `${description}. Community-driven OWASP framework for responsible, secure, and effective AI integration.`,
  );

  return [
    {
      stableId: buildStableCandidateId({
        sourceId: source.id,
        title,
        url: source.sourceUrl,
        publicationDate,
        externalId: "owasp-aima",
      }),
      title,
      url: source.sourceUrl,
      text: excerpt,
      excerpt,
      publicationDate,
      sourceName: source.name,
      sourceId: source.id,
      jurisdictionHint: source.jurisdiction,
      developmentTypeHint: "Code of practice",
      legalAreaHint: "AI governance",
      authorityTypeHint: "Best practice",
      metadata: {
        contentType: "owasp_aima_page",
        toolkitLink: toolkitLink ?? null,
        releaseStatement: releaseDateMatch ? releaseDateMatch[0] : null,
      },
    },
  ];
}

function parseIso42001(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const title = normalizeWhitespace($("h1").first().text()) || normalizeWhitespace($("title").text());
  const description = normalizeWhitespace(
    $('meta[name="description"]').attr("content") ?? "",
  );
  const canonical = $('link[rel="canonical"]').attr("href") || source.sourceUrl;
  const publicationDate = parseVisibleDate(
    $("#publicationDate [itemprop='releaseDate']").first().text(),
  );
  const publicationStatus = normalizeWhitespace($("#publicationStatus").text());
  const stage = normalizeWhitespace($("#stageId").text());
  const technicalCommittee = normalizeWhitespace(
    $("a[href*='/committee/']").first().text(),
  );
  const excerpt = buildExcerpt(
    `${description}. ${publicationStatus}. ${stage}. Full standard text may be paywalled; only official public metadata is captured.`,
  );

  return [
    {
      stableId: buildStableCandidateId({
        sourceId: source.id,
        title,
        url: canonical,
        publicationDate,
        externalId: "iso-iec-42001",
      }),
      title,
      url: canonical,
      text: excerpt,
      excerpt,
      publicationDate,
      sourceName: source.name,
      sourceId: source.id,
      jurisdictionHint: source.jurisdiction,
      developmentTypeHint: "Standards document",
      legalAreaHint: "AI governance",
      authorityTypeHint: "Technical standard",
      metadata: {
        contentType: "iso_standard_page",
        publicationStatus,
        stage,
        technicalCommittee,
        paywalledFullText: true,
      },
    },
  ];
}

function parseGeneric(
  $: cheerio.CheerioAPI,
  source: RegulationSource,
): ExtractedCandidateItem[] {
  const configuredAuthorityHintValue = source.config?.authorityTypeHint;
  const configuredAuthorityTypeHint =
    typeof configuredAuthorityHintValue === "string" &&
    authorityTypes.includes(configuredAuthorityHintValue as AuthorityType)
      ? (configuredAuthorityHintValue as AuthorityType)
      : undefined;
  const titleSelector =
    typeof source.config?.titleSelector === "string"
      ? source.config.titleSelector
      : null;
  const itemSelector =
    typeof source.config?.itemSelector === "string"
      ? source.config.itemSelector
      : "article";
  const linkSelector =
    typeof source.config?.linkSelector === "string"
      ? source.config.linkSelector
      : "a";
  const dateSelector =
    typeof source.config?.dateSelector === "string"
      ? source.config.dateSelector
      : "time, .date";
  const excerptSelector =
    typeof source.config?.excerptSelector === "string"
      ? source.config.excerptSelector
      : "p";
  const maxItems =
    typeof source.config?.maxItems === "number" && source.config.maxItems > 0
      ? source.config.maxItems
      : 12;

  return $(itemSelector)
    .slice(0, maxItems)
    .map((_, element) => {
      const container = $(element);
      const link =
        linkSelector === "self" || container.is("a")
          ? container
          : container.find(linkSelector).first();
      const href = link.attr("href");
      const explicitTitle = titleSelector
        ? normalizeWhitespace(container.find(titleSelector).first().text())
        : "";
      const title = normalizeWhitespace(
        explicitTitle || link.text() || container.text().slice(0, 120),
      );
      const excerpt = buildExcerpt(
        normalizeWhitespace(container.find(excerptSelector).first().text()) ||
          normalizeWhitespace(container.text()),
      );
      const dateElement = container.find(dateSelector).first();
      const dateText = normalizeWhitespace(
        dateElement.text() ||
          dateElement.attr("datetime") ||
          dateElement.attr("content") ||
          container.attr("datetime") ||
          "",
      );
      const publicationDate = parseVisibleDate(dateText);

      if (!title || !href) return null;

      const url = resolveAbsoluteUrl(href, source.sourceUrl);
      const item: ExtractedCandidateItem = {
        stableId: buildStableCandidateId({
          sourceId: source.id,
          title,
          url,
          publicationDate,
        }),
        title: title || "Untitled official update",
        url,
        text: excerpt,
        excerpt,
        publicationDate,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: source.jurisdiction,
        authorityTypeHint: configuredAuthorityTypeHint,
        metadata: {
          extractedFrom: source.sourceUrl,
          listingDateText: dateText,
          contentType: "generic_static_item",
        },
      };

      return item;
    })
    .get()
    .filter(Boolean) as ExtractedCandidateItem[];
}

function extractJsRedirectPath(html: string) {
  return html.match(/window\.location\.href=['"]([^'"]+)['"]/i)?.[1] ?? null;
}

function buildNonFatalStaticConstraintResult(
  message: string,
  responseStatus: number | null = null,
): ConnectorScanResult {
  return {
    items: [],
    errors: [],
    warnings: [message],
    responseStatus,
    itemsFetched: 0,
    zeroResultsReason: message,
  };
}

export class StaticPageConnector implements SourceConnector {
  async scan(source: RegulationSource): Promise<ConnectorScanResult> {
    await waitForCrawlDelay(source);

    let response: Response;
    let html = "";
    let fetchMetadata: ConnectorScanResult["fetchMetadata"] = null;
    try {
      const fetchResult = await fetchTextWithConditionalCaching(source);
      if (fetchResult.notModified) {
        return {
          items: [],
          errors: [],
          warnings: ["Static source returned 304 Not Modified; parsing was skipped."],
          responseStatus: fetchResult.response.status,
          itemsFetched: 0,
          zeroResultsReason: "The official static source returned 304 Not Modified.",
          fetchMetadata: fetchResult.fetchMetadata,
        };
      }
      response = fetchResult.response;
      fetchMetadata = fetchResult.fetchMetadata;
      if (fetchResult.shortCircuitedByHash) {
        return {
          items: [],
          errors: [],
          warnings: ["Static source body hash matched the previous successful fetch; parsing was skipped."],
          responseStatus: fetchResult.response.status,
          itemsFetched: 0,
          zeroResultsReason:
            "The official static source content hash matched the previous successful fetch.",
          fetchMetadata: fetchResult.fetchMetadata,
        };
      }
      html = fetchResult.body;
    } catch (error) {
      if (isLegifranceSourceUrl(source.sourceUrl)) {
        const message =
          error instanceof Error ? error.message : "Unknown Legifrance fetch failure";
        return buildNonFatalStaticConstraintResult(
          `Legifrance could not be queried safely in this run: ${message}. The dedicated parser is ready, but this source currently requires manual review or an allowed access path.`,
        );
      }
      if (isNyCourtsAiSourceUrl(source.sourceUrl)) {
        const message =
          error instanceof Error ? error.message : "Unknown NY Courts fetch failure";
        return buildNonFatalStaticConstraintResult(
          `NY Courts could not be queried safely in this run: ${message}. The targeted parser is ready, but this source currently requires manual review or a runtime access path that is not blocked by the court site.`,
        );
      }
      if (shouldHonestlyDegrade(source)) {
        const message = error instanceof Error ? error.message : "Unknown fetch failure";
        return buildNonFatalStaticConstraintResult(
          `${source.name} could not be queried safely in this run: ${message}. This official source is configured to degrade honestly (e.g. runtime-blocked); it needs manual review or an allowed access path such as the Scrapling worker.`,
        );
      }

      throw error;
    }

    if (!response.ok) {
      const errorHtml = html;
      if (isLegifranceSourceUrl(source.sourceUrl)) {
        if (isLegifranceChallengePage(errorHtml)) {
          return buildNonFatalStaticConstraintResult(
            `Legifrance blocked the scan runtime with a Cloudflare challenge (HTTP ${response.status}). The dedicated parser is ready, but this source currently requires manual review or an allowed access path.`,
            response.status,
          );
        }

        return buildNonFatalStaticConstraintResult(
          `Legifrance refused or constrained access for this scan run (HTTP ${response.status}). The dedicated parser is ready, but this source currently requires manual review or an allowed access path.`,
          response.status,
        );
      }
      if (isNyCourtsAiSourceUrl(source.sourceUrl)) {
        return buildNonFatalStaticConstraintResult(
          `NY Courts refused or constrained access for this scan run (HTTP ${response.status}). The targeted parser is ready, but this source currently requires manual review or a runtime access path that is not blocked by the court site.`,
          response.status,
        );
      }
      if (shouldHonestlyDegrade(source)) {
        return buildNonFatalStaticConstraintResult(
          `${source.name} refused or constrained access for this scan run (HTTP ${response.status}). This official source is configured to degrade honestly; it needs manual review or an allowed access path such as the Scrapling worker.`,
          response.status,
        );
      }

      throw new Error(`Static source request failed with ${response.status}`);
    }

    if (isLegifranceSourceUrl(source.sourceUrl) && isLegifranceChallengePage(html)) {
      return buildNonFatalStaticConstraintResult(
        "Legifrance returned a Cloudflare challenge page for this scan run. The dedicated parser is ready, but this source currently requires manual review or an allowed access path.",
        response.status,
      );
    }
    if (isCourCassationSourceUrl(source.sourceUrl)) {
      const redirectPath = extractJsRedirectPath(html);
      if (redirectPath) {
        const redirectedUrl = resolveAbsoluteUrl(redirectPath, source.sourceUrl);
        const redirectedResponse = await fetch(redirectedUrl, {
          headers: {
            "User-Agent":
              "C-Saint-Girons-AI-Regulation-Monitor/0.1 (official-source-monitoring)",
          },
          next: { revalidate: 0 },
        });

        if (redirectedResponse.ok) {
          html = await redirectedResponse.text();
        }
      }
    }
    const $ = cheerio.load(html);

    let items: ExtractedCandidateItem[];
    let zeroResultsReason: string | null = null;

    if (/whitehouse\.gov/i.test(source.sourceUrl)) {
      items = parseWhiteHouse($, source);
      zeroResultsReason =
        "No White House listing items were parsed. The official page structure may have changed.";
    } else if (/cnil\.fr/i.test(source.sourceUrl)) {
      items = parseCnil($, source);
      zeroResultsReason =
        "No CNIL associated AI articles were parsed from the official landing page.";
    } else if (/oecd\.ai/i.test(source.sourceUrl)) {
      items = parseOecd($, source);
      zeroResultsReason =
        "No OECD AI Wonk post cards were parsed from the official listing page.";
    } else if (/edpb\.europa\.eu/i.test(source.sourceUrl)) {
      items = parseEdpb($, source);
      zeroResultsReason =
        "No EDPB AI topic publications were parsed; the official topic page structure may have changed.";
    } else if (/nist\.gov/i.test(source.sourceUrl) && /ai-risk-management-framework/i.test(source.sourceUrl)) {
      items = parseNist($, source);
      zeroResultsReason =
        "No NIST AI RMF hub links were parsed from the official framework page.";
    } else if (/consumerfinance\.gov/i.test(source.sourceUrl) && /\/ai\/?$/i.test(source.sourceUrl)) {
      items = parseCfpb($, source);
      zeroResultsReason =
        "No CFPB AI compliance-plan links were parsed from the official AI page.";
    } else if (/sec\.gov/i.test(source.sourceUrl) && /\/ai\/?$/i.test(source.sourceUrl)) {
      items = parseSec($, source);
      zeroResultsReason =
        "No SEC AI resource links were parsed from the official AI page.";
    } else if (/dfs\.ny\.gov/i.test(source.sourceUrl) && /industry_guidance\/innovation/i.test(source.sourceUrl)) {
      items = parseNydfs($, source);
      zeroResultsReason =
        "No NYDFS AI section links were parsed from the official innovation page.";
    } else if (isNyCourtsAiSourceUrl(source.sourceUrl)) {
      items = parseNyCourtsAiMaterials($, source);
      zeroResultsReason =
        "No targeted NY Courts AI rule materials were parsed from the official court rules page.";
    } else if (/ico\.org\.uk/i.test(source.sourceUrl) && /artificial-intelligence/i.test(source.sourceUrl)) {
      items = parseIco($, source);
      zeroResultsReason =
        "No ICO AI guidance links were parsed from the official AI guidance hub.";
    } else if (/aiweekly\.co/i.test(source.sourceUrl) && /ai-news-today/i.test(source.sourceUrl)) {
      items = parseAiWeeklyDiscovery($, source);
      zeroResultsReason =
        "No AI Weekly discovery leads were parsed from the AI News Today dashboard.";
    } else if (/globalpolicywatch\.com/i.test(source.sourceUrl)) {
      items = parseGlobalPolicyWatchDiscovery($, source);
      zeroResultsReason =
        "No Global Policy Watch discovery leads were parsed from the category page.";
    } else if (isLegifranceSourceUrl(source.sourceUrl)) {
      items = parseLegifranceAiMaterials($, source);
      zeroResultsReason =
        "No Legifrance AI-related legal texts were parsed from the official page or search results.";
    } else if (
      isConseilEtatSourceUrl(source.sourceUrl) ||
      isCourCassationSourceUrl(source.sourceUrl) ||
      isDefenseurDesDroitsSourceUrl(source.sourceUrl)
    ) {
      items = parseFranceOfficialAiPage($, source);
      zeroResultsReason =
        "No targeted French official AI institutional materials were parsed from the official page.";
    } else if (isEurLexDocumentUrl(source.sourceUrl)) {
      items = buildEurLexAiActCandidates({ html, source });
      zeroResultsReason =
        "No EUR-Lex AI Act document metadata was parsed from the official structured document page.";
    } else if (/eur-lex\.europa\.eu/i.test(source.sourceUrl) && /search\.html/i.test(source.sourceUrl)) {
      items = parseEurLexSearch($, source);
      zeroResultsReason =
        "No EUR-Lex AI legal materials were parsed from the official search results page.";
    } else if (/owasp\.org/i.test(source.sourceUrl) && /ai-maturity-assessment/i.test(source.sourceUrl)) {
      items = parseOwaspAima($, source);
      zeroResultsReason =
        "No OWASP AIMA framework metadata was parsed from the official project page.";
    } else if (/iso\.org/i.test(source.sourceUrl) && /standard\/(?:81230|42001)/i.test(source.sourceUrl)) {
      items = parseIso42001($, source);
      zeroResultsReason =
        "No ISO/IEC 42001 metadata was parsed from the official ISO standard page.";
    } else {
      items = parseGeneric($, source);
      zeroResultsReason =
        "No generic static-page items were parsed; the configured selectors may need updating.";
    }

    const uniqueItems = uniqueByUrl(items).filter((item) => item.text.length > 20);
    const warnings: string[] = [];
    if (items.length !== uniqueItems.length) {
      warnings.push(
        `Removed ${items.length - uniqueItems.length} duplicate listing entries during connector parsing.`,
      );
    }
    if (uniqueItems.length === 0 && zeroResultsReason) {
      warnings.push(zeroResultsReason);
    }

    return {
      items: uniqueItems,
      errors: [],
      warnings,
      responseStatus: response.status,
      itemsFetched: uniqueItems.length,
      zeroResultsReason: uniqueItems.length === 0 ? zeroResultsReason : null,
      fetchMetadata,
    };
  }
}
