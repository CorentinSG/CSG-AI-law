import {
  getCitationReferences,
  getSourceReferencesFromRawItem,
} from "@/agents/ai-regulation/citations";
import type {
  CountryIntelligence,
  CountryIntelligenceSource,
  DataQualityFinding,
  NewsItemRecord,
  ReviewEvent,
  ScanJob,
  SourceReferenceRecord,
  SourceHealthCheck,
  VerificationAttempt,
} from "@/agents/ai-regulation/governance";
import { buildNewsItemFromUpdate } from "@/content/ai-regulation/news";
import {
  buildCountryIntelligenceSeed,
  buildCountryIntelligenceSourcesSeed,
} from "@/db/seed/country-intelligence-seed";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import {
  aiProcessingLogsSeed,
  aiRegulatoryUpdatesSeed,
  rawRegulatoryItemsSeed,
  regulationScanLogsSeed,
  regulationSourcesSeed,
} from "@/db/seed/ai-regulation-seed";

export type SeedProfile = "production_safe" | "demo";

export interface SeedDataset {
  sources: RegulationSource[];
  rawItems: RawRegulatoryItem[];
  updates: AiRegulatoryUpdate[];
  scanLogs: RegulationScanLog[];
  processingLogs: AiProcessingLog[];
  sourceReferences: SourceReferenceRecord[];
  verificationAttempts: VerificationAttempt[];
  reviewEvents: ReviewEvent[];
  dataQualityFindings: DataQualityFinding[];
  scanJobs: ScanJob[];
  newsItems: NewsItemRecord[];
  sourceHealthChecks: SourceHealthCheck[];
  countryIntelligence: CountryIntelligence[];
  countryIntelligenceSources: CountryIntelligenceSource[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toProductionSafeUpdate(update: AiRegulatoryUpdate): AiRegulatoryUpdate {
  return {
    ...update,
    status: "needs_review",
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
  };
}

function buildSourceReferences(
  sources: RegulationSource[],
  rawItems: RawRegulatoryItem[],
  updates: AiRegulatoryUpdate[],
) {
  const updateByRawItemId = new Map(updates.map((update) => [update.rawItemId, update.id]));
  const updateRecordByRawItemId = new Map(
    updates.map((update) => [update.rawItemId, update]),
  );
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return rawItems.flatMap((rawItem) => {
    const update = updateRecordByRawItemId.get(rawItem.id);
    const source = sourceById.get(rawItem.sourceId) ?? null;
    const references =
      getSourceReferencesFromRawItem(rawItem).length > 0 || !update || !source
        ? getSourceReferencesFromRawItem(rawItem)
        : getCitationReferences({ update, rawItem, source });

    return references.map((reference, index) => ({
      ...reference,
      id: `sref-${rawItem.id}-${index + 1}`,
      rawItemId: rawItem.id,
      regulatoryUpdateId: updateByRawItemId.get(rawItem.id) ?? null,
      createdAt: rawItem.createdAt,
    }));
  });
}

function buildVerificationAttempts(rawItems: RawRegulatoryItem[]) {
  return rawItems.flatMap((rawItem, rawIndex) => {
    const attempts = Array.isArray(rawItem.rawMetadata.verificationAttempts)
      ? rawItem.rawMetadata.verificationAttempts
      : [];

    return attempts.flatMap((attempt, attemptIndex) => {
      if (!attempt || typeof attempt !== "object") return [];
      const candidate = attempt as Record<string, unknown>;

      const record: VerificationAttempt = {
        id: `vat-${rawItem.id}-${rawIndex + 1}-${attemptIndex + 1}`,
        rawItemId: rawItem.id,
        sourceReferenceId: null,
        sourceName:
          typeof candidate.sourceName === "string" ? candidate.sourceName : "Unknown source",
        sourceUrl: typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : "",
        sourceType:
          typeof candidate.sourceType === "string" ? candidate.sourceType : "unknown",
        attemptType:
          typeof candidate.attemptType === "string"
            ? candidate.attemptType
            : "recurring_verification",
        resultStatus:
          typeof candidate.resultStatus === "string"
            ? candidate.resultStatus
            : "unknown",
        responseStatus:
          typeof candidate.responseStatus === "number"
            ? candidate.responseStatus
            : null,
        officialSourceFound: Boolean(candidate.officialSourceFound),
        officialSourceUrl:
          typeof candidate.officialSourceUrl === "string"
            ? candidate.officialSourceUrl
            : null,
        notes: typeof candidate.notes === "string" ? candidate.notes : null,
        attemptedAt:
          typeof candidate.attemptedAt === "string"
            ? candidate.attemptedAt
            : rawItem.updatedAt,
        createdAt:
          typeof candidate.attemptedAt === "string"
            ? candidate.attemptedAt
            : rawItem.updatedAt,
      };

      return [record];
    });
  });
}

function buildNewsItems(
  sources: RegulationSource[],
  rawItems: RawRegulatoryItem[],
  updates: AiRegulatoryUpdate[],
  profile: SeedProfile,
): NewsItemRecord[] {
  const rawItemById = new Map(rawItems.map((rawItem) => [rawItem.id, rawItem]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return updates.map((update) => {
    const news = buildNewsItemFromUpdate({
      update,
      rawItem: rawItemById.get(update.rawItemId) ?? null,
      source: sourceById.get(update.sourceId) ?? null,
    });

    const record = {
      ...news,
      regulatoryUpdateId: update.id,
      rawItemId: update.rawItemId,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
    };

    if (profile === "production_safe") {
      return {
        ...record,
        publicVisibilityStatus: "admin_only",
        relatedMonitorItemId: null,
        reviewerNotes:
          "Production-safe seed news is private until a live review or runtime publication workflow publishes it.",
      };
    }

    return record;
  });
}

export function buildSeedDataset(profile: SeedProfile = "production_safe"): SeedDataset {
  const sources = clone(regulationSourcesSeed);
  const rawItems = clone(rawRegulatoryItemsSeed);
  const updates =
    profile === "production_safe"
      ? clone(aiRegulatoryUpdatesSeed).map(toProductionSafeUpdate)
      : clone(aiRegulatoryUpdatesSeed);
  const scanLogs = clone(regulationScanLogsSeed);
  const processingLogs = clone(aiProcessingLogsSeed);
  const sourceReferences = buildSourceReferences(sources, rawItems, updates);
  const verificationAttempts = buildVerificationAttempts(rawItems);
  const newsItems = buildNewsItems(sources, rawItems, updates, profile);
  const countryIntelligence = buildCountryIntelligenceSeed();
  const countryIntelligenceSources = buildCountryIntelligenceSourcesSeed();

  return {
    sources,
    rawItems,
    updates,
    scanLogs,
    processingLogs,
    sourceReferences,
    verificationAttempts,
    reviewEvents: [],
    dataQualityFindings: [],
    scanJobs: [],
    newsItems,
    sourceHealthChecks: [],
    countryIntelligence,
    countryIntelligenceSources,
  };
}
