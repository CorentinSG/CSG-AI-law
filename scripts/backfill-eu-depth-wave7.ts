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
const DETECTED_AT = "2026-07-16T02:40:00.000Z";
const WAVE_TAG = "eu-depth-wave7";

type DepthEntry = {
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

const entries: DepthEntry[] = [
  {
    country: "France",
    title: "CNIL records Clearview AI facial-recognition enforcement as a major 2022 sanction",
    sourceName: "French Data Protection Authority (CNIL)",
    sourceUrl: "https://www.cnil.fr/sites/default/files/2023-05/cnil_-_43e_rapport_annuel_-_2022.pdf",
    sourceType: "regulator",
    publicationDate: "2022-10-20",
    developmentType: "Enforcement action",
    legalArea: "Biometric identification",
    authorityType: "Enforcement action",
    summary:
      "CNIL's 2022 annual report records its EUR 20 million Clearview AI sanction and order to stop unlawful collection/use of data relating to people in France and delete data already collected.",
    whatHappened:
      "CNIL investigated Clearview AI facial-recognition software after complaints and found GDPR breaches around legal basis and data-subject rights.",
    whyItMatters:
      "This is a core EU biometric/facial-recognition enforcement precedent and should sit in the French case-law/enforcement layer.",
    practicalImpact:
      "AI systems scraping public images for biometric identification face high enforcement risk where there is no lawful basis and rights handling is inadequate.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "case-law-layer", "biometrics", "france"],
    excerpt:
      "CNIL says the sanction required Clearview AI to stop collecting and using data without legal basis and delete data already collected.",
  },
  {
    country: "Italy",
    title: "Italian Garante imposed an urgent temporary limitation on ChatGPT processing",
    sourceName: "Italian Data Protection Authority (Garante)",
    sourceUrl: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9870832",
    sourceType: "regulator",
    publicationDate: "2023-03-30",
    developmentType: "Enforcement action",
    legalArea: "Data protection",
    authorityType: "Enforcement action",
    summary:
      "The Italian Garante adopted an urgent temporary limitation on OpenAI's processing of personal data through ChatGPT, citing information, legal-basis, accuracy, age-verification and child-protection concerns.",
    whatHappened:
      "The measure identified possible GDPR violations under Articles 5, 6, 8, 13 and 25 and required OpenAI to communicate remedial steps within 20 days.",
    whyItMatters:
      "This was one of the first major EU regulatory interventions against a general-purpose generative AI service.",
    practicalImpact:
      "Generative-AI providers must be able to explain data collection, lawful basis, user/non-user notices, accuracy risks, age controls and child-safety safeguards.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "case-law-layer", "generative-ai", "italy"],
    excerpt:
      "The Garante ordered an immediate temporary limitation of processing for data subjects in Italy and requested remedial information within 20 days.",
  },
  {
    country: "Spain",
    title: "Spanish AEPD ordered a precautionary measure stopping Worldcoin data processing",
    sourceName: "Spanish Data Protection Agency (AEPD)",
    sourceUrl:
      "https://www.aepd.es/en/press-and-communication/press-releases/agency-orders-precautionary-measure-which-prevents-Worldcoin-from-continuing-toprocess-personal-data-in-spain",
    sourceType: "regulator",
    publicationDate: "2024-03-06",
    developmentType: "Enforcement action",
    legalArea: "Biometric identification",
    authorityType: "Enforcement action",
    summary:
      "AEPD ordered a precautionary measure preventing Worldcoin from continuing to process personal data in Spain.",
    whatHappened:
      "The Spanish authority used urgent powers to halt processing connected to Worldcoin's biometric identity project pending data-protection review.",
    whyItMatters:
      "This is a high-signal biometric enforcement/timeline event for AI identity systems in Spain.",
    practicalImpact:
      "Biometric AI deployments in Spain can face immediate interim restrictions where consent, minors' data, rights, or proportionality issues are unresolved.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "case-law-layer", "biometrics", "spain"],
    excerpt:
      "AEPD ordered a precautionary measure preventing Worldcoin from continuing to process personal data in Spain.",
  },
  {
    country: "Netherlands",
    title: "Dutch DPA fined Clearview AI EUR 30.5 million for facial-recognition data collection",
    sourceName: "Dutch Data Protection Authority (Autoriteit Persoonsgegevens)",
    sourceUrl:
      "https://www.edpb.europa.eu/news/national-news/2024/dutch-supervisory-authority-imposes-fine-clearview-because-illegal-data_en",
    sourceType: "regulator",
    publicationDate: "2024-09-03",
    developmentType: "Enforcement action",
    legalArea: "Biometric identification",
    authorityType: "Enforcement action",
    summary:
      "The Dutch supervisory authority fined Clearview AI EUR 30.5 million and imposed orders subject to penalties for ongoing violations linked to facial-recognition data collection.",
    whatHappened:
      "The Dutch DPA decision targeted Clearview's illegal data collection for facial recognition and required compliance measures backed by penalties.",
    whyItMatters:
      "This reinforces the cross-European enforcement line against large-scale image scraping and biometric identification databases.",
    practicalImpact:
      "Facial-recognition providers that scrape images and biometric data without valid legal basis face fines, deletion obligations and continuing penalty exposure.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "case-law-layer", "biometrics", "netherlands"],
    excerpt:
      "The Dutch SA decided to fine Clearview AI EUR 30.5 million and impose four orders subject to penalty for non-compliance.",
  },
  {
    country: "European Union",
    title: "EDPB ChatGPT Taskforce report coordinates GDPR enforcement issues for generative AI",
    sourceName: "European Data Protection Board (EDPB)",
    sourceUrl:
      "https://www.edpb.europa.eu/documents/task-force-report/report-of-the-work-undertaken-by-the-chatgpt-taskforce_en",
    sourceType: "regulator",
    publicationDate: "2024-05-24",
    developmentType: "Policy report",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The EDPB published a report on the ChatGPT Taskforce, created to exchange information on national enforcement activities and identify common GDPR issues for ChatGPT.",
    whatHappened:
      "The report records supervisory cooperation around OpenAI/ChatGPT and flags topics requiring a common approach, including lawful basis, fairness, transparency, accuracy and rights.",
    whyItMatters:
      "This is the main EU-level coordination document for generative-AI data-protection enforcement before AI Act supervision fully matures.",
    practicalImpact:
      "Generative-AI providers operating across EU Member States should expect coordinated scrutiny on GDPR issues even when AI Act obligations are still phasing in.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "enforcement-layer", "generative-ai", "european-union"],
    excerpt:
      "The EDPB taskforce exchanges information on engagement with OpenAI and ongoing enforcement activities concerning ChatGPT.",
  },
  {
    country: "Ireland",
    title: "Irish DPC published guidance on AI, Large Language Models and data protection",
    sourceName: "Irish Data Protection Commission",
    sourceUrl: "https://www.dataprotection.ie/en/dpc-guidance/blogs/AI-LLMs-and-Data-Protection",
    sourceType: "regulator",
    publicationDate: "2024-07-18",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Ireland's DPC published guidance explaining data-protection issues raised by AI and Large Language Models, including model development and use cases.",
    whatHappened:
      "The DPC guidance discusses how LLMs learn and mimic language and how they are packaged for chat, search, creative, software and educational use cases.",
    whyItMatters:
      "Ireland is a key jurisdiction for many technology companies, and DPC AI/LLM guidance is central to EU data-protection compliance for model development.",
    practicalImpact:
      "AI teams should map personal-data processing in training and deployment, assess lawful basis, transparency, accuracy, minimisation, rights and governance controls.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "generative-ai", "ireland"],
    excerpt:
      "The DPC describes LLMs and their use in chat, internet search, creative writing, software assistance and other AI use cases.",
  },
  {
    country: "Belgium",
    title: "Belgian DPA launched AI and Data Protection guidance series",
    sourceName: "Belgian Data Protection Authority",
    sourceUrl:
      "https://www.dataprotectionauthority.be/citizen/news/2026/04/13/ai-data-protection-series---the-impact-of-artificial-intelligence-on-privacy",
    sourceType: "regulator",
    publicationDate: "2026-04-13",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The Belgian DPA launched an AI & Data Protection series with a brochure on the impact of artificial intelligence on privacy.",
    whatHappened:
      "The authority framed the series as part of its commitment to raising awareness among citizens and businesses about AI in the context of data-protection law.",
    whyItMatters:
      "This adds a current Belgian supervisory guidance layer connecting AI Act concepts with GDPR/privacy risks.",
    practicalImpact:
      "Belgian AI deployers should treat privacy risk, profiling, transparency, data rights and GDPR governance as live supervisory priorities.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "data-protection", "belgium"],
    excerpt:
      "The Belgian DPA says the AI & Data Protection series reflects its commitment to awareness about AI and data protection law.",
  },
  {
    country: "Sweden",
    title: "IMY explains GDPR requirements for AI and personal data",
    sourceName: "Swedish Authority for Privacy Protection (IMY)",
    sourceUrl: "https://www.imy.se/verksamhet/dataskydd/innovationsportalen/vagledning-om-gdpr-och-ai/gdpr-och-ai/",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "IMY published legal guidance on GDPR and AI, explaining key data-protection concepts and principles relevant when personal data is used in AI development and deployment.",
    whatHappened:
      "The guidance is aimed at technical audiences and complements IMY's technical AI guidance by explaining GDPR obligations for AI contexts.",
    whyItMatters:
      "This gives Sweden a practical regulator-authored GDPR/AI compliance layer beyond the national AI Act implementation inquiry.",
    practicalImpact:
      "Swedish AI teams should integrate GDPR analysis into AI design, testing, deployment, impact assessments, transparency and rights handling.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "data-protection", "sweden"],
    excerpt:
      "IMY explains GDPR concepts and principles that are particularly important when personal data is used in AI development and use.",
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

function sourceReferenceFor(entry: DepthEntry): SourceReference {
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
    notes: "Official source added during EU legal-depth enrichment wave 7.",
  };
}

function rawIdentity(entry: DepthEntry) {
  return `${WAVE_TAG}:${String(entry.country).toLowerCase()}:${slugify(entry.title)}:${stableHash(entry.sourceUrl).slice(0, 12)}:v1`;
}

function buildRawItem(entry: DepthEntry): RawRegulatoryItemInput {
  const rawText = [entry.summary, "", entry.whatHappened, "", entry.excerpt].join("\n");
  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "eu_depth_wave7_enforcement_and_guidance",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_depth_wave7_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_depth_wave7_backfill",
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

function buildUpdate(entry: DepthEntry, rawItemId: string): RegulatoryUpdateDraftInput {
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
      "Data protection officers",
      "Public-sector AI governance teams",
    ],
    keyObligations: [
      "Treat official enforcement and regulator guidance as primary authority for the country legal-database layer.",
      "Track the distinction between sanctions, precautionary measures, taskforce coordination, and non-binding guidance.",
      "Continue monitoring for appeals, follow-up decisions, final resolutions, court judgments, and coordinated EU positions.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      entry.authorityType === "Enforcement action"
        ? "High relevance because the entry records an official supervisory action, fine, order, or precautionary measure."
        : "Medium relevance because the entry records official regulator guidance likely to shape future enforcement expectations.",
    importanceLevel: entry.authorityType === "Enforcement action" ? "high" : "medium",
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
  const dryRun = boolEnv(process.env.EU_DEPTH_WAVE7_DRY_RUN, true);
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
  console.error(`[backfill-eu-depth-wave7] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
