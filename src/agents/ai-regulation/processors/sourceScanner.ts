import { ApiConnector } from "@/agents/ai-regulation/connectors/api-connector";
import {
  buildExcerpt,
  buildStableCandidateId,
  normalizeWhitespace,
} from "@/agents/ai-regulation/connectors/connector-utils";
import { RssConnector } from "@/agents/ai-regulation/connectors/rss-connector";
import { StaticPageConnector } from "@/agents/ai-regulation/connectors/static-page-connector";
import type {
  ConnectorScanResult,
  SourceConnector,
} from "@/agents/ai-regulation/connectors/types";
import { scrapeUrl } from "@/agents/ingestion/firecrawlService";
import {
  isScraplingRuntimeAvailable,
  scraplingExtract,
} from "@/agents/ingestion/scraplingClient";
import type { NormalizedDocument } from "@/agents/ingestion/types";
import type {
  ExtractedCandidateItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

const OFFICIAL_STATIC_FALLBACK_CATEGORIES = new Set([
  "official",
  "regulator",
  "court",
  "parliament",
]);

function resolveConnector(source: RegulationSource): SourceConnector {
  if (source.preferredExtractionMethod === "rss") return new RssConnector();
  if (source.preferredExtractionMethod === "api") return new ApiConnector();
  return new StaticPageConnector();
}

function shouldUseStaticBrowserFallback(source: RegulationSource) {
  if (source.preferredExtractionMethod !== "html_static") return false;
  if (source.ingestionMethod && source.ingestionMethod !== "existing") return false;
  if (source.sourceCategory && OFFICIAL_STATIC_FALLBACK_CATEGORIES.has(source.sourceCategory)) {
    return true;
  }

  return source.reliabilityLevel === "high";
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function buildFallbackCandidate(
  source: RegulationSource,
  document: NormalizedDocument,
): ExtractedCandidateItem {
  const title =
    normalizeWhitespace(document.title) ||
    `${source.name} official source snapshot`;
  const text = normalizeWhitespace(document.markdown);
  const publicationDate = document.published_at ?? null;

  return {
    stableId: buildStableCandidateId({
      sourceId: source.id,
      title,
      url: document.url,
      publicationDate,
      externalId: document.content_hash,
    }),
    title,
    url: document.url,
    text,
    excerpt: buildExcerpt(text || title),
    publicationDate,
    sourceName: source.name,
    sourceId: source.id,
    jurisdictionHint: source.jurisdiction,
    metadata: {
      contentHash: document.content_hash,
      contentType: "static_fallback_document",
      extractionMethod: document.extraction_method,
      fallbackFrom: "html_static",
    },
  };
}

async function scanStaticSourceWithBrowserFallback(
  source: RegulationSource,
  originalError: unknown,
): Promise<ConnectorScanResult> {
  const fallbackErrors: string[] = [];
  let document: NormalizedDocument | null = null;
  let attemptedBrowserFallback = false;

  if (isScraplingRuntimeAvailable()) {
    attemptedBrowserFallback = true;
    try {
      document = await scraplingExtract(
        source.sourceUrl,
        source.id,
        source.scraplingConfig,
      );
    } catch (error) {
      fallbackErrors.push(`Scrapling fallback failed: ${describeError(error)}`);
    }
  }

  if (!document && process.env.FIRECRAWL_API_KEY) {
    attemptedBrowserFallback = true;
    try {
      document = await scrapeUrl(source.sourceUrl, source.id);
    } catch (error) {
      fallbackErrors.push(`Firecrawl fallback failed: ${describeError(error)}`);
    }
  }

  if (!document) {
    if (attemptedBrowserFallback && fallbackErrors.length === 0) {
      const message =
        `Browser fallback reached ${source.sourceUrl} after html_static failed, but returned no extractable title/body content.`;
      return {
        items: [],
        errors: [],
        warnings: [message],
        responseStatus: null,
        itemsFetched: 0,
        zeroResultsReason: message,
        fetchMetadata: null,
      };
    }

    const fallbackSummary =
      fallbackErrors.length > 0
        ? ` Fallback attempts also failed: ${fallbackErrors.join(" ")}`
        : " No browser fallback runtime is configured.";
    throw new Error(
      `Static source request failed and no fallback recovered it: ${describeError(originalError)}.${fallbackSummary}`,
    );
  }

  const item = buildFallbackCandidate(source, document);
  const items = item.text.length > 20 ? [item] : [];
  const fallbackLabel = document.extraction_method === "firecrawl" ? "Firecrawl" : "Scrapling";

  return {
    items,
    errors: [],
    warnings: [
      `${fallbackLabel} fallback recovered ${items.length} item(s) after html_static failed: ${describeError(originalError)}`,
      ...fallbackErrors,
    ],
    responseStatus: null,
    itemsFetched: items.length,
    zeroResultsReason:
      items.length === 0
        ? `${fallbackLabel} fallback returned a document without enough extractable text.`
        : null,
    fetchMetadata: null,
  };
}

export const sourceScanner = {
  async scanSource(source: RegulationSource) {
    const connector = resolveConnector(source);
    try {
      return await connector.scan(source);
    } catch (error) {
      if (!shouldUseStaticBrowserFallback(source)) {
        throw error;
      }

      return scanStaticSourceWithBrowserFallback(source, error);
    }
  },
};
