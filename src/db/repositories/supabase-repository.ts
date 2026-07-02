import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CountryIntelligence,
  CountryProfileReviewEventInput,
  DataQualityFindingInput,
  DiscoveryLead,
  DiscoveryLeadInput,
  NewsItemRecord,
  NewsItemRecordInput,
  ReviewEventInput,
  ScanJob,
  ScanJobInput,
  SourceReferenceRecord,
  SourceReferenceRecordInput,
  SourceHealthCheckInput,
  VerificationAttemptInput,
} from "@/agents/ai-regulation/governance";
import type { AiRegulatoryUpdate, RegulationSource } from "@/agents/ai-regulation/types";
import type { IngestionLog, IngestionLogInput } from "@/agents/ingestion/types";
import { computeCountryNeedsReReview } from "@/agents/ai-regulation/country-review";
import { getSourceReferencesFromRawItem } from "@/agents/ai-regulation/citations";
import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";
import { deriveUpdateAuthorityType } from "@/agents/ai-regulation/utils/authority";
import { buildNewsItemFromUpdate } from "@/content/ai-regulation/news";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import {
  countryIntelligenceSourceToInsert,
  countryIntelligenceToInsert,
  countryProfileReviewEventToInsert,
  mapCountryIntelligenceRow,
  mapCountryProfileReviewEventRow,
  mapCountryIntelligenceSourceRow,
  mapIngestionLogRow,
  dataQualityFindingToInsert,
  discoveryLeadToInsert,
  mapDataQualityFindingRow,
  mapDiscoveryLeadRow,
  mapNewsItemRow,
  mapProcessingLogRow,
  mapRawItemRow,
  mapReviewEventRow,
  mapScanLogRow,
  mapScanJobRow,
  mapSourceRow,
  mapSourceReferenceRow,
  mapSourceHealthCheckRow,
  mapUpdateRow,
  mapVerificationAttemptRow,
  newsItemToInsert,
  processingLogToInsert,
  rawItemToInsert,
  reviewEventToInsert,
  scanLogToInsert,
  scanJobToInsert,
  sourceToInsert,
  sourceHealthCheckToInsert,
  sourceReferenceToInsert,
  updateToInsert,
  verificationAttemptToInsert,
} from "@/db/supabase-mappers";
import {
  buildCountryIntelligenceSeed,
  buildCountryIntelligenceSourcesSeed,
} from "@/db/seed/country-intelligence-seed";
import type {
  AiProcessingLogInput,
  AiRegulationRepository,
  CountryIntelligenceSourceWriteInput,
  CountryIntelligenceUpsertInput,
  CursorPagedResult,
  EditableDiscoveryLeadFields,
  EditableRegulatoryUpdateFields,
  ListCursorParams,
  ListPageParams,
  ScanJobStartAttemptInput,
  RawRegulatoryItemInput,
  RegulationSourceInput,
  RegulatoryUpdateFilterOptions,
  RegulatoryUpdateDraftInput,
  RegulatoryUpdateFilters,
  ScanLogInput,
  VisibilityScope,
} from "@/db/repository-types";
import {
  RepositoryConfigurationError,
  RepositoryOperationError,
  assertValidStatusTransition,
} from "@/db/repository-types";
import type { CursorPosition } from "@/lib/pagination";
import { getSupabaseAdminClient, getSupabaseServerReadClient } from "@/lib/supabase";

type Row = Record<string, unknown>;


function requireAdminClient(): SupabaseClient {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new RepositoryConfigurationError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or switch repository mode to memory.",
    );
  }
  return client;
}

