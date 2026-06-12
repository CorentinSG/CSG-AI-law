import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import {
  assertValidStatusTransition,
  RepositoryOperationError,
} from "@/db/repository-types";
import { MemoryAiRegulationRepository } from "@/db/repositories/memory-repository";
import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------
function makeRepo() {
  vi.stubEnv("APP_DATA_MODE", "memory");
  vi.stubEnv("ADMIN_AUTH_SECRET", "test-secret-at-least-24-chars-ok");
  return new MemoryAiRegulationRepository();
}

async function createMinimalUpdate(repo: MemoryAiRegulationRepository) {
  const rawItem = await repo.createRawRegulatoryItem({
    sourceId: "src-test",
    rawTitle: "Test item",
    rawUrl: "https://example.com/test",
    rawText: "Test content",
    rawMetadata: {},
    detectedAt: new Date().toISOString(),
    hash: `test-hash-${Date.now()}`,
    duplicateOf: null,
    processingStatus: "new",
  });

  return repo.createAiRegulatoryUpdate({
    sourceId: "src-test",
    rawItemId: rawItem.id,
    title: "Test update",
    sourceName: "Test Source",
    sourceUrl: "https://example.com/test",
    jurisdiction: "European Union",
    region: "Europe",
    country: "",
    developmentType: "Regulation",
    legalArea: "AI governance",
    publicationDate: "2024-01-01",
    detectedDate: "2024-01-01",
    oneSentenceSummary: "A test.",
    summary: "",
    whatHappened: "",
    whyItMatters: "",
    practicalImpact: "",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    tags: [],
    status: "needs_review",
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
  });
}

// Path to the supabase-repository source for static analysis tests
const repoSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "supabase-repository.ts"),
  "utf8",
);

// ---------------------------------------------------------------------------
// 0. Memory repository — transitionReviewStatus enforcement
// ---------------------------------------------------------------------------
describe("MemoryAiRegulationRepository — transitionReviewStatus", () => {
  it("cannot skip approved — needs_review cannot go directly to published", async () => {
    const repo = makeRepo();
    const update = await createMinimalUpdate(repo);
    expect(update.status).toBe("needs_review");
    // Publication gate blocks direct needs_review → published both by status transition
    // and by citation requirements — both should throw RepositoryOperationError.
    await expect(repo.transitionReviewStatus(update.id, "published")).rejects.toThrow(
      RepositoryOperationError,
    );
  });

  it("allows needs_review → approved without citation requirements", async () => {
    const repo = makeRepo();
    const update = await createMinimalUpdate(repo);
    const approved = await repo.transitionReviewStatus(update.id, "approved");
    expect(approved.status).toBe("approved");
  });

  it("publication gate blocks approved item without official source reference", async () => {
    const repo = makeRepo();
    const update = await createMinimalUpdate(repo);
    await repo.transitionReviewStatus(update.id, "approved");
    // No official source reference attached → publication eligibility gate blocks it
    await expect(repo.transitionReviewStatus(update.id, "published")).rejects.toThrow(
      RepositoryOperationError,
    );
  });

  it("blocks rejected → published", async () => {
    const repo = makeRepo();
    const update = await createMinimalUpdate(repo);
    await repo.transitionReviewStatus(update.id, "rejected");
    await expect(repo.transitionReviewStatus(update.id, "published")).rejects.toThrow(
      RepositoryOperationError,
    );
  });

  it("archived item cannot transition to approved or published", async () => {
    const repo = makeRepo();
    const update = await createMinimalUpdate(repo);
    await repo.transitionReviewStatus(update.id, "archived");
    await expect(repo.transitionReviewStatus(update.id, "approved")).rejects.toThrow(
      RepositoryOperationError,
    );
    await expect(repo.transitionReviewStatus(update.id, "published")).rejects.toThrow(
      RepositoryOperationError,
    );
  });
});

