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

type ApiProvider =
  | "federal_register"
  | "newsapi"
  | "gdelt"
  | "judilibre"
  | "legifrance"
  | "courtlistener";

const PISTE_OAUTH_TOKEN_URL = "https://oauth.piste.gouv.fr/api/oauth/token";

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
    configured === "judilibre" ||
    configured === "legifrance" ||
    configured === "courtlistener"
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

async function scanJudilibre(source: RegulationSource): Promise<ConnectorScanResult> {
  if (!env.JUDILIBRE_API_KEYID) {
    return buildMissingCredentialResult(
      "JUDILIBRE_API_KEYID is not configured, so the Judilibre API cannot be queried from this runtime.",
    );
  }

  let response: Response;
  let json: unknown;
  try {
    const result = await requestJson<JudilibreResponse>(source, {
      KeyId: env.JUDILIBRE_API_KEYID,
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

async function fetchPisteAccessToken(clientId: string, clientSecret: string) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid",
  });

  const response = await fetch(PISTE_OAUTH_TOKEN_URL, {
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
    const accessToken = await fetchPisteAccessToken(clientId, clientSecret);
    response = await fetch(source.sourceUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
      "COURTLISTENER_API_KEY is not configured, so CourtListener/RECAP case-law discovery cannot be queried from this runtime.",
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

export class ApiConnector implements SourceConnector {
  async scan(source: RegulationSource): Promise<ConnectorScanResult> {
    const provider = getApiProvider(source);

    switch (provider) {
      case "newsapi":
        return scanNewsApi(source);
      case "gdelt":
        return scanGdelt(source);
      case "judilibre":
        return scanJudilibre(source);
      case "legifrance":
        return scanLegifrance(source);
      case "courtlistener":
        return scanCourtListener(source);
      case "federal_register":
      default:
        return scanFederalRegister(source);
    }
  }
}