function requirePublicReadClient(): SupabaseClient {
  const client = getSupabaseServerReadClient();
  if (!client) {
    throw new RepositoryConfigurationError(
      "Public Supabase reads are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}

function handleError(
  message: string,
  error: {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null,
) {
  if (error) {
    const remediation =
      error.code === "42501"
        ? " Apply src/db/migrations/002_supabase_access_policies.sql in the Supabase SQL editor, or re-run the latest grants/policies migration."
        : error.code === "PGRST204"
          ? " Supabase schema is missing one or more columns expected by the current repository layer. Apply src/db/migrations/003_foundation_hardening.sql and src/db/migrations/004_operational_jobs_and_news.sql, then retry."
        : "";

    throw new RepositoryOperationError(
      [
        message,
        `message=${error.message ?? "Unknown error"}`,
        `details=${error.details ?? "none"}`,
        `hint=${error.hint ?? "none"}`,
        `code=${error.code ?? "none"}`,
        `remediation=${remediation || "none"}`,
      ].join(" | "),
    );
  }
}

function isMissingRelationError(
  error: {
    code?: string;
    message?: string;
  } | null,
) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

function isMissingScanJobCompletionRpcError(
  error: {
    code?: string;
    message?: string;
  } | null,
) {
  return error?.code === "PGRST202" || isMissingRelationError(error);
}

function isSchemaCacheMismatchError(
  error: {
    code?: string;
    message?: string;
  } | null,
) {
  return error?.code === "PGRST204";
}

function isMissingAuthorityTypeColumnError(
  error: {
    code?: string;
    message?: string;
  } | null,
) {
  return (
    (error?.code === "42703" || error?.code === "PGRST204") &&
    /authority_type/i.test(error.message ?? "")
  );
}

const legacyUnsupportedSourceColumns = new Set([
  "last_successful_scan_at",
  "last_failed_scan_at",
  "latest_response_status",
  "latest_items_fetched",
  "latest_new_items_detected",
  "latest_duplicates_detected",
  "latest_parser_warnings",
  "latest_accessibility_issue",
  "source_reliability_notes",
  // migration 009 columns — not present before that migration is applied
  "ingestion_method",
  "source_category",
  "scrapling_config",
  "crawl_root_url",
]);

const legacySourceTypeFallbacks: Record<string, string> = {
  court_database: "legislative_database",
  standards_body: "static_page",
  tracker_source: "static_page",
  discovery_source: "static_page",
  media_source: "static_page",
};

function adaptSourceRowForLegacySchema(row: Record<string, unknown>) {
  const normalized = Object.fromEntries(
    Object.entries(row).filter(([key]) => !legacyUnsupportedSourceColumns.has(key)),
  );
  const sourceType = normalized.source_type;
  if (typeof sourceType === "string" && sourceType in legacySourceTypeFallbacks) {
    normalized.source_type = legacySourceTypeFallbacks[sourceType];
  }
  return normalized;
}

type QueryLike = {
  eq(column: string, value: string): QueryLike;
  contains(column: string, value: string[]): QueryLike;
};

function applyUpdateFilters(
  query: QueryLike,
  filters?: RegulatoryUpdateFilters,
  options: { includeAuthorityType?: boolean } = {},
) {
  const includeAuthorityType = options.includeAuthorityType ?? true;
  if (!filters) return query;
  if (filters.status && filters.status !== "all") query.eq("status", filters.status);
  if (filters.jurisdiction && filters.jurisdiction !== "all")
    query.eq("jurisdiction", filters.jurisdiction);
  if (filters.region && filters.region !== "all") query.eq("region", filters.region);
  if (filters.legalArea && filters.legalArea !== "all")
    query.eq("legal_area", filters.legalArea);
  if (includeAuthorityType && filters.authorityType && filters.authorityType !== "all")
    query.eq("authority_type", filters.authorityType);
  if (filters.developmentType && filters.developmentType !== "all")
    query.eq("development_type", filters.developmentType);
  if (filters.importanceLevel && filters.importanceLevel !== "all")
    query.eq("importance_level", filters.importanceLevel);
  if (filters.publicationDate && filters.publicationDate !== "all")
    query.eq("publication_date", filters.publicationDate);
  if (filters.sourceName && filters.sourceName !== "all")
    query.eq("source_name", filters.sourceName);
  if (filters.tag && filters.tag !== "all") query.contains("tags", [filters.tag]);
  return query;
}

function sourcePatchToRow(patch: Partial<RegulationSource>) {
  const row = sourceToInsert(patch);
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

function updatePatchToRow(patch: EditableRegulatoryUpdateFields) {
  const row = updateToInsert(patch as Partial<AiRegulatoryUpdate>);
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

function withAuthorityType(
  update: RegulatoryUpdateDraftInput,
): RegulatoryUpdateDraftInput {
  return {
    ...update,
    authorityType: update.authorityType ?? deriveUpdateAuthorityType(update),
  };
}

function scanJobPatchToRow(patch: Partial<ScanJob>) {
  const row = scanJobToInsert(patch);
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

function discoveryLeadPatchToRow(patch: EditableDiscoveryLeadFields) {
  const row = discoveryLeadToInsert(patch as Partial<DiscoveryLead>);
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

function sourceReferenceInputToRecord(
  input: SourceReferenceRecordInput,
): SourceReferenceRecord {
  return {
    ...input,
    id: `sref-${randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
}

function buildDataQualityFindingId(input: DataQualityFindingInput) {
  return `dqf-${input.entityType}-${input.entityId}-${input.findingType}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function buildNewsItemId(input: NewsItemRecordInput) {
  if (input.regulatoryUpdateId) {
    return `news-${input.regulatoryUpdateId}`;
  }
  return `news-raw-${input.rawItemId}`;
}

function resolvePage(page?: ListPageParams) {
  const limit = Math.max(1, page?.limit ?? 24);
  const offset = Math.max(0, page?.offset ?? 0);
  return { limit, offset };
}

function compareForCursorSort(
  aDate: string | null,
  aTiebreaker: string,
  bDate: string | null,
  bTiebreaker: string,
): number {
  if (aDate === null && bDate === null) return bTiebreaker.localeCompare(aTiebreaker);
  if (aDate === null) return 1;
  if (bDate === null) return -1;
  if (aDate > bDate) return -1;
  if (aDate < bDate) return 1;
  return bTiebreaker.localeCompare(aTiebreaker);
}

function isAfterCursor(
  itemDate: string | null,
  itemTiebreaker: string,
  cursor: CursorPosition,
): boolean {
  const cursorHasDate = cursor.date !== "";
  if (cursorHasDate) {
    if (itemDate === null) return true;
    if (itemDate < cursor.date) return true;
    if (itemDate === cursor.date && itemTiebreaker < cursor.tiebreaker) return true;
    return false;
  }
  if (itemDate !== null) return false;
  return itemTiebreaker < cursor.tiebreaker;
}


// Explicit column selections for list views.
// Using named columns (not select("*")) ensures:
// - Payload stays bounded even if heavy columns are added to the schema later
// - List views never accidentally load expensive JSONB blobs not needed for cards
//
// ai_regulatory_updates: all columns used by mapUpdateRow
const UPDATE_LIST_COLUMNS = [
  "id", "source_id", "raw_item_id", "title", "source_name", "source_url",
  "jurisdiction", "region", "country", "development_type", "legal_area",
  "authority_type", "publication_date", "detected_date", "one_sentence_summary", "summary",
  "what_happened", "why_it_matters", "practical_impact", "affected_parties",
  "key_obligations", "compliance_deadlines", "enforcement_risk",
  "importance_level", "confidence_level", "tags", "status",
  "reviewed_by", "reviewed_at", "published_at", "created_at", "updated_at",
].join(",");

const LEGACY_UPDATE_LIST_COLUMNS = UPDATE_LIST_COLUMNS
  .split(",")
  .filter((column) => column !== "authority_type")
  .join(",");

function applyLegacyAuthorityTypeFilter(
  updates: AiRegulatoryUpdate[],
  filters?: RegulatoryUpdateFilters,
) {
  if (!filters?.authorityType || filters.authorityType === "all") {
    return updates;
  }
  return updates.filter(
    (update) => (update.authorityType ?? deriveUpdateAuthorityType(update)) === filters.authorityType,
  );
}

export async function upsertRawItemWithClient(
  client: Pick<SupabaseClient, "rpc">,
  input: RawRegulatoryItemInput,
): Promise<{ item: ReturnType<typeof mapRawItemRow>; inserted: boolean }> {
  const candidateId = `raw-${randomUUID()}`;
  const candidate = {
    ...input,
    id: candidateId,
  };
  const sourceReferences = getSourceReferencesFromRawItem({
    rawMetadata: input.rawMetadata,
  }).map((reference) =>
    sourceReferenceToInsert(
      sourceReferenceInputToRecord({
        ...reference,
        rawItemId: candidateId,
        regulatoryUpdateId: null,
      }),
    ),
  );
  const { data, error } = await client.rpc("upsert_raw_regulatory_item", {
    p_item: rawItemToInsert(candidate),
    p_source_references: sourceReferences,
  });
  handleError("Failed to atomically upsert raw regulatory item", error);
  const result = (data as Array<{ item: Row; inserted: boolean }> | null)?.[0];
  if (!result?.item) {
    throw new RepositoryOperationError(
      `Raw item upsert did not return a canonical row for hash=${input.hash}.`,
    );
  }
  return {
    item: mapRawItemRow(result.item),
    inserted: result.inserted,
  };
}

export async function completeScanJobWithClient(
  client: Pick<SupabaseClient, "rpc">,
  legacyScanJobs: Map<string, ScanJob>,
  id: string,
  leaseToken: string,
  patch: Partial<ScanJob>,
): Promise<ScanJob | null> {
  if (
    !patch.status ||
    !["succeeded", "partial_success", "failed"].includes(patch.status)
  ) {
    return null;
  }

  const { data, error } = await client.rpc("complete_scan_job", {
    p_id: id,
    p_lease_token: leaseToken,
    p_status: patch.status,
    p_finished_at: patch.finishedAt,
    p_result_summary: patch.resultSummary,
    p_error_message: patch.errorMessage,
  });
  if (isMissingScanJobCompletionRpcError(error)) {
    const existing = legacyScanJobs.get(id);
    if (
      !existing ||
      existing.status !== "running" ||
      existing.resultSummary?.leaseToken !== leaseToken
    ) {
      return null;
    }
    const updated: ScanJob = {
      ...existing,
      status: patch.status,
      finishedAt: patch.finishedAt ?? null,
      resultSummary: patch.resultSummary ?? existing.resultSummary,
      errorMessage: patch.errorMessage ?? null,
      updatedAt: new Date().toISOString(),
    };
    legacyScanJobs.set(id, updated);
    return updated;
  }
  handleError("Failed to complete scan job", error);
  const row = Array.isArray(data) ? data[0] : data;
  return row ? mapScanJobRow(row as Row) : null;
}

function omitAuthorityTypeColumn(row: Record<string, unknown>) {
  const copy = { ...row };
  delete copy.authority_type;
  return copy;
}

// raw_regulatory_items list view: excludes raw_text (can be KB-MB of page content)
// raw_text is only needed for AI processing, not for admin list/planning views.
const RAW_ITEM_LIST_COLUMNS = [
  "id", "source_id", "raw_title", "raw_url",
  "raw_metadata", "detected_at", "hash",
  "duplicate_of", "processing_status", "created_at", "updated_at",
].join(",");

export class SupabaseAiRegulationRepository implements AiRegulationRepository {
  readonly mode = "supabase" as const;
  private readonly legacySourceReferences = new Map<string, SourceReferenceRecord[]>();
  private readonly legacyVerificationAttempts = new Map<string, ReturnType<typeof mapVerificationAttemptRow>>();
  private readonly legacyReviewEvents = new Map<string, ReturnType<typeof mapReviewEventRow>>();
  private readonly legacyDataQualityFindings = new Map<string, ReturnType<typeof mapDataQualityFindingRow>>();
  private readonly legacyScanJobs = new Map<string, ScanJob>();
  private readonly legacyDiscoveryLeads = new Map<string, ReturnType<typeof mapDiscoveryLeadRow>>();
  private readonly legacyNewsItems = new Map<string, ReturnType<typeof mapNewsItemRow>>();
  private readonly legacySourceHealthChecks = new Map<string, ReturnType<typeof mapSourceHealthCheckRow>>();
  private readonly legacyCountryIntelligence = new Map<
    string,
    ReturnType<typeof mapCountryIntelligenceRow>
  >(
    buildCountryIntelligenceSeed().map((country) => [
      country.id,
      mapCountryIntelligenceRow(countryIntelligenceToInsert(country)),
    ]),
  );
  private readonly legacyCountryIntelligenceSources = new Map<
    string,
    ReturnType<typeof mapCountryIntelligenceSourceRow>[]
  >();
  private readonly legacyCountryProfileReviewEvents = new Map<
    string,
    ReturnType<typeof mapCountryProfileReviewEventRow>
  >();

  private createLegacyVerificationAttemptRecord(input: VerificationAttemptInput) {
    return mapVerificationAttemptRow(
      verificationAttemptToInsert({
        ...input,
        id: `vat-${randomUUID()}`,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private createLegacyReviewEventRecord(input: ReviewEventInput) {
    return mapReviewEventRow(
      reviewEventToInsert({
        ...input,
        id: `rev-${randomUUID()}`,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private createLegacyDataQualityFindingRecord(input: DataQualityFindingInput) {
    const timestamp = new Date().toISOString();
    return mapDataQualityFindingRow(
      dataQualityFindingToInsert({
        ...input,
        id: buildDataQualityFindingId(input),
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }

  private createLegacyScanJobRecord(input: ScanJobInput) {
    const timestamp = new Date().toISOString();
    return mapScanJobRow(
      scanJobToInsert({
        ...input,
        id: `job-${randomUUID()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }

  private createLegacyDiscoveryLeadRecord(input: DiscoveryLeadInput) {
    const timestamp = new Date().toISOString();
    return mapDiscoveryLeadRow(
      discoveryLeadToInsert({
        ...input,
        id: `lead-${randomUUID()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }

  private createLegacyCountryIntelligenceRecord(input: CountryIntelligenceUpsertInput) {
    const timestamp = new Date().toISOString();
    return mapCountryIntelligenceRow(
      countryIntelligenceToInsert({
        ...input,
        needsReReview: computeCountryNeedsReReview(input.lastReviewedAt),
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }

  private createLegacyCountryProfileReviewEventRecord(
    input: CountryProfileReviewEventInput,
  ) {
    return mapCountryProfileReviewEventRow(
      countryProfileReviewEventToInsert({
        ...input,
        id: `country-review-${randomUUID()}`,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private createLegacyCountryIntelligenceSourceRecord(
    input: CountryIntelligenceSourceWriteInput,
  ) {
    return mapCountryIntelligenceSourceRow(
      countryIntelligenceSourceToInsert({
        ...input,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private getLegacyCountryIntelligenceSources(countryId: string) {
    const existing = this.legacyCountryIntelligenceSources.get(countryId);
    if (existing) {
      return existing;
    }
    const seeded = buildCountryIntelligenceSourcesSeed()
      .filter((source) => source.countryId === countryId)
      .map((source) =>
        mapCountryIntelligenceSourceRow(countryIntelligenceSourceToInsert(source)),
      );
    this.legacyCountryIntelligenceSources.set(countryId, seeded);
    return seeded;
  }

  private createLegacyNewsItemRecord(input: NewsItemRecordInput) {
    const timestamp = new Date().toISOString();
    return mapNewsItemRow(
      newsItemToInsert({
        ...input,
        id: buildNewsItemId(input),
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  }

  private createLegacySourceHealthCheckRecord(input: SourceHealthCheckInput) {
    return mapSourceHealthCheckRow(
      sourceHealthCheckToInsert({
        ...input,
        id: `shc-${randomUUID()}`,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private async buildFallbackNewsItems(scope: VisibilityScope) {
    const updates = await this.listRegulatoryUpdates(
      undefined,
      scope === "public" ? "public" : "admin",
    );
    const items = await Promise.all(
      updates.map(async (update) => {
        const [rawItem, source] = await Promise.all([
          this.getRawRegulatoryItemById(update.rawItemId),
          this.getSourceById(update.sourceId),
        ]);

        const news = buildNewsItemFromUpdate({ update, rawItem, source });
        return {
          ...news,
          regulatoryUpdateId: update.id,
          rawItemId: update.rawItemId,
          createdAt: update.createdAt,
          updatedAt: update.updatedAt,
        };
      }),
    );

    return items.sort((a, b) => {
      const aDate = a.publicationDate ?? a.detectedAt;
      const bDate = b.publicationDate ?? b.detectedAt;
      return bDate.localeCompare(aDate);
    });
  }

  async listRegulatoryUpdates(
    filters?: RegulatoryUpdateFilters,
    scope: VisibilityScope = "admin",
  ) {
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("ai_regulatory_updates")
      .select(UPDATE_LIST_COLUMNS)
      .order("publication_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (scope === "public") {
      query = query.eq("status", "published");
    }

    applyUpdateFilters(query, filters);
    const { data, error } = await query;
    if (isMissingAuthorityTypeColumnError(error)) {
      let legacyQuery = client
        .from("ai_regulatory_updates")
        .select(LEGACY_UPDATE_LIST_COLUMNS)
        .order("publication_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (scope === "public") {
        legacyQuery = legacyQuery.eq("status", "published");
      }
      applyUpdateFilters(legacyQuery, filters, { includeAuthorityType: false });
      const legacyResult = await legacyQuery;
      handleError("Failed to list regulatory updates", legacyResult.error);
      return applyLegacyAuthorityTypeFilter(
        ((legacyResult.data ?? []) as unknown as Row[]).map(mapUpdateRow),
        filters,
      );
    }
    handleError("Failed to list regulatory updates", error);
    return ((data ?? []) as unknown as Row[]).map(mapUpdateRow);
  }

  async listRegulatoryUpdatesPage(
    filters?: RegulatoryUpdateFilters,
    scope: VisibilityScope = "admin",
    page?: ListPageParams,
  ) {
    const { limit, offset } = resolvePage(page);
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("ai_regulatory_updates")
      .select(UPDATE_LIST_COLUMNS, { count: "exact" })
      .order("publication_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (scope === "public") {
      query = query.eq("status", "published");
    }

    applyUpdateFilters(query, filters);
    const { data, error, count } = await query;
    if (isMissingAuthorityTypeColumnError(error)) {
      let legacyQuery = client
        .from("ai_regulatory_updates")
        .select(LEGACY_UPDATE_LIST_COLUMNS)
        .order("publication_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (scope === "public") {
        legacyQuery = legacyQuery.eq("status", "published");
      }
      applyUpdateFilters(legacyQuery, filters, { includeAuthorityType: false });
      const legacyResult = await legacyQuery;
      handleError("Failed to page regulatory updates", legacyResult.error);
      const filtered = applyLegacyAuthorityTypeFilter(
        ((legacyResult.data ?? []) as unknown as Row[]).map(mapUpdateRow),
        filters,
      );
      const items = filtered.slice(offset, offset + limit);
      return {
        items,
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + items.length < filtered.length,
      };
    }
    handleError("Failed to page regulatory updates", error);
    return {
      items: ((data ?? []) as unknown as Row[]).map(mapUpdateRow),
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + (data?.length ?? 0) < (count ?? 0),
    };
  }

  async listRegulatoryUpdatesCursorPage(
    filters?: RegulatoryUpdateFilters,
    scope: VisibilityScope = "admin",
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<AiRegulatoryUpdate>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("ai_regulatory_updates")
      .select(UPDATE_LIST_COLUMNS)
      .order("publication_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (scope === "public") {
      query = query.eq("status", "published");
    }

    if (cursor) {
      if (cursor.date !== "") {
        // Items after cursor: earlier date, OR same date with earlier created_at, OR null date (NULLS LAST)
        query = query.or(
          `publication_date.lt.${cursor.date},and(publication_date.eq.${cursor.date},created_at.lt.${cursor.tiebreaker}),publication_date.is.null`,
        );
      } else {
        // Cursor item had no date: only null-date items with earlier created_at
        query = query.is("publication_date", null).lt("created_at", cursor.tiebreaker);
      }
    }

    applyUpdateFilters(query, filters);
    const { data, error } = await query;
    if (isMissingAuthorityTypeColumnError(error)) {
      const all = await this.listRegulatoryUpdates(filters, scope);
      const sorted = [...all].sort((a, b) =>
        compareForCursorSort(
          a.publicationDate ?? null,
          a.createdAt,
          b.publicationDate ?? null,
          b.createdAt,
        ),
      );
      const afterCursor = cursor
        ? sorted.filter((update) =>
            isAfterCursor(update.publicationDate ?? null, update.createdAt, cursor),
          )
        : sorted;
      const fetched = afterCursor.slice(0, limit + 1);
      const hasMore = fetched.length > limit;
      const items = hasMore ? fetched.slice(0, limit) : fetched;
      const lastItem = items[items.length - 1];
      const nextCursor: CursorPosition | null =
        hasMore && lastItem
          ? { date: lastItem.publicationDate ?? "", tiebreaker: lastItem.createdAt }
          : null;
      return { items, limit, hasMore, nextCursor };
    }
    handleError("Failed to cursor-page regulatory updates", error);
    const rows = ((data ?? []) as unknown as Row[]).map(mapUpdateRow);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items[items.length - 1];
    const nextCursor: CursorPosition | null =
      hasMore && lastItem
        ? { date: lastItem.publicationDate ?? "", tiebreaker: lastItem.createdAt }
        : null;
    return { items, limit, hasMore, nextCursor };
  }

  async listDistinctFilterValues(scope: VisibilityScope = "admin") {
    // Fetch only the lightweight filter columns — not select("*") which loads
    // large raw_metadata JSONB blobs for every row. This is a significant
    // payload reduction vs the previous collectOptions() full-table load.
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("ai_regulatory_updates")
      .select(
        "status,jurisdiction,region,development_type,legal_area,authority_type,publication_date,importance_level,source_name,tags",
      );
    if (scope === "public") {
      query = query.eq("status", "published");
    }
    const { data, error } = await query;
    if (isMissingAuthorityTypeColumnError(error)) {
      let legacyQuery = client
        .from("ai_regulatory_updates")
        .select(
          "status,jurisdiction,region,development_type,legal_area,publication_date,importance_level,source_name,tags",
        );
      if (scope === "public") {
        legacyQuery = legacyQuery.eq("status", "published");
      }
      const legacyResult = await legacyQuery;
      handleError("Failed to load filter values", legacyResult.error);
      const legacyRows = ((legacyResult.data ?? []) as unknown as Row[]).map(mapUpdateRow);
      const distinct = (arr: (string | null | undefined)[]) =>
        [...new Set(arr.filter((v): v is string => typeof v === "string" && v.length > 0))].sort();
      return {
        status: distinct(legacyRows.map((r) => r.status)),
        jurisdiction: distinct(legacyRows.map((r) => r.jurisdiction)),
        region: distinct(legacyRows.map((r) => r.region)),
        legalArea: distinct(legacyRows.map((r) => r.legalArea)),
        authorityType: distinct(
          legacyRows.map((r) => r.authorityType ?? deriveUpdateAuthorityType(r)),
        ) as RegulatoryUpdateFilterOptions["authorityType"],
        developmentType: distinct(legacyRows.map((r) => r.developmentType)),
        importanceLevel: distinct(legacyRows.map((r) => r.importanceLevel)),
        publicationDate: distinct(legacyRows.map((r) => r.publicationDate)),
        tag: distinct(legacyRows.flatMap((r) => r.tags)),
        sourceName: distinct(legacyRows.map((r) => r.sourceName)),
      };
    }
    handleError("Failed to load filter values", error);
    const rows = data ?? [];

    const distinct = (arr: (string | null | undefined)[]) =>
      [...new Set(arr.filter((v): v is string => typeof v === "string" && v.length > 0))].sort();

    return {
      status: distinct(rows.map((r) => r.status as string)),
      jurisdiction: distinct(rows.map((r) => r.jurisdiction as string)),
      region: distinct(rows.map((r) => r.region as string)),
      legalArea: distinct(rows.map((r) => r.legal_area as string)),
      authorityType: distinct(
        rows.map((r) => r.authority_type as string),
      ) as RegulatoryUpdateFilterOptions["authorityType"],
      developmentType: distinct(rows.map((r) => r.development_type as string)),
      importanceLevel: distinct(rows.map((r) => r.importance_level as string)),
      publicationDate: distinct(rows.map((r) => r.publication_date as string)),
      tag: distinct((rows as Array<{ tags: string[] }>).flatMap((r) => r.tags ?? [])),
      sourceName: distinct(rows.map((r) => r.source_name as string)),
    };
  }

  async getRegulatoryUpdateById(id: string, scope: VisibilityScope = "admin") {
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("ai_regulatory_updates")
      .select("*")
      .eq("id", id)
      .limit(1);
    if (scope === "public") {
      query = query.eq("status", "published");
    }
    const { data, error } = await query.maybeSingle();
    handleError("Failed to load regulatory update", error);
    return data ? mapUpdateRow(data) : null;
  }

  async createRawRegulatoryItem(input: RawRegulatoryItemInput) {
    const client = requireAdminClient();
    const row = rawItemToInsert({
      ...input,
      id: `raw-${randomUUID()}`,
    });
    const { data, error } = await client
      .from("raw_regulatory_items")
      .insert(row)
      .select("*")
      .single();
    handleError("Failed to create raw regulatory item", error);
    const record = mapRawItemRow(data);
    const sourceReferences = getSourceReferencesFromRawItem(record).map((reference) => ({
      ...reference,
      rawItemId: record.id,
      regulatoryUpdateId: null,
    }));
    if (sourceReferences.length > 0) {
      await this.replaceSourceReferencesForRawItem(record.id, sourceReferences);
    }
    return record;
  }

  async upsertRawItem(input: RawRegulatoryItemInput) {
    return upsertRawItemWithClient(requireAdminClient(), input);
  }

  async findRawRegulatoryItemByHash(hash: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("raw_regulatory_items")
      .select("*")
      .eq("hash", hash)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    handleError("Failed to check duplicate hash", error);
    return data ? mapRawItemRow(data) : null;
  }

  async getRawRegulatoryItemById(id: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("raw_regulatory_items")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    handleError("Failed to load raw regulatory item", error);
    return data ? mapRawItemRow(data) : null;
  }

  async getRawRegulatoryItemsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const client = requireAdminClient();
    const { data, error } = await client
      .from("raw_regulatory_items")
      .select(RAW_ITEM_LIST_COLUMNS)
      .in("id", ids);
    handleError("Failed to load raw regulatory items by ids", error);
    const rows = ((data ?? []) as unknown as Row[]).map(mapRawItemRow);
    const positionById = new Map(ids.map((id, index) => [id, index]));
    return rows.sort(
      (left, right) =>
        (positionById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (positionById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  async updateRawRegulatoryItemMetadata(
    id: string,
    rawMetadata: Record<string, unknown>,
  ) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("raw_regulatory_items")
      .update({
        raw_metadata: rawMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    handleError("Failed to update raw regulatory item metadata", error);
    const record = mapRawItemRow(data);
    const { data: linkedUpdate, error: linkedUpdateError } = await client
      .from("ai_regulatory_updates")
      .select("id")
      .eq("raw_item_id", id)
      .limit(1)
      .maybeSingle();
    handleError("Failed to load linked regulatory update for source references", linkedUpdateError);
    await this.replaceSourceReferencesForRawItem(
      id,
      getSourceReferencesFromRawItem(record).map((reference) => ({
        ...reference,
        rawItemId: id,
        regulatoryUpdateId: linkedUpdate?.id ? String(linkedUpdate.id) : null,
      })),
    );
    return record;
  }

  async createAiRegulatoryUpdate(input: RegulatoryUpdateDraftInput) {
    const client = requireAdminClient();
    const row = updateToInsert({
      ...withAuthorityType(input),
      id: `upd-${randomUUID()}`,
    });
    const { data, error } = await client
      .from("ai_regulatory_updates")
      .insert(row)
      .select("*")
      .single();
    if (isMissingAuthorityTypeColumnError(error)) {
      const legacyResult = await client
        .from("ai_regulatory_updates")
        .insert(omitAuthorityTypeColumn(row))
        .select("*")
        .single();
      handleError("Failed to create AI regulatory update", legacyResult.error);
      return mapUpdateRow(legacyResult.data);
    }
    handleError("Failed to create AI regulatory update", error);
    const record = mapUpdateRow(data);
    const rawItem = await this.getRawRegulatoryItemById(record.rawItemId);
    if (rawItem) {
      await this.replaceSourceReferencesForRawItem(
        rawItem.id,
        getSourceReferencesFromRawItem(rawItem).map((reference) => ({
          ...reference,
          rawItemId: rawItem.id,
          regulatoryUpdateId: record.id,
        })),
      );
    }
    return record;
  }

  async updateAiRegulatoryUpdate(
    id: string,
    patch: EditableRegulatoryUpdateFields,
  ) {
    const client = requireAdminClient();
    let patchWithAuthorityType = patch;
    if (
      !patch.authorityType &&
      (patch.developmentType || patch.title || patch.summary)
    ) {
      const existing = await this.getRegulatoryUpdateById(id, "admin");
      if (existing) {
        patchWithAuthorityType = {
          ...patch,
          authorityType: deriveUpdateAuthorityType({ ...existing, ...patch }),
        };
      }
    }
    const row = updatePatchToRow(patchWithAuthorityType);
    const { data, error } = await client
      .from("ai_regulatory_updates")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (isMissingAuthorityTypeColumnError(error)) {
      const legacyResult = await client
        .from("ai_regulatory_updates")
        .update({ ...omitAuthorityTypeColumn(row), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      handleError("Failed to update AI regulatory update", legacyResult.error);
      return mapUpdateRow(legacyResult.data);
    }
    handleError("Failed to update AI regulatory update", error);
    return mapUpdateRow(data);
  }

  async transitionReviewStatus(id: string, status: AiRegulatoryUpdate["status"], reviewer = "Admin Reviewer") {
    const existing = await this.getRegulatoryUpdateById(id, "admin");
    if (!existing) {
      throw new RepositoryOperationError(`Regulatory update ${id} not found.`);
    }
    const source = await this.getSourceById(existing.sourceId);
    if (source && isDiscoveryOnlySource(source) && (status === "approved" || status === "published")) {
      throw new RepositoryOperationError(
        "Discovery-only leads cannot be approved or published. Verify an official source first and publish from the official-source workflow instead.",
      );
    }
    if (status === "published") {
      const rawItem = await this.getRawRegulatoryItemById(existing.rawItemId);
      const eligibility = evaluatePublicationEligibility({
        update: existing,
        rawItem,
        source,
      });
      if (!eligibility.eligible) {
        throw new RepositoryOperationError(
          `Publication blocked: ${eligibility.blockingReasons.join(" ")} ${eligibility.warnings.join(" ")}`.trim(),
        );
      }
    }
    assertValidStatusTransition(existing.status, status);
    const previousStatus = existing.status;
    const publishedAt = status === "published" ? new Date().toISOString() : null;

    // Use the atomic RPC (migration 008) so the status update and the audit
    // review_event are written in a single transaction.  If the RPC is not yet
    // deployed (e.g. an older remote schema), fall back to the two-step path.
    const client = requireAdminClient();
    const eventId = `rev-${randomUUID()}`;
    const { data: rpcData, error: rpcError } = await client
      .rpc("transition_review_status", {
        p_update_id: id,
        p_next_status: status,
        p_reviewer: reviewer,
        p_previous_status: previousStatus,
        p_event_id: eventId,
        p_published_at: publishedAt,
      });

    let updated: AiRegulatoryUpdate;
    if (rpcError || !rpcData || (Array.isArray(rpcData) && rpcData.length === 0)) {
      // RPC not available (schema ahead of remote deployment) — fall back to
      // the two-step path and preserve audit trail best-effort.
      const patch: Record<string, unknown> = {
        status,
        reviewed_by: reviewer,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (status === "published") {
        patch.published_at = publishedAt;
      }
      const { data: fallbackData, error: fallbackError } = await client
        .from("ai_regulatory_updates")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      handleError("Failed to update review status", fallbackError);
      updated = mapUpdateRow(fallbackData);
      await this.createReviewEvent({
        regulatoryUpdateId: updated.id,
        sourceId: updated.sourceId,
        rawItemId: updated.rawItemId,
        eventType: "status_transition",
        actor: reviewer,
        previousStatus,
        nextStatus: status,
        notes: `Status changed from ${previousStatus} to ${status}.`,
        metadata: { publicationEligible: status === "published" },
      });
    } else {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      updated = mapUpdateRow(row);
    }

    const rawItem = await this.getRawRegulatoryItemById(updated.rawItemId);
    if (rawItem) {
      const refreshed = buildNewsItemFromUpdate({ update: updated, rawItem, source });
      await this.upsertNewsItem({
        ...refreshed,
        regulatoryUpdateId: updated.id,
        rawItemId: updated.rawItemId,
      });
    }
    return updated;
  }

  async listSources() {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("regulation_sources")
      .select("*")
      .order("created_at", { ascending: false });
    handleError("Failed to list regulation sources", error);
    return (data ?? []).map(mapSourceRow);
  }

  async getSourceById(id: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("regulation_sources")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    handleError("Failed to load regulation source", error);
    return data ? mapSourceRow(data) : null;
  }

  async createSource(input: RegulationSourceInput) {
    const client = requireAdminClient();
    const row = sourceToInsert(input);
    const { data, error } = await client
      .from("regulation_sources")
      .insert(row)
      .select("*")
      .single();
    if (isSchemaCacheMismatchError(error)) {
      const { data: legacyData, error: legacyError } = await client
        .from("regulation_sources")
        .insert(adaptSourceRowForLegacySchema(row))
        .select("*")
        .single();
      handleError("Failed to create source", legacyError);
      return mapSourceRow(legacyData);
    }
    handleError("Failed to create source", error);
    return mapSourceRow(data);
  }

  async updateSource(id: string, patch: Partial<RegulationSource>) {
    const client = requireAdminClient();
    const row = {
      ...sourcePatchToRow(patch),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await client
      .from("regulation_sources")
      .update(row)
      .eq("id", id)
      .select("*")
      .single();
    if (isSchemaCacheMismatchError(error)) {
      const { data: legacyData, error: legacyError } = await client
        .from("regulation_sources")
        .update(adaptSourceRowForLegacySchema(row))
        .eq("id", id)
        .select("*")
        .single();
      handleError("Failed to update source", legacyError);
      return mapSourceRow(legacyData);
    }
    handleError("Failed to update source", error);
    return mapSourceRow(data);
  }

  async disableSource(id: string) {
    return this.updateSource(id, { active: false });
  }

  async listScanLogs(limit = 20, sourceId?: string) {
    const client = requireAdminClient();
    let query = client
      .from("regulation_scan_logs")
      .select("*")
      .order("scan_started_at", { ascending: false })
      .limit(limit);
    if (sourceId) {
      query = query.eq("source_id", sourceId);
    }
    const { data, error } = await query;
    handleError("Failed to list scan logs", error);
    return (data ?? []).map(mapScanLogRow);
  }

  async createScanLog(input: ScanLogInput) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("regulation_scan_logs")
      .insert(
        scanLogToInsert({
          ...input,
          id: `scan-${randomUUID()}`,
        }),
      )
      .select("*")
      .single();
    handleError("Failed to create scan log", error);
    return mapScanLogRow(data);
  }

  async listRawRegulatoryItems(limit = 20, sourceId?: string) {
    const client = requireAdminClient();
    let query = client
      .from("raw_regulatory_items")
      .select(RAW_ITEM_LIST_COLUMNS)
      .order("detected_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (sourceId) {
      query = query.eq("source_id", sourceId);
    }
    const { data, error } = await query;
    handleError("Failed to list raw regulatory items", error);
    return ((data ?? []) as unknown as Row[]).map(mapRawItemRow);
  }

  async listProcessingLogs(limit = 20) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("ai_processing_logs")
      .select("*")
      .order("processing_started_at", { ascending: false })
      .limit(limit);
    handleError("Failed to list AI processing logs", error);
    return (data ?? []).map(mapProcessingLogRow);
  }

  async createAiProcessingLog(input: AiProcessingLogInput) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("ai_processing_logs")
      .insert(
        processingLogToInsert({
          ...input,
          id: `proc-${randomUUID()}`,
        }),
      )
      .select("*")
      .single();
    handleError("Failed to create AI processing log", error);
    return mapProcessingLogRow(data);
  }

  async listSourceReferences(
    limit = 50,
    options?: { rawItemId?: string; regulatoryUpdateId?: string },
  ) {
    const client = requireAdminClient();
    let query = client
      .from("source_references")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (options?.rawItemId) {
      query = query.eq("raw_item_id", options.rawItemId);
    }
    if (options?.regulatoryUpdateId) {
      query = query.eq("regulatory_update_id", options.regulatoryUpdateId);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const references = Array.from(this.legacySourceReferences.values())
        .flat()
        .filter((reference) => {
          if (options?.rawItemId && reference.rawItemId !== options.rawItemId) return false;
          if (
            options?.regulatoryUpdateId &&
            reference.regulatoryUpdateId !== options.regulatoryUpdateId
          ) {
            return false;
          }
          return true;
        });
      return references.slice(0, limit);
    }
    handleError("Failed to list source references", error);
    return (data ?? []).map(mapSourceReferenceRow);
  }

  async replaceSourceReferencesForRawItem(
    rawItemId: string,
    references: SourceReferenceRecordInput[],
  ) {
    const client = requireAdminClient();
    const { error: deleteError } = await client
      .from("source_references")
      .delete()
      .eq("raw_item_id", rawItemId);
    if (isMissingRelationError(deleteError)) {
      const inserted = references.map((reference) =>
        sourceReferenceInputToRecord(reference),
      );
      this.legacySourceReferences.set(rawItemId, inserted);
      return inserted;
    }
    handleError("Failed to clear existing source references", deleteError);

    if (references.length === 0) {
      return [];
    }

    const rows = references.map((reference) =>
      sourceReferenceToInsert(sourceReferenceInputToRecord(reference)),
    );
    const { data, error } = await client
      .from("source_references")
      .insert(rows)
      .select("*");
    if (isMissingRelationError(error)) {
      const inserted = references.map((reference) =>
        sourceReferenceInputToRecord(reference),
      );
      this.legacySourceReferences.set(rawItemId, inserted);
      return inserted;
    }
    handleError("Failed to insert source references", error);
    return (data ?? []).map(mapSourceReferenceRow);
  }

  async listVerificationAttempts(limit = 50, rawItemId?: string) {
    const client = requireAdminClient();
    let query = client
      .from("verification_attempts")
      .select("*")
      .order("attempted_at", { ascending: false })
      .limit(limit);
    if (rawItemId) {
      query = query.eq("raw_item_id", rawItemId);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const attempts = Array.from(this.legacyVerificationAttempts.values()).filter((attempt) =>
        rawItemId ? attempt.rawItemId === rawItemId : true,
      );
      return attempts.slice(0, limit);
    }
    handleError("Failed to list verification attempts", error);
    return (data ?? []).map(mapVerificationAttemptRow);
  }

  async createVerificationAttempt(input: VerificationAttemptInput) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("verification_attempts")
      .insert(
        verificationAttemptToInsert({
          ...input,
          id: `vat-${randomUUID()}`,
          createdAt: new Date().toISOString(),
        }),
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyVerificationAttemptRecord(input);
      this.legacyVerificationAttempts.set(record.id, record);
      return record;
    }
    handleError("Failed to create verification attempt", error);
    return mapVerificationAttemptRow(data);
  }

  async listReviewEvents(limit = 50, regulatoryUpdateId?: string) {
    const client = requireAdminClient();
    let query = client
      .from("review_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (regulatoryUpdateId) {
      query = query.eq("regulatory_update_id", regulatoryUpdateId);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const events = Array.from(this.legacyReviewEvents.values()).filter((event) =>
        regulatoryUpdateId ? event.regulatoryUpdateId === regulatoryUpdateId : true,
      );
      return events.slice(0, limit);
    }
    handleError("Failed to list review events", error);
    return (data ?? []).map(mapReviewEventRow);
  }

  async createReviewEvent(input: ReviewEventInput) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("review_events")
      .insert(
        reviewEventToInsert({
          ...input,
          id: `rev-${randomUUID()}`,
          createdAt: new Date().toISOString(),
        }),
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyReviewEventRecord(input);
      this.legacyReviewEvents.set(record.id, record);
      return record;
    }
    handleError("Failed to create review event", error);
    return mapReviewEventRow(data);
  }

  async listDataQualityFindings(limit = 50, entityType?: string) {
    const client = requireAdminClient();
    let query = client
      .from("data_quality_findings")
      .select("*")
      .order("last_detected_at", { ascending: false })
      .limit(limit);
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const findings = Array.from(this.legacyDataQualityFindings.values()).filter((finding) =>
        entityType ? finding.entityType === entityType : true,
      );
      return findings.slice(0, limit);
    }
    handleError("Failed to list data quality findings", error);
    return (data ?? []).map(mapDataQualityFindingRow);
  }

  async listDataQualityFindingsPage(entityType?: string, page?: ListPageParams) {
    const { limit, offset } = resolvePage(page);
    const client = requireAdminClient();
    let query = client
      .from("data_quality_findings")
      .select("*", { count: "exact" })
      .order("last_detected_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    const { data, error, count } = await query;
    if (isMissingRelationError(error)) {
      const findings = Array.from(this.legacyDataQualityFindings.values()).filter((finding) =>
        entityType ? finding.entityType === entityType : true,
      );
      const items = findings.slice(offset, offset + limit);
      return {
        items,
        total: findings.length,
        limit,
        offset,
        hasMore: offset + items.length < findings.length,
      };
    }
    handleError("Failed to page data quality findings", error);
    return {
      items: (data ?? []).map(mapDataQualityFindingRow),
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + (data?.length ?? 0) < (count ?? 0),
    };
  }

  async upsertDataQualityFinding(input: DataQualityFindingInput) {
    const client = requireAdminClient();
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("data_quality_findings")
      .upsert(
        dataQualityFindingToInsert({
          ...input,
          id: buildDataQualityFindingId(input),
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        {
          onConflict: "entity_type,entity_id,finding_type",
        },
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyDataQualityFindingRecord(input);
      this.legacyDataQualityFindings.set(record.id, record);
      return record;
    }
    handleError("Failed to upsert data quality finding", error);
    return mapDataQualityFindingRow(data);
  }

  async listScanJobs(limit = 50) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("scan_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (isMissingRelationError(error)) {
      return Array.from(this.legacyScanJobs.values()).slice(0, limit);
    }
    handleError("Failed to list scan jobs", error);
    return (data ?? []).map(mapScanJobRow);
  }

  async listScanJobsPage(page?: ListPageParams) {
    const { limit, offset } = resolvePage(page);
    const client = requireAdminClient();
    const { data, error, count } = await client
      .from("scan_jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (isMissingRelationError(error)) {
      const jobs = Array.from(this.legacyScanJobs.values());
      const items = jobs.slice(offset, offset + limit);
      return {
        items,
        total: jobs.length,
        limit,
        offset,
        hasMore: offset + items.length < jobs.length,
      };
    }
    handleError("Failed to page scan jobs", error);
    return {
      items: (data ?? []).map(mapScanJobRow),
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + (data?.length ?? 0) < (count ?? 0),
    };
  }

  async listScanJobsCursorPage(
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<ScanJob>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const client = requireAdminClient();
    let query = client
      .from("scan_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.tiebreaker})`,
      );
    }

    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const jobs = [...this.legacyScanJobs.values()].sort((a, b) =>
        compareForCursorSort(a.createdAt, a.id, b.createdAt, b.id),
      );
      const afterCursor = cursor
        ? jobs.filter((job) => isAfterCursor(job.createdAt, job.id, cursor))
        : jobs;
      const fetched = afterCursor.slice(0, limit + 1);
      const hasMore = fetched.length > limit;
      const items = hasMore ? fetched.slice(0, limit) : fetched;
      const lastItem = items[items.length - 1];
      const nextCursor: CursorPosition | null =
        hasMore && lastItem
          ? { date: lastItem.createdAt, tiebreaker: lastItem.id }
          : null;
      return { items, limit, hasMore, nextCursor };
    }
    handleError("Failed to cursor-page scan jobs", error);
    const rows = (data ?? []).map(mapScanJobRow);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items[items.length - 1];
    const nextCursor: CursorPosition | null =
      hasMore && lastItem ? { date: lastItem.createdAt, tiebreaker: lastItem.id } : null;
    return { items, limit, hasMore, nextCursor };
  }

  async getScanJobById(id: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("scan_jobs")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    if (isMissingRelationError(error)) {
      return this.legacyScanJobs.get(id) ?? null;
    }
    handleError("Failed to load scan job", error);
    return data ? mapScanJobRow(data) : null;
  }

  async createScanJob(input: ScanJobInput) {
    const client = requireAdminClient();
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("scan_jobs")
      .insert(
        scanJobToInsert({
          ...input,
          id: `job-${randomUUID()}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyScanJobRecord(input);
      this.legacyScanJobs.set(record.id, record);
      return record;
    }
    handleError("Failed to create scan job", error);
    return mapScanJobRow(data);
  }

  async tryStartScanJob(id: string, input: ScanJobStartAttemptInput) {
    const client = requireAdminClient();
    const existing = await this.getScanJobById(id);
    if (!existing) {
      throw new RepositoryOperationError(`Scan job ${id} not found.`);
    }
    if (existing.status !== "queued" || existing.startedAt || existing.finishedAt) {
      return null;
    }

    const mergedResultSummary = {
      ...existing.resultSummary,
      leaseOwner: input.leaseOwner,
      leaseToken: input.leaseToken,
      leaseAcquiredAt: input.startedAt,
      leaseHeartbeatAt: input.leaseHeartbeatAt ?? input.startedAt,
      leaseHeartbeatIntervalMs: input.leaseHeartbeatIntervalMs,
      leaseHeartbeatTimeoutMs: input.leaseHeartbeatTimeoutMs,
      claimedFromStatus: "queued",
    };

    const { data, error } = await client
      .from("scan_jobs")
      .update({
        status: "running",
        started_at: input.startedAt,
        finished_at: null,
        error_message: null,
        result_summary: mergedResultSummary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "queued")
      .is("started_at", null)
      .is("finished_at", null)
      .select("*")
      .maybeSingle();
    if (isMissingRelationError(error)) {
      const legacyExisting = this.legacyScanJobs.get(id);
      if (!legacyExisting) {
        throw new RepositoryOperationError(`Scan job ${id} not found.`);
      }
      if (
        legacyExisting.status !== "queued" ||
        legacyExisting.startedAt ||
        legacyExisting.finishedAt
      ) {
        return null;
      }
      const updated: ScanJob = {
        ...legacyExisting,
        status: "running",
        startedAt: input.startedAt,
        finishedAt: null,
        errorMessage: null,
        resultSummary: mergedResultSummary,
        updatedAt: new Date().toISOString(),
      };
      this.legacyScanJobs.set(id, updated);
      return updated;
    }
    handleError("Failed to claim scan job for processing", error);
    return data ? mapScanJobRow(data) : null;
  }

  async updateScanJob(id: string, patch: Partial<ScanJob>) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("scan_jobs")
      .update({
        ...scanJobPatchToRow(patch),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const existing = this.legacyScanJobs.get(id);
      if (!existing) {
        throw new RepositoryOperationError(`Scan job ${id} not found.`);
      }
      const updated: ScanJob = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.legacyScanJobs.set(id, updated);
      return updated;
    }
    handleError("Failed to update scan job", error);
    return mapScanJobRow(data);
  }

  async completeScanJob(id: string, leaseToken: string, patch: Partial<ScanJob>) {
    return completeScanJobWithClient(
      requireAdminClient(),
      this.legacyScanJobs,
      id,
      leaseToken,
      patch,
    );
  }

  async listDiscoveryLeads(limit = 50, status?: string) {
    const client = requireAdminClient();
    let query = client
      .from("discovery_leads")
      .select("*")
      .order("detected_at", { ascending: false })
      .limit(limit);
    if (status) {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const leads = Array.from(this.legacyDiscoveryLeads.values()).filter((lead) =>
        status ? lead.status === status : true,
      );
      return leads.slice(0, limit);
    }
    handleError("Failed to list discovery leads", error);
    return (data ?? []).map(mapDiscoveryLeadRow);
  }

  async listDiscoveryLeadsPage(status?: string, page?: ListPageParams) {
    const { limit, offset } = resolvePage(page);
    const client = requireAdminClient();
    let query = client
      .from("discovery_leads")
      .select("*", { count: "exact" })
      .order("detected_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) {
      query = query.eq("status", status);
    }
    const { data, error, count } = await query;
    if (isMissingRelationError(error)) {
      const leads = Array.from(this.legacyDiscoveryLeads.values()).filter((lead) =>
        status ? lead.status === status : true,
      );
      const items = leads.slice(offset, offset + limit);
      return {
        items,
        total: leads.length,
        limit,
        offset,
        hasMore: offset + items.length < leads.length,
      };
    }
    handleError("Failed to page discovery leads", error);
    return {
      items: (data ?? []).map(mapDiscoveryLeadRow),
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + (data?.length ?? 0) < (count ?? 0),
    };
  }

  async listDiscoveryLeadsCursorPage(
    status?: string,
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<DiscoveryLead>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const client = requireAdminClient();
    let query = client
      .from("discovery_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (status) {
      query = query.eq("status", status);
    }
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.tiebreaker})`,
      );
    }

    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const leads = [...this.legacyDiscoveryLeads.values()]
        .filter((lead) => (status ? lead.status === status : true))
        .sort((a, b) => compareForCursorSort(a.createdAt, a.id, b.createdAt, b.id));
      const afterCursor = cursor
        ? leads.filter((lead) => isAfterCursor(lead.createdAt, lead.id, cursor))
        : leads;
      const fetched = afterCursor.slice(0, limit + 1);
      const hasMore = fetched.length > limit;
      const items = hasMore ? fetched.slice(0, limit) : fetched;
      const lastItem = items[items.length - 1];
      const nextCursor: CursorPosition | null =
        hasMore && lastItem
          ? { date: lastItem.createdAt, tiebreaker: lastItem.id }
          : null;
      return { items, limit, hasMore, nextCursor };
    }
    handleError("Failed to cursor-page discovery leads", error);
    const rows = (data ?? []).map(mapDiscoveryLeadRow);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items[items.length - 1];
    const nextCursor: CursorPosition | null =
      hasMore && lastItem ? { date: lastItem.createdAt, tiebreaker: lastItem.id } : null;
    return { items, limit, hasMore, nextCursor };
  }

  async getDiscoveryLeadById(id: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("discovery_leads")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    if (isMissingRelationError(error)) {
      return this.legacyDiscoveryLeads.get(id) ?? null;
    }
    handleError("Failed to load discovery lead", error);
    return data ? mapDiscoveryLeadRow(data) : null;
  }

  async getDiscoveryLeadByRawItemId(rawItemId: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("discovery_leads")
      .select("*")
      .eq("raw_item_id", rawItemId)
      .order("detected_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (isMissingRelationError(error)) {
      return (
        Array.from(this.legacyDiscoveryLeads.values()).find(
          (lead) => lead.rawItemId === rawItemId,
        ) ?? null
      );
    }
    handleError("Failed to load discovery lead by raw item id", error);
    return data ? mapDiscoveryLeadRow(data) : null;
  }

  async createDiscoveryLead(input: DiscoveryLeadInput) {
    const client = requireAdminClient();
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("discovery_leads")
      .insert(
        discoveryLeadToInsert({
          ...input,
          id: `lead-${randomUUID()}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyDiscoveryLeadRecord(input);
      this.legacyDiscoveryLeads.set(record.id, record);
      return record;
    }
    handleError("Failed to create discovery lead", error);
    return mapDiscoveryLeadRow(data);
  }

  async updateDiscoveryLead(id: string, patch: EditableDiscoveryLeadFields) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("discovery_leads")
      .update({
        ...discoveryLeadPatchToRow(patch),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const existing = this.legacyDiscoveryLeads.get(id);
      if (!existing) {
        throw new RepositoryOperationError(`Discovery lead ${id} not found.`);
      }
      const updated = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.legacyDiscoveryLeads.set(id, updated);
      return updated;
    }
    handleError("Failed to update discovery lead", error);
    return mapDiscoveryLeadRow(data);
  }

  async listNewsItems(limit = 100, scope: VisibilityScope = "admin") {
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("news_items")
      .select("*")
      .order("publication_date", { ascending: false, nullsFirst: false })
      .order("detected_at", { ascending: false })
      .limit(limit);
    if (scope === "public") {
      query = query.eq("public_visibility_status", "public");
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const fallback = await this.buildFallbackNewsItems(scope);
      return fallback.slice(0, limit);
    }
    handleError("Failed to list news items", error);
    return (data ?? []).map(mapNewsItemRow);
  }

  async listNewsItemsPage(scope: VisibilityScope = "admin", page?: ListPageParams) {
    const { limit, offset } = resolvePage(page);
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("news_items")
      .select("*", { count: "exact" })
      .order("publication_date", { ascending: false, nullsFirst: false })
      .order("detected_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (scope === "public") {
      query = query.eq("public_visibility_status", "public");
    }
    const { data, error, count } = await query;
    if (isMissingRelationError(error)) {
      const fallback = await this.buildFallbackNewsItems(scope);
      const items = fallback.slice(offset, offset + limit);
      return {
        items,
        total: fallback.length,
        limit,
        offset,
        hasMore: offset + items.length < fallback.length,
      };
    }
    handleError("Failed to page news items", error);
    return {
      items: (data ?? []).map(mapNewsItemRow),
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + (data?.length ?? 0) < (count ?? 0),
    };
  }

  async listNewsItemsCursorPage(
    scope: VisibilityScope = "admin",
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<NewsItemRecord>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client
      .from("news_items")
      .select("*")
      .order("publication_date", { ascending: false, nullsFirst: false })
      .order("detected_at", { ascending: false })
      .limit(limit + 1);

    if (scope === "public") {
      query = query.eq("public_visibility_status", "public");
    }

    if (cursor) {
      if (cursor.date !== "") {
        // Items after cursor: earlier date, OR same date with earlier detected_at, OR null date (NULLS LAST)
        query = query.or(
          `publication_date.lt.${cursor.date},and(publication_date.eq.${cursor.date},detected_at.lt.${cursor.tiebreaker}),publication_date.is.null`,
        );
      } else {
        // Cursor item had no date: only null-date items with earlier detected_at
        query = query.is("publication_date", null).lt("detected_at", cursor.tiebreaker);
      }
    }

    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      // Fallback: sort/filter in memory from regulatory updates
      const fallback = await this.buildFallbackNewsItems(scope);
      const afterCursor = cursor
        ? fallback.filter((item) => {
            const d = item.publicationDate;
            const tb = item.detectedAt;
            if (cursor.date !== "") {
              if (d === null) return true;
              if (d < cursor.date) return true;
              if (d === cursor.date && tb < cursor.tiebreaker) return true;
              return false;
            } else {
              if (d !== null) return false;
              return tb < cursor.tiebreaker;
            }
          })
        : fallback;
      const fetched = afterCursor.slice(0, limit + 1);
      const hasMore = fetched.length > limit;
      const items = hasMore ? fetched.slice(0, limit) : fetched;
      const lastItem = items[items.length - 1];
      const nextCursor: CursorPosition | null =
        hasMore && lastItem
          ? { date: lastItem.publicationDate ?? "", tiebreaker: lastItem.detectedAt }
          : null;
      return { items, limit, hasMore, nextCursor };
    }
    handleError("Failed to cursor-page news items", error);
    const rows = (data ?? []).map(mapNewsItemRow);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items[items.length - 1];
    const nextCursor: CursorPosition | null =
      hasMore && lastItem
        ? { date: lastItem.publicationDate ?? "", tiebreaker: lastItem.detectedAt }
        : null;
    return { items, limit, hasMore, nextCursor };
  }

  async getNewsItemBySlug(slug: string, scope: VisibilityScope = "admin") {
    const client = scope === "public" ? requirePublicReadClient() : requireAdminClient();
    let query = client.from("news_items").select("*").eq("slug", slug).limit(1);
    if (scope === "public") {
      query = query.eq("public_visibility_status", "public");
    }
    const { data, error } = await query.maybeSingle();
    if (isMissingRelationError(error)) {
      const fallback = await this.buildFallbackNewsItems(scope);
      return fallback.find((item) => item.slug === slug) ?? null;
    }
    handleError("Failed to load news item", error);
    return data ? mapNewsItemRow(data) : null;
  }

  async upsertNewsItem(input: NewsItemRecordInput) {
    const client = requireAdminClient();
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("news_items")
      .upsert(
        newsItemToInsert({
          ...input,
          id: buildNewsItemId(input),
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        { onConflict: "id" },
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyNewsItemRecord(input);
      this.legacyNewsItems.set(record.id, record);
      return record;
    }
    handleError("Failed to upsert news item", error);
    return mapNewsItemRow(data);
  }

  async listSourceHealthChecks(limit = 50, sourceId?: string) {
    const client = requireAdminClient();
    let query = client
      .from("source_health_checks")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(limit);
    if (sourceId) {
      query = query.eq("source_id", sourceId);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const checks = Array.from(this.legacySourceHealthChecks.values()).filter((check) =>
        sourceId ? check.sourceId === sourceId : true,
      );
      return checks.slice(0, limit);
    }
    handleError("Failed to list source health checks", error);
    return (data ?? []).map(mapSourceHealthCheckRow);
  }

  async createSourceHealthCheck(input: SourceHealthCheckInput) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("source_health_checks")
      .insert(
        sourceHealthCheckToInsert({
          ...input,
          id: `shc-${randomUUID()}`,
          createdAt: new Date().toISOString(),
        }),
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacySourceHealthCheckRecord(input);
      this.legacySourceHealthChecks.set(record.id, record);
      return record;
    }
    handleError("Failed to create source health check", error);
    return mapSourceHealthCheckRow(data);
  }

  async listCountryIntelligence(region?: CountryIntelligence["region"]) {
    const client = requireAdminClient();
    let query = client
      .from("country_intelligence")
      .select("*")
      .order("country_name", { ascending: true });
    if (region) {
      query = query.eq("region", region);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const countries = Array.from(this.legacyCountryIntelligence.values());
      return region ? countries.filter((country) => country.region === region) : countries;
    }
    handleError("Failed to list country intelligence", error);
    return (data ?? []).map(mapCountryIntelligenceRow);
  }

  async getCountryIntelligenceBySlug(slug: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("country_intelligence")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (isMissingRelationError(error)) {
      return (
        Array.from(this.legacyCountryIntelligence.values()).find(
          (country) => country.slug === slug,
        ) ?? null
      );
    }
    handleError("Failed to load country intelligence", error);
    return data ? mapCountryIntelligenceRow(data) : null;
  }

  async upsertCountryIntelligence(input: CountryIntelligenceUpsertInput) {
    const client = requireAdminClient();
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("country_intelligence")
      .upsert(
        countryIntelligenceToInsert({
          ...input,
          needsReReview: computeCountryNeedsReReview(input.lastReviewedAt),
          updatedAt: timestamp,
          createdAt: timestamp,
        }),
        { onConflict: "id" },
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const existing = this.legacyCountryIntelligence.get(input.id);
      const record = existing
        ? mapCountryIntelligenceRow(
            countryIntelligenceToInsert({
              ...existing,
              ...input,
              needsReReview: computeCountryNeedsReReview(input.lastReviewedAt),
              updatedAt: timestamp,
              createdAt: existing.createdAt,
            }),
          )
        : this.createLegacyCountryIntelligenceRecord(input);
      this.legacyCountryIntelligence.set(record.id, record);
      return record;
    }
    handleError("Failed to upsert country intelligence", error);
    return mapCountryIntelligenceRow(data);
  }

  async listCountryProfileReviewEvents(limit = 50, countryId?: string) {
    const client = requireAdminClient();
    let query = client
      .from("country_profile_review_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (countryId) {
      query = query.eq("country_id", countryId);
    }
    const { data, error } = await query;
    if (isMissingRelationError(error)) {
      const events = Array.from(this.legacyCountryProfileReviewEvents.values()).filter(
        (event) => (countryId ? event.countryId === countryId : true),
      );
      return events.slice(0, limit);
    }
    handleError("Failed to list country profile review events", error);
    return (data ?? []).map(mapCountryProfileReviewEventRow);
  }

  async createCountryProfileReviewEvent(input: CountryProfileReviewEventInput) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("country_profile_review_events")
      .insert(
        countryProfileReviewEventToInsert({
          ...input,
          id: `country-review-${randomUUID()}`,
          createdAt: new Date().toISOString(),
        }),
      )
      .select("*")
      .single();
    if (isMissingRelationError(error)) {
      const record = this.createLegacyCountryProfileReviewEventRecord(input);
      this.legacyCountryProfileReviewEvents.set(record.id, record);
      return record;
    }
    handleError("Failed to create country profile review event", error);
    return mapCountryProfileReviewEventRow(data);
  }

  async listCountryIntelligenceSources(countryId: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("country_intelligence_sources")
      .select("*")
      .eq("country_id", countryId)
      .order("created_at", { ascending: true });
    if (isMissingRelationError(error)) {
      return this.getLegacyCountryIntelligenceSources(countryId);
    }
    handleError("Failed to list country intelligence sources", error);
    return (data ?? []).map(mapCountryIntelligenceSourceRow);
  }

  async replaceCountryIntelligenceSources(
    countryId: string,
    sources: CountryIntelligenceSourceWriteInput[],
  ) {
    const client = requireAdminClient();
    const deleteResult = await client
      .from("country_intelligence_sources")
      .delete()
      .eq("country_id", countryId);
    if (isMissingRelationError(deleteResult.error)) {
      const records = sources.map((source) =>
        this.createLegacyCountryIntelligenceSourceRecord(source),
      );
      this.legacyCountryIntelligenceSources.set(countryId, records);
      return records;
    }
    handleError("Failed to clear country intelligence sources", deleteResult.error);

    if (sources.length === 0) {
      return [];
    }

    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("country_intelligence_sources")
      .insert(
        sources.map((source) =>
          countryIntelligenceSourceToInsert({
            ...source,
            createdAt: timestamp,
          }),
        ),
      )
      .select("*");
    handleError("Failed to replace country intelligence sources", error);
    return (data ?? []).map(mapCountryIntelligenceSourceRow);
  }

  // ── Ingestion pipeline ────────────────────────────────────────────────

  async findRawRegulatoryItemByUrl(url: string) {
    const client = requireAdminClient();
    const { data, error } = await client
      .from("raw_regulatory_items")
      .select("*")
      .eq("raw_url", url)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    return mapRawItemRow(data);
  }

  async createIngestionLog(input: IngestionLogInput): Promise<IngestionLog> {
    const client = requireAdminClient();
    const row = {
      id: input.id,
      source_id: input.source_id ?? null,
      method: input.method,
      status: input.status,
      urls_discovered: input.urls_discovered ?? 0,
      items_ingested: input.items_ingested ?? 0,
      duplicates: input.duplicates ?? 0,
      error_message: input.error_message ?? null,
      details: input.details ?? {},
      started_at: input.started_at,
      finished_at: input.finished_at ?? null,
    };
    const { data, error } = await client
      .from("ingestion_logs")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      // Non-fatal: return a local copy if Supabase insert fails
      return {
        ...input,
        urls_discovered: input.urls_discovered ?? 0,
        items_ingested: input.items_ingested ?? 0,
        duplicates: input.duplicates ?? 0,
        details: input.details ?? {},
        error_message: input.error_message ?? null,
        finished_at: input.finished_at ?? null,
        created_at: new Date().toISOString(),
      };
    }
    return mapIngestionLogRow(data);
  }

  async listIngestionLogs(limit = 50, sourceId?: string): Promise<IngestionLog[]> {
    const client = requireAdminClient();
    let query = client
      .from("ingestion_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (sourceId) query = query.eq("source_id", sourceId);
    const { data, error } = await query;
    if (error) return [];
    return (data ?? []).map(mapIngestionLogRow);
  }
}
