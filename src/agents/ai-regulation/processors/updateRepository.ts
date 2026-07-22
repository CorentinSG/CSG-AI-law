import type {
  CountryIntelligence,
  CountryProfileReviewEventInput,
  CountryIntelligenceSource,
  DataQualityFindingInput,
  DiscoveryLead,
  DiscoveryLeadInput,
  NewsItemRecordInput,
  ReviewEventInput,
  ScanJob,
  ScanJobInput,
  SourceHealthCheckInput,
  VerificationAttemptInput,
} from "@/agents/ai-regulation/governance";
import type { IngestionLog } from "@/agents/ingestion/types";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";
import { getAiRegulationRepository } from "@/db/repository";
import type {
  CountryIntelligenceSourceWriteInput,
  CountryIntelligenceUpsertInput,
  EditableRegulatoryUpdateFields,
  ListCursorParams,
  ListPageParams,
  RawRegulatoryItemInput,
  RegulatoryUpdateDraftInput,
  RegulatoryUpdateFilters,
  ScanJobStartAttemptInput,
  VisibilityScope,
} from "@/db/repository-types";

export const updateRepository = {
  async listUpdates(filters?: RegulatoryUpdateFilters) {
    return getAiRegulationRepository().listRegulatoryUpdates(filters, "admin");
  },
  async listUpdatesPage(
    filters?: RegulatoryUpdateFilters,
    page?: ListPageParams,
  ) {
    return getAiRegulationRepository().listRegulatoryUpdatesPage(
      filters,
      "admin",
      page,
    );
  },
  async listPublicUpdates(filters?: RegulatoryUpdateFilters) {
    return getAiRegulationRepository().listRegulatoryUpdates(filters, "public");
  },
  async listPublicUpdatesPage(
    filters?: RegulatoryUpdateFilters,
    page?: ListPageParams,
  ) {
    return getAiRegulationRepository().listRegulatoryUpdatesPage(
      filters,
      "public",
      page,
    );
  },
  async getUpdate(id: string) {
    return getAiRegulationRepository().getRegulatoryUpdateById(id, "admin");
  },
  async getPublicUpdate(id: string) {
    return getAiRegulationRepository().getRegulatoryUpdateById(id, "public");
  },
  async createRawItem(input: RawRegulatoryItemInput) {
    return getAiRegulationRepository().createRawRegulatoryItem(input);
  },
  async findRawItemByHash(hash: string) {
    return getAiRegulationRepository().findRawRegulatoryItemByHash(hash);
  },
  async getRawItem(id: string) {
    return getAiRegulationRepository().getRawRegulatoryItemById(id);
  },
  async updateRawItemMetadata(id: string, rawMetadata: Record<string, unknown>) {
    return getAiRegulationRepository().updateRawRegulatoryItemMetadata(
      id,
      rawMetadata,
    );
  },
  async createUpdate(input: RegulatoryUpdateDraftInput) {
    // W1.6: the eligibility gate used to guard only status *transitions*, so
    // the scan pipeline and backfill scripts — the volume channels — could
    // create rows directly in "published" without any citation/official-source
    // check. Max-auto policy: never block creation, but an ineligible item is
    // downgraded to needs_review instead of silently reaching the public.
    if (input.status === "published") {
      const repository = getAiRegulationRepository();
      const [rawItem, source] = await Promise.all([
        input.rawItemId
          ? repository.getRawRegulatoryItemById(input.rawItemId)
          : Promise.resolve(null),
        input.sourceId
          ? repository.getSourceById(input.sourceId)
          : Promise.resolve(null),
      ]);
      const assessment = evaluatePublicationEligibility({
        update: {
          ...input,
          status: "published",
        },
        rawItem,
        source,
      });
      if (!assessment.eligible) {
        console.warn(
          `[publication-gate] createUpdate downgraded to needs_review (${assessment.blockingReasons.join("; ")}): ${input.title}`,
        );
        return getAiRegulationRepository().createAiRegulatoryUpdate({
          ...input,
          status: "needs_review",
          reviewedBy: null,
          reviewedAt: null,
          publishedAt: null,
        });
      }
    }
    return getAiRegulationRepository().createAiRegulatoryUpdate(input);
  },
  async getSources() {
    return getAiRegulationRepository().listSources();
  },
  async getSource(sourceId: string) {
    return getAiRegulationRepository().getSourceById(sourceId);
  },
  async addSource(source: Omit<RegulationSource, "createdAt" | "updatedAt">) {
    return getAiRegulationRepository().createSource(source);
  },
  async updateSource(sourceId: string, patch: Partial<RegulationSource>) {
    return getAiRegulationRepository().updateSource(sourceId, patch);
  },
  async disableSource(sourceId: string) {
    return getAiRegulationRepository().disableSource(sourceId);
  },
  async getScanLogs(limit?: number) {
    return getAiRegulationRepository().listScanLogs(limit);
  },
  async getScanLogsBySource(sourceId: string, limit?: number) {
    return getAiRegulationRepository().listScanLogs(limit, sourceId);
  },
  async getProcessingLogs(limit?: number) {
    return getAiRegulationRepository().listProcessingLogs(limit);
  },
  async getRawItems(limit?: number) {
    return getAiRegulationRepository().listRawRegulatoryItems(limit);
  },
  async getRawItemsBySource(sourceId: string, limit?: number) {
    return getAiRegulationRepository().listRawRegulatoryItems(limit, sourceId);
  },
  async addScanLog(log: Omit<RegulationScanLog, "id" | "createdAt">) {
    return getAiRegulationRepository().createScanLog(log);
  },
  async addProcessingLog(log: Omit<AiProcessingLog, "id" | "createdAt">) {
    return getAiRegulationRepository().createAiProcessingLog(log);
  },
  async getReviewEvents(updateId: string, limit?: number) {
    return getAiRegulationRepository().listReviewEvents(limit, updateId);
  },
  async addReviewEvent(event: ReviewEventInput) {
    return getAiRegulationRepository().createReviewEvent(event);
  },
  async getVerificationAttempts(rawItemId: string, limit?: number) {
    return getAiRegulationRepository().listVerificationAttempts(limit, rawItemId);
  },
  async addVerificationAttempt(attempt: VerificationAttemptInput) {
    return getAiRegulationRepository().createVerificationAttempt(attempt);
  },
  async getSourceReferencesForRawItem(rawItemId: string, limit?: number) {
    return getAiRegulationRepository().listSourceReferences(limit, { rawItemId });
  },
  async upsertDataQualityFinding(finding: DataQualityFindingInput) {
    return getAiRegulationRepository().upsertDataQualityFinding(finding);
  },
  async getDataQualityFindings(limit?: number, entityType?: string) {
    return getAiRegulationRepository().listDataQualityFindings(limit, entityType);
  },
  async getDataQualityFindingsPage(
    entityType?: string,
    page?: ListPageParams,
  ) {
    return getAiRegulationRepository().listDataQualityFindingsPage(entityType, page);
  },
  async getScanJobs(limit?: number) {
    return getAiRegulationRepository().listScanJobs(limit);
  },
  async getScanJobsPage(page?: ListPageParams) {
    return getAiRegulationRepository().listScanJobsPage(page);
  },
  async getScanJob(jobId: string) {
    return getAiRegulationRepository().getScanJobById(jobId);
  },
  async createScanJob(job: ScanJobInput) {
    return getAiRegulationRepository().createScanJob(job);
  },
  async tryStartScanJob(jobId: string, input: ScanJobStartAttemptInput) {
    return getAiRegulationRepository().tryStartScanJob(jobId, input);
  },
  async updateScanJob(jobId: string, patch: Partial<ScanJob>) {
    return getAiRegulationRepository().updateScanJob(jobId, patch);
  },
  async heartbeatScanJob(
    jobId: string,
    leaseToken: string,
    heartbeatAt: string,
  ) {
    return getAiRegulationRepository().heartbeatScanJob(
      jobId,
      leaseToken,
      heartbeatAt,
    );
  },
  async recoverStaleScanJob(
    jobId: string,
    leaseToken: string,
    expectedHeartbeatAt: string | null,
    patch: Partial<ScanJob>,
  ) {
    return getAiRegulationRepository().recoverStaleScanJob(
      jobId,
      leaseToken,
      expectedHeartbeatAt,
      patch,
    );
  },
  async getNewsItems(limit?: number) {
    return getAiRegulationRepository().listNewsItems(limit, "admin");
  },
  async getNewsItemsPage(page?: ListPageParams) {
    return getAiRegulationRepository().listNewsItemsPage("admin", page);
  },
  async getPublicNewsItems(limit?: number) {
    return getAiRegulationRepository().listNewsItems(limit, "public");
  },
  async getPublicNewsItemsPage(page?: ListPageParams) {
    return getAiRegulationRepository().listNewsItemsPage("public", page);
  },
  async listPublicUpdatesCursorPage(
    filters?: RegulatoryUpdateFilters,
    page?: ListCursorParams,
  ) {
    return getAiRegulationRepository().listRegulatoryUpdatesCursorPage(
      filters,
      "public",
      page,
    );
  },
  async getPublicNewsItemsCursorPage(page?: ListCursorParams) {
    return getAiRegulationRepository().listNewsItemsCursorPage("public", page);
  },
  async getPublicNewsItemBySlug(slug: string) {
    return getAiRegulationRepository().getNewsItemBySlug(slug, "public");
  },
  async getNewsItemBySlug(slug: string) {
    return getAiRegulationRepository().getNewsItemBySlug(slug, "admin");
  },
  async upsertNewsItem(item: NewsItemRecordInput) {
    return getAiRegulationRepository().upsertNewsItem(item);
  },
  async getSourceHealthChecks(sourceId?: string, limit?: number) {
    return getAiRegulationRepository().listSourceHealthChecks(limit, sourceId);
  },
  async addSourceHealthCheck(check: SourceHealthCheckInput) {
    return getAiRegulationRepository().createSourceHealthCheck(check);
  },
  async getIngestionLogs(sourceId?: string, limit?: number): Promise<IngestionLog[]> {
    return getAiRegulationRepository().listIngestionLogs(limit, sourceId);
  },
  async updateReviewStatus(
    id: string,
    status: AiRegulatoryUpdate["status"],
    reviewer = "Admin Reviewer",
  ) {
    return getAiRegulationRepository().transitionReviewStatus(id, status, reviewer);
  },
  async listDistinctFilterValues(scope: VisibilityScope = "admin") {
    return getAiRegulationRepository().listDistinctFilterValues(scope);
  },
  async saveUpdateEdits(id: string, patch: EditableRegulatoryUpdateFields) {
    return getAiRegulationRepository().updateAiRegulatoryUpdate(id, patch);
  },

  // --- Discovery leads (F2 adoption) ---
  async listDiscoveryLeads(limit?: number, status?: string): Promise<DiscoveryLead[]> {
    return getAiRegulationRepository().listDiscoveryLeads(limit, status);
  },
  async listDiscoveryLeadsPage(status?: string, page?: ListPageParams) {
    return getAiRegulationRepository().listDiscoveryLeadsPage(status, page);
  },
  async listDiscoveryLeadsCursorPage(status?: string, page?: ListCursorParams) {
    return getAiRegulationRepository().listDiscoveryLeadsCursorPage(status, page);
  },
  async getDiscoveryLeadById(id: string): Promise<DiscoveryLead | null> {
    return getAiRegulationRepository().getDiscoveryLeadById(id);
  },
  async createDiscoveryLead(input: DiscoveryLeadInput): Promise<DiscoveryLead> {
    return getAiRegulationRepository().createDiscoveryLead(input);
  },
  async updateDiscoveryLead(id: string, patch: Partial<DiscoveryLead>): Promise<DiscoveryLead> {
    return getAiRegulationRepository().updateDiscoveryLead(id, patch);
  },
  async listCountryIntelligence(region?: CountryIntelligence["region"]) {
    return getAiRegulationRepository().listCountryIntelligence(region);
  },
  async getCountryIntelligenceBySlug(
    slug: string,
    options?: { scope?: "admin" | "public" },
  ) {
    return getAiRegulationRepository().getCountryIntelligenceBySlug(slug, options);
  },
  async upsertCountryIntelligence(input: CountryIntelligenceUpsertInput) {
    return getAiRegulationRepository().upsertCountryIntelligence(input);
  },
  async getCountryProfileReviewEvents(countryId: string, limit?: number) {
    return getAiRegulationRepository().listCountryProfileReviewEvents(limit, countryId);
  },
  async addCountryProfileReviewEvent(event: CountryProfileReviewEventInput) {
    return getAiRegulationRepository().createCountryProfileReviewEvent(event);
  },
  async listCountryIntelligenceSources(countryId: string): Promise<CountryIntelligenceSource[]> {
    return getAiRegulationRepository().listCountryIntelligenceSources(countryId);
  },
  async replaceCountryIntelligenceSources(
    countryId: string,
    sources: CountryIntelligenceSourceWriteInput[],
  ) {
    return getAiRegulationRepository().replaceCountryIntelligenceSources(countryId, sources);
  },
};
