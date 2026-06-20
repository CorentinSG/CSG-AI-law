import { randomUUID } from "node:crypto";

import type {
  CountryIntelligence,
  CountryProfileReviewEvent,
  CountryProfileReviewEventInput,
  CountryIntelligenceSource,
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
import { computeCountryNeedsReReview } from "@/agents/ai-regulation/country-review";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { IngestionLog, IngestionLogInput } from "@/agents/ingestion/types";
import { getSourceReferencesFromRawItem } from "@/agents/ai-regulation/citations";
import { deriveUpdateAuthorityType } from "@/agents/ai-regulation/utils/authority";
import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";
import { buildNewsItemFromUpdate } from "@/content/ai-regulation/news";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { getMockStore } from "@/db/mock-store";
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
  PagedResult,
  RegulatoryUpdateFilterOptions,
  RegulatoryUpdateDraftInput,
  RegulatoryUpdateFilters,
  ScanLogInput,
  VisibilityScope,
} from "@/db/repository-types";
import type { CursorPosition } from "@/lib/pagination";
import {
  RepositoryOperationError,
  assertValidStatusTransition,
} from "@/db/repository-types";

function matchesFilter(
  update: AiRegulatoryUpdate,
  filters?: RegulatoryUpdateFilters,
  scope: VisibilityScope = "admin",
) {
  if (scope === "public" && update.status !== "published") return false;
  if (!filters) return true;

  return Object.entries(filters).every(([key, value]) => {
    if (!value || value === "all") return true;
    if (key === "authorityType") {
      return (update.authorityType ?? deriveUpdateAuthorityType(update)) === value;
    }
    if (key === "tag") return update.tags.includes(value);
    const current = update[key as keyof AiRegulatoryUpdate];
    if (Array.isArray(current)) return current.includes(value);
    return String(current) === value;
  });
}

function nextTimestamp() {
  return new Date().toISOString();
}

function resolvePage(page?: ListPageParams) {
  return {
    limit: Math.max(1, page?.limit ?? 24),
    offset: Math.max(0, page?.offset ?? 0),
  };
}

function toPagedResult<T>(items: T[], page?: ListPageParams): PagedResult<T> {
  const { limit, offset } = resolvePage(page);
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    total: items.length,
    limit,
    offset,
    hasMore: offset + sliced.length < items.length,
  };
}

/**
 * Comparator for DESC NULLS LAST sort on two cursor sort keys.
 * Null dates sort after non-null dates (NULLS LAST semantics).
 */
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

/**
 * Returns true if the item should appear AFTER the cursor in
 * DESC NULLS LAST order (i.e., it belongs on the next page).
 */
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
  } else {
    if (itemDate !== null) return false;
    return itemTiebreaker < cursor.tiebreaker;
  }
}

function createSourceReferenceRecord(
  input: SourceReferenceRecordInput,
): SourceReferenceRecord {
  return {
    ...input,
    id: `sref-${randomUUID()}`,
    createdAt: nextTimestamp(),
  };
}

function createNewsItemRecord(input: NewsItemRecordInput): NewsItemRecord {
  const now = nextTimestamp();
  return {
    ...input,
    id: `news-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };
}

function createDiscoveryLeadRecord(input: DiscoveryLeadInput): DiscoveryLead {
  const now = nextTimestamp();
  return {
    ...input,
    id: `lead-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };
}

function createCountryIntelligenceRecord(
  input: CountryIntelligenceUpsertInput,
): CountryIntelligence {
  const now = nextTimestamp();
  return {
    ...input,
    needsReReview: computeCountryNeedsReReview(input.lastReviewedAt),
    createdAt: now,
    updatedAt: now,
  };
}

function createCountryProfileReviewEventRecord(
  input: CountryProfileReviewEventInput,
): CountryProfileReviewEvent {
  return {
    ...input,
    id: `country-review-${randomUUID()}`,
    createdAt: nextTimestamp(),
  };
}

