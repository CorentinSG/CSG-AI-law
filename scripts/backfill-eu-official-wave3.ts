import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, LegalArea, Jurisdiction } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "country-legal-deepener";
const SOURCE_NAME = "Country legal database deepener";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe";
const DETECTED_AT = "2026-07-16T00:00:00.000Z";

type OfficialWaveEntry = {
  country: Jurisdiction;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceReference["sourceType"];
  sourceRole?: SourceReference["sourceRole"];
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
    country: "Croatia",
    title: "Croatia notified AI Act fundamental-rights competent authorities",
    sourceName: "Croatian Ministry of Justice, Public Administration and Digital Transformation",
    sourceUrl:
      "https://mpudt.gov.hr/news-25399/list-of-competent-authorities-under-artificial-inteligence-act-notified/29658",
    sourceType: "government",
    publicationDate: "2024-11-04",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Croatia published the list of public authorities competent under Article 77(2) of the EU AI Act for fundamental-rights supervision and enforcement in relation to high-risk AI systems.",
    whatHappened:
      "The ministry stated that Croatia had designated and notified competent authorities under the AI Act Article 77(2) framework.",
    whyItMatters:
      "This is a direct national AI Act authority-map milestone, moving Croatia beyond a generic institutional baseline.",
    practicalImpact:
      "AI deployers and public bodies in Croatia can identify the national fundamental-rights authority layer relevant to high-risk AI systems.",
    tags: ["country-deep-entry", "official-source", "authority-designation", "timeline-event", "croatia"],
    excerpt:
      "Croatia designated bodies as competent authorities under Article 77(2) of the AI Act and notified the list to the Commission and Member States.",
  },
  {
    country: "Poland",
    title: "Polish DPA comments on draft Act on artificial intelligence systems",
    sourceName: "Polish Personal Data Protection Office (UODO)",
    sourceUrl: "https://uodo.gov.pl/en/553/1848",
    sourceType: "regulator",
    publicationDate: "2024-12-23",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "UODO published comments warning that Poland's draft AI systems act must properly reflect the DPA's GDPR and AI Act role, including Article 74(8) market-surveillance considerations.",
    whatHappened:
      "The Polish DPA set out concerns on the draft AI systems act, including overlap between AI Act supervision and personal-data protection competences.",
    whyItMatters:
      "The comments identify live implementation issues around institutional competence, market surveillance, fundamental rights, and judicial review.",
    practicalImpact:
      "Polish AI Act implementation tracking should monitor whether final legislation preserves the DPA's independent role for personal-data aspects of AI systems.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "implementation-layer", "poland"],
    excerpt:
      "UODO stated that the draft act should take account of the supervisory authority's position under the AI Act and GDPR.",
  },
  {
    country: "Poland",
    title: "UODO discusses cooperation with Poland's new AI regulator",
    sourceName: "Polish Personal Data Protection Office (UODO)",
    sourceUrl: "https://uodo.gov.pl/en/553/2204",
    sourceType: "regulator",
    publicationDate: "2026-06-18",
    developmentType: "Government announcement",
    legalArea: "Data protection",
    authorityType: "Governance framework",
    summary:
      "UODO reported that its president discussed cooperation with the new AI regulator, the Commission for the Development and Safety of Artificial Intelligence, and procedural coordination issues.",
    whatHappened:
      "The Polish DPA described an official 2026 discussion of AI Act deadlines, the proposed AI regulatory structure, and cooperation between digital regulators.",
    whyItMatters:
      "This is a current governance signal for Poland's AI authority architecture and the relationship between AI regulation and data-protection enforcement.",
    practicalImpact:
      "The Polish country timeline should track regulator-coordination issues alongside the draft AI systems act.",
    tags: ["country-deep-entry", "official-source", "timeline-event", "authority-designation", "poland"],
    excerpt:
      "UODO described cooperation with the new AI regulator and the need for consistency among bodies overseeing digital regulation and AI systems.",
  },
  {
    country: "Denmark",
    title: "Danish Agency for Digital Government explains AI Act rules and timeline",
    sourceName: "Danish Agency for Digital Government",
    sourceUrl: "https://digst.dk/tilsyn/ai-forordningen/reglerne-i-ai-forordningen/",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "Denmark's digital authority explains the phased application of the EU AI Act, including February 2025 application for AI literacy and prohibited practices and August 2026 application for most rules.",
    whatHappened:
      "The Danish authority published a national guidance page explaining core AI Act obligations, actors, risk categories, and transition dates.",
    whyItMatters:
      "This gives Denmark a concrete official AI Act compliance guidance layer, beyond general digital-strategy monitoring.",
    practicalImpact:
      "Danish businesses and public authorities can use this official page as a first national reference for AI Act applicability and timelines.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "denmark"],
    excerpt:
      "The page explains that the AI Act entered into force in 2024 and applies in phases through 2027.",
  },
  {
    country: "Denmark",
    title: "Danish DPA and Digital Government Agency operate an AI regulatory sandbox",
    sourceName: "Danish Data Protection Agency",
    sourceUrl: "https://www.datatilsynet.dk/regler-og-vejledning/kunstig-intelligens",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Soft law",
    summary:
      "The Danish DPA states that it and the Agency for Digital Government have established an AI regulatory sandbox providing free guidance on GDPR and AI Act risk classification.",
    whatHappened:
      "Denmark's DPA identifies a regulatory sandbox for AI and data-protection guidance.",
    whyItMatters:
      "The sandbox is an operational soft-law and supervisory support mechanism for AI governance in Denmark.",
    practicalImpact:
      "Companies and authorities can seek supervisory guidance before deploying AI systems, especially on GDPR and AI Act risk classification.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "denmark"],
    excerpt:
      "Datatilsynet says the sandbox offers free expertise and guidance on GDPR and risk classification under the AI Regulation.",
  },
  {
    country: "Finland",
    title: "Traficom publishes national guidance on the EU AI Act",
    sourceName: "Finnish Transport and Communications Agency Traficom",
    sourceUrl: "https://traficom.fi/en/ai-regulation/about-eu-artificial-intelligence-act",
    sourceType: "regulator",
    publicationDate: "2026-01-07",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "Traficom explains the EU AI Act's purpose and national customer-service channel for data, AI, and data-governance regulations.",
    whatHappened:
      "Finland's Traficom published a dedicated national AI Act guidance page updated in January 2026.",
    whyItMatters:
      "This is a concrete official source for Finland's AI Act implementation and compliance guidance layer.",
    practicalImpact:
      "Finnish AI providers, deployers, and public-sector teams have an official national gateway for AI Act questions.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "finland"],
    excerpt:
      "Traficom explains that the AI Act promotes trustworthy AI and protects health, safety, and fundamental rights.",
  },
  {
    country: "Finland",
    title: "Traficom describes AI Act regulatory sandboxes",
    sourceName: "Finnish Transport and Communications Agency Traficom",
    sourceUrl: "https://traficom.fi/en/ai-regulation/ai-regulatory-sandboxes",
    sourceType: "regulator",
    publicationDate: "2026-04-13",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Soft law",
    summary:
      "Traficom describes AI regulatory sandboxes as an AI Act tool for controlled experimentation and testing under competent-authority supervision.",
    whatHappened:
      "Finland published official sandbox guidance tied directly to the EU AI Act.",
    whyItMatters:
      "The sandbox layer matters for innovation support, supervisory engagement, and pre-market compliance testing.",
    practicalImpact:
      "Finnish AI innovators can track sandbox access and supervisory-testing expectations as part of AI Act readiness.",
    tags: ["country-deep-entry", "official-source", "soft-law-layer", "timeline-event", "finland"],
    excerpt:
      "Traficom states that sandboxes are controlled experimentation and testing environments under competent-authority supervision.",
  },
  {
    country: "Finland",
    title: "Finnish automated decision-making legislation applies to Traficom decisions",
    sourceName: "Finnish Transport and Communications Agency Traficom",
    sourceUrl: "https://traficom.fi/en/about-traficom/privacy-policy/automated-decisions-traficom",
    sourceType: "regulator",
    publicationDate: "2026-04-01",
    developmentType: "Statute",
    legalArea: "Automated decision-making",
    authorityType: "Binding law",
    summary:
      "Traficom explains that automated decision-making is governed by Finland's Administrative Procedure Act and Act on Information Management in Public Administration, with requirements in force since 1 May 2023.",
    whatHappened:
      "Traficom published a public explanation of the legal basis, documentation, monitoring, and appeal safeguards for automated decisions.",
    whyItMatters:
      "This gives Finland a national hard-law automated decision-making layer connected to AI and public-sector use, separate from the EU AI Act.",
    practicalImpact:
      "Public-sector automated decisions in Finland must be documented, legally assessed, monitored, and communicated with safeguards and appeal routes.",
    tags: ["country-deep-entry", "official-source", "implementation-layer", "case-law-layer", "finland"],
    excerpt:
      "Traficom states that automated decision-making legislation entered into force on 1 May 2023 and sets design, documentation, deployment, monitoring, and liability requirements.",
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
    sourceRole: entry.sourceRole ?? "primary",
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
    notes: "Official source added during EU official-source enrichment wave 3.",
  };
}

