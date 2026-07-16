import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "country-legal-deepener";
const SOURCE_NAME = "Country legal database deepener";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe";
const DETECTED_AT = "2026-07-16T01:15:00.000Z";
const WAVE_TAG = "eu-official-wave5";

type OfficialWaveEntry = {
  country: Jurisdiction;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceReference["sourceType"];
  publicationDate: string | null;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  authorityType: AuthorityType;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  tags: string[];
  excerpt: string;
};

const entries: OfficialWaveEntry[] = [
  {
    country: "Czechia",
    title: "Czech Ministry prepares draft AI Act implementation law",
    sourceName: "Czech Ministry of Industry and Trade",
    sourceUrl:
      "https://mpo.gov.cz/en/guidepost/for-the-media/press-releases/the-ministry-of-industry-and-trade-has-prepared-a-draft-law-on-artificial-intelligence----289865/",
    sourceType: "government",
    publicationDate: "2025-10-13",
    developmentType: "Bill",
    legalArea: "AI governance",
    authorityType: "Proposed law",
    summary:
      "The Czech Ministry of Industry and Trade prepared a draft law to implement the EU AI Act through a minimalist, pro-innovation national framework.",
    whatHappened:
      "The ministry announced that the draft was undergoing inter-ministerial consultation and would cover only the national measures needed for AI Act implementation.",
    whyItMatters:
      "This gives Czechia a concrete legislative implementation layer rather than only an AI strategy source.",
    practicalImpact:
      "Czech AI providers and deployers should monitor the draft law for final authority designations, sanctions, and administrative procedures.",
    tags: ["country-deep-entry", "official-source", "implementation-layer", "timeline-event", "czechia"],
    excerpt:
      "The ministry says the draft law implements the AI Act while supporting innovation and avoiding unnecessary administrative burden.",
  },
  {
    country: "Czechia",
    title: "Czechia publishes National Artificial Intelligence Strategy 2030",
    sourceName: "Czech Ministry of Industry and Trade",
    sourceUrl: "https://mpo.gov.cz/en/business/digital-economy/artificial-intelligence/",
    sourceType: "government",
    publicationDate: "2024-07-24",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Czechia's national AI page records government approval of the National Artificial Intelligence Strategy 2030 and identifies ethical, legal, security, industry, and public-administration priorities.",
    whatHappened:
      "The Ministry of Industry and Trade explains that the updated strategy was approved by government resolution no. 520 on 24 July 2024.",
    whyItMatters:
      "The strategy is not binding AI Act enforcement law, but it anchors Czech AI governance priorities and implementation planning.",
    practicalImpact:
      "The Czech country database should separate this strategy layer from binding AI Act implementation while using it to track annual action plans.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "czechia"],
    excerpt:
      "The strategy covers AI research, education, labour-market impacts, ethical and legal aspects, security, industry, and public services.",
  },
  {
    country: "Cyprus",
    title: "Cyprus designates Commissioner of Communications for AI Act supervision",
    sourceName: "European Commission AI Act Service Desk",
    sourceUrl: "https://ai-act-service-desk.ec.europa.eu/en/national-resources",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "The AI Act Service Desk states that Cyprus designated the Commissioner of Communications as notifying authority, market-surveillance authority, and national single point of contact for the AI Act.",
    whatHappened:
      "The Commission's national resources page links to the Cypriot AI Act resource and identifies the Commissioner's three national roles.",
    whyItMatters:
      "This adds a concrete national competent-authority designation for Cyprus.",
    practicalImpact:
      "Cypriot AI providers and deployers can treat the Commissioner of Communications as the central AI Act supervisory and contact point.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "cyprus"],
    excerpt:
      "The Service Desk says Cyprus's Commissioner of Communications is the notifying authority, market-surveillance authority, and single point of contact.",
  },
  {
    country: "Austria",
    title: "Austria's RTR AI Service Desk supports AI Act implementation",
    sourceName: "Austrian Regulatory Authority for Broadcasting and Telecommunications (RTR)",
    sourceUrl: "https://www.rtr.at/rtr/service/ki-servicestelle/faq/FAQ.en.html",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "RTR explains that its AI Service Desk acts as Austria's point of contact and information hub for the AI ecosystem in preparation for the European AI Act.",
    whatHappened:
      "The service desk provides accessible information, knowledge exchange, specialist events and studies, and support for responsible AI use, including for media companies.",
    whyItMatters:
      "This is Austria's practical official guidance layer while final enforcement designations continue to mature.",
    practicalImpact:
      "Austrian operators can use RTR's AI Service Desk for AI Act orientation, timing, risk categorisation, and compliance support.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "austria"],
    excerpt:
      "RTR states that the AI Service Desk is a low-threshold information and support service for the regulatory framework for AI use and development.",
  },
  {
    country: "Belgium",
    title: "Belgian FPS Economy publishes AI Act guidance for companies",
    sourceName: "Belgian Federal Public Service Economy",
    sourceUrl: "https://economie.fgov.be/en/themes/enterprises/ai-act",
    sourceType: "government",
    publicationDate: "2026-06-16",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "Belgium's FPS Economy explains the AI Act, its phased implementation, and practical thematic guidance for companies that use AI, develop AI systems, or develop GPAI models.",
    whatHappened:
      "The FPS Economy page states that the AI Act entered into force on 2 August 2024 and obligations apply gradually so companies can prepare.",
    whyItMatters:
      "This adds a Belgian official compliance guidance layer separate from Article 77 authority designation.",
    practicalImpact:
      "Belgian businesses can use FPS Economy guidance to classify their AI activity and prepare for phased AI Act obligations.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "belgium"],
    excerpt:
      "FPS Economy says the AI Act covers design, development, placing on the market, and use of AI systems in practice.",
  },
  {
    country: "Ireland",
    title: "Ireland designates 15 AI Act competent authorities and plans National AI Office",
    sourceName: "Irish Department of Enterprise, Tourism and Employment",
    sourceUrl: "https://enterprise.gov.ie/en/news-and-events/department-news/2025/september/20250916.html",
    sourceType: "government",
    publicationDate: "2025-09-16",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Ireland announced a distributed model with 15 national competent authorities and a National AI Office to be established by 2 August 2026 as central coordinating authority.",
    whatHappened:
      "The Department welcomed the designated authorities to the National AI Implementation Committee and described the Single Point of Contact and future AI Office functions.",
    whyItMatters:
      "Ireland is one of the clearer distributed AI Act implementation models, with explicit competent authorities and central coordination.",
    practicalImpact:
      "Irish AI monitoring should track each competent authority, the National AI Office, the sandbox function, and cross-regulator coordination.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "ireland"],
    excerpt:
      "Ireland lists 15 national competent authorities and says a National AI Office will coordinate implementation, act as single point of contact, and host a sandbox.",
  },
  {
    country: "Ireland",
    title: "Ireland publishes Regulation of Artificial Intelligence Bill 2026",
    sourceName: "Irish Department of Enterprise, Tourism and Employment",
    sourceUrl: "https://enterprise.gov.ie/en/news-and-events/department-news/2026/june/20260617.html",
    sourceType: "government",
    publicationDate: "2026-06-17",
    developmentType: "Bill",
    legalArea: "AI governance",
    authorityType: "Proposed law",
    summary:
      "Ireland published the Regulation of Artificial Intelligence Bill 2026 to establish the AI Office of Ireland and provide enforcement tools for designated market-surveillance authorities.",
    whatHappened:
      "The Bill includes an independent statutory AI Office, an enforcement toolkit for MSAs, complaint handling, cooperation, supervision, sanctions, and penalties.",
    whyItMatters:
      "This creates Ireland's binding implementation track for AI Act supervision and enforcement once enacted.",
    practicalImpact:
      "Irish providers and deployers should monitor the Bill's passage, sanctions regime, and the AI Office's statutory functions.",
    tags: ["country-deep-entry", "official-source", "implementation-layer", "timeline-event", "ireland"],
    excerpt:
      "The Department says the Bill establishes Oifig IS na hEireann and empowers national competent authorities designated as MSAs.",
  },
  {
    country: "Netherlands",
    title: "Dutch government explains AI Act obligations and supervisory model for businesses",
    sourceName: "Netherlands Enterprise Agency (RVO)",
    sourceUrl: "https://business.gov.nl/regulations/ai-act/",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "The Netherlands Enterprise Agency explains prohibited AI systems, high-risk obligations, transparency duties, supervision, standards, sandbox tools, and the AI Act implementation timeline.",
    whatHappened:
      "The guidance says national supervising authorities monitor prohibited AI systems and check whether high-risk systems meet technological and transparency obligations.",
    whyItMatters:
      "This is a practical Dutch government source for business-facing AI Act compliance and supervision.",
    practicalImpact:
      "Dutch businesses can use the page to identify prohibited uses, high-risk timelines, transparency duties, and available tools such as the regulatory sandbox and AI Act Guide.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "netherlands"],
    excerpt:
      "Business.gov.nl states that the AI Act covers prohibited systems, high-risk systems, transparency duties, supervision, standards, sandbox tools, and phased deadlines.",
  },
];

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

