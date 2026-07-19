import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type CyprusNationalDepthEntry = {
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
    detectedAt: "2026-07-19T03:20:00.000Z",
    retrievedAt: "2026-07-19T03:20:00.000Z",
    lastVerifiedAt: "2026-07-19T03:20:00.000Z",
    jurisdiction: "Cyprus",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Cyprus national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<CyprusNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): CyprusNationalDepthEntry {
  const tags = ["cyprus-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Cyprus",
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

export const cyprusNationalDepthEntries: CyprusNationalDepthEntry[] = [
  entry({
    title: "Cyprus's National AI Strategy establishes the national trustworthy-AI policy baseline",
    sourceName: "Deputy Ministry of Research, Innovation and Digital Policy of Cyprus",
    sourceUrl: "https://www.gov.cy/dmrid/en/documents/national-strategy-for-artificial-intelligence/",
    sourceType: "government",
    publicationDate: "2024-04-09",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Cyprus publishes its National Strategy for Artificial Intelligence as the national policy anchor for AI integration, data spaces, talent and trustworthy AI.",
    whatHappened:
      "The Deputy Ministry's official document page hosts the National Strategy for Artificial Intelligence and connects it to strategic planning for AI in Cyprus.",
    whyItMatters:
      "This gives Cyprus a national AI governance baseline beyond the EU AI Act country-domain layer and identifies the domestic policy frame for AI adoption.",
    practicalImpact:
      "AI providers, public authorities and compliance teams should monitor this strategy for Cyprus-specific AI Act implementation, governance and support measures.",
    excerpt:
      "The official document page publishes Cyprus's National Strategy for Artificial Intelligence under strategic planning materials.",
    pinpoint: { section: "National Strategy for Artificial Intelligence" },
    tags: ["ai-strategy", "trustworthy-ai", "digital-policy", "national-data-space"],
  }),
  entry({
    title: "Cyprus's Digital Decade roadmap links AI, cloud adoption and national digital infrastructure",
    sourceName: "Deputy Ministry of Research, Innovation and Digital Policy of Cyprus",
    sourceUrl: "https://www.gov.cy/media/sites/13/2024/04/DD-2030-Cyprus-Report_final.docx.pdf",
    sourceType: "policy",
    publicationDate: "2024-04-01",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "Cyprus's National Digital Decade Strategic Roadmap tracks enterprise adoption of cloud, big data and AI and describes the AI Unit/Sector inside the Deputy Ministry.",
    whatHappened:
      "The roadmap sets 2030 digital targets and measures for digital infrastructure, business digitalisation, public services and advanced technology adoption.",
    whyItMatters:
      "This is Cyprus's national infrastructure-policy bridge between AI uptake, cloud services, digital public services and implementation capacity.",
    practicalImpact:
      "Cloud and AI vendors should track roadmap measures, AI Unit activity, enterprise adoption targets and public-sector digitisation projects affecting Cyprus deployments.",
    excerpt:
      "The roadmap reports cloud-services adoption targets and notes the AI Unit/Sector within the Deputy Ministry.",
    pinpoint: { section: "National Digital Decade Strategic Roadmap" },
    tags: ["digital-decade", "cloud", "big-data", "ai-unit"],
  }),
  entry({
    title: "Cyprus DPA's DPIA list treats profiling and new technologies as high-risk processing",
    sourceName: "Office of the Commissioner for Personal Data Protection of Cyprus",
    sourceUrl:
      "https://www.dataprotection.gov.cy/DATAPROTECTION/DATAPROTECTION.NSF/ED786DE02E8020FCC225826000377143/%24file/Indicative%20DPIA%20list.pdf",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Cyprus's data-protection authority lists profiling from public social-media data and new-technology processing among processing operations that can require a DPIA.",
    whatHappened:
      "The Commissioner's indicative DPIA list flags profiling and use of new technologies as risk areas for controllers.",
    whyItMatters:
      "This gives Cyprus a national GDPR risk-assessment layer for AI systems that profile individuals or use novel data-processing technology.",
    practicalImpact:
      "Cypriot AI deployers should assess DPIA triggers early, especially where systems profile individuals, scrape public data or introduce new decision technologies.",
    excerpt:
      "The indicative DPIA list includes profiling from public social-media data and the use of new technologies for data processing.",
    pinpoint: { section: "Indicative DPIA list" },
    tags: ["dpa", "dpia", "profiling", "new-technologies"],
  }),
  entry({
    title: "Cyprus DPA complaint forms operationalise Article 22 automated-decision rights",
    sourceName: "Office of the Commissioner for Personal Data Protection of Cyprus",
    sourceUrl:
      "https://www.dataprotection.gov.cy/dataprotection/dataprotection.nsf/59EA353334A12A41C225826000291BFC/%24file/Complaint%20form%20A%20rights%20ENG%20v2.docx",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Automated decision-making",
    authorityType: "Agency guidance",
    summary:
      "The Cyprus DPA complaint form covers data-subject-rights complaints under GDPR Articles 12-22, including automated individual decision-making and profiling.",
    whatHappened:
      "The Commissioner's rights complaint channel explicitly routes complaints involving Article 22 automated decision-making and profiling.",
    whyItMatters:
      "This makes automated-decision rights administratively actionable in Cyprus and gives AI deployers a concrete enforcement-risk signal.",
    practicalImpact:
      "Controllers using AI decisions in Cyprus should document human intervention, contestability, meaningful information about logic and Article 22 exception analysis.",
    excerpt:
      "The complaint form is for breaches of data subject rights under Articles 12-22 GDPR, including automated individual decision-making and profiling.",
    pinpoint: { section: "Complaint form A: rights" },
    tags: ["article-22", "automated-decisions", "profiling", "complaints"],
  }),
  entry({
    title: "Cyprus's copyright law is consolidated through 2022 for DSM-era TDM analysis",
    sourceName: "WIPO Lex / Cyprus intellectual-property legislation",
    sourceUrl: "https://www.wipo.int/wipolex/en/legislation/details/21963",
    sourceType: "legislation",
    publicationDate: "2022-01-01",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "WIPO Lex lists Cyprus's Law on Copyright and Related Rights as amended through 2022, forming the national copyright layer to assess DSM/TDM and AI-training questions.",
    whatHappened:
      "The WIPO Lex entry identifies Cyprus's main copyright law, its 2022 version and copyright-related subject matter.",
    whyItMatters:
      "Generative-AI training and rights-reservation questions in Cyprus must be checked against the national copyright law alongside the EU DSM Directive and AI Act GPAI duties.",
    practicalImpact:
      "AI developers and rights holders should review lawful access, text-and-data-mining permissions, rights reservations and Cyprus copyright exceptions before training or deploying models.",
    excerpt:
      "WIPO Lex identifies Cyprus's Law on Copyright and Related Rights, amended up to Law No. 55(I)/2022, as a main copyright law.",
    pinpoint: { section: "Law on Copyright and Related Rights of 1976, amended up to 2022" },
    tags: ["copyright", "tdm", "dsm-directive", "generative-ai"],
  }),
  entry({
    title: "Cyprus's 2023 Teleworking Law regulates technology-mediated remote work",
    sourceName: "Department of Labour Relations, Ministry of Labour and Social Insurance of Cyprus",
    sourceUrl:
      "https://www.mlsi.gov.cy/mlsi/dlr/dlr.nsf/916ED27BECDF1478C22586B6002897CC/%24file/the%20Regulation%20of%20the%20Framework%20for%20the%20Organization%20of%20Teleworking%20Law%2C2023.pdf",
    sourceType: "legislation",
    publicationDate: "2023-12-01",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Cyprus's Teleworking Law defines teleworking as remote work by an employee using technology and creates a statutory framework for digital-work arrangements.",
    whatHappened:
      "The 2023 law regulates the organisational framework for teleworking, including remote provision of work through technology under employment contracts.",
    whyItMatters:
      "AI-enabled workplace monitoring, scheduling and productivity tools in Cyprus sit against this technology-mediated telework framework.",
    practicalImpact:
      "Employers should review telework agreements, equipment, cost allocation, data-protection notices, monitoring proportionality and worker safeguards before adding AI tools.",
    excerpt:
      "The law defines teleworking as the remote provision of work by an employee using technology.",
    pinpoint: { section: "Teleworking definition" },
    tags: ["teleworking", "remote-work", "ict", "worker-safeguards"],
  }),
  entry({
    title: "Cyprus's Teleworking Law includes a right-to-disconnect layer for digital work tools",
    sourceName: "Department of Labour Relations, Ministry of Labour and Social Insurance of Cyprus",
    sourceUrl:
      "https://www.mlsi.gov.cy/mlsi/dlr/dlr.nsf/916ED27BECDF1478C22586B6002897CC/%24file/the%20Regulation%20of%20the%20Framework%20for%20the%20Organization%20of%20Teleworking%20Law%2C2023.pdf",
    sourceType: "legislation",
    publicationDate: "2023-12-01",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Cyprus's Teleworking Law requires telework arrangements to account for digital-tool disconnection, a key safeguard for AI-enabled remote-work management.",
    whatHappened:
      "The telework framework adds rules around employee availability, digital communication and organisational measures for remote work.",
    whyItMatters:
      "Right-to-disconnect obligations are directly relevant when AI systems monitor availability, productivity, response times or communications outside working time.",
    practicalImpact:
      "Employers using AI in telework settings should document disconnection measures, notification practices and limits on monitoring or automated performance signals.",
    excerpt:
      "The teleworking framework regulates remote work through technology and associated employee safeguards.",
    pinpoint: { section: "Teleworking safeguards and right to disconnect" },
    tags: ["right-to-disconnect", "telework", "digital-tools", "workplace-ai"],
  }),
];
