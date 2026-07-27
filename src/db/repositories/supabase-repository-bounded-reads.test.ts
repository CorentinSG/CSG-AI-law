import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// PostgREST truncates at db-max-rows and still answers 200 OK, so these tests
// drive the repository through a fake client that reproduces that behaviour.
// The client factories are mocked at module level, before the repository is
// imported, so `requireAdminClient()` resolves to the fake.
const getSupabaseAdminClientMock = vi.hoisted(() => vi.fn());
const getSupabaseServerReadClientMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
  getSupabaseServerReadClient: getSupabaseServerReadClientMock,
}));
vi.mock("@/lib/alerting", () => ({
  postAlertPayload: vi.fn(async () => ({ attempted: false, ok: true, status: null })),
}));

import {
  BOUNDED_READ_MAX_ROWS,
  BOUNDED_READ_PAGE_SIZE,
  SupabaseAiRegulationRepository,
  fetchAllRows,
} from "@/db/repositories/supabase-repository";

type Row = Record<string, unknown>;

interface QueryCall {
  table: string;
  from: number | null;
  to: number | null;
  limit: number | null;
}

/**
 * Minimal PostgREST stand-in: supports the builder calls the repository makes,
 * is thenable like a real query, and — crucially — caps every response at
 * `serverMaxRows` the way `db-max-rows` does, regardless of the range asked for.
 */
function createFakeClient(
  tables: Record<string, Row[]>,
  options?: { serverMaxRows?: number },
) {
  const serverMaxRows = options?.serverMaxRows ?? BOUNDED_READ_PAGE_SIZE;
  const calls: QueryCall[] = [];

  function builder(table: string) {
    let rows = [...(tables[table] ?? [])];
    let from: number | null = null;
    let to: number | null = null;
    let limit: number | null = null;

    const api = {
      select: () => api,
      order: (column: string, opts?: { ascending?: boolean }) => {
        const ascending = opts?.ascending ?? true;
        rows = [...rows].sort((a, b) => {
          const left = String(a[column] ?? "");
          const right = String(b[column] ?? "");
          return ascending ? left.localeCompare(right) : right.localeCompare(left);
        });
        return api;
      },
      eq: (column: string, value: unknown) => {
        rows = rows.filter((row) => row[column] === value);
        return api;
      },
      gte: (column: string, value: string) => {
        rows = rows.filter((row) => String(row[column]) >= value);
        return api;
      },
      contains: () => api,
      range: (start: number, end: number) => {
        from = start;
        to = end;
        return api;
      },
      limit: (count: number) => {
        limit = count;
        return api;
      },
      then: (resolve: (value: { data: Row[]; error: null }) => unknown) => {
        calls.push({ table, from, to, limit });
        let out = rows;
        if (from !== null && to !== null) out = out.slice(from, to + 1);
        if (limit !== null) out = out.slice(0, limit);
        // The server-side ceiling applies no matter how wide the window is.
        out = out.slice(0, serverMaxRows);
        return Promise.resolve({ data: out, error: null }).then(resolve);
      },
    };
    return api;
  }

  return { client: { from: (table: string) => builder(table) }, calls };
}