function canonicalSourceType(sourceType: SourceReference["sourceType"]): SourceReference["sourceType"] {
  if (
    sourceType === "court" ||
    sourceType === "regulator" ||
    sourceType === "standards_body" ||
    sourceType === "discovery_source" ||
    sourceType === "media_source" ||
    sourceType === "tracker"
  ) {
    return sourceType;
  }
  return "official";
}

function sourceReferenceFor(entry: OfficialWaveEntry): SourceReference {
  return {
    sourceRole: "primary",
    title: entry.title,
    institution: entry.sourceName,
    url: entry.sourceUrl,
    canonicalUrl: entry.sourceUrl,
    sourceType: canonicalSourceType(entry.sourceType),
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedAt: DETECTED_AT,
    retrievedAt: DETECTED_AT,
    lastVerifiedAt: DETECTED_AT,
    jurisdiction: entry.country,
    documentType: entry.developmentType,
    excerpt: entry.excerpt,
    pinpoint: {},
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: null,
    notes: "Official source added during EU official-source enrichment wave 5.",
  };
}

function rawIdentity(entry: OfficialWaveEntry) {
  return `${WAVE_TAG}:${String(entry.country).toLowerCase()}:${slugify(entry.title)}:${stableHash(entry.sourceUrl).slice(0, 12)}:v1`;
}

