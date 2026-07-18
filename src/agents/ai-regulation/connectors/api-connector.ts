import type { ConnectorScanResult, SourceConnector } from "@/agents/ai-regulation/connectors/types";
import type { ConditionalFetchNotModifiedResult, ConditionalJsonFetchResult } from "@/agents/ai-regulation/connectors/conditional-fetch";
import { fetchJsonWithConditionalCaching } from "@/agents/ai-regulation/connectors/conditional-fetch";
import {
  buildExcerpt,
  buildStableCandidateId,
  normalizeWhitespace,
} from "@/agents/ai-regulation/connectors/connector-utils";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";
import { env } from "@/lib/env";
import type { AuthorityType, DevelopmentType, LegalArea } from "@/db/schema";

interface FederalRegisterDocument {
  title?: string;
  html_url?: string;
  abstract?: string;
  publication_date?: string;
  document_number?: string;
  type?: string;
}

interface FederalRegisterResponse {
  results?: FederalRegisterDocument[];
}

interface NewsApiArticle {
  source?: { id?: string | null; name?: string | null };
  title?: string | null;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  publishedAt?: string | null;
}

interface NewsApiResponse {
  articles?: NewsApiArticle[];
}

interface GdeltArticle {
  title?: string;
  url?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

interface JudilibreResult {
  id?: string;
  title?: string;
  summary?: string;
  text?: string;
  number?: string;
  formation?: string;
  jurisdiction?: string;
  publication?: string[];
  date?: string;
  files?: Array<{ type?: string; url?: string }>;
  location?: string;
}

interface JudilibreResponse {
  results?: JudilibreResult[];
}

interface LegifranceTitle {
  id?: string;
  cid?: string;
  title?: string;
}

interface LegifranceResult {
  titles?: LegifranceTitle[];
  nature?: string;
  date?: string;
  text?: string;
  type?: string;
}

interface LegifranceSearchResponse {
  results?: LegifranceResult[];
  totalResultNumber?: number;
}

interface CourtListenerCluster {
  absolute_url?: string | null;
  case_name?: string | null;
  case_name_full?: string | null;
  docket_id?: number | string | null;
  id?: number | string | null;
  date_filed?: string | null;
  court?: string | null;
  precedential_status?: string | null;
  syllabus?: string | null;
  summary?: string | null;
}

interface CourtListenerSearchResponse {
  results?: CourtListenerCluster[];
}

interface LegalDataHunterResult {
  id?: string | number | null;
  title?: string | null;
  name?: string | null;
  url?: string | null;
  href?: string | null;
  text?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  publicationDate?: string | null;
  publication_date?: string | null;
  date?: string | null;
  jurisdiction?: string | null;
  authorityType?: string | null;
  authority_type?: string | null;
  sourceType?: string | null;
  source_type?: string | null;
}

interface LegalDataHunterResponse {
  items?: LegalDataHunterResult[];
  results?: LegalDataHunterResult[];
  documents?: LegalDataHunterResult[];
}

type ApiProvider =
  | "federal_register"
  | "newsapi"
  | "gdelt"
  | "eurlex"
  | "judilibre"
  | "legifrance"
  | "courtlistener"
  | "legal_data_hunter";

const EURLEX_WEBSERVICE_URL = "https://eur-lex.europa.eu/EURLexWebService";
const PISTE_OAUTH_TOKEN_URL = "https://oauth.piste.gouv.fr/api/oauth/token";
const PISTE_SANDBOX_OAUTH_TOKEN_URL = "https://sandbox-oauth.piste.gouv.fr/api/oauth/token";

const defaultAiTerms = [
  "intelligence artificielle",
  "artificial intelligence",
  "ai act",
  "generative ai",
  "general-purpose ai",
  "generative model",
  "foundation model",
  "algorith",
  "deepfake",
  "biometric",
] as const;

const defaultLegalTerms = [
  "regulation",
  "regulatory",
  "law",
  "legal",
  "compliance",
  "governance",
  "guidance",
  "court",
  "judge",
  "tribunal",
  "agency",
  "commission",
  "enforcement",
  "consultation",
  "legislation",
  "bill",
  "decree",
  "decret",
  "parliament",
  "parlement",
  "senate",
  "senat",
  "assembly",
  "directive",
  "rulemaking",
  "administrative",
  "edpb",
  "edps",
  "cnil",
  "privacy",
  "data protection",
  "fundamental rights",
  "droits fondamentaux",
  "jurisprudence",
  "tribunal",
  "judge",
  "justice",
] as const;

function getApiProvider(source: RegulationSource): ApiProvider {
  const configured = source.config?.apiProvider;
  if (
    configured === "federal_register" ||
    configured === "newsapi" ||
    configured === "gdelt" ||
    configured === "eurlex" ||
    configured === "judilibre" ||
    configured === "legifrance" ||
    configured === "courtlistener" ||
    configured === "legal_data_hunter"
  ) {
    return configured;
  }
  return "federal_register";
}

function getMaxItems(source: RegulationSource) {
  const value = source.config?.maxItems;
  return typeof value === "number" && value > 0 ? value : 10;
}

function getConfiguredStringList(source: RegulationSource, key: string) {
  const value = source.config?.[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

function buildMissingCredentialResult(message: string): ConnectorScanResult {
  return {
    items: [],
    errors: [],
    warnings: [message],
    responseStatus: null,
    itemsFetched: 0,
    zeroResultsReason: message,
  };
}

function buildNonFatalApiConstraintResult(message: string): ConnectorScanResult {
  return {
    items: [],
    errors: [],
    warnings: [message],
    responseStatus: null,
    itemsFetched: 0,
    zeroResultsReason: message,
  };
}

function normalizeTerms(values: readonly string[]) {
  return values.map((value) => normalizeWhitespace(value).toLowerCase());
}

function matchesAnyTerm(normalizedText: string, values: readonly string[]) {
  return normalizeTerms(values).some((term) => normalizedText.includes(term));
}

function urlMatchesAllowedDomains(url: string | null | undefined, allowedDomains: string[]) {
  if (allowedDomains.length === 0) return true;
  if (!url) return false;

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return allowedDomains.some((domain) => {
      const normalized = domain.toLowerCase();
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

function isLikelyAiLegalSignal(
  source: RegulationSource,
  input: { text: string; url?: string | null },
) {
  const normalized = normalizeWhitespace(input.text).toLowerCase();
  const aiTerms = getConfiguredStringList(source, "aiTerms");
  const legalTerms = getConfiguredStringList(source, "legalTerms");
  const allowedDomains = getConfiguredStringList(source, "allowedDomains");
  const allowBroadAiOnly = source.config?.allowBroadAiOnly === true;

  if (!urlMatchesAllowedDomains(input.url, allowedDomains)) {
    return false;
  }

  const hasAiSignal = matchesAnyTerm(normalized, aiTerms.length > 0 ? aiTerms : defaultAiTerms);
  if (!hasAiSignal) {
    return false;
  }

  if (allowBroadAiOnly) {
    return true;
  }

  return matchesAnyTerm(normalized, legalTerms.length > 0 ? legalTerms : defaultLegalTerms);
}

function buildCandidate(
  source: RegulationSource,
  input: {
    title: string;
    url: string;
    text: string;
    publicationDate?: string | null;
    externalId?: string | null;
    developmentTypeHint?: DevelopmentType;
    legalAreaHint?: LegalArea;
    authorityTypeHint?: AuthorityType;
    metadata?: Record<string, unknown>;
  },
): ExtractedCandidateItem {
  return {
    stableId: buildStableCandidateId({
      sourceId: source.id,
      title: input.title,
      url: input.url,
      publicationDate: input.publicationDate ?? null,
      externalId: input.externalId ?? null,
    }),
    title: input.title,
    url: input.url,
    text: input.text,
    excerpt: buildExcerpt(input.text),
    publicationDate: input.publicationDate ?? null,
    sourceName: source.name,
    sourceId: source.id,
    jurisdictionHint: source.jurisdiction,
    developmentTypeHint: input.developmentTypeHint,
    legalAreaHint: input.legalAreaHint,
    authorityTypeHint: input.authorityTypeHint,
    metadata: {
      ...(input.metadata ?? {}),
      contentType: "api_document",
    },
  };
}

async function requestJson<T>(
  source: RegulationSource,
  headers: HeadersInit = {},
): Promise<ConditionalJsonFetchResult<T> | ConditionalFetchNotModifiedResult> {
  const result = await fetchJsonWithConditionalCaching<T>(source, headers);
  if (result.notModified) {
    return result;
  }
  if (!result.response.ok) {
    throw new Error(`API source request failed with ${result.response.status}`);
  }
  return result;
}

async function scanFederalRegister(source: RegulationSource): Promise<ConnectorScanResult> {
  const result = await requestJson<FederalRegisterResponse>(source);
  if (result.notModified) {
    return {
      items: [],
      errors: [],
      warnings: ["API source returned 304 Not Modified; parsing was skipped."],
      responseStatus: result.response.status,
      itemsFetched: 0,
      zeroResultsReason: "The official API returned 304 Not Modified.",
      fetchMetadata: result.fetchMetadata,
    };
  }
  if (result.shortCircuitedByHash) {
    return {
      items: [],
      errors: [],
      warnings: ["API response body hash matched the previous successful fetch; parsing was skipped."],
      responseStatus: result.response.status,
      itemsFetched: 0,
      zeroResultsReason:
        "The official API response hash matched the previous successful fetch.",
      fetchMetadata: result.fetchMetadata,
    };
  }
  const { response, json, fetchMetadata } = result;
  const results = ((json as FederalRegisterResponse).results ?? []).slice(0, getMaxItems(source));

  const items = results.map((item) =>
    buildCandidate(source, {
      title: item.title ?? "Untitled official update",
      url: item.html_url ?? source.sourceUrl,
      text: item.abstract ?? item.title ?? "",
      publicationDate: item.publication_date ?? null,
      externalId: item.document_number ?? null,
      metadata: {
        documentNumber: item.document_number,
        type: item.type,
      },
    }),
  );

  return {
    items,
    errors: [],
    warnings: results.length === 0 ? ["API responded successfully but returned zero results."] : [],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason: results.length === 0 ? "The official API returned zero matching items." : null,
    fetchMetadata,
  };
}

async function scanNewsApi(source: RegulationSource): Promise<ConnectorScanResult> {
  if (!env.NEWSAPI_API_KEY) {
    return buildMissingCredentialResult(
      "NEWSAPI_API_KEY is not configured, so NewsAPI discovery cannot be queried from this runtime.",
    );
  }

  let response: Response;
  let json: unknown;
  try {
    const result = await requestJson<NewsApiResponse>(source, {
      "X-Api-Key": env.NEWSAPI_API_KEY,
    });
    if (result.notModified) {
      return {
        items: [],
        errors: [],
        warnings: ["NewsAPI returned 304 Not Modified; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason: "The discovery API returned 304 Not Modified.",
        fetchMetadata: result.fetchMetadata,
      };
    }
    response = result.response;
    json = result.json;
    if (result.shortCircuitedByHash) {
      return {
        items: [],
        errors: [],
        warnings: ["NewsAPI response body hash matched the previous successful fetch; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason:
          "The discovery API response hash matched the previous successful fetch.",
        fetchMetadata: result.fetchMetadata,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "NewsAPI request failed";
    return buildNonFatalApiConstraintResult(
      `NewsAPI discovery could not be queried safely in this run: ${message}`,
    );
  }

  const articles = ((json as NewsApiResponse).articles ?? [])
    .filter((article) =>
      isLikelyAiLegalSignal(source, {
        text: [article.title, article.description, article.content, article.source?.name]
          .filter(Boolean)
          .join(" "),
        url: article.url,
      }),
    )
    .slice(0, getMaxItems(source));

  const items = articles.map((article) =>
    buildCandidate(source, {
      title: article.title ?? "Untitled legal-news signal",
      url: article.url ?? source.sourceUrl,
      text: [article.description, article.content, article.title].filter(Boolean).join(" "),
      publicationDate: article.publishedAt ?? null,
      externalId: article.url ?? null,
      metadata: {
        provider: "newsapi",
        upstreamSourceName: article.source?.name ?? null,
        upstreamSourceId: article.source?.id ?? null,
        sourceCategory: "media_discovery_source",
      },
    }),
  );

  return {
    items,
    errors: [],
    warnings:
      articles.length === 0
        ? [
            "NewsAPI responded successfully but no returned article matched the AI-plus-legal-regulatory discovery filter.",
          ]
        : ["NewsAPI results are discovery-only and require official-source confirmation before authority use."],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      articles.length === 0
        ? "The discovery API returned no article matching the deterministic AI-plus-legal-regulatory filter."
        : null,
  };
}

async function scanGdelt(source: RegulationSource): Promise<ConnectorScanResult> {
  let response: Response;
  let json: unknown;
  try {
    const result = await requestJson<GdeltResponse>(source);
    if (result.notModified) {
      return {
        items: [],
        errors: [],
        warnings: ["GDELT returned 304 Not Modified; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason: "The discovery API returned 304 Not Modified.",
        fetchMetadata: result.fetchMetadata,
      };
    }
    response = result.response;
    json = result.json;
    if (result.shortCircuitedByHash) {
      return {
        items: [],
        errors: [],
        warnings: ["GDELT response body hash matched the previous successful fetch; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason:
          "The discovery API response hash matched the previous successful fetch.",
        fetchMetadata: result.fetchMetadata,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "GDELT request failed";
    return buildNonFatalApiConstraintResult(
      `GDELT discovery could not be queried safely in this run: ${message}`,
    );
  }

  const articles = ((json as GdeltResponse).articles ?? [])
    .filter((article) =>
      isLikelyAiLegalSignal(source, {
        text: [article.title, article.url, article.domain].filter(Boolean).join(" "),
        url: article.url,
      }),
    )
    .slice(0, getMaxItems(source));

  const items = articles.map((article) =>
    buildCandidate(source, {
      title: article.title ?? "Untitled GDELT legal-news signal",
      url: article.url ?? source.sourceUrl,
      text: [article.title, article.domain, article.language].filter(Boolean).join(" "),
      publicationDate: article.seendate ?? null,
      externalId: article.url ?? null,
      metadata: {
        provider: "gdelt",
        domain: article.domain ?? null,
        language: article.language ?? null,
        socialImage: article.socialimage ?? null,
        sourceCategory: "media_discovery_source",
      },
    }),
  );

  return {
    items,
    errors: [],
    warnings:
      articles.length === 0
        ? [
            "GDELT responded successfully but no returned article matched the AI-plus-legal-regulatory discovery filter.",
          ]
        : ["GDELT results are discovery-only and require official-source confirmation before authority use."],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      articles.length === 0
        ? "The discovery API returned no article matching the deterministic AI-plus-legal-regulatory filter."
        : null,
  };
}

function getEurLexQuery(source: RegulationSource) {
  const configured = source.config?.expertQuery ?? source.config?.query ?? source.config?.searchText;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured.trim();
  }
  return 'TI ~ "artificial intelligence" OR TI ~ "AI Act" OR TI ~ "biometric identification" OR (TE ~ "artificial intelligence" AND (TI ~ "regulation" OR TI ~ "directive" OR TI ~ "decision" OR TI ~ "opinion" OR TI ~ "recommendation" OR TI ~ "impact assessment"))';
}

function getEurLexSearchLanguage(source: RegulationSource) {
  const configured = source.config?.searchLanguage ?? source.config?.language;
  if (typeof configured === "string" && /^[A-Z]{2}$/i.test(configured)) {
    return configured.toLowerCase();
  }
  return "en";
}

function buildEurLexSoapEnvelope(input: {
  username: string;
  password: string;
  expertQuery: string;
  pageSize: number;
  searchLanguage: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:elx="http://eur-lex.europa.eu/search" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soap:Header>
    <wsse:Security soap:mustUnderstand="true">
      <wsse:UsernameToken xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" wsu:Id="UsernameToken-1">
        <wsse:Username>${escapeXml(input.username)}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${escapeXml(input.password)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <elx:searchRequest>
      <elx:expertQuery>${escapeXml(input.expertQuery)}</elx:expertQuery>
      <elx:page>1</elx:page>
      <elx:pageSize>${input.pageSize}</elx:pageSize>
      <elx:searchLanguage>${escapeXml(input.searchLanguage)}</elx:searchLanguage>
      <elx:excludeAllConsleg>true</elx:excludeAllConsleg>
      <elx:limitToLatestConsleg>false</elx:limitToLatestConsleg>
    </elx:searchRequest>
  </soap:Body>
</soap:Envelope>`;
}

function firstXmlElementText(xml: string, localName: string) {
  const match = new RegExp(
    `<(?:[\\w-]+:)?${localName}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${localName}>`,
    "i",
  ).exec(xml);
  return match?.[1] ? stripXmlTags(match[1]) : null;
}

function allXmlElementBlocks(xml: string, localName: string) {
  const blocks: string[] = [];
  const pattern = new RegExp(
    `<(?:[\\w-]+:)?${localName}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${localName}>`,
    "gi",
  );
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml)) !== null) {
    blocks.push(match[1] ?? "");
  }
  return blocks;
}

function pickEurLexTitle(resultXml: string) {
  const title =
    firstXmlElementText(resultXml, "title") ??
    firstXmlElementText(resultXml, "EXPRESSION_TITLE") ??
    firstXmlElementText(resultXml, "WORK_TITLE") ??
    firstXmlElementText(resultXml, "TITLE");
  return title && title.length > 0 ? normalizeEurLexTitle(title) : null;
}

function pickEurLexDate(resultXml: string) {
  const workDateBlock = allXmlElementBlocks(resultXml, "WORK_DATE_DOCUMENT")[0];
  return extractXmlValue(workDateBlock) ??
    firstXmlElementText(resultXml, "date_document") ??
    firstXmlElementText(resultXml, "DD") ??
    firstXmlElementText(resultXml, "DATE_DOCUMENT") ??
    null;
}

function buildEurLexUrl(reference: string | null, resultXml: string, source: RegulationSource) {
  const link = firstXmlElementText(resultXml, "document_link");
  if (link?.startsWith("http")) return link;
  if (reference) return `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${encodeURIComponent(reference)}`;
  return source.sourceUrl;
}

function extractEurLexFault(xml: string) {
  return (
    firstXmlElementText(xml, "faultstring") ??
    firstXmlElementText(xml, "Reason") ??
    firstXmlElementText(xml, "Text") ??
    firstXmlElementText(xml, "message") ??
    firstXmlElementText(xml, "Fault") ??
    null
  );
}

function extractXmlValue(xml: string | undefined) {
  if (!xml) return null;
  return firstXmlElementText(xml, "VALUE") ?? firstXmlElementText(xml, "value");
}

function normalizeEurLexTitle(title: string) {
  return normalizeWhitespace(title.replace(/^(?:[a-z]{2}|[a-z]{3})\s+/i, ""));
}

function pickEurLexCelex(resultXml: string) {
  const idCelexBlock = allXmlElementBlocks(resultXml, "ID_CELEX")[0];
  const resourceCelexBlock = allXmlElementBlocks(resultXml, "RESOURCE_LEGAL_ID_CELEX")[0];
  const value = extractXmlValue(idCelexBlock) ?? extractXmlValue(resourceCelexBlock);
  if (value) return value;

  const celexUri = /CELEX:([0-9][0-9A-Z]{5,})/i.exec(resultXml)?.[1];
  if (celexUri) return celexUri.toUpperCase();
  const celexText = /\b[0-9][0-9A-Z]{5,}\b/.exec(stripXmlTags(resultXml))?.[0];
  return celexText ?? null;
}

function pickEurLexDocumentForm(resultXml: string, title: string) {
  const typeBlocks = [
    ...allXmlElementBlocks(resultXml, "RESOURCE_LEGAL_TYPE"),
    ...allXmlElementBlocks(resultXml, "MANIFESTATION_TYPE"),
    ...allXmlElementBlocks(resultXml, "DOSSIER_TYPE_REFERENCE"),
  ];
  const fromXml = typeBlocks
    .map((block) => firstXmlElementText(block, "PREFLABEL") ?? firstXmlElementText(block, "VALUE"))
    .find((value) => value && value.length > 0);
  if (fromXml) return fromXml;

  const normalized = title.toLowerCase();
  if (normalized.includes("staff working document")) return "Staff working document";
  if (normalized.includes("proposal for a regulation")) return "Proposal for a regulation";
  if (normalized.includes("proposal for a directive")) return "Proposal for a directive";
  if (normalized.includes("regulation (eu)")) return "Regulation";
  if (normalized.includes("directive (eu)")) return "Directive";
  if (normalized.includes("decision (eu)")) return "Decision";
  if (normalized.includes("opinion")) return "Opinion";
  if (normalized.includes("resolution")) return "Resolution";
  if (normalized.includes("recommendation")) return "Recommendation";
  return null;
}

function classifyEurLexAuthorityAndDevelopment(
  form: string | null,
  title: string,
): { authorityTypeHint: AuthorityType; developmentTypeHint: DevelopmentType } {
  const haystack = `${form ?? ""} ${title}`.toLowerCase();
  if (haystack.includes("staff working document") || haystack.includes("impact assessment")) {
    return { authorityTypeHint: "Policy report", developmentTypeHint: "Policy report" };
  }
  if (haystack.includes("proposal for a regulation") || haystack.includes("proposal for a directive")) {
    return { authorityTypeHint: "Proposed law", developmentTypeHint: "Proposed rule" };
  }
  if (haystack.includes("regulation")) {
    return { authorityTypeHint: "Binding law", developmentTypeHint: "Regulation" };
  }
  if (haystack.includes("directive")) {
    return { authorityTypeHint: "Binding law", developmentTypeHint: "Regulation" };
  }
  if (haystack.includes("decision")) {
    return { authorityTypeHint: "Binding law", developmentTypeHint: "Other official regulatory development" };
  }
  if (haystack.includes("opinion") || haystack.includes("recommendation") || haystack.includes("resolution")) {
    return { authorityTypeHint: "Soft law", developmentTypeHint: "Agency guidance" };
  }
  return { authorityTypeHint: "Other", developmentTypeHint: "Other official regulatory development" };
}

function classifyEurLexLegalArea(title: string, text: string): LegalArea {
  const haystack = `${title} ${text}`.toLowerCase();
  if (haystack.includes("biometric")) return "Biometric identification";
  if (haystack.includes("financial") || haystack.includes("finance")) return "Financial services";
  if (haystack.includes("liability") || haystack.includes("product safety")) return "Product safety";
  if (haystack.includes("data protection") || haystack.includes("privacy")) return "Data protection";
  if (
    haystack.includes("cloud") ||
    haystack.includes("data centre") ||
    haystack.includes("data center") ||
    haystack.includes("infrastructure") ||
    haystack.includes("hosting") ||
    haystack.includes("compute") ||
    haystack.includes("edge computing")
  ) {
    return "Cloud and infrastructure";
  }
  if (
    haystack.includes("employment") ||
    haystack.includes("worker") ||
    haystack.includes("workplace") ||
    haystack.includes("labour") ||
    haystack.includes("labor") ||
    haystack.includes("platform work") ||
    haystack.includes("algorithmic management")
  ) {
    return "Labor and social law";
  }
  if (haystack.includes("copyright")) return "Copyright and generative AI";
  if (haystack.includes("criminal") || haystack.includes("police")) return "Criminal justice";
  if (haystack.includes("automated decision")) return "Automated decision-making";
  if (haystack.includes("artificial intelligence") || haystack.includes(" ai act") || haystack.includes(" ai ")) {
    return "AI governance";
  }
  return "Other";
}

async function scanEurLex(source: RegulationSource): Promise<ConnectorScanResult> {
  if (!env.EURLEX_USERNAME || !env.EURLEX_PASSWORD) {
    return buildMissingCredentialResult(
      "EURLEX_USERNAME/EURLEX_PASSWORD are not configured, so the official EUR-Lex SOAP webservice cannot be queried from this runtime. EUR-Lex RSS/static official lanes remain available as fallback.",
    );
  }

  const pageSize = Math.min(getMaxItems(source), 20);
  const expertQuery = getEurLexQuery(source);
  const searchLanguage = getEurLexSearchLanguage(source);

  let response: Response;
  let xml: string;
  try {
    response = await fetch(EURLEX_WEBSERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8; action=\"https://eur-lex.europa.eu/ws/doQuery\"",
        Accept: "application/soap+xml, text/xml",
      },
      body: buildEurLexSoapEnvelope({
        username: env.EURLEX_USERNAME,
        password: env.EURLEX_PASSWORD,
        expertQuery,
        pageSize,
        searchLanguage,
      }),
      next: { revalidate: 0 },
    });
    xml = await response.text();
    const fault = extractEurLexFault(xml);
    if (fault) {
      throw new Error(`EUR-Lex SOAP fault: ${fault}`);
    }
    if (!response.ok) {
      const responseHint = stripXmlTags(xml).slice(0, 280);
      throw new Error(
        `EUR-Lex SOAP request failed with ${response.status}${
          responseHint ? `: ${responseHint}` : ""
        }`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "EUR-Lex SOAP request failed";
    return buildNonFatalApiConstraintResult(
      `EUR-Lex official SOAP webservice could not be queried safely in this run: ${message}. EUR-Lex RSS/static official lanes remain the degraded fallback.`,
    );
  }

  const results = allXmlElementBlocks(xml, "result").slice(0, pageSize);
  const items = results
    .map((resultXml) => {
      const cellarReference = firstXmlElementText(resultXml, "reference");
      const title = pickEurLexTitle(resultXml) ?? (cellarReference ? `EUR-Lex document ${cellarReference}` : null);
      if (!title) return null;
      const strippedResult = stripXmlTags(resultXml);
      if (
        !isLikelyAiLegalSignal(source, {
          text: [title, strippedResult].join(" "),
          url: buildEurLexUrl(cellarReference, resultXml, source),
        })
      ) {
        return null;
      }

      const celexReference = pickEurLexCelex(resultXml);
      const reference = celexReference ?? cellarReference;
      const documentForm = pickEurLexDocumentForm(resultXml, title);
      const { authorityTypeHint, developmentTypeHint } =
        classifyEurLexAuthorityAndDevelopment(documentForm, title);
      const legalAreaHint = classifyEurLexLegalArea(title, strippedResult);

      return buildCandidate(source, {
        title,
        url: buildEurLexUrl(reference, resultXml, source),
        text: [title, reference, strippedResult].filter(Boolean).join(" "),
        publicationDate: pickEurLexDate(resultXml),
        externalId: reference,
        developmentTypeHint,
        legalAreaHint,
        authorityTypeHint,
        metadata: {
          provider: "eurlex",
          reference,
          cellarReference,
          celexReference,
          documentForm,
          searchLanguage,
          expertQuery,
          authorityType: authorityTypeHint,
          developmentType: developmentTypeHint,
          legalArea: legalAreaHint,
          sourceCategory: "official_legal_database",
        },
      });
    })
    .filter((item): item is ExtractedCandidateItem => item !== null);

  return {
    items,
    errors: [],
    warnings:
      items.length === 0
        ? ["EUR-Lex SOAP webservice responded successfully but returned zero usable official results."]
        : [
            "EUR-Lex SOAP results are official EU legal database records; binding status, instrument form, and pinpoint citation still require normal legal-database checks.",
          ],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      items.length === 0 ? "The EUR-Lex SOAP webservice returned zero usable matching items." : null,
  };
}

async function scanJudilibre(source: RegulationSource): Promise<ConnectorScanResult> {
  const keyId = env.JUDILIBRE_API_KEYID;
  const pisteClientId = env.LEGIFRANCE_PISTE_CLIENT_ID;
  const pisteClientSecret = env.LEGIFRANCE_PISTE_CLIENT_SECRET;

  if (!keyId && (!pisteClientId || !pisteClientSecret)) {
    return buildMissingCredentialResult(
      "Judilibre credentials are not configured. Set JUDILIBRE_API_KEYID or LEGIFRANCE_PISTE_CLIENT_ID/SECRET so the official Judilibre API can be queried from this runtime.",
    );
  }

  let response: Response;
  let json: unknown;
  try {
    const oauth = keyId ? null : await fetchPisteAccessToken(pisteClientId!, pisteClientSecret!);
    const headers: Record<string, string> = keyId
      ? { KeyId: keyId }
      : { Authorization: `Bearer ${oauth!.accessToken}` };
    const requestSource = oauth
      ? { ...source, sourceUrl: getPisteApiUrl(source.sourceUrl, oauth.environment) }
      : source;
    const result = await requestJson<JudilibreResponse>(requestSource, {
      ...headers,
      Accept: "application/json",
    });
    if (result.notModified) {
      return {
        items: [],
        errors: [],
        warnings: ["Judilibre returned 304 Not Modified; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason: "The Judilibre API returned 304 Not Modified.",
        fetchMetadata: result.fetchMetadata,
      };
    }
    response = result.response;
    json = result.json;
    if (result.shortCircuitedByHash) {
      return {
        items: [],
        errors: [],
        warnings: ["Judilibre response body hash matched the previous successful fetch; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason:
          "The Judilibre API response hash matched the previous successful fetch.",
        fetchMetadata: result.fetchMetadata,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Judilibre request failed";
    return buildNonFatalApiConstraintResult(
      `Judilibre official-case-law discovery could not be queried safely in this run: ${message}`,
    );
  }

  const results = ((json as JudilibreResponse).results ?? []).slice(0, getMaxItems(source));

  const items = results.map((result) => {
    const pdfLike = result.files?.find((file) => file.url)?.url ?? null;
    return buildCandidate(source, {
      title: result.title ?? `Judilibre decision ${result.number ?? "untitled"}`,
      url: pdfLike ?? result.location ?? source.sourceUrl,
      text: [result.summary, result.text, result.title, result.formation]
        .filter(Boolean)
        .join(" "),
      publicationDate: result.date ?? null,
      externalId: result.id ?? result.number ?? null,
      metadata: {
        provider: "judilibre",
        number: result.number ?? null,
        formation: result.formation ?? null,
        jurisdiction: result.jurisdiction ?? null,
        publication: result.publication ?? [],
      },
    });
  });

  return {
    items,
    errors: [],
    warnings:
      results.length === 0
        ? ["Judilibre responded successfully but returned zero results for the configured query."]
        : [
            "Judilibre results are official judicial data, but any legal significance or AI relevance still requires normal citation and review safeguards.",
          ],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      results.length === 0 ? "The Judilibre API returned zero matching decisions." : null,
  };
}

async function requestPisteAccessToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`PISTE OAuth token request failed with ${response.status}`);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("PISTE OAuth response did not include an access token");
  }

  return json.access_token;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeXmlEntities(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function stripXmlTags(value: string) {
  return normalizeWhitespace(decodeXmlEntities(value.replace(/<[^>]+>/g, " ")));
}

async function fetchPisteAccessToken(clientId: string, clientSecret: string) {
  try {
    return {
      accessToken: await requestPisteAccessToken(
        PISTE_OAUTH_TOKEN_URL,
        clientId,
        clientSecret,
      ),
      environment: "production" as const,
    };
  } catch (productionError) {
    try {
      return {
        accessToken: await requestPisteAccessToken(
          PISTE_SANDBOX_OAUTH_TOKEN_URL,
          clientId,
          clientSecret,
        ),
        environment: "sandbox" as const,
      };
    } catch {
      throw productionError;
    }
  }
}

function getPisteApiUrl(sourceUrl: string, environment: "production" | "sandbox") {
  if (environment !== "sandbox") return sourceUrl;
  return sourceUrl.replace("https://api.piste.gouv.fr/", "https://sandbox-api.piste.gouv.fr/");
}

function buildLegifranceDocumentUrl(result: LegifranceResult) {
  const cid = result.titles?.[0]?.cid ?? result.titles?.[0]?.id;
  if (!cid) return null;

  const fond = (result.nature ?? result.type ?? "").toUpperCase();
  const path = /CODE|LODA|LOI|DECRET|ORDONNANCE/.test(fond) ? "loda" : "jorf";
  return `https://www.legifrance.gouv.fr/${path}/id/${cid}`;
}

async function scanLegifrance(source: RegulationSource): Promise<ConnectorScanResult> {
  const clientId = env.LEGIFRANCE_PISTE_CLIENT_ID;
  const clientSecret = env.LEGIFRANCE_PISTE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return buildMissingCredentialResult(
      "LEGIFRANCE_PISTE_CLIENT_ID/SECRET are not configured, so the official Legifrance DILA/PISTE API cannot be queried from this runtime. Scraping remains the honest degraded fallback until PISTE credentials are provisioned.",
    );
  }

  const searchText =
    typeof source.config?.searchText === "string"
      ? source.config.searchText
      : "intelligence artificielle";
  const fond = typeof source.config?.fond === "string" ? source.config.fond : "JORF";

  let response: Response;
  let json: unknown;
  try {
    const oauth = await fetchPisteAccessToken(clientId, clientSecret);
    response = await fetch(getPisteApiUrl(source.sourceUrl, oauth.environment), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${oauth.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fond,
        recherche: {
          champs: [
            {
              typeChamp: "ALL",
              criteres: [
                {
                  typeRecherche: "UN_DES_MOTS",
                  valeur: searchText,
                  operateur: "ET",
                },
              ],
              operateur: "ET",
            },
          ],
          pageNumber: 1,
          pageSize: getMaxItems(source),
          sort: "PERTINENCE",
          typePagination: "DEFAUT",
        },
      }),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Legifrance API request failed with ${response.status}`);
    }

    json = (await response.json()) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Legifrance request failed";
    return buildNonFatalApiConstraintResult(
      `Legifrance official DILA/PISTE API could not be queried safely in this run: ${message}. Scraping remains the honest degraded fallback.`,
    );
  }

  const results = ((json as LegifranceSearchResponse).results ?? []).slice(0, getMaxItems(source));

  const items = results
    .map((result) => {
      const title = result.titles?.[0]?.title;
      const url = buildLegifranceDocumentUrl(result);
      if (!title || !url) return null;

      return buildCandidate(source, {
        title,
        url,
        text: [title, result.nature, result.text].filter(Boolean).join(" "),
        publicationDate: result.date ?? null,
        externalId: result.titles?.[0]?.cid ?? result.titles?.[0]?.id ?? null,
        metadata: {
          provider: "legifrance",
          fond,
          nature: result.nature ?? null,
        },
      });
    })
    .filter((item): item is ExtractedCandidateItem => item !== null);

  return {
    items,
    errors: [],
    warnings:
      items.length === 0
        ? ["Legifrance DILA/PISTE API responded successfully but returned zero usable AI-related results."]
        : ["Legifrance results are official legal data, but legal significance still requires normal citation and human-review safeguards."],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      items.length === 0 ? "The Legifrance DILA/PISTE API returned zero usable matching items." : null,
  };
}

function buildCourtListenerUrl(result: CourtListenerCluster) {
  if (result.absolute_url) {
    return result.absolute_url.startsWith("http")
      ? result.absolute_url
      : `https://www.courtlistener.com${result.absolute_url}`;
  }
  if (result.id) return `https://www.courtlistener.com/opinion/${result.id}/`;
  if (result.docket_id) return `https://www.courtlistener.com/docket/${result.docket_id}/`;
  return null;
}

async function scanCourtListener(source: RegulationSource): Promise<ConnectorScanResult> {
  if (!env.COURTLISTENER_API_KEY) {
    return buildMissingCredentialResult(
      "COURTLISTENER_API_KEY/COURTLISTENER_API_TOKEN is not configured, so CourtListener/RECAP case-law discovery cannot be queried from this runtime.",
    );
  }

  let response: Response;
  let json: unknown;
  try {
    const result = await requestJson<CourtListenerSearchResponse>(source, {
      Authorization: `Token ${env.COURTLISTENER_API_KEY}`,
    });
    if (result.notModified) {
      return {
        items: [],
        errors: [],
        warnings: ["CourtListener returned 304 Not Modified; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason: "The CourtListener API returned 304 Not Modified.",
        fetchMetadata: result.fetchMetadata,
      };
    }
    response = result.response;
    json = result.json;
    if (result.shortCircuitedByHash) {
      return {
        items: [],
        errors: [],
        warnings: ["CourtListener response body hash matched the previous successful fetch; parsing was skipped."],
        responseStatus: result.response.status,
        itemsFetched: 0,
        zeroResultsReason:
          "The CourtListener API response hash matched the previous successful fetch.",
        fetchMetadata: result.fetchMetadata,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "CourtListener request failed";
    return buildNonFatalApiConstraintResult(
      `CourtListener/RECAP case-law discovery could not be queried safely in this run: ${message}`,
    );
  }

  const results = ((json as CourtListenerSearchResponse).results ?? []).slice(
    0,
    getMaxItems(source),
  );
  const items = results
    .map((result) => {
      const title = result.case_name_full ?? result.case_name;
      const url = buildCourtListenerUrl(result);
      if (!title || !url) return null;
      return buildCandidate(source, {
        title,
        url,
        text: [title, result.summary, result.syllabus, result.court, result.precedential_status]
          .filter(Boolean)
          .join(" "),
        publicationDate: result.date_filed ?? null,
        externalId: result.id ? String(result.id) : result.docket_id ? String(result.docket_id) : null,
        metadata: {
          provider: "courtlistener",
          docketId: result.docket_id ?? null,
          court: result.court ?? null,
          precedentialStatus: result.precedential_status ?? null,
          sourceCategory: "case_law_database",
        },
      });
    })
    .filter((item): item is ExtractedCandidateItem => item !== null);

  return {
    items,
    errors: [],
    warnings:
      items.length === 0
        ? ["CourtListener responded successfully but returned zero usable AI-related case-law results."]
        : [
            "CourtListener/RECAP results are case-law discovery data; legal significance still requires citation and review safeguards.",
          ],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      items.length === 0
        ? "The CourtListener API returned zero usable matching case-law results."
        : null,
  };
}

function getLegalDataHunterEndpoint() {
  return env.LEGAL_DATA_HUNTER_MCP_URL ?? env.LEGAL_RESEARCH_MCP_URL ?? null;
}

function getLegalDataHunterQuery(source: RegulationSource) {
  const configured = source.config?.query ?? source.config?.searchText;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured.trim();
  }
  return "artificial intelligence OR AI regulation OR automated decision-making";
}

async function scanLegalDataHunter(source: RegulationSource): Promise<ConnectorScanResult> {
  const endpoint = getLegalDataHunterEndpoint();
  if (!endpoint) {
    return buildMissingCredentialResult(
      "LEGAL_DATA_HUNTER_MCP_URL or LEGAL_RESEARCH_MCP_URL is not configured, so Legal Data Hunter / legal-research cannot be queried from this runtime.",
    );
  }

  let response: Response;
  let json: unknown;
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (env.LEGAL_DATA_HUNTER_API_KEY) {
      headers.Authorization = `Bearer ${env.LEGAL_DATA_HUNTER_API_KEY}`;
    }

    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tool: "legal-research",
        action: "search",
        query: getLegalDataHunterQuery(source),
        jurisdiction: source.jurisdiction,
        region: source.region,
        country: source.country,
        maxItems: getMaxItems(source),
        sourceId: source.id,
      }),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Legal Data Hunter MCP request failed with ${response.status}`);
    }
    json = (await response.json()) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Legal Data Hunter MCP request failed";
    return buildNonFatalApiConstraintResult(
      `Legal Data Hunter / legal-research could not be queried safely in this run: ${message}`,
    );
  }

  const payload = json as LegalDataHunterResponse;
  const results = (payload.items ?? payload.results ?? payload.documents ?? []).slice(
    0,
    getMaxItems(source),
  );
  const items = results
    .map((result) => {
      const title = result.title ?? result.name;
      const url = result.url ?? result.href;
      if (!title || !url) return null;
      return buildCandidate(source, {
        title,
        url,
        text: [result.summary, result.excerpt, result.text, title].filter(Boolean).join(" "),
        publicationDate: result.publicationDate ?? result.publication_date ?? result.date ?? null,
        externalId: result.id ? String(result.id) : url,
        metadata: {
          provider: "legal_data_hunter",
          upstreamJurisdiction: result.jurisdiction ?? null,
          authorityType: result.authorityType ?? result.authority_type ?? null,
          sourceType: result.sourceType ?? result.source_type ?? null,
        },
      });
    })
    .filter((item): item is ExtractedCandidateItem => item !== null);

  return {
    items,
    errors: [],
    warnings:
      items.length === 0
        ? ["Legal Data Hunter / legal-research responded successfully but returned zero usable legal results."]
        : [
            "Legal Data Hunter / legal-research results are accelerated legal discovery data; official-source and citation safeguards still apply before publication.",
          ],
    responseStatus: response.status,
    itemsFetched: items.length,
    zeroResultsReason:
      items.length === 0
        ? "The Legal Data Hunter / legal-research response returned zero usable legal results."
        : null,
  };
}

export class ApiConnector implements SourceConnector {
  async scan(source: RegulationSource): Promise<ConnectorScanResult> {
    const provider = getApiProvider(source);

    switch (provider) {
      case "newsapi":
        return scanNewsApi(source);
      case "gdelt":
        return scanGdelt(source);
      case "eurlex":
        return scanEurLex(source);
      case "judilibre":
        return scanJudilibre(source);
      case "legifrance":
        return scanLegifrance(source);
      case "courtlistener":
        return scanCourtListener(source);
      case "legal_data_hunter":
        return scanLegalDataHunter(source);
      case "federal_register":
      default:
        return scanFederalRegister(source);
    }
  }
}
