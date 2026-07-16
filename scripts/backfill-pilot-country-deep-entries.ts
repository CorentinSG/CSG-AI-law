import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type {
  CountrySourceRecord,
  EuropeCountryProfile,
} from "@/content/ai-regulation/europe-member-state-implementation";
import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-member-state-implementation";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, LegalArea } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "pilot-country-legal-deepener";
const SOURCE_NAME = "Pilot country legal database deepener";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe";
const DETECTED_AT = "2026-07-15T00:00:00.000Z";
const DEFAULT_PILOT_COUNTRIES = ["france", "germany", "italy", "spain", "netherlands"];

type EntryFamily = "implementation" | "soft_law" | "case_law" | "latest_update";

interface DeepEntryDraft {
  family: EntryFamily;
  profile: EuropeCountryProfile;
  source: CountrySourceRecord;
  title: string;
  summary: string;
  publicationDate: string | null;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  authorityType: AuthorityType;
  tags: string[];
}

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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function canonicalSourceType(sourceType: CountrySourceRecord["sourceType"]): SourceReference["sourceType"] {
  if (sourceType === "regulator" || sourceType === "court") return sourceType;
  return "official";
}

function classifySource(
  source: CountrySourceRecord,
  family: EntryFamily,
): Pick<DeepEntryDraft, "developmentType" | "legalArea" | "authorityType"> {
  if (family === "case_law" || source.sourceType === "court") {
    return {
      developmentType: "Enforcement action",
      legalArea: "Automated decision-making",
      authorityType: "Enforcement action",
    };
  }

  if (family === "soft_law" || source.sourceType === "soft_law") {
    return {
      developmentType: "Agency guidance",
      legalArea: "AI governance",
      authorityType: "Soft law",
    };
  }

  if (source.sourceType === "legislation") {
    return {
      developmentType: /bill|draft|proposal|consultation|amendment/i.test(source.label)
        ? "Bill"
        : "Statute",
      legalArea: "AI governance",
      authorityType: /bill|draft|proposal|consultation|amendment/i.test(source.label)
        ? "Proposed law"
        : "Binding law",
    };
  }

  if (source.sourceType === "parliament") {
    return {
      developmentType: /bill|draft|amendment/i.test(source.label) ? "Bill" : "Policy report",
      legalArea: "AI governance",
      authorityType: /bill|draft|amendment/i.test(source.label) ? "Proposed law" : "Policy report",
    };
  }

  if (source.sourceType === "regulator") {
    return {
      developmentType: "Agency guidance",
      legalArea: /data|privacy|cnil|aepd|bfdi|garante|persoonsgegevens/i.test(
        `${source.label} ${source.institution}`,
      )
        ? "Data protection"
        : "AI governance",
      authorityType: "Agency guidance",
    };
  }

  if (source.sourceType === "policy") {
    return {
      developmentType: "Policy report",
      legalArea: "AI governance",
      authorityType: "Policy report",
    };
  }

  return {
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
  };
}

function sourceReferenceFor(source: CountrySourceRecord, profile: EuropeCountryProfile): SourceReference {
  return {
    sourceRole: source.sourceType === "legislation" ? "primary" : "supporting",
    title: source.label,
    institution: source.institution,
    url: source.url,
    canonicalUrl: source.url,
    sourceType: canonicalSourceType(source.sourceType),
    authorityType: source.sourceType,
    publicationDate: source.publicationDate ?? null,
    detectedAt: DETECTED_AT,
    retrievedAt: DETECTED_AT,
    lastVerifiedAt: source.lastCheckedDate,
    jurisdiction: profile.countryName,
    documentType: source.sourceType,
    excerpt: source.note,
    pinpoint: source.pinpoint ?? {},
    reliabilityLevel: source.official ? "high" : "medium",
    verificationStatus:
      source.official && source.public && source.responseStatus && source.responseStatus < 400
        ? "verified"
        : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      source.runtimeAccessible === false
        ? "Runtime crawling constrained; source retained as manual official reference."
        : null,
    notes: source.note,
  };
}

function sourceForLatestUpdate(profile: EuropeCountryProfile, sourceUrl: string) {
  return [
    ...profile.nationalAIRegulationSources,
    ...profile.nationalSoftLawSources,
    ...profile.nationalCaseLawSources,
  ].find((source) => source.url === sourceUrl);
}

