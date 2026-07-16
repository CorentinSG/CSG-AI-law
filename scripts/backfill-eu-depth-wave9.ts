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
const DETECTED_AT = "2026-07-16T04:05:00.000Z";
const WAVE_TAG = "eu-depth-wave9";

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
    country: "Italy",
    title: "Italian Garante fined Replika chatbot provider and ordered GDPR compliance measures",
    sourceName: "European Data Protection Board / Italian Garante",
    sourceUrl: "https://www.edpb.europa.eu/news/ai-the-italian-supervisory-authority-fines-company-behind-chatbot-replika_en",
    sourceType: "regulator",
    publicationDate: "2025-05-21",
    developmentType: "Enforcement action",
    legalArea: "Data protection",
    authorityType: "Enforcement action",
    summary:
      "The Italian supervisory authority fined Luka Inc., the company behind the Replika chatbot, and ordered compliance measures for GDPR infringements linked to AI chatbot processing.",
    whatHappened:
      "The authority adopted a final decision on 10 April 2025 after investigating Replika's personal-data processing, transparency, legal basis and accountability controls.",
    whyItMatters:
      "This gives Italy another concrete AI-chatbot enforcement precedent beyond the earlier ChatGPT and platform-work cases.",
    practicalImpact:
      "AI chatbot providers should document lawful basis, transparent notices, privacy-by-design controls, and compliance measures before deploying conversational systems to EU users.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "chatbot", "data-protection", "italy"],
    excerpt:
      "The EDPB records the final decision date as 10 April 2025 and lists GDPR Articles 5, 6, 12, 13, 24 and 25 among the legal references.",
  },
  {
    country: "Hungary",
    title: "Hungarian supervisory authority found GDPR infringements in AI-related processing",
    sourceName: "European Data Protection Board / Hungarian Supervisory Authority",
    sourceUrl:
      "https://www.edpb.europa.eu/news/national-news/2022/data-protection-issues-arising-connection-use-artificial-intelligence_en",
    sourceType: "regulator",
    publicationDate: "2022-05-20",
    developmentType: "Enforcement action",
    legalArea: "Data protection",
    authorityType: "Enforcement action",
    summary:
      "The Hungarian supervisory authority addressed data-protection issues arising from the use of artificial intelligence and ordered the controller to stop unlawful processing.",
    whatHappened:
      "The authority found serious GDPR infringements over a long period in connection with AI-related personal-data processing.",
    whyItMatters:
      "Hungary's database gains an enforcement-layer entry rather than only institutional or baseline AI Act material.",
    practicalImpact:
      "Hungarian AI deployers should maintain lawful-basis analysis, transparency, minimisation, accountability and stop-processing controls for AI-related personal-data workflows.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "data-protection", "hungary"],
    excerpt:
      "The EDPB national-news notice records serious infringement findings and an order to stop the processing.",
  },
  {
    country: "France",
    title: "CNIL published new AI and GDPR recommendations for responsible innovation",
    sourceName: "French Data Protection Authority (CNIL)",
    sourceUrl:
      "https://www.cnil.fr/en/ai-and-gdpr-cnil-publishes-new-recommendations-support-responsible-innovation",
    sourceType: "regulator",
    publicationDate: "2025-02-07",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "CNIL published new recommendations on informing people when personal data is used to train AI models and on enabling rights such as access, rectification, objection and deletion.",
    whatHappened:
      "The French authority continued its AI action plan by issuing practical GDPR recommendations for AI systems and privacy-by-design compliance.",
    whyItMatters:
      "France now has a deeper soft-law layer for model-training transparency and data-subject rights, not only enforcement entries.",
    practicalImpact:
      "French AI developers should design notices, rights workflows, training-data governance, minimisation and privacy-by-design documentation into AI projects.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "model-training", "data-protection", "france"],
    excerpt:
      "CNIL says the recommendations address information where personal data is used to train an AI model and exercise of rights.",
  },
  {
    country: "Denmark",
    title: "Danish Datatilsynet issued guidance on public authorities' use of AI",
    sourceName: "Danish Data Protection Authority (Datatilsynet)",
    sourceUrl:
      "https://www.datatilsynet.dk/presse-og-nyheder/nyhedsarkiv/2023/okt/ny-vejledning-om-offentlige-myndigheders-brug-af-ai-og-kortlaegning-af-ai-paa-tvaers-af-den-offentlige-sektor",
    sourceType: "regulator",
    publicationDate: "2023-10-05",
    developmentType: "Agency guidance",
    legalArea: "Public sector use of AI",
    authorityType: "Agency guidance",
    summary:
      "Denmark's Datatilsynet published guidance on public authorities' development and use of AI and mapped AI across the public sector.",
    whatHappened:
      "The guidance addresses legal basis, information duties, DPIAs and designing data protection into AI solutions from the start.",
    whyItMatters:
      "Denmark's timeline now includes a public-sector AI governance guidance layer that is directly relevant for municipalities and agencies.",
    practicalImpact:
      "Danish public authorities should document legal basis, transparency, DPIA screening, procurement controls and privacy-by-design before deploying AI.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "public-sector-ai", "denmark"],
    excerpt:
      "Datatilsynet says the guidance helps public authorities build data protection into AI solutions from the beginning.",
  },
  {
    country: "Finland",
    title: "Finnish Data Protection Ombudsman published AI data-protection guidelines",
    sourceName: "Finnish Office of the Data Protection Ombudsman",
    sourceUrl:
      "https://tietosuoja.fi/en/-/guidelines-published-on-ensuring-data-protection-in-the-development-and-use-of-ai-systems",
    sourceType: "regulator",
    publicationDate: "2025-05-20",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Finland's Data Protection Ombudsman published guidelines on ensuring data protection in the development and use of AI systems.",
    whatHappened:
      "The guidance explains lawful processing, risk assessment, minimisation, purpose limitation, design for rights and transparency in AI systems.",
    whyItMatters:
      "Finland's database gains a current official AI/GDPR guidance layer for builders and deployers.",
    practicalImpact:
      "Finnish AI teams should run data-protection risk assessments, define lawful basis, limit data, support data-subject rights and make processing transparent.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "data-protection", "finland"],
    excerpt:
      "The Ombudsman says the guidelines explain how organisations can ensure personal data is processed lawfully in AI systems.",
  },
  {
    country: "Norway",
    title: "Norwegian Datatilsynet operates a regulatory privacy sandbox for AI",
    sourceName: "Norwegian Data Protection Authority (Datatilsynet)",
    sourceUrl: "https://www.datatilsynet.no/en/regulations-and-tools/sandbox-for-artificial-intelligence/",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "Norway's Datatilsynet runs a regulatory privacy sandbox for artificial intelligence to provide free guidance to selected projects.",
    whatHappened:
      "The sandbox supports privacy-enhancing innovation and includes workstreams on generative AI and responsible AI development.",
    whyItMatters:
      "Norway's non-EU Europe coverage gains a practical governance and supervision mechanism relevant to AI deployment.",
    practicalImpact:
      "Norwegian AI projects should use sandbox guidance to resolve privacy, DPIA, transparency, lawful-basis and governance questions before scaling.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "sandbox", "norway"],
    excerpt:
      "Datatilsynet describes the sandbox as free guidance for selected projects and a tool for privacy-friendly innovation.",
  },
  {
    country: "Ireland",
    title: "Irish DPC welcomed EDPB Opinion 28/2024 on personal data in AI models",
    sourceName: "Irish Data Protection Commission",
    sourceUrl: "https://www.dataprotection.ie/en/news-media/press-releases?page=2",
    sourceType: "regulator",
    publicationDate: "2024-12-18",
    developmentType: "Policy report",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Ireland's DPC welcomed EDPB Opinion 28/2024 on the use of personal data for developing and deploying AI models, following the DPC's request for EU-wide clarity.",
    whatHappened:
      "The DPC asked the EDPB for an Article 64 opinion to harmonise GDPR treatment of AI model development and deployment across the EU.",
    whyItMatters:
      "Ireland is a key regulator for major technology companies, so its role in triggering the opinion matters for EU AI model governance.",
    practicalImpact:
      "AI model developers with Irish/EU exposure should monitor DPC and EDPB positions on anonymisation, lawful basis, unlawful training data and deployment safeguards.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "model-training", "ireland"],
    excerpt:
      "The DPC says the opinion was sought to support EU-wide regulatory harmonisation and clarity on personal data in AI models.",
  },
  {
    country: "European Union",
    title: "EDPB Opinion 28/2024 clarifies GDPR treatment of personal data in AI models",
    sourceName: "European Data Protection Board (EDPB)",
    sourceUrl:
      "https://www.edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf",
    sourceType: "regulator",
    publicationDate: "2024-12-17",
    developmentType: "Policy report",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "EDPB Opinion 28/2024 addresses anonymisation, legitimate interest, unlawful processing and GDPR consequences for developing and deploying AI models.",
    whatHappened:
      "The Board responded to the Irish DPC's request for an opinion on novel GDPR questions raised by AI model development and deployment.",
    whyItMatters:
      "This is a core EU soft-law anchor for generative AI, model training and deployment governance across Member States.",
    practicalImpact:
      "AI model teams should assess anonymisation claims, lawful basis, legitimate-interest balancing, rights impacts, transparency, DPIAs and consequences of unlawfully processed training data.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "model-training", "european-union"],
    excerpt:
      "The opinion covers AI models, personal data, anonymisation, legitimate interest and consequences of unlawful processing.",
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
    notes: "Official source added during EU legal-depth enrichment wave 9.",
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
      baselineKind: "eu_depth_wave9_case_law_decisions_guidance",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_depth_wave9_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_depth_wave9_backfill",
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
      "Public authorities",
      "Legal and compliance teams",
      "Data protection officers",
    ],
    keyObligations: [
      "Treat official judgments, enforcement decisions, and regulator guidance as primary authority for the legal-database layer.",
      "Track follow-up appeals, implementation measures, supervisory decisions, and national guidance updates.",
      "Map each entry to the relevant country timeline and to the authority-type, region, and legal-area axes.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because the entry records a binding court or legal-authority development."
        : entry.authorityType === "Enforcement action"
          ? "High relevance because the entry records an official supervisory enforcement action or order."
          : "Medium relevance because the entry records official regulator or institutional guidance likely to shape compliance expectations.",
    importanceLevel: entry.authorityType === "Agency guidance" ? "medium" : "high",
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
  const dryRun = boolEnv(process.env.EU_DEPTH_WAVE9_DRY_RUN, true);
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
  console.error(`[backfill-eu-depth-wave9] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
