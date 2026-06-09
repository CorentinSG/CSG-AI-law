import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";
import { buildExcerpt, buildStableCandidateId, normalizeWhitespace } from "@/agents/ai-regulation/connectors/connector-utils";

export const itemExtractor = {
  extract(items: ExtractedCandidateItem[], source: RegulationSource) {
    const detectedAt = new Date().toISOString();

    return items.map((item) => {
      const normalizedText = normalizeWhitespace(item.text || item.excerpt || item.title);
      const normalizedExcerpt = buildExcerpt(item.excerpt ?? normalizedText);

      return {
        ...item,
        stableId:
          item.stableId ??
          buildStableCandidateId({
            sourceId: source.id,
            title: item.title,
            url: item.url,
            publicationDate: item.publicationDate,
            externalId:
              typeof item.metadata?.documentNumber === "string"
                ? item.metadata.documentNumber
                : typeof item.metadata?.guid === "string"
                  ? item.metadata.guid
                  : null,
          }),
        sourceId: item.sourceId ?? source.id,
        sourceName: item.sourceName ?? source.name,
        detectedAt: item.detectedAt ?? detectedAt,
        excerpt: normalizedExcerpt,
        text: normalizedText,
        jurisdictionHint: item.jurisdictionHint ?? source.jurisdiction,
        metadata: {
          sourceName: source.name,
          sourceId: source.id,
          sourceUrl: source.sourceUrl,
          sourceType: source.sourceType,
          ...item.metadata,
        },
      };
    });
  },
};
