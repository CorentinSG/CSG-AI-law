import { loadScriptEnv } from "../src/lib/load-script-env";
import type { SupabaseClient } from "@supabase/supabase-js";

loadScriptEnv();

function getHostOnly(url: string | undefined) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

function describeKey(value: string | undefined) {
  if (!value) return "missing";
  if (value.startsWith("eyJ")) return `legacy-jwt(len:${value.length})`;
  return `opaque(len:${value.length})`;
}

async function upsertAndLog(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  console.log(`[seed] upserting table=${table} rows=${rows.length}`);
  if (rows.length === 0) {
    console.log(`[seed] ${table}: skipped (no rows)`);
    return;
  }

  const { data, error } = await client
    .from(table)
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) {
    const optionalCompatibilityTables = new Set([
      "source_references",
      "verification_attempts",
      "review_events",
      "data_quality_findings",
      "scan_jobs",
      "news_items",
      "source_health_checks",
    ]);
    const optionalMigration006Tables = new Set([
      "country_intelligence",
      "country_intelligence_sources",
    ]);
    const legacyUnsupportedSourceColumns = new Set([
      "last_successful_scan_at",
      "last_failed_scan_at",
      "latest_response_status",
      "latest_items_fetched",
      "latest_new_items_detected",
      "latest_duplicates_detected",
      "latest_parser_warnings",
      "latest_accessibility_issue",
      "source_reliability_notes",
    ]);
    const legacySourceTypeFallbacks: Record<string, string> = {
      court_database: "legislative_database",
      standards_body: "static_page",
      tracker_source: "static_page",
      discovery_source: "static_page",
      media_source: "static_page",
    };

    if (table === "regulation_sources" && error.code === "PGRST204") {
      const legacyRows = rows.map((row) => {
        const normalized = Object.fromEntries(
          Object.entries(row).filter(([key]) => !legacyUnsupportedSourceColumns.has(key)),
        );
        const sourceType = normalized.source_type;
        if (typeof sourceType === "string" && sourceType in legacySourceTypeFallbacks) {
          normalized.source_type = legacySourceTypeFallbacks[sourceType];
        }
        return normalized;
      });
      const { data: legacyData, error: legacyError } = await client
        .from(table)
        .upsert(legacyRows, { onConflict: "id" })
        .select("id");

      if (!legacyError) {
        console.log(
          `[seed] ${table}: upserted ${legacyData?.length ?? legacyRows.length} rows using legacy-schema compatibility mode`,
        );
        return;
      }
    }

    if (
      optionalCompatibilityTables.has(table) &&
      (error.code === "PGRST204" || error.code === "PGRST205" || error.code === "42P01")
    ) {
      console.warn(
        `[seed] ${table}: skipped because the remote Supabase schema does not yet include this governance table. Apply migrations 003 and 004 to persist it.`,
      );
      return;
    }

    if (
      optionalMigration006Tables.has(table) &&
      (error.code === "PGRST204" || error.code === "PGRST205" || error.code === "42P01")
    ) {
      console.warn(
        `[seed] ${table}: skipped because the remote Supabase schema does not yet include this table. Apply src/db/migrations/006_country_intelligence.sql in the Supabase SQL editor and re-run to persist.`,
      );
      return;
    }

    const remediation =
      error.code === "42501"
        ? " Apply src/db/migrations/002_supabase_access_policies.sql in the Supabase SQL editor, or re-run the latest grants/policies migration before seeding."
        : error.code === "PGRST204"
          ? " Supabase is missing schema fields expected by the current app version. Apply src/db/migrations/003_foundation_hardening.sql and src/db/migrations/004_operational_jobs_and_news.sql before seeding again."
        : "";
    throw new Error(
      [
        `Failed seeding ${table}`,
        `message=${error.message ?? "unknown"}`,
        `details=${error.details ?? "none"}`,
        `hint=${error.hint ?? "none"}`,
        `code=${error.code ?? "none"}`,
        `remediation=${remediation || "none"}`,
      ].join(" | "),
    );
  }

  console.log(`[seed] ${table}: upserted ${data?.length ?? rows.length} rows`);
}

