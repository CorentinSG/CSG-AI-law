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

export const usAiCaseLawEntries: UsAiCaseLawEntry[] = [];

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
