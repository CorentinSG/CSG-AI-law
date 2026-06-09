import type { ConnectorScanResult, SourceConnector } from "@/agents/ai-regulation/connectors/types";
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

type ApiProvider = "federal_register" | "newsapi" | "gdelt" | "judilibre";

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
    configured === "judilibre"
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

async function requestJson(source: RegulationSource, headers: HeadersInit = {}) {
  const response = await fetch(source.sourceUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "C-Saint-Girons-AI-Regulation-Monitor/0.1 (official-source-monitoring)",
      ...headers,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`API source request failed with ${response.status}`);
  }

  return {
    response,
    json: (await response.json()) as unknown,
  };
}

async function scanFederalRegister(source: RegulationSource): Promise<ConnectorScanResult> {
  const { response, json } = await requestJson(source);
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
    const result = await requestJson(source, {
      "X-Api-Key": env.NEWSAPI_API_KEY,
    });
    response = result.response;
    json = result.json;
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
    const result = await requestJson(source);
    response = result.response;
    json = result.json;
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
    const result = await requestJson(source, {
      KeyId: env.JUDILIBRE_API_KEYID,
    });
    response = result.response;
    json = result.json;
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
      case "federal_register":
      default:
        return scanFederalRegister(source);
    }
  }
}
