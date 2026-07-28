import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import * as supabaseRepository from "@/db/repositories/supabase-repository";
import type { ScanJob } from "@/agents/ai-regulation/governance";

// supabase-repository routes legacy-fallback alerts through @/lib/alerting.
// This file is separate from supabase-repository.test.ts on purpose: the
// webhook de-duplication set is module-level, so it needs a fresh registry.
const postAlertPayloadMock = vi.hoisted(() =>
  vi.fn<(payload: unknown) => Promise<unknown>>(async () => ({
    attempted: false,
    ok: true,
    status: null,
  })),
);
vi.mock("@/lib/alerting", () => ({ postAlertPayload: postAlertPayloadMock }));

const repoSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "supabase-repository.ts"),
  "utf8",
);

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

const FALLBACK_DETECTORS = [
  "isMissingRelationError",
  "isMissingRpcError",
  "isSchemaCacheMismatchError",
  "isMissingAuthorityTypeColumnError",
];

describe("Supabase legacy-fallback observability — source coverage", () => {
  it("reports every legacy-fallback branch instead of swallowing it", () => {
    const lines = repoSrc.split("\n");
    const detector = new RegExp(`^\\s*if \\((?:${FALLBACK_DETECTORS.join("|")})\\(`);
    const branches: string[] = [];
    const unreported: string[] = [];

    lines.forEach((line, index) => {
      if (!detector.test(line)) return;
      branches.push(`line ${index + 1}`);
      if (!(lines[index + 1] ?? "").includes("reportRepositoryFallback({")) {
        unreported.push(`line ${index + 1}: ${line.trim()}`);
      }
    });

    expect(unreported).toEqual([]);
    // Guards against the assertion passing vacuously if the branches move.
    expect(branches.length).toBeGreaterThanOrEqual(49);
  });

  it("reports the non-predicate silent-swallow sites too", () => {
    for (const operation of [
      "transitionReviewStatus",
      "findRawRegulatoryItemByUrl",
      "createIngestionLog",
      "listIngestionLogs",
    ]) {
      expect(repoSrc).toContain(`operation: "${operation}"`);
    }
  });

  it("classifies unpersisted audit writes as write_not_persisted", () => {
    const auditWrites: Array<[string, string]> = [
      ["review_events", "createReviewEvent"],
      ["verification_attempts", "createVerificationAttempt"],
      ["country_profile_review_events", "createCountryProfileReviewEvent"],
      ["data_quality_findings", "upsertDataQualityFinding"],
      ["scan_jobs", "createScanJob"],
      ["ingestion_logs", "createIngestionLog"],
    ];

    for (const [table, operation] of auditWrites) {
      expect(repoSrc).toMatch(
        new RegExp(
          `table: "${table}",\\s*\\n\\s*operation: "${operation}",\\s*\\n\\s*impact: "write_not_persisted",`,
        ),
      );
    }
  });

  it("keeps the in-memory fallbacks in place so schema drift degrades, not crashes", () => {
    for (const map of [
      "legacySourceReferences",
      "legacyVerificationAttempts",
      "legacyReviewEvents",
      "legacyDataQualityFindings",
      "legacyScanJobs",
      "legacyDiscoveryLeads",
      "legacyNewsItems",
      "legacySourceHealthChecks",
      "legacyCountryIntelligence",
    ]) {
      expect(repoSrc).toContain(`private readonly ${map} = new Map`);
    }
  });
});

describe("Supabase legacy-fallback observability — runtime", () => {
  it("logs the table, operation and data-loss impact when a write falls back to memory", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const baseJob: ScanJob = {
      id: "job-legacy",
      sourceId: "src-test",
      trigger: "manual",
      requestedBy: "tester",
      status: "running",
      startedAt: "2026-07-01T10:00:00.000Z",
      finishedAt: null,
      resultSummary: { leaseToken: "lease-1" },
      errorMessage: null,
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    };
    const legacyScanJobs = new Map<string, ScanJob>([["job-legacy", baseJob]]);
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: "PGRST205", message: "Could not find the table 'public.scan_jobs'" },
      })),
      from: vi.fn(() => {
        throw new Error("must not query a table that does not exist");
      }),
    } as never;
    const patch: Partial<ScanJob> = {
      status: "succeeded",
      finishedAt: "2026-07-01T10:05:00.000Z",
      resultSummary: { leaseToken: "lease-1" },
      errorMessage: null,
    };

    const completed = await completeScanJobWithClient(
      client,
      legacyScanJobs,
      "job-legacy",
      "lease-1",
      patch,
    );

    // The fallback still works — schema drift degrades instead of crashing.
    expect(completed).toMatchObject({ id: "job-legacy", status: "succeeded" });

    const message = String(errorSpy.mock.calls.at(-1)?.[0]);
    expect(message).toContain("legacy fallback engaged");
    expect(message).toContain("table=scan_jobs");
    expect(message).toContain("operation=completeScanJobWithClient");
    expect(message).toContain("impact=write_not_persisted");
    expect(message).toContain("code=PGRST205");
    expect(message).toContain("DATA WAS NOT PERSISTED");

    await vi.waitFor(() => expect(postAlertPayloadMock).toHaveBeenCalledTimes(1));
    expect(postAlertPayloadMock.mock.calls[0][0]).toMatchObject({
      kind: "repository_legacy_fallback",
      table: "scan_jobs",
      operation: "completeScanJobWithClient",
      impact: "write_not_persisted",
    });

    // Every occurrence is logged; the webhook is de-duplicated per process.
    const logsAfterFirst = errorSpy.mock.calls.length;
    legacyScanJobs.set("job-legacy", { ...baseJob });
    await completeScanJobWithClient(client, legacyScanJobs, "job-legacy", "lease-1", patch);

    expect(errorSpy.mock.calls.length).toBe(logsAfterFirst + 1);
    await vi.waitFor(() => expect(postAlertPayloadMock).toHaveBeenCalledTimes(1));

    errorSpy.mockRestore();
  });

  it("logs a degraded write when the atomic scan-job RPC is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const row: Record<string, unknown> = {
      id: "job-rpc",
      source_id: "src-test",
      trigger: "manual",
      requested_by: "tester",
      status: "running",
      started_at: "2026-07-01T10:00:00.000Z",
      finished_at: null,
      result_summary: { leaseToken: "lease-1" },
      error_message: null,
      created_at: "2026-07-01T09:00:00.000Z",
      updated_at: "2026-07-01T10:00:00.000Z",
    };
    const builder = {
      select: () => builder,
      eq: () => builder,
      contains: () => builder,
      limit: () => builder,
      update: () => builder,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: "PGRST202", message: "function complete_scan_job does not exist" },
      })),
      from: vi.fn(() => builder),
    } as never;

    await completeScanJobWithClient(client, new Map(), "job-rpc", "lease-1", {
      status: "succeeded",
      finishedAt: "2026-07-01T10:05:00.000Z",
      resultSummary: { leaseToken: "lease-1" },
      errorMessage: null,
    });

    const messages = errorSpy.mock.calls.map((call) => String(call[0]));
    expect(
      messages.some(
        (message) =>
          message.includes("table=scan_jobs") &&
          message.includes("operation=completeScanJobWithClient") &&
          message.includes("impact=write_degraded") &&
          message.includes("code=PGRST202"),
      ),
    ).toBe(true);

    errorSpy.mockRestore();
  });
});