function buildRawItem(entry: OfficialWaveEntry): RawRegulatoryItemInput {
  const rawText = [entry.summary, "", entry.whatHappened, "", entry.excerpt].join("\n");
  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "eu_official_wave5_country_deepening",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_official_wave5_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_official_wave5_backfill",
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

function buildUpdate(entry: OfficialWaveEntry, rawItemId: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: entry.title,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    jurisdiction: entry.country,
    region: "Europe",
    country: entry.country,
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
      "AI providers and deployers",
      "Legal and compliance teams",
      "Public-sector AI governance teams",
    ],
    keyObligations: [
      "Use the official source as the primary authority for this country-specific database entry.",
      "Preserve the distinction between proposed law, official guidance, authority designation, and timeline layers.",
      "Continue monitoring for final legal texts, administrative decisions, case law, and supervisory updates.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because the entry records binding national law or statutory AI Act implementation measures."
        : "Medium monitoring relevance; enforcement risk depends on the underlying AI Act implementation or regulator practice.",
    importanceLevel: entry.authorityType === "Binding law" ? "high" : "medium",
    confidenceLevel: "high",
    tags: [
      ...entry.tags,
      `authority:${entry.authorityType}`,
      `source-type:${entry.sourceType}`,
      WAVE_TAG,
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
    sourceType: "static_page",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes: "Synthetic curator source for granular country legal-database entries.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: { sourceCategory: "official" },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: SOURCE_URL,
  });
}

async function main() {
  const dryRun = boolEnv(process.env.EU_OFFICIAL_WAVE5_DRY_RUN, true);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(20000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) await ensureSource();

  for (const entry of entries) {
    const rawItem = buildRawItem(entry);
    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

    if (dryRun) {
      results.push({ country: entry.country, status: "dry_run", title: entry.title });
      continue;
    }

    if (existingRaw) {
      await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRaw.id);
      if (existingUpdate) {
        results.push({ country: entry.country, status: "skipped_existing_update", updateId: existingUpdate.id });
        continue;
      }
      const created = await updateRepository.createUpdate(buildUpdate(entry, existingRaw.id));
      results.push({ country: entry.country, status: "created_update_for_existing_raw_item", updateId: created.id });
      continue;
    }

    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(entry, createdRaw.id));
    existingRawItems.push(createdRaw);
    updateByRawItemId.set(createdRaw.id, createdUpdate);
    results.push({
      country: entry.country,
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
        entryCount: entries.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-eu-official-wave5] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
