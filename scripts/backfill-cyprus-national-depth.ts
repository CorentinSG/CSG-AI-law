import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { cyprusNationalDepthEntries } from "@/content/ai-regulation/cyprus-national-depth";
import type { CyprusNationalDepthEntry } from "@/content/ai-regulation/cyprus-national-depth";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import { env } from "@/lib/env";

const SOURCE_ID = "cyprus-national-depth";
const SOURCE_NAME = "Cyprus national legal depth";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe/cyprus";
const DETECTED_AT = "2026-07-19T03:20:00.000Z";
const BACKFILL_TAG = "cyprus-national-depth";

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function rawIdentity(entry: CyprusNationalDepthEntry) {
  return `${BACKFILL_TAG}:${slugify(entry.title)}:${stableHash(entry.sourceUrl).slice(0, 12)}:v1`;
}

function buildRawItem(entry: CyprusNationalDepthEntry): RawRegulatoryItemInput {
  const rawText = [
    entry.summary,
    "",
    entry.whatHappened,
    "",
    entry.whyItMatters,
    "",
    entry.practicalImpact,
    "",
    entry.sourceReference.excerpt ?? "",
  ].join("\n");

  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "cyprus_national_depth",
      country: "Cyprus",
      sourceReferences: [entry.sourceReference],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "cyprus_national_depth_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "cyprus_national_depth_backfill",
        contentHash: stableHash(`${rawIdentity(entry)}:${rawText}`),
        rawUrlScanned: entry.sourceUrl,
      },
    },
    detectedAt: DETECTED_AT,
    hash: stableHash(rawIdentity(entry)),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(entry: CyprusNationalDepthEntry, rawItemId: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: entry.title,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    jurisdiction: "Cyprus",
    region: "Europe",
    country: "Cyprus",
    developmentType: entry.developmentType,
    legalArea: entry.legalArea,
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedDate: DETECTED_AT,
    oneSentenceSummary: entry.summary.slice(0, 240),
    summary: entry.summary,
    whatHappened: entry.whatHappened,
    whyItMatters: entry.whyItMatters,
    practicalImpact: entry.practicalImpact,
    affectedParties: [
      "Cypriot AI providers and deployers",
      "Cypriot public authorities",
      "Data protection officers",
      "Employers and telework operators",
      "Creative-sector rights holders",
      "Cloud and data infrastructure providers",
    ],
    keyObligations: [
      "Separate official national Cypriot sources from EU baseline entries and from media-only live news.",
      "Track follow-up Cypriot AI Act authority designations, DPA guidance, Teleworking Law implementation, court decisions and regulator updates.",
      "Map each item to the legal-area, authority-type and country axes so the Cyprus page can be filtered by domain.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because this is a binding statute or legal-authority development for Cyprus."
        : entry.authorityType === "Agency guidance"
          ? "Medium relevance because this is official Cypriot regulator guidance likely to shape compliance practice."
          : "Medium relevance because this is official Cypriot policy or governance material that frames national implementation.",
    importanceLevel: entry.authorityType === "Binding law" ? "high" : "medium",
    confidenceLevel: "high",
    tags: [
      ...entry.tags,
      "country:Cyprus",
      `legal-area:${entry.legalArea}`,
      `authority:${entry.authorityType}`,
      `source-type:${entry.sourceReference.sourceType}`,
    ],
    status: "published",
    reviewedBy: "system:auto-official-source",
    reviewedAt: DETECTED_AT,
    publishedAt: DETECTED_AT,
  };
}

async function ensureSource() {
  const existing = await updateRepository.getSource(SOURCE_ID);
  if (existing) return existing;
  return updateRepository.addSource({
    id: SOURCE_ID,
    name: SOURCE_NAME,
    jurisdiction: "Cyprus",
    region: "Europe",
    country: "Cyprus",
    sourceUrl: SOURCE_URL,
    sourceType: "static_page",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes:
      "Country-by-country official-source national depth for Cyprus. Complements, but does not replace, live monitoring sources.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: { sourceCategory: "official", corpus: BACKFILL_TAG },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: SOURCE_URL,
  });
}

async function main() {
  const dryRun = boolEnv(process.env.CYPRUS_NATIONAL_DEPTH_DRY_RUN, true);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(60000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) await ensureSource();

  for (const entry of cyprusNationalDepthEntries) {
    const rawItem = buildRawItem(entry);
    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

    if (dryRun) {
      results.push({
        title: entry.title,
        status: "dry_run",
        legalArea: entry.legalArea,
        authorityType: entry.authorityType,
      });
      continue;
    }

    if (existingRaw) {
      await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRaw.id);
      if (existingUpdate) {
        results.push({ title: entry.title, status: "skipped_existing_update", updateId: existingUpdate.id });
        continue;
      }
      const created = await updateRepository.createUpdate(buildUpdate(entry, existingRaw.id));
      results.push({ title: entry.title, status: "created_update_for_existing_raw_item", updateId: created.id });
      continue;
    }

    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(entry, createdRaw.id));
    existingRawItems.push(createdRaw);
    updateByRawItemId.set(createdRaw.id, createdUpdate);
    results.push({
      title: entry.title,
      status: "created",
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
        country: "Cyprus",
        entryCount: cyprusNationalDepthEntries.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(`[backfill-cyprus-national-depth] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
