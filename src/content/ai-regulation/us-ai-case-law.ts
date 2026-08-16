import type {
  CitationQualityStatus,
  SourcePinpoint,
  SourceReference,
} from "@/agents/ai-regulation/citations";

const verifiedAt = "2026-05-27T00:00:00.000Z";

export interface UsAiCaseLawSource {
  id: string;
  name: string;
  jurisdiction: string;
  sourceUrl: string;
  institution: string;
  sourceType: "court" | "secondary_court_database" | "agency_docket";
  runtimeAccessible: boolean;
  responseStatus: number | null;
  official: boolean;
  parserStatus: "manual_reference" | "needs_dedicated_parser" | "inactive_for_scraping";
  monitoringRecommendation: "manual_review" | "inactive";
  sourceReferences: SourceReference[];
  note: string;
}

export interface UsAiCaseLawEntry {
  id: string;
  caseName: string;
  court: string;
  jurisdiction: string;
  stateOrFederal: "federal" | "state" | "agency";
  date: string | null;
  docketNumber: string | null;
  citation: string | null;
  officialSourceUrl: string | null;
  courtListenerUrl: string | null;
  legalArea: string;
  aiIssue: string;
  proceduralPosture: string | null;
  factualBackground: string | null;
  holdingOrOutcome: string | null;
  legalSignificance: string | null;
  sourceReferences: SourceReference[];
  confidenceLevel: "high" | "medium" | "low" | "needs_review";
  status: "needs_review" | "published" | "archived";
  authorityType: "case_law" | "administrative_decision" | "enforcement_action";
  citationQualityStatus: CitationQualityStatus;
}

function caseSourceReference(input: {
  title: string;
  institution: string;
  url: string;
  official: boolean;
  responseStatus: number | null;
  notes: string;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: input.official ? "court" : "tracker",
    authorityType: input.official ? "Court database" : "Secondary court database",
    publicationDate: null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: input.responseStatus === 200 ? verifiedAt : null,
    jurisdiction: "United States",
    documentType: input.official ? "Court database" : "Secondary legal database",
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: input.official ? "high" : "medium",
    verificationStatus: input.responseStatus === 200 ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      input.responseStatus && input.responseStatus !== 200
        ? `Runtime response status was ${input.responseStatus}.`
        : null,
    notes: input.notes,
  };
}

export const usAiCaseLawSources: UsAiCaseLawSource[] = [
  {
    id: "supreme-court-opinions",
    name: "Supreme Court opinions",
    jurisdiction: "United States federal",
    sourceUrl: "https://www.supremecourt.gov/opinions/opinions.aspx",
    institution: "Supreme Court of the United States",
    sourceType: "court",
    runtimeAccessible: true,
    responseStatus: 200,
    official: true,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      caseSourceReference({
        title: "Opinions of the Court",
        institution: "Supreme Court of the United States",
        url: "https://www.supremecourt.gov/opinions/opinions.aspx",
        official: true,
        responseStatus: 200,
        notes:
          "Official Supreme Court opinions page verified as reachable. Specific AI-related cases require case-level review before publication.",
      }),
    ],
    note:
      "Prepared as an official case-law source. No case holdings or facts are inferred from this source layer.",
  },
  {
    id: "courtlistener-reference",
    name: "CourtListener / RECAP",
    jurisdiction: "United States federal and state",
    sourceUrl: "https://www.courtlistener.com/",
    institution: "Free Law Project / CourtListener",
    sourceType: "secondary_court_database",
    runtimeAccessible: false,
    responseStatus: 403,
    official: false,
    parserStatus: "inactive_for_scraping",
    monitoringRecommendation: "inactive",
    sourceReferences: [
      caseSourceReference({
        title: "CourtListener",
        institution: "Free Law Project",
        url: "https://www.courtlistener.com/",
        official: false,
        responseStatus: 403,
        notes:
          "Secondary legal database returned 403 from runtime. It may be useful for manual discovery or lawful API-based workflows later, but it is not official legal authority.",
      }),
    ],
    note:
      "Discovery/cross-check reference only. Do not treat as official source and do not scrape while blocked.",
  },
];

// Docket data (case name, court, docket number, assigned judge, filing date,
// CourtListener URL) verified through the authenticated CourtListener REST API
// on 2026-08-02. Holdings are summarized conservatively from the widely
// documented public record of each ruling; where a precise ruling date was not
// independently certain, the date field stays null rather than approximate.
const courtListenerVerifiedAt = "2026-08-02T00:00:00.000Z";

