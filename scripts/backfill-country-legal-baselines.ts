import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { EuropeCountryProfile } from "@/content/ai-regulation/europe-member-state-implementation";
import { getEuropeCountryProfiles } from "@/content/ai-regulation/europe-member-state-implementation";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import { env } from "@/lib/env";

const BASELINE_SOURCE_ID = "country-legal-baseline";
const BASELINE_SOURCE_NAME = "Country legal baseline curator";
const BASELINE_SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe";
const BASELINE_DETECTED_AT = "2026-07-15T00:00:00.000Z";

function parseList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function baselineId(profile: EuropeCountryProfile) {
  return `country-baseline:${profile.slug}:ai-act-monitoring-anchors:v1`;
}

function baselineUrl(profile: EuropeCountryProfile) {
  return `${BASELINE_SOURCE_URL}/${profile.slug}`;
}

function sourceReferencesForDatabase(profile: EuropeCountryProfile) {
  const allowedLegacyTypes = new Set([
    "official",
    "court",
    "regulator",
    "standards_body",
    "discovery_source",
    "media_source",
    "tracker",
  ]);
  return profile.sourceReferences.map((reference) => ({
    ...reference,
    sourceType: allowedLegacyTypes.has(reference.sourceType)
      ? reference.sourceType
      : "official",
  }));
}

function hasUsefulProfile(profile: EuropeCountryProfile) {
  return (
    profile.citationQualityStatus !== "missing_official_source" &&
    profile.nationalAIRegulationSources.length > 0
  );
}

function buildRawText(profile: EuropeCountryProfile) {
  const sourceLines = profile.nationalAIRegulationSources
    .map((source) => `- ${source.label} (${source.institution}): ${source.url}`)
    .join("\n");
  return [
    profile.aiActImplementationNotes,
    "",
    "Verified official monitoring anchors:",
    sourceLines,
    "",
    "Current caveats:",
    ...profile.missingSourceWarnings.map((warning) => `- ${warning}`),
  ].join("\n");
}

