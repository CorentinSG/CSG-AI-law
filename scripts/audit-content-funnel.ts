/**
 * Where does the monitor's value leak?
 *
 * The pipeline is: sources → scans → raw items → regulatory updates / news
 * items → published → visible to a visitor. This session proved the left half
 * works (scans drain the queue, 101 results a run) — but nobody has ever
 * measured how much of what is collected actually reaches the public site.
 * Every improvement decision — enabling AI processing, editorial cadence,
 * source recovery — depends on knowing which stage leaks.
 *
 * Read-only: nothing but `select count(*)` through PostgREST with the
 * service-role key the monitoring workflow already holds. Same execution model
 * as audit-constraint-drift.ts, and runnable from the same place.
 *
 *   npx tsx scripts/audit-content-funnel.ts [--json funnel.json]
 */

import { writeFileSync } from "node:fs";

import { getSupabaseAdminClient } from "@/lib/supabase";

type Client = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** One funnel stage measured over one window. */
type StageCount = { label: string; count: number | null; error?: string };

/** The PostgREST filter builder a head-count select returns. */
type CountQuery = ReturnType<ReturnType<Client["from"]>["select"]>;

async function countRows(
  client: Client,
  table: string,
  label: string,
  filter?: (query: CountQuery) => CountQuery,
): Promise<StageCount> {
  let query: CountQuery = client.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return { label, count: null, error: error.message };
  return { label, count: count ?? 0 };
}

async function measureWindow(client: Client, sinceIso: string | null) {
  const since = (query: CountQuery, column: string): CountQuery =>
    sinceIso ? query.gte(column, sinceIso) : query;

  // Each stage names the honest question it answers.
  return {
    scansSucceeded: await countRows(client, "scan_jobs", "scan jobs succeeded", (q) =>
      since(q, "created_at").in("status", ["succeeded", "partial_success"]),
    ),
    rawItems: await countRows(client, "raw_regulatory_items", "raw items collected", (q) =>
      since(q, "created_at"),
    ),
    rawDuplicates: await countRows(client, "raw_regulatory_items", "…of which duplicates", (q) =>
      since(q, "created_at").eq("processing_status", "duplicate"),
    ),
    updatesCreated: await countRows(client, "ai_regulatory_updates", "DB entries created", (q) =>
      since(q, "created_at"),
    ),
    updatesPublished: await countRows(client, "ai_regulatory_updates", "…published", (q) =>
      since(q, "created_at").eq("status", "published"),
    ),
    updatesNeedsReview: await countRows(client, "ai_regulatory_updates", "…awaiting review", (q) =>
      since(q, "created_at").eq("status", "needs_review"),
    ),
    newsCreated: await countRows(client, "news_items", "news items created", (q) =>
      since(q, "created_at"),
    ),
    newsPublic: await countRows(client, "news_items", "…publicly visible", (q) =>
      since(q, "created_at").eq("public_visibility_status", "public"),
    ),
    leadsCreated: await countRows(client, "discovery_leads", "discovery leads", (q) =>
      since(q, "detected_at"),
    ),
  };
}

type WindowReport = Awaited<ReturnType<typeof measureWindow>>;

function printWindow(title: string, report: WindowReport) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(1, 46 - title.length))}`);
  for (const stage of Object.values(report)) {
    const value = stage.count === null ? `ERROR: ${stage.error}` : String(stage.count);
    console.log(`  ${stage.label.padEnd(28)} ${value}`);
  }

  const raw = report.rawItems.count;
  const created = report.updatesCreated.count;
  const published = report.updatesPublished.count;
  const newsPublic = report.newsPublic.count;
  if (raw !== null && created !== null && published !== null && newsPublic !== null) {
    const pct = (part: number, whole: number) =>
      whole === 0 ? "n/a" : `${Math.round((part / whole) * 100)}%`;
    console.log(`  conversion raw→entry            ${pct(created, raw)}`);
    console.log(`  conversion entry→published      ${pct(published, Math.max(created, 1))}`);
    console.log(`  public news per 100 raw items   ${pct(newsPublic, raw)}`);
  }
}

async function main() {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error(
      "No Supabase admin client: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.",
    );
    process.exit(1);
  }

  console.log("Content funnel audit — read-only, counts only, changes nothing.");

  const now = Date.now();
  const windows: Array<[string, string | null]> = [
    ["Last 7 days", new Date(now - 7 * DAY_MS).toISOString()],
    ["Last 30 days", new Date(now - 30 * DAY_MS).toISOString()],
    ["All time", null],
  ];

  const results: Record<string, WindowReport> = {};
  for (const [title, sinceIso] of windows) {
    results[title] = await measureWindow(client, sinceIso);
    printWindow(title, results[title]);
  }

  console.log(
    "\nReading guide: a healthy funnel loses most volume at raw→entry (dedup and\n" +
      "filters are supposed to be strict) but should not lose everything at\n" +
      "entry→published — that stage is where auto-publication policy applies.\n" +
      "A near-zero 7-day column with a healthy 30-day column means the pipeline\n" +
      "recently stalled, not that it never worked.",
  );

  const jsonArg = process.argv.indexOf("--json");
  if (jsonArg >= 0) {
    const path = process.argv[jsonArg + 1] ?? "content-funnel.json";
    writeFileSync(path, JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2));
    console.log(`\nWrote ${path}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
