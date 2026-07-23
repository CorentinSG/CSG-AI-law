import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  newYorkAiLawDepthEntries,
  type NewYorkAiLawDepthEntry,
} from "@/content/ai-regulation/new-york-ai-law-depth";
import {
  findExistingNewYorkUpdate,
  isCorrectedNewYorkEntry,
  listChangedUpdateFields,
} from "@/content/ai-regulation/new-york-ai-law-depth-reconciliation";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";
import type {
  EditableRegulatoryUpdateFields,
  RawRegulatoryItemInput,
  RegulatoryUpdateDraftInput,
} from "@/db/repository-types";
import { env } from "@/lib/env";

const SOURCE_ID = "new-york-ai-law-depth";
const SOURCE_NAME = "New York AI Law Watch";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/united-states/new-york";
const DETECTED_AT = "2026-07-19T04:20:00.000Z";
const BACKFILL_TAG = "new-york-ai-law-watch";
const LIVE_SOURCE_IDS = [
  "src-us-ny-courts-ai-decisions",
  "src-us-ny-courtlistener-ai",
  "src-us-nyc-dcwp-aedt",
  "src-us-nyc-rules-aedt",
  "src-us-nyc-oti-ai",
  "src-us-ny-legislature-ai",
  "src-us-ny-raise-act",
  "src-nycourts-part-161-ai",
  "src-nydfs-ai",
  "src-nyag-ai",
] as const;

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

function rawIdentity(entry: NewYorkAiLawDepthEntry) {
  return `${BACKFILL_TAG}:${slugify(entry.title)}:${stableHash(entry.sourceUrl).slice(0, 12)}:v1`;
}

