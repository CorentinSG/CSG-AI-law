import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type EstoniaNationalDepthEntry = {
  country: Jurisdiction;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publicationDate: string | null;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  authorityType: AuthorityType;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  tags: string[];
  sourceReference: SourceReference;
};

function officialReference(input: {
  title: string;
  institution: string;
  url: string;
  sourceType: SourceReference["sourceType"];
  authorityType: AuthorityType;
  publicationDate: string | null;
  documentType: DevelopmentType;
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
}): SourceReference {
  const persistedSourceType =
    input.sourceType === "court" ||
    input.sourceType === "regulator" ||
    input.sourceType === "standards_body" ||
    input.sourceType === "discovery_source" ||
    input.sourceType === "media_source" ||
    input.sourceType === "tracker"
      ? input.sourceType
      : "official";

  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: persistedSourceType,
    authorityType: input.authorityType,
    publicationDate: input.publicationDate,
    detectedAt: "2026-07-19T03:45:00.000Z",
    retrievedAt: "2026-07-19T03:45:00.000Z",
    lastVerifiedAt: "2026-07-19T03:45:00.000Z",
    jurisdiction: "Estonia",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Estonia national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<EstoniaNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): EstoniaNationalDepthEntry {
  const tags = ["estonia-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Estonia",
    title: input.title,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    publicationDate: input.publicationDate,
    developmentType: input.developmentType,
    legalArea: input.legalArea,
    authorityType: input.authorityType,
    summary: input.summary,
    whatHappened: input.whatHappened,
    whyItMatters: input.whyItMatters,
    practicalImpact: input.practicalImpact,
    tags,
    sourceReference: officialReference({
      title: input.title,
      institution: input.sourceName,
      url: input.sourceUrl,
      sourceType: input.sourceType,
      authorityType: input.authorityType,
      publicationDate: input.publicationDate,
      documentType: input.developmentType,
      excerpt: input.excerpt,
      pinpoint: input.pinpoint,
    }),
  };
}

