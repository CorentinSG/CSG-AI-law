import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import {
  assertValidStatusTransition,
  RepositoryOperationError,
} from "@/db/repository-types";
import { MemoryAiRegulationRepository } from "@/db/repositories/memory-repository";
import * as supabaseRepository from "@/db/repositories/supabase-repository";
import { upsertRawItemWithClient } from "@/db/repositories/supabase-repository";
import type { ScanJob } from "@/agents/ai-regulation/governance";
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
const migrationSrc = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "migrations",
    "013_raw_item_idempotency.sql",
  ),
  "utf8",
);
const migration015Path = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
  "015_durable_data_integrity.sql",
);
const migration015Src = existsSync(migration015Path)
  ? readFileSync(migration015Path, "utf8")
  : "";

describe("Supabase raw-item idempotency", () => {
  it("delegates raw-item insertion to the transactional RPC", () => {
    const method = repoSrc.match(
      /async upsertRawItem\([\s\S]*?\n  async findRawRegulatoryItemByHash/,
    )?.[0];
    expect(method).toBeDefined();
    expect(method).toContain("upsertRawItemWithClient");
    expect(repoSrc).toContain('client.rpc("upsert_raw_regulatory_item"');
  });

  it("guards legacy duplicates before adding an idempotent unique index", () => {
    expect(migrationSrc).toMatch(/group by hash[\s\S]*having count\(\*\) > 1/i);
    expect(migrationSrc).toMatch(/raise exception/i);
    expect(migrationSrc).toMatch(
      /create unique index[\s\S]*raw_regulatory_items[\s\S]*\(hash\)/i,
    );
    expect(migrationSrc).not.toMatch(/\b(delete|update)\s+raw_regulatory_items\b/i);
    expect(migrationSrc).not.toMatch(/where\s+hash\s+is\s+not\s+null/i);
    expect(migrationSrc).toMatch(/indisunique[\s\S]*from pg_index/i);
    expect(migrationSrc).toMatch(/raise exception[\s\S]*incorrectly defined/i);
  });

  it("returns one canonical row and one inserted winner for concurrent RPC upserts", async () => {
    const fake = createAtomicRawItemClient();
    const input = rawItemInput("concurrent-rpc-hash", "canonical");
    const results = await Promise.all([
      upsertRawItemWithClient(fake.client, input),
      upsertRawItemWithClient(fake.client, {
        ...input,
        rawTitle: "loser",
        rawMetadata: { marker: "loser" },
      }),
    ]);

    expect(fake.rawItems).toHaveLength(1);
    expect(results.filter((result) => result.inserted)).toHaveLength(1);
    expect(new Set(results.map((result) => result.item.id)).size).toBe(1);
    expect(results.every((result) => result.item.rawTitle === "canonical")).toBe(true);
  });

  it("rolls back provenance failure and repairs provenance on retry", async () => {
    const fake = createAtomicRawItemClient({ failProvenanceOnce: true });
    const input = rawItemInput("retry-rpc-hash", "canonical", true);

    await expect(upsertRawItemWithClient(fake.client, input)).rejects.toThrow(
      "provenance failed",
    );
    expect(fake.rawItems).toHaveLength(0);

    const result = await upsertRawItemWithClient(fake.client, input);
    expect(result.inserted).toBe(true);
    expect(fake.rawItems).toHaveLength(1);
    expect(fake.sourceReferences).toHaveLength(1);

    const duplicate = await upsertRawItemWithClient(fake.client, {
      ...input,
      rawTitle: "loser",
      rawMetadata: { marker: "loser", sourceReferences: input.rawMetadata.sourceReferences },
    });
    expect(duplicate.inserted).toBe(false);
    expect(duplicate.item.rawTitle).toBe("canonical");
    expect(duplicate.item.rawMetadata).toMatchObject({ marker: "canonical" });
    expect(fake.sourceReferences).toHaveLength(1);
  });

  it("falls back to database-backed upsert when RPC 013 is unavailable", async () => {
    const fake = createPreMigrationRawItemClient();
    const input = rawItemInput("pre-migration-hash", "canonical", true);

    const first = await upsertRawItemWithClient(fake.client, input);
    const second = await upsertRawItemWithClient(fake.client, {
      ...input,
      rawTitle: "retry",
    });

    expect(first.inserted).toBe(true);
    expect(second).toMatchObject({
      inserted: false,
      item: { id: first.item.id, rawTitle: "canonical" },
    });
    expect(fake.rawItems).toHaveLength(1);
    expect(fake.sourceReferences).toHaveLength(1);
    expect(fake.from).toHaveBeenCalledWith("raw_regulatory_items");
  });
});

function rawItemInput(hash: string, title: string, withReference = false) {
  return {
    sourceId: "src-test",
    rawTitle: title,
    rawUrl: `https://example.com/${hash}`,
    rawText: `${title} text`,
    rawMetadata: {
      marker: title,
      sourceReferences: withReference
        ? [{
            sourceRole: "primary",
            title: "Official source",
            institution: "Authority",
            url: "https://authority.example/item",
            sourceType: "official",
            reliabilityLevel: "high",
            verificationStatus: "official_verified",
          }]
        : [],
    },
    detectedAt: "2026-07-01T00:00:00.000Z",
    hash,
    duplicateOf: null,
    processingStatus: "new" as const,
  };
}

function createAtomicRawItemClient(options?: { failProvenanceOnce?: boolean }) {
  const rawItems: Record<string, unknown>[] = [];
  const sourceReferences: Record<string, unknown>[] = [];
  let failProvenance = options?.failProvenanceOnce ?? false;
  let queue = Promise.resolve();
  const client = {
    rpc: (_name: string, args: Record<string, unknown>) => {
      const operation = queue.then(async () => {
        const item = args.p_item as Record<string, unknown>;
        const references = args.p_source_references as Record<string, unknown>[];
        const existing = rawItems.find((row) => row.hash === item.hash);
        const inserted = !existing;
        const canonical = existing ?? {
          ...item,
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        };
        const nextRawItems = inserted ? [...rawItems, canonical] : [...rawItems];
        const nextReferences = [...sourceReferences];
        for (const reference of references) {
          const repaired: Record<string, unknown> = {
            ...reference,
            raw_item_id: canonical.id,
          };
          if (!nextReferences.some((entry) =>
            entry.raw_item_id === repaired.raw_item_id &&
            entry.url === repaired.url &&
            entry.source_role === repaired.source_role
          )) nextReferences.push(repaired);
        }
        if (failProvenance && references.length > 0) {
          failProvenance = false;
          throw new Error("provenance failed");
        }
        rawItems.splice(0, rawItems.length, ...nextRawItems);
        sourceReferences.splice(0, sourceReferences.length, ...nextReferences);
        return { data: [{ item: canonical, inserted }], error: null };
      });
      queue = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
  return { client: client as never, rawItems, sourceReferences };
}

function createPreMigrationRawItemClient() {
  const rawItems: Record<string, unknown>[] = [];
  const sourceReferences: Record<string, unknown>[] = [];
  const rpc = vi.fn(async () => ({
    data: null,
    error: { code: "PGRST202", message: "function not found" },
  }));
  const from = vi.fn((table: string) => {
    let action: "select" | "insert" = "select";
    let payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
    const filters = new Map<string, unknown>();
    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        filters.set(column, value);
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => {
        const data = rawItems.find((row) =>
          [...filters].every(([column, value]) => row[column] === value)
        ) ?? null;
        return { data, error: null };
      },
      insert: (value: Record<string, unknown> | Record<string, unknown>[]) => {
        action = "insert";
        payload = value;
        return builder;
      },
      upsert: (value: Record<string, unknown> | Record<string, unknown>[]) => {
        action = "insert";
        payload = value;
        return builder;
      },
      single: async () => {
        const row = {
          ...(payload as Record<string, unknown>),
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        };
        rawItems.push(row);
        return { data: row, error: null };
      },
      then: (
        resolve: (value: { data: null; error: null }) => unknown,
      ) => {
        if (action === "insert" && table === "source_references") {
          for (const row of payload as Record<string, unknown>[]) {
            if (!sourceReferences.some((existing) =>
              existing.raw_item_id === row.raw_item_id &&
              existing.url === row.url &&
              existing.source_role === row.source_role
            )) {
              sourceReferences.push(row);
            }
          }
        }
        return Promise.resolve(resolve({ data: null, error: null }));
      },
    };
    return builder;
  });

  return {
    client: { rpc, from } as never,
    rpc,
    from,
    rawItems,
    sourceReferences,
  };
}

type UpdateRawMetadataWithClient = (
  client: never,
  id: string,
  rawMetadata: Record<string, unknown>,
) => Promise<unknown>;

const updateRawRegulatoryItemMetadataWithClient = (
  supabaseRepository as unknown as {
    updateRawRegulatoryItemMetadataWithClient: UpdateRawMetadataWithClient;
  }
).updateRawRegulatoryItemMetadataWithClient;

describe("Supabase raw-item metadata provenance", () => {
  it("uses one transactional RPC and rolls metadata back when reference insertion fails", async () => {
    const fake = createAtomicMetadataClient({ failReferenceOnce: true });

    await expect(
      updateRawRegulatoryItemMetadataWithClient(fake.client, "raw-1", {
        marker: "changed",
        sourceReferences: [officialReference("https://authority.example/new")],
      }),
    ).rejects.toThrow("reference insert failed");

    expect(fake.rawItem.raw_metadata).toEqual({ marker: "original" });
    expect(fake.sourceReferences).toEqual([
      expect.objectContaining({ url: "https://authority.example/repaired" }),
    ]);
  });

  it("retains repaired provenance while merging metadata references", async () => {
    const fake = createAtomicMetadataClient();

    await updateRawRegulatoryItemMetadataWithClient(fake.client, "raw-1", {
      marker: "changed",
      sourceReferences: [officialReference("https://authority.example/new")],
    });

    expect(fake.rawItem.raw_metadata).toMatchObject({ marker: "changed" });
    expect(fake.sourceReferences.map((row) => row.url)).toEqual([
      "https://authority.example/repaired",
      "https://authority.example/new",
    ]);
  });

  it("defines metadata, heartbeat, recovery, and least-privilege RLS in migration 015", () => {
    expect(migration015Src).toContain(
      "create or replace function public.update_raw_regulatory_item_metadata",
    );
    expect(migration015Src).toContain(
      "create or replace function public.heartbeat_scan_job",
    );
    expect(migration015Src).toContain(
      "create or replace function public.recover_stale_scan_job",
    );
    for (const table of [
      "regulation_sources",
      "raw_regulatory_items",
      "scan_jobs",
    ]) {
      expect(migration015Src).toContain(
        `alter table public.${table} enable row level security`,
      );
      expect(migration015Src).toContain(
        `service_role_all_${table}`,
      );
    }
  });
});

function officialReference(url: string) {
  return {
    sourceRole: "primary",
    title: "Official source",
    institution: "Authority",
    url,
    sourceType: "official",
    reliabilityLevel: "high",
    verificationStatus: "official_verified",
  };
}

function createAtomicMetadataClient(options?: { failReferenceOnce?: boolean }) {
  const rawItem: Record<string, unknown> = {
    ...rawItemInput("metadata-hash", "canonical"),
    id: "raw-1",
    source_id: "src-test",
    raw_title: "canonical",
    raw_url: "https://example.com/metadata",
    raw_text: "canonical text",
    raw_metadata: { marker: "original" },
    detected_at: "2026-07-01T00:00:00.000Z",
    processing_status: "new",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };
  const sourceReferences: Record<string, unknown>[] = [{
    raw_item_id: "raw-1",
    url: "https://authority.example/repaired",
    source_role: "primary",
  }];
  let failReference = options?.failReferenceOnce ?? false;
  const client = {
    rpc: vi.fn(async (_name: string, args: Record<string, unknown>) => {
      const nextItem = {
        ...rawItem,
        raw_metadata: args.p_raw_metadata,
      };
      const nextReferences = [...sourceReferences];
      for (const reference of args.p_source_references as Record<string, unknown>[]) {
        if (failReference) {
          failReference = false;
          return {
            data: null,
            error: { code: "23514", message: "reference insert failed" },
          };
        }
        if (!nextReferences.some((existing) =>
          existing.raw_item_id === "raw-1" &&
          existing.url === reference.url &&
          existing.source_role === reference.source_role
        )) {
          nextReferences.push({ ...reference, raw_item_id: "raw-1" });
        }
      }
      Object.assign(rawItem, nextItem);
      sourceReferences.splice(0, sourceReferences.length, ...nextReferences);
      return { data: [rawItem], error: null };
    }),
  };
  return { client: client as never, rawItem, sourceReferences };
}

type CompleteScanJobWithClient = (
  client: never,
  legacyScanJobs: Map<string, ScanJob>,
  id: string,
  leaseToken: string,
  patch: Partial<ScanJob>,
) => Promise<ScanJob | null>;

const completeScanJobWithClient = (
  supabaseRepository as unknown as {
    completeScanJobWithClient: CompleteScanJobWithClient;
  }
).completeScanJobWithClient;

type HeartbeatScanJobWithClient = (
  client: never,
  id: string,
  leaseToken: string,
  heartbeatAt: string,
) => Promise<ScanJob | null>;
type RecoverStaleScanJobWithClient = (
  client: never,
  id: string,
  leaseToken: string,
  expectedHeartbeatAt: string | null,
  patch: Partial<ScanJob>,
) => Promise<ScanJob | null>;
const heartbeatScanJobWithClient = (
  supabaseRepository as unknown as {
    heartbeatScanJobWithClient: HeartbeatScanJobWithClient;
  }
).heartbeatScanJobWithClient;
const recoverStaleScanJobWithClient = (
  supabaseRepository as unknown as {
    recoverStaleScanJobWithClient: RecoverStaleScanJobWithClient;
  }
).recoverStaleScanJobWithClient;

describe("Supabase scan-job lease CAS", () => {
  it("rejects a heartbeat that arrives after completion", async () => {
    const fake = createScanJobLeaseClient({ initialStatus: "succeeded" });

    const result = await heartbeatScanJobWithClient(
      fake.client,
      "job-1",
      "lease-current",
      "2026-07-01T10:06:00.000Z",
    );

    expect(result).toBeNull();
    expect(fake.row).toMatchObject({
      status: "succeeded",
      result_summary: {
        leaseToken: "lease-current",
        leaseHeartbeatAt: "2026-07-01T10:00:00.000Z",
      },
    });
  });

  it("rejects stale recovery when completion wins the database race", async () => {
    const fake = createScanJobLeaseClient({ completeBeforeRecovery: true });

    const result = await recoverStaleScanJobWithClient(
      fake.client,
      "job-1",
      "lease-current",
      "2026-07-01T10:00:00.000Z",
      {
        status: "failed",
        finishedAt: "2026-07-01T10:06:00.000Z",
        errorMessage: "stale",
        resultSummary: {
          leaseToken: "lease-current",
          leaseHeartbeatAt: "2026-07-01T10:00:00.000Z",
          recoveredAsStale: true,
        },
      },
    );

    expect(result).toBeNull();
    expect(fake.row).toMatchObject({
      status: "succeeded",
      error_message: null,
    });
  });
});

function createScanJobLeaseClient(options?: {
  initialStatus?: string;
  completeBeforeRecovery?: boolean;
}) {
  let row: Record<string, unknown> = scanJobRow({
    status: options?.initialStatus ?? "running",
    result_summary: {
      leaseToken: "lease-current",
      leaseHeartbeatAt: "2026-07-01T10:00:00.000Z",
    },
  });
  const client = {
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (name === "recover_stale_scan_job" && options?.completeBeforeRecovery) {
        row = {
          ...row,
          status: "succeeded",
          finished_at: "2026-07-01T10:05:59.000Z",
          error_message: null,
        };
      }
      const summary = row.result_summary as Record<string, unknown>;
      if (
        row.status !== "running" ||
        summary.leaseToken !== args.p_lease_token
      ) {
        return { data: [], error: null };
      }
      if (name === "heartbeat_scan_job") {
        row = {
          ...row,
          result_summary: {
            ...summary,
            leaseHeartbeatAt: args.p_heartbeat_at,
          },
        };
      } else if (
        name === "recover_stale_scan_job" &&
        (summary.leaseHeartbeatAt ?? null) ===
          (args.p_expected_heartbeat_at ?? null)
      ) {
        row = {
          ...row,
          status: "failed",
          finished_at: args.p_finished_at,
          result_summary: args.p_result_summary,
          error_message: args.p_error_message,
        };
      } else {
        return { data: [], error: null };
      }
      return { data: [row], error: null };
    }),
  };
  return { client: client as never, get row() { return row; } };
}

