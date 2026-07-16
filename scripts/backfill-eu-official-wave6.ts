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
const DETECTED_AT = "2026-07-16T01:30:00.000Z";
const WAVE_TAG = "eu-official-wave6";

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
    country: "Estonia",
    title: "Estonia expands the Eesti.ai national AI programme",
    sourceName: "Estonian Government Office",
    sourceUrl: "https://www.riigikantselei.ee/en/news/eestiai-board-gains-three-new-members",
    sourceType: "government",
    publicationDate: "2026-03-11",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Estonia's Government Office describes Eesti.ai as a national initiative to increase the value of work and grow the economy through systematic application of AI.",
    whatHappened:
      "The Government Office announced new board members and said the programme focuses on a small number of high-impact public-private AI projects.",
    whyItMatters:
      "This gives Estonia a current official AI governance and public-sector implementation programme layer while AI Act authority designations remain less explicit.",
    practicalImpact:
      "Estonian AI monitoring should track Eesti.ai work plans, public-sector pilots, and how programme governance intersects with EU AI Act implementation.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "estonia"],
    excerpt:
      "The Government Office says Eesti.ai aims to increase the value of work and grow the economy through systematic application of AI.",
  },
  {
    country: "Estonia",
    title: "Estonia's RIA develops Aruait rules for autonomous AI agents in the public sector",
    sourceName: "Estonian Information System Authority (RIA)",
    sourceUrl: "https://www.ria.ee/en/reason-reserve-aruait",
    sourceType: "regulator",
    publicationDate: "2026-07-16",
    developmentType: "Agency guidance",
    legalArea: "Public sector use of AI",
    authorityType: "Governance framework",
    summary:
      "RIA describes Aruait as an innovation project to develop rules and technical foundations for safely deploying autonomous AI agents in Estonia's public sector.",
    whatHappened:
      "RIA published an official project page explaining why Aruait matters, what activities it covers, and how it supports public-sector AI agent deployment.",
    whyItMatters:
      "This adds a concrete operational governance layer for autonomous AI agents, a priority issue beyond generic AI strategy.",
    practicalImpact:
      "Estonian public bodies should monitor Aruait outputs for technical, accountability, and safety expectations before deploying autonomous AI agents.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "estonia"],
    excerpt:
      "RIA states that Aruait develops rules and technical foundations needed for the Estonian public sector to safely deploy autonomous AI agents.",
  },
  {
    country: "Romania",
    title: "Romania proposes ANCOM as AI Act supervisory authority and single national contact point",
    sourceName: "Romanian National Authority for Management and Regulation in Communications (ANCOM)",
    sourceUrl:
      "https://www.ancom.ro/en/about-us/media-en/press-releases/code-of-practice-on-transparency-of-ai-generated-content/",
    sourceType: "regulator",
    publicationDate: "2026-06-18",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "ANCOM states that the Romanian Government proposed it, through a memorandum, as national supervisory authority and single national point of contact for AI Act implementation.",
    whatHappened:
      "ANCOM announced its support for an AI-generated content transparency code and disclosed the government's proposed AI Act supervisory role for the authority.",
    whyItMatters:
      "This provides a concrete Romanian AI Act authority-designation signal from the proposed regulator itself.",
    practicalImpact:
      "Romanian monitoring should track whether the ANCOM proposal is formalised in binding legislation and how sector regulators such as data-protection and financial authorities are coordinated.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "romania"],
    excerpt:
      "ANCOM states that the Romanian Government proposed it as national supervisory authority and single point of contact for Regulation (EU) 2024/1689.",
  },
  {
    country: "Romania",
    title: "Romania publishes National Artificial Intelligence Strategy 2024-2027",
    sourceName: "Romanian Ministry of Research, Innovation and Digitalisation",
    sourceUrl: "https://www.mcid.gov.ro/wp-content/uploads/2024/03/SN-IA-final.pdf",
    sourceType: "government",
    publicationDate: "2024-03-01",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Romania's National Artificial Intelligence Strategy 2024-2027 sets policy priorities for AI adoption, public-sector capacity, standardisation, operationalisation, and regulation.",
    whatHappened:
      "The ministry published the final national AI strategy document, including governance, public administration, research, skills, and regulatory objectives.",
    whyItMatters:
      "The strategy anchors Romania's AI policy baseline while the AI Act competent-authority framework is being formalised.",
    practicalImpact:
      "Romanian legal monitoring should separate this policy layer from binding enforcement rules and track strategy-linked action plans and legislation.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "romania"],
    excerpt:
      "The strategy supports Romanian public administration efforts around AI standardisation, operationalisation, and regulation.",
  },
  {
    country: "Slovenia",
    title: "Slovenia adopts national act implementing the EU AI Act",
    sourceName: "Slovenian Legal Information System (PISRS)",
    sourceUrl: "https://pisrs.si/pregledPredpisa?id=ZAKO9225",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Statute",
    legalArea: "AI governance",
    authorityType: "Binding law",
    summary:
      "Slovenia's national implementation act sets measures for Regulation (EU) 2024/1689 and establishes a national council for ethics in artificial intelligence.",
    whatHappened:
      "The official legal information system records the Act on implementing the EU AI Act, including provisions on the national AI ethics council.",
    whyItMatters:
      "This creates Slovenia's hard-law implementation layer and moves the country beyond a strategy-only profile.",
    practicalImpact:
      "Slovenian AI providers and deployers should track competent authorities, ethics-council activity, enforcement provisions, and implementation measures under the act.",
    tags: ["country-deep-entry", "official-source", "implementation-layer", "timeline-event", "slovenia"],
    excerpt:
      "The Slovenian act regulates measures for implementing Regulation 2024/1689/EU and establishes a national council for ethics in AI.",
  },
  {
    country: "Slovenia",
    title: "Slovenia identifies competent authorities for AI Act supervision",
    sourceName: "Slovenian Ministry of Digital Transformation",
    sourceUrl:
      "https://www.gov.si/novice/2025-10-24-slovenija-med-vodilnimi-pri-uvajanju-evropske-uredbe-o-umetni-inteligenci/",
    sourceType: "government",
    publicationDate: "2025-10-24",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Slovenia announced that its AI Act implementation law identifies multiple competent authorities for oversight and compliance across sectors.",
    whatHappened:
      "The government page lists ministries and regulators including the Ministry of Digital Transformation, AKOS, the Information Commissioner, Market Inspectorate, Insurance Supervision Agency, and Bank of Slovenia.",
    whyItMatters:
      "This gives Slovenia a concrete multi-authority supervision map under the AI Act.",
    practicalImpact:
      "Slovenian monitoring should track sector allocation among listed authorities and future guidance, sanctions, and sandbox activity.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "slovenia"],
    excerpt:
      "The government says the law determines competent bodies responsible for implementation and oversight of AI system compliance.",
  },
  {
    country: "Sweden",
    title: "Swedish inquiry proposes national AI Act supervision model",
    sourceName: "Government Offices of Sweden",
    sourceUrl:
      "https://www.regeringen.se/pressmeddelanden/2025/10/utredning-foreslar-forbud-mot-vissa-ai-system-och-sanktioner-for-bristande-dokumentation-av-hogrisk-ai/",
    sourceType: "government",
    publicationDate: "2025-10-06",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Proposed law",
    summary:
      "The Swedish AI inquiry proposed a market-supervision model under which PTS would have main responsibility, while IMY and Finansinspektionen share responsibilities for high-risk AI.",
    whatHappened:
      "The Government Offices announced that the inquiry had delivered its report on national adaptations to the EU AI Act, including bans, sanctions, market surveillance, and authority responsibilities.",
    whyItMatters:
      "This is Sweden's central national implementation proposal for AI Act enforcement and competent-authority allocation.",
    practicalImpact:
      "Swedish monitoring should track the consultation, final legislation, PTS/IMY/Finansinspektionen assignments, and sanctions for high-risk AI documentation failures.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "implementation-layer", "sweden"],
    excerpt:
      "The inquiry proposes that PTS receives main responsibility, while IMY and Finansinspektionen share responsibility for certain high-risk AI.",
  },
  {
    country: "Sweden",
    title: "Swedish IMY runs AI Act sandbox and GDPR guidance work",
    sourceName: "Swedish Authority for Privacy Protection (IMY)",
    sourceUrl:
      "https://www.imy.se/nyheter/forsta-delrapporten-fran-pilotprojekt-om-ai-regulatorisk-sandlada-publicerad/",
    sourceType: "regulator",
    publicationDate: "2024-06-12",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Soft law",
    summary:
      "IMY published the first interim report from an AI regulatory sandbox pilot run with Bolagsverket, Skatteverket and Arbetsförmedlingen.",
    whatHappened:
      "IMY explains that the AI Act requires each Member State to provide a sandbox where AI systems can be trained and tested in a controlled environment before use.",
    whyItMatters:
      "This adds Sweden's practical sandbox and data-protection supervision layer for AI deployment.",
    practicalImpact:
      "Swedish organisations should monitor IMY sandbox outputs for guidance on AI testing, GDPR, public-sector use, and controlled pre-deployment experimentation.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "sweden"],
    excerpt:
      "IMY says the AI Act requires a sandbox in each Member State for controlled testing and training of AI systems before use.",
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
    notes: "Official source added during EU official-source enrichment wave 6.",
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
      baselineKind: "eu_official_wave6_country_deepening",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_official_wave6_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_official_wave6_backfill",
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
      "Preserve the distinction between binding law, proposed law, authority designation, sandbox, and public-sector AI governance layers.",
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
  const dryRun = boolEnv(process.env.EU_OFFICIAL_WAVE6_DRY_RUN, true);
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
    `[backfill-eu-official-wave6] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
