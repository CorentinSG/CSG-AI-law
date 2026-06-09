/**
 * Seed script: register initial ingestion sources in the database.
 *
 * Run: npm run seed:ingestion-sources
 *
 * Requires APP_DATA_MODE=supabase and valid Supabase env vars.
 * Uses upsert semantics — safe to re-run.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { getAiRegulationRepository } from "@/db/repository";
import { INGESTION_SEED_SOURCES } from "@/agents/ingestion/seedSources";

async function seedIngestionSources() {
  const repo = getAiRegulationRepository();
  let created = 0;
  let updated = 0;

  for (const seed of INGESTION_SEED_SOURCES) {
    const existing = await repo.getSourceById(seed.id);

    if (existing) {
      // Update the ingestion-specific fields without touching monitoring config
      await repo.updateSource(seed.id, {
        ingestionMethod: seed.ingestion_method,
        sourceCategory: seed.source_category,
        crawlRootUrl: seed.crawl_root_url ?? null,
      });
      updated++;
      console.log(`[seed] Updated source: ${seed.id} (${seed.name})`);
    } else {
      await repo.createSource({
        id: seed.id,
        name: seed.name,
        jurisdiction: seed.jurisdiction as Parameters<typeof repo.createSource>[0]["jurisdiction"],
        region: seed.region,
        country: seed.region,
        sourceUrl: seed.url,
        sourceType: seed.source_type as Parameters<typeof repo.createSource>[0]["sourceType"],
        scanFrequency: seed.crawl_frequency as Parameters<typeof repo.createSource>[0]["scanFrequency"],
        active: true,
        lastScannedAt: null,
        notes: seed.notes,
        reliabilityLevel: seed.reliability_level,
        preferredExtractionMethod: "html_static",
        config: {},
        ingestionMethod: seed.ingestion_method,
        sourceCategory: seed.source_category,
        crawlRootUrl: seed.crawl_root_url ?? null,
        scraplingConfig: {},
      });
      created++;
      console.log(`[seed] Created source: ${seed.id} (${seed.name})`);
    }
  }

  console.log(
    `\n✓ Ingestion sources seeded: ${created} created, ${updated} updated`
  );
}

seedIngestionSources().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