function updateRow(index: number): Row {
  return {
    id: `upd-${String(index).padStart(6, "0")}`,
    source_id: "src-1",
    raw_item_id: `raw-${index}`,
    title: `Update ${index}`,
    source_name: `Source ${index % 3}`,
    source_url: "https://example.com",
    jurisdiction: "European Union",
    region: "Europe",
    country: "",
    development_type: "Regulation",
    legal_area: "AI governance",
    authority_type: "regulator",
    publication_date: "2026-01-01",
    detected_date: "2026-01-01",
    one_sentence_summary: "",
    summary: "",
    what_happened: "",
    why_it_matters: "",
    practical_impact: "",
    affected_parties: [],
    key_obligations: [],
    compliance_deadlines: [],
    enforcement_risk: "",
    importance_level: "medium",
    confidence_level: "medium",
    tags: [`tag-${index % 4}`],
    status: "published",
    reviewed_by: null,
    reviewed_at: null,
    published_at: null,
    created_at: `2026-01-01T00:00:00.${String(index).padStart(6, "0")}Z`,
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function scanJobRow(id: string, status: string, createdAt: string): Row {
  return {
    id,
    source_id: "src-1",
    trigger: "scheduled",
    requested_by: "central-monitoring-scheduler",
    status,
    started_at: null,
    finished_at: null,
    result_summary: {},
    error_message: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  getSupabaseAdminClientMock.mockReset();
  getSupabaseServerReadClientMock.mockReset();
});

// ---------------------------------------------------------------------------
// 1. The paging walk itself — the boundary at, below and above the cap
// ---------------------------------------------------------------------------

describe("fetchAllRows — bounded paging walk", () => {
  function pagedSource(total: number, pageSize: number) {
    const all = Array.from({ length: total }, (_, index) => ({ id: index }));
    const windows: Array<[number, number]> = [];
    return {
      windows,
      buildPage: (from: number, to: number) => {
        windows.push([from, to]);
        return Promise.resolve({
          data: all.slice(from, Math.min(to + 1, from + pageSize)),
          error: null,
        });
      },
    };
  }

  it("assembles every row when the total is below the cap", async () => {
    const source = pagedSource(2500, 1000);
    const result = await fetchAllRows(source.buildPage, {
      table: "t",
      operation: "op",
      pageSize: 1000,
      maxRows: 10_000,
    });

    expect(result.rows).toHaveLength(2500);
    expect(result.truncated).toBe(false);
    expect(result.rows[0]).toEqual({ id: 0 });
    expect(result.rows[2499]).toEqual({ id: 2499 });
    // Three full-ish windows plus the empty one that proves the walk is done.
    expect(source.windows).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2500, 3499],
    ]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("returns exactly the cap without reporting truncation when the total equals it", async () => {
    const source = pagedSource(400, 100);
    const result = await fetchAllRows(source.buildPage, {
      table: "t",
      operation: "op",
      pageSize: 100,
      maxRows: 400,
    });

    expect(result.rows).toHaveLength(400);
    expect(result.truncated).toBe(false);
    // The extra window past the cap is what distinguishes "exactly 400 rows
    // exist" from "there are more" — without it this case would false-alarm.
    expect(source.windows.at(-1)).toEqual([400, 499]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("caps the result and reports truncation when more rows exist than the cap", async () => {
    const source = pagedSource(1000, 100);
    const result = await fetchAllRows(source.buildPage, {
      table: "t",
      operation: "listSomething",
      pageSize: 100,
      maxRows: 400,
    });

    expect(result.rows).toHaveLength(400);
    expect(result.truncated).toBe(true);
    expect(result.rows.at(-1)).toEqual({ id: 399 });

    const message = String(errorSpy.mock.calls.at(-1)?.[0]);
    expect(message).toContain("bounded read truncated");
    expect(message).toContain("operation=listSomething");
    expect(message).toContain("cap=400");
    expect(message).toContain("RESULTS ARE INCOMPLETE");
  });

  it("keeps walking when the server caps a window below the requested size", async () => {
    // db-max-rows=500 while the caller asks for windows of 1000: advancing by
    // rows actually received is what stops this from silently ending at 500.
    const source = pagedSource(1200, 500);
    const result = await fetchAllRows(source.buildPage, {
      table: "t",
      operation: "op",
      pageSize: 1000,
      maxRows: 10_000,
    });

    expect(result.rows).toHaveLength(1200);
    expect(result.truncated).toBe(false);
    expect(source.windows.map(([from]) => from)).toEqual([0, 500, 1000, 1200]);
  });

  it("stops and surfaces the error instead of looping when a window fails", async () => {
    const error = { code: "42501", message: "permission denied" };
    const result = await fetchAllRows(async () => ({ data: null, error }), {
      table: "t",
      operation: "op",
    });

    expect(result.error).toBe(error);
    expect(result.rows).toEqual([]);
  });

  it("pages at the PostgREST ceiling by default", () => {
    expect(BOUNDED_READ_PAGE_SIZE).toBe(1000);
    expect(BOUNDED_READ_MAX_ROWS).toBe(10_000);
  });
});

// ---------------------------------------------------------------------------
// 2. The reads the audit flagged as silently truncated
// ---------------------------------------------------------------------------

describe("listRegulatoryUpdates — no longer stops at the PostgREST cap", () => {
  it("returns every row past 1000 instead of the first page", async () => {
    const rows = Array.from({ length: 2500 }, (_, index) => updateRow(index));
    const fake = createFakeClient({ ai_regulatory_updates: rows });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const updates = await new SupabaseAiRegulationRepository().listRegulatoryUpdates();

    expect(updates).toHaveLength(2500);
    expect(new Set(updates.map((update) => update.id)).size).toBe(2500);
    expect(fake.calls.map((call) => call.from)).toEqual([0, 1000, 2000, 2500]);
  });

  it("does not double-count a row returned in two adjacent windows", async () => {
    // A concurrent insert shifts the window, so the same row can come back
    // twice; ids keep the assembled set unique.
    const rows = Array.from({ length: 10 }, (_, index) => updateRow(index));
    const fake = createFakeClient({ ai_regulatory_updates: [...rows, rows[0]] }, {
      serverMaxRows: 4,
    });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const updates = await new SupabaseAiRegulationRepository().listRegulatoryUpdates();

    expect(updates).toHaveLength(10);
    expect(new Set(updates.map((update) => update.id)).size).toBe(10);
  });

  it("keeps the public scope filtered to published rows while paging", async () => {
    const rows = [
      ...Array.from({ length: 1200 }, (_, index) => updateRow(index)),
      { ...updateRow(9001), status: "needs_review" },
    ];
    const fake = createFakeClient({ ai_regulatory_updates: rows });
    getSupabaseServerReadClientMock.mockReturnValue(fake.client);

    const updates = await new SupabaseAiRegulationRepository().listRegulatoryUpdates(
      undefined,
      "public",
    );

    expect(updates).toHaveLength(1200);
    expect(updates.every((update) => update.status === "published")).toBe(true);
  });
});

describe("listDistinctFilterValues — no longer stops at the PostgREST cap", () => {
  it("sees values that only occur past the first page", async () => {
    const rows = Array.from({ length: 1500 }, (_, index) => updateRow(index));
    rows[1400] = {
      ...rows[1400],
      source_name: "Only Beyond The First Page",
      tags: ["late-tag"],
    };
    const fake = createFakeClient({ ai_regulatory_updates: rows });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const options = await new SupabaseAiRegulationRepository().listDistinctFilterValues();

    expect(options.sourceName).toContain("Only Beyond The First Page");
    expect(options.tag).toContain("late-tag");
    expect(fake.calls.map((call) => call.from)).toEqual([0, 1000, 1500]);
  });
});

// ---------------------------------------------------------------------------
// 3. Queue reads
// ---------------------------------------------------------------------------

describe("listQueuedScanJobs (supabase)", () => {
  it("selects the oldest queued jobs first, ignoring newer non-queued work", async () => {
    const fake = createFakeClient({
      scan_jobs: [
        scanJobRow("job-new-running", "running", "2026-07-27T12:00:00.000Z"),
        scanJobRow("job-old", "queued", "2026-07-20T09:00:00.000Z"),
        scanJobRow("job-newest", "queued", "2026-07-27T11:00:00.000Z"),
        scanJobRow("job-mid", "queued", "2026-07-24T09:00:00.000Z"),
        scanJobRow("job-done", "succeeded", "2026-07-27T10:00:00.000Z"),
      ],
    });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const jobs = await new SupabaseAiRegulationRepository().listQueuedScanJobs();

    expect(jobs.map((job) => job.id)).toEqual(["job-old", "job-mid", "job-newest"]);
  });

  it("honours the caller's limit from the head of the queue", async () => {
    const fake = createFakeClient({
      scan_jobs: Array.from({ length: 40 }, (_, index) =>
        scanJobRow(
          `job-${String(index).padStart(3, "0")}`,
          "queued",
          `2026-07-${String((index % 27) + 1).padStart(2, "0")}T09:00:00.000Z`,
        ),
      ),
    });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const jobs = await new SupabaseAiRegulationRepository().listQueuedScanJobs(5);

    expect(jobs).toHaveLength(5);
    expect(jobs[0].createdAt <= jobs[4].createdAt).toBe(true);
    expect(fake.calls.at(-1)?.limit).toBe(5);
  });
});

describe("listScanJobsCreatedSince (supabase)", () => {
  it("returns only jobs inside the time window", async () => {
    const fake = createFakeClient({
      scan_jobs: [
        scanJobRow("job-inside-1", "succeeded", "2026-07-27T11:55:00.000Z"),
        scanJobRow("job-outside", "succeeded", "2026-07-27T10:00:00.000Z"),
        scanJobRow("job-inside-2", "queued", "2026-07-27T11:59:00.000Z"),
      ],
    });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const jobs = await new SupabaseAiRegulationRepository().listScanJobsCreatedSince(
      "2026-07-27T11:50:00.000Z",
    );

    expect(jobs.map((job) => job.id)).toEqual(["job-inside-2", "job-inside-1"]);
    // limit + 1 is requested so "exactly at the limit" is distinguishable.
    expect(fake.calls.at(-1)?.limit).toBe(501);
  });

  it("caps the window and reports truncation when it holds more than the limit", async () => {
    const fake = createFakeClient(
      {
        scan_jobs: Array.from({ length: 12 }, (_, index) =>
          scanJobRow(`job-${index}`, "queued", `2026-07-27T11:${String(index).padStart(2, "0")}:00.000Z`),
        ),
      },
      { serverMaxRows: 1000 },
    );
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const jobs = await new SupabaseAiRegulationRepository().listScanJobsCreatedSince(
      "2026-07-27T00:00:00.000Z",
      10,
    );

    expect(jobs).toHaveLength(10);
    const message = String(errorSpy.mock.calls.at(-1)?.[0]);
    expect(message).toContain("bounded read truncated");
    expect(message).toContain("table=scan_jobs");
    expect(message).toContain("operation=listScanJobsCreatedSince");
    expect(message).toContain("cap=10");
  });

  it("stays silent when the window holds exactly the limit", async () => {
    const fake = createFakeClient({
      scan_jobs: Array.from({ length: 10 }, (_, index) =>
        scanJobRow(`job-${index}`, "queued", `2026-07-27T11:${String(index).padStart(2, "0")}:00.000Z`),
      ),
    });
    getSupabaseAdminClientMock.mockReturnValue(fake.client);

    const jobs = await new SupabaseAiRegulationRepository().listScanJobsCreatedSince(
      "2026-07-27T00:00:00.000Z",
      10,
    );

    expect(jobs).toHaveLength(10);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