async function main() {
  const { assertSupabaseConfigured, getRepositoryMode } = await import(
    "../src/db/repository"
  );
  const { getSupabaseAdminClient } = await import("../src/lib/supabase");
  const { buildSeedDataset } = await import("../src/db/seed/seed-profiles");
  const {
    countryIntelligenceToInsert,
    countryIntelligenceSourceToInsert,
    dataQualityFindingToInsert,
    newsItemToInsert,
    processingLogToInsert,
    rawItemToInsert,
    reviewEventToInsert,
    scanLogToInsert,
    scanJobToInsert,
    sourceToInsert,
    sourceHealthCheckToInsert,
    sourceReferenceToInsert,
    updateToInsert,
    verificationAttemptToInsert,
  } = await import("../src/db/supabase-mappers");
  const { env } = await import("../src/lib/env");

  assertSupabaseConfigured();
  const client = getSupabaseAdminClient();

  if (!client) {
    throw new Error("Supabase admin client could not be created.");
  }

  const profile =
    process.env.SEED_PROFILE === "demo" ? "demo" : "production_safe";
  const dataset = buildSeedDataset(profile);
  const rawPrimary = dataset.rawItems.filter((item) => !item.duplicateOf);
  const rawDuplicates = dataset.rawItems.filter((item) => item.duplicateOf);

  console.log("[seed] starting Supabase seed");
  console.log(`[seed] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(`[seed] profile=${profile}`);
  console.log(`[seed] supabase-host=${getHostOnly(env.NEXT_PUBLIC_SUPABASE_URL)}`);
  console.log(
    `[seed] anon-key=${describeKey(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)} service-key=${describeKey(env.SUPABASE_SERVICE_ROLE_KEY)}`,
  );

  await upsertAndLog(
    client,
    "regulation_sources",
    dataset.sources.map(sourceToInsert),
  );
  await upsertAndLog(
    client,
    "raw_regulatory_items",
    rawPrimary.map(rawItemToInsert),
  );
  await upsertAndLog(
    client,
    "raw_regulatory_items",
    rawDuplicates.map(rawItemToInsert),
  );
  await upsertAndLog(
    client,
    "ai_regulatory_updates",
    dataset.updates.map(updateToInsert),
  );
  await upsertAndLog(
    client,
    "regulation_scan_logs",
    dataset.scanLogs.map(scanLogToInsert),
  );
  await upsertAndLog(
    client,
    "ai_processing_logs",
    dataset.processingLogs.map(processingLogToInsert),
  );
  await upsertAndLog(
    client,
    "source_references",
    dataset.sourceReferences.map(sourceReferenceToInsert),
  );
  await upsertAndLog(
    client,
    "verification_attempts",
    dataset.verificationAttempts.map(verificationAttemptToInsert),
  );
  await upsertAndLog(
    client,
    "review_events",
    dataset.reviewEvents.map(reviewEventToInsert),
  );
  await upsertAndLog(
    client,
    "data_quality_findings",
    dataset.dataQualityFindings.map(dataQualityFindingToInsert),
  );
  await upsertAndLog(
    client,
    "scan_jobs",
    dataset.scanJobs.map(scanJobToInsert),
  );
  await upsertAndLog(
    client,
    "news_items",
    dataset.newsItems.map(newsItemToInsert),
  );
  await upsertAndLog(
    client,
    "source_health_checks",
    dataset.sourceHealthChecks.map(sourceHealthCheckToInsert),
  );
  await upsertAndLog(
    client,
    "country_intelligence",
    dataset.countryIntelligence.map(countryIntelligenceToInsert),
  );
  await upsertAndLog(
    client,
    "country_intelligence_sources",
    dataset.countryIntelligenceSources.map(countryIntelligenceSourceToInsert),
  );

  console.log("[seed] Supabase seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
