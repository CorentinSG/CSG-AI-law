import Parser from "rss-parser";

import type { ConnectorScanResult, SourceConnector } from "@/agents/ai-regulation/connectors/types";
import { fetchTextWithConditionalCaching } from "@/agents/ai-regulation/connectors/conditional-fetch";
import { buildExcerpt, buildStableCandidateId } from "@/agents/ai-regulation/connectors/connector-utils";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";

const parser = new Parser();

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function flattenUnknownText(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenUnknownText(entry));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record._;

    if (typeof preferred === "string") {
      return [preferred];
    }

    return Object.values(record).flatMap((entry) => flattenUnknownText(entry));
  }

  return [];
}

function getConfiguredTerms(
  source: RegulationSource,
  key: "includeAnyTerms" | "excludeTerms",
) {
  const configured = source.config?.[key];
  return Array.isArray(configured)
    ? configured.filter((item): item is string => typeof item === "string")
    : [];
}

function getMaxItems(source: RegulationSource) {
  const value = source.config?.maxItems;
  return typeof value === "number" && value > 0 ? value : 10;
}

export class RssConnector implements SourceConnector {
  async scan(source: RegulationSource): Promise<ConnectorScanResult> {
    const fetchResult = await fetchTextWithConditionalCaching(source, {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    });
    if (fetchResult.notModified) {
      return {
        items: [],
        errors: [],
        warnings: ["RSS source returned 304 Not Modified; parsing was skipped."],
        responseStatus: fetchResult.response.status,
        itemsFetched: 0,
        zeroResultsReason: "The official RSS feed returned 304 Not Modified.",
        fetchMetadata: fetchResult.fetchMetadata,
      };
    }
    if (!fetchResult.response.ok) {
      throw new Error(`RSS source request failed with ${fetchResult.response.status}`);
    }
    if (fetchResult.shortCircuitedByHash) {
      return {
        items: [],
        errors: [],
        warnings: [
          "RSS source body hash matched the previous successful fetch; parsing was skipped.",
        ],
        responseStatus: fetchResult.response.status,
        itemsFetched: 0,
        zeroResultsReason:
          "The official RSS feed content hash matched the previous successful fetch.",
        fetchMetadata: fetchResult.fetchMetadata,
      };
    }

    const feed = await parser.parseString(fetchResult.body);
    const includeAnyTerms = getConfiguredTerms(source, "includeAnyTerms");
    const excludeTerms = getConfiguredTerms(source, "excludeTerms");
    const maxItems = getMaxItems(source);

    const filteredFeedItems = (feed.items ?? []).filter((item) => {
      const haystack = normalizeForMatch(
        [
          item.title,
          item.contentSnippet,
          item.content,
          ...flattenUnknownText(item.categories),
        ]
          .flatMap((entry) => flattenUnknownText(entry))
          .filter((entry) => entry.length > 0)
          .join(" "),
      );

      if (
        excludeTerms.some((term) => haystack.includes(normalizeForMatch(term)))
      ) {
        return false;
      }

      if (includeAnyTerms.length === 0) {
        return true;
      }

      return includeAnyTerms.some((term) =>
        haystack.includes(normalizeForMatch(term)),
      );
    });

    const items: ExtractedCandidateItem[] = filteredFeedItems
      .slice(0, maxItems)
      .map((item) => {
      const title = item.title ?? "Untitled official update";
      const url = item.link ?? source.sourceUrl;
      const text = item.contentSnippet ?? item.content ?? item.title ?? "";
      const publicationDate = item.isoDate ?? null;

      return {
        stableId: buildStableCandidateId({
          sourceId: source.id,
          title,
          url,
          publicationDate,
          externalId: item.guid ?? null,
        }),
        title,
        url,
        text,
        excerpt: buildExcerpt(text),
        publicationDate,
        sourceName: source.name,
        sourceId: source.id,
        jurisdictionHint: source.jurisdiction,
        metadata: {
          guid: item.guid,
          categories: flattenUnknownText(item.categories),
          contentType: "rss_item",
          feedTitle: feed.title ?? null,
        },
      };
    });

    return {
      items,
      errors: [],
      warnings: [
        ...(items.length === 0
          ? ["RSS feed parsed successfully but returned zero items."]
          : []),
        ...(filteredFeedItems.length > items.length
          ? [`RSS connector limited processing to the first ${items.length} filtered items returned by the source.`]
          : []),
      ],
      responseStatus: fetchResult.response.status,
      itemsFetched: items.length,
      zeroResultsReason:
        items.length === 0
          ? includeAnyTerms.length > 0
            ? "The official RSS feed responded, but no items matched the configured deterministic AI-regulation terms."
            : "The official RSS feed returned zero items."
          : null,
      fetchMetadata: fetchResult.fetchMetadata,
    };
  }
}