function buildRawItem(profile: EuropeCountryProfile): RawRegulatoryItemInput {
  const id = baselineId(profile);
  const rawUrl = baselineUrl(profile);
  const rawText = buildRawText(profile);
  return {
    sourceId: BASELINE_SOURCE_ID,
    rawTitle: `${profile.countryName} AI Act implementation baseline`,
    rawUrl,
    rawText,
    rawMetadata: {
      baselineKind: "country_legal_database",
      countrySlug: profile.slug,
      countryCode: profile.countryCode,
      citationQualityStatus: profile.citationQualityStatus,
      sourceVerificationStatus: profile.sourceVerificationStatus,
      sourceReferences: sourceReferencesForDatabase(profile),
      officialSourceUrls: profile.officialSourceUrls,
      publicationPolicy: "admin_review_required",
      traceability: {
        sourceId: BASELINE_SOURCE_ID,
        sourceName: BASELINE_SOURCE_NAME,
        sourceUrl: BASELINE_SOURCE_URL,
        officialSource: true,
        parserUsed: "country_profile_baseline_backfill",
        scanTimestamp: BASELINE_DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "country_legal_database_backfill",
        contentHash: stableHash(`${id}:${rawText}`),
        rawUrlScanned: rawUrl,
      },
    },
    detectedAt: BASELINE_DETECTED_AT,
    hash: stableHash(id),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(profile: EuropeCountryProfile, rawItemId: string): RegulatoryUpdateDraftInput {
  const officialSources = profile.nationalAIRegulationSources
    .map((source) => source.institution)
    .filter(Boolean);
  return {
    sourceId: BASELINE_SOURCE_ID,
    rawItemId,
    title: `${profile.countryName} AI Act implementation monitoring baseline`,
    sourceName: BASELINE_SOURCE_NAME,
    sourceUrl: baselineUrl(profile),
    jurisdiction: profile.countryName as RegulatoryUpdateDraftInput["jurisdiction"],
    region: "Europe",
    country: profile.countryName,
    developmentType: "Other official regulatory development",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    publicationDate: profile.lastReviewedDate,
    detectedDate: BASELINE_DETECTED_AT,
    oneSentenceSummary:
      `${profile.countryName} has verified official monitoring anchors for AI governance, but final AI Act authority designations remain under review.`,
    summary:
      `${profile.countryName} is tracked in the legal database with official national sources attached. The profile records verified monitoring anchors and preserves caveats where final AI Act implementation instruments, competent authority designations, market-surveillance authorities, notifying authorities, or national AI case-law have not yet been verified.`,
    whatHappened:
      `The country profile was upgraded from a placeholder baseline to an official-source monitoring baseline using ${officialSources.join(", ") || "official national sources"}.`,
    whyItMatters:
      "This creates a structured legal-database entry that separates verified official-source monitoring from unverified final designation claims.",
    practicalImpact:
      "The country can now be reviewed through the admin legal database with traceable official sources while remaining conservative on unresolved AI Act implementation details.",
    affectedParties: [
      "AI providers and deployers monitoring EU AI Act implementation",
      "Legal and compliance teams",
      "Public-sector AI governance teams",
    ],
    keyObligations: [
      "Monitor official national sources for AI Act implementation measures.",
      "Do not treat data-protection authority presence as final AI Act competent-authority designation without a designation instrument.",
      "Review market-surveillance, notifying-authority, and case-law layers before publication as a complete country baseline.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      "Medium monitoring relevance; final enforcement risk depends on future national AI Act designation and implementation instruments.",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    tags: [
      "country-baseline",
      "ai-act",
      "official-source",
      profile.slug,
      `citation:${profile.citationQualityStatus}`,
      ...profile.missingSourceWarnings.map((warning) =>
        warning.toLowerCase().includes("case-law")
          ? "case-law-gap"
          : warning.toLowerCase().includes("competent")
            ? "authority-designation-gap"
            : warning.toLowerCase().includes("market")
              ? "market-surveillance-gap"
              : "implementation-gap",
      ),
    ],
    status: "needs_review",
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
  };
}

async function ensureBaselineSource() {
  const existing = await updateRepository.getSource(BASELINE_SOURCE_ID);
  if (existing) return existing;
  return updateRepository.addSource({
    id: BASELINE_SOURCE_ID,
    name: BASELINE_SOURCE_NAME,
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: BASELINE_SOURCE_URL,
    sourceType: "static_page",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes:
      "Synthetic curator source for reviewed country legal baseline entries generated from country_intelligence official-source profiles.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: {
      sourceCategory: "official",
      baselineKind: "country_legal_database",
    },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: BASELINE_SOURCE_URL,
  });
}

async function main() {
  const dryRun = boolEnv(process.env.COUNTRY_LEGAL_BASELINE_DRY_RUN, true);
  const requested = parseList(process.env.COUNTRY_LEGAL_BASELINE_COUNTRIES);
  const profiles = getEuropeCountryProfiles()
    .filter(hasUsefulProfile)
    .filter((profile) =>
      requested.size > 0
        ? requested.has(profile.slug) || requested.has(profile.countryName.toLowerCase())
        : true,
    );

  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(5000);
  const existingHashes = new Set(existingRawItems.map((item) => item.hash));
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(
    existingUpdates.map((update) => [update.rawItemId, update]),
  );

  const results = [];
  if (!dryRun && profiles.length > 0) {
    await ensureBaselineSource();
  }

  for (const profile of profiles) {
    const rawItem = buildRawItem(profile);
    const update = buildUpdate(profile, rawItem.hash);
    if (dryRun) {
      results.push({
        country: profile.countryName,
        status: "dry_run",
        rawHash: rawItem.hash,
        title: update.title,
        citationQualityStatus: profile.citationQualityStatus,
      });
      continue;
    }
    const existingRawItem = existingRawItems.find((item) => item.hash === rawItem.hash);
    if (existingRawItem) {
      await updateRepository.updateRawItemMetadata(
        existingRawItem.id,
        rawItem.rawMetadata,
      );
      const existingUpdate = updateByRawItemId.get(existingRawItem.id);
      if (!existingUpdate) {
        const createdUpdate = await updateRepository.createUpdate(
          buildUpdate(profile, existingRawItem.id),
        );
        updateByRawItemId.set(existingRawItem.id, createdUpdate);
        results.push({
          country: profile.countryName,
          status: "created_update_for_existing_raw_item",
          rawItemId: existingRawItem.id,
          updateId: createdUpdate.id,
          updateStatus: createdUpdate.status,
        });
        continue;
      }
      results.push({
        country: profile.countryName,
        status: "skipped_existing_update",
        rawHash: rawItem.hash,
        rawItemId: existingRawItem.id,
        updateId: existingUpdate.id,
      });
      continue;
    }
    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(
      buildUpdate(profile, createdRaw.id),
    );
    existingHashes.add(rawItem.hash);
    results.push({
      country: profile.countryName,
      status: "created",
      rawItemId: createdRaw.id,
      updateId: createdUpdate.id,
      updateStatus: createdUpdate.status,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun,
        appDataMode: env.APP_DATA_MODE,
        selectedCountries: profiles.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-country-legal-baselines] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