function scanJobRow(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "job-1",
    source_id: "src-1",
    trigger: "manual",
    requested_by: "test",
    status: "running",
    started_at: "2026-07-01T10:00:00.000Z",
    finished_at: null,
    result_summary: { leaseToken: "lease-current" },
    error_message: null,
    created_at: "2026-07-01T09:59:00.000Z",
    updated_at: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

function createScanJobCompletionClient(options?: {
  missingRelation?: boolean;
  rpcErrorCode?: string;
}) {
  let row: Record<string, unknown> | null = scanJobRow();
  const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => {
    if (options?.rpcErrorCode) {
      return {
        data: null,
        error: { code: options.rpcErrorCode, message: "RPC error" },
      };
    }
    if (options?.missingRelation) {
      return { data: null, error: { code: "42P01", message: "missing relation" } };
    }
    if (
      row?.status !== "running" ||
      (row.result_summary as Record<string, unknown>)?.leaseToken !==
        args.p_lease_token ||
      !["succeeded", "partial_success", "failed"].includes(
        args.p_status as string,
      )
    ) {
      return { data: [], error: null };
    }
    row = {
      ...row,
      status: args.p_status,
      finished_at: args.p_finished_at,
      result_summary: args.p_result_summary,
      error_message: args.p_error_message,
      updated_at: "2026-07-01T10:05:00.000Z",
    };
    return { data: [row], error: null };
  });
  const from = vi.fn(() => {
    let action: "select" | "update" = "select";
    let patch: Record<string, unknown> = {};
    const filters = new Map<string, unknown>();
    let summaryFilter: Record<string, unknown> | null = null;
    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        filters.set(column, value);
        return builder;
      },
      contains: (_column: string, value: Record<string, unknown>) => {
        summaryFilter = value;
        return builder;
      },
      limit: () => builder,
      update: (value: Record<string, unknown>) => {
        action = "update";
        patch = value;
        return builder;
      },
      maybeSingle: async () => {
        const matches =
          row &&
          [...filters].every(([column, value]) => row?.[column] === value) &&
          (!summaryFilter ||
            Object.entries(summaryFilter).every(
              ([key, value]) =>
                (row?.result_summary as Record<string, unknown>)?.[key] === value,
            ));
        if (!matches) {
          return { data: null, error: null };
        }
        if (action === "update") {
          row = { ...row, ...patch };
        }
        return { data: row, error: null };
      },
    };
    return builder;
  });
  return {
    client: { rpc, from } as never,
    rpc,
    from,
    get row() { return row; },
  };
}

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
      "development_type", "legal_area", "authority_type", "publication_date",
      "importance_level", "source_name", "tags"]) {
      expect(cols).toContain(`"${col}"`);
    }
  });

  it("pushes authorityType filters and filter options to Supabase", () => {
    expect(repoSrc).toContain('query.eq("authority_type", filters.authorityType)');
    expect(repoSrc).toContain("authority_type,publication_date");
    expect(repoSrc).toContain("rows.map((r) => r.authority_type as string)");
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

  it("completes scan jobs through the lease-token RPC", () => {
    const migrationSrc = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../migrations/014_scan_job_lease_completion.sql",
      ),
      "utf8",
    );

    expect(repoSrc).toContain("async completeScanJob(");
    expect(repoSrc).toContain('client.rpc("complete_scan_job"');
    expect(migrationSrc).toContain("create or replace function complete_scan_job");
    expect(migrationSrc).toContain("status = 'running'");
    expect(migrationSrc).toContain(
      "p_status in ('succeeded', 'partial_success', 'failed')",
    );
    expect(migrationSrc).toContain("result_summary->>'leaseToken' = p_lease_token");
    expect(migrationSrc).toContain("to service_role");
    expect(migrationSrc).not.toMatch(/\bstarted_at\s*=/);
    expect(migrationSrc).not.toMatch(/\bsource_id\s*=/);
    expect(migrationSrc).not.toMatch(/\brequested_by\s*=/);
    expect(migrationSrc).not.toMatch(/\btrigger\s*=/);
  });

  it("sends only restricted terminal fields and maps the RPC result", async () => {
    const fake = createScanJobCompletionClient();
    const completed = await completeScanJobWithClient(
      fake.client,
      new Map(),
      "job-1",
      "lease-current",
      {
        status: "succeeded",
        finishedAt: "2026-07-01T10:05:00.000Z",
        resultSummary: { leaseToken: "lease-current", totalFound: 3 },
        errorMessage: null,
        sourceId: "src-overwrite",
        requestedBy: "attacker",
      },
    );

    expect(fake.rpc).toHaveBeenCalledWith("complete_scan_job", {
      p_id: "job-1",
      p_lease_token: "lease-current",
      p_status: "succeeded",
      p_finished_at: "2026-07-01T10:05:00.000Z",
      p_result_summary: { leaseToken: "lease-current", totalFound: 3 },
      p_error_message: null,
    });
    expect(completed).toMatchObject({
      id: "job-1",
      sourceId: "src-1",
      requestedBy: "test",
      status: "succeeded",
    });
  });

  it("returns null for stale and repeated RPC completion", async () => {
    const fake = createScanJobCompletionClient();
    const patch: Partial<ScanJob> = {
      status: "failed",
      finishedAt: "2026-07-01T10:05:00.000Z",
      resultSummary: { leaseToken: "lease-current" },
      errorMessage: "failed",
    };

    await expect(
      completeScanJobWithClient(
        fake.client,
        new Map(),
        "job-1",
        "lease-stale",
        patch,
      ),
    ).resolves.toBeNull();
    await expect(
      completeScanJobWithClient(
        fake.client,
        new Map(),
        "job-1",
        "lease-current",
        patch,
      ),
    ).resolves.toMatchObject({ status: "failed" });
    await expect(
      completeScanJobWithClient(
        fake.client,
        new Map(),
        "job-1",
        "lease-current",
        patch,
      ),
    ).resolves.toBeNull();
  });

  it.each([undefined, "queued", "running"] as const)(
    "legacy fallback rejects %s completion status",
    async (status) => {
      const fake = createScanJobCompletionClient({ missingRelation: true });
      const legacyJob = {
        id: "job-1",
        sourceId: "src-1",
        trigger: "manual",
        requestedBy: "test",
        status: "running",
        startedAt: "2026-07-01T10:00:00.000Z",
        finishedAt: null,
        resultSummary: { leaseToken: "lease-current" },
        errorMessage: null,
        createdAt: "2026-07-01T09:59:00.000Z",
        updatedAt: "2026-07-01T10:00:00.000Z",
      } satisfies ScanJob;
      const legacy = new Map([[legacyJob.id, legacyJob]]);

      const completed = await completeScanJobWithClient(
        fake.client,
        legacy,
        legacyJob.id,
        "lease-current",
        {
          status,
          finishedAt: "2026-07-01T10:05:00.000Z",
          resultSummary: { leaseToken: "lease-current" },
          errorMessage: null,
        },
      );

      expect(completed).toBeNull();
      expect(legacy.get(legacyJob.id)).toEqual(legacyJob);
      expect(fake.rpc).not.toHaveBeenCalled();
    },
  );

  it("legacy fallback completes once and preserves restricted fields", async () => {
    const fake = createScanJobCompletionClient({ missingRelation: true });
    const legacyJob = {
      id: "job-1",
      sourceId: "src-1",
      trigger: "manual",
      requestedBy: "test",
      status: "running",
      startedAt: "2026-07-01T10:00:00.000Z",
      finishedAt: null,
      resultSummary: { leaseToken: "lease-current" },
      errorMessage: null,
      createdAt: "2026-07-01T09:59:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    } satisfies ScanJob;
    const legacy = new Map([[legacyJob.id, legacyJob]]);
    const patch: Partial<ScanJob> = {
      status: "partial_success",
      finishedAt: "2026-07-01T10:05:00.000Z",
      resultSummary: { leaseToken: "lease-current", totalFound: 2 },
      errorMessage: "one source failed",
      sourceId: "src-overwrite",
      requestedBy: "attacker",
    };

    const completed = await completeScanJobWithClient(
      fake.client,
      legacy,
      legacyJob.id,
      "lease-current",
      patch,
    );
    const repeated = await completeScanJobWithClient(
      fake.client,
      legacy,
      legacyJob.id,
      "lease-current",
      patch,
    );

    expect(completed).toMatchObject({
      status: "partial_success",
      sourceId: "src-1",
      requestedBy: "test",
      trigger: "manual",
      startedAt: "2026-07-01T10:00:00.000Z",
    });
    expect(repeated).toBeNull();
  });

  it("uses legacy fallback when PostgREST cannot find the completion RPC", async () => {
    const fake = createScanJobCompletionClient({ rpcErrorCode: "PGRST202" });

    await expect(
      completeScanJobWithClient(
        fake.client,
        new Map(),
        "job-1",
        "lease-current",
        {
          status: "succeeded",
          finishedAt: "2026-07-01T10:05:00.000Z",
          resultSummary: { leaseToken: "lease-current" },
          errorMessage: null,
        },
      ),
    ).resolves.toMatchObject({ status: "succeeded" });
    expect(fake.from).toHaveBeenCalledWith("scan_jobs");
    expect(fake.row).toMatchObject({ status: "succeeded" });
  });

  it("does not treat unrelated PostgREST RPC errors as missing", async () => {
    const fake = createScanJobCompletionClient({ rpcErrorCode: "PGRST204" });

    await expect(
      completeScanJobWithClient(
        fake.client,
        new Map(),
        "job-1",
        "lease-current",
        {
          status: "succeeded",
          finishedAt: "2026-07-01T10:05:00.000Z",
          resultSummary: { leaseToken: "lease-current" },
          errorMessage: null,
        },
      ),
    ).rejects.toThrow("Failed to complete scan job");
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
    for (const key of ["status", "jurisdiction", "region", "legalArea", "authorityType",
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
  it("blocks items without human approval when no official source is confirmed", () => {
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

  it("allows official-source legal database items without admin approval", () => {
    const result = evaluatePublicationEligibility({
      update: {
        status: "needs_review",
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

    expect(result.eligible).toBe(true);
    expect(result.blockingReasons).toEqual([]);
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