function createCountryIntelligenceSourceRecord(
  input: CountryIntelligenceSourceWriteInput,
): CountryIntelligenceSource {
  return {
    ...input,
    createdAt: nextTimestamp(),
  };
}

export class MemoryAiRegulationRepository implements AiRegulationRepository {
  readonly mode = "memory" as const;

  async listRegulatoryUpdates(
    filters?: RegulatoryUpdateFilters,
    scope: VisibilityScope = "admin",
  ) {
    return getMockStore().updates.filter((update) =>
      matchesFilter(update, filters, scope),
    );
  }

  async listRegulatoryUpdatesPage(
    filters?: RegulatoryUpdateFilters,
    scope: VisibilityScope = "admin",
    page?: ListPageParams,
  ) {
    const items = await this.listRegulatoryUpdates(filters, scope);
    return toPagedResult(items, page);
  }

  async listRegulatoryUpdatesCursorPage(
    filters?: RegulatoryUpdateFilters,
    scope: VisibilityScope = "admin",
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<AiRegulatoryUpdate>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const all = getMockStore().updates.filter((u) => matchesFilter(u, filters, scope));
    const sorted = [...all].sort((a, b) =>
      compareForCursorSort(a.publicationDate ?? null, a.createdAt, b.publicationDate ?? null, b.createdAt),
    );
    const afterCursor = cursor
      ? sorted.filter((u) => isAfterCursor(u.publicationDate ?? null, u.createdAt, cursor))
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

  async listDistinctFilterValues(scope: VisibilityScope = "admin") {
    const all = getMockStore().updates;
    const updates = scope === "public"
      ? all.filter((u) => u.status === "published")
      : all;

    const distinct = <T>(arr: T[]) =>
      [...new Set(arr.filter((v): v is NonNullable<T> => v != null))].sort() as string[];

    return {
      status: distinct(updates.map((u) => u.status)),
      jurisdiction: distinct(updates.map((u) => u.jurisdiction)),
      region: distinct(updates.map((u) => u.region)),
      legalArea: distinct(updates.map((u) => u.legalArea)),
      authorityType: distinct(
        updates.map((u) => u.authorityType ?? deriveUpdateAuthorityType(u)),
      ) as RegulatoryUpdateFilterOptions["authorityType"],
      developmentType: distinct(updates.map((u) => u.developmentType)),
      importanceLevel: distinct(updates.map((u) => u.importanceLevel)),
      publicationDate: distinct(updates.map((u) => u.publicationDate)),
      tag: distinct(updates.flatMap((u) => u.tags)),
      sourceName: distinct(updates.map((u) => u.sourceName)),
    };
  }

  async getRegulatoryUpdateById(id: string, scope: VisibilityScope = "admin") {
    const update =
      getMockStore().updates.find((entry) => entry.id === id) ?? null;
    if (!update) return null;
    if (scope === "public" && update.status !== "published") return null;
    return update;
  }

  async createRawRegulatoryItem(input: RawRegulatoryItemInput) {
    const now = nextTimestamp();
    const record: RawRegulatoryItem = {
      ...input,
      id: `raw-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    getMockStore().rawItems.unshift(record);
    const sourceReferences = getSourceReferencesFromRawItem(record).map((reference) =>
      createSourceReferenceRecord({
        ...reference,
        rawItemId: record.id,
        regulatoryUpdateId: null,
      }),
    );
    if (sourceReferences.length > 0) {
      getMockStore().sourceReferences.unshift(...sourceReferences);
    }
    return record;
  }

  async findRawRegulatoryItemByHash(hash: string) {
    return getMockStore().rawItems.find((item) => item.hash === hash) ?? null;
  }

  async getRawRegulatoryItemById(id: string) {
    return getMockStore().rawItems.find((item) => item.id === id) ?? null;
  }

  async getRawRegulatoryItemsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const wanted = new Set(ids);
    const positionById = new Map(ids.map((id, index) => [id, index]));
    return getMockStore().rawItems
      .filter((item) => wanted.has(item.id))
      .sort(
        (left, right) =>
          (positionById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (positionById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
      );
  }

  async updateRawRegulatoryItemMetadata(
    id: string,
    rawMetadata: Record<string, unknown>,
  ) {
    const item = await this.getRawRegulatoryItemById(id);
    if (!item) {
      throw new RepositoryOperationError(`Raw regulatory item ${id} not found.`);
    }

    item.rawMetadata = rawMetadata;
    item.updatedAt = nextTimestamp();
    await this.replaceSourceReferencesForRawItem(
      id,
      getSourceReferencesFromRawItem(item).map((reference) => ({
        ...reference,
        rawItemId: id,
        regulatoryUpdateId:
          getMockStore().updates.find((update) => update.rawItemId === id)?.id ?? null,
      })),
    );
    return item;
  }

  async createAiRegulatoryUpdate(input: RegulatoryUpdateDraftInput) {
    const now = nextTimestamp();
    const record: AiRegulatoryUpdate = {
      ...input,
      authorityType: input.authorityType ?? deriveUpdateAuthorityType(input),
      id: `upd-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    getMockStore().updates.unshift(record);
    const existingReferences = getMockStore().sourceReferences.filter(
      (reference) => reference.rawItemId === record.rawItemId,
    );
    for (const reference of existingReferences) {
      reference.regulatoryUpdateId = record.id;
    }
    return record;
  }

  async updateAiRegulatoryUpdate(
    id: string,
    patch: EditableRegulatoryUpdateFields,
  ) {
    const update = await this.getRegulatoryUpdateById(id);
    if (!update) {
      throw new RepositoryOperationError(`Regulatory update ${id} not found.`);
    }

    Object.assign(update, patch, { updatedAt: nextTimestamp() });
    if (
      !patch.authorityType &&
      (patch.developmentType || patch.title || patch.summary)
    ) {
      update.authorityType = deriveUpdateAuthorityType(update);
    } else {
      update.authorityType = update.authorityType ?? deriveUpdateAuthorityType(update);
    }
    return update;
  }

  async transitionReviewStatus(id: string, status: AiRegulatoryUpdate["status"], reviewer = "Admin Reviewer") {
    const update = await this.getRegulatoryUpdateById(id);
    if (!update) {
      throw new RepositoryOperationError(`Regulatory update ${id} not found.`);
    }

    const source = await this.getSourceById(update.sourceId);
    if (source && isDiscoveryOnlySource(source) && (status === "approved" || status === "published")) {
      throw new RepositoryOperationError(
        "Discovery-only leads cannot be approved or published. Verify an official source first and publish from the official-source workflow instead.",
      );
    }

    if (status === "published") {
      const rawItem = await this.getRawRegulatoryItemById(update.rawItemId);
      const eligibility = evaluatePublicationEligibility({
        update,
        rawItem,
        source,
      });
      if (!eligibility.eligible) {
        throw new RepositoryOperationError(
          `Publication blocked: ${eligibility.blockingReasons.join(" ")} ${eligibility.warnings.join(" ")}`.trim(),
        );
      }
    }

    assertValidStatusTransition(update.status, status);
    const previousStatus = update.status;
    update.status = status;
    update.reviewedBy = reviewer;
    update.reviewedAt = nextTimestamp();
    update.updatedAt = nextTimestamp();
    if (status === "published") {
      update.publishedAt = nextTimestamp();
    }
    await this.createReviewEvent({
      regulatoryUpdateId: update.id,
      sourceId: update.sourceId,
      rawItemId: update.rawItemId,
      eventType: "status_transition",
      actor: reviewer,
      previousStatus,
      nextStatus: status,
      notes: `Status changed from ${previousStatus} to ${status}.`,
      metadata: {
        publicationEligible: status === "published",
      },
    });
    const rawItem = await this.getRawRegulatoryItemById(update.rawItemId);
    if (rawItem) {
      const refreshed = buildNewsItemFromUpdate({ update, rawItem, source });
      await this.upsertNewsItem({
        ...refreshed,
        regulatoryUpdateId: update.id,
        rawItemId: update.rawItemId,
      });
    }
    return update;
  }

  async listSources() {
    return getMockStore().sources;
  }

  async getSourceById(id: string) {
    return getMockStore().sources.find((source) => source.id === id) ?? null;
  }

  async createSource(input: RegulationSourceInput) {
    const now = nextTimestamp();
    const record: RegulationSource = { ...input, createdAt: now, updatedAt: now };
    getMockStore().sources.unshift(record);
    return record;
  }

  async updateSource(id: string, patch: Partial<RegulationSource>) {
    const source = await this.getSourceById(id);
    if (!source) {
      throw new RepositoryOperationError(`Source ${id} not found.`);
    }
    Object.assign(source, patch, { updatedAt: nextTimestamp() });
    return source;
  }

  async disableSource(id: string) {
    return this.updateSource(id, { active: false });
  }

  async listScanLogs(limit?: number, sourceId?: string) {
    const logs = sourceId
      ? getMockStore().scanLogs.filter((log) => log.sourceId === sourceId)
      : getMockStore().scanLogs;
    return typeof limit === "number" ? logs.slice(0, limit) : logs;
  }

  async createScanLog(input: ScanLogInput) {
    const record: RegulationScanLog = {
      ...input,
      id: `scan-${randomUUID()}`,
      createdAt: nextTimestamp(),
    };
    getMockStore().scanLogs.unshift(record);
    return record;
  }

  async listRawRegulatoryItems(limit?: number, sourceId?: string) {
    const items = sourceId
      ? getMockStore().rawItems.filter((item) => item.sourceId === sourceId)
      : getMockStore().rawItems;
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }

  async listProcessingLogs(limit?: number) {
    const logs = getMockStore().processingLogs;
    return typeof limit === "number" ? logs.slice(0, limit) : logs;
  }

  async createAiProcessingLog(input: AiProcessingLogInput) {
    const record: AiProcessingLog = {
      ...input,
      id: `proc-${randomUUID()}`,
      createdAt: nextTimestamp(),
    };
    getMockStore().processingLogs.unshift(record);
    return record;
  }

  async listSourceReferences(
    limit?: number,
    options?: { rawItemId?: string; regulatoryUpdateId?: string },
  ) {
    const filtered = getMockStore().sourceReferences.filter((reference) => {
      if (options?.rawItemId && reference.rawItemId !== options.rawItemId) return false;
      if (
        options?.regulatoryUpdateId &&
        reference.regulatoryUpdateId !== options.regulatoryUpdateId
      ) {
        return false;
      }
      return true;
    });
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }

  async replaceSourceReferencesForRawItem(
    rawItemId: string,
    references: SourceReferenceRecordInput[],
  ) {
    const store = getMockStore();
    store.sourceReferences = store.sourceReferences.filter(
      (reference) => reference.rawItemId !== rawItemId,
    );
    const inserted = references.map(createSourceReferenceRecord);
    store.sourceReferences.unshift(...inserted);
    return inserted;
  }

  async listVerificationAttempts(limit?: number, rawItemId?: string) {
    const attempts = rawItemId
      ? getMockStore().verificationAttempts.filter((attempt) => attempt.rawItemId === rawItemId)
      : getMockStore().verificationAttempts;
    return typeof limit === "number" ? attempts.slice(0, limit) : attempts;
  }

  async createVerificationAttempt(input: VerificationAttemptInput) {
    const record: VerificationAttempt = {
      ...input,
      id: `vat-${randomUUID()}`,
      createdAt: nextTimestamp(),
    };
    getMockStore().verificationAttempts.unshift(record);
    return record;
  }

  async listReviewEvents(limit?: number, regulatoryUpdateId?: string) {
    const events = regulatoryUpdateId
      ? getMockStore().reviewEvents.filter(
          (event) => event.regulatoryUpdateId === regulatoryUpdateId,
        )
      : getMockStore().reviewEvents;
    return typeof limit === "number" ? events.slice(0, limit) : events;
  }

  async createReviewEvent(input: ReviewEventInput) {
    const record: ReviewEvent = {
      ...input,
      id: `rev-${randomUUID()}`,
      createdAt: nextTimestamp(),
    };
    getMockStore().reviewEvents.unshift(record);
    return record;
  }

  async listDataQualityFindings(limit?: number, entityType?: string) {
    const findings = entityType
      ? getMockStore().dataQualityFindings.filter((finding) => finding.entityType === entityType)
      : getMockStore().dataQualityFindings;
    return typeof limit === "number" ? findings.slice(0, limit) : findings;
  }

  async listDataQualityFindingsPage(entityType?: string, page?: ListPageParams) {
    const findings = await this.listDataQualityFindings(undefined, entityType);
    return toPagedResult(findings, page);
  }

  async upsertDataQualityFinding(input: DataQualityFindingInput) {
    const existing = getMockStore().dataQualityFindings.find(
      (finding) =>
        finding.entityType === input.entityType &&
        finding.entityId === input.entityId &&
        finding.findingType === input.findingType,
    );

    if (existing) {
      Object.assign(existing, {
        ...input,
        updatedAt: nextTimestamp(),
      });
      return existing;
    }

    const record: DataQualityFinding = {
      ...input,
      id: `dqf-${randomUUID()}`,
      createdAt: nextTimestamp(),
      updatedAt: nextTimestamp(),
    };
    getMockStore().dataQualityFindings.unshift(record);
    return record;
  }

  async listScanJobs(limit?: number) {
    const jobs = getMockStore().scanJobs;
    return typeof limit === "number" ? jobs.slice(0, limit) : jobs;
  }

  async listScanJobsPage(page?: ListPageParams) {
    return toPagedResult(getMockStore().scanJobs, page);
  }

  async listScanJobsCursorPage(
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<ScanJob>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const sorted = [...getMockStore().scanJobs].sort((a, b) =>
      compareForCursorSort(a.createdAt, a.id, b.createdAt, b.id),
    );
    const afterCursor = cursor
      ? sorted.filter((job) => isAfterCursor(job.createdAt, job.id, cursor))
      : sorted;
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

  async getScanJobById(id: string) {
    return getMockStore().scanJobs.find((job) => job.id === id) ?? null;
  }

  async createScanJob(input: ScanJobInput) {
    const now = nextTimestamp();
    const record: ScanJob = {
      ...input,
      id: `job-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    getMockStore().scanJobs.unshift(record);
    return record;
  }

  async tryStartScanJob(id: string, input: ScanJobStartAttemptInput) {
    const job = await this.getScanJobById(id);
    if (!job) {
      throw new RepositoryOperationError(`Scan job ${id} not found.`);
    }
    if (job.status !== "queued" || job.startedAt || job.finishedAt) {
      return null;
    }

    Object.assign(job, {
      status: "running" as const,
      startedAt: input.startedAt,
      finishedAt: null,
      errorMessage: null,
      resultSummary: {
        ...job.resultSummary,
        leaseOwner: input.leaseOwner,
        leaseToken: input.leaseToken,
        leaseAcquiredAt: input.startedAt,
        leaseHeartbeatAt: input.leaseHeartbeatAt ?? input.startedAt,
        leaseHeartbeatIntervalMs: input.leaseHeartbeatIntervalMs,
        leaseHeartbeatTimeoutMs: input.leaseHeartbeatTimeoutMs,
        claimedFromStatus: "queued",
      },
      updatedAt: nextTimestamp(),
    });

    return job;
  }

  async updateScanJob(id: string, patch: Partial<ScanJob>) {
    const job = await this.getScanJobById(id);
    if (!job) {
      throw new RepositoryOperationError(`Scan job ${id} not found.`);
    }
    Object.assign(job, patch, { updatedAt: nextTimestamp() });
    return job;
  }

  async listDiscoveryLeads(limit?: number, status?: string) {
    const leads = status
      ? getMockStore().discoveryLeads.filter((lead) => lead.status === status)
      : getMockStore().discoveryLeads;
    return typeof limit === "number" ? leads.slice(0, limit) : leads;
  }

  async listDiscoveryLeadsPage(status?: string, page?: ListPageParams) {
    const leads = await this.listDiscoveryLeads(undefined, status);
    return toPagedResult(leads, page);
  }

  async listDiscoveryLeadsCursorPage(
    status?: string,
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<DiscoveryLead>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const all = await this.listDiscoveryLeads(undefined, status);
    const sorted = [...all].sort((a, b) =>
      compareForCursorSort(a.createdAt, a.id, b.createdAt, b.id),
    );
    const afterCursor = cursor
      ? sorted.filter((lead) => isAfterCursor(lead.createdAt, lead.id, cursor))
      : sorted;
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

  async getDiscoveryLeadById(id: string) {
    return getMockStore().discoveryLeads.find((lead) => lead.id === id) ?? null;
  }

  async getDiscoveryLeadByRawItemId(rawItemId: string) {
    return getMockStore().discoveryLeads.find((lead) => lead.rawItemId === rawItemId) ?? null;
  }

  async createDiscoveryLead(input: DiscoveryLeadInput) {
    const record = createDiscoveryLeadRecord(input);
    getMockStore().discoveryLeads.unshift(record);
    return record;
  }

  async updateDiscoveryLead(id: string, patch: EditableDiscoveryLeadFields) {
    const lead = await this.getDiscoveryLeadById(id);
    if (!lead) {
      throw new RepositoryOperationError(`Discovery lead ${id} not found.`);
    }
    Object.assign(lead, patch, { updatedAt: nextTimestamp() });
    return lead;
  }

  async listNewsItems(limit?: number, scope: VisibilityScope = "admin") {
    const items = getMockStore().newsItems.filter((item) =>
      scope === "public" ? item.publicVisibilityStatus === "public" : true,
    );
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }

  async listNewsItemsPage(scope: VisibilityScope = "admin", page?: ListPageParams) {
    const items = await this.listNewsItems(undefined, scope);
    return toPagedResult(items, page);
  }

  async listNewsItemsCursorPage(
    scope: VisibilityScope = "admin",
    page?: ListCursorParams,
  ): Promise<CursorPagedResult<NewsItemRecord>> {
    const limit = Math.max(1, page?.limit ?? 24);
    const cursor = page?.after ?? null;
    const all = getMockStore().newsItems.filter((item) =>
      scope === "public" ? item.publicVisibilityStatus === "public" : true,
    );
    const sorted = [...all].sort((a, b) =>
      compareForCursorSort(a.publicationDate, a.detectedAt, b.publicationDate, b.detectedAt),
    );
    const afterCursor = cursor
      ? sorted.filter((item) => isAfterCursor(item.publicationDate, item.detectedAt, cursor))
      : sorted;
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

  async getNewsItemBySlug(slug: string, scope: VisibilityScope = "admin") {
    const item =
      getMockStore().newsItems.find((entry) => entry.slug === slug) ?? null;
    if (!item) return null;
    if (scope === "public" && item.publicVisibilityStatus !== "public") return null;
    return item;
  }

  async upsertNewsItem(input: NewsItemRecordInput) {
    const existing = input.regulatoryUpdateId
      ? getMockStore().newsItems.find(
          (item) => item.regulatoryUpdateId === input.regulatoryUpdateId,
        ) ?? null
      : getMockStore().newsItems.find((item) => item.rawItemId === input.rawItemId) ?? null;

    if (existing) {
      Object.assign(existing, input, { updatedAt: nextTimestamp() });
      return existing;
    }

    const record = createNewsItemRecord(input);
    getMockStore().newsItems.unshift(record);
    return record;
  }

  async listSourceHealthChecks(limit?: number, sourceId?: string) {
    const checks = sourceId
      ? getMockStore().sourceHealthChecks.filter((check) => check.sourceId === sourceId)
      : getMockStore().sourceHealthChecks;
    return typeof limit === "number" ? checks.slice(0, limit) : checks;
  }

  async createSourceHealthCheck(input: SourceHealthCheckInput) {
    const record: SourceHealthCheck = {
      ...input,
      id: `shc-${randomUUID()}`,
      createdAt: nextTimestamp(),
    };
    getMockStore().sourceHealthChecks.unshift(record);
    return record;
  }

  async listCountryIntelligence(region?: CountryIntelligence["region"]) {
    const countries = getMockStore().countryIntelligence;
    return region ? countries.filter((country) => country.region === region) : countries;
  }

  async getCountryIntelligenceBySlug(slug: string) {
    return (
      getMockStore().countryIntelligence.find((country) => country.slug === slug) ?? null
    );
  }

  async upsertCountryIntelligence(input: CountryIntelligenceUpsertInput) {
    const store = getMockStore();
    const existingIndex = store.countryIntelligence.findIndex((country) => country.id === input.id);
    if (existingIndex === -1) {
      const record = createCountryIntelligenceRecord(input);
      store.countryIntelligence.unshift(record);
      return record;
    }

    const updated: CountryIntelligence = {
      ...store.countryIntelligence[existingIndex],
      ...input,
      needsReReview: computeCountryNeedsReReview(input.lastReviewedAt),
      updatedAt: nextTimestamp(),
    };
    store.countryIntelligence[existingIndex] = updated;
    return updated;
  }

  async listCountryProfileReviewEvents(limit?: number, countryId?: string) {
    const events = countryId
      ? getMockStore().countryProfileReviewEvents.filter(
          (event) => event.countryId === countryId,
        )
      : getMockStore().countryProfileReviewEvents;
    return typeof limit === "number" ? events.slice(0, limit) : events;
  }

  async createCountryProfileReviewEvent(input: CountryProfileReviewEventInput) {
    const record = createCountryProfileReviewEventRecord(input);
    getMockStore().countryProfileReviewEvents.unshift(record);
    return record;
  }

  async listCountryIntelligenceSources(countryId: string) {
    return getMockStore().countryIntelligenceSources.filter(
      (source) => source.countryId === countryId,
    );
  }

  async replaceCountryIntelligenceSources(
    countryId: string,
    sources: CountryIntelligenceSourceWriteInput[],
  ) {
    const store = getMockStore();
    store.countryIntelligenceSources = store.countryIntelligenceSources.filter(
      (source) => source.countryId !== countryId,
    );
    const created = sources.map((source) => createCountryIntelligenceSourceRecord(source));
    store.countryIntelligenceSources.unshift(...created);
    return created;
  }

  // ── Ingestion pipeline ────────────────────────────────────────────────

  async findRawRegulatoryItemByUrl(url: string) {
    return getMockStore().rawItems.find((item) => item.rawUrl === url) ?? null;
  }

  async createIngestionLog(input: IngestionLogInput): Promise<IngestionLog> {
    const record: IngestionLog = {
      ...input,
      urls_discovered: input.urls_discovered ?? 0,
      items_ingested: input.items_ingested ?? 0,
      duplicates: input.duplicates ?? 0,
      details: input.details ?? {},
      error_message: input.error_message ?? null,
      finished_at: input.finished_at ?? null,
      created_at: new Date().toISOString(),
    };
    getMockStore().ingestionLogs.unshift(record);
    return record;
  }

  async listIngestionLogs(limit = 50, sourceId?: string): Promise<IngestionLog[]> {
    let logs = [...getMockStore().ingestionLogs];
    if (sourceId) logs = logs.filter((l) => l.source_id === sourceId);
    return logs.slice(0, limit);
  }
}
