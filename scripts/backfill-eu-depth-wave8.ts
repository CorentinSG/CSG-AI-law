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
const DETECTED_AT = "2026-07-16T03:15:00.000Z";
const WAVE_TAG = "eu-depth-wave8";

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
    country: "Germany",
    title: "CJEU SCHUFA judgment treats automated credit scoring as potential GDPR Article 22 decision-making",
    sourceName: "Court of Justice of the European Union",
    sourceUrl: "https://infocuria.curia.europa.eu/tabs/redirect/juris/document/document.jsf?docid=280426&doclang=en",
    sourceType: "court",
    publicationDate: "2023-12-07",
    developmentType: "Other official regulatory development",
    legalArea: "Data protection",
    authorityType: "Binding law",
    summary:
      "The CJEU held in the SCHUFA credit-scoring reference that automated probability values may fall within GDPR Article 22 where third parties draw strongly on them when deciding whether to establish, implement, or terminate a contract.",
    whatHappened:
      "A German court asked whether SCHUFA's automated credit score could itself qualify as automated individual decision-making under the GDPR.",
    whyItMatters:
      "This is a key EU/Germany precedent for AI-assisted scoring, profiling, and credit-risk systems that materially determine access to services.",
    practicalImpact:
      "Credit scoring and similar automated risk systems need Article 22 analysis, transparency controls, lawful processing grounds, and safeguards when their outputs effectively drive decisions.",
    tags: ["country-deep-entry", "official-source", "case-law-layer", "automated-decision-making", "germany"],
    excerpt:
      "The judgment concerns automated individual decision-making, credit information agencies, and automatic refusal of an online credit application.",
  },
  {
    country: "Netherlands",
    title: "The Hague District Court ruled SyRI risk-indication legislation breached Article 8 ECHR",
    sourceName: "De Rechtspraak",
    sourceUrl:
      "https://www.rechtspraak.nl/organisatie-en-contact/organisatie/rechtbanken/rechtbank-den-haag/nieuws/2020/02/syri-legislation-in-breach-of-european-convention-on-human-rights",
    sourceType: "court",
    publicationDate: "2020-02-13",
    developmentType: "Other official regulatory development",
    legalArea: "Public sector use of AI",
    authorityType: "Binding law",
    summary:
      "The Hague District Court ruled that Dutch SyRI legislation for government fraud-risk detection violated higher law because it did not comply with Article 8 ECHR.",
    whatHappened:
      "The court assessed the legal basis for SyRI, a government risk-indication tool used for social-benefits, allowances, and tax-fraud detection.",
    whyItMatters:
      "SyRI is one of Europe's central public-sector algorithmic-governance judgments and belongs in the Netherlands AI/legal timeline.",
    practicalImpact:
      "Public authorities using algorithmic risk scoring need a sufficiently transparent, verifiable, necessary, and proportionate legal basis.",
    tags: ["country-deep-entry", "official-source", "case-law-layer", "public-sector-ai", "netherlands"],
    excerpt:
      "The court said SyRI legislation failed Article 8 ECHR and was insufficiently transparent and verifiable.",
  },
  {
    country: "Austria",
    title: "Austrian DSB AI guidance confirms GDPR continues to apply alongside the EU AI Act",
    sourceName: "Austrian Data Protection Authority (DSB)",
    sourceUrl: "https://dsb.gv.at/kuenstlichebrintelligenz/kuenstliche-intelligenz-datenschutz",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Austria's DSB explains that GDPR and national data-protection law continue to apply when AI systems process personal data, and that the DSB remains competent for AI-related data-protection questions.",
    whatHappened:
      "The DSB published an AI and data-protection guidance page mapping the AI Act, GDPR, complaint routes, and supervisory authority roles.",
    whyItMatters:
      "This gives Austria's country database a living official regulator layer for AI Act/GDPR overlap and supervisory competence.",
    practicalImpact:
      "Austrian AI deployers must treat AI Act compliance and GDPR compliance as parallel obligations where personal data is processed.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "ai-act", "data-protection", "austria"],
    excerpt:
      "The DSB states that the GDPR remains applicable when personal data is processed and that the DSB is competent for data-protection questions linked to AI systems.",
  },
  {
    country: "Italy",
    title: "Italian Garante Foodinho order targeted platform-work algorithms and Article 22 safeguards",
    sourceName: "Italian Data Protection Authority (Garante)",
    sourceUrl: "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677611",
    sourceType: "regulator",
    publicationDate: "2021-07-05",
    developmentType: "Enforcement action",
    legalArea: "Labor and social law",
    authorityType: "Enforcement action",
    summary:
      "The Italian Garante's Foodinho order found GDPR infringements in rider-data processing, including automated profiling, algorithmic allocation systems, DPIA failures, and Article 22 safeguard gaps.",
    whatHappened:
      "The authority examined a food-delivery platform's rider data, algorithmic matching/allocation, scoring, geolocation, transparency, DPIA, security, and employment-law interactions.",
    whyItMatters:
      "This is a foundational Italian enforcement precedent for algorithmic management of workers and platform-labour AI systems.",
    practicalImpact:
      "Platform employers need meaningful transparency, DPIAs, data-minimisation controls, worker safeguards, human intervention routes, and anti-discrimination checks for algorithmic systems.",
    tags: ["country-deep-entry", "official-source", "enforcement-layer", "case-law-layer", "employment", "italy"],
    excerpt:
      "The Garante found Article 22 safeguard gaps and imposed corrective measures plus an administrative fine of EUR 2,600,000.",
  },
  {
    country: "European Union",
    title: "EDPB facial-recognition law-enforcement guidelines set strict biometric safeguards",
    sourceName: "European Data Protection Board (EDPB)",
    sourceUrl: "https://www.edpb.europa.eu/system/files/2023-05/edpb_guidelines_202304_frtlawenforcement_v2_en.pdf",
    sourceType: "regulator",
    publicationDate: "2023-04-26",
    developmentType: "Agency guidance",
    legalArea: "Biometric identification",
    authorityType: "Agency guidance",
    summary:
      "The EDPB adopted guidelines on facial recognition technology in law enforcement, addressing biometric data, AI/ML risks, necessity, proportionality, LED safeguards, DPIAs, and rights impacts.",
    whatHappened:
      "The guidelines explain the legal framework and practical safeguards for law-enforcement facial recognition, including watch-list searches and public-space monitoring risks.",
    whyItMatters:
      "This is a core EU soft-law instrument for biometric AI in policing and should anchor country monitoring of law-enforcement AI deployments.",
    practicalImpact:
      "Law-enforcement facial-recognition projects require strict necessity/proportionality analysis, biometric-data safeguards, DPIAs, supervisory consultation, and rights-management planning.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "biometrics", "law-enforcement", "european-union"],
    excerpt:
      "The EDPB says facial recognition in law enforcement processes biometric data and often uses AI or machine learning, creating discrimination and false-result risks.",
  },
  {
    country: "Spain",
    title: "AEPD legal report analyses the high-risk AI controlled testing environment",
    sourceName: "Spanish Data Protection Agency (AEPD)",
    sourceUrl: "https://www.aepd.es/documento/informe-juridico-0059-2023-en.pdf",
    sourceType: "regulator",
    publicationDate: "2023-05-24",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "AEPD's legal report 0059/2023 analyses Spain's controlled testing environment for high-risk AI systems and the personal-data implications of participating in the AI sandbox.",
    whatHappened:
      "The agency assessed the data-protection dimension of the controlled testing environment linked to high-risk AI systems.",
    whyItMatters:
      "This adds a practical Spanish layer for AI sandbox governance, high-risk AI testing, and data-protection oversight.",
    practicalImpact:
      "Spanish AI sandbox participants should map personal-data processing, roles, safeguards, and rights handling before controlled testing.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "sandbox", "spain"],
    excerpt:
      "The report concerns the controlled testing environment for high-risk AI systems and related personal-data processing.",
  },
  {
    country: "Belgium",
    title: "Belgian DPA guidance maps artificial intelligence systems against GDPR principles",
    sourceName: "Belgian Data Protection Authority",
    sourceUrl:
      "https://www.autoriteprotectiondonnees.be/publications/artificial-intelligence-systems-and-the-gdpr---a-data-protection-perspective.pdf",
    sourceType: "regulator",
    publicationDate: "2020-01-28",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The Belgian DPA's AI systems and GDPR guidance explains how GDPR principles apply to AI, including lawful basis, transparency, fairness, data minimisation, purpose limitation, rights, and accountability.",
    whatHappened:
      "The authority published a data-protection perspective on AI systems to guide controllers and processors before the AI Act framework was finalised.",
    whyItMatters:
      "This remains an official Belgian baseline for AI/GDPR governance and supports the Belgian legal-database soft-law layer.",
    practicalImpact:
      "Belgian AI projects should document GDPR roles, purposes, lawful basis, minimisation choices, explainability, DPIAs, and accountability controls.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "data-protection", "belgium"],
    excerpt:
      "The Belgian DPA guidance addresses artificial intelligence systems from a data-protection perspective under the GDPR.",
  },
  {
    country: "European Union",
    title: "European Commission guidance explains GDPR restrictions on automated decision-making",
    sourceName: "European Commission",
    sourceUrl:
      "https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/dealing-citizens/are-there-restrictions-use-automated-decision-making_en",
    sourceType: "official",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The European Commission explains GDPR restrictions on decisions based solely on automated processing, including profiling, and the safeguards needed where exceptions apply.",
    whatHappened:
      "The Commission published practical GDPR guidance for organisations dealing with citizens and automated decision-making.",
    whyItMatters:
      "This adds an EU-wide explanatory layer that helps connect national automated-decision cases to the GDPR rulebook.",
    practicalImpact:
      "Organisations using automated decisions must identify whether Article 22 applies, document exceptions, provide safeguards, and support human intervention and contestation rights.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "automated-decision-making", "european-union"],
    excerpt:
      "The Commission guidance explains restrictions on automated decision-making and profiling under EU data-protection rules.",
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
    notes: "Official source added during EU legal-depth enrichment wave 8.",
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
      baselineKind: "eu_depth_wave8_case_law_decisions_guidance",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_depth_wave8_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_depth_wave8_backfill",
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
  const dryRun = boolEnv(process.env.EU_DEPTH_WAVE8_DRY_RUN, true);
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
  console.error(`[backfill-eu-depth-wave8] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
