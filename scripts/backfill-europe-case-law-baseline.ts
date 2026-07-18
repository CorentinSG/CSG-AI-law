import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "europe-case-law-baseline";
const SOURCE_NAME = "Europe AI case-law baseline";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe/case-law";
const DETECTED_AT = "2026-07-18T01:30:00.000Z";
const BACKFILL_TAG = "europe-case-law-baseline";

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function normalizeAuthorityType(value: string): AuthorityType {
  if (value === "case_law") return "Binding law";
  if (value === "administrative_decision") return "Enforcement action";
  if (value === "enforcement_action") return "Enforcement action";
  return "Other";
}

function normalizeDevelopmentType(value: string): DevelopmentType {
  if (value === "case_law") return "Other official regulatory development";
  if (value === "administrative_decision") return "Enforcement action";
  if (value === "enforcement_action") return "Enforcement action";
  return "Other official regulatory development";
}

function normalizeLegalArea(value: string): LegalArea {
  const lower = value.toLowerCase();
  if (
    lower.includes("employment") ||
    lower.includes("workplace") ||
    lower.includes("worker") ||
    lower.includes("labour") ||
    lower.includes("labor") ||
    lower.includes("social law") ||
    lower.includes("platform work") ||
    lower.includes("algorithmic management")
  ) {
    return "Labor and social law";
  }
  if (lower.includes("health")) return "Healthcare";
  if (lower.includes("education")) return "Education";
  if (lower.includes("biometric") || lower.includes("facial")) {
    return "Biometric identification";
  }
  if (lower.includes("automated") || lower.includes("profiling") || lower.includes("scoring")) {
    return "Automated decision-making";
  }
  if (lower.includes("public-sector") || lower.includes("public sector")) {
    return "Public sector use of AI";
  }
  if (lower.includes("data protection") || lower.includes("privacy")) {
    return "Data protection";
  }
  if (lower.includes("access to justice")) return "Access to justice";
  return "AI governance";
}

function jurisdictionFor(entry: (typeof europeAiCaseLawEntries)[number]): Jurisdiction {
  const jurisdiction = entry.country ?? entry.jurisdiction;
  if (jurisdiction === "European Union") return "European Union";
  return jurisdiction as Jurisdiction;
}

function sourceTypeTags(references: SourceReference[]) {
  return Array.from(
    new Set(references.map((reference) => `source-type:${reference.sourceType}`)),
  );
}

function rawIdentity(entry: (typeof europeAiCaseLawEntries)[number]) {
  return `${BACKFILL_TAG}:${entry.id}:v1`;
}

function buildRawItem(entry: (typeof europeAiCaseLawEntries)[number]): RawRegulatoryItemInput {
  const references = entry.sourceReferences;
  const rawText = [
    entry.shortSummary,
    "",
    entry.legalIssue,
    "",
    entry.outcomeOrHolding ?? "",
  ].join("\n");

  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.officialSourceUrl ?? references[0]?.url ?? SOURCE_URL,
    rawText,
    rawMetadata: {
      baselineKind: "europe_case_law_baseline",
      sourceReferences: references,
      officialSourceUrls: references.map((reference) => reference.url),
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "europe_case_law_baseline_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "europe_case_law_baseline_backfill",
        contentHash: stableHash(`${rawIdentity(entry)}:${rawText}`),
        rawUrlScanned: entry.officialSourceUrl ?? references[0]?.url ?? SOURCE_URL,
      },
    },
    detectedAt: DETECTED_AT,
    hash: stableHash(rawIdentity(entry)),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(
  entry: (typeof europeAiCaseLawEntries)[number],
  rawItemId: string,
): RegulatoryUpdateDraftInput {
  const jurisdiction = jurisdictionFor(entry);
  const authorityType = normalizeAuthorityType(entry.authorityType);
  const developmentType = normalizeDevelopmentType(entry.authorityType);
  const legalArea = normalizeLegalArea(entry.legalArea);
  const references = entry.sourceReferences;
  const caseIdentifiers = [
    entry.docketOrCaseNumber ? `case:${entry.docketOrCaseNumber}` : null,
    entry.ecli ? `ecli:${entry.ecli}` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: entry.title,
    sourceName: entry.courtOrAuthority,
    sourceUrl: entry.officialSourceUrl ?? references[0]?.url ?? SOURCE_URL,
    jurisdiction,
    region: "Europe",
    country: entry.country ?? jurisdiction,
    developmentType,
    legalArea,
    authorityType,
    publicationDate: entry.date,
    detectedDate: DETECTED_AT,
    oneSentenceSummary: entry.shortSummary.slice(0, 240),
    summary: entry.shortSummary,
    whatHappened: entry.legalIssue,
    whyItMatters:
      "This official judicial, regulator, or administrative decision adds precedential depth to the AI legal database beyond high-level policy monitoring.",
    practicalImpact:
      entry.outcomeOrHolding ??
      "Legal and compliance teams should read the official source before relying on the holding or administrative outcome.",
    affectedParties: [
      "AI providers and deployers",
      "Legal and compliance teams",
      "Public authorities",
      "Data protection officers",
    ],
    keyObligations: [
      "Treat this as official case-law or regulator-decision material, not a media lead.",
      "Preserve docket, ECLI, decision date, jurisdiction, and official-source URL in downstream views.",
      "Map the entry to the legal-area filter so users can find case law by AI governance, data protection, employment, education, healthcare, biometric, or automated-decision domain.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      authorityType === "Enforcement action"
        ? "High relevance because the entry records an official enforcement or regulator-decision signal."
        : "High relevance because the entry records official case-law or court material with AI/algorithmic governance relevance.",
    importanceLevel: "high",
    confidenceLevel: entry.confidenceLevel === "needs_review" ? "medium" : entry.confidenceLevel,
    tags: [
      BACKFILL_TAG,
      "official-source",
      "case-law-layer",
      `authority:${authorityType}`,
      `legal-area:${legalArea}`,
      ...caseIdentifiers,
      ...sourceTypeTags(references),
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
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: SOURCE_URL,
    sourceType: "court_database",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes:
      "Curated official European case-law and administrative-decision baseline. Entries must keep official source references and case identifiers where available.",
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
  const dryRun = boolEnv(process.env.EUROPE_CASE_LAW_BASELINE_DRY_RUN, true);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(50000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) await ensureSource();

  for (const entry of europeAiCaseLawEntries) {
    const rawItem = buildRawItem(entry);
    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

    if (dryRun) {
      results.push({
        id: entry.id,
        country: entry.country ?? entry.jurisdiction,
        status: "dry_run",
        legalArea: normalizeLegalArea(entry.legalArea),
        authorityType: normalizeAuthorityType(entry.authorityType),
      });
      continue;
    }

    if (existingRaw) {
      await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRaw.id);
      if (existingUpdate) {
        results.push({ id: entry.id, status: "skipped_existing_update", updateId: existingUpdate.id });
        continue;
      }
      const created = await updateRepository.createUpdate(buildUpdate(entry, existingRaw.id));
      results.push({ id: entry.id, status: "created_update_for_existing_raw_item", updateId: created.id });
      continue;
    }

    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(entry, createdRaw.id));
    existingRawItems.push(createdRaw);
    updateByRawItemId.set(createdRaw.id, createdUpdate);
    results.push({
      id: entry.id,
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
        entryCount: europeAiCaseLawEntries.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-europe-case-law-baseline] failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