function rawIdentity(entry: OfficialWaveEntry) {
  return `eu-official-wave3:${String(entry.country).toLowerCase()}:${slugify(entry.title)}:${stableHash(entry.sourceUrl).slice(0, 12)}:v1`;
}

function buildRawItem(entry: OfficialWaveEntry): RawRegulatoryItemInput {
  const rawText = [entry.summary, "", entry.whatHappened, "", entry.excerpt].join("\n");
  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "eu_official_wave3_country_deepening",
      sourceReferences: [sourceReferenceFor(entry)],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_official_wave3_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_official_wave3_backfill",
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
      "Preserve the distinction between national implementation, soft law, authority designation, and case-law layers.",
      "Continue monitoring for final legal texts, administrative decisions, and supervisory updates.",
    ],
    complianceDeadlines: [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because the entry records binding national law or statutory automated-decision requirements."
        : "Medium monitoring relevance; enforcement risk depends on the underlying AI Act implementation or regulator practice.",
    importanceLevel: entry.authorityType === "Binding law" ? "high" : "medium",
    confidenceLevel: "high",
    tags: [
      ...entry.tags,
      `authority:${entry.authorityType}`,
      `source-type:${entry.sourceType}`,
      "eu-official-wave3",
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
  const dryRun = boolEnv(process.env.EU_OFFICIAL_WAVE3_DRY_RUN, true);
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
    `[backfill-eu-official-wave3] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
