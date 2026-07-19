import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type NewYorkAiLawDepthEntry = {
  jurisdiction: Jurisdiction;
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
    detectedAt: "2026-07-19T04:20:00.000Z",
    retrievedAt: "2026-07-19T04:20:00.000Z",
    lastVerifiedAt: "2026-07-19T04:20:00.000Z",
    jurisdiction: "New York",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "New York AI Law Watch entry. Primary or authoritative source verified manually; discovery-only secondary commentary is excluded from verified publication.",
  };
}

function entry(input: Omit<NewYorkAiLawDepthEntry, "jurisdiction" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): NewYorkAiLawDepthEntry {
  const tags = ["new-york-ai-law-watch", "official-source", ...input.tags];
  return {
    jurisdiction: "New York",
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

export const newYorkAiLawDepthEntries: NewYorkAiLawDepthEntry[] = [
  entry({
    title: "Part 161 governs AI use in New York court papers",
    sourceName: "New York State Unified Court System",
    sourceUrl: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
    sourceType: "court",
    publicationDate: "2026-03-25",
    developmentType: "Final rule",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "New York added Part 161 to the Rules of the Chief Administrator for attorney and party use of artificial intelligence technology in court papers.",
    whatHappened:
      "The official rule page states that Part 161 was added on March 25, 2026 and became effective June 1, 2026, with obligations around AI-assisted filings.",
    whyItMatters:
      "This is the core New York court-rule layer for hallucinated authority, independent review and sanctions risk in AI-assisted litigation filings.",
    practicalImpact:
      "Court-facing teams should update filing workflows to require human verification of citations, quotations, record references and factual assertions generated or checked with AI tools.",
    excerpt:
      "Part 161 addresses use of artificial intelligence technology in papers submitted to New York courts and links the administrative order adopting the rule.",
    pinpoint: { ruleNumber: "Part 161", section: "161.3" },
    tags: ["part-161", "court-filings", "hallucinated-authority", "attorney-review"],
  }),
  entry({
    title: "AO/75/2026 promulgates Part 161 for AI court filings",
    sourceName: "New York State Unified Court System",
    sourceUrl:
      "https://www.nycourts.gov/LegacyPDFS/rules/comments/pdf/AdministrativeOrder-CAJ-75-2026-ArttificialIntelligence-032526r.pdf",
    sourceType: "court",
    publicationDate: "2026-03-25",
    developmentType: "Final rule",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "The Chief Administrative Judge's administrative order formally adds Part 161 to the Rules of the Chief Administrator.",
    whatHappened:
      "AO/75/2026 is the official order linked from the NY Courts rule page and supplies the promulgation authority and effective date for the AI court-filing rule.",
    whyItMatters:
      "The order is the authoritative adoption record for the statewide NY Courts AI rule and should be monitored with the live rule page.",
    practicalImpact:
      "Litigation teams should cite the order and Part 161 together when auditing AI-use policies for New York court submissions.",
    excerpt:
      "The administrative order adds Part 161 on use of artificial intelligence technology, effective June 1, 2026.",
    pinpoint: { docket: "AO/75/2026", ruleNumber: "Part 161" },
    tags: ["part-161", "administrative-order", "court-filings", "professional-responsibility"],
  }),
  entry({
    title: "UCS interim AI policy sets governance for New York courts",
    sourceName: "New York State Unified Court System",
    sourceUrl: "https://www.nycourts.gov/LegacyPDFS/a.i.-policy.pdf",
    sourceType: "court",
    publicationDate: "2025-10-01",
    developmentType: "Agency guidance",
    legalArea: "Public sector use of AI",
    authorityType: "Agency guidance",
    summary:
      "The Unified Court System publishes an interim policy governing responsible use of AI inside the New York court system.",
    whatHappened:
      "The policy creates an institutional AI-governance baseline for court personnel, approved tools, responsible use and risk controls.",
    whyItMatters:
      "It is the administrative foundation for how New York courts themselves use AI, separate from attorney obligations in filed papers.",
    practicalImpact:
      "Vendors and court technology teams should expect governance review, approved-use boundaries, risk assessment and human oversight for UCS AI deployments.",
    excerpt:
      "The policy establishes interim governance for the use of artificial intelligence within the Unified Court System.",
    pinpoint: { section: "Interim Policy on Artificial Intelligence" },
    tags: ["ucs-ai-policy", "public-sector-ai", "court-administration", "governance"],
  }),
  entry({
    title: "UCS Advisory Committee annual report maps New York court AI priorities",
    sourceName: "New York State Unified Court System",
    sourceUrl: "https://webfiles.nycourts.gov/public/2026-01/ai-annual-report-2025.pdf",
    sourceType: "court",
    publicationDate: "2025-12-01",
    developmentType: "Policy report",
    legalArea: "Access to justice",
    authorityType: "Policy report",
    summary:
      "The New York courts' AI Advisory Committee annual report organizes recommendations and workstreams on court AI, ethics, access, operations and governance.",
    whatHappened:
      "The report documents committee activity and recommendations to the Chief Judge and Chief Administrative Judge for AI in courts.",
    whyItMatters:
      "It is a key early-warning source for future New York court AI policy, rulemaking and operational pilots.",
    practicalImpact:
      "Monitor report follow-up for new rules, pilot programs, access-to-justice tooling, procurement expectations and ethics guidance.",
    excerpt:
      "The annual report records committee findings, recommendations and policy proposals for artificial intelligence and the courts.",
    pinpoint: { section: "Annual Report to the Chief Judge and Chief Administrative Judge" },
    tags: ["ai-advisory-committee", "access-to-justice", "court-policy", "governance"],
  }),
  entry({
    title: "Commercial Division seeks comment on generative AI disclosures",
    sourceName: "New York State Unified Court System",
    sourceUrl:
      "https://www.nycourts.gov/LegacyPDFS/rules/comments/pdf/RequestForPublicComment-GenerativeArtificialIntelligence-111725.pdf",
    sourceType: "court",
    publicationDate: "2025-11-17",
    developmentType: "Public consultation",
    legalArea: "Professional responsibility",
    authorityType: "Proposed law",
    summary:
      "New York courts request public comment on Commercial Division rules addressing generative AI use in litigation.",
    whatHappened:
      "The proposal/comment process addresses whether and how parties should disclose or certify use of generative AI in Commercial Division practice.",
    whyItMatters:
      "Commercial Division rulemaking can shape high-value business litigation AI practice and may create disclosure norms beyond Part 161.",
    practicalImpact:
      "Commercial litigators should monitor adoption status, comments and eventual rule text for AI disclosure or certification duties.",
    excerpt:
      "The court system requested public comment on a Commercial Division proposal concerning generative artificial intelligence.",
    pinpoint: { section: "Request for Public Comment" },
    tags: ["commercial-division", "generative-ai", "court-rules", "public-comment"],
  }),
  entry({
    title: "Landberg imposes sanctions for GenAI hallucinations in appellate briefing",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_03935.shtml",
    sourceType: "court",
    publicationDate: "2026-06-24",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "The Appellate Division sanctions an attorney and law firm after a brief prepared with GenAI assistance included nonexistent cases and inaccurate authorities.",
    whatHappened:
      "Landberg v City of New York addresses fabricated citations, fabricated quotations and misstatements of actual decisions in an appellate brief.",
    whyItMatters:
      "It is a leading New York appellate signal that AI-assisted legal research mistakes can trigger professional and monetary consequences.",
    practicalImpact:
      "Firms should maintain auditable citation-check processes, tool-use policies and partner review for briefs involving AI research or drafting.",
    excerpt:
      "The court imposed sanctions for an AI-assisted brief containing nonexistent cases, fabricated quotations and misstatements of law.",
    pinpoint: { caseNumber: "2026 NY Slip Op 03935" },
    tags: ["case-law", "sanctions", "genai", "hallucinated-authority"],
  }),
  entry({
    title: "Matter of Julien addresses GenAI use and fabricated appellate authority",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_03308.shtml",
    sourceType: "court",
    publicationDate: "2026-05-28",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "The Appellate Division addresses the use of generative AI in appellate briefing after a submission contained fabricated legal authority.",
    whatHappened:
      "The court used an order to show cause to evaluate sanctions or costs for a brief containing fabricated legal authority.",
    whyItMatters:
      "Julien frames New York appellate expectations for GenAI verification before filing and is cited by later New York decisions.",
    practicalImpact:
      "Appellate teams should verify every AI-assisted citation and quote against primary sources before filing in New York courts.",
    excerpt:
      "The court describes generative AI in appellate briefs as an emerging issue with broad implications and risk of nonexistent citations.",
    pinpoint: { caseNumber: "2026 NY Slip Op 03308" },
    tags: ["case-law", "sanctions", "genai", "hallucinated-authority"],
  }),
  entry({
    title: "Deutsche Bank v LeTennier treats fabricated AI-linked authorities as sanctionable",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2026/2026_00040.htm",
    sourceType: "court",
    publicationDate: "2026-01-08",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "The Appellate Division addresses a brief citing six nonexistent cases, identified as possible artificial-intelligence output.",
    whatHappened:
      "The court considered sanctions after fabricated cases appeared in appellate briefing and situated the problem within broader AI-hallucination case law.",
    whyItMatters:
      "The decision extends New York's record of appellate scrutiny over AI-generated or AI-suspected fake authorities.",
    practicalImpact:
      "Counsel should treat unexplained AI-like authorities as a sanctions risk even where the record does not identify the exact tool used.",
    excerpt:
      "The brief cited six cases that did not exist and the opposing party identified them as possibly the product of artificial intelligence.",
    pinpoint: { caseNumber: "2026 NY Slip Op 00040" },
    tags: ["case-law", "sanctions", "hallucinated-authority", "appellate-briefing"],
  }),
  entry({
    title: "Assini v Hayward refers litigant to Part 161 and warns of sanctions",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_26086.shtml",
    sourceType: "court",
    publicationDate: "2026-05-23",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "A New York court cites 22 NYCRR Part 161, directs a party to comply with the AI technology rule and warns sanctions may follow noncompliance.",
    whatHappened:
      "The decision operationalizes Part 161 in live litigation by referring the defendant to the AI court rule.",
    whyItMatters:
      "It shows Part 161 is not merely a static rule page; courts are using it as a litigation-management and sanctions signal.",
    practicalImpact:
      "Parties appearing in New York courts should assume judges may invoke Part 161 directly when AI-assisted materials raise reliability concerns.",
    excerpt:
      "The court refers the defendant to 22 NYCRR Part 161 on use of artificial intelligence technology and warns that failure may result in sanctions.",
    pinpoint: { caseNumber: "2026 NY Slip Op 26086", ruleNumber: "22 NYCRR Part 161" },
    tags: ["case-law", "part-161", "sanctions", "court-filings"],
  }),
  entry({
    title: "Torres v Spraker discusses AI-generated fake authority in pro se papers",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_26077.shtml",
    sourceType: "court",
    publicationDate: "2026-05-08",
    developmentType: "Other official regulatory development",
    legalArea: "Access to justice",
    authorityType: "Binding law",
    summary:
      "A New York court addresses pro se use of AI-drafted legal documents and the sanctionability of fabricated legal authority.",
    whatHappened:
      "The decision cites federal authorities on AI-generated fabricated legal authority while considering self-represented litigants' submissions.",
    whyItMatters:
      "It connects AI reliability, sanctions doctrine and access-to-justice questions for pro se litigants in New York courts.",
    practicalImpact:
      "Courts, clinics and self-help tools should pair AI drafting support with source verification and plain warnings about fictitious authorities.",
    excerpt:
      "The decision states that fabricated legal authority resulting from artificial intelligence use can be sanctionable conduct.",
    pinpoint: { caseNumber: "2026 NY Slip Op 26077" },
    tags: ["case-law", "pro-se", "access-to-justice", "hallucinated-authority"],
  }),
  entry({
    title: "Cassata urges legal competence in generative AI while citing UCS AI work",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2026/2026_26014.htm",
    sourceType: "court",
    publicationDate: "2026-01-18",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Cassata v Michael Macrina Architect discusses generative AI and the judiciary's AI advisory work in a professional-competence frame.",
    whatHappened:
      "The court references the UCS Advisory Committee on Artificial Intelligence and the Courts annual report and broader lawyer competence themes.",
    whyItMatters:
      "The decision signals that New York judges may expect attorneys to understand both AI risks and responsible uses.",
    practicalImpact:
      "Law firms should align training, supervision and review policies with evolving New York judicial expectations around AI competence.",
    excerpt:
      "The decision discusses the New York courts' AI annual report and the need for attorneys to learn generative AI responsibly.",
    pinpoint: { caseNumber: "2026 NY Slip Op 26014" },
    tags: ["case-law", "competence", "generative-ai", "professional-responsibility"],
  }),
  entry({
    title: "Gully v Varghese addresses fake AI-like citations in motion practice",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_50864.shtml",
    sourceType: "court",
    publicationDate: "2026-05-01",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Gully v Varghese identifies fake citations that appeared to mimic actual Appellate Division cases in a way consistent with AI hallucination risks.",
    whatHappened:
      "The court analyzed citations that looked plausible but pointed to unrelated or nonexistent authorities.",
    whyItMatters:
      "The case adds trial-court detail to the New York pattern of AI-adjacent fabricated authority in motion practice.",
    practicalImpact:
      "Motion teams should not rely on citation shape or party-name plausibility; every authority should be checked against an official reporter or trusted database.",
    excerpt:
      "The decision notes that case names appeared to mimic actual parties from real rulings but the citations were fake.",
    pinpoint: { caseNumber: "2026 NY Slip Op 50864(U)" },
    tags: ["case-law", "motion-practice", "hallucinated-authority", "genai"],
  }),
  entry({
    title: "Sanchez flags possible generative-AI fabrication in record citations",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/pdfs/2026/2026_31000.pdf",
    sourceType: "court",
    publicationDate: "2026-03-16",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Sanchez v 450 Grand Ave. Owner LLC raises concern that cited testimony was generated by generative AI or otherwise fabricated.",
    whatHappened:
      "The court scrutinized deposition or transcript references that did not align with the record and identified possible AI fabrication.",
    whyItMatters:
      "New York AI-risk monitoring should cover record-citation and evidence-description hallucinations, not only nonexistent case law.",
    practicalImpact:
      "Litigation teams should verify record excerpts, deposition page references and quotations with the same rigor as legal citations.",
    excerpt:
      "The court expressed concern that testimony cited by counsel was either generated by generative artificial intelligence or otherwise fabricated.",
    pinpoint: { caseNumber: "2026 NY Slip Op 31000(U)" },
    tags: ["case-law", "record-citations", "genai", "hallucinated-authority"],
  }),
  entry({
    title: "People v Zuhdi A. discusses AI and facial-recognition reliability in criminal evidence",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2025/2025_51047.htm",
    sourceType: "court",
    publicationDate: "2025-06-17",
    developmentType: "Other official regulatory development",
    legalArea: "Criminal justice",
    authorityType: "Binding law",
    summary:
      "People v Zuhdi A. discusses artificial intelligence and facial-recognition technology in the context of criminal identification evidence.",
    whatHappened:
      "The Criminal Court of the City of New York addressed digital surveillance and AI's role in matching or altering faces and features.",
    whyItMatters:
      "The case places AI and biometric identification inside New York criminal-procedure monitoring, beyond lawyer filing sanctions.",
    practicalImpact:
      "Criminal-defense and prosecution teams should track disclosure, reliability, authentication and due-process issues where AI or facial recognition informs identification.",
    excerpt:
      "The decision discusses artificial intelligence designed to match faces and features that may be altered or fabricated.",
    pinpoint: { caseNumber: "2025 NY Slip Op 51047(U)" },
    tags: ["case-law", "criminal-justice", "facial-recognition", "biometric-identification"],
  }),
  entry({
    title: "Heppner holds public AI tool communications are not privilege or work product",
    sourceName: "CourtListener / RECAP, Southern District of New York",
    sourceUrl:
      "https://storage.courtlistener.com/recap/gov.uscourts.nysd.652137/gov.uscourts.nysd.652137.27.0.pdf",
    sourceType: "court",
    publicationDate: "2026-02-17",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "United States v. Heppner rejects attorney-client privilege and work-product protection for documents a defendant generated through a public AI tool on his own initiative.",
    whatHappened:
      "The SDNY order held that communications with a public AI platform were not privileged and were not prepared by or at the behest of counsel for work-product purposes.",
    whyItMatters:
      "This is the New York federal anchor for AI confidentiality, privilege waiver and work-product risk.",
    practicalImpact:
      "Clients and counsel should prohibit unsupervised entry of sensitive matter facts or legal strategy into public AI tools and document counsel-directed, confidential workflows for any AI-assisted legal work.",
    excerpt:
      "The order addresses whether documents generated through an AI tool are protected by attorney-client privilege or work product.",
    pinpoint: { docket: "1:25-cr-00503", caseNumber: "ECF No. 27" },
    tags: ["federal-case-law", "sdny", "work-product", "attorney-client-privilege", "confidentiality"],
  }),
  entry({
    title: "Park v Kim sets the Second Circuit duty to verify AI-generated citations",
    sourceName: "Justia / United States Court of Appeals for the Second Circuit",
    sourceUrl: "https://law.justia.com/cases/federal/appellate-courts/ca2/22-2057/22-2057-2024-01-30.html",
    sourceType: "court",
    publicationDate: "2024-01-30",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Park v Kim addresses a nonexistent case generated by ChatGPT and anchors the Second Circuit rule that attorneys must confirm the existence and validity of cited authorities.",
    whatHappened:
      "The Second Circuit referred counsel to its Grievance Panel after AI-generated fake authority appeared in an appellate filing.",
    whyItMatters:
      "Park is the controlling federal appellate baseline for New York federal citation-verification duties.",
    practicalImpact:
      "Attorneys practicing in the Second Circuit should verify every AI-assisted citation and quote against primary law before filing.",
    excerpt:
      "The decision addresses counsel's citation of a nonexistent case generated by ChatGPT and Rule 11 verification duties.",
    pinpoint: { caseNumber: "91 F.4th 610" },
    tags: ["federal-case-law", "second-circuit", "rule-11", "hallucinated-authority"],
  }),
  entry({
    title: "Mata v Avianca remains the canonical SDNY ChatGPT sanctions case",
    sourceName: "Justia / Southern District of New York",
    sourceUrl:
      "https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1%3A2022cv01461/575368/54/",
    sourceType: "court",
    publicationDate: "2023-06-22",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Mata v Avianca imposes Rule 11 sanctions after attorneys filed submissions relying on fake ChatGPT-generated cases and quotations.",
    whatHappened:
      "The SDNY found bad faith and imposed a monetary sanction and notice obligations after counsel continued relying on fabricated authorities.",
    whyItMatters:
      "It is the foundational federal New York GenAI-hallucination sanctions decision.",
    practicalImpact:
      "Counsel should preserve AI-use details, correct errors immediately and never submit unverified AI-generated legal research.",
    excerpt:
      "The order imposed sanctions for submissions containing fake cases and fake quotations generated through ChatGPT.",
    pinpoint: { caseNumber: "678 F. Supp. 3d 443", docket: "1:22-cv-01461" },
    tags: ["federal-case-law", "sdny", "rule-11", "chatgpt", "hallucinated-authority"],
  }),
  entry({
    title: "Benjamin v Costco sanctions EDNY counsel for ChatOn fake cases",
    sourceName: "FindLaw / Eastern District of New York",
    sourceUrl: "https://caselaw.findlaw.com/court/us-dis-crt-ed-new-yor/117206693.html",
    sourceType: "court",
    publicationDate: "2025-04-24",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Benjamin v Costco imposes sanctions after counsel used ChatOn to draft a filing that included fake cases in a sworn affirmation.",
    whatHappened:
      "The EDNY found subjective bad faith and ordered a monetary sanction and client service of the order.",
    whyItMatters:
      "It is a key New York federal district decision on AI drafting, sworn filings and nondelegable attorney duties.",
    practicalImpact:
      "Firms should cover AI use by attorneys and staff in written policies, training, cite-checking and client-notice remediation workflows.",
    excerpt:
      "The opinion addresses use of an AI tool to draft a filing containing fake cases and imposes Rule 11 sanctions.",
    pinpoint: { caseNumber: "779 F. Supp. 3d 341" },
    tags: ["federal-case-law", "edny", "rule-11", "chaton", "hallucinated-authority"],
  }),
  entry({
    title: "Kaur v Desso sanctions Claude-generated fabricated quotations in emergency briefing",
    sourceName: "GovInfo / Northern District of New York",
    sourceUrl:
      "https://www.govinfo.gov/content/pkg/USCOURTS-nynd-9_25-cv-00726/pdf/USCOURTS-nynd-9_25-cv-00726-0.pdf",
    sourceType: "court",
    publicationDate: "2025-07-09",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Kaur v Desso imposes Rule 11 sanctions after counsel used Claude Sonnet 4 and filed fabricated quotations from real authorities.",
    whatHappened:
      "The NDNY rejected deadline pressure and illness as excuses for failing to verify AI output in immigration habeas briefing.",
    whyItMatters:
      "The case shows that fabricated quotations from real cases are as serious as entirely fake cases.",
    practicalImpact:
      "Emergency litigation workflows should include rapid primary-source verification for quotes, not only case existence checks.",
    excerpt:
      "The order addresses fabricated quotations in supplemental briefing generated with Claude Sonnet 4 and imposes sanctions.",
    pinpoint: { docket: "9:25-cv-00726" },
    tags: ["federal-case-law", "ndny", "claude", "rule-11", "fabricated-quotations"],
  }),
  entry({
    title: "Flycatcher applies terminal sanctions for repeated AI-like false citations",
    sourceName: "Justia / Southern District of New York",
    sourceUrl:
      "https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1%3A2024cv09429/633195/227/",
    sourceType: "court",
    publicationDate: "2026-02-05",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Flycatcher Corp. Ltd. v Affable Avenue LLC strikes submissions and enters default after repeated false citations and quotation attributions following warnings.",
    whatHappened:
      "The SDNY found bad faith and credited AI hallucination as the coherent explanation for repeated false legal authorities.",
    whyItMatters:
      "It shows that serial AI-citation failures can become case-ending misconduct in New York federal court.",
    practicalImpact:
      "Counsel should escalate repeated AI-citation issues immediately, disclose and correct them, and freeze affected filing workflows before sanctions become terminal.",
    excerpt:
      "The court imposed severe sanctions after repeated filings contained false citations and false quotation attributions.",
    pinpoint: { docket: "1:24-cv-09429" },
    tags: ["federal-case-law", "sdny", "terminal-sanctions", "hallucinated-authority"],
  }),
  entry({
    title: "Jimenez-Fogarty sanctions fabricated citations and requires notice to other courts",
    sourceName: "Justia / Southern District of New York",
    sourceUrl:
      "https://law.justia.com/cases/federal/district-courts/new-york/nysdce/1%3A2024cv08705/631979/192/",
    sourceType: "court",
    publicationDate: "2026-04-29",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Jimenez-Fogarty v Fogarty sanctions an attorney for numerous fabricated citations and requires notice to judges in other pending cases.",
    whatHappened:
      "The SDNY inferred AI use as a plausible source of fabricated citations and imposed monetary and disclosure remedies.",
    whyItMatters:
      "It adds cross-docket risk: AI-citation misconduct in one case can trigger notice duties in other cases.",
    practicalImpact:
      "Law firms should map all matters touched by a lawyer or workflow after a hallucinated-authority incident and notify courts where ordered.",
    excerpt:
      "The order addresses numerous fabricated citations, sanctions and notice to judges in other pending cases.",
    pinpoint: { docket: "1:24-cv-08705" },
    tags: ["federal-case-law", "sdny", "rule-11", "cross-docket-notice", "hallucinated-authority"],
  }),
  entry({
    title: "NYT v OpenAI orders preservation of ChatGPT output log data",
    sourceName: "Justia / Southern District of New York",
    sourceUrl:
      "https://docs.justia.com/cases/federal/district-courts/new-york/nysdce/1%3A2023cv11195/612697/551",
    sourceType: "court",
    publicationDate: "2025-05-13",
    developmentType: "Other official regulatory development",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "In the New York Times/OpenAI litigation, the SDNY orders preservation and segregation of output log data that otherwise would be deleted.",
    whatHappened:
      "The court addressed preservation and discovery of ChatGPT/output log records in major copyright litigation.",
    whyItMatters:
      "The order is a major New York federal signal that AI platform logs can become discovery-preservation targets.",
    practicalImpact:
      "AI companies and litigants should align retention, deletion, legal hold and privacy disclosures with the risk of court-ordered prompt/output preservation.",
    excerpt:
      "The order concerns preservation of output log data in litigation involving OpenAI and generative AI systems.",
    pinpoint: { docket: "1:23-cv-11195" },
    tags: ["federal-case-law", "sdny", "ediscovery", "copyright", "output-logs"],
  }),
  entry({
    title: "Matter of Samuel is an early New York sanctions decision for AI-linked fake citations",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2024/2024_24014.htm",
    sourceType: "court",
    publicationDate: "2024-01-11",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Matter of Samuel scrutinizes papers allegedly containing fictional or erroneous authorities from generative-AI-created information.",
    whatHappened:
      "The Surrogate's Court treated fake citations as a sanctions and professional-responsibility issue in one of New York's early AI-hallucination decisions.",
    whyItMatters:
      "The decision predates Part 161 and shows that ordinary sanctions doctrine already reached AI-linked false legal authority.",
    practicalImpact:
      "Lawyers should treat AI research verification as part of existing candor and frivolous-conduct duties, not only as a new-rule obligation.",
    excerpt:
      "The court addressed sanctions in connection with reply papers containing fictional or erroneous citations from AI-created material.",
    pinpoint: { caseNumber: "2024 NY Slip Op 24014" },
    tags: ["case-law", "early-ai-sanctions", "hallucinated-authority", "professional-responsibility"],
  }),
  entry({
    title: "Matter of Weber separates AI-generated evidence from AI-assisted court papers",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2024/2024_24258.htm",
    sourceType: "court",
    publicationDate: "2024-10-01",
    developmentType: "Other official regulatory development",
    legalArea: "Automated decision-making",
    authorityType: "Binding law",
    summary:
      "Matter of Weber raises AI-generated evidence questions in a trust and accounting dispute.",
    whatHappened:
      "The Surrogate's Court confronted AI-generated evidence rather than merely AI-assisted legal drafting.",
    whyItMatters:
      "It expands New York AI-law monitoring into authentication, evidence reliability and factual-generation issues.",
    practicalImpact:
      "Litigators should separately track AI-generated evidence, because Part 161's court-paper framework does not answer all admissibility or authenticity issues.",
    excerpt:
      "The decision involves evidence generated by artificial intelligence in a trust and accounting dispute.",
    pinpoint: { caseNumber: "2024 NY Slip Op 24258" },
    tags: ["case-law", "ai-generated-evidence", "authentication", "trusts-and-estates"],
  }),
  entry({
    title: "Augustin enforces local AI certification duties for pro se motion papers",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2025/2025_51113.htm",
    sourceType: "court",
    publicationDate: "2025-07-16",
    developmentType: "Other official regulatory development",
    legalArea: "Access to justice",
    authorityType: "Binding law",
    summary:
      "Augustin v Formula 3 Brooklyn orders compliance with a local AI certification rule and schedules sanctions review after noncompliance.",
    whatHappened:
      "The Kings County court applied AI certification requirements to pro se motion papers.",
    whyItMatters:
      "The case shows local AI certification practice emerging before the statewide Part 161 model rule became effective.",
    practicalImpact:
      "Self-represented litigants, clinics and counsel should check individual part rules and certification requirements before filing AI-assisted papers.",
    excerpt:
      "The court addressed noncompliance with IAS Part rules requiring certification for papers prepared with artificial intelligence.",
    pinpoint: { caseNumber: "2025 NY Slip Op 51113(U)" },
    tags: ["case-law", "pro-se", "ai-certification", "sanctions"],
  }),
  entry({
    title: "Ader imposes trial-court sanctions for unvetted AI use and copied fake authority",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2025/2025_51563.htm",
    sourceType: "court",
    publicationDate: "2025-10-01",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Ader v Ader treats unverified AI use and copied unverified authority in motion practice as sanctionable conduct.",
    whatHappened:
      "The court scrutinized hallucinated citations and quotations in summary judgment and sanctions briefing.",
    whyItMatters:
      "It is a major New York trial-court decision on supervision, candor and the insufficiency of arguing that real law might support a fake citation's general proposition.",
    practicalImpact:
      "Law firms should require source-level verification and supervisory review for AI-assisted motion papers and for recycled briefs.",
    excerpt:
      "The decision addresses hallucinated citations and quotations in briefing and applies sanctions analysis to unvetted AI use.",
    pinpoint: { caseNumber: "2025 NY Slip Op 51563(U)" },
    tags: ["case-law", "sanctions", "attorney-supervision", "hallucinated-authority"],
  }),
  entry({
    title: "Idehen decisions scrutinize AI-like fake citations in landlord-tenant filings",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2025/2025_50816.htm",
    sourceType: "court",
    publicationDate: "2025-05-21",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Idehen v Stoute-Phillip addresses landlord-tenant filings with nonexistent cases and AI-like case summaries or mismatched legal propositions.",
    whatHappened:
      "The Civil Court identified fictitious citations and later scrutinized appendix material that appeared copied from a generated or summary source.",
    whyItMatters:
      "The decisions show routine housing and civil dockets encountering AI-like hallucinated legal materials.",
    practicalImpact:
      "Housing-court litigants and counsel should verify case existence, holdings and relevance before relying on AI-generated case summaries.",
    excerpt:
      "The decisions address filings that included cases that did not exist and AI-like summaries or mismatched propositions.",
    pinpoint: { caseNumber: "2025 NY Slip Op 50816(U)" },
    tags: ["case-law", "landlord-tenant", "housing-court", "hallucinated-authority"],
  }),
  entry({
    title: "Grymes treats a motion based on a nonexistent case as sanctions material",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2025/2025_25245.htm",
    sourceType: "court",
    publicationDate: "2025-11-10",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Grymes Dev. Co. v Fodera addresses a motion predicated on a nonexistent case and the resulting sanctions and attorney-fee consequences.",
    whatHappened:
      "The court treated reliance on non-existent authority as frivolous conduct and an attorney-fee risk.",
    whyItMatters:
      "Later New York courts cite Grymes for rejecting simple withdrawal or refiling as a cure for fake-authority filings.",
    practicalImpact:
      "Counsel should correct false authority immediately and expect fee exposure where the opposing party must respond to AI-like fake citations.",
    excerpt:
      "The decision addresses a motion predicated on a non-existent case and sanctions consequences.",
    pinpoint: { caseNumber: "2025 NY Slip Op 25245" },
    tags: ["case-law", "sanctions", "attorney-fees", "hallucinated-authority"],
  }),
  entry({
    title: "H.F. warns counsel over fictitious Court of Claims venue cases",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter//3dseries/2026/2026_26040.htm",
    sourceType: "court",
    publicationDate: "2026-02-10",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "H.F. v State of New York strikes or scrutinizes counsel material using apparently fictitious Court of Claims venue cases.",
    whatHappened:
      "The Court of Claims warned of economic sanctions and grievance referral if fictitious cases recur.",
    whyItMatters:
      "It gives a remedial example short of immediate monetary sanctions while preserving escalation risk.",
    practicalImpact:
      "Court of Claims counsel should verify venue cases and understand that fictitious authority can trigger both economic and disciplinary consequences.",
    excerpt:
      "The court addressed apparently fictitious Court of Claims venue cases and warned about sanctions and grievance referral.",
    pinpoint: { caseNumber: "2026 NY Slip Op 26040" },
    tags: ["case-law", "court-of-claims", "sanctions-warning", "hallucinated-authority"],
  }),
  entry({
    title: "Michaelis addresses pro se AI certification and hallucinated cases",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_26048.shtml",
    sourceType: "court",
    publicationDate: "2026-04-03",
    developmentType: "Other official regulatory development",
    legalArea: "Access to justice",
    authorityType: "Binding law",
    summary:
      "Michaelis v Wilmington Savings Fund Society discusses a self-represented plaintiff's papers implicating local AI certification rules and hallucinated case law.",
    whatHappened:
      "The court noted the motion could be denied without prejudice for lack of AI certification and evidence of unreviewed GenAI use.",
    whyItMatters:
      "It extends the pro se AI-certification line into foreclosure motion practice.",
    practicalImpact:
      "Self-represented litigants and legal-help providers should check local AI certification rules and verify all generated authorities.",
    excerpt:
      "The decision discusses local AI certification rules and clear evidence of unreviewed generative-AI use.",
    pinpoint: { caseNumber: "2026 NY Slip Op 26048" },
    tags: ["case-law", "pro-se", "ai-certification", "foreclosure"],
  }),
  entry({
    title: "Matter of Knights warns a pro se appellant over nonexistent cases",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_02491.shtml",
    sourceType: "court",
    publicationDate: "2026-04-23",
    developmentType: "Other official regulatory development",
    legalArea: "Access to justice",
    authorityType: "Binding law",
    summary:
      "Matter of Knights recognizes sanctions authority after a pro se appellate brief relied on several nonexistent cases.",
    whatHappened:
      "The Appellate Division issued a stern warning instead of monetary sanctions.",
    whyItMatters:
      "It is a useful contrast case for sanction severity in pro se AI-like false authority matters.",
    practicalImpact:
      "Appellate self-help and clerk-facing resources should warn pro se litigants that fake authority can trigger sanctions even if a warning is chosen in a given case.",
    excerpt:
      "The court recognized sanctions authority but issued a stern warning for reliance on nonexistent cases.",
    pinpoint: { caseNumber: "2026 NY Slip Op 02491" },
    tags: ["case-law", "pro-se", "appellate-practice", "sanctions-warning"],
  }),
  entry({
    title: "People v Blackburn distinguishes AI-misconduct impeachment in criminal proceedings",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_50842.shtml",
    sourceType: "court",
    publicationDate: "2026-05-26",
    developmentType: "Other official regulatory development",
    legalArea: "Criminal justice",
    authorityType: "Binding law",
    summary:
      "People v Blackburn addresses questioning a defendant about an unrelated federal finding involving hallucinated citations and AI research-tool use.",
    whatHappened:
      "The court distinguished permissible credibility impeachment based on a judicial finding from improper questioning about AI use itself when irrelevant.",
    whyItMatters:
      "It shows AI-related litigation misconduct can become evidentiary and impeachment terrain in New York criminal proceedings.",
    practicalImpact:
      "Criminal practitioners should evaluate whether AI-misconduct findings are admissible for credibility and avoid overbroad questioning about irrelevant AI use.",
    excerpt:
      "The decision addresses grand-jury questioning about an unrelated finding involving hallucinated citations and AI research tools.",
    pinpoint: { caseNumber: "2026 NY Slip Op 50842(U)" },
    tags: ["case-law", "criminal-justice", "impeachment", "hallucinated-authority"],
  }),
  entry({
    title: "Sharei Torah strikes AI-suspected pro se papers with fictitious and overstated authorities",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/current/3dseries/2026/2026_50994.shtml",
    sourceType: "court",
    publicationDate: "2026-06-01",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Sharei Torah v Hendel addresses pro se submissions with inaccurate citations, overstated holdings, fictitious cases, non-existent pin cites and selective quotation.",
    whatHappened:
      "The court treated the pattern as frivolous conduct and struck the amended answer/defaulted the litigant despite denial of AI use.",
    whyItMatters:
      "The case shows courts can sanction false filing content even without an admission that AI was used.",
    practicalImpact:
      "Litigants cannot avoid consequences by denying AI use where papers contain objectively false authorities and record distortions.",
    excerpt:
      "The decision addresses inaccurate citations, overstated holdings, fictitious cases and AI-suspected drafting.",
    pinpoint: { caseNumber: "2026 NY Slip Op 50994(U)" },
    tags: ["case-law", "pro-se", "frivolous-conduct", "hallucinated-authority"],
  }),
  entry({
    title: "Suarez Medical shows AI certification language in routine no-fault practice",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/3dseries/2025/2025_51996.htm",
    sourceType: "court",
    publicationDate: "2025-12-01",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "Suarez Med., PLLC v Nationwide Ins. includes counsel certification that cited cases and motion materials were not drafted using generative AI.",
    whatHappened:
      "The decision reflects local AI certification language entering routine civil and no-fault insurance practice.",
    whyItMatters:
      "Certification practice is diffusing beyond headline sanctions cases into ordinary high-volume dockets.",
    practicalImpact:
      "No-fault and civil-practice firms should standardize AI-use certifications and verification workflows in high-volume motion pipelines.",
    excerpt:
      "The decision includes counsel certification language concerning whether cited cases and motion materials were drafted using generative AI.",
    pinpoint: { caseNumber: "2025 NY Slip Op 51996(U)" },
    tags: ["case-law", "no-fault", "ai-certification", "civil-practice"],
  }),
  entry({
    title: "UGP Acupuncture reflects generative-AI certification in no-fault motion practice",
    sourceName: "New York State Law Reporting Bureau",
    sourceUrl: "https://www.nycourts.gov/reporter/pdfs/2026/2026_32085.pdf",
    sourceType: "court",
    publicationDate: "2026-06-08",
    developmentType: "Other official regulatory development",
    legalArea: "Professional responsibility",
    authorityType: "Binding law",
    summary:
      "UGP Acupuncture, P.C. v Ameriprise Ins. Co. adds another no-fault motion-practice example using or reflecting generative-AI certification language.",
    whatHappened:
      "The Civil Court decision reflects AI certification practice in routine insurance litigation materials.",
    whyItMatters:
      "It supports monitoring AI filing controls as a procedural practice, not only as sanctions doctrine.",
    practicalImpact:
      "High-volume civil practices should make AI certification checks part of filing QA and template governance.",
    excerpt:
      "The decision reflects generative-AI certification language in routine no-fault motion practice.",
    pinpoint: { caseNumber: "2026 NY Slip Op 32085(U)" },
    tags: ["case-law", "no-fault", "ai-certification", "civil-practice"],
  }),
  entry({
    title: "Judicial Ethics Opinion 26-37 addresses frivolous AI-generated papers",
    sourceName: "New York Advisory Committee on Judicial Ethics",
    sourceUrl: "https://www.nycourts.gov/advisory-committee-judicial-ethics/recently-released-opinions",
    sourceType: "court",
    publicationDate: "2026-01-01",
    developmentType: "Agency guidance",
    legalArea: "Professional responsibility",
    authorityType: "Agency guidance",
    summary:
      "Opinion 26-37 addresses how a court attorney-referee may respond when an attorney submits frivolous AI-generated papers.",
    whatHappened:
      "The ethics index summarizes discretion to determine appropriate action and explains disqualification consequences if the matter is reported to a grievance committee.",
    whyItMatters:
      "It adds a judicial-ethics and discipline channel to New York's AI filing-risk framework.",
    practicalImpact:
      "Judges, referees and attorneys should track grievance-reporting, recusal and disqualification consequences when AI-generated frivolous filings arise.",
    excerpt:
      "The opinion summary addresses attorney submissions of frivolous AI-generated papers and potential grievance-committee reporting.",
    pinpoint: { section: "Opinion 26-37" },
    tags: ["judicial-ethics", "attorney-discipline", "ai-generated-papers", "professional-responsibility"],
  }),
  entry({
    title: "NYC Local Law 144 regulates automated employment decision tools",
    sourceName: "New York City Department of Consumer and Worker Protection",
    sourceUrl: "https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page",
    sourceType: "regulator",
    publicationDate: "2023-07-05",
    developmentType: "Statute",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "NYC Local Law 144 prohibits use of AEDTs unless annual bias-audit, public summary and notice requirements are met.",
    whatHappened:
      "DCWP's official AEDT page explains the law, employer obligations and complaint process for automated employment decision tools.",
    whyItMatters:
      "This is the leading New York employment-AI hard-law framework and a priority live-monitoring source.",
    practicalImpact:
      "Employers and vendors using hiring or promotion tools in NYC should maintain annual independent bias audits, public summaries, candidate/employee notices and complaint response workflows.",
    excerpt:
      "The official DCWP page states that Local Law 144 prohibits AEDT use unless bias audit, publication and notice requirements are satisfied.",
    pinpoint: { section: "Automated Employment Decision Tools" },
    tags: ["local-law-144", "aedt", "employment-ai", "bias-audit"],
  }),
  entry({
    title: "DCWP rule implements Local Law 144 and sets enforcement start",
    sourceName: "New York City Department of Consumer and Worker Protection",
    sourceUrl: "https://www.nyc.gov/site/dca/about/new-laws-rules.page",
    sourceType: "regulator",
    publicationDate: "2023-05-06",
    developmentType: "Final rule",
    legalArea: "Automated decision-making",
    authorityType: "Regulation",
    summary:
      "DCWP identifies the adopted AEDT rule, its effective date and the July 5, 2023 enforcement start for Local Law 144.",
    whatHappened:
      "The New Laws and Rules page lists the rule adoption implementing the AEDT law and links the official rule materials.",
    whyItMatters:
      "The implementing rule is the operational detail layer for bias-audit calculations, notice and publication duties.",
    practicalImpact:
      "Compliance teams should monitor DCWP rule changes for technical audit methodology, notice language and enforcement posture.",
    excerpt:
      "DCWP lists the AEDT rule effective May 6, 2023 and notes enforcement beginning July 5, 2023.",
    pinpoint: { section: "Automated Employment Decision Tools" },
    tags: ["local-law-144", "aedt", "dcwp-rule", "automated-decision-making"],
  }),
  entry({
    title: "OSC audit criticizes DCWP enforcement of Local Law 144",
    sourceName: "Office of the New York State Comptroller",
    sourceUrl:
      "https://www.osc.ny.gov/state-agencies/audits/2025/12/02/enforcement-local-law-144-automated-employment-decision-tools",
    sourceType: "government",
    publicationDate: "2025-12-02",
    developmentType: "Policy report",
    legalArea: "Labor and social law",
    authorityType: "Policy report",
    summary:
      "The State Comptroller audits DCWP enforcement of Local Law 144 and recommends improvements in complaint handling and bias-audit reviews.",
    whatHappened:
      "The audit finds enforcement gaps and recommends processes for complaint routing, research, testing and broader compliance review.",
    whyItMatters:
      "The audit is a strong enforcement-intelligence signal for likely changes in DCWP Local Law 144 implementation.",
    practicalImpact:
      "Employers should expect more scrutiny of public audit summaries, notices and non-disclosure of AEDT use after the audit.",
    excerpt:
      "The audit recommends that DCWP improve AEDT complaint handling, routing and bias-audit reviews for potential non-compliance.",
    pinpoint: { section: "Recommendations" },
    tags: ["local-law-144", "aedt", "enforcement", "audit"],
  }),
  entry({
    title: "NYC Local Law 35 report creates a public-sector algorithmic-tool inventory signal",
    sourceName: "New York City Office of Technology and Innovation",
    sourceUrl:
      "https://www.nyc.gov/assets/oti/downloads/pdf/reports/LL35%20Report%202025%20-%20Final%20-%202026-03-27.pdf",
    sourceType: "government",
    publicationDate: "2026-03-27",
    developmentType: "Policy report",
    legalArea: "Public sector use of AI",
    authorityType: "Policy report",
    summary:
      "NYC OTI publishes the 2025 Local Law 35 agency compliance report on city algorithmic tools.",
    whatHappened:
      "The report inventories agency algorithmic tools and provides transparency on city-government technology use cases.",
    whyItMatters:
      "It is the most concrete NYC public-sector AI/algorithmic monitoring source beyond employment AEDTs.",
    practicalImpact:
      "Public-sector vendors and city agencies should track listed tools, purposes, updates and potential follow-on procurement or governance obligations.",
    excerpt:
      "The Local Law 35 report covers agency compliance reporting for algorithmic tools in calendar year 2025.",
    pinpoint: { section: "Agency Compliance Reporting of Algorithmic Tools" },
    tags: ["local-law-35", "nyc-oti", "public-sector-ai", "algorithmic-tools"],
  }),
  entry({
    title: "NYC GenAI use guidance sets city agency guardrails",
    sourceName: "New York City Office of Technology and Innovation",
    sourceUrl: "https://www.nyc.gov/assets/oti/downloads/pdf/New-York-City-Generative-AI-Use-Guidance.pdf",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Public sector use of AI",
    authorityType: "Agency guidance",
    summary:
      "NYC OTI publishes generative-AI use guidance for city agencies under the city's AI governance program.",
    whatHappened:
      "The guidance addresses responsible exploration of GenAI, including security, privacy, governance and use-case assessment.",
    whyItMatters:
      "It is a live operational source for how New York City agencies may buy, test and use generative AI.",
    practicalImpact:
      "Vendors serving NYC agencies should expect privacy, security, human-review, records and procurement questions for GenAI deployments.",
    excerpt:
      "The guidance provides city use guidance for generative artificial intelligence.",
    pinpoint: { section: "Generative Artificial Intelligence Use Guidance" },
    tags: ["nyc-oti", "generative-ai", "public-sector-ai", "agency-guidance"],
  }),
  entry({
    title: "RAISE Act creates New York frontier-model safety and reporting obligations",
    sourceName: "New York Governor",
    sourceUrl:
      "https://www.governor.ny.gov/news/governor-hochul-signs-nation-leading-legislation-require-ai-frameworks-ai-frontier-models",
    sourceType: "government",
    publicationDate: "2025-12-01",
    developmentType: "Statute",
    legalArea: "AI governance",
    authorityType: "Binding law",
    summary:
      "Governor Hochul announced signature of the RAISE Act, creating frontier AI model safety-framework and incident-reporting obligations.",
    whatHappened:
      "The legislation requires covered frontier AI developers to create and publish safety protocol information and report critical-harm incidents.",
    whyItMatters:
      "RAISE makes New York one of the most important US state jurisdictions for frontier-model transparency and safety compliance.",
    practicalImpact:
      "Frontier-model developers should monitor chapter amendments, DFS oversight-office implementation, safety protocol publication duties and critical-harm reporting procedures.",
    excerpt:
      "The Governor announcement describes legislation requiring AI frameworks for frontier models and incident reporting for critical harms.",
    pinpoint: { section: "Governor announcement", billNumber: "S6953B/A6453B" },
    tags: ["raise-act", "frontier-ai", "incident-reporting", "safety-frameworks"],
  }),
  entry({
    title: "NYDFS Circular Letter No. 7 governs AI and external data in insurance",
    sourceName: "New York State Department of Financial Services",
    sourceUrl: "https://www.dfs.ny.gov/industry-guidance/circular-letters/cl2024-07",
    sourceType: "regulator",
    publicationDate: "2024-07-11",
    developmentType: "Agency guidance",
    legalArea: "Financial services",
    authorityType: "Agency guidance",
    summary:
      "NYDFS sets expectations for insurers using external consumer data, artificial intelligence systems and predictive models in underwriting and pricing.",
    whatHappened:
      "Circular Letter No. 7 explains governance, discrimination, transparency and risk-management expectations for insurers' AI and model use.",
    whyItMatters:
      "It is a central New York financial-services AI governance source, especially for algorithmic discrimination in insurance.",
    practicalImpact:
      "Insurers should document model governance, anti-discrimination controls, board/senior-management oversight, third-party controls and consumer transparency.",
    excerpt:
      "The circular letter identifies DFS expectations for insurers using external consumer data, AI systems and predictive models.",
    pinpoint: { section: "Purpose" },
    tags: ["nydfs", "insurance-ai", "algorithmic-discrimination", "financial-services"],
  }),
  entry({
    title: "NYDFS AI cybersecurity guidance directs covered entities to manage AI risks",
    sourceName: "New York State Department of Financial Services",
    sourceUrl:
      "https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks",
    sourceType: "regulator",
    publicationDate: "2024-10-16",
    developmentType: "Agency guidance",
    legalArea: "Cybersecurity",
    authorityType: "Agency guidance",
    summary:
      "NYDFS issues guidance on cybersecurity risks arising from artificial intelligence and strategies covered entities can use to combat those risks.",
    whatHappened:
      "The guidance describes AI-enabled cyber threats and controls for regulated entities under DFS cybersecurity expectations.",
    whyItMatters:
      "It connects New York AI governance to cybersecurity compliance and third-party risk management for regulated financial entities.",
    practicalImpact:
      "Covered entities should map AI threats into risk assessments, access controls, vendor management, monitoring and incident response.",
    excerpt:
      "The guidance assists covered entities in understanding and assessing cybersecurity risks associated with AI and mitigation controls.",
    pinpoint: { section: "Cybersecurity Risks Arising from Artificial Intelligence" },
    tags: ["nydfs", "cybersecurity", "ai-risk", "financial-services"],
  }),
  entry({
    title: "NYDFS frontier-AI guidance updates cybersecurity monitoring",
    sourceName: "New York State Department of Financial Services",
    sourceUrl:
      "https://www.dfs.ny.gov/industry-guidance/industry-letters/20260521-heightened-cybersecurity-risks-assoc-with-frontier-ai-models",
    sourceType: "regulator",
    publicationDate: "2026-05-21",
    developmentType: "Agency guidance",
    legalArea: "Cybersecurity",
    authorityType: "Agency guidance",
    summary:
      "NYDFS highlights heightened cybersecurity risks associated with frontier AI models and points regulated entities back to its AI cyber-risk guidance.",
    whatHappened:
      "The industry letter updates the DFS risk signal for frontier AI capabilities and defensive measures.",
    whyItMatters:
      "It is a live, current New York financial regulator signal for AI-driven cyber threat evolution.",
    practicalImpact:
      "Financial institutions should refresh cyber controls, model-use policies and vendor restrictions for frontier AI capabilities.",
    excerpt:
      "The letter references heightened cybersecurity risks associated with frontier AI models and DFS's October 2024 AI cyber guidance.",
    pinpoint: { section: "Heightened Cybersecurity Risks Associated with Frontier AI Models" },
    tags: ["nydfs", "frontier-ai", "cybersecurity", "ai-risk"],
  }),
  entry({
    title: "S822 would maintain a New York state AI inventory and automated employment disclosure layer",
    sourceName: "New York State Senate",
    sourceUrl: "https://www.nysenate.gov/legislation/bills/2025/S822",
    sourceType: "parliament",
    publicationDate: "2025-01-08",
    developmentType: "Bill",
    legalArea: "Public sector use of AI",
    authorityType: "Proposed law",
    summary:
      "S822 addresses disclosure of automated employment decision-making tools and a state artificial-intelligence inventory.",
    whatHappened:
      "The bill amends state technology and civil service law around automated decision-making by state agencies and employment decision tools.",
    whyItMatters:
      "It is a New York state-level legislative signal for public-sector AI transparency and employment AI governance.",
    practicalImpact:
      "Public bodies and state contractors should monitor bill status for inventory, disclosure and implementation obligations.",
    excerpt:
      "The bill text addresses automated employment decision-making tools and maintaining an artificial intelligence inventory.",
    pinpoint: { billNumber: "S822" },
    tags: ["state-legislation", "ai-inventory", "automated-decision-making", "public-sector-ai"],
  }),
  entry({
    title: "S8115C proposes automated lending decision-tool protections",
    sourceName: "New York State Senate",
    sourceUrl: "https://www.nysenate.gov/legislation/bills/2025/S8115/amendment/C",
    sourceType: "parliament",
    publicationDate: "2025-05-12",
    developmentType: "Bill",
    legalArea: "Financial services",
    authorityType: "Proposed law",
    summary:
      "S8115C proposes consumer protections for banks using artificial intelligence or automated lending decision-making tools.",
    whatHappened:
      "The bill would regulate automated lending decision tools, including AI use in credit decisions.",
    whyItMatters:
      "It expands New York AI-law monitoring from insurance and cybersecurity into banking and credit decisioning.",
    practicalImpact:
      "Banks and lending vendors should track notice, opt-out, governance and fairness obligations as the proposal moves.",
    excerpt:
      "The sponsor memo states the bill establishes consumer protections for bank use of artificial intelligence in lending decisions.",
    pinpoint: { billNumber: "S8115C" },
    tags: ["state-legislation", "automated-lending", "financial-services", "algorithmic-discrimination"],
  }),
  entry({
    title: "New York AI Act proposal targets high-risk AI discrimination",
    sourceName: "New York State Assembly",
    sourceUrl:
      "https://assembly.state.ny.us/leg/?Text=Y&bn=S1169B&default_fld=&leg_video=&term=2025",
    sourceType: "parliament",
    publicationDate: "2025-01-08",
    developmentType: "Bill",
    legalArea: "AI governance",
    authorityType: "Proposed law",
    summary:
      "The proposed New York Artificial Intelligence Act would regulate high-risk AI decision systems and algorithmic discrimination.",
    whatHappened:
      "The proposal declares a comprehensive AI regulatory intent and places anti-discrimination duties on developers and deployers of AI.",
    whyItMatters:
      "It is the broadest New York state-level AI governance proposal in the current watch corpus.",
    practicalImpact:
      "Developers and deployers should monitor status because the bill could add annual review, impact assessment and anti-discrimination obligations.",
    excerpt:
      "The bill text states that comprehensive regulations are needed to protect New Yorkers from AI risks and algorithmic discrimination.",
    pinpoint: { billNumber: "S1169B" },
    tags: ["state-legislation", "new-york-ai-act", "high-risk-ai", "algorithmic-discrimination"],
  }),
];
