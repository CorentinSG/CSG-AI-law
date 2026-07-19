import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type CzechiaNationalDepthEntry = {
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
    detectedAt: "2026-07-19T03:30:00.000Z",
    retrievedAt: "2026-07-19T03:30:00.000Z",
    lastVerifiedAt: "2026-07-19T03:30:00.000Z",
    jurisdiction: "Czechia",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Czechia national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<CzechiaNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): CzechiaNationalDepthEntry {
  const tags = ["czechia-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Czechia",
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

export const czechiaNationalDepthEntries: CzechiaNationalDepthEntry[] = [
  entry({
    title: "Czechia's National AI Strategy 2030 sets the national trustworthy-AI policy baseline",
    sourceName: "Ministry of Industry and Trade of the Czech Republic",
    sourceUrl: "https://mpo.gov.cz/en/business/digital-economy/artificial-intelligence/",
    sourceType: "government",
    publicationDate: "2024-07-24",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Czechia's updated National AI Strategy 2030 is the national policy anchor for AI adoption, economic competitiveness, public-sector efficiency and societal resilience.",
    whatHappened:
      "The Ministry of Industry and Trade explains that the government approved the updated National AI Strategy 2030 by resolution no. 520 on 24 July 2024.",
    whyItMatters:
      "The strategy is the domestic baseline for Czech AI governance and links policy priorities to future action-plan updates under Digital Czechia.",
    practicalImpact:
      "AI providers, deployers and advisers should track the strategy's annual action-plan updates, especially measures on legal and ethical AI, skills, security, business uptake and public administration.",
    excerpt:
      "MPO states that the National AI Strategy 2030 was approved by government resolution no. 520 on 24 July 2024 and covers seven linked AI areas.",
    pinpoint: { section: "National AI Strategy of the Czech Republic 2030" },
    tags: ["ai-strategy", "nais-2030", "digital-czechia", "trustworthy-ai"],
  }),
  entry({
    title: "Czechia's draft AI Act adaptation law maps national AI supervision and sandboxing",
    sourceName: "Ministry of Industry and Trade of the Czech Republic",
    sourceUrl:
      "https://mpo.gov.cz/en/guidepost/for-the-media/press-releases/the-ministry-of-industry-and-trade-has-prepared-a-draft-law-on-artificial-intelligence----289865/",
    sourceType: "government",
    publicationDate: "2025-09-26",
    developmentType: "Bill",
    legalArea: "AI governance",
    authorityType: "Proposed law",
    summary:
      "The Ministry of Industry and Trade has prepared a minimalist Czech AI Act adaptation bill covering institutional, procedural and sanctioning mechanisms.",
    whatHappened:
      "MPO says the draft would divide supervision among the Czech Telecommunication Office, Czech National Bank and Office for Personal Data Protection, with technical standardisation and human-rights roles assigned separately.",
    whyItMatters:
      "Although not yet binding, the proposal is the clearest official signal for Czech AI Act implementation, competent-authority allocation and national sandbox planning.",
    practicalImpact:
      "Compliance teams should monitor the legislative procedure, authority designations, sandbox terms, notified-body accreditation and the expected 2026 entry into force.",
    excerpt:
      "MPO states that the adaptation law regulates institutional, procedural and sanctioning mechanisms and that CTU will become the single point of contact.",
    pinpoint: { section: "Draft AI Act adaptation law" },
    tags: ["ai-act", "draft-law", "market-surveillance", "regulatory-sandbox"],
  }),
  entry({
    title: "Czech DPA-hosted DPIA guidance flags profiling and automated decisions as high-risk processing",
    sourceName: "Office for Personal Data Protection of the Czech Republic (UOOU)",
    sourceUrl: "https://uoou.gov.cz/media/6-guidelines-on-data-protection-impact-assessment-dpia.pdf",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "UOOU hosts GDPR DPIA guidance identifying evaluation, scoring, profiling and automated decision-making with legal or similar significant effect as DPIA risk criteria.",
    whatHappened:
      "The guidance explains criteria for high-risk processing, including profiling about work performance, economic situation, health, preferences, reliability, behaviour, location or movements.",
    whyItMatters:
      "This gives Czech AI deployments a concrete GDPR risk-assessment layer before systems are trained or used on personal data.",
    practicalImpact:
      "Controllers should run DPIA screening for AI systems involving scoring, profiling, systematic monitoring, sensitive data or decisions affecting access to services and rights.",
    excerpt:
      "The guidance lists evaluation or scoring and automated-decision making with legal or similar significant effect among criteria relevant to DPIA analysis.",
    pinpoint: { section: "DPIA criteria: evaluation, scoring and automated decisions" },
    tags: ["uoou", "gdpr", "dpia", "profiling", "automated-decisions"],
  }),
  entry({
    title: "Czechia's Digital Decade report ties AI progress to cloud, edge and connectivity infrastructure",
    sourceName: "European Commission, Digital Strategy",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/factpages/czech-republic-2025-digital-decade-country-report",
    sourceType: "policy",
    publicationDate: "2025-06-01",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "The 2025 Digital Decade country report tracks Czechia's cloud, edge, AI, broadband and public digital-service position within the EU digital transformation programme.",
    whatHappened:
      "The report says Czechia is advancing in AI through the updated National AI Strategy 2030, estimates 21 edge nodes in 2024 and recommends faster FTTP and VHCN rollout.",
    whyItMatters:
      "AI deployment depends on national cloud, data-centre, edge and connectivity capacity, making this the institutional infrastructure baseline for Czech AI monitoring.",
    practicalImpact:
      "Cloud and AI providers should monitor Czech Digital Decade measures on enterprise digitalisation, edge nodes, data centres, cybersecurity and high-capacity network rollout.",
    excerpt:
      "The report notes Czechia's AI progress, estimated edge nodes, and a recommendation to accelerate fibre and very high-capacity networks.",
    pinpoint: { section: "High-performance connectivity and foundational technologies" },
    tags: ["digital-decade", "cloud", "edge-nodes", "vhcn", "infrastructure"],
  }),
  entry({
    title: "Czech Copyright Act amendments provide the national DSM/TDM layer for generative AI",
    sourceName: "WIPO Lex / Czech copyright legislation",
    sourceUrl: "https://www.wipo.int/wipolex/en/legislation/details/22298",
    sourceType: "legislation",
    publicationDate: "2023-05-01",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "WIPO Lex identifies Czech Act No. 121/2000 Coll. as amended through the DSM-era Act No. 429/2022 Coll., forming the national copyright baseline for TDM and AI-training questions.",
    whatHappened:
      "The Czech Copyright Act was amended by Act No. 429/2022 Coll., which implemented DSM copyright changes and inserted text-and-data-mining provisions into the national regime.",
    whyItMatters:
      "Generative-AI training and rights-reservation questions in Czechia must be assessed against the Czech Copyright Act alongside the DSM Directive and AI Act GPAI duties.",
    practicalImpact:
      "AI developers, researchers and rights holders should review lawful access, TDM scope, rights reservations, research treatment and database-related effects before model training or deployment.",
    excerpt:
      "WIPO Lex lists Act No. 121/2000 Coll. as amended up to Act No. 429/2022 Coll. and records it as Czechia's main copyright law.",
    pinpoint: { section: "Act No. 121/2000 Coll.; Act No. 429/2022 Coll." },
    tags: ["copyright", "tdm", "dsm-directive", "generative-ai"],
  }),
  entry({
    title: "Czech Labour Code restricts employee monitoring and frames remote digital work",
    sourceName: "Ministry of Labour and Social Affairs of the Czech Republic",
    sourceUrl: "https://ppropo.mpsv.cz/zakon_262_2006",
    sourceType: "legislation",
    publicationDate: null,
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "The Czech Labour Code limits workplace monitoring without serious cause, requires employee information on control mechanisms and regulates remote-work arrangements.",
    whatHappened:
      "MPSV's Labour Code text records section 316 on employer monitoring and privacy, and section 317 on remote work based on a written agreement except limited public-authority cases.",
    whyItMatters:
      "AI-enabled workplace monitoring, productivity scoring, email review, scheduling and remote-work tools must fit both labour-law privacy limits and GDPR requirements.",
    practicalImpact:
      "Employers should document serious reasons, proportionality, worker notices, remote-work agreements, data minimisation and human review before deploying algorithmic management tools.",
    excerpt:
      "The Labour Code bars employee privacy intrusions through monitoring or email checks without serious cause and requires direct information about control scope and methods.",
    pinpoint: { section: "Labour Code sections 316 and 317" },
    tags: ["labour-code", "employee-monitoring", "remote-work", "algorithmic-management"],
  }),
  entry({
    title: "Czech Personal Data Processing Act limits automated public-authority interventions",
    sourceName: "Office for Personal Data Protection of the Czech Republic (UOOU)",
    sourceUrl: "https://uoou.gov.cz/media/act-no-110-2019-coll.pdf",
    sourceType: "legislation",
    publicationDate: "2019-04-24",
    developmentType: "Statute",
    legalArea: "Automated decision-making",
    authorityType: "Binding law",
    summary:
      "Act No. 110/2019 Coll. contains Czech rules for personal-data processing, including DPIA, consultation, automated logging and limits on exclusively automated interventions by controlling authorities.",
    whatHappened:
      "The UOOU-hosted translation states that a controlling authority may interfere with protected interests on the basis of exclusively automated processing only if another law expressly allows it.",
    whyItMatters:
      "This is a national public-sector automated-decision layer for AI systems used by Czech competent authorities alongside GDPR Article 22 and law-enforcement data-protection rules.",
    practicalImpact:
      "Public bodies using automated decision systems should confirm express legal basis, log automated operations, assess high-risk processing and preserve reviewability and contestability.",
    excerpt:
      "Section 39 states that exclusively automated personal data processing may interfere with rights or protected interests only where expressly laid down by another law.",
    pinpoint: { section: "Act No. 110/2019 Coll., section 39" },
    tags: ["automated-decision-making", "public-sector", "act-110-2019", "article-22"],
  }),
];
