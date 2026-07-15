import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runAiRegulationScan } from "@/agents/ai-regulation/processors/pipeline";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { getCountryDatabaseReadiness } from "@/lib/country-database-readiness";
import { env } from "@/lib/env";

const OFFICIAL_SOURCE_CATEGORIES = new Set(["official", "regulator", "court", "parliament"]);

function parseList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function profileForSource(source: RegulationSource): ScanProfileId {
  if (source.sourceCategory === "media") return "live_news_discovery_scan";
  return "official_baseline_scan";
}

function sourcePriority(source: RegulationSource) {
  if (source.sourceCategory === "regulator") return 0;
  if (source.sourceCategory === "official") return 1;
  if (source.sourceCategory === "court") return 2;
  if (source.sourceCategory === "parliament") return 3;
  if (source.sourceCategory === "media") return 4;
  return 5;
}

function shouldSelectSource(source: RegulationSource, includeMedia: boolean) {
  if (!source.active) return false;
  if (OFFICIAL_SOURCE_CATEGORIES.has(source.sourceCategory ?? "")) return true;
  return includeMedia && source.sourceCategory === "media";
}

async function main() {
  const dryRun = boolEnv(process.env.COUNTRY_BACKFILL_DRY_RUN, true);
  const includeMedia = boolEnv(process.env.COUNTRY_BACKFILL_INCLUDE_MEDIA, false);
  const maxSources = parsePositiveInt(process.env.COUNTRY_BACKFILL_MAX_SOURCES, 20);
  const delayMs = parsePositiveInt(process.env.COUNTRY_BACKFILL_DELAY_MS, includeMedia ? 5000 : 750);
  const requestedCountries = parseList(process.env.COUNTRY_BACKFILL_COUNTRIES);
  const onlyBlocked = boolEnv(process.env.COUNTRY_BACKFILL_ONLY_BLOCKED, false);

  const [readiness, sources] = await Promise.all([
    getCountryDatabaseReadiness(),
    updateRepository.getSources(),
  ]);
  const sourcesByCountry = new Map<string, RegulationSource[]>();
  for (const source of sources) {
    const country = source.country || source.jurisdiction || source.region || "Unknown";
    const list = sourcesByCountry.get(country) ?? [];
    list.push(source);
    sourcesByCountry.set(country, list);
  }

  const targetCountries = readiness.countries
    .filter((country) =>
      requestedCountries.size > 0 ? requestedCountries.has(country.country) : country.status !== "ready",
    )
    .filter((country) => !onlyBlocked || country.status === "blocked")
    .sort((a, b) => a.score - b.score || a.country.localeCompare(b.country));

  const candidates = targetCountries.flatMap((country) =>
    (sourcesByCountry.get(country.country) ?? [])
      .filter((source) => shouldSelectSource(source, includeMedia))
      .sort((a, b) => sourcePriority(a) - sourcePriority(b) || a.id.localeCompare(b.id))
      .slice(0, includeMedia ? 4 : 2)
      .map((source) => ({
        country: country.country,
        countryStatus: country.status,
        countryScore: country.score,
        source,
      })),
  ).slice(0, maxSources);

  const results = [];
  for (const candidate of candidates) {
    const profile = profileForSource(candidate.source);
    if (dryRun) {
      results.push({
        country: candidate.country,
        countryStatus: candidate.countryStatus,
        countryScore: candidate.countryScore,
        sourceId: candidate.source.id,
        profile,
        status: "dry_run",
      });
      continue;
    }

    const output = await runAiRegulationScan(candidate.source.id, {
      trigger: "manual",
      scanProfile: profile,
    });
    results.push({
      country: candidate.country,
      countryStatus: candidate.countryStatus,
      countryScore: candidate.countryScore,
      sourceId: candidate.source.id,
      profile,
      status: "executed",
      summary: output.map((entry) => ({
        status: entry.status,
        itemsFound: entry.itemsFound,
        newItemsDetected: entry.newItemsDetected,
        processingFailures: entry.processingFailures,
        zeroResultsReason: entry.zeroResultsReason,
        warnings: entry.warnings.slice(0, 3),
        errors: entry.errors.slice(0, 3),
      })),
    });
    await sleep(delayMs);
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun,
        aiEnabled: env.AI_ENABLE_PROCESSING,
        includeMedia,
        delayMs,
        selectedCountries: targetCountries.length,
        selectedSources: candidates.length,
        readinessSummary: readiness.summary,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(`[backfill-country-baselines] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
