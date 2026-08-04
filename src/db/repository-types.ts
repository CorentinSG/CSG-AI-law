import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { IngestionLog, IngestionLogInput } from "@/agents/ingestion/types";
import type {
  CountryIntelligence,
  CountryIntelligenceInput,
  CountryProfileReviewEvent,
  CountryProfileReviewEventInput,
  CountryIntelligenceSource,
  CountryIntelligenceSourceInput,
  DataQualityFinding,
  DataQualityFindingInput,
  DiscoveryLead,
  DiscoveryLeadInput,
  NewsItemRecord,
  NewsItemRecordInput,
  ReviewEvent,
  ReviewEventInput,
  ScanJob,
  ScanJobInput,
  SourceReferenceRecord,
  SourceReferenceRecordInput,
  SourceHealthCheck,
  SourceHealthCheckInput,
  VerificationAttempt,
  VerificationAttemptInput,
} from "@/agents/ai-regulation/governance";
import type { AuthorityType, ReviewStatus } from "@/db/schema";
import type { CursorPosition } from "@/lib/pagination";

export type RepositoryMode = "memory" | "supabase";
export type VisibilityScope = "admin" | "public";

export interface ListPageParams {
  limit?: number;
  offset?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** Parameters for keyset (cursor-based) pagination. Admin offset pagination remains unchanged. */
export interface ListCursorParams {
  limit?: number;
  /** Resume after this position. Null or absent = start from the beginning. */
  after?: CursorPosition | null;
}

/** Result for keyset-paginated list queries. No total count — avoids expensive COUNT(*). */
export interface CursorPagedResult<T> {
  items: T[];
  limit: number;
  hasMore: boolean;
  /** Cursor for the next page, or null when there are no more items. */
  nextCursor: CursorPosition | null;
}

// Re-export CursorPosition so callers can import from one place.
export type { CursorPosition };

// Re-export ingestion types so repository consumers can import from one place.
export type { IngestionLog, IngestionLogInput };

export type CountryIntelligenceUpsertInput = CountryIntelligenceInput & { id: string };
export type CountryIntelligenceSourceWriteInput = CountryIntelligenceSourceInput & {
  id: string;
};

/** The only fields cross-source corroboration reads from a candidate. */
export type CorroborationCandidate = Pick<
  AiRegulatoryUpdate,
  | "id"
  | "rawItemId"
  | "sourceId"
  | "status"
  | "title"
  | "jurisdiction"
  | "region"
  | "country"
  | "publicationDate"
  | "detectedDate"
  | "sourceName"
  | "sourceUrl"
  | "authorityType"
  | "developmentType"
>;

/**
 * Fields the public hub actually renders (cards + database explorer).
 *
 * `summary` stays because deriveUpdateAuthorityType infers from it when a row
 * carries no authority tag — dropping it would silently change labels. What
 * goes is the bulk: whatHappened, whyItMatters, practicalImpact,
 * affectedParties, keyObligations, complianceDeadlines, enforcementRisk.
 */
export type PublicUpdateSummary = Pick<
  AiRegulatoryUpdate,
  | "id"
  | "title"
  | "oneSentenceSummary"
  | "summary"
  | "region"
  | "country"
  | "jurisdiction"
  | "legalArea"
  | "importanceLevel"
  | "publicationDate"
  | "sourceName"
  | "sourceUrl"
  | "authorityType"
  | "developmentType"
  | "tags"
  | "createdAt"
>;

export interface RegulatoryUpdateFilters {
  status?: string;
  jurisdiction?: string;
  region?: string;
  legalArea?: string;
  authorityType?: string;
  developmentType?: string;
  importanceLevel?: string;
  publicationDate?: string;
  sourceName?: string;
  tag?: string;
}

export type RegulatoryUpdateDraftInput = Omit<
  AiRegulatoryUpdate,
  "id" | "createdAt" | "updatedAt"
>;

export type RawRegulatoryItemInput = Omit<
  RawRegulatoryItem,
  "id" | "createdAt" | "updatedAt"
>;

export type RegulationSourceInput = Omit<
  RegulationSource,
  "createdAt" | "updatedAt"
>;

export type ScanLogInput = Omit<RegulationScanLog, "id" | "createdAt">;
export type AiProcessingLogInput = Omit<AiProcessingLog, "id" | "createdAt">;

export type EditableRegulatoryUpdateFields = Partial<
  Pick<
    AiRegulatoryUpdate,
    | "title"
    | "sourceName"
    | "sourceUrl"
    | "jurisdiction"
    | "region"
    | "country"
    | "publicationDate"
    | "oneSentenceSummary"
    | "summary"
    | "whatHappened"
    | "whyItMatters"
    | "practicalImpact"
    | "affectedParties"
    | "keyObligations"
    | "complianceDeadlines"
    | "enforcementRisk"
    | "importanceLevel"
    | "confidenceLevel"
    | "tags"
    | "developmentType"
    | "legalArea"
    | "authorityType"
  >
>;

export type EditableDiscoveryLeadFields = Partial<
  Omit<DiscoveryLead, "id" | "createdAt" | "updatedAt">
>;

export interface ScanJobStartAttemptInput {
  startedAt: string;
  leaseOwner: string;
  leaseToken: string;
  leaseHeartbeatAt?: string;
  leaseHeartbeatIntervalMs?: number;
  leaseHeartbeatTimeoutMs?: number;
}

export interface RegulatoryUpdateFilterOptions {
  [key: string]: string[];
  status: string[];
  jurisdiction: string[];
  region: string[];
  legalArea: string[];
  authorityType: AuthorityType[];
  developmentType: string[];
  importanceLevel: string[];
  publicationDate: string[];
  tag: string[];
  sourceName: string[];
}

export interface AiRegulationRepository {
  readonly mode: RepositoryMode;
  listRegulatoryUpdates(
    filters?: RegulatoryUpdateFilters,
    scope?: VisibilityScope,
  ): Promise<AiRegulatoryUpdate[]>;
  listRegulatoryUpdatesPage(
    filters?: RegulatoryUpdateFilters,
    scope?: VisibilityScope,
    page?: ListPageParams,
  ): Promise<PagedResult<AiRegulatoryUpdate>>;
  listDistinctFilterValues(
    scope?: VisibilityScope,
  ): Promise<RegulatoryUpdateFilterOptions>;