function courtListenerDocketReference(input: { title: string; url: string }): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: "Free Law Project / CourtListener (PACER-derived docket)",
    url: input.url,
    canonicalUrl: input.url,
    sourceType: "tracker",
    authorityType: "Secondary court database",
    publicationDate: null,
    detectedAt: courtListenerVerifiedAt,
    retrievedAt: courtListenerVerifiedAt,
    lastVerifiedAt: courtListenerVerifiedAt,
    jurisdiction: "United States",
    documentType: "Docket record",
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: "medium",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: null,
    notes:
      "Docket metadata verified via the authenticated CourtListener REST API on 2026-08-02. CourtListener mirrors PACER records but is not the official court register.",
  };
}

const courtListenerOpinionVerifiedAt = "2026-08-06T00:00:00.000Z";

// Published opinions carry stronger provenance than PACER-derived dockets: the
// text itself is the authority, so these are typed as court documents.
function courtListenerOpinionReference(input: {
  title: string;
  url: string;
  court: string;
  publicationDate: string;
  pinpoint: SourcePinpoint | null;
  excerpt: string | null;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.court,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: "court",
    authorityType: "Published court opinion",
    publicationDate: input.publicationDate,
    detectedAt: courtListenerOpinionVerifiedAt,
    retrievedAt: courtListenerOpinionVerifiedAt,
    lastVerifiedAt: courtListenerOpinionVerifiedAt,
    jurisdiction: "United States",
    documentType: "Court opinion",
    excerpt: input.excerpt,
    pinpoint: input.pinpoint,
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: null,
    notes:
      "Opinion text read via the authenticated CourtListener API on 2026-08-06; holding and sanction terms quoted from the opinion itself.",
  };
}

