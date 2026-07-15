import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import { env } from "@/lib/env";

const BASELINE_SOURCE_ID = "country-legal-baseline";
const BASELINE_SOURCE_NAME = "Country legal baseline curator";
const BASELINE_SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe";
const BASELINE_DETECTED_AT = "2026-07-15T00:00:00.000Z";

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function parseList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function countrySlug(country: string) {
  return country.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isOfficialCountrySource(source: RegulationSource) {
  if (!source.active) return false;
  return ["official", "regulator", "court", "parliament"].includes(
    source.sourceCategory ?? "",
  );
}

function sourceReferenceFor(source: RegulationSource): SourceReference {
  const sourceType: SourceReference["sourceType"] =
    source.sourceCategory === "regulator"
      ? "regulator"
      : source.sourceCategory === "court"
        ? "court"
        : "official";
  return {
    sourceRole: source.sourceCategory === "regulator" ? "primary" : "supporting",
    title: source.name,
    institution: source.name.replace(/ AI .*/i, ""),
    url: source.sourceUrl,
    canonicalUrl: source.sourceUrl,
    sourceType,
    authorityType:
      source.sourceCategory === "regulator"
        ? "Member State regulator source"
        : "Official legal or government source",
    publicationDate: null,
    detectedAt: BASELINE_DETECTED_AT,
    retrievedAt: BASELINE_DETECTED_AT,
    lastVerifiedAt: source.lastSuccessfulScanAt ?? null,
    jurisdiction: source.jurisdiction,
    documentType: source.sourceType,
    excerpt: null,
    pinpoint: {},
    reliabilityLevel: source.reliabilityLevel,
    verificationStatus: source.lastSuccessfulScanAt ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations: source.latestAccessibilityIssue ?? null,
    notes:
      source.notes ||
      "Official monitoring source captured from regulation_sources.",
  };
}

function buildBaselineId(country: string) {
  return `monitored-country-baseline:${countrySlug(country)}:official-monitoring-anchors:v1`;
}

function buildBaselineUrl(country: string) {
  return `${BASELINE_SOURCE_URL}/non-eu/${countrySlug(country)}`;
}

function buildRawText(country: string, sources: RegulationSource[]) {
  return [
    `${country} is covered by the monitoring system through official or regulator sources relevant to AI governance, data protection, public-sector digital policy, or legal publication.`,
    "",
    "Official monitoring anchors:",
    ...sources.map((source) => `- ${source.name}: ${source.sourceUrl}`),
    "",
    "Current caveats:",
    "- This baseline does not assert that the EU AI Act directly applies as Member State law.",
    "- Country-specific AI legislation, soft-law, case-law, and enforcement actions remain under review.",
    "- This entry is a structured monitoring baseline for admin review, not a final publication-ready legal memorandum.",
  ].join("\n");
}

function buildRawItem(country: string, sources: RegulationSource[]): RawRegulatoryItemInput {
  const id = buildBaselineId(country);
  const rawText = buildRawText(country, sources);
  return {
    sourceId: BASELINE_SOURCE_ID,
    rawTitle: `${country} AI legal monitoring baseline`,
    rawUrl: buildBaselineUrl(country),
    rawText,
    rawMetadata: {
      baselineKind: "monitored_country_legal_database",
      countrySlug: countrySlug(country),
      sourceReferences: sources.map(sourceReferenceFor),
      officialSourceUrls: sources.map((source) => source.sourceUrl),
      publicationPolicy: "admin_review_required",
      traceability: {
        sourceId: BASELINE_SOURCE_ID,
        sourceName: BASELINE_SOURCE_NAME,
        sourceUrl: BASELINE_SOURCE_URL,
        officialSource: true,
        parserUsed: "monitored_country_baseline_backfill",
        scanTimestamp: BASELINE_DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "monitored_country_legal_database_backfill",
        contentHash: stableHash(`${id}:${rawText}`),
        rawUrlScanned: buildBaselineUrl(country),
      },
    },
    detectedAt: BASELINE_DETECTED_AT,
    hash: stableHash(id),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(country: string, sources: RegulationSource[], rawItemId: string): RegulatoryUpdateDraftInput {
  const sourceNames = sources.map((source) => source.name);
  return {
    sourceId: BASELINE_SOURCE_ID,
    rawItemId,
    title: `${country} AI legal monitoring baseline`,
    sourceName: BASELINE_SOURCE_NAME,
    sourceUrl: buildBaselineUrl(country),
    jurisdiction: country as RegulatoryUpdateDraftInput["jurisdiction"],
    region: "Europe",
    country,
    developmentType: "Other official regulatory development",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    publicationDate: BASELINE_DETECTED_AT,
    detectedDate: BASELINE_DETECTED_AT,
    oneSentenceSummary:
      `${country} has official monitoring anchors connected for AI-related legal and regulatory tracking.`,
    summary:
      `${country} is tracked through official or regulator sources in the monitoring system. This structured baseline creates a reviewable legal-database entry while preserving the distinction between monitoring coverage and verified country-specific AI law.`,
    whatHappened:
      `The monitored-country baseline was created from official anchors: ${sourceNames.join(", ")}.`,
    whyItMatters:
      "The legal database now has a structured entry for this monitored jurisdiction instead of relying only on raw source scans.",
    practicalImpact:
      "Admins can review the country's AI/legal monitoring coverage, identify missing legislation, soft-law, news, and case-law layers, and decide what is publication-ready.",
    affectedParties: [
      "Legal and compliance teams monitoring European AI governance",
      "AI providers and deployers operating cross-border",
      "Public-sector digital governance teams",
    ],
    keyObligations: [
      "Monitor official sources for AI-specific law, data-protection guidance, public-sector AI rules, and legal publication updates.",
      "Do not infer final country-specific AI legislation or authority designation from monitoring coverage alone.",
      "Add case-law, soft-law, and legal-news entries only when traceable to official or serious corroborated sources.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      "Monitoring relevance confirmed; enforcement risk depends on future country-specific legal developments and official decisions.",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    tags: [
      "country-baseline",
      "official-source",
      "monitored-country",
      countrySlug(country),
      "non-eu-europe",
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
      "Synthetic curator source for reviewed country legal baseline entries generated from official monitoring sources.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: { sourceCategory: "official" },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: BASELINE_SOURCE_URL,
  });
}

async function main() {
  const dryRun = boolEnv(process.env.MONITORED_COUNTRY_LEGAL_BASELINE_DRY_RUN, true);
  const requested = parseList(process.env.MONITORED_COUNTRY_LEGAL_BASELINE_COUNTRIES);
  const sources = await updateRepository.getSources();
  const grouped = new Map<string, RegulationSource[]>();
  for (const source of sources.filter(isOfficialCountrySource)) {
    const country = source.country || source.jurisdiction;
    if (!country || country === "European Union" || country === "International") continue;
    if (requested.size > 0 && !requested.has(country.toLowerCase()) && !requested.has(countrySlug(country))) {
      continue;
    }
    const group = grouped.get(country) ?? [];
    group.push(source);
    grouped.set(country, group);
  }

  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(5000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];
  if (!dryRun && grouped.size > 0) await ensureBaselineSource();

  for (const [country, countrySources] of [...grouped.entries()].sort()) {
    const selected = countrySources
      .sort((a, b) => (a.sourceCategory === "regulator" ? -1 : 1) - (b.sourceCategory === "regulator" ? -1 : 1))
      .slice(0, 4);
    const rawItem = buildRawItem(country, selected);
    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);
    if (dryRun) {
      results.push({ country, status: "dry_run", sourceCount: selected.length, rawHash: rawItem.hash });
      continue;
    }
    if (existingRaw) {
      await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRaw.id);
      if (existingUpdate) {
        results.push({ country, status: "skipped_existing_update", updateId: existingUpdate.id });
        continue;
      }
      const created = await updateRepository.createUpdate(buildUpdate(country, selected, existingRaw.id));
      results.push({ country, status: "created_update_for_existing_raw_item", updateId: created.id });
      continue;
    }
    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(country, selected, createdRaw.id));
    results.push({ country, status: "created", rawItemId: createdRaw.id, updateId: createdUpdate.id });
  }

  process.stdout.write(
    `${JSON.stringify({ ok: true, dryRun, appDataMode: env.APP_DATA_MODE, selectedCountries: grouped.size, results }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-monitored-country-legal-baselines] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
