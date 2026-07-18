import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, Jurisdiction } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "labor-social-law-ai-baseline";
const SOURCE_NAME = "AI labor and social law baseline";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation?view=database";
const DETECTED_AT = "2026-07-18T21:30:00.000Z";
const BACKFILL_TAG = "labor-social-law-baseline";

type LaborEntry = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceReference["sourceType"];
  sourceRole?: SourceReference["sourceRole"];
  jurisdiction: Jurisdiction;
  region: "Europe" | "United States" | "International";
  country?: string;
  publicationDate: string;
  developmentType: DevelopmentType;
  authorityType: AuthorityType;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  tags: string[];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
};

const entries: LaborEntry[] = [
  {
    id: "eu-platform-work-directive-algorithmic-management-2024",
    title: "EU Platform Work Directive regulates algorithmic management in platform work",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2024/2831/oj/eng",
    sourceType: "legislation",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2024-11-11",
    developmentType: "Statute",
    authorityType: "Binding law",
    summary:
      "Directive (EU) 2024/2831 creates EU-level platform-work rules covering employment-status presumptions and transparency, fairness, human oversight, safety, and accountability in algorithmic management.",
    whatHappened:
      "The EU adopted the Platform Work Directive, including a dedicated algorithmic-management chapter for digital labour platforms.",
    whyItMatters:
      "This is the core EU hard-law instrument for algorithmic management of platform workers and a central source for national transposition monitoring.",
    practicalImpact:
      "Platform companies should prepare for transparency duties, human oversight, limits on automated decisions, worker information rights, and national transposition measures.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "platform-work", "algorithmic-management", "workers-rights"],
    excerpt:
      "The Directive aims to improve working conditions and personal-data protection in platform work, including transparency and accountability in algorithmic management.",
    pinpoint: { CELEX: "32024L2831", article: "1" },
  },
  {
    id: "eu-ai-act-employment-worker-management-high-risk-2024",
    title: "EU AI Act treats employment, worker management and self-employment AI as high-risk",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    sourceType: "legislation",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2024-07-12",
    developmentType: "Regulation",
    authorityType: "Binding law",
    summary:
      "The EU AI Act classifies several employment, worker-management and self-employment AI systems as high-risk, including recruitment, selection, work allocation, performance evaluation and termination-related systems.",
    whatHappened:
      "Regulation (EU) 2024/1689 listed employment and worker-management use cases in Annex III as high-risk AI contexts.",
    whyItMatters:
      "This makes workplace AI one of the principal EU compliance domains for providers and deployers.",
    practicalImpact:
      "Employers and vendors should map HR, recruitment, monitoring, scheduling, promotion, discipline, and termination systems against high-risk AI obligations.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "ai-act", "high-risk-ai", "employment", "worker-management"],
    excerpt:
      "Annex III includes AI systems intended to be used in employment, workers management and access to self-employment.",
    pinpoint: { CELEX: "32024R1689", annex: "III", section: "4" },
  },
  {
    id: "gdpr-article-22-workplace-automated-decision-making-2016",
    title: "GDPR Article 22 remains a core EU safeguard for automated employment decisions",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679",
    sourceType: "legislation",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2016-05-04",
    developmentType: "Regulation",
    authorityType: "Binding law",
    summary:
      "GDPR Article 22 provides rights and safeguards around decisions based solely on automated processing that produce legal or similarly significant effects, including employment-related effects.",
    whatHappened:
      "The GDPR established automated-decision rules that continue to operate alongside the AI Act and Platform Work Directive.",
    whyItMatters:
      "Many workplace AI tools process personal data and affect hiring, performance, scheduling, discipline, pay, or dismissal.",
    practicalImpact:
      "Employers should assess lawful basis, transparency, meaningful information, human intervention, contestation rights, DPIAs, and Article 22 applicability before deploying workplace AI.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "gdpr", "article-22", "automated-decision-making", "employment"],
    excerpt:
      "Article 22 gives data subjects rights around decisions based solely on automated processing that significantly affect them.",
    pinpoint: { CELEX: "32016R0679", article: "22" },
  },
  {
    id: "ep-algorithmic-management-workplace-rules-2025",
    title: "European Parliament calls for EU rules on algorithmic management at work",
    sourceName: "European Parliament",
    sourceUrl:
      "https://www.europarl.europa.eu/news/en/press-room/20251110IPR31358/meps-call-for-new-rules-on-the-use-of-algorithmic-management-at-work",
    sourceType: "parliament",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2025-11-10",
    developmentType: "Government announcement",
    authorityType: "Proposed law",
    summary:
      "MEPs called for new EU rules on algorithmic management in ordinary employment relationships, including information rights, worker-data protection, and human control over employment-related decisions.",
    whatHappened:
      "The Parliament press release announced support for a dedicated approach to algorithmic management at work beyond platform work.",
    whyItMatters:
      "This is a current legislative-policy signal that workplace AI regulation may expand beyond the Platform Work Directive.",
    practicalImpact:
      "Employers should monitor whether the Commission proposes a workplace algorithmic-management directive and prepare for stronger worker information and human-oversight rights.",
    tags: ["official-source", "proposed-law", BACKFILL_TAG, "algorithmic-management", "workplace-ai", "parliament"],
    excerpt:
      "MEPs said employees should be informed and no one should be fired by algorithms.",
  },
  {
    id: "eprs-digitalisation-ai-algorithmic-management-workplace-2025",
    title: "European Parliament study maps AI and algorithmic management in European workplaces",
    sourceName: "European Parliament Research Service",
    sourceUrl: "https://www.europarl.europa.eu/thinktank/en/document/EPRS_STU(2025)774670",
    sourceType: "policy",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2025-11-01",
    developmentType: "Policy report",
    authorityType: "Policy report",
    summary:
      "An EPRS study analysed AI and algorithmic management technologies in European workplaces beyond platform work and identified regulatory gaps and worker-protection issues.",
    whatHappened:
      "The study examined the EU framework, stakeholder evidence and sector case studies in logistics, healthcare, telecoms, automotive and manufacturing.",
    whyItMatters:
      "It gives the legal database a serious institutional evidence base for non-platform workplace AI regulation.",
    practicalImpact:
      "Monitoring should use the study to identify labour-law gaps around transparency, worker consultation, bias, privacy, work intensity and redress.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "eprs", "workplace-ai", "regulatory-gaps"],
    excerpt:
      "The study investigates integration and effects of AI and algorithmic management technologies within European workplaces, extending beyond platform work.",
  },
  {
    id: "jrc-ampwork-algorithmic-management-monitoring-2025",
    title: "JRC AMPWORK monitors algorithmic management and digital monitoring of work",
    sourceName: "European Commission Joint Research Centre",
    sourceUrl:
      "https://joint-research-centre.ec.europa.eu/projects-and-activities/employment/algorithmic-management-and-digital-monitoring-work_en",
    sourceType: "policy",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2025-10-21",
    developmentType: "Policy report",
    authorityType: "Policy report",
    summary:
      "The Commission's JRC AMPWORK project monitors algorithmic management and digital work monitoring across the EU.",
    whatHappened:
      "JRC describes algorithmic management as use of algorithms for planning, organisation, command, coordination and control of labour.",
    whyItMatters:
      "This is an official EU empirical monitoring source for workplace AI prevalence and social-law risk.",
    practicalImpact:
      "Country agents should track JRC outputs for evidence on workplace surveillance, algorithmic coordination, job quality, privacy, autonomy and work intensity.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "jrc", "ampwork", "digital-monitoring", "job-quality"],
    excerpt:
      "The JRC AMPWORK study monitors algorithmic management in the EU and digital monitoring of work.",
  },
  {
    id: "commission-ai-tools-workers-survey-2025",
    title: "Commission reports one in three EU workers use AI tools at work",
    sourceName: "European Commission DG Employment, Social Affairs and Inclusion",
    sourceUrl:
      "https://employment-social-affairs.ec.europa.eu/news/survey-results-show-one-three-eu-workers-use-ai-tools-work-2025-10-21_en",
    sourceType: "government",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2025-10-21",
    developmentType: "Government announcement",
    authorityType: "Policy report",
    summary:
      "The Commission reported JRC survey results showing that 30% of EU workers use AI tools and that digital monitoring and algorithmic management are now major workplace issues.",
    whatHappened:
      "DG Employment published a news item summarising survey results from more than 70,000 workers across all 27 Member States.",
    whyItMatters:
      "It is an official live-policy signal for the scale of workplace AI adoption and future social-law enforcement needs.",
    practicalImpact:
      "Monitoring should connect these data to AI Act high-risk employment rules, GDPR workplace safeguards, collective consultation and national labour-inspectorate action.",
    tags: ["official-source", "legal-news", BACKFILL_TAG, "jrc-survey", "workplace-ai", "digital-monitoring"],
    excerpt:
      "The Commission reported that 90% of workers use digital devices and 30% use AI tools such as chatbots powered by large language models.",
  },
  {
    id: "eurofound-regulatory-responses-algorithmic-management-eu-2024",
    title: "Eurofound maps regulatory responses to algorithmic management in the EU",
    sourceName: "Eurofound",
    sourceUrl:
      "https://www.eurofound.europa.eu/en/publications/all/regulatory-responses-algorithmic-management-eu",
    sourceType: "policy",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    publicationDate: "2024-04-01",
    developmentType: "Policy report",
    authorityType: "Policy report",
    summary:
      "Eurofound mapped EU and national responses to algorithmic management and noted the interaction between platform work, data privacy and labour rights.",
    whatHappened:
      "The EU agency published analysis on how algorithmic management is regulated through EU and national labour, platform-work and data-protection instruments.",
    whyItMatters:
      "This provides a country-by-country discovery map for building national social-law AI databases.",
    practicalImpact:
      "Country agents should use Eurofound as a pointer to national laws, consultations and collective-bargaining developments, but verify each legal item against official national sources.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "eurofound", "member-state-monitoring", "algorithmic-management"],
    excerpt:
      "Eurofound describes national regulations on algorithmic management and their connection with platform work, data privacy and the EU policy framework.",
  },
  {
    id: "eeoc-ada-ai-assess-job-applicants-employees-2022",
    title: "EEOC guidance addresses ADA risks in AI tools assessing job applicants and employees",
    sourceName: "U.S. Equal Employment Opportunity Commission",
    sourceUrl:
      "https://www.eeoc.gov/laws/guidance/americans-disabilities-act-and-use-software-algorithms-and-artificial-intelligence",
    sourceType: "regulator",
    jurisdiction: "United States federal",
    region: "United States",
    country: "United States",
    publicationDate: "2022-05-12",
    developmentType: "Agency guidance",
    authorityType: "Agency guidance",
    summary:
      "EEOC technical assistance explains how the ADA can apply to software, algorithms and AI used to assess job applicants and employees.",
    whatHappened:
      "The EEOC issued guidance warning employers about disability discrimination, reasonable accommodations, medical inquiries and algorithmic screening tools.",
    whyItMatters:
      "This is a core U.S. workplace-AI official source for the labor/social-law domain.",
    practicalImpact:
      "Employers using AI for hiring or employee assessment should evaluate ADA compliance, accommodation workflows, bias risks and vendor tool documentation.",
    tags: ["official-source", "agency-guidance", BACKFILL_TAG, "eeoc", "ada", "hiring", "employee-assessment"],
    excerpt:
      "EEOC guidance covers the ADA and use of software, algorithms and artificial intelligence to assess job applicants and employees.",
  },
  {
    id: "eeoc-workers-ada-ai-tools-2023",
    title: "EEOC worker guidance explains ADA protections against AI employment tools",
    sourceName: "U.S. Equal Employment Opportunity Commission",
    sourceUrl:
      "https://www.eeoc.gov/laws/guidance/tips-workers-americans-disabilities-act-and-use-software-algorithms-and-artificial",
    sourceType: "regulator",
    jurisdiction: "United States federal",
    region: "United States",
    country: "United States",
    publicationDate: "2023-05-18",
    developmentType: "Agency guidance",
    authorityType: "Agency guidance",
    summary:
      "EEOC worker-facing guidance explains how employees and applicants can request accommodation or challenge disability-related issues from AI employment tools.",
    whatHappened:
      "The EEOC published practical worker guidance on software, algorithms and AI used in employment decisions.",
    whyItMatters:
      "It complements employer-facing guidance and strengthens the database's worker-rights side.",
    practicalImpact:
      "Workers and counsel can use the guidance to identify accommodation requests, screening barriers and potential ADA violations in AI-driven hiring or assessment.",
    tags: ["official-source", "agency-guidance", BACKFILL_TAG, "eeoc", "worker-rights", "ada", "hiring"],
    excerpt:
      "The EEOC explains tips for workers regarding the ADA and use of software, algorithms and artificial intelligence.",
  },
];

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function rawIdentity(entry: LaborEntry) {
  return `${BACKFILL_TAG}:${entry.id}:v1`;
}