export const estoniaNationalDepthEntries: EstoniaNationalDepthEntry[] = [
  entry({
    title: "Estonia's Kratid portal keeps the national AI strategy baseline live while a third strategy is prepared",
    sourceName: "Ministry of Justice and Digital Affairs of Estonia / Kratid",
    sourceUrl: "https://www.kratid.ee/en/kratt-visioon",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Estonia's official Kratid portal identifies the 2022-2023 National AI Strategy as the operative continuation of the first AI strategy while the AI Task Force prepares a third strategy for 2024-2026.",
    whatHappened:
      "The portal says the first strategy began under the Ministry of Economic Affairs and Communications and the Government Office, and that current activity continues under the 2022-2023 strategy pending the next strategy.",
    whyItMatters:
      "This is Estonia's national AI governance baseline for AI Act implementation monitoring, public-sector AI, AI literacy, data governance and business adoption measures.",
    practicalImpact:
      "Estonian AI monitoring should treat the Kratid strategy page as a policy watchpoint and separately track any published 2024-2026 strategy, AI Act authority designations and binding implementing acts.",
    excerpt:
      "The Kratid portal states that the AI Task Force is working on the third National AI Strategy for 2024-2026 and that activities continue under the 2022-2023 strategy until release.",
    pinpoint: { section: "Vision and strategies" },
    tags: ["ai-strategy", "kratt", "kratt-ai", "ai-task-force"],
  }),
  entry({
    title: "RIA's Burokratt programme anchors Estonia's public-sector virtual-assistant governance",
    sourceName: "Estonian Information System Authority (RIA)",
    sourceUrl: "https://www.ria.ee/en/state-information-system/artificial-intelligence/burokratt",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "RIA describes Burokratt as a citizen-facing virtual assistant for public services that is already used by multiple public-sector institutions and managed by the Information System Authority.",
    whatHappened:
      "The official RIA page says Burokratt understands everyday Estonian, is available around the clock if needed, routes unresolved questions to customer service, and is used by national agencies, local authorities and public portals.",
    whyItMatters:
      "Burokratt is a concrete national public-sector AI deployment layer, making Estonia's AI governance practical rather than only strategic.",
    practicalImpact:
      "Public bodies using or integrating Burokratt should document chatbot scope, escalation to humans, data-protection notices, procurement controls, accessibility and future AI Act risk classification.",
    excerpt:
      "RIA says Burokratt is a virtual assistant for citizens, several public-sector institutions already use it, and RIA manages its development.",
    pinpoint: { section: "Burokratt" },
    tags: ["burokratt", "public-sector-ai", "virtual-assistant", "ria"],
  }),
  entry({
    title: "Estonian DPA DPIA guidance flags profiling and automated evaluation as high-risk processing",
    sourceName: "Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon)",
    sourceUrl: "https://www.aki.ee/en/guidelines-legislation/cross-border-data-protection-impact-assessment",
    sourceType: "regulator",
    publicationDate: "2024-01-16",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The Estonian Data Protection Inspectorate's cross-border DPIA list explains that DPIAs are required where processing is likely to create high risk and identifies profiling, systematic automated evaluation and employee monitoring as examples.",
    whatHappened:
      "AKI links its list to GDPR Article 35 and WP248 DPIA criteria, covering automated profiling that significantly affects individuals, large-scale monitoring and employment-context employee activity monitoring.",
    whyItMatters:
      "This gives Estonia a national GDPR risk-assessment layer for AI systems using profiling, scoring, employee monitoring, biometric data or other high-risk personal-data processing.",
    practicalImpact:
      "Estonian controllers and processors deploying AI should assess DPIA triggers early, document proportionality and safeguards, and keep the analysis aligned with AI Act risk classification.",
    excerpt:
      "AKI's DPIA page lists profiling by automated processing and large-scale systematic evaluation producing legal or significant effects as a GDPR Article 35 example.",
    pinpoint: { section: "Cross-border data protection impact assessment list" },
    tags: ["aki", "gdpr", "dpia", "profiling"],
  }),
  entry({
    title: "Estonia's 2025 Digital Decade roadmap links AI, cloud, data infrastructure and business digitalisation",
    sourceName: "Ministry of Justice and Digital Affairs of Estonia",
    sourceUrl:
      "https://www.justdigi.ee/sites/default/files/documents/2025-03/Estonian%20National%20Digital%20Decade%20Strategic%20Roadmap%202025.pdf",
    sourceType: "policy",
    publicationDate: "2025-03-01",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "Estonia's 2025 Digital Decade roadmap frames digital infrastructure, AI, machine learning, big data, smart things, cybersecurity and business digitalisation as connected national priorities.",
    whatHappened:
      "The roadmap reports Estonia's digital-state strengths and identifies measures for enterprise use of big data, AI and technology, including AI development programmes, digitalisation roadmaps, robotics support and AIRE.",
    whyItMatters:
      "AI deployment depends on cloud, data, cybersecurity and compute-adjacent infrastructure; this roadmap is Estonia's national infrastructure-policy anchor for the EU Digital Decade layer.",
    practicalImpact:
      "Cloud, data and AI vendors should track Estonian Digital Decade measures, RIA security methodology, AIRE support, SME grants and public-service infrastructure priorities.",
    excerpt:
      "The roadmap lists artificial intelligence and machine learning, data science and big data, smart things, cybersecurity, AIRE and measures increasing enterprise use of big data and AI.",
    pinpoint: { section: "Objective III - Digitalisation of businesses" },
    tags: ["digital-decade", "cloud", "infrastructure", "aire"],
  }),
  entry({
    title: "Estonia's Copyright Act implements text-and-data-mining provisions relevant to AI training",
    sourceName: "Riigi Teataja",
    sourceUrl: "https://www.riigiteataja.ee/en/eli/520032025012/consolide",
    sourceType: "legislation",
    publicationDate: "2025-03-20",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Estonia's consolidated Copyright Act includes text-and-data-mining terminology and provisions that form the national DSM-era copyright layer for AI training and generative-AI analysis.",
    whatHappened:
      "Riigi Teataja's English consolidated Copyright Act identifies text and data mining as automated analysis of digital text and data, tying Estonian law to the DSM Directive's TDM framework.",
    whyItMatters:
      "Generative-AI training, dataset creation and rights-reservation questions in Estonia must be assessed under Estonian copyright law as well as the EU DSM Directive and AI Act GPAI copyright duties.",
    practicalImpact:
      "AI developers and rights holders should check lawful access, TDM conditions, reservations of rights, research status, retention rules and database-right interactions before using Estonian-protected content.",
    excerpt:
      "Riigi Teataja's English Copyright Act states that text and data mining means an automated analytical technique for analysing text and data in digital form.",
    pinpoint: { section: "Copyright Act text and data mining provisions" },
    tags: ["copyright", "text-and-data-mining", "dsm-directive", "generative-ai"],
  }),
  entry({
    title: "Estonian Labour Inspectorate guidance regulates telework agreements, monitoring and safety controls",
    sourceName: "Tooelu portal / Estonian Labour Inspectorate",
    sourceUrl: "https://www.tooelu.ee/en/34/what-teleworking-when-teleworking-possible",
    sourceType: "regulator",
    publicationDate: "2024-04-01",
    developmentType: "Agency guidance",
    legalArea: "Labor and social law",
    authorityType: "Agency guidance",
    summary:
      "The official Tooelu telework guidance explains that teleworking is agreement-based, should be written, remains under employer management and control, and requires attention to work organisation, monitoring, data protection and safety.",
    whatHappened:
      "The guidance says telework agreements should address how duties are assigned and monitored, working-time adherence, data protection and privacy, work equipment, and working-environment risk assessment.",
    whyItMatters:
      "AI-enabled scheduling, productivity analytics, employee monitoring and remote-management tools in Estonia sit against this labour-law and occupational-safety guidance.",
    practicalImpact:
      "Employers using workplace AI should document telework terms, monitoring limits, working-time controls, data-protection safeguards, risk assessments and employee instructions before deployment.",
    excerpt:
      "The Tooelu guidance says teleworking is based on party agreement, should be in writing, and should address monitoring, data protection, work equipment and risk assessment.",
    pinpoint: { section: "Teleworking agreement and risk assessment" },
    tags: ["telework", "labour-inspectorate", "employee-monitoring", "workplace-ai"],
  }),
  entry({
    title: "Estonian DPA reprimand shows automated verification and fraud scoring need transparent data-subject responses",
    sourceName: "European Data Protection Board / Estonian Data Protection Inspectorate",
    sourceUrl: "https://www.edpb.europa.eu/system/files/2025-04/ee-2024-08-decision-public.pdf",
    sourceType: "regulator",
    publicationDate: "2024-08-16",
    developmentType: "Enforcement action",
    legalArea: "Automated decision-making",
    authorityType: "Enforcement action",
    summary:
      "The Estonian Data Protection Inspectorate reprimanded a controller after an automated identity-verification and fraud-monitoring workflow was not explained to a data subject within GDPR response deadlines.",
    whatHappened:
      "The decision describes automatic verification triggered by suspicious payment activity and concludes that the controller violated GDPR Articles 12(3) and 15(1) by failing to provide a comprehensive timely response.",
    whyItMatters:
      "The case is a practical Estonian enforcement signal for automated verification, fraud scoring and decision-support systems that affect account access or service use.",
    practicalImpact:
      "Controllers should prepare intelligible explanations, Article 15 response workflows, legal-basis records, escalation playbooks and safeguards for automated verification or fraud-monitoring systems.",
    excerpt:
      "The decision describes automatic identity verification triggered by suspicious payment transactions and reprimands the controller for GDPR Articles 12(3) and 15(1) failures.",
    pinpoint: { docket: "2.1.-1/23/1226-2996-10" },
    tags: ["aki", "enforcement", "automated-verification", "article-15"],
  }),
];
