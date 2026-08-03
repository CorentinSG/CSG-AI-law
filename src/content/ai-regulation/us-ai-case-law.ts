import type {
  CitationQualityStatus,
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

export const usAiCaseLawEntries: UsAiCaseLawEntry[] = [
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
