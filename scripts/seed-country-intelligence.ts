/**
 * Dedicated seed script for country_intelligence and country_intelligence_sources tables.
 *
 * Prerequisites:
 *   1. src/db/migrations/006_country_intelligence.sql applied in Supabase SQL editor.
 *   2. .env.local with valid NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *      SUPABASE_SERVICE_ROLE_KEY, and APP_DATA_MODE=supabase.
 *
 * Usage:
 *   npm run seed:country-intelligence
 */
import { loadScriptEnv } from "../src/lib/load-script-env";

loadScriptEnv();

async function main() {
  const { assertSupabaseConfigured, getRepositoryMode } = await import(
    "../src/db/repository"
  );
  const { getSupabaseAdminClient } = await import("../src/lib/supabase");
  const { buildSeedDataset } = await import("../src/db/seed/seed-profiles");
  const {
    countryIntelligenceToInsert,
    countryIntelligenceSourceToInsert,
  } = await import("../src/db/supabase-mappers");
  const { env } = await import("../src/lib/env");

  assertSupabaseConfigured();
  const client = getSupabaseAdminClient();

  if (!client) {
    throw new Error("Supabase admin client could not be created.");
  }

  const dataset = buildSeedDataset("production_safe");

  const intelligenceRows = dataset.countryIntelligence.map(countryIntelligenceToInsert);
  const sourceRows = dataset.countryIntelligenceSources.map(countryIntelligenceSourceToInsert);

  console.log("[seed:country-intelligence] starting");
  console.log(`[seed:country-intelligence] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(`[seed:country-intelligence] supabase-url=${env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)"}`);
  console.log(`[seed:country-intelligence] country_intelligence rows=${intelligenceRows.length}`);
  console.log(`[seed:country-intelligence] country_intelligence_sources rows=${sourceRows.length}`);

  // Upsert master records first (sources reference country_id via FK)
  const { data: ciData, error: ciError } = await client
    .from("country_intelligence")
    .upsert(intelligenceRows, { onConflict: "id" })
    .select("id");

  if (ciError) {
    if (ciError.code === "42P01" || ciError.code === "PGRST204" || ciError.code === "PGRST205") {
      throw new Error(
        "[seed:country-intelligence] table 'country_intelligence' does not exist on this Supabase project. " +
        "Apply src/db/migrations/006_country_intelligence.sql in the Supabase SQL editor, then re-run.",
      );
    }
    throw new Error(
      `[seed:country-intelligence] failed upserting country_intelligence: ` +
      `message=${ciError.message} code=${ciError.code ?? "none"} details=${ciError.details ?? "none"}`,
    );
  }

  console.log(
    `[seed:country-intelligence] country_intelligence: upserted ${ciData?.length ?? intelligenceRows.length} rows`,
  );

  // Upsert source references
  const { data: csData, error: csError } = await client
    .from("country_intelligence_sources")
    .upsert(sourceRows, { onConflict: "id" })
    .select("id");

  if (csError) {
    if (csError.code === "42P01" || csError.code === "PGRST204" || csError.code === "PGRST205") {
      throw new Error(
        "[seed:country-intelligence] table 'country_intelligence_sources' does not exist. " +
        "Apply src/db/migrations/006_country_intelligence.sql and re-run.",
      );
    }
    throw new Error(
      `[seed:country-intelligence] failed upserting country_intelligence_sources: ` +
      `message=${csError.message} code=${csError.code ?? "none"} details=${csError.details ?? "none"}`,
    );
  }

  console.log(
    `[seed:country-intelligence] country_intelligence_sources: upserted ${csData?.length ?? sourceRows.length} rows`,
  );

  console.log("[seed:country-intelligence] completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
