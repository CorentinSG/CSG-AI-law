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
const DETECTED_AT = "2026-07-16T01:00:00.000Z";
const WAVE_TAG = "eu-official-wave4";

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
    country: "Greece",
    title: "Greece publishes AI Act Article 77 fundamental-rights authority list",
    sourceName: "Greek Ministry of Digital Governance",
    sourceUrl: "https://www.mindigital.gr/archives/6901",
    sourceType: "government",
    publicationDate: "2024-11-04",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Greece published the list of authorities protecting fundamental rights in relation to high-risk AI systems under Article 77 of the EU AI Act.",
    whatHappened:
      "The Ministry of Digital Governance stated that publication of the list fulfils Greece's first national AI Act implementation obligation and that the list was notified to the European Commission.",
    whyItMatters:
      "This gives the Greek database a concrete AI Act authority-designation milestone rather than only a general national AI strategy layer.",
    practicalImpact:
      "Deployers and public bodies using high-risk AI in Greece can identify the fundamental-rights authorities that may access compliance documentation from 2 August 2026.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "greece"],
    excerpt:
      "Greece published the Article 77 authority list, notified it to the Commission, and stated the additional powers will apply from 2 August 2026.",
  },
  {
    country: "Hungary",
    title: "Hungary sets AI Act institutional roles through Act LXXV and Government Decree 344/2025",
    sourceName: "Hungarian National Authority for Data Protection and Freedom of Information (NAIH)",
    sourceUrl: "https://www.naih.hu/data-protection/eu-digital-legislation",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "NAIH explains Hungary's EU digital legislation framework, including the Hungarian Artificial Intelligence Council and the designation of national AI Act functions.",
    whatHappened:
      "NAIH states that Act LXXV of 2025 and Government Decree 344/2025 create an AI Council guidance role, designate the National Economy Minister for market-supervision and single-contact-point tasks, and assign notifying-authority tasks to the National Accreditation Authority.",
    whyItMatters:
      "This records Hungary's national AI Act governance structure from an official supervisory source.",
    practicalImpact:
      "Hungarian AI monitoring should track AI Council guidance, market-supervision practice, single-contact-point operation, and accreditation/notified-body developments.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "implementation-layer", "hungary"],
    excerpt:
      "NAIH identifies the Hungarian AI Council, National Economy Minister, and National Accreditation Authority roles under Hungarian AI Act implementation measures.",
  },
  {
    country: "Latvia",
    title: "Latvia advances Artificial Intelligence Development Law and national AI Centre",
    sourceName: "Latvian Ministry of Economics",
    sourceUrl:
      "https://www.em.gov.lv/en/article/national-artificial-intelligence-center-innovative-solution-promote-research-and-development-foster-business-growth-and-attract-investment-field-artificial-intelligence",
    sourceType: "government",
    publicationDate: "2025-03-05",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Latvia announced that its National Artificial Intelligence Center would begin operations by 31 March 2025 and described the Artificial Intelligence Development Law moving through the Saeima.",
    whatHappened:
      "The Ministry of Economics described the AI Centre as a platform for research, public-sector and business cooperation, and noted that the law would simplify creation of an AI regulatory sandbox.",
    whyItMatters:
      "This adds a concrete Latvian institutional and sandbox milestone to the legal database.",
    practicalImpact:
      "Latvian monitoring should track the AI Centre, the Artificial Intelligence Development Law, and the special regulatory environment for AI testing.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "latvia"],
    excerpt:
      "The ministry stated that the AI Centre would start by 31 March 2025 and that the law would simplify creation of an AI sandbox.",
  },
  {
    country: "Lithuania",
    title: "Lithuania designates AI Act notifying and market-surveillance authorities",
    sourceName: "Lithuanian Ministry of the Economy and Innovation",
    sourceUrl: "https://eimin.lrv.lt/en/sector-activities/digital-policy/artificial-intelligence/",
    sourceType: "government",
    publicationDate: "2025-01-14",
    developmentType: "Statute",
    legalArea: "AI governance",
    authorityType: "Binding law",
    summary:
      "Lithuania states that Parliament adopted amendments on 14 January 2025 designating national competent authorities under the AI Act.",
    whatHappened:
      "The Innovation Agency was designated as notifying authority, while the Communications Regulatory Authority was appointed as market-surveillance authority and single contact point.",
    whyItMatters:
      "This is a national hard-law implementation layer for Lithuania's AI Act institutional architecture.",
    practicalImpact:
      "Lithuanian AI providers and deployers should monitor RRT guidance, Innovation Agency notified-body functions, and the Innovation Agency sandbox.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "implementation-layer", "lithuania"],
    excerpt:
      "Lithuania says the Innovation Agency is the notifying authority and RRT is the market-surveillance authority and single contact point.",
  },
  {
    country: "Luxembourg",
    title: "Luxembourg CNPD explains AI literacy obligation under the AI Act",
    sourceName: "Luxembourg National Data Protection Commission (CNPD)",
    sourceUrl:
      "https://cnpd.public.lu/en/dossiers-thematiques/intelligence-artificielle/regulation-ia/ria-maitrise-ia.html",
    sourceType: "regulator",
    publicationDate: "2025-02-02",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "CNPD published official guidance on the AI Act Article 4 AI literacy obligation, including training, documentation, risk awareness, and links to future supervision.",
    whatHappened:
      "The CNPD explains that AI literacy and prohibited-practices rules have applied since 2 February 2025 and that organisations should document staff skills and guidance initiatives.",
    whyItMatters:
      "This gives Luxembourg a practical AI Act compliance and data-protection supervisory layer, even while final national authority designations evolve.",
    practicalImpact:
      "Luxembourg employers and deployers should maintain AI literacy records and align training with the risks and contexts of AI systems used.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "luxembourg"],
    excerpt:
      "CNPD states that organisations must ensure a sufficient level of AI knowledge and should document training or guidance initiatives.",
  },
  {
    country: "Malta",
    title: "Malta designates MDIA and IDPC roles for EU AI Act implementation",
    sourceName: "Malta Digital Innovation Authority (MDIA)",
    sourceUrl: "https://mdia.gov.mt/services/artificial-intelligence/",
    sourceType: "regulator",
    publicationDate: "2025-10-10",
    developmentType: "Statute",
    legalArea: "AI governance",
    authorityType: "Binding law",
    summary:
      "MDIA explains Malta's AI Act implementation framework, including Legal Notice 226 of 2025 and Legal Notice 227 of 2025.",
    whatHappened:
      "MDIA is designated as lead market-surveillance authority, single point of contact, notifying authority, and authority responsible for the national AI regulatory sandbox, while IDPC has market-surveillance powers for law-enforcement AI systems.",
    whyItMatters:
      "This adds Malta's binding national AI Act implementation and authority-designation layer.",
    practicalImpact:
      "Maltese providers and deployers can identify MDIA and IDPC as the central AI Act supervisory touchpoints and monitor national sandbox access.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "implementation-layer", "malta"],
    excerpt:
      "MDIA states that Legal Notice 226 designates it as lead market-surveillance authority, single point of contact, notifying authority, and sandbox authority.",
  },
  {
    country: "Portugal",
    title: "Portugal maps national AI Act governance roles through digitalGOV",
    sourceName: "Portuguese digitalGOV portal",
    sourceUrl: "https://digital.gov.pt/en/estrategia-digital/regulamentacao/ai-act/modelo-de-governacao",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Portugal's digitalGOV portal explains the AI Act governance model and identifies Portuguese representatives in AI Board subgroups, including ANACOM for transparency and market-surveillance authority work.",
    whatHappened:
      "The portal states that national competent authorities supervise and enforce the AI Act, and lists ANACOM as Portugal's representative for transparency and market-surveillance authority subgroups.",
    whyItMatters:
      "This gives Portugal a government-backed governance/timeline source for AI Act implementation monitoring.",
    practicalImpact:
      "Portuguese AI monitoring should track ANACOM, ARTE, Banco de Portugal, the National Innovation Agency, and sectoral coordination as the national model matures.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "portugal"],
    excerpt:
      "digitalGOV lists Portuguese national representation for AI Board subgroups, including ANACOM for transparency and market-surveillance authorities.",
  },
  {
    country: "Slovakia",
    title: "Slovakia publishes AI Act Article 77 fundamental-rights authority list",
    sourceName: "Slovak Ministry of Investments, Regional Development and Informatization (MIRRI)",
    sourceUrl: "https://mirri.gov.sk/sekcie/informatizacia/jednotny-digitalny-trh/akt-o-umelej-inteligencii-aia/",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "MIRRI publishes Slovakia's Article 77 AI Act list of bodies protecting fundamental rights, including the Office for Personal Data Protection and the Public Defender of Rights.",
    whatHappened:
      "Slovakia identified bodies protecting fundamental rights under the AI Act while the broader national AI Act implementation framework continues to develop.",
    whyItMatters:
      "This adds an official Article 77 milestone for Slovakia and a clear source for fundamental-rights oversight monitoring.",
    practicalImpact:
      "Slovak AI deployers should track data-protection and ombudsman oversight for high-risk AI systems affecting fundamental rights.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "slovakia"],
    excerpt:
      "MIRRI lists the Office for Personal Data Protection and the Public Defender of Rights as Article 77 fundamental-rights bodies.",
  },
  {
    country: "Slovakia",
    title: "Slovakia presents draft AI law for national AI Act supervision",
    sourceName: "Slovak Ministry of Investments, Regional Development and Informatization (MIRRI)",
    sourceUrl:
      "https://mirri.gov.sk/aktuality/digitalna-agenda/zodpovedna-digitalizacia-mirri-predstavilo-navrhy-zakonov-o-umelej-inteligencii-a-sprave-udajov/",
    sourceType: "government",
    publicationDate: "2025-08-01",
    developmentType: "Bill",
    legalArea: "AI governance",
    authorityType: "Proposed law",
    summary:
      "MIRRI announced draft legislation to apply key provisions of Regulation (EU) 2024/1689 and set Slovakia's institutional framework for AI system supervision.",
    whatHappened:
      "The ministry sent the draft AI law to interdepartmental consultation and described its goal as implementing national supervision and sanctions for AI systems.",
    whyItMatters:
      "This gives Slovakia a live legislative timeline item beyond the Article 77 authority list.",
    practicalImpact:
      "The Slovak country monitor should track final adoption, effective dates, supervisory designations, and sanctions under the draft AI law.",
    tags: ["country-deep-entry", "official-source", "implementation-layer", "timeline-event", "slovakia"],
    excerpt:
      "MIRRI states the draft AI law defines the institutional arrangement and supervision framework for AI systems in Slovakia.",
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
    notes: "Official source added during EU official-source enrichment wave 4.",
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
      baselineKind: "eu_official_wave4_country_deepening",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_official_wave4_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_official_wave4_backfill",
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
      "Preserve the distinction between national implementation, soft law, authority designation, and timeline layers.",
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
  const dryRun = boolEnv(process.env.EU_OFFICIAL_WAVE4_DRY_RUN, true);
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
    `[backfill-eu-official-wave4] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