function buildRawItem(entry: NewYorkAiLawDepthEntry): RawRegulatoryItemInput {
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
      baselineKind: "new_york_ai_law_depth",
      jurisdiction: "New York",
      country: "United States",
      sourceReferences: [entry.sourceReference],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      watchSystem: {
        name: "New York AI Law Watch",
        sourceFamilies: [
          "ny_courts_rules_and_decisions",
          "ny_federal_privilege_work_product",
          "nyc_aedt_dcwp",
          "ny_agencies_and_legislation",
        ],
        liveTags: entry.tags,
      },
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "new_york_ai_law_depth_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "new_york_ai_law_depth_backfill",
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

function buildUpdate(entry: NewYorkAiLawDepthEntry, rawItemId: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: entry.title,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    jurisdiction: "New York",
    region: "North America",
    country: "United States",
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
      "New York attorneys and litigants",
      "Employers and employment agencies using AEDTs in New York City",
      "New York regulated financial institutions and insurers",
      "AI vendors serving New York public or regulated-sector customers",
      "Public agencies and court technology teams",
    ],
    keyObligations: [
      "Use official or authoritative sources before treating an item as legal authority.",
      "Track Part 161, NY Courts AI policy, NY Slip Op decisions, CourtListener New York federal dockets, DCWP AEDT rules, NYDFS guidance, NY AG materials and NY legislative proposals.",
      "Separate discovery leads from verified authority, especially for privilege and work-product commentary.",
    ],
    complianceDeadlines:
      entry.tags.includes("part-161")
        ? ["Part 161 effective June 1, 2026"]
        : entry.tags.includes("local-law-144")
          ? ["DCWP AEDT rule effective May 6, 2023; enforcement began July 5, 2023"]
          : [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because this is binding law, court rule, or court decision in the New York AI-law watch corpus."
        : entry.authorityType === "Proposed law"
          ? "Medium relevance because this is proposed New York law that may create future obligations."
          : "Medium relevance because this is authoritative New York guidance or policy shaping compliance expectations.",
    importanceLevel:
      entry.tags.includes("work-product") ||
      entry.tags.includes("local-law-144") ||
      entry.tags.includes("part-161") ||
      entry.authorityType === "Binding law"
        ? "high"
        : "medium",
    confidenceLevel: "high",
    tags: [
      ...entry.tags,
      "jurisdiction:New York",
      "country:United States",
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

function buildEditableUpdatePatch(
  entry: NewYorkAiLawDepthEntry,
  rawItemId: string,
): EditableRegulatoryUpdateFields {
  const draft = buildUpdate(entry, rawItemId);
  return {
    title: draft.title,
    sourceName: draft.sourceName,
    sourceUrl: draft.sourceUrl,
    jurisdiction: draft.jurisdiction,
    region: draft.region,
    country: draft.country,
    publicationDate: draft.publicationDate,
    oneSentenceSummary: draft.oneSentenceSummary,
    summary: draft.summary,
    whatHappened: draft.whatHappened,
    whyItMatters: draft.whyItMatters,
    practicalImpact: draft.practicalImpact,
    affectedParties: draft.affectedParties,
    keyObligations: draft.keyObligations,
    complianceDeadlines: draft.complianceDeadlines,
    enforcementRisk: draft.enforcementRisk,
    importanceLevel: draft.importanceLevel,
    confidenceLevel: draft.confidenceLevel,
    tags: draft.tags,
    developmentType: draft.developmentType,
    legalArea: draft.legalArea,
    authorityType: draft.authorityType,
  };
}

async function ensureSource() {
  const existing = await updateRepository.getSource(SOURCE_ID);
  if (existing) return existing;
  return updateRepository.addSource({
    id: SOURCE_ID,
    name: SOURCE_NAME,
    jurisdiction: "New York",
    region: "North America",
    country: "United States",
    sourceUrl: SOURCE_URL,
    sourceType: "static_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes:
      "Verified New York AI-law corpus covering NY Courts, SDNY work-product/privilege, NYC AEDT law, NYDFS guidance and state AI bills. Complements live source descriptors.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: { sourceCategory: "official", corpus: BACKFILL_TAG },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: SOURCE_URL,
  });
}

async function ensureLiveSources() {
  for (const sourceId of LIVE_SOURCE_IDS) {
    const existing = await updateRepository.getSource(sourceId);
    if (existing) continue;

    const seed = regulationSourcesSeed.find((source) => source.id === sourceId);
    if (!seed) {
      throw new Error(`New York live source seed is missing for ${sourceId}`);
    }

    await updateRepository.addSource({
      id: seed.id,
      name: seed.name,
      jurisdiction: seed.jurisdiction,
      region: seed.region,
      country: seed.country,
      sourceUrl: seed.sourceUrl,
      sourceType: seed.sourceType,
      scanFrequency: seed.scanFrequency,
      active: seed.active,
      lastScannedAt: seed.lastScannedAt,
      notes: seed.notes,
      reliabilityLevel: seed.reliabilityLevel,
      preferredExtractionMethod: seed.preferredExtractionMethod,
      config: seed.config,
      ingestionMethod: seed.ingestionMethod,
      sourceCategory: seed.sourceCategory,
      scraplingConfig: seed.scraplingConfig,
      crawlRootUrl: seed.crawlRootUrl,
    });
  }
}

async function main() {
  const dryRun = boolEnv(process.env.NEW_YORK_AI_LAW_DEPTH_DRY_RUN, true);
  const existingOnly = boolEnv(
    process.env.NEW_YORK_AI_LAW_DEPTH_EXISTING_ONLY,
    false,
  );
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(60000);
  const existingUpdates = await updateRepository.listUpdates({ tag: BACKFILL_TAG });
  const existingUpdateByEntryTitle = new Map(
    newYorkAiLawDepthEntries.map((entry) => [
      entry.title,
      findExistingNewYorkUpdate(entry, existingUpdates),
    ]),
  );
  const missingEntryTitles = newYorkAiLawDepthEntries
    .filter((entry) => !existingUpdateByEntryTitle.get(entry.title))
    .map((entry) => entry.title);
  if (existingOnly && missingEntryTitles.length > 0) {
    throw new Error(
      `Existing-only replay found ${missingEntryTitles.length} missing entries: ${missingEntryTitles.join("; ")}`,
    );
  }
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) {
    await ensureSource();
    await ensureLiveSources();
  }

  for (const entry of newYorkAiLawDepthEntries) {
    const rawItem = buildRawItem(entry);
    const existingUpdate = existingUpdateByEntryTitle.get(entry.title) ?? null;

    if (existingUpdate) {
      if (!isCorrectedNewYorkEntry(entry)) {
        results.push({
          title: entry.title,
          status: "skipped_existing_update",
          updateId: existingUpdate.id,
        });
        continue;
      }

      const patch = buildEditableUpdatePatch(entry, existingUpdate.rawItemId);
      const changedFields = listChangedUpdateFields(existingUpdate, patch);
      if (changedFields.length === 0) {
        results.push({
          title: entry.title,
          status: "skipped_already_current",
          updateId: existingUpdate.id,
        });
        continue;
      }

      if (dryRun) {
        results.push({
          title: entry.title,
          status: "would_update_existing",
          updateId: existingUpdate.id,
          changedFields,
        });
        continue;
      }

      // Raw items remain immutable evidence of the original backfill. The
      // corrected derived record can be retried independently without
      // rewriting provenance or source-reference audit identifiers.
      const corrected = await updateRepository.saveUpdateEdits(
        existingUpdate.id,
        patch,
      );
      results.push({
        title: entry.title,
        status: "updated_existing",
        updateId: corrected.id,
        changedFields,
      });
      continue;
    }

    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

    if (dryRun) {
      results.push({
        title: entry.title,
        status: "would_create_or_link",
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
        existingOnly,
        appDataMode: env.APP_DATA_MODE,
        jurisdiction: "New York",
        entryCount: newYorkAiLawDepthEntries.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(`[backfill-new-york-ai-law-depth] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