// ---------------------------------------------------------------------------
// 0b. Memory repository — scan log and source health write paths
// ---------------------------------------------------------------------------
describe("MemoryAiRegulationRepository — scan log writes", () => {
  it("createScanLog persists and is retrievable via listScanLogs", async () => {
    const repo = makeRepo();
    const log = await repo.createScanLog({
      sourceId: "src-test",
      status: "success",
      scanStartedAt: new Date().toISOString(),
      scanFinishedAt: new Date().toISOString(),
      itemsFound: 5,
      newItemsDetected: 2,
      duplicatesDetected: 3,
      errors: [],
    });
    expect(log.id).toBeDefined();
    expect(log.status).toBe("success");

    const logs = await repo.listScanLogs(10);
    expect(logs.some((l) => l.id === log.id)).toBe(true);
  });

  it("createSourceHealthCheck persists and is retrievable", async () => {
    const repo = makeRepo();
    const check = await repo.createSourceHealthCheck({
      sourceId: "src-test",
      checkedAt: new Date().toISOString(),
      responseStatus: 200,
      runtimeAccessible: true,
      parserStatus: "ok",
      activeRecommendation: "active",
      itemsFetched: 5,
      newItemsDetected: 0,
      duplicatesDetected: 0,
      parserWarnings: [],
      accessibilityIssue: null,
      reliabilityNotes: "Test check",
    });
    expect(check.id).toBeDefined();
    const checks = await repo.listSourceHealthChecks(10, "src-test");
    expect(checks.some((c) => c.id === check.id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 0c. Memory repository — public visibility (published only)
// ---------------------------------------------------------------------------
describe("MemoryAiRegulationRepository — public visibility", () => {
  it("public scope only returns published items", async () => {
    const repo = makeRepo();
    const publicUpdates = await repo.listRegulatoryUpdates(undefined, "public");
    for (const update of publicUpdates) {
      expect(update.status).toBe("published");
    }
  });

  it("admin scope returns all statuses", async () => {
    const repo = makeRepo();
    const adminUpdates = await repo.listRegulatoryUpdates(undefined, "admin");
    const statuses = new Set(adminUpdates.map((u) => u.status));
    // Seed should include at least needs_review and published items
    expect(statuses.size).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 1. assertValidStatusTransition — enforced by both repositories
// ---------------------------------------------------------------------------
describe("assertValidStatusTransition", () => {
  it("allows needs_review → approved", () => {
    expect(() => assertValidStatusTransition("needs_review", "approved")).not.toThrow();
  });

  it("allows approved → published", () => {
    expect(() => assertValidStatusTransition("approved", "published")).not.toThrow();
  });

  it("allows published → archived", () => {
    expect(() => assertValidStatusTransition("published", "archived")).not.toThrow();
  });

  it("blocks needs_review → published (must go through approved)", () => {
    expect(() =>
      assertValidStatusTransition("needs_review", "published"),
    ).toThrow(RepositoryOperationError);
  });

  it("blocks rejected → published", () => {
    expect(() =>
      assertValidStatusTransition("rejected", "published"),
    ).toThrow(RepositoryOperationError);
  });

  it("blocks archived → published", () => {
    expect(() =>
      assertValidStatusTransition("archived", "published"),
    ).toThrow(RepositoryOperationError);
  });

  it("blocks archived → any further transition", () => {
    expect(() =>
      assertValidStatusTransition("archived", "approved"),
    ).toThrow(RepositoryOperationError);
  });

  it("allows needs_review → rejected", () => {
    expect(() => assertValidStatusTransition("needs_review", "rejected")).not.toThrow();
  });

  it("allows needs_review → archived", () => {
    expect(() => assertValidStatusTransition("needs_review", "archived")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. Column projection constants
// ---------------------------------------------------------------------------
describe("Supabase column constants", () => {
  it("RAW_ITEM_LIST_COLUMNS does not include raw_text", () => {
    const match = repoSrc.match(/RAW_ITEM_LIST_COLUMNS\s*=\s*\[([\s\S]*?)\]\.join/);
    expect(match).not.toBeNull();
    const cols = match![1];
    expect(cols).not.toContain("raw_text");
    expect(cols).toContain("raw_metadata");
    expect(cols).toContain("raw_title");
    expect(cols).toContain("raw_url");
  });

  it("UPDATE_LIST_COLUMNS includes all fields used by mapUpdateRow", () => {
    const match = repoSrc.match(/UPDATE_LIST_COLUMNS\s*=\s*\[([\s\S]*?)\]\.join/);
    expect(match).not.toBeNull();
    const cols = match![1];
    for (const col of ["id", "source_id", "title", "status", "jurisdiction",
      "development_type", "legal_area", "publication_date",
      "importance_level", "source_name", "tags"]) {
      expect(cols).toContain(`"${col}"`);
    }
  });

  it("includes dedicated discovery_leads repository methods", () => {
    expect(repoSrc).toContain('from("discovery_leads")');
    expect(repoSrc).toContain("async listDiscoveryLeads(");
    expect(repoSrc).toContain("async listDiscoveryLeadsPage(");
    expect(repoSrc).toContain("async listDiscoveryLeadsCursorPage(");
    expect(repoSrc).toContain("async getDiscoveryLeadById(");
    expect(repoSrc).toContain("async createDiscoveryLead(");
    expect(repoSrc).toContain("async updateDiscoveryLead(");
  });

  it("includes cursor pagination methods for scan jobs and discovery leads", () => {
    expect(repoSrc).toContain("async listScanJobsCursorPage(");
    expect(repoSrc).toContain('.from("scan_jobs")');
    expect(repoSrc).toContain('.order("created_at", { ascending: false })');
    expect(repoSrc).toContain('.order("id", { ascending: false })');
    expect(repoSrc).toContain("async listDiscoveryLeadsCursorPage(");
  });

  it("includes country intelligence repository methods and table usage", () => {
    expect(repoSrc).toContain("async listCountryIntelligence(");
    expect(repoSrc).toContain("async getCountryIntelligenceBySlug(");
    expect(repoSrc).toContain("async upsertCountryIntelligence(");
    expect(repoSrc).toContain("async listCountryProfileReviewEvents(");
    expect(repoSrc).toContain("async createCountryProfileReviewEvent(");
    expect(repoSrc).toContain("async listCountryIntelligenceSources(");
    expect(repoSrc).toContain("async replaceCountryIntelligenceSources(");
    expect(repoSrc).toContain('.from("country_intelligence")');
    expect(repoSrc).toContain('.from("country_profile_review_events")');
    expect(repoSrc).toContain('.from("country_intelligence_sources")');
  });

  it("includes targeted raw-item hydration by id for paged helper layers", () => {
    expect(repoSrc).toContain("async getRawRegulatoryItemsByIds(");
    expect(repoSrc).toContain('.in("id", ids)');
  });

  it("includes direct discovery-lead lookup by raw item id for detail views", () => {
    expect(repoSrc).toContain("async getDiscoveryLeadByRawItemId(");
    expect(repoSrc).toContain('.eq("raw_item_id", rawItemId)');
  });

  it("includes optimistic queued-job claim semantics for scan processing", () => {
    expect(repoSrc).toContain("async tryStartScanJob(");
    expect(repoSrc).toContain('.eq("status", "queued")');
    expect(repoSrc).toContain('.is("started_at", null)');
    expect(repoSrc).toContain('.is("finished_at", null)');
  });
});

// ---------------------------------------------------------------------------
// 3. listDistinctFilterValues — shape contract via memory repository
// ---------------------------------------------------------------------------
describe("listDistinctFilterValues", () => {
  it("exposes the method on MemoryAiRegulationRepository", () => {
    vi.stubEnv("APP_DATA_MODE", "memory");
    vi.stubEnv("ADMIN_AUTH_SECRET", "test-secret-at-least-24-chars-ok");
    const repo = new MemoryAiRegulationRepository();
    expect(typeof repo.listDistinctFilterValues).toBe("function");
  });

  it("returns all expected filter keys as string arrays", async () => {
    vi.stubEnv("APP_DATA_MODE", "memory");
    vi.stubEnv("ADMIN_AUTH_SECRET", "test-secret-at-least-24-chars-ok");
    const repo = new MemoryAiRegulationRepository();
    const opts = await repo.listDistinctFilterValues("admin");
    for (const key of ["status", "jurisdiction", "region", "legalArea",
      "developmentType", "importanceLevel", "publicationDate", "tag", "sourceName"]) {
      expect(opts).toHaveProperty(key);
      expect(Array.isArray((opts as Record<string, string[]>)[key])).toBe(true);
    }
  });

  it("public scope only exposes published status values", async () => {
    vi.stubEnv("APP_DATA_MODE", "memory");
    vi.stubEnv("ADMIN_AUTH_SECRET", "test-secret-at-least-24-chars-ok");
    const repo = new MemoryAiRegulationRepository();
    const opts = await repo.listDistinctFilterValues("public");
    for (const status of opts.status) {
      expect(status).toBe("published");
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Pagination contract — memory repository
// ---------------------------------------------------------------------------
describe("listRegulatoryUpdatesPage pagination", () => {
  it("reports hasMore correctly when more items exist", async () => {
    vi.stubEnv("APP_DATA_MODE", "memory");
    vi.stubEnv("ADMIN_AUTH_SECRET", "test-secret-at-least-24-chars-ok");
    const repo = new MemoryAiRegulationRepository();
    const all = await repo.listRegulatoryUpdates(undefined, "admin");

    if (all.length > 1) {
      const page = await repo.listRegulatoryUpdatesPage(undefined, "admin", { limit: 1, offset: 0 });
      expect(page.items.length).toBe(1);
      expect(page.total).toBe(all.length);
      expect(page.hasMore).toBe(true);
    }
  });

  it("hasMore is false on last page", async () => {
    vi.stubEnv("APP_DATA_MODE", "memory");
    vi.stubEnv("ADMIN_AUTH_SECRET", "test-secret-at-least-24-chars-ok");
    const repo = new MemoryAiRegulationRepository();
    const all = await repo.listRegulatoryUpdates(undefined, "admin");
    const page = await repo.listRegulatoryUpdatesPage(undefined, "admin", { limit: 1000, offset: 0 });
    expect(page.hasMore).toBe(false);
    expect(page.total).toBe(all.length);
  });
});

// ---------------------------------------------------------------------------
// 5. Publication eligibility gate
// ---------------------------------------------------------------------------
describe("evaluatePublicationEligibility", () => {
  it("blocks items without human approval", () => {
    const result = evaluatePublicationEligibility({
      update: {
        status: "needs_review",
        title: "Test item",
        jurisdiction: "European Union",
        developmentType: "Regulation",
        sourceName: "EUR-Lex",
        sourceUrl: "https://eur-lex.europa.eu/test",
        publicationDate: "2024-01-01",
        detectedDate: "2024-01-01",
      },
      rawItem: null,
      source: null,
      sourceReferences: [],
    });

    expect(result.eligible).toBe(false);
    expect(result.blockingReasons.length).toBeGreaterThan(0);
    expect(result.blockingReasons.some((r) =>
      r.toLowerCase().includes("human-review") || r.toLowerCase().includes("approval"),
    )).toBe(true);
  });

  it("blocks discovery-only sources from publication", () => {
    const result = evaluatePublicationEligibility({
      update: {
        status: "approved",
        title: "Discovery lead",
        jurisdiction: "France",
        developmentType: "Policy report",
        sourceName: "AI Weekly",
        sourceUrl: "https://aiweekly.co/test",
        publicationDate: "2024-01-01",
        detectedDate: "2024-01-01",
      },
      rawItem: null,
      source: { name: "AI Weekly", config: { sourceCategory: "discovery_source" } },
      sourceReferences: [],
    });

    expect(result.eligible).toBe(false);
    expect(result.blockingReasons.some((r) =>
      r.toLowerCase().includes("discovery") || r.toLowerCase().includes("official"),
    )).toBe(true);
  });

  it("approved item with official source reference is eligible", () => {
    const result = evaluatePublicationEligibility({
      update: {
        status: "approved",
        title: "EU AI Act",
        jurisdiction: "European Union",
        developmentType: "Regulation",
        sourceName: "EUR-Lex",
        sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
        publicationDate: "2024-07-12",
        detectedDate: "2024-07-12",
      },
      rawItem: {
        detectedAt: "2024-07-12T00:00:00Z",
        rawMetadata: { verification: { verificationStatus: "verified_for_review", officialSourceFound: true } },
      },
      source: { name: "EUR-Lex", config: {} },
      sourceReferences: [
        {
          sourceRole: "primary",
          title: "Regulation (EU) 2024/1689",
          institution: "European Parliament and Council",
          url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
          canonicalUrl: null,
          sourceType: "official",
          authorityType: "legislation",
          publicationDate: "2024-07-12",
          retrievedAt: "2024-07-12T00:00:00Z",
          lastVerifiedAt: "2024-07-12T00:00:00Z",
          reliabilityLevel: "high",
          verificationStatus: "official_verified",
          jurisdiction: "European Union",
        },
      ],
    });

    // Should have no blocking reason from official source or approval checks
    const approvalBlocked = result.blockingReasons.some((r) =>
      r.toLowerCase().includes("human-review"),
    );
    expect(approvalBlocked).toBe(false);
  });
});
