import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "eu-country-domain-baseline";
const SOURCE_NAME = "EU country domain baseline";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation/europe";
const DETECTED_AT = "2026-07-18T21:45:00.000Z";
const BACKFILL_TAG = "eu-country-domain-baseline";

const euCountries = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
] as const satisfies readonly Jurisdiction[];

type DomainTemplate = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceReference["sourceType"];
  publicationDate: string;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  authorityType: AuthorityType;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  tags: string[];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  complianceDeadlines?: string[];
};

const domainTemplates: DomainTemplate[] = [
  {
    id: "ai-act-country-layer",
    title: "EU AI Act country compliance layer",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    sourceType: "legislation",
    publicationDate: "2024-07-12",
    developmentType: "Regulation",
    legalArea: "AI governance",
    authorityType: "Binding law",
    summary:
      "Regulation (EU) 2024/1689 applies as the EU AI Act layer for this Member State, while national implementation measures designate authorities, penalties, sandboxes and local supervision.",
    whatHappened:
      "The EU adopted harmonised AI rules that apply across Member States, including prohibited practices, high-risk AI duties, transparency obligations and GPAI rules.",
    whyItMatters:
      "Every EU country database needs a country-specific AI Act layer so national pages do not appear empty while local implementation measures are still being collected.",
    practicalImpact:
      "Country monitoring should connect this EU layer to national competent-authority designations, market-surveillance authorities, notifying authorities, penalty rules and sandbox programmes.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "ai-act", "country-domain-layer"],
    excerpt:
      "The AI Act lays down harmonised rules on artificial intelligence and applies across the EU, with national implementation and enforcement layers to be tracked country by country.",
    pinpoint: { CELEX: "32024R1689" },
  },
  {
    id: "gdpr-article-22-country-layer",
    title: "GDPR automated-decision and data-protection country layer",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679",
    sourceType: "legislation",
    publicationDate: "2016-05-04",
    developmentType: "Regulation",
    legalArea: "Data protection",
    authorityType: "Binding law",
    summary:
      "GDPR rules, including Article 22 automated-decision safeguards and data-protection principles, form the baseline for AI systems processing personal data in this Member State.",
    whatHappened:
      "The GDPR established EU-wide data-protection rights, controller obligations and supervisory enforcement for personal-data processing.",
    whyItMatters:
      "AI systems often process personal data; national data-protection authority guidance, sanctions and case law should be linked back to this EU baseline.",
    practicalImpact:
      "Country agents should track DPA guidance, enforcement, DPIA practice, Article 22 disputes and national court decisions on automated decision-making.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "gdpr", "article-22", "country-domain-layer"],
    excerpt:
      "The GDPR sets EU-wide data-protection rules and safeguards around automated decisions that produce legal or similarly significant effects.",
    pinpoint: { CELEX: "32016R0679", article: "22" },
  },
  {
    id: "data-act-cloud-country-layer",
    title: "EU Data Act cloud switching and interoperability country layer",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2854",
    sourceType: "legislation",
    publicationDate: "2023-12-22",
    developmentType: "Regulation",
    legalArea: "Cloud and infrastructure",
    authorityType: "Binding law",
    summary:
      "Regulation (EU) 2023/2854 creates EU Data Act rules relevant to cloud and data-processing services, including switching, interoperability and contractual fairness.",
    whatHappened:
      "The EU adopted the Data Act, adding obligations for providers of data-processing services and cloud switching arrangements.",
    whyItMatters:
      "AI deployment depends on cloud, compute and data infrastructure; every country database needs the EU infrastructure layer before national cloud measures are added.",
    practicalImpact:
      "Cloud and AI infrastructure monitoring should track provider switching obligations, interoperability, contractual terms, data access and national enforcement designations.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "data-act", "cloud", "infrastructure", "country-domain-layer"],
    excerpt:
      "The Data Act regulates access to and use of data and includes obligations affecting data-processing services, cloud switching and interoperability.",
    pinpoint: { CELEX: "32023R2854" },
  },
  {
    id: "dsm-tdm-copyright-country-layer",
    title: "DSM copyright and text-and-data-mining country layer",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0790",
    sourceType: "legislation",
    publicationDate: "2019-05-17",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Directive (EU) 2019/790 provides the EU copyright and text-and-data-mining baseline that interacts with generative AI training, rights reservations and creative-sector disputes.",
    whatHappened:
      "The DSM Copyright Directive created text-and-data-mining exceptions and rightsholder reservation mechanisms later tied to AI Act GPAI copyright obligations.",
    whyItMatters:
      "Generative AI disputes over training data, licensing and creative works depend on both EU copyright law and each Member State's transposition and case law.",
    practicalImpact:
      "Country agents should link national copyright transposition, rights-reservation practice, litigation and creative-sector guidance to this EU baseline.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "copyright", "text-and-data-mining", "country-domain-layer"],
    excerpt:
      "The DSM Directive includes text-and-data-mining exceptions and rights-reservation mechanisms relevant to generative AI training on protected works.",
    pinpoint: { CELEX: "32019L0790", article: "3-4" },
  },
  {
    id: "platform-work-algorithmic-management-country-layer",
    title: "Platform Work Directive algorithmic-management country layer",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2024/2831/oj/eng",
    sourceType: "legislation",
    publicationDate: "2024-11-11",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Directive (EU) 2024/2831 creates a country-by-country transposition layer for platform work, employment status and algorithmic management.",
    whatHappened:
      "The EU adopted platform-work rules including algorithmic-management transparency, human oversight and worker protections.",
    whyItMatters:
      "This is the main EU labour/social-law instrument for AI-driven platform management and must be tracked through national transposition.",
    practicalImpact:
      "Country agents should track labour-ministry proposals, national transposition laws, platform-work enforcement, collective bargaining and regulator guidance.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "platform-work", "algorithmic-management", "country-domain-layer"],
    excerpt:
      "The Platform Work Directive improves working conditions and personal-data protection in platform work, including algorithmic-management rules.",
    pinpoint: { CELEX: "32024L2831" },
    complianceDeadlines: [
      "2026-12-02: Member States must transpose Directive (EU) 2024/2831 into national law.",
    ],
  },
  {
    id: "cjeu-schufa-case-law-country-layer",
    title: "CJEU SCHUFA Article 22 case-law country layer",
    sourceName: "Court of Justice of the European Union",
    sourceUrl: "https://curia.europa.eu/juris/liste.jsf?num=C-634/21",
    sourceType: "court",
    publicationDate: "2023-12-07",
    developmentType: "Other official regulatory development",
    legalArea: "Automated decision-making",
    authorityType: "Binding law",
    summary:
      "CJEU Case C-634/21 SCHUFA is an EU-wide Article 22 automated-decision precedent relevant to AI scoring, profiling and materially determinative automated outputs.",
    whatHappened:
      "The Court held that automated probability values may fall within GDPR Article 22 where third parties draw strongly on them for decisions affecting individuals.",
    whyItMatters:
      "Every Member State database needs the EU case-law layer while national courts and regulators build local automated-decision precedents.",
    practicalImpact:
      "Country agents should track national applications of SCHUFA to credit scoring, employment screening, welfare, insurance, platform work and other AI-driven decisions.",
    tags: ["official-source", "case-law-layer", BACKFILL_TAG, "cjeu", "schufa", "article-22", "country-domain-layer"],
    excerpt:
      "SCHUFA is a central CJEU judgment on automated probability values and GDPR Article 22 automated decision-making.",
    pinpoint: { caseNumber: "C-634/21", ECLI: "EU:C:2023:957" },
  },
];

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function rawIdentity(country: Jurisdiction, template: DomainTemplate) {
  return `${BACKFILL_TAG}:${country}:${template.id}:v1`;
}

