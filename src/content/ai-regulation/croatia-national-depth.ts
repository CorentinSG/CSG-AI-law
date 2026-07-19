import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type CroatiaNationalDepthEntry = {
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
    detectedAt: "2026-07-19T02:25:00.000Z",
    retrievedAt: "2026-07-19T02:25:00.000Z",
    lastVerifiedAt: "2026-07-19T02:25:00.000Z",
    jurisdiction: "Croatia",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Croatia national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<CroatiaNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): CroatiaNationalDepthEntry {
  const tags = ["croatia-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Croatia",
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

export const croatiaNationalDepthEntries: CroatiaNationalDepthEntry[] = [
  entry({
    title: "Croatia launched work on a National AI Development Plan and Action Plan",
    sourceName: "Ministry of Justice, Administration and Digital Transformation of Croatia",
    sourceUrl:
      "https://mpudt.gov.hr/news-25399/workshop-startai-a-step-towards-a-strategic-framework-held-in-zagreb/30131",
    sourceType: "government",
    publicationDate: "2025-05-27",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Croatia's ministry convened the Expert Working Group for a National AI Development Plan until 2032 and an Action Plan for 2026-2028.",
    whatHappened:
      "The StartAI workshop began the official planning process, with work to analyse Croatia's current AI position, define strategic priorities and set measures for AI development.",
    whyItMatters:
      "This gives Croatia a national AI governance lane beyond the EU AI Act baseline and identifies responsible development, competitiveness, public-administration modernisation and fundamental rights as policy objectives.",
    practicalImpact:
      "AI providers, public bodies and compliance teams should monitor the plan for Croatian implementation priorities, authority designations, literacy measures and procurement expectations.",
    excerpt:
      "The National AI Development Plan until 2032 and Action Plan 2026-2028 will support responsible AI development in Croatia.",
    pinpoint: { section: "StartAI workshop and National AI Development Plan" },
    tags: ["ai-plan", "startai", "public-administration", "fundamental-rights"],
  }),
  entry({
    title: "Croatia's Digital Decade Roadmap links AI, cloud, big data and legal-technical support",
    sourceName: "Ministry of Justice, Administration and Digital Transformation of Croatia",
    sourceUrl:
      "https://mpudt.gov.hr/UserDocsImages/RDD/dokumenti/National%20Roadmap%20for%20Digital%20Decade%20Policy%20Programme%202030.pdf?lang=et",
    sourceType: "policy",
    publicationDate: "2023-12-22",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "Croatia's Digital Decade Roadmap measures business adoption of cloud, big data and AI and calls for reliable, safe advanced technology support.",
    whatHappened:
      "The roadmap reports Croatian business use of cloud, big data and AI indicators and says Croatia should support reliable and safe advanced technologies through legal and technical support and procurement procedures.",
    whyItMatters:
      "This is Croatia's national infrastructure-policy bridge between AI governance, cloud adoption, public support and procurement controls.",
    practicalImpact:
      "Cloud and AI vendors should track Croatian Digital Decade measures, public procurement support and national implementation actions affecting AI, cloud and data infrastructure.",
    excerpt:
      "The roadmap says Croatia should intensify support for reliable, safe AI, cloud and big-data technologies through legal and technical support and procurement procedures.",
    pinpoint: { section: "Business digitalisation and advanced technologies" },
    tags: ["digital-decade", "cloud", "big-data", "procurement"],
  }),
  entry({
    title: "AZOP lists automated decision-making and profiling transparency among controller obligations",
    sourceName: "Croatian Personal Data Protection Agency (AZOP)",
    sourceUrl: "https://azop.hr/obligations-of-organisations/",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "AZOP's controller-obligations guidance requires information about automated decision-making, profiling, logic involved and expected consequences.",
    whatHappened:
      "The national data-protection authority explains that transparency notices should cover the existence of automated decision-making, including profiling, with meaningful information about the logic and foreseeable effects.",
    whyItMatters:
      "This turns the GDPR transparency baseline into a Croatian regulator-facing compliance item for AI systems that profile or make automated decisions about individuals.",
    practicalImpact:
      "Croatian controllers deploying AI should update notices, DPIA records, ROPA materials and user-facing explanations for profiling and automated decision workflows.",
    excerpt:
      "AZOP lists automated decision-making, profiling, logic involved and foreseeable consequences among information obligations.",
    pinpoint: { section: "Obligations of organisations" },
    tags: ["azop", "gdpr", "transparency", "profiling"],
  }),
  entry({
    title: "AZOP's 2026 AI-system guidance applies GDPR Article 22 to AI decisions",
    sourceName: "Croatian Personal Data Protection Agency (AZOP)",
    sourceUrl: "https://azop.hr/wp-content/uploads/2026/05/AZOP-Smjernice-za-razvoj-AI-sustava.pdf",
    sourceType: "regulator",
    publicationDate: "2026-05-01",
    developmentType: "Agency guidance",
    legalArea: "Automated decision-making",
    authorityType: "Agency guidance",
    summary:
      "AZOP's AI-system guidance explains that Article 22 GDPR protects individuals from solely automated decisions, including profiling, that produce legal or similarly significant effects.",
    whatHappened:
      "The guidance identifies examples such as automatic online credit refusal, automated exclusion from hiring without real human involvement and automated determination of rights, benefits or access to services.",
    whyItMatters:
      "Croatia now has a current national regulator interpretation connecting AI development directly to Article 22 safeguards and human intervention analysis.",
    practicalImpact:
      "AI deployers in Croatia should test whether systems make solely automated significant decisions and document the contractual, legal-authorisation or consent basis plus safeguards.",
    excerpt:
      "AZOP states that Article 22 protects data subjects from solely automated decisions, including profiling, with legal or similarly significant effects.",
    pinpoint: { section: "Article 22 GDPR and AI-system development" },
    tags: ["azop", "article-22", "ai-guidance", "human-intervention"],
  }),
  entry({
    title: "Croatia's Copyright and Related Rights Act implements DSM text-and-data-mining rules",
    sourceName: "State Intellectual Property Office of Croatia (DZIV) / WIPO Lex",
    sourceUrl: "https://www.dziv.hr/files/file/zastita/zakon_autor_2021_ENG.pdf",
    sourceType: "legislation",
    publicationDate: "2021-10-14",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Croatia's Copyright and Related Rights Act includes text-and-data-mining exceptions, including Article 188 for purposes beyond scientific research.",
    whatHappened:
      "The 2021 copyright act transposed DSM Directive rules and creates Croatian statutory exceptions relevant to AI training, dataset analysis and rights-reservation review.",
    whyItMatters:
      "Generative-AI copyright analysis in Croatia must account for national TDM provisions, lawful access, opt-outs and EU AI Act GPAI transparency duties.",
    practicalImpact:
      "AI developers and rights holders should map training inputs against Croatian TDM exceptions, research status, machine-readable reservations and database-right constraints.",
    excerpt:
      "Article 188 is titled Text and Data Mining for Other Purposes and permits uses without right-holder authorisation under statutory conditions.",
    pinpoint: { article: "Article 188" },
    tags: ["copyright", "tdm", "dsm-directive", "generative-ai"],
  }),
  entry({
    title: "Croatia's Labour Act regulates remote work through ICT and worker safeguards",
    sourceName: "Croatian Ministry of Labour / Occupational Safety portal",
    sourceUrl: "https://uznr.mrms.hr/wp-content/uploads/labour-act.pdf",
    sourceType: "legislation",
    publicationDate: "2023-01-01",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Croatia's Labour Act defines remote work as work performed through information and communication technology and adds contract, workload and rest-time safeguards.",
    whatHappened:
      "The consolidated Labour Act defines remote work and alternative workplace work, requires written-contract information and says workload and deadlines must not deny daily, weekly or annual rest rights.",
    whyItMatters:
      "AI-enabled workforce management in Croatia sits against statutory ICT-based remote-work rules, rest protections and worker-participation requirements.",
    practicalImpact:
      "Employers using AI scheduling, monitoring or productivity tools should review employment contracts, workload settings, rest-time controls and transparency for remote workers.",
    excerpt:
      "The Labour Act defines remote work as work always performed through information and communication technology.",
    pinpoint: { article: "Articles 17 and 17a" },
    tags: ["labour-act", "remote-work", "ict", "worker-safeguards"],
  }),
  entry({
    title: "Croatia's SmartWorking model embeds digital HR tools and performance monitoring in public administration",
    sourceName: "Ministry of Justice, Administration and Digital Transformation of Croatia",
    sourceUrl:
      "https://mpudt.gov.hr/UserDocsImages/dokumenti/Projekti/nacionalni-plan-oporavka-i-otpornosti/hibridni-pristup-radnom-mjestu-smartworking/Remote%20And%20Hybrid%20Work%20in%20Croatia%20and%20Selected%20EU%20Member%20States.pdf",
    sourceType: "government",
    publicationDate: "2024-12-01",
    developmentType: "Policy report",
    legalArea: "Labor and social law",
    authorityType: "Policy report",
    summary:
      "Croatia's SmartWorking materials describe public-administration hybrid work using HRM digital tools, line-manager monitoring and result-oriented working practices.",
    whatHappened:
      "The ministry report describes Croatia's 2023-2024 pilot and SmartWorking rollout, including digital tools embedded in HRM systems and performance monitoring by line managers.",
    whyItMatters:
      "This gives the Croatian public sector a concrete digital workplace layer that should be tracked alongside labour law, GDPR and future AI-enabled HR tooling.",
    practicalImpact:
      "Public-sector HR and vendors should assess monitoring proportionality, employee notices, HR-system access controls, DPIAs and governance before adding AI to SmartWorking workflows.",
    excerpt:
      "The report says digital tools for managing remote and hybrid work are embedded in the HRM information system and performance is monitored by line managers.",
    pinpoint: { section: "Highlights of the Croatian Remote Work Model" },
    tags: ["smartworking", "public-sector", "hrm", "performance-monitoring"],
  }),
];
