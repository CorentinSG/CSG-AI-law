import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type BelgiumNationalDepthEntry = {
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
    detectedAt: "2026-07-19T01:45:00.000Z",
    retrievedAt: "2026-07-19T01:45:00.000Z",
    lastVerifiedAt: "2026-07-19T01:45:00.000Z",
    jurisdiction: "Belgium",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Belgium national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<BelgiumNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): BelgiumNationalDepthEntry {
  const tags = ["belgium-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Belgium",
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

export const belgiumNationalDepthEntries = [
  entry({
    title: "Belgium's national AI convergence plan sets the federal #SmartAINation baseline",
    sourceName: "FPS Policy and Support (BOSA)",
    sourceUrl:
      "https://bosa.belgium.be/en/themes/digital-administration/digital-strategy-and-policy/national-convergence-plan-development",
    sourceType: "government",
    publicationDate: "2022-10-28",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Belgium's federal administration uses the national AI convergence plan as the policy baseline for trustworthy AI, cybersecurity, competitiveness, healthcare, mobility, environment, skills and citizen services.",
    whatHappened:
      "BOSA states that the Council of Ministers approved the plan on 28 October 2022 and that it proposes concrete actions to make Belgium a #SmartAINation.",
    whyItMatters:
      "This is the national policy layer against which Belgian AI Act implementation, federal AI governance and regional-federal coordination should be tracked.",
    practicalImpact:
      "Belgian AI monitoring should connect later authority designations, guidance, public-sector AI deployments and funding measures back to this national plan.",
    excerpt:
      "BOSA says the plan was approved by the Council of Ministers on 28 October 2022 and sets nine federal AI objectives.",
    tags: ["ai-strategy", "smart-ai-nation", "bosa", "federal-policy"],
  }),
  entry({
    title: "Belgium's Data and AI Ethics Advisory Committee gives federal public-sector AI advice",
    sourceName: "FPS Policy and Support (BOSA)",
    sourceUrl:
      "https://bosa.belgium.be/en/news/appointment-data-and-ai-ethics-advisory-committee-federal-administration",
    sourceType: "government",
    publicationDate: "2024-05-08",
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "Belgium appointed a Data and AI Ethics Advisory Committee for the federal administration to provide scientifically based advice on ethical, legal, social and environmental issues around AI and related technologies.",
    whatHappened:
      "BOSA reports that the committee was officially appointed by ministerial decree on 8 May 2024 and can issue opinions for federal departments and administrative bodies.",
    whyItMatters:
      "The committee is not the final AI Act market-surveillance architecture, but it is a national public-sector governance node for human oversight, rights and ethical deployment.",
    practicalImpact:
      "Federal AI projects should treat committee opinions and related BOSA material as Belgian public-sector AI governance signals, especially for high-impact uses.",
    excerpt:
      "BOSA says the committee formulates opinions on ethical, legal, social and environmental issues concerning AI, robotics and related technologies used within government.",
    tags: ["ethics-committee", "public-sector-ai", "human-oversight", "bosa"],
  }),
  entry({
    title: "Belgian DPA explains the GDPR and AI Act relationship for AI systems processing personal data",
    sourceName: "Belgian Data Protection Authority",
    sourceUrl:
      "https://www.dataprotectionauthority.be/index.php/publications/artificial-intelligence-systems-and-the-gdpr---a-data-protection-perspective.pdf",
    sourceType: "regulator",
    publicationDate: "2024-12-01",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The Belgian DPA's AI systems and GDPR brochure explains how GDPR principles, accountability, security and data-subject rights apply to AI systems alongside the EU AI Act.",
    whatHappened:
      "The DPA published a data-protection perspective for AI systems, including practical discussion of transparency, fairness, storage limitation, security and human oversight.",
    whyItMatters:
      "This gives Belgium a national regulator guidance layer for AI projects that process personal data, beyond the generic EU baseline.",
    practicalImpact:
      "Belgian controllers and processors should run GDPR legal-basis, transparency, DPIA, security and rights analyses in parallel with AI Act risk classification.",
    excerpt:
      "The DPA brochure says AI systems processing personal data should be aligned with data-protection principles while accounting for AI-specific challenges.",
    tags: ["gdpr", "ai-act", "data-protection", "dpa-guidance"],
  }),
  entry({
    title: "Belgian copyright law implements text-and-data-mining exceptions relevant to AI training",
    sourceName: "Belgian Official Gazette / FPS Economy",
    sourceUrl:
      "https://www.ejustice.just.fgov.be/cgi/article_body.pl?language=fr&caller=summary&pub_date=22-08-01&numac=2022015053",
    sourceType: "legislation",
    publicationDate: "2022-08-01",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Belgium's 19 June 2022 law transposes the DSM Copyright Directive and adds text-and-data-mining provisions to the Economic Law Code relevant to AI training and generative-AI copyright analysis.",
    whatHappened:
      "The law defines text and data mining and adds exceptions for lawful-access reproductions, including machine-readable rights reservations for online content.",
    whyItMatters:
      "Belgian AI training and rights-reservation questions must be assessed under the national TDM provisions as well as EU DSM and AI Act GPAI duties.",
    practicalImpact:
      "Model developers and rights holders should check lawful access, opt-out reservations, research exceptions, retention rules and database-right interactions in Belgian law.",
    excerpt:
      "The Belgian law defines text and data mining as automated analysis of digital texts and data to extract information, patterns, trends and correlations.",
    pinpoint: { section: "Code of Economic Law, Book XI TDM amendments" },
    tags: ["copyright", "text-and-data-mining", "generative-ai", "official-gazette"],
  }),
  entry({
    title: "Belgium's national AI plan frames data-driven economy and high-performance infrastructure policy",
    sourceName: "FPS Policy and Support (BOSA)",
    sourceUrl:
      "https://bosa.belgium.be/en/themes/digital-administration/digital-strategy-and-policy/national-convergence-plan-development",
    sourceType: "government",
    publicationDate: "2022-10-28",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "Belgium's national AI convergence plan includes a dedicated objective on developing a data-driven economy and high-performance infrastructure.",
    whatHappened:
      "BOSA lists data-driven economy and high-performance infrastructure as one of the nine federal objectives for Belgium's AI plan.",
    whyItMatters:
      "AI governance depends on data, cloud, compute and interoperability; this national plan is the Belgian infrastructure policy anchor to connect with the EU Data Act and cloud/data-space monitoring.",
    practicalImpact:
      "Monitoring should follow Belgian data-sharing, cloud, public-sector infrastructure and AI compute measures that operationalise this plan.",
    excerpt:
      "BOSA lists developing a data-driven economy and a high-performance infrastructure among the plan's nine objectives.",
    tags: ["cloud", "infrastructure", "data-economy", "smart-ai-nation"],
  }),
  entry({
    title: "Belgium's Labour Deal uses algorithmic platform control in the platform-work presumption",
    sourceName: "Belgian Official Gazette / FPS Employment, Labour and Social Dialogue",
    sourceUrl:
      "https://www.ejustice.just.fgov.be/cgi/article_body.pl?language=fr&caller=summary&pub_date=22-11-10&numac=2022206360",
    sourceType: "legislation",
    publicationDate: "2022-11-10",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Belgium's Labour Deal law creates a platform-work employment-status presumption that expressly captures digital platforms exercising decision or control through an algorithm or equivalent technology.",
    whatHappened:
      "The law inserts Article 337/3 into the 2006 Programme Law and defines a digital ordering platform by reference to algorithmic or equivalent decision/control over work performance, conditions or remuneration.",
    whyItMatters:
      "This is a national Belgian labour-law anchor for algorithmic management and platform work, predating the EU Platform Work Directive transposition deadline.",
    practicalImpact:
      "Platforms and advisers should assess algorithmic control, ranking, pricing, geolocation, sanctions and task-allocation features when evaluating Belgian worker status.",
    excerpt:
      "The law refers to providers that, via an algorithm or equivalent technology, may exercise decision or control over how services are performed and working or pay conditions.",
    pinpoint: { section: "Article 337/3 Programme Law platform-work presumption" },
    tags: ["platform-work", "algorithmic-management", "labour-deal", "worker-status"],
  }),
  entry({
    title: "Belgian DPA guidance explains the right not to be subject to fully automated decisions",
    sourceName: "Belgian Data Protection Authority",
    sourceUrl:
      "https://www.gegevensbeschermingsautoriteit.be/professioneel/avg/rechten-van-de-burgers/het-recht-om-niet-aan-geautomatiseerde-besluitvorming-onderworpen-te-worden",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Automated decision-making",
    authorityType: "Agency guidance",
    summary:
      "The Belgian DPA explains Article 22 GDPR protections against fully automated decisions that significantly affect a person or produce legal effects.",
    whatHappened:
      "The DPA describes when the prohibition applies, the limited exceptions and the safeguards that must exist when automated individual decision-making is used.",
    whyItMatters:
      "This is Belgium's practical national guidance layer for automated credit, telecom, employment, welfare and other AI-supported decisions.",
    practicalImpact:
      "Belgian controllers should document meaningful human intervention, contestation rights, individual viewpoints and legal bases before relying on automated decisions.",
    excerpt:
      "The DPA states that a data subject may not be subjected to a fully automatic decision without human intervention where it significantly affects them or has legal effects.",
    tags: ["automated-decision-making", "article-22", "profiling", "dpa-guidance"],
  }),
] as const satisfies readonly BelgiumNationalDepthEntry[];