function dedupeEntries(entries: DeepEntryDraft[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.profile.slug}:${entry.family}:${entry.source.url}:${entry.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildEntries(profile: EuropeCountryProfile): DeepEntryDraft[] {
  const entries: DeepEntryDraft[] = [];

  for (const source of profile.nationalAIRegulationSources) {
    const classification = classifySource(source, "implementation");
    entries.push({
      family: "implementation",
      profile,
      source,
      title: `${profile.countryName}: ${source.label}`,
      summary:
        `${source.institution} is tracked as an official AI-governance source for ${profile.countryName}. ${source.note}`,
      publicationDate: source.publicationDate ?? profile.lastReviewedDate,
      ...classification,
      tags: ["country-deep-entry", "official-source", "implementation-layer", profile.slug],
    });
  }

  for (const source of profile.nationalSoftLawSources) {
    const classification = classifySource(source, "soft_law");
    entries.push({
      family: "soft_law",
      profile,
      source,
      title: `${profile.countryName}: ${source.label}`,
      summary:
        `${source.institution} is tracked as a soft-law or guidance source for ${profile.countryName}. ${source.note}`,
      publicationDate: source.publicationDate ?? profile.lastReviewedDate,
      ...classification,
      tags: ["country-deep-entry", "official-source", "soft-law-layer", profile.slug],
    });
  }

  for (const source of profile.nationalCaseLawSources) {
    const classification = classifySource(source, "case_law");
    entries.push({
      family: "case_law",
      profile,
      source,
      title: `${profile.countryName}: ${source.label}`,
      summary:
        `${source.institution} is tracked as a case-law, enforcement, or official decision source for ${profile.countryName}. ${source.note}`,
      publicationDate: source.publicationDate ?? profile.lastReviewedDate,
      ...classification,
      tags: ["country-deep-entry", "official-source", "case-law-layer", profile.slug],
    });
  }

  for (const update of profile.latestRelevantUpdates) {
    const source = sourceForLatestUpdate(profile, update.sourceUrl);
    if (!source) continue;
    const classification = classifySource(source, "latest_update");
    entries.push({
      family: "latest_update",
      profile,
      source,
      title: `${profile.countryName}: ${update.title}`,
      summary: update.note,
      publicationDate: update.date ?? source.publicationDate ?? profile.lastReviewedDate,
      ...classification,
      tags: ["country-deep-entry", "official-source", "timeline-event", profile.slug],
    });
  }

  return dedupeEntries(entries);
}

function rawItemId(entry: DeepEntryDraft) {
  return `pilot-country-deep:${entry.profile.slug}:${entry.family}:${slugify(entry.title)}:${stableHash(
    entry.source.url,
  ).slice(0, 12)}:v1`;
}

function buildRawItem(entry: DeepEntryDraft): RawRegulatoryItemInput {
  const id = rawItemId(entry);
  const rawText = [
    entry.summary,
    "",
    `Profile notes: ${entry.profile.aiActImplementationNotes}`,
    "",
    `Source note: ${entry.source.note}`,
  ].join("\n");
  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.source.url,
    rawText,
    rawMetadata: {
      baselineKind: "pilot_country_deep_legal_database",
      countrySlug: entry.profile.slug,
      countryCode: entry.profile.countryCode,
      entryFamily: entry.family,
      sourceReferences: [sourceReferenceFor(entry.source, entry.profile)],
      officialSourceUrls: [entry.source.url],
      publicationPolicy: entry.source.official
        ? "auto_publish_official_source"
        : "admin_review_required",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: entry.source.official,
        parserUsed: "pilot_country_deep_entry_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "pilot_country_deep_legal_database_backfill",
        contentHash: stableHash(`${id}:${rawText}`),
        rawUrlScanned: entry.source.url,
      },
    },
    detectedAt: DETECTED_AT,
    hash: stableHash(id),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(entry: DeepEntryDraft, rawItemIdValue: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId: rawItemIdValue,
    title: entry.title,
    sourceName: entry.source.institution,
    sourceUrl: entry.source.url,
    jurisdiction: entry.profile.countryName as RegulatoryUpdateDraftInput["jurisdiction"],
    region: "Europe",
    country: entry.profile.countryName,
    developmentType: entry.developmentType,
    legalArea: entry.legalArea,
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedDate: DETECTED_AT,
    oneSentenceSummary: entry.summary.slice(0, 240),
    summary: entry.summary,
    whatHappened:
      `A granular ${entry.family.replace("_", " ")} entry was created from an official ${entry.source.sourceType} source already attached to the ${entry.profile.countryName} country profile.`,
    whyItMatters:
      "This gives the legal database a reviewable, source-specific record instead of only a bundled country baseline.",
    practicalImpact:
      "Admins can review, publish, reject, or enrich this source-specific entry independently while preserving traceability to the official source.",
    affectedParties: [
      "AI providers and deployers monitoring national AI governance",
      "Legal and compliance teams",
      "Public-sector AI governance teams",
    ],
    keyObligations: [
      "Preserve the distinction between official-source monitoring and final legal conclusions.",
      "Review the source-specific entry before treating it as complete legal analysis.",
      "Use official source references as the publication basis for country database updates.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      entry.authorityType === "Enforcement action"
        ? "Potentially elevated monitoring relevance because the entry relates to enforcement, case-law, or official decisions."
        : "Monitoring relevance confirmed; enforcement risk depends on the underlying source and future implementation steps.",
    importanceLevel:
      entry.authorityType === "Binding law" || entry.authorityType === "Enforcement action"
        ? "high"
        : "medium",
    confidenceLevel: entry.source.official ? "high" : "medium",
    tags: [
      ...entry.tags,
      `authority:${entry.authorityType}`,
      `source-type:${entry.source.sourceType}`,
    ],
    status: entry.source.official ? "published" : "needs_review",
    reviewedBy: entry.source.official ? "system:auto-official-source" : null,
    reviewedAt: entry.source.official ? DETECTED_AT : null,
    publishedAt: entry.source.official ? DETECTED_AT : null,
  };
}

async function ensureDeepenerSource() {
  const existing = await updateRepository.getSource(SOURCE_ID);
  if (existing) return existing;
  return updateRepository.addSource({
    id: SOURCE_ID,
    name: SOURCE_NAME,
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: SOURCE_URL,
    sourceType: "static_page",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes:
      "Synthetic curator source for granular country legal-database entries generated from verified country profile sources.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: {
      sourceCategory: "official",
      baselineKind: "pilot_country_deep_legal_database",
    },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: SOURCE_URL,
  });
}

async function main() {
  const dryRun = boolEnv(process.env.PILOT_COUNTRY_DEEP_DRY_RUN, true);
  const requestedCountries = parseList(process.env.PILOT_COUNTRY_DEEP_COUNTRIES);
  const selectedSlugs =
    requestedCountries.size > 0 ? [...requestedCountries] : DEFAULT_PILOT_COUNTRIES;
  const profiles = selectedSlugs
    .map((slug) => getEuropeCountryProfileBySlug(slug))
    .filter((profile): profile is EuropeCountryProfile => Boolean(profile));
  const entries = profiles.flatMap(buildEntries);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(10000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun && entries.length > 0) {
    await ensureDeepenerSource();
  }

  for (const entry of entries) {
    const rawItem = buildRawItem(entry);
    const existingRawItem = existingRawItems.find((item) => item.hash === rawItem.hash);
    if (dryRun) {
      results.push({
        country: entry.profile.countryName,
        family: entry.family,
        status: "dry_run",
        title: entry.title,
        authorityType: entry.authorityType,
        developmentType: entry.developmentType,
        legalArea: entry.legalArea,
        rawHash: rawItem.hash,
      });
      continue;
    }

    if (existingRawItem) {
      await updateRepository.updateRawItemMetadata(existingRawItem.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRawItem.id);
      if (!existingUpdate) {
        const createdUpdate = await updateRepository.createUpdate(
          buildUpdate(entry, existingRawItem.id),
        );
        updateByRawItemId.set(existingRawItem.id, createdUpdate);
        results.push({
          country: entry.profile.countryName,
          family: entry.family,
          status: "created_update_for_existing_raw_item",
          rawItemId: existingRawItem.id,
          updateId: createdUpdate.id,
        });
        continue;
      }
      results.push({
        country: entry.profile.countryName,
        family: entry.family,
        status: "skipped_existing_update",
        rawItemId: existingRawItem.id,
        updateId: existingUpdate.id,
      });
      continue;
    }

    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(entry, createdRaw.id));
    existingRawItems.push(createdRaw);
    updateByRawItemId.set(createdRaw.id, createdUpdate);
    results.push({
      country: entry.profile.countryName,
      family: entry.family,
      status: "created",
      rawItemId: createdRaw.id,
      updateId: createdUpdate.id,
      updateStatus: createdUpdate.status,
    });
  }

  const byCountry = results.reduce<Record<string, number>>((acc, result) => {
    const country = String(result.country);
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});
  const byFamily = results.reduce<Record<string, number>>((acc, result) => {
    const family = String(result.family);
    acc[family] = (acc[family] ?? 0) + 1;
    return acc;
  }, {});

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun,
        appDataMode: env.APP_DATA_MODE,
        selectedCountries: profiles.map((profile) => profile.slug),
        entryCount: entries.length,
        byCountry,
        byFamily,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-pilot-country-deep-entries] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