  getRegulatoryUpdateById(
    id: string,
    scope?: VisibilityScope,
  ): Promise<AiRegulatoryUpdate | null>;
  createRawRegulatoryItem(input: RawRegulatoryItemInput): Promise<RawRegulatoryItem>;
  upsertRawItem(
    item: RawRegulatoryItemInput,
  ): Promise<{ item: RawRegulatoryItem; inserted: boolean }>;
  findRawRegulatoryItemByHash(hash: string): Promise<RawRegulatoryItem | null>;
  getRawRegulatoryItemById(id: string): Promise<RawRegulatoryItem | null>;
  getRawRegulatoryItemsByIds(ids: string[]): Promise<RawRegulatoryItem[]>;
  updateRawRegulatoryItemMetadata(
    id: string,
    rawMetadata: Record<string, unknown>,
  ): Promise<RawRegulatoryItem>;
  createAiRegulatoryUpdate(
    input: RegulatoryUpdateDraftInput,
  ): Promise<AiRegulatoryUpdate>;
  updateAiRegulatoryUpdate(
    id: string,
    patch: EditableRegulatoryUpdateFields,
  ): Promise<AiRegulatoryUpdate>;
  transitionReviewStatus(
    id: string,
    status: ReviewStatus,
    reviewer?: string,
  ): Promise<AiRegulatoryUpdate>;
  listSources(): Promise<RegulationSource[]>;
  getSourceById(id: string): Promise<RegulationSource | null>;
  createSource(input: RegulationSourceInput): Promise<RegulationSource>;
  updateSource(
    id: string,
    patch: Partial<RegulationSource>,
  ): Promise<RegulationSource>;
  disableSource(id: string): Promise<RegulationSource>;
  listScanLogs(limit?: number, sourceId?: string): Promise<RegulationScanLog[]>;
  createScanLog(input: ScanLogInput): Promise<RegulationScanLog>;
  /**
   * Deletes scan logs started before `cutoffIso`, at most `batchSize` rows per
   * call. Returns how many were deleted, so a caller can stop once a pass comes
   * back short. Bounded on purpose: an unbounded delete over a table that had
   * grown enough to blow the statement timeout would simply re-create it.
   */
  purgeScanLogsBefore(cutoffIso: string, batchSize?: number): Promise<number>;
  /** Same bounded contract as purgeScanLogsBefore, over source_health_checks.checked_at. */
  purgeSourceHealthChecksBefore(cutoffIso: string, batchSize?: number): Promise<number>;
  /**
   * Deletes only findings whose resolved_at is set and older than the cutoff.
   * Unresolved findings are never touched — deleting an open problem is how it
   * gets forgotten.
   */
  purgeResolvedDataQualityFindingsBefore(cutoffIso: string, batchSize?: number): Promise<number>;
  listRawRegulatoryItems(limit?: number, sourceId?: string): Promise<RawRegulatoryItem[]>;
  /**
   * Slim identity projection (id, rawUrl, rawTitle, hash) of a source's most
   * recent raw items. Exists for the per-scan republication-duplicate check:
   * the full row carries raw_metadata JSONB that is far too heavy to pull by
   * the hundreds on every scanned source.
   */
  listRawItemIdentitiesBySource(
    sourceId: string,
    limit?: number,
  ): Promise<Array<{ id: string; rawUrl: string; rawTitle: string; hash: string }>>;
  listProcessingLogs(limit?: number): Promise<AiProcessingLog[]>;
  createAiProcessingLog(input: AiProcessingLogInput): Promise<AiProcessingLog>;
  listSourceReferences(
    limit?: number,
    options?: { rawItemId?: string; regulatoryUpdateId?: string },
  ): Promise<SourceReferenceRecord[]>;
  replaceSourceReferencesForRawItem(
    rawItemId: string,
    references: SourceReferenceRecordInput[],
  ): Promise<SourceReferenceRecord[]>;
  listVerificationAttempts(
    limit?: number,
    rawItemId?: string,
  ): Promise<VerificationAttempt[]>;
  createVerificationAttempt(
    input: VerificationAttemptInput,
  ): Promise<VerificationAttempt>;
  listReviewEvents(
    limit?: number,
    regulatoryUpdateId?: string,
  ): Promise<ReviewEvent[]>;
  createReviewEvent(input: ReviewEventInput): Promise<ReviewEvent>;
  listDataQualityFindings(
    limit?: number,
    entityType?: string,
  ): Promise<DataQualityFinding[]>;
  listDataQualityFindingsPage(
    entityType?: string,
    page?: ListPageParams,
  ): Promise<PagedResult<DataQualityFinding>>;
  upsertDataQualityFinding(
    input: DataQualityFindingInput,
  ): Promise<DataQualityFinding>;
  listScanJobs(limit?: number): Promise<ScanJob[]>;
  /**
   * Oldest-first queue head: `status = 'queued'` ordered by `created_at ASC`.
   *
   * Workers must select from this rather than filtering a recent-jobs window —
   * `listScanJobs()` orders newest-first, so once the queue is longer than the
   * window the oldest queued jobs are never reached (queue starvation).
   */
  listQueuedScanJobs(limit?: number): Promise<ScanJob[]>;
  /**
   * Scan jobs with `created_at >= since`, newest first, capped at `limit`.
   *
   * A time window, not a row window: use it for duplicate/recency checks so the
   * lookback is the interval the caller actually means, independent of enqueue
   * volume. If more jobs than `limit` fall inside the window the read is capped
   * and the truncation is reported.
   */
  listScanJobsCreatedSince(since: string, limit?: number): Promise<ScanJob[]>;
  listScanJobsPage(page?: ListPageParams): Promise<PagedResult<ScanJob>>;
  listScanJobsCursorPage(page?: ListCursorParams): Promise<CursorPagedResult<ScanJob>>;
  getScanJobById(id: string): Promise<ScanJob | null>;
  createScanJob(input: ScanJobInput): Promise<ScanJob>;
  tryStartScanJob(id: string, input: ScanJobStartAttemptInput): Promise<ScanJob | null>;
  completeScanJob(
    id: string,
    leaseToken: string,
    patch: Partial<ScanJob>,
  ): Promise<ScanJob | null>;
  heartbeatScanJob(
    id: string,
    leaseToken: string,
    heartbeatAt: string,
  ): Promise<ScanJob | null>;
  recoverStaleScanJob(
    id: string,
    leaseToken: string,
    expectedHeartbeatAt: string | null,
    patch: Partial<ScanJob>,
  ): Promise<ScanJob | null>;
  updateScanJob(id: string, patch: Partial<ScanJob>): Promise<ScanJob>;
  listDiscoveryLeads(limit?: number, status?: string): Promise<DiscoveryLead[]>;
  listDiscoveryLeadsPage(
    status?: string,
    page?: ListPageParams,
  ): Promise<PagedResult<DiscoveryLead>>;
  listDiscoveryLeadsCursorPage(
    status?: string,
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<DiscoveryLead>>;
  getDiscoveryLeadById(id: string): Promise<DiscoveryLead | null>;
  getDiscoveryLeadByRawItemId(rawItemId: string): Promise<DiscoveryLead | null>;
  createDiscoveryLead(input: DiscoveryLeadInput): Promise<DiscoveryLead>;
  updateDiscoveryLead(
    id: string,
    patch: EditableDiscoveryLeadFields,
  ): Promise<DiscoveryLead>;
  listNewsItems(
    limit?: number,
    scope?: VisibilityScope,
  ): Promise<NewsItemRecord[]>;
  listNewsItemsPage(
    scope?: VisibilityScope,
    page?: ListPageParams,
  ): Promise<PagedResult<NewsItemRecord>>;
  /** Keyset (cursor-based) pagination for public news items. No COUNT query. */
  listNewsItemsCursorPage(
    scope?: VisibilityScope,
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<NewsItemRecord>>;
  /** Keyset (cursor-based) pagination for regulatory updates. No COUNT query. */
  listRegulatoryUpdatesCursorPage(
    filters?: RegulatoryUpdateFilters,
    scope?: VisibilityScope,
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<AiRegulatoryUpdate>>;
  getNewsItemBySlug(
    slug: string,
    scope?: VisibilityScope,
  ): Promise<NewsItemRecord | null>;
  upsertNewsItem(input: NewsItemRecordInput): Promise<NewsItemRecord>;
  listSourceHealthChecks(
    limit?: number,
    sourceId?: string,
  ): Promise<SourceHealthCheck[]>;
  createSourceHealthCheck(
    input: SourceHealthCheckInput,
  ): Promise<SourceHealthCheck>;
  /**
   * Slim projection of recent updates for cross-source corroboration.
   *
   * Corroboration compares identity, geography, dates and titles — it never
   * reads the prose. Pulling full rows for this (400 per scan batch, each
   * carrying summary/whatHappened/whyItMatters/practicalImpact/…) was the
   * single largest source of database egress in the system.
   */
  listCorroborationCandidates(limit: number): Promise<CorroborationCandidate[]>;
  /**
   * Keyset page of published updates, projected to what the public hub
   * renders. The hub is force-dynamic, so every visit (including every
   * crawler hit) was fetching up to 96 complete rows — prose included — to
   * display a card and a filter table.
   */
  listPublicUpdateSummariesCursorPage(
    filters?: RegulatoryUpdateFilters,
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<PublicUpdateSummary>>;
  /**
   * AI processing logs for one month (`YYYY-MM`), projected to the two fields
   * the spend estimator reads. It previously pulled 2000 full rows per scan
   * batch and filtered the month in memory.
   */
  listAiSpendLogsForMonth(
    monthPrefix: string,
    limit?: number,
  ): Promise<Array<Pick<AiProcessingLog, "createdAt" | "errorMessage">>>;
  /**
   * Exact number of published updates whose region is one of `regions`.
   *
   * Head-only count: the hub's regional cards need totals over the whole
   * table, and counting a fetched page instead reports the page size, which
   * is how Europe and the U.S. both came to claim the same "18 entries".
   */
  countPublicUpdatesForRegions(regions: readonly string[]): Promise<number>;
  /** Same contract for publicly visible news items. */
  countPublicNewsItemsForRegions(regions: readonly string[]): Promise<number>;
  listCountryIntelligence(region?: CountryIntelligence["region"]): Promise<CountryIntelligence[]>;
  getCountryIntelligenceBySlug(slug: string): Promise<CountryIntelligence | null>;
  upsertCountryIntelligence(input: CountryIntelligenceUpsertInput): Promise<CountryIntelligence>;
  listCountryProfileReviewEvents(
    limit?: number,
    countryId?: string,
  ): Promise<CountryProfileReviewEvent[]>;
  createCountryProfileReviewEvent(
    input: CountryProfileReviewEventInput,
  ): Promise<CountryProfileReviewEvent>;
  listCountryIntelligenceSources(countryId: string): Promise<CountryIntelligenceSource[]>;
  replaceCountryIntelligenceSources(
    countryId: string,
    sources: CountryIntelligenceSourceWriteInput[],
  ): Promise<CountryIntelligenceSource[]>;

  // ── Ingestion pipeline ──────────────────────────────────────────────────
  /** Find a raw item by its normalized URL. Used for URL-based deduplication. */
  findRawRegulatoryItemByUrl(url: string): Promise<RawRegulatoryItem | null>;
  /** Create an ingestion log entry for one source run. */
  createIngestionLog(input: IngestionLogInput): Promise<IngestionLog>;
  /** List ingestion log entries, optionally filtered by source. */
  listIngestionLogs(limit?: number, sourceId?: string): Promise<IngestionLog[]>;
}

export class RepositoryConfigurationError extends Error {}
export class RepositoryOperationError extends Error {}

export function assertValidStatusTransition(
  current: ReviewStatus,
  next: ReviewStatus,
) {
  const allowed: Record<ReviewStatus, ReviewStatus[]> = {
    needs_review: ["approved", "rejected", "archived"],
    approved: ["published", "archived"],
    published: ["archived"],
    rejected: ["archived"],
    archived: [],
  };

  if (!allowed[current].includes(next)) {
    throw new RepositoryOperationError(
      `Invalid status transition from ${current} to ${next}.`,
    );
  }
}