function sourceReferenceType(entry: LaborEntry): SourceReference["sourceType"] {
  if (entry.sourceType === "court" || entry.sourceType === "regulator" || entry.sourceType === "media_source") {
    return entry.sourceType;
  }
  return "official";
}

function buildSourceReference(entry: LaborEntry): SourceReference {
  return {
    sourceRole: entry.sourceRole ?? "primary",
    title: entry.title,
    institution: entry.sourceName,
    url: entry.sourceUrl,
    canonicalUrl: entry.sourceUrl,
    sourceType: sourceReferenceType(entry),
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedAt: DETECTED_AT,
    retrievedAt: DETECTED_AT,
    lastVerifiedAt: DETECTED_AT,
    jurisdiction: entry.jurisdiction,
    documentType: entry.developmentType,
    excerpt: entry.excerpt,
    pinpoint: entry.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes: "Official or EU-institutional source used for the labor/social-law AI database.",
  };
}

function buildRawItem(entry: LaborEntry): RawRegulatoryItemInput {
  const reference = buildSourceReference(entry);
  const rawText = [entry.summary, "", entry.whatHappened, "", entry.whyItMatters, "", entry.practicalImpact].join(
    "\n",
  );

  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "labor_social_law_ai",
      sourceReferences: [reference],
      officialSourceUrls: [entry.sourceUrl],
      publicationPolicy: "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: true,
        parserUsed: "labor_social_law_baseline_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "labor_social_law_baseline_backfill",
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

function buildUpdate(entry: LaborEntry, rawItemId: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: entry.title,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    jurisdiction: entry.jurisdiction,
    region: entry.region,
    country: entry.country ?? entry.jurisdiction,
    developmentType: entry.developmentType,
    legalArea: "Labor and social law",
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedDate: DETECTED_AT,
    oneSentenceSummary: entry.summary.slice(0, 240),
    summary: entry.summary,
    whatHappened: entry.whatHappened,
    whyItMatters: entry.whyItMatters,
    practicalImpact: entry.practicalImpact,
    affectedParties: [
      "Employers",
      "Workers and applicants",
      "Digital labour platforms",
      "HR technology vendors",
      "Labour and data-protection regulators",
    ],
    keyObligations: [
      "Treat workplace AI, hiring, platform-work and algorithmic-management items as labor/social-law issues, even when data protection or AI Act rules also apply.",
      "Preserve official source URL, jurisdiction, date, authority type and pinpoint citation before treating an item as verified legal authority.",
      "Route media-only labour AI signals to live news/discovery unless confirmed by official legal or regulator sources.",
    ],
    complianceDeadlines:
      entry.id === "eu-platform-work-directive-algorithmic-management-2024"
        ? ["2026-12-02: Member States must transpose Directive (EU) 2024/2831 into national law."]
        : [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because this is binding law affecting AI use in employment, worker management, or platform work."
        : "Medium to high relevance because this shapes labour/social-law oversight, regulator expectations, or legislative development around workplace AI.",
    importanceLevel: entry.authorityType === "Binding law" ? "critical" : "high",
    confidenceLevel: "high",
    tags: [
      BACKFILL_TAG,
      "official-source",
      "legal-area:Labor and social law",
      `authority:${entry.authorityType}`,
      ...entry.tags,
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
      "Curated official AI labor/social-law baseline covering employment, workplace AI, platform work, worker rights, algorithmic management and HR AI.",
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
  const dryRun = boolEnv(process.env.LABOR_SOCIAL_LAW_BASELINE_DRY_RUN, true);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(50000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) await ensureSource();

  for (const entry of entries) {
    const rawItem = buildRawItem(entry);
    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

    if (dryRun) {
      results.push({
        id: entry.id,
        status: "dry_run",
        jurisdiction: entry.jurisdiction,
        authorityType: entry.authorityType,
      });
      continue;
    }

    if (existingRaw) {
      await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRaw.id);
      if (existingUpdate) {
        results.push({ id: entry.id, status: "skipped_existing_update", updateId: existingUpdate.id });
        continue;
      }
      const created = await updateRepository.createUpdate(buildUpdate(entry, existingRaw.id));
      results.push({ id: entry.id, status: "created_update_for_existing_raw_item", updateId: created.id });
      continue;
    }

    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(entry, createdRaw.id));
    existingRawItems.push(createdRaw);
    updateByRawItemId.set(createdRaw.id, createdUpdate);
    results.push({
      id: entry.id,
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
    `[backfill-labor-social-law-baseline] failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