// Entries whose ruling has been reviewed and can carry a holding.
const reviewedAiCaseLawEntries: UsAiCaseLawEntry[] = [
  {
    id: "case-thomson-reuters-ross",
    caseName: "Thomson Reuters Enterprise Centre GmbH v. ROSS Intelligence Inc.",
    court: "U.S. District Court, District of Delaware (Judge Stephanos Bibas, sitting by designation)",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2025-02-11",
    docketNumber: "1:20-cv-00613",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl:
      "https://www.courtlistener.com/docket/17131648/thomson-reuters-enterprise-centre-gmbh-v-ross-intelligence-inc/",
    legalArea: "Copyright / AI training data",
    aiIssue: "Use of Westlaw headnotes to train a legal-research AI system",
    proceduralPosture: "Revised summary judgment; interlocutory appeal accepted (3d Cir. No. 25-2153, docketed June 24, 2025)",
    factualBackground:
      "ROSS built an AI-driven legal research tool using material derived from Westlaw's editorial headnotes after being refused a license.",
    holdingOrOutcome:
      "The court granted partial summary judgment to Thomson Reuters on direct copying of a set of headnotes and rejected ROSS's fair-use defense, weighing the commercial, non-transformative purpose and market harm; the ruling was certified for interlocutory appeal to the Third Circuit.",
    legalSignificance:
      "First substantive U.S. merits ruling rejecting fair use for AI training on proprietary editorial content — a reference point for every AI training-data dispute.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 1:20-cv-00613 (D. Del.)",
        url: "https://www.courtlistener.com/docket/17131648/thomson-reuters-enterprise-centre-gmbh-v-ross-intelligence-inc/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-bartz-anthropic",
    caseName: "Bartz v. Anthropic PBC",
    court: "U.S. District Court, Northern District of California",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2025-06-23",
    docketNumber: "4:24-cv-05417",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/docket/69058235/bartz-v-anthropic-pbc/",
    legalArea: "Copyright / AI training data",
    aiIssue: "Training large language models on copyrighted books, including copies from pirate libraries",
    proceduralPosture:
      "Summary judgment on fair use; subsequent proposed class settlement; related Ninth Circuit proceeding docketed August 1, 2025 (No. 25-4843)",
    factualBackground:
      "Authors alleged Anthropic copied their books — some purchased and digitized, some downloaded from pirate libraries — to train the Claude models.",
    holdingOrOutcome:
      "The June 2025 order held that training on lawfully acquired copies was transformative fair use, while retaining a library of pirated copies was not protected, leaving that liability for trial; the parties thereafter announced a proposed class settlement.",
    legalSignificance:
      "The first ruling to split AI training fair use by acquisition path — legitimizing training on lawful copies while preserving liability for pirated source libraries.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 4:24-cv-05417 (N.D. Cal.)",
        url: "https://www.courtlistener.com/docket/69058235/bartz-v-anthropic-pbc/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-kadrey-meta",
    caseName: "Kadrey v. Meta Platforms, Inc.",
    court: "U.S. District Court, Northern District of California (Judge Vince Chhabria)",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2025-06-25",
    docketNumber: "3:23-cv-03417",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/docket/67569326/kadrey-v-meta-platforms-inc/",
    legalArea: "Copyright / AI training data",
    aiIssue: "Training the Llama models on plaintiffs' books",
    proceduralPosture: "Summary judgment for defendant on the record presented",
    factualBackground:
      "Authors alleged Meta trained its Llama models on their copyrighted books obtained from shadow libraries.",
    holdingOrOutcome:
      "The court granted summary judgment to Meta on fair use as to these plaintiffs, stressing that they failed to develop the market-harm record — and stating expressly that the ruling did not declare AI training lawful in general.",
    legalSignificance:
      "Read together with Bartz, it frames the fair-use battlefield: outcomes turn on market-dilution evidence, not on a blanket rule for AI training.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 3:23-cv-03417 (N.D. Cal.)",
        url: "https://www.courtlistener.com/docket/67569326/kadrey-v-meta-platforms-inc/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-nyt-openai-microsoft",
    caseName: "The New York Times Company v. Microsoft Corporation (and OpenAI defendants)",
    court: "U.S. District Court, Southern District of New York (Judge Sidney H. Stein)",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2025-03-26",
    docketNumber: "1:23-cv-11195",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl:
      "https://www.courtlistener.com/docket/68117049/the-new-york-times-company-v-microsoft-corporation/",
    legalArea: "Copyright / generative AI outputs and training",
    aiIssue: "Training and output reproduction of Times journalism by GPT-based products",
    proceduralPosture: "Motions to dismiss largely denied; coordinated with related newspaper actions",
    factualBackground:
      "The Times alleges its articles were used to train GPT models and can be regurgitated by the products, competing with its journalism.",
    holdingOrOutcome:
      "In March 2025 the court allowed the core copyright claims (including contributory theories) to proceed while trimming some ancillary claims, moving the flagship publisher-versus-AI dispute into discovery.",
    legalSignificance:
      "The leading publisher case on generative AI: its outcome will shape licensing markets for journalism in AI training and retrieval.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 1:23-cv-11195 (S.D.N.Y.)",
        url: "https://www.courtlistener.com/docket/68117049/the-new-york-times-company-v-microsoft-corporation/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-mobley-workday",
    caseName: "Mobley v. Workday, Inc.",
    court: "U.S. District Court, Northern District of California (Judge Rita F. Lin)",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: null,
    docketNumber: "3:23-cv-00770",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/docket/66831340/mobley-v-workday-inc/",
    legalArea: "Employment discrimination / algorithmic screening",
    aiIssue: "Alleged discriminatory AI-based applicant screening used across many employers",
    proceduralPosture:
      "Claims sustained against the vendor on an agency theory (2024); ADEA collective action allowed to proceed (2025)",
    factualBackground:
      "An applicant rejected from many positions processed through Workday's screening tools alleges disparate impact by age, race, and disability.",
    holdingOrOutcome:
      "The court allowed discrimination claims to proceed against Workday as an agent of employers using its screening tools, and later permitted a nationwide ADEA collective to move forward — putting AI hiring vendors, not only employers, in the liability chain.",
    legalSignificance:
      "The leading U.S. case on vendor liability for algorithmic hiring discrimination; its agency theory reaches every AI screening provider.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 3:23-cv-00770 (N.D. Cal.)",
        url: "https://www.courtlistener.com/docket/66831340/mobley-v-workday-inc/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-garcia-character-technologies",
    caseName: "Garcia v. Character Technologies, Inc.",
    court: "U.S. District Court, Middle District of Florida (Judge Anne C. Conway)",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: null,
    docketNumber: "6:24-cv-01903",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl:
      "https://www.courtlistener.com/docket/69300919/garcia-v-character-technologies-inc/",
    legalArea: "Product liability / AI companion services",
    aiIssue: "Wrongful-death and product-liability claims over a minor's use of an AI companion chatbot",
    proceduralPosture: "Motions to dismiss largely denied (May 2025)",
    factualBackground:
      "A mother alleges her son's suicide followed his relationship with Character.AI chatbots, asserting design-defect and failure-to-warn theories.",
    holdingOrOutcome:
      "The court largely declined to dismiss, allowing product-liability and related claims to proceed and rejecting — at this stage — the argument that chatbot outputs are categorically protected First Amendment speech.",
    legalSignificance:
      "The first major U.S. ruling treating an AI companion service under ordinary product-liability principles, with direct consequences for AI safety design duties.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 6:24-cv-01903 (M.D. Fla.)",
        url: "https://www.courtlistener.com/docket/69300919/garcia-v-character-technologies-inc/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-mata-avianca",
    caseName: "Mata v. Avianca, Inc.",
    court: "U.S. District Court, Southern District of New York (Judge P. Kevin Castel)",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2023-06-22",
    docketNumber: "1:22-cv-01461",
    citation: "678 F. Supp. 3d 443 (S.D.N.Y. 2023)",
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/docket/63107798/mata-v-avianca-inc/",
    legalArea: "Professional responsibility / AI-assisted filings",
    aiIssue: "Court filing containing non-existent cases fabricated by ChatGPT",
    proceduralPosture: "Rule 11 sanctions imposed",
    factualBackground:
      "Counsel submitted a brief citing judicial decisions that did not exist, generated by ChatGPT, and initially stood by them when challenged.",
    holdingOrOutcome:
      "The court sanctioned the attorneys, holding that existing duties of candor and Rule 11 apply fully to AI-assisted work: lawyers must verify what they file.",
    legalSignificance:
      "The foundational AI-hallucination sanctions case, cited by courts nationwide and echoed in a wave of standing orders on AI use in litigation.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Docket 1:22-cv-01461 (S.D.N.Y.)",
        url: "https://www.courtlistener.com/docket/63107798/mata-v-avianca-inc/",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-al-hamim-star-hearthstone",
    caseName: "Al-Hamim v. Star Hearthstone, LLC",
    court: "Colorado Court of Appeals",
    jurisdiction: "Colorado",
    stateOrFederal: "state",
    date: "2024-12-26",
    docketNumber: "24CA0190",
    citation: "2024 COA 128; 564 P.3d 1117",
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/opinion/10304625/al-hamim-v-star-hearthstone-llc/",
    legalArea: "Professional responsibility / AI-assisted filings",
    aiIssue: "Appellate brief containing AI-hallucinated citations filed by a self-represented litigant",
    proceduralPosture: "Published opinion on appeal",
    factualBackground:
      "A self-represented tenant's appellate brief cited non-existent authorities produced by a generative AI tool.",
    holdingOrOutcome:
      "The court of appeals addressed the fabricated citations on the record, declined to impose sanctions on the self-represented litigant in the circumstances, and put future filers on express notice that hallucinated citations may draw sanctions.",
    legalSignificance:
      "A leading published state-court statement on generative-AI hallucinations in filings — notable because it extends the warning to self-represented litigants.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Al-Hamim v. Star Hearthstone, LLC, 2024 COA 128 (opinion record)",
        url: "https://www.courtlistener.com/opinion/10304625/al-hamim-v-star-hearthstone-llc/",
      }),
    ],
    confidenceLevel: "medium",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-garner-kadince",
    caseName: "Garner v. Kadince",
    court: "Utah Court of Appeals",
    jurisdiction: "Utah",
    stateOrFederal: "state",
    date: "2025-05-22",
    docketNumber: "20250188-CA",
    citation: "2025 UT App 80",
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/opinion/10591984/garner-v-kadince/",
    legalArea: "Professional responsibility / AI-assisted filings",
    aiIssue: "Attorney filing containing a fabricated, AI-generated case citation",
    proceduralPosture: "Sanctions ordered on appeal",
    factualBackground:
      "A petition filed by counsel relied on a non-existent precedent generated by an AI tool and not verified before filing.",
    holdingOrOutcome:
      "The court of appeals sanctioned counsel for the fabricated citation, ordering remedial measures and reaffirming that responsibility for verifying authorities cannot be delegated to an AI tool.",
    legalSignificance:
      "A clear state appellate sanction for AI-fabricated authority, marking the professional-responsibility floor for AI-assisted practice.",
    sourceReferences: [
      courtListenerDocketReference({
        title: "Garner v. Kadince, 2025 UT App 80 (opinion record)",
        url: "https://www.courtlistener.com/opinion/10591984/garner-v-kadince/",
      }),
    ],
    confidenceLevel: "medium",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "case-scott-illinois-human-rights",
    caseName: "Scott v. Illinois Human Rights Comm'n",
    court: "Appellate Court of Illinois, First District",
    jurisdiction: "United States state",
    stateOrFederal: "state",
    date: "2026-07-28",
    docketNumber: "1-25-1462",
    citation: "2026 IL App (1st) 251462",
    officialSourceUrl: null,
    courtListenerUrl:
      "https://www.courtlistener.com/opinion/10935788/scott-v-illinois-human-rights-commn/",
    legalArea: "Professional responsibility / AI-fabricated authority",
    aiIssue:
      "Appellate briefs containing false citations and quotations that the court found to be the product of AI hallucinations",
    proceduralPosture:
      "Petition for review of an order of the Illinois Human Rights Commission, No. 2023-CR-0772",
    factualBackground:
      "The petitioner dual-filed a discrimination charge with the EEOC and the Illinois Department of Human Rights but submitted the EEOC's determination to the Department 175 days after receiving it, against the 30-day deadline in section 7A-102(A-1)(1)(iv) of the Illinois Human Rights Act (775 ILCS 5/7A-102(A-1)(1)(iv)). Her counsel's briefs contained citations and quotations that did not exist.",
    holdingOrOutcome:
      "The court affirmed the dismissal, holding the 30-day deadline jurisdictional and not subject to equitable tolling, and separately ordered petitioner's attorney to pay $15,000 in sanctions to the clerk of the Appellate Court, First District, within 30 days, directing the clerk to send a copy of the opinion to the Illinois Attorney Registration and Disciplinary Commission.",
    legalSignificance:
      "The largest state appellate sanction for AI-fabricated citations verified in this database. The court applied the Illinois Supreme Court Policy on Artificial Intelligence (effective January 1, 2025) and stated that \"[t]he only acceptable standard is zero false citations\", noting that the Fourth District had previously fined attorneys $1,000 for the same conduct.",
    sourceReferences: [
      courtListenerOpinionReference({
        title: "Scott v. Illinois Human Rights Comm'n, 2026 IL App (1st) 251462",
        url: "https://www.courtlistener.com/opinion/10935788/scott-v-illinois-human-rights-commn/",
        court: "Appellate Court of Illinois, First District",
        publicationDate: "2026-07-28",
        pinpoint: { paragraph: "¶¶ 47-50, 82" },
        excerpt:
          "Within 30 days of this opinion, attorney Mason Cole shall pay $15,000 as sanctions to the clerk of the Appellate Court, First District.",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "complete",
  },
  {
    id: "case-lichfield-kubler",
    caseName: "Lichfield v. Kubler",
    court: "U.S. Court of Appeals for the Tenth Circuit",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2026-07-27",
    docketNumber: "25-4135",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/opinion/10935365/lichfield-v-kubler/",
    legalArea: "Professional responsibility / AI-fabricated authority",
    aiIssue:
      "Misrepresentations of legal authority in an appellate brief that the court assumed resulted from generative AI use",
    proceduralPosture: "Direct appeal; sanctions considered on the court's own assessment of the briefing",
    factualBackground:
      "Counsel's brief misrepresented legal authority. The court compared the errors to its earlier decision in Amarsingh v. Frontier Airlines, Inc., No. 24-1391, 2026 WL 352016 (10th Cir. Feb. 9, 2026) (unpublished), where a filer's brief cited seven cases that do not exist and two real cases that did not contain the quoted language.",
    holdingOrOutcome:
      "The court affirmed and declined to sanction, finding the errors materially less serious than in Amarsingh — where it had ordered a $1,000 payment and a referral to the relevant disciplinary body — but warned that counsel remains responsible for ensuring that representations to the court are warranted by the law, \"no matter the technology used to create them\".",
    legalSignificance:
      "A federal appellate statement that generative AI \"is no longer a novel tool\", so its novelty no longer mitigates: attorneys using it \"must be willing to also apply actual intelligence in its execution\". Establishes a visible severity gradient between warning and monetary sanction in the Tenth Circuit.",
    sourceReferences: [
      courtListenerOpinionReference({
        title: "Lichfield v. Kubler, No. 25-4135 (10th Cir. July 27, 2026)",
        url: "https://www.courtlistener.com/opinion/10935365/lichfield-v-kubler/",
        court: "U.S. Court of Appeals for the Tenth Circuit",
        publicationDate: "2026-07-27",
        pinpoint: { page: "slip op. 45-46" },
        excerpt:
          "generative artificial intelligence is no longer a novel tool. Attorneys who choose to use it must be willing to also apply \"actual intelligence in its execution.\"",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "complete",
  },
  {
    id: "case-dineen-shibata-kotchka",
    caseName: "dineen/shibata v. Kotchka",
    court: "Arizona Court of Appeals, Division One",
    jurisdiction: "United States state",
    stateOrFederal: "state",
    date: "2026-07-15",
    docketNumber: "1 CA-CV 25-0606 PB",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/opinion/10931696/dineenshibata-v-kotchka/",
    legalArea: "Professional responsibility / AI-fabricated authority",
    aiIssue:
      "Hallucinated and misrepresented case citations obtained through generative AI in an opening brief filed by a self-represented appellant",
    proceduralPosture: "Appeal from admission of a will to formal probate and appointment of a personal representative",
    factualBackground:
      "The appellant challenged the probate of his mother's will and the appointment of his sister as personal representative. His opening brief included authorities he obtained through generative AI without verifying that they existed or said what he claimed.",
    holdingOrOutcome:
      "The court affirmed and imposed sanctions under Arizona Rule of Civil Appellate Procedure 25, A.R.S. § 12-349 and its inherent powers, awarding the appellee the portion of her reasonable attorneys' fees incurred because of the hallucinated and misrepresented citations, plus her costs on appeal, contingent on compliance with ARCAP 21.",
    legalSignificance:
      "The first published Arizona authority squarely addressing generative-AI citation errors. It adopts a calibrated rule: using Gen-AI \"is not, in and of itself, objectionable\" and may widen access to justice for people without counsel, provided the person signing the brief verifies that every cited case is real, accurately quoted, and correctly tied to the record.",
    sourceReferences: [
      courtListenerOpinionReference({
        title: "dineen/shibata v. Kotchka, No. 1 CA-CV 25-0606 PB (Ariz. Ct. App. July 15, 2026)",
        url: "https://www.courtlistener.com/opinion/10931696/dineenshibata-v-kotchka/",
        court: "Arizona Court of Appeals, Division One",
        publicationDate: "2026-07-15",
        pinpoint: { paragraph: "¶¶ 2, 12, 31" },
        excerpt:
          "the appropriate sanction here is to award Dineen that portion of her reasonable attorneys' fees under A.R.S. Section 12-349 and ARCAP 25 incurred due to the use of hallucinated and misrepresented case citations.",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "complete",
  },
  {
    id: "case-romero-corona-investments",
    caseName: "Romero v. Corona Investments, LLC",
    court: "U.S. Court of Appeals for the Seventh Circuit",
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: "2026-07-20",
    docketNumber: "25-2021",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl:
      "https://www.courtlistener.com/opinion/10932940/bernardo-romero-v-corona-investments-llc/",
    legalArea: "Professional responsibility / AI-fabricated authority",
    aiIssue: "Quotations in an appellee brief alleged to be the product of AI hallucinations",
    proceduralPosture:
      "Motion to strike portions of the appellee brief and, alternatively, for sanctions, filed more than three months after oral argument",
    factualBackground:
      "The appellant moved to strike parts of the appellee's brief and sought sanctions on the ground that quotations in it were the fruit of AI hallucinations. The court ordered the appellee to respond and reviewed both submissions.",
    holdingOrOutcome:
      "The court stopped short of striking the brief or imposing sanctions, noting the appellant's own acknowledgement that the errors may reflect a lack of care but \"did not materially affect the presentation of the appeal\", and lodged a general reminder that members of its bar must exercise care and diligence in preparing briefs.",
    legalSignificance:
      "Marks the lower bound of the emerging federal appellate scale: where AI-derived quotation errors do not affect the presentation of the appeal, courts may decline both striking and sanctions while still recording the lapse on the published record.",
    sourceReferences: [
      courtListenerOpinionReference({
        title: "Romero v. Corona Investments, LLC, No. 25-2021 (7th Cir. July 20, 2026)",
        url: "https://www.courtlistener.com/opinion/10932940/bernardo-romero-v-corona-investments-llc/",
        court: "U.S. Court of Appeals for the Seventh Circuit",
        publicationDate: "2026-07-20",
        pinpoint: { section: "part III" },
        excerpt:
          "we stop short of striking Corona's brief or imposing sanctions. As Romero candidly acknowledges, any errors may reflect a lack of care on Corona's part, but they did not materially affect the presentation of the appeal.",
      }),
    ],
    confidenceLevel: "high",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "complete",
  },
  {
    id: "case-del-biaggio-bansen",
    caseName: "Del Biaggio v. Bansen",
    court: "California Court of Appeal",
    jurisdiction: "United States state",
    stateOrFederal: "state",
    date: "2026-07-10",
    docketNumber: "A174647",
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: "https://www.courtlistener.com/opinion/10925595/del-biaggio-v-bansen/",
    legalArea: "Professional responsibility / AI-fabricated authority",
    aiIssue:
      "Citation errors in appellate briefing that counsel attributed in part to generative-AI-assisted drafting",
    proceduralPosture: "Appeal in a contract fee dispute, with a respondents' motion for sanctions filed in the court of appeal",
    factualBackground:
      "Counsel's declaration indicated he had used generative AI to make additions to his brief. The court identified citation errors it declined to catalogue in full, stating it could not say whether all of them were attributable to AI use.",
    holdingOrOutcome:
      "The court measured counsel's drafting protocol against the State Bar of California's \"Practical Guidance for the Use of Generative Artificial Intelligence in the Practice of Law\" and found it non-compliant, cautioning counsel to adopt a different approach to preparing briefs.",
    legalSignificance:
      "Applies a state bar's generative-AI guidance as the operative professional standard on appeal: a lawyer \"must review all outputs produced using AI tools for accuracy, including but not limited to analysis and citations to authority before submission to the court\".",
    sourceReferences: [
      courtListenerOpinionReference({
        title: "Del Biaggio v. Bansen, No. A174647 (Cal. Ct. App. July 10, 2026)",
        url: "https://www.courtlistener.com/opinion/10925595/del-biaggio-v-bansen/",
        court: "California Court of Appeal",
        publicationDate: "2026-07-10",
        pinpoint: { page: "slip op. 17-18" },
        excerpt:
          "a lawyer must review all outputs produced using AI tools for accuracy, including but not limited to analysis and citations to authority before submission to the court.",
      }),
    ],
    confidenceLevel: "medium",
    status: "published",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
];

// Second case-law pass (2026-08). These are live dockets surfaced through the
// CourtListener search API and kept deliberately thin: case name, court,
// docket number, filing date, assigned judge and nature-of-suit code come
// straight from the docket record, and nothing else is asserted. None of them
// has a reviewed ruling, so every entry stays `needs_review` with a null
// `holdingOrOutcome` — the monitor surfaces that the dispute exists without
// putting an unverified holding in front of a reader.
const recentDocketVerifiedAt = "2026-08-05T00:00:00.000Z";

function recentAiDocket(input: {
  id: string;
  caseName: string;
  court: string;
  jurisdiction: string;
  dateFiled: string;
  docketNumber: string;
  path: string;
  legalArea: string;
  aiIssue: string;
  natureOfSuit: string | null;
}): UsAiCaseLawEntry {
  const url = `https://www.courtlistener.com${input.path}`;
  return {
    id: input.id,
    caseName: input.caseName,
    court: input.court,
    jurisdiction: "United States federal",
    stateOrFederal: "federal",
    date: input.dateFiled,
    docketNumber: input.docketNumber,
    citation: null,
    officialSourceUrl: null,
    courtListenerUrl: url,
    legalArea: input.legalArea,
    aiIssue: input.aiIssue,
    proceduralPosture: "Docket record only — no ruling reviewed in this pass.",
    factualBackground: null,
    holdingOrOutcome: null,
    legalSignificance: null,
    sourceReferences: [
      {
        sourceRole: "primary",
        title: `Docket ${input.docketNumber} (${input.jurisdiction})`,
        institution: "Free Law Project / CourtListener (PACER-derived docket)",
        url,
        canonicalUrl: url,
        sourceType: "tracker",
        authorityType: "Secondary court database",
        publicationDate: input.dateFiled,
        detectedAt: recentDocketVerifiedAt,
        retrievedAt: recentDocketVerifiedAt,
        lastVerifiedAt: recentDocketVerifiedAt,
        jurisdiction: "United States",
        documentType: "Docket record",
        excerpt: null,
        pinpoint: null,
        reliabilityLevel: "medium",
        verificationStatus: "verified",
        archivedUrl: null,
        accessLimitations: null,
        notes:
          `Case name, court, docket number and filing date returned by the CourtListener search API on 2026-08-05` +
          (input.natureOfSuit
            ? `; the docket's nature-of-suit code is ${input.natureOfSuit}.`
            : ".") +
          " CourtListener mirrors PACER records but is not the official court register, and no ruling in this matter has been reviewed.",
      },
    ],
    confidenceLevel: "medium",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  };
}

const recentAiDocketEntries: UsAiCaseLawEntry[] = [
  recentAiDocket({
    id: "docket-sony-music-uncharted-labs",
    caseName: "Sony Music Entertainment v. Uncharted Labs, Inc.",
    court: "U.S. District Court, Southern District of New York (Judge Alvin K. Hellerstein)",
    jurisdiction: "S.D.N.Y.",
    dateFiled: "2026-07-20",
    docketNumber: "1:26-cv-06120",
    path: "/docket/73641108/sony-music-entertainment-v-uncharted-labs-inc/",
    legalArea: "Copyright / generative AI",
    aiIssue: "Copyright action against the developer of a generative music AI service.",
    natureOfSuit: "820 Copyright",
  }),
  recentAiDocket({
    id: "docket-hachette-google",
    caseName: "Hachette Book Group, Inc. v. Google LLC",
    court: "U.S. District Court, Southern District of New York (Judge Loretta A. Preska)",
    jurisdiction: "S.D.N.Y.",
    dateFiled: "2026-07-10",
    docketNumber: "1:26-cv-05870",
    path: "/docket/73603888/hachette-book-group-inc-v-google-llc/",
    legalArea: "Copyright / generative AI",
    aiIssue: "Publisher copyright action against Google.",
    natureOfSuit: "820 Copyright",
  }),
  recentAiDocket({
    id: "docket-jamendo-suno",
    caseName: "S.A. Jamendo v. Suno Inc.",
    court: "U.S. District Court, District of Massachusetts (Judge Angel Kelley)",
    jurisdiction: "D. Mass.",
    dateFiled: "2026-06-29",
    docketNumber: "1:26-cv-12966",
    path: "/docket/73547746/sa-jamendo-v-suno-inc/",
    legalArea: "Copyright / generative AI",
    aiIssue: "Copyright action against the developer of a generative music AI service.",
    natureOfSuit: "820 Copyright",
  }),
  recentAiDocket({
    id: "docket-evox-stability",
    caseName: "EVOX Productions LLC v. Stability AI, Inc.",
    court: "U.S. District Court, Central District of California (Judge Christina A. Snyder)",
    jurisdiction: "C.D. Cal.",
    dateFiled: "2026-07-02",
    docketNumber: "2:26-cv-07201",
    path: "/docket/73569472/evox-productions-llc-v-stability-ai-inc/",
    legalArea: "Copyright / generative AI",
    aiIssue: "Copyright action against a generative image-model developer.",
    natureOfSuit: "820 Copyright",
  }),
  recentAiDocket({
    id: "docket-jamendo-nvidia",
    caseName: "S.A. Jamendo v. Nvidia Corporation",
    court: "U.S. District Court, Northern District of California (Judge Noel Wise)",
    jurisdiction: "N.D. Cal.",
    dateFiled: "2026-06-22",
    docketNumber: "5:26-cv-06206",
    path: "/docket/73517096/sa-jamendo-v-nvidia-corporation/",
    legalArea: "Copyright / generative AI",
    aiIssue: "Copyright action against a model developer over training material.",
    natureOfSuit: "820 Copyright",
  }),
  recentAiDocket({
    id: "docket-cnn-perplexity",
    caseName: "Cable News Network Inc v. Perplexity AI, Inc.",
    court: "U.S. District Court, Southern District of New York (Judge Loretta A. Preska)",
    jurisdiction: "S.D.N.Y.",
    dateFiled: "2026-05-28",
    docketNumber: "1:26-cv-04427",
    path: "/docket/73402641/cable-news-network-inc-v-perplexity-ai-inc/",
    legalArea: "Publisher dispute / AI answer engines",
    aiIssue: "Broadcaster action against an AI answer-engine provider.",
    natureOfSuit: null,
  }),
  recentAiDocket({
    id: "docket-dw-character-technologies",
    caseName: "D.W. v. Character Technologies, Inc.",
    court: "U.S. District Court, Eastern District of Virginia (Judge Raymond Alvin Jackson)",
    jurisdiction: "E.D. Va.",
    dateFiled: "2025-12-19",
    docketNumber: "2:25-cv-00824",
    path: "/docket/72062057/dw-v-character-technologies-inc/",
    legalArea: "AI companion services",
    aiIssue:
      "Claim brought by a pseudonymous individual plaintiff against the operator of an AI companion chatbot service.",
    natureOfSuit: null,
  }),
  recentAiDocket({
    id: "docket-pj-character-technologies",
    caseName: "P.J. v. Character Technologies, Inc.",
    court: "U.S. District Court, Northern District of New York (Judge Mae Avila D'Agostino)",
    jurisdiction: "N.D.N.Y.",
    dateFiled: "2025-09-16",
    docketNumber: "1:25-cv-01295",
    path: "/docket/71359395/pj-v-character-technologies-inc/",
    legalArea: "AI companion services",
    aiIssue:
      "Claim brought by a pseudonymous individual plaintiff against the operator of an AI companion chatbot service.",
    natureOfSuit: null,
  }),
  recentAiDocket({
    id: "docket-lampert-altman",
    caseName: "Lampert v. Altman",
    court: "U.S. District Court, Northern District of California (Judge Jacqueline Scott Corley)",
    jurisdiction: "N.D. Cal.",
    dateFiled: "2026-04-29",
    docketNumber: "3:26-cv-03706",
    path: "/docket/73260599/lampert-v-altman/",
    legalArea: "AI chatbot services",
    aiIssue: "Individual claim naming the chief executive of an AI chatbot developer.",
    natureOfSuit: null,
  }),
  recentAiDocket({
    id: "docket-stacey-altman",
    caseName: "Stacey v. Altman",
    court: "U.S. District Court, Northern District of California (Judge Jacqueline Scott Corley)",
    jurisdiction: "N.D. Cal.",
    dateFiled: "2026-04-29",
    docketNumber: "3:26-cv-03701",
    path: "/docket/73260511/stacey-v-altman/",
    legalArea: "AI chatbot services",
    aiIssue: "Individual claim naming the chief executive of an AI chatbot developer.",
    natureOfSuit: null,
  }),
  recentAiDocket({
    id: "docket-mwansa-altman",
    caseName: "Mwansa, Sr. v. Altman",
    court: "U.S. District Court, Northern District of California (Judge Maxine M. Chesney)",
    jurisdiction: "N.D. Cal.",
    dateFiled: "2026-04-29",
    docketNumber: "3:26-cv-03703",
    path: "/docket/73260522/mwansa-sr-v-altman/",
    legalArea: "AI chatbot services",
    aiIssue: "Individual claim naming the chief executive of an AI chatbot developer.",
    natureOfSuit: null,
  }),
];

export const usAiCaseLawEntries: UsAiCaseLawEntry[] = [
  ...reviewedAiCaseLawEntries,
  ...recentAiDocketEntries,
];

export const usAiCaseLawTopics = [
  "generative AI copyright",
  "AI evidence",
  "automated decision-making",
  "algorithmic discrimination",
  "employment AI",
  "biometric privacy",
  "consumer protection or deceptive AI claims",
  "financial services and algorithmic underwriting",
  "platform or content moderation where AI-specific",
  "deepfakes and synthetic media",
  "public-sector algorithms",
  "law enforcement and surveillance AI",
];
