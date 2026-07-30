/**
 * Is migration 031 already applied in production?
 *
 * Nobody knows. The 2026-07-25 handoff records that 031 was never applied and
 * that production migration history is unknown, and the existing
 * `audit-database-schema.ts` cannot answer it here: it opens a direct Postgres
 * connection through DATABASE_URL, which is not among the workflow's secrets.
 *
 * But 031 repairs two CHECK constraints, and a drifted CHECK leaves observable
 * traces in ordinary table data. This reads those traces through PostgREST with
 * the service-role key the monitoring workflow already holds. It writes nothing.
 *
 *   1. source_references_source_type_check — migration 017 recreated the table
 *      with the pre-005 value list. If the CHECK is still drifted, every write
 *      carrying one of the four values 005 added is rejected, so none of them can
 *      be present in the table.
 *
 *   2. regulation_sources source_category CHECK — 028 inserts
 *      'official_legal_database', which the 009 CHECK forbids. If the CHECK is
 *      still drifted, 028 could not have applied and src-eur-lex-ai is absent.
 *
 * Absence is weaker evidence than a rejected write: a value can be missing
 * because nothing wrote it yet. The report says so rather than overclaiming, and
 * the second check is the sharper one — 028 targets exactly one known row.
 *
 *   npx tsx scripts/audit-constraint-drift.ts
 */

import { getSupabaseAdminClient } from "@/lib/supabase";

/** The four values migration 005 added and 017 dropped again. */
const VALUES_ADDED_BY_005 = ["government", "parliament", "legislation", "policy"] as const;

/** The row migration 028 inserts, which the drifted CHECK forbids. */
const MIGRATION_028_SOURCE_ID = "src-eur-lex-ai";
const MIGRATION_028_CATEGORY = "official_legal_database";

async function main() {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error(
      "No Supabase admin client: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.",
    );
    process.exit(1);
  }

  console.log("Auditing the two CHECK constraints migration 031 repairs.");
  console.log("Read-only: this writes nothing and changes no row.\n");

  // ── 1. source_references.source_type ────────────────────────────────────
  const { data: refRows, error: refError } = await client
    .from("source_references")
    .select("source_type")
    .in("source_type", VALUES_ADDED_BY_005 as unknown as string[])
    .limit(1);

  console.log("1. source_references_source_type_check");
  if (refError) {
    // A missing table is itself an answer: 017 never ran either.
    console.log(`   INCONCLUSIVE — query failed: ${refError.message}`);
  } else if ((refRows ?? []).length > 0) {
    console.log(`   APPLIED — found a row with source_type='${refRows![0].source_type}',`);
    console.log("   which the drifted CHECK would have rejected.");
  } else {
    console.log(`   NO EVIDENCE — no row carries any of: ${VALUES_ADDED_BY_005.join(", ")}.`);
    console.log("   Consistent with the drift, but also with nothing having written one yet.");
  }

  // ── 2. regulation_sources.source_category ───────────────────────────────
  const { data: srcRows, error: srcError } = await client
    .from("regulation_sources")
    .select("id, source_category, active")
    .eq("id", MIGRATION_028_SOURCE_ID)
    .limit(1);

  console.log("\n2. regulation_sources source_category CHECK (migration 028 row)");
  if (srcError) {
    console.log(`   INCONCLUSIVE — query failed: ${srcError.message}`);
  } else if ((srcRows ?? []).length === 0) {
    console.log(`   DRIFTED — ${MIGRATION_028_SOURCE_ID} is absent.`);
    console.log(`   028 inserts it with source_category='${MIGRATION_028_CATEGORY}', which the`);
    console.log("   009 CHECK forbids, so 028 cannot have applied. 031 repairs this.");
  } else {
    const row = srcRows![0] as { source_category: string; active: boolean };
    console.log(`   APPLIED — ${MIGRATION_028_SOURCE_ID} exists`);
    console.log(`   (source_category='${row.source_category}', active=${row.active}).`);
  }

  // ── Which categories does production actually hold? ──────────────────────
  // Cheap context for the reader: if 'official_legal_database' appears at all,
  // the CHECK has been widened regardless of what happened to the 028 row.
  const { data: catRows, error: catError } = await client
    .from("regulation_sources")
    .select("source_category")
    .eq("source_category", MIGRATION_028_CATEGORY)
    .limit(1);

  if (!catError) {
    const present = (catRows ?? []).length > 0;
    console.log(
      `\n   '${MIGRATION_028_CATEGORY}' present anywhere in regulation_sources: ${present ? "yes" : "no"}`,
    );
  }

  console.log("\nNothing was changed. Applying 031 remains a separate, explicit decision.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