function sourceReferenceType(template: DomainTemplate): SourceReference["sourceType"] {
  if (template.sourceType === "court" || template.sourceType === "regulator" || template.sourceType === "media_source") {
    return template.sourceType;
  }
  return "official";
}

function buildSourceReference(country: Jurisdiction, template: DomainTemplate): SourceReference {
  return {
    sourceRole: "primary",
    title: `${country}: ${template.title}`,
    institution: template.sourceName,
    url: template.sourceUrl,
    canonicalUrl: template.sourceUrl,
    sourceType: sourceReferenceType(template),
    authorityType: template.authorityType,
    publicationDate: template.publicationDate,
    detectedAt: DETECTED_AT,
    retrievedAt: DETECTED_AT,
    lastVerifiedAt: DETECTED_AT,
    jurisdiction: country,
    documentType: template.developmentType,
    excerpt: template.excerpt,
    pinpoint: template.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Official EU-law layer distributed into a Member State profile. It must be complemented with national implementation measures and national case law where available.",
  };
}

function buildRawItem(country: Jurisdiction, template: DomainTemplate): RawRegulatoryItemInput {
  const reference = buildSourceReference(country, template);
  const rawText = [
    `${country} country layer.`,
    template.summary,
    "",
    template.whatHappened,
    "",
    template.whyItMatters,
    "",
    template.practicalImpact,
  ].join("\n");

  return {
    sourceId: SOURCE_ID,
    rawTitle: `${country}: ${template.title}`,
    rawUrl: template.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "eu_country_domain_baseline",
      country,
      sourceReferences: [reference],
      officialSourceUrls: [template.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "eu_country_domain_baseline_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_country_domain_baseline_backfill",
        contentHash: stableHash(`${rawIdentity(country, template)}:${rawText}`),
        rawUrlScanned: template.sourceUrl,
      },
    },
    detectedAt: DETECTED_AT,
    hash: stableHash(rawIdentity(country, template)),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(country: Jurisdiction, template: DomainTemplate, rawItemId: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: `${country}: ${template.title}`,
    sourceName: template.sourceName,
    sourceUrl: template.sourceUrl,
    jurisdiction: country,
    region: "Europe",
    country,
    developmentType: template.developmentType,
    legalArea: template.legalArea,
    authorityType: template.authorityType,
    publicationDate: template.publicationDate,
    detectedDate: DETECTED_AT,
    oneSentenceSummary: `${country}: ${template.summary}`.slice(0, 240),
    summary: `${country}: ${template.summary}`,
    whatHappened: template.whatHappened,
    whyItMatters: template.whyItMatters,
    practicalImpact: template.practicalImpact,
    affectedParties: [
      "AI providers and deployers",
      "National competent authorities",
      "Data protection authorities",
      "Employers and workers",
      "Cloud and digital service providers",
      "Creative-sector rights holders",
    ],
    keyObligations: [
      "Treat this as the official EU-law layer for the country, not as proof that national implementation is complete.",
      "Add national legislation, authority designations, sanctions, guidance and case law as separate country-specific entries when verified from official sources.",
      "Keep the legal-area classification so country pages can be filtered by AI governance, data protection, cloud, copyright, labor/social law and case law.",
    ],
    complianceDeadlines: template.complianceDeadlines ?? [],
    enforcementRisk:
      template.authorityType === "Binding law"
        ? "High relevance because this official EU legal layer applies to the Member State or requires national implementation."
        : "High relevance because this official EU case-law or policy layer informs national monitoring and enforcement.",
    importanceLevel: template.authorityType === "Binding law" ? "critical" : "high",
    confidenceLevel: "high",
    tags: [
      BACKFILL_TAG,
      "official-source",
      "eu-law-country-layer",
      `country:${country}`,
      `legal-area:${template.legalArea}`,
      `authority:${template.authorityType}`,
      ...template.tags,
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
    sourceType: "legislative_database",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes:
      "Generated official EU-law country-domain baseline for all EU Member States. These entries seed each country page with EU-level legal layers and must be deepened with national official sources.",
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
  const dryRun = boolEnv(process.env.EU_COUNTRY_DOMAIN_BASELINE_DRY_RUN, true);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(50000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) await ensureSource();

  for (const country of euCountries) {
    for (const template of domainTemplates) {
      const rawItem = buildRawItem(country, template);
      const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

      if (dryRun) {
        results.push({
          country,
          id: template.id,
          status: "dry_run",
          legalArea: template.legalArea,
          authorityType: template.authorityType,
        });
        continue;
      }

      if (existingRaw) {
        await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
        const existingUpdate = updateByRawItemId.get(existingRaw.id);
        if (existingUpdate) {
          results.push({
            country,
            id: template.id,
            status: "skipped_existing_update",
            updateId: existingUpdate.id,
          });
          continue;
        }
        const created = await updateRepository.createUpdate(buildUpdate(country, template, existingRaw.id));
        results.push({ country, id: template.id, status: "created_update_for_existing_raw_item", updateId: created.id });
        continue;
      }

      const createdRaw = await updateRepository.createRawItem(rawItem);
      const createdUpdate = await updateRepository.createUpdate(buildUpdate(country, template, createdRaw.id));
      existingRawItems.push(createdRaw);
      updateByRawItemId.set(createdRaw.id, createdUpdate);
      results.push({
        country,
        id: template.id,
        status: "created",
        updateId: createdUpdate.id,
        updateStatus: createdUpdate.status,
      });
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun,
        appDataMode: env.APP_DATA_MODE,
        countryCount: euCountries.length,
        templateCount: domainTemplates.length,
        entryCount: euCountries.length * domainTemplates.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-eu-country-domain-baseline] failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
