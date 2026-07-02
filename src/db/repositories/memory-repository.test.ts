import { beforeEach, describe, expect, it } from "vitest";

import { resetMockStore } from "@/db/mock-store";
import { MemoryAiRegulationRepository } from "@/db/repositories/memory-repository";
import { RepositoryOperationError } from "@/db/repository-types";

describe("MemoryAiRegulationRepository", () => {
  const repository = new MemoryAiRegulationRepository();

  beforeEach(() => {
    resetMockStore();
  });

  it("atomically upserts concurrent raw items by hash", async () => {
    const input = {
      sourceId: "src-test",
      rawTitle: "Concurrent item",
      rawUrl: "https://example.com/concurrent",
      rawText: "Same durable content",
      rawMetadata: {},
      detectedAt: "2026-07-01T00:00:00.000Z",
      hash: "concurrent-hash",
      duplicateOf: null,
      processingStatus: "new" as const,
    };

    const results = await Promise.all([
      repository.upsertRawItem(input),
      repository.upsertRawItem(input),
    ]);

    expect(results.filter((result) => result.inserted)).toHaveLength(1);
    expect(new Set(results.map((result) => result.item.id)).size).toBe(1);
    expect(
      (await repository.listRawRegulatoryItems()).filter(
        (item) => item.hash === input.hash,
      ),
    ).toHaveLength(1);
  });

  it("preserves canonical metadata and repairs missing provenance on retry", async () => {
    const canonical = await repository.upsertRawItem({
      sourceId: "src-test",
      rawTitle: "Canonical",
      rawUrl: "https://example.com/canonical",
      rawText: "Canonical text",
      rawMetadata: {
        marker: "canonical",
        sourceReferences: [],
      },
      detectedAt: "2026-07-01T00:00:00.000Z",
      hash: "repair-hash",
      duplicateOf: null,
      processingStatus: "new",
    });
    const retry = await repository.upsertRawItem({
      sourceId: "src-test",
      rawTitle: "Loser",
      rawUrl: "https://example.com/canonical",
      rawText: "Loser text",
      rawMetadata: {
        marker: "loser",
        sourceReferences: [
          {
            sourceRole: "primary",
            title: "Official source",
            institution: "Authority",
            url: "https://authority.example/item",
            canonicalUrl: null,
            sourceType: "official",
            authorityType: "legislation",
            publicationDate: "2026-07-01",
            detectedAt: "2026-07-01T00:00:00.000Z",
            retrievedAt: "2026-07-01T00:00:00.000Z",
            lastVerifiedAt: null,
            jurisdiction: "European Union",
            documentType: "regulation",
            excerpt: null,
            pinpoint: {},
            reliabilityLevel: "high",
            verificationStatus: "official_verified",
            archivedUrl: null,
            accessLimitations: null,
            notes: null,
          },
        ],
      },
      detectedAt: "2026-07-01T00:00:01.000Z",
      hash: "repair-hash",
      duplicateOf: null,
      processingStatus: "new",
    });

    expect(retry).toMatchObject({
      inserted: false,
      item: { id: canonical.item.id, rawTitle: "Canonical" },
    });
    expect(retry.item.rawMetadata).toMatchObject({ marker: "canonical" });
    expect(
      await repository.listSourceReferences(10, {
        rawItemId: canonical.item.id,
      }),
    ).toHaveLength(1);
  });

  it("only returns published items in public scope", async () => {
    const updates = await repository.listRegulatoryUpdates({}, "public");
    expect(updates.length).toBeGreaterThan(0);
    expect(updates.every((item) => item.status === "published")).toBe(true);
  });

  it("enforces review workflow transitions", async () => {
    const approved = await repository.transitionReviewStatus("upd-006", "approved");
    expect(approved.status).toBe("approved");

    const published = await repository.transitionReviewStatus("upd-006", "published");
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();

    const events = await repository.listReviewEvents(10, "upd-006");
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]?.eventType).toBe("status_transition");
  });

  it("rejects invalid direct publication from needs_review", async () => {
    await expect(
      repository.transitionReviewStatus("upd-006", "published"),
    ).rejects.toBeInstanceOf(RepositoryOperationError);
  });

  it("allows rejected items to be archived but not published", async () => {
    const rejected = await repository.transitionReviewStatus("upd-006", "rejected");
    expect(rejected.status).toBe("rejected");

    const archived = await repository.transitionReviewStatus("upd-006", "archived");
    expect(archived.status).toBe("archived");

    await expect(
      repository.transitionReviewStatus("upd-008", "published"),
    ).rejects.toBeInstanceOf(RepositoryOperationError);
  });

  it("can create and update a source through the repository abstraction", async () => {
    const source = await repository.createSource({
      id: "src-test-source",
      name: "Test Source",
      jurisdiction: "United States federal",
      region: "North America",
      country: "United States",
      sourceUrl: "https://example.gov",
      sourceType: "static_page",
      scanFrequency: "daily",
      active: true,
      lastScannedAt: null,
      notes: "test",
      reliabilityLevel: "medium",
      preferredExtractionMethod: "html_static",
      config: {},
    });

    expect(source.id).toBe("src-test-source");

    const updated = await repository.updateSource(source.id, {
      active: false,
      notes: "updated",
    });
    expect(updated.active).toBe(false);
    expect(updated.notes).toBe("updated");
  });

  it("blocks approval and publication for discovery-only leads", async () => {
    await repository.createSource({
      id: "src-discovery-only",
      name: "Discovery Source",
      jurisdiction: "OECD",
      region: "International",
      country: "International",
      sourceUrl: "https://example.com/discovery",
      sourceType: "static_page",
      scanFrequency: "daily",
      active: true,
      lastScannedAt: null,
      notes: "discovery only",
      reliabilityLevel: "medium",
      preferredExtractionMethod: "html_static",
      config: {
        sourceCategory: "discovery_source",
        publicationAllowed: false,
        requiresOfficialSourceConfirmation: true,
      },
    });

    const discoveryUpdate = await repository.createAiRegulatoryUpdate({
      sourceId: "src-discovery-only",
      rawItemId: "raw-discovery",
      title: "Discovery lead",
      sourceName: "Discovery Source",
      sourceUrl: "https://example.com/story",
      jurisdiction: "OECD",
      region: "International",
      country: "International",
      developmentType: "Policy report",
      legalArea: "AI governance",
      publicationDate: null,
      detectedDate: "2026-05-26",
      oneSentenceSummary: "Lead only",
      summary: "Lead only",
      whatHappened: "Lead only",
      whyItMatters: "Lead only",
      practicalImpact: "Lead only",
      affectedParties: [],
      keyObligations: [],
      complianceDeadlines: [],
      enforcementRisk: "Lead only",
      importanceLevel: "low",
      confidenceLevel: "low",
      tags: ["discovery_only"],
      status: "needs_review",
      reviewedBy: null,
      reviewedAt: null,
      publishedAt: null,
    });

    await expect(
      repository.transitionReviewStatus(discoveryUpdate.id, "approved"),
    ).rejects.toBeInstanceOf(RepositoryOperationError);
    await expect(
      repository.transitionReviewStatus(discoveryUpdate.id, "published"),
    ).rejects.toBeInstanceOf(RepositoryOperationError);
  });

  it("blocks publication when precise official citation data is missing", async () => {
    await repository.createSource({
      id: "src-official-missing-citation",
      name: "Official Source",
      jurisdiction: "European Union",
      region: "Europe",
      country: "European Union",
      sourceUrl: "https://example.eu/official",
      sourceType: "regulator_page",
      scanFrequency: "daily",
      active: true,
      lastScannedAt: null,
      notes: "official",
      reliabilityLevel: "high",
      preferredExtractionMethod: "html_static",
      config: {},
    });

    const rawItem = await repository.createRawRegulatoryItem({
      sourceId: "src-official-missing-citation",
      rawTitle: "Official item",
      rawUrl: "",
      rawText: "Official text",
      rawMetadata: {
        sourceReferences: [
          {
            sourceRole: "primary",
            title: "Official item",
            institution: "Official Source",
            url: "",
            sourceType: "regulator",
            authorityType: "Agency guidance",
            reliabilityLevel: "high",
            verificationStatus: "needs_manual_verification",
          },
        ],
      },
      detectedAt: "2026-05-27T00:00:00.000Z",
      hash: "missing-citation-hash",
      duplicateOf: null,
      processingStatus: "processed",
    });

    const update = await repository.createAiRegulatoryUpdate({
      sourceId: "src-official-missing-citation",
      rawItemId: rawItem.id,
      title: "Official item",
      sourceName: "Official Source",
      sourceUrl: "",
      jurisdiction: "European Union",
      region: "Europe",
      country: "European Union",
      developmentType: "Agency guidance",
      legalArea: "AI governance",
      publicationDate: null,
      detectedDate: "2026-05-27",
      oneSentenceSummary: "Summary",
      summary: "Summary",
      whatHappened: "What happened",
      whyItMatters: "Why",
      practicalImpact: "Impact",
      affectedParties: [],
      keyObligations: [],
      complianceDeadlines: [],
      enforcementRisk: "Risk",
      importanceLevel: "medium",
      confidenceLevel: "medium",
      tags: [],
      status: "needs_review",
      reviewedBy: null,
      reviewedAt: null,
      publishedAt: null,
    });

    await repository.transitionReviewStatus(update.id, "approved");
    await expect(
      repository.transitionReviewStatus(update.id, "published"),
    ).rejects.toBeInstanceOf(RepositoryOperationError);
  });

  it("backfills and filters regulatory updates by first-class authority type", async () => {
    const rawItem = await repository.createRawRegulatoryItem({
      sourceId: "src-federal-register-ai",
      rawTitle: "Authority type raw item",
      rawUrl: "https://example.gov/authority-type",
      rawText: "Authority type raw item",
      rawMetadata: {},
      detectedAt: "2026-06-20T00:00:00.000Z",
      hash: "authority-type-filter-hash",
      duplicateOf: null,
      processingStatus: "processed",
    });

    const update = await repository.createAiRegulatoryUpdate({
      sourceId: "src-federal-register-ai",
      rawItemId: rawItem.id,
      title: "Authority type test",
      sourceName: "Federal Register",
      sourceUrl: "https://example.gov/authority-type",
      jurisdiction: "United States federal",
      region: "North America",
      country: "United States",
      developmentType: "Policy report",
      legalArea: "AI governance",
      publicationDate: "2026-06-20",
      detectedDate: "2026-06-20",
      oneSentenceSummary: "Authority type test",
      summary: "Authority type test",
      whatHappened: "Authority type test",
      whyItMatters: "Authority type test",
      practicalImpact: "Authority type test",
      affectedParties: [],
      keyObligations: [],
      complianceDeadlines: [],
      enforcementRisk: "Authority type test",
      importanceLevel: "medium",
      confidenceLevel: "high",
      tags: ["authority:binding-law"],
      status: "needs_review",
      reviewedBy: null,
      reviewedAt: null,
      publishedAt: null,
    });

    expect(update.authorityType).toBe("Binding law");
    const filtered = await repository.listRegulatoryUpdates({
      authorityType: "Binding law",
    });
    expect(filtered.map((item) => item.id)).toContain(update.id);

    const options = await repository.listDistinctFilterValues();
    expect(options.authorityType).toContain("Binding law");
  });

  it("can filter scan logs and raw items by source", async () => {
    const sourceLogs = await repository.listScanLogs(10, "src-federal-register-ai");
    const sourceRawItems = await repository.listRawRegulatoryItems(
      10,
      "src-federal-register-ai",
    );

    expect(sourceLogs.length).toBeGreaterThan(0);
    expect(sourceLogs.every((log) => log.sourceId === "src-federal-register-ai")).toBe(
      true,
    );
    expect(sourceRawItems.length).toBeGreaterThan(0);
    expect(
      sourceRawItems.every((item) => item.sourceId === "src-federal-register-ai"),
    ).toBe(true);
  });

  it("can hydrate raw items by an explicit id set without broad list windows", async () => {
    const items = await repository.getRawRegulatoryItemsByIds(["raw-002", "raw-001"]);
    expect(items.map((item) => item.id)).toEqual(["raw-002", "raw-001"]);
  });

  it("synchronizes structured source references from raw metadata", async () => {
    const references = await repository.listSourceReferences(10, { rawItemId: "raw-001" });
    expect(references.length).toBeGreaterThan(0);
    expect(references[0]?.rawItemId).toBe("raw-001");
  });

  it("records draft-save review events explicitly", async () => {
    const update = await repository.getRegulatoryUpdateById("upd-006", "admin");
    expect(update).not.toBeNull();
    await repository.createReviewEvent({
      regulatoryUpdateId: update!.id,
      sourceId: update!.sourceId,
      rawItemId: update!.rawItemId,
      eventType: "draft_saved",
      actor: "Admin Reviewer",
      previousStatus: update!.status,
      nextStatus: update!.status,
      notes: "Saved draft during review.",
      metadata: {
        changedFields: ["summary"],
      },
    });

    const events = await repository.listReviewEvents(10, update!.id);
    expect(events.some((event) => event.eventType === "draft_saved")).toBe(true);
  });

  it("can queue and update scan jobs", async () => {
    const job = await repository.createScanJob({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "test-suite",
      status: "queued",
      startedAt: null,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
    });

    const running = await repository.updateScanJob(job.id, {
      status: "running",
      startedAt: "2026-05-31T12:00:00.000Z",
    });

    expect(running.status).toBe("running");
    expect((await repository.listScanJobs(10)).some((entry) => entry.id === job.id)).toBe(
      true,
    );
  });

  it("claims a queued scan job only once with lease metadata", async () => {
    const job = await repository.createScanJob({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "test-suite",
      status: "queued",
      startedAt: null,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
    });

    const claimed = await repository.tryStartScanJob(job.id, {
      startedAt: "2026-06-06T13:10:00.000Z",
      leaseOwner: "queue-drain",
      leaseToken: "lease-123",
    });
    const secondClaim = await repository.tryStartScanJob(job.id, {
      startedAt: "2026-06-06T13:11:00.000Z",
      leaseOwner: "queue-drain",
      leaseToken: "lease-456",
    });

    expect(claimed?.status).toBe("running");
    expect(claimed?.resultSummary).toMatchObject({
      leaseOwner: "queue-drain",
      leaseToken: "lease-123",
      claimedFromStatus: "queued",
    });
    expect(secondClaim).toBeNull();
  });

  it("allows only the current lease token to persist one terminal outcome", async () => {
    const job = await repository.createScanJob({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "test-suite",
      status: "queued",
      startedAt: null,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
    });
    await repository.tryStartScanJob(job.id, {
      startedAt: "2026-06-06T13:10:00.000Z",
      leaseOwner: "worker-new",
      leaseToken: "lease-new",
    });

    const stale = await repository.completeScanJob(job.id, "lease-old", {
      status: "failed",
      finishedAt: "2026-06-06T13:11:00.000Z",
      errorMessage: "Stale worker failed",
      resultSummary: { leaseToken: "lease-old", stale: true },
      sourceId: "src-overwrite-attempt",
    });
    const current = await repository.completeScanJob(job.id, "lease-new", {
      status: "succeeded",
      finishedAt: "2026-06-06T13:12:00.000Z",
      errorMessage: null,
      resultSummary: { leaseToken: "lease-new", authoritative: true },
      sourceId: "src-overwrite-attempt",
    });
    const duplicate = await repository.completeScanJob(job.id, "lease-new", {
      status: "failed",
      finishedAt: "2026-06-06T13:13:00.000Z",
      errorMessage: "Duplicate completion",
    });

    expect(stale).toBeNull();
    expect(current).toMatchObject({
      status: "succeeded",
      sourceId: "src-federal-register-ai",
      errorMessage: null,
      resultSummary: { leaseToken: "lease-new", authoritative: true },
    });
    expect(duplicate).toBeNull();
  });

  it("persists news items and source health snapshots", async () => {
    const seedNews = await repository.listNewsItems(20, "admin");
    expect(seedNews.length).toBeGreaterThan(0);

    const created = await repository.createSourceHealthCheck({
      sourceId: "src-federal-register-ai",
      checkedAt: "2026-05-31T12:00:00.000Z",
      responseStatus: 200,
      runtimeAccessible: true,
      parserStatus: "healthy",
      activeRecommendation: "keep_active",
      itemsFetched: 4,
      newItemsDetected: 1,
      duplicatesDetected: 0,
      parserWarnings: [],
      accessibilityIssue: null,
      reliabilityNotes: "Healthy source check",
    });

    expect(created.sourceId).toBe("src-federal-register-ai");
    expect(
      (await repository.listSourceHealthChecks(10, "src-federal-register-ai")).length,
    ).toBeGreaterThan(0);
  });

  it("supports paged update, news, job, and data-quality listings", async () => {
    const updatesPage = await repository.listRegulatoryUpdatesPage({}, "admin", {
      limit: 2,
      offset: 0,
    });
    expect(updatesPage.items).toHaveLength(2);
    expect(updatesPage.total).toBeGreaterThanOrEqual(2);
    expect(updatesPage.hasMore).toBe(true);

    const newsPage = await repository.listNewsItemsPage("admin", {
      limit: 2,
      offset: 0,
    });
    expect(newsPage.items).toHaveLength(2);
    expect(newsPage.total).toBeGreaterThanOrEqual(2);

    await repository.createScanJob({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "pagination-test",
      status: "queued",
      startedAt: null,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
    });
    const jobsPage = await repository.listScanJobsPage({
      limit: 1,
      offset: 0,
    });
    expect(jobsPage.items).toHaveLength(1);
    expect(jobsPage.total).toBeGreaterThanOrEqual(1);

    await repository.upsertDataQualityFinding({
      entityType: "source",
      entityId: "src-federal-register-ai",
      scope: "source_health",
      severity: "medium",
      status: "needs_review",
      findingType: "pagination_test_finding",
      message: "Test finding",
      details: {},
      firstDetectedAt: "2026-05-31T00:00:00.000Z",
      lastDetectedAt: "2026-05-31T00:00:00.000Z",
      resolvedAt: null,
    });
    const findingsPage = await repository.listDataQualityFindingsPage(undefined, {
      limit: 1,
      offset: 0,
    });
    expect(findingsPage.items).toHaveLength(1);
    expect(findingsPage.total).toBeGreaterThanOrEqual(1);
  });

  it("keeps unpublished drafts private in public scope even after admin edits", async () => {
    const before = await repository.getRegulatoryUpdateById("upd-006", "public");
    expect(before).toBeNull();

    await repository.updateAiRegulatoryUpdate("upd-006", {
      summary: "Admin-reviewed AI draft summary",
      keyObligations: ["Review the draft carefully before publication."],
      enforcementRisk: "Review queue only.",
    });

    const adminView = await repository.getRegulatoryUpdateById("upd-006", "admin");
    const publicView = await repository.getRegulatoryUpdateById("upd-006", "public");

    expect(adminView?.summary).toBe("Admin-reviewed AI draft summary");
    expect(adminView?.keyObligations).toEqual([
      "Review the draft carefully before publication.",
    ]);
    expect(publicView).toBeNull();
  });

  it("keeps published items visible in public scope", async () => {
    const published = await repository.getRegulatoryUpdateById("upd-001", "public");

    expect(published).not.toBeNull();
    expect(published?.status).toBe("published");
  });

  it("supports dedicated discovery leads create/list/update flows", async () => {
    const created = await repository.createDiscoveryLead({
      rawItemId: "raw-001",
      sourceId: "src-ai-weekly",
      headline: "Unofficial lead about a new AI court rule",
      discoverySourceUrl: "https://example.com/discovery",
      outboundUrl: "https://example.com/original",
      detectedAt: "2026-06-05T18:15:00.000Z",
      possibleJurisdiction: "United States / New York",
      possibleTopic: "Court rule",
      possibleLegalArea: "Professional responsibility",
      possibleAuthorityType: "binding_court_rule",
      status: "unresolved",
      officialSourceFound: false,
      officialSourceUrl: null,
      corroboratingSourceCount: 0,
      corroboratingSourceUrls: [],
      convertedUpdateId: null,
      reviewerNotes: null,
      lastVerifiedAt: null,
      staleAt: null,
      publicVisibilityAllowed: false,
    });

    expect(created.id).toMatch(/^lead-/);

    const listed = await repository.listDiscoveryLeads(10);
    expect(listed.some((lead) => lead.id === created.id)).toBe(true);
    expect((await repository.getDiscoveryLeadByRawItemId("raw-001"))?.id).toBe(created.id);

    const updated = await repository.updateDiscoveryLead(created.id, {
      status: "official_source_found",
      officialSourceFound: true,
      officialSourceUrl: "https://official.example.gov/part-161",
      reviewerNotes: "Official source located.",
    });

    expect(updated.status).toBe("official_source_found");
    expect(updated.officialSourceFound).toBe(true);

    const paged = await repository.listDiscoveryLeadsPage(undefined, {
      limit: 5,
      offset: 0,
    });
    expect(paged.total).toBeGreaterThanOrEqual(1);
    expect(paged.items.some((lead) => lead.id === created.id)).toBe(true);
  });

  it("supports cursor pagination for scan jobs and discovery leads", async () => {
    await repository.createScanJob({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "cursor-test-a",
      status: "queued",
      startedAt: null,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
    });
    await repository.createScanJob({
      sourceId: "src-federal-register-ai",
      trigger: "manual",
      requestedBy: "cursor-test-b",
      status: "queued",
      startedAt: null,
      finishedAt: null,
      resultSummary: {},
      errorMessage: null,
    });

    const jobsFirst = await repository.listScanJobsCursorPage({ limit: 1 });
    expect(jobsFirst.items).toHaveLength(1);
    expect(jobsFirst.hasMore).toBe(true);
    expect(jobsFirst.nextCursor).not.toBeNull();

    const jobsSecond = await repository.listScanJobsCursorPage({
      limit: 5,
      after: jobsFirst.nextCursor,
    });
    expect(jobsSecond.items.length).toBeGreaterThanOrEqual(1);
    expect(jobsSecond.items[0]?.id).not.toBe(jobsFirst.items[0]?.id);

    const leadA = await repository.createDiscoveryLead({
      rawItemId: "raw-cursor-a",
      sourceId: "src-ai-weekly",
      headline: "Cursor lead A",
      discoverySourceUrl: "https://example.com/a",
      outboundUrl: "https://example.com/a-original",
      detectedAt: "2026-06-06T10:00:00.000Z",
      possibleJurisdiction: "European Union",
      possibleTopic: "AI governance",
      possibleLegalArea: "AI governance",
      possibleAuthorityType: "guidance",
      status: "unresolved",
      officialSourceFound: false,
      officialSourceUrl: null,
      corroboratingSourceCount: 0,
      corroboratingSourceUrls: [],
      convertedUpdateId: null,
      reviewerNotes: null,
      lastVerifiedAt: null,
      staleAt: null,
      publicVisibilityAllowed: false,
    });
    const leadB = await repository.createDiscoveryLead({
      rawItemId: "raw-cursor-b",
      sourceId: "src-ai-weekly",
      headline: "Cursor lead B",
      discoverySourceUrl: "https://example.com/b",
      outboundUrl: "https://example.com/b-original",
      detectedAt: "2026-06-06T10:01:00.000Z",
      possibleJurisdiction: "European Union",
      possibleTopic: "AI governance",
      possibleLegalArea: "AI governance",
      possibleAuthorityType: "guidance",
      status: "unresolved",
      officialSourceFound: false,
      officialSourceUrl: null,
      corroboratingSourceCount: 0,
      corroboratingSourceUrls: [],
      convertedUpdateId: null,
      reviewerNotes: null,
      lastVerifiedAt: null,
      staleAt: null,
      publicVisibilityAllowed: false,
    });

    const leadsFirst = await repository.listDiscoveryLeadsCursorPage("unresolved", {
      limit: 1,
    });
    expect(leadsFirst.items).toHaveLength(1);
    expect(leadsFirst.hasMore).toBe(true);
    expect([leadA.id, leadB.id]).toContain(leadsFirst.items[0]?.id);

    const leadsSecond = await repository.listDiscoveryLeadsCursorPage("unresolved", {
      limit: 5,
      after: leadsFirst.nextCursor,
    });
    expect(leadsSecond.items.length).toBeGreaterThanOrEqual(1);
    expect(leadsSecond.items[0]?.id).not.toBe(leadsFirst.items[0]?.id);
  });

  it("supports country intelligence list/upsert/source replacement flows", async () => {
    const seeded = await repository.listCountryIntelligence("Europe");
    expect(seeded.length).toBeGreaterThan(0);

    const france = await repository.getCountryIntelligenceBySlug("france");
    expect(france?.countryName).toBe("France");

    const updated = await repository.upsertCountryIntelligence({
      id: france!.id,
      region: "Europe",
      countryCode: france!.countryCode,
      countryName: france!.countryName,
      slug: france!.slug,
      implementationStatus: france!.implementationStatus,
      implementationConfidence: france!.implementationConfidence,
      implementationNotes: "Backend extraction pilot active.",
      competentAuthorityName: france!.competentAuthorityName,
      competentAuthorityUrl: france!.competentAuthorityUrl,
      dpaName: france!.dpaName,
      dpaUrl: france!.dpaUrl,
      marketSurveillanceAuthority: france!.marketSurveillanceAuthority,
      primaryOfficialSourceUrl: france!.primaryOfficialSourceUrl,
      primaryOfficialSourceTitle: france!.primaryOfficialSourceTitle,
      lastOfficialSourceCheck: france!.lastOfficialSourceCheck,
      citationQualityStatus: france!.citationQualityStatus,
      publicSummary: france!.publicSummary,
      editorialNotes: france!.editorialNotes,
      missingSourceWarnings: france!.missingSourceWarnings,
      implementationMeasures: france!.implementationMeasures,
      competentAuthorities: france!.competentAuthorities,
      marketSurveillanceAuthorities: france!.marketSurveillanceAuthorities,
      notifyingAuthorities: france!.notifyingAuthorities,
      relevantMinistries: france!.relevantMinistries,
      nationalAIRegulationNotes: france!.nationalAIRegulationNotes,
      nationalCaseLawNotes: france!.nationalCaseLawNotes,
      nationalSoftLawNotes: france!.nationalSoftLawNotes,
      lastReviewedAt: france!.lastReviewedAt,
      reviewedBy: "Codex 1",
      reviewStatus: france!.reviewStatus,
      needsReReview: france!.needsReReview,
    });

    expect(updated.implementationNotes).toBe("Backend extraction pilot active.");

    const replacedSources = await repository.replaceCountryIntelligenceSources(france!.id, [
      {
        id: "country-source-france-test-1",
        countryId: france!.id,
        sourceUrl: "https://example.com/france-official",
        sourceTitle: "France official pilot source",
        institution: "Test institution",
        authorityType: "government",
        publicAccessible: true,
        runtimeAccessible: true,
        lastCheckedAt: "2026-06-08T00:00:00.000Z",
        responseStatus: 200,
        active: true,
        notes: "pilot",
      },
    ]);

    expect(replacedSources).toHaveLength(1);
    const listedSources = await repository.listCountryIntelligenceSources(france!.id);
    expect(listedSources).toHaveLength(1);
    expect(listedSources[0]?.sourceTitle).toBe("France official pilot source");
  });

  it("records country profile editorial review events separately", async () => {
    const france = await repository.getCountryIntelligenceBySlug("france");
    expect(france).not.toBeNull();

    const created = await repository.createCountryProfileReviewEvent({
      countryId: france!.id,
      countrySlug: france!.slug,
      eventType: "editorial_saved",
      actor: "Codex 1",
      previousReviewStatus: france!.reviewStatus,
      nextReviewStatus: "verified",
      previousNeedsReReview: france!.needsReReview,
      nextNeedsReReview: false,
      notes: "Editorial review saved from admin.",
      metadata: {
        changedFields: ["publicSummary", "reviewStatus"],
      },
    });

    expect(created.id).toMatch(/^country-review-/);
    const events = await repository.listCountryProfileReviewEvents(10, france!.id);
    expect(events.some((event) => event.id === created.id)).toBe(true);
    expect(events[0]?.countrySlug).toBe("france");
  });
});
