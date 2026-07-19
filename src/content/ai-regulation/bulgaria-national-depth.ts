import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type BulgariaNationalDepthEntry = {
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
    detectedAt: "2026-07-19T02:00:00.000Z",
    retrievedAt: "2026-07-19T02:00:00.000Z",
    lastVerifiedAt: "2026-07-19T02:00:00.000Z",
    jurisdiction: "Bulgaria",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Bulgaria national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<BulgariaNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): BulgariaNationalDepthEntry {
  const tags = ["bulgaria-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Bulgaria",
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

export const bulgariaNationalDepthEntries = [
  entry({
    title: "Bulgaria's AI Concept 2030 sets the national trustworthy-AI policy baseline",
    sourceName: "Bulgarian Ministry of Transport, Information Technology and Communications",
    sourceUrl:
      "https://www.mtc.government.bg/sites/default/files/conceptforthedevelopmentofaiinbulgariauntil2030.pdf",
    sourceType: "government",
    publicationDate: "2020-10-01",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Bulgaria's Concept for the Development of Artificial Intelligence until 2030 is the national AI strategy layer for smart growth, trustworthy AI, research, skills, innovation, infrastructure and public-sector deployment.",
    whatHappened:
      "The official concept defines Bulgaria's AI-BG vision, strategic goals and implementation areas, including regulatory trust, data availability, research capacity and AI use in public administration.",
    whyItMatters:
      "Until Bulgaria completes more detailed AI Act institutional design, this concept is the national policy anchor for AI governance and monitoring.",
    practicalImpact:
      "Country monitoring should map Bulgarian AI Act measures, authority designations, public-sector AI initiatives and funding programmes against the AI-BG concept.",
    excerpt:
      "The concept identifies measures for AI infrastructure, research capacity, skills, innovation, trust and a regulatory framework for reliable AI.",
    tags: ["ai-strategy", "ai-bg", "trustworthy-ai", "public-sector-ai"],
  }),
  entry({
    title: "Bulgaria's open-government AI standards commitment targets trustworthy public-sector AI",
    sourceName: "Open Government Partnership / Republic of Bulgaria commitment record",
    sourceUrl: "https://www.opengovpartnership.org/members/bulgaria/commitments/BG0082/",
    sourceType: "government",
    publicationDate: "2022-01-01",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Bulgaria's open-government commitment on standards for AI use records a national public-sector AI governance effort linked to the AI Concept 2030, human rights and administrative use of AI systems.",
    whatHappened:
      "The commitment describes a working-group model under e-government policy and calls for human-rights organisations to participate in AI standards development.",
    whyItMatters:
      "This is a practical national governance signal for AI standards in Bulgarian administration, separate from EU-level AI Act obligations.",
    practicalImpact:
      "Public-sector AI monitoring should track whether Bulgarian ministries publish standards, impact safeguards, working-group outputs and implementation evidence.",
    excerpt:
      "The commitment links AI standards to Bulgaria's AI Concept 2030 and to rights and safety safeguards for AI systems.",
    tags: ["open-government", "ai-standards", "human-rights", "egovernment"],
  }),
  entry({
    title: "Bulgarian CPDP lists Article 22 automated decision-making among key business obligations",
    sourceName: "Commission for Personal Data Protection of Bulgaria (CPDP/KZLD)",
    sourceUrl:
      "https://cpdp.bg/%D0%BA%D0%BB%D1%8E%D1%87%D0%BE%D0%B2%D0%B8-%D0%B7%D0%B0%D0%B4%D1%8A%D0%BB%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%B1%D0%B8%D0%B7%D0%BD%D0%B5%D1%81%D0%B0/",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Bulgaria's data-protection authority identifies the right not to be subject to automated decision-making, including profiling, as a key GDPR obligation for businesses.",
    whatHappened:
      "CPDP/KZLD's business-obligations material includes Article 22 GDPR alongside core controller obligations and data-subject rights.",
    whyItMatters:
      "This gives Bulgaria a national regulator guidance layer for AI systems that process personal data or produce automated decisions.",
    practicalImpact:
      "Bulgarian AI deployers should document GDPR rights, transparency, lawful basis, DPIA analysis and safeguards before using automated decision workflows.",
    excerpt:
      "CPDP/KZLD lists the right not to be subject to automated decision-making, including profiling, under Article 22 GDPR.",
    tags: ["gdpr", "cpdp", "article-22", "business-obligations"],
  }),
  entry({
    title: "Bulgaria's DSM copyright amendments add text-and-data-mining rules for AI training analysis",
    sourceName: "Bulgarian National Assembly / State Gazette",
    sourceUrl: "https://dv.parliament.bg/DVWeb/showMaterialDV.jsp?idMat=201485",
    sourceType: "legislation",
    publicationDate: "2023-12-01",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Bulgaria amended its Copyright and Neighbouring Rights Act to implement the DSM Directive, including text-and-data-mining exceptions relevant to AI training and generative-AI copyright analysis.",
    whatHappened:
      "The amendments introduced TDM provisions into Bulgarian copyright law, including research and broader lawful-access uses subject to rights-reservation limits.",
    whyItMatters:
      "Bulgarian AI training and rights-reservation questions must be assessed under national TDM provisions as well as EU DSM and AI Act GPAI duties.",
    practicalImpact:
      "AI model developers and rights holders should check lawful access, opt-outs, research status, retention, database rights and national copyright exceptions in Bulgaria.",
    excerpt:
      "The Bulgarian DSM implementation added text-and-data-mining exceptions to the national copyright framework.",
    pinpoint: { section: "Copyright and Neighbouring Rights Act TDM amendments" },
    tags: ["copyright", "text-and-data-mining", "generative-ai", "dsm-directive"],
  }),
  entry({
    title: "Bulgaria's AI Concept 2030 frames cloud, data and high-performance infrastructure for AI",
    sourceName: "Bulgarian Ministry of Transport, Information Technology and Communications",
    sourceUrl:
      "https://www.mtc.government.bg/sites/default/files/conceptforthedevelopmentofaiinbulgariauntil2030.pdf",
    sourceType: "government",
    publicationDate: "2020-10-01",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "Bulgaria's AI Concept 2030 treats data infrastructure, cloud, high-performance computing and research infrastructure as enabling conditions for national AI development.",
    whatHappened:
      "The concept calls for modern communications, cloud infrastructure, data storage and exchange centres, open scientific data and use of national high-performance computing assets.",
    whyItMatters:
      "AI governance depends on data, compute and cloud capacity; this gives Bulgaria a national infrastructure anchor to connect with EU Data Act and cloud/data-space monitoring.",
    practicalImpact:
      "Monitoring should track Bulgarian cloud, HPC, open-data, public-sector data reuse and research-infrastructure measures that operationalise the AI-BG plan.",
    excerpt:
      "The concept says efforts will focus on efficient cloud infrastructure, data storage and exchange centres, EOSC access and national high-performance computing capacity.",
    tags: ["cloud", "infrastructure", "hpc", "open-data", "ai-bg"],
  }),
  entry({
    title: "Bulgaria's Labour Code now defines algorithmic management for remote work",
    sourceName: "Bulgarian Ministry of Labour and Social Policy",
    sourceUrl: "https://www.mlsp.government.bg/uploads/37/politiki/trud/zakonodatelstvo/eng/kt-eng-0824.pdf",
    sourceType: "legislation",
    publicationDate: "2024-03-29",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Bulgaria's Labour Code amendments define an information system for algorithmic management and add transparency and human-review duties for remote-work algorithmic decisions.",
    whatHappened:
      "State Gazette No. 27/2024 amendments require written information about remote-work data processing, algorithmic decision-making and review of algorithmic-management decisions on worker request.",
    whyItMatters:
      "This is a concrete national Bulgarian labour-law anchor for algorithmic management, beyond generic EU AI Act employment-system risk classification.",
    practicalImpact:
      "Bulgarian employers using automated systems for remote-work assignment, reporting or control should document the decision logic, data collected and human-review process.",
    excerpt:
      "The Labour Code defines an information system for algorithmic management as automated decision-making when assigning, reporting and controlling employees' work.",
    pinpoint: { section: "Labour Code Article 107h and supplementary definition item 24" },
    tags: ["algorithmic-management", "remote-work", "labour-code", "worker-rights"],
  }),
  entry({
    title: "Bulgarian CPDP guidance maps Article 22 rights for automated individual decisions",
    sourceName: "Commission for Personal Data Protection of Bulgaria (CPDP/KZLD)",
    sourceUrl:
      "https://cpdp.bg/home-default/%D0%BF%D0%BE%D0%BB%D0%B5%D0%B7%D0%BD%D0%B0-%D0%B8%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F/%D0%BF%D1%80%D0%B0%D0%B2%D0%B0-%D0%BD%D0%B0-%D1%84%D0%B8%D0%B7%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D1%82%D0%B5-%D0%BB%D0%B8%D1%86%D0%B0/",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Automated decision-making",
    authorityType: "Agency guidance",
    summary:
      "Bulgaria's CPDP/KZLD explains data-subject rights, including information about automated decision-making and profiling under GDPR.",
    whatHappened:
      "The authority's rights guidance requires information about the existence of automated decision-making, including profiling, where applicable.",
    whyItMatters:
      "This is Bulgaria's national data-protection guidance layer for automated credit, hiring, welfare, insurance and other AI-supported decisions.",
    practicalImpact:
      "Bulgarian controllers should provide meaningful information about automated decision logic, consequences and rights, and maintain contestation and human-review pathways.",
    excerpt:
      "CPDP/KZLD's data-subject rights material includes information about automated decision-making, including profiling, where such processing exists.",
    tags: ["automated-decision-making", "profiling", "article-22", "data-subject-rights"],
  }),
] as const satisfies readonly BulgariaNationalDepthEntry[];
