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
  listRawRegulatoryItems(limit?: number, sourceId?: string): Promise<RawRegulatoryItem[]>;
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
