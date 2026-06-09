import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";

export type UsAuthorityType =
  | "federal_hard_law"
  | "federal_legislative_activity"
  | "federal_agency_guidance"
  | "federal_agency_enforcement"
  | "federal_rulemaking"
  | "soft_law"
  | "technical_standard"
  | "case_law_source";

export interface UsBaselineSourceHealth {
  runtimeAccessible: boolean;
  responseStatus: number | null;
  lastCheckedAt: string;
  activeRecommendation: "active" | "inactive" | "manual_review";
  parserStatus: "ready" | "needs_dedicated_parser" | "manual_reference";
  expectedDocumentTypes: string[];
  reliabilityNotes: string;
}

export interface UsFederalBaselineEntry {
  id: string;
  title: string;
  shortTitle: string;
  sourceInstitution: string;
  officialSourceUrl: string;
  publicationDate: string | null;
  effectiveDate: string | null;
  authorityType: UsAuthorityType;
  bindingStatus: "binding" | "non_binding" | "needs_review";
  legalArea: string;
  jurisdiction: "United States federal";
  summary: string;
  keyObligations: string[];
  enforcementRelevance: string;
  sourceReferences: SourceReference[];
  sourceHealth: UsBaselineSourceHealth;
  citationQualityStatus: CitationQualityStatus;
  lastVerifiedAt: string;
  confidenceLevel: "high" | "medium" | "low" | "needs_review";
  publicVisibilityStatus: "baseline_public" | "admin_review_only";
}

export interface UsTimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  sourceInstitution: string;
  sourceUrl: string;
  authorityType: UsAuthorityType;
  legalEffect: string;
  bindingStatus: "binding" | "non_binding" | "needs_review";
  confidenceLevel: "high" | "medium" | "low" | "needs_review";
  lastVerifiedAt: string;
  sourceReferences: SourceReference[];
}

const verifiedAt = "2026-05-27T00:00:00.000Z";

function usReference(input: {
  title: string;
  institution: string;
  url: string;
  sourceType?: SourceReference["sourceType"];
  authorityType: string;
  publicationDate?: string | null;
  documentType?: string | null;
  notes?: string | null;
  responseStatus?: number | null;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: input.sourceType ?? "official",
    authorityType: input.authorityType,
    publicationDate: input.publicationDate ?? null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: input.responseStatus === 200 ? verifiedAt : null,
    jurisdiction: "United States federal",
    documentType: input.documentType ?? null,
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: input.responseStatus === 200 ? "high" : "medium",
    verificationStatus: input.responseStatus === 200 ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      input.responseStatus && input.responseStatus !== 200
        ? `Runtime response status was ${input.responseStatus}; keep as manual review.`
        : null,
    notes: input.notes ?? null,
  };
}

function sourceHealth(input: Partial<UsBaselineSourceHealth>): UsBaselineSourceHealth {
  return {
    runtimeAccessible: input.runtimeAccessible ?? false,
    responseStatus: input.responseStatus ?? null,
    lastCheckedAt: input.lastCheckedAt ?? verifiedAt,
    activeRecommendation: input.activeRecommendation ?? "manual_review",
    parserStatus: input.parserStatus ?? "manual_reference",
    expectedDocumentTypes: input.expectedDocumentTypes ?? [],
    reliabilityNotes: input.reliabilityNotes ?? "Needs source-specific review before activation.",
  };
}

export const usFederalBaselineEntries: UsFederalBaselineEntry[] = [
  {
    id: "federal-register-ai-query",
    title: "Federal Register artificial intelligence query",
    shortTitle: "Federal Register AI materials",
    sourceInstitution: "Federal Register",
    officialSourceUrl:
      "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=artificial%20intelligence&order=newest",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_rulemaking",
    bindingStatus: "needs_review",
    legalArea: "Federal rulemaking and agency notices",
    jurisdiction: "United States federal",
    summary:
      "Official Federal Register API query used as a recurring monitor for AI-related federal rules, notices, and proposed actions.",
    keyObligations: [],
    enforcementRelevance:
      "Potential source for binding rules, proposed rules, and agency notices once individual documents are reviewed.",
    sourceReferences: [
      usReference({
        title: "Federal Register API artificial intelligence search",
        institution: "Federal Register",
        url: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=artificial%20intelligence&order=newest",
        authorityType: "Federal Register API query",
        documentType: "API search",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "active",
      parserStatus: "ready",
      expectedDocumentTypes: ["rules", "proposed rules", "notices", "presidential documents"],
      reliabilityNotes: "Official API endpoint returned 200 and is already active in scheduled scans.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "congress-ai-legislation-search",
    title: "Congress.gov artificial intelligence legislation search",
    shortTitle: "Congress.gov AI bills",
    sourceInstitution: "Congress.gov",
    officialSourceUrl:
      "https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22artificial+intelligence%22%7D",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_legislative_activity",
    bindingStatus: "needs_review",
    legalArea: "Congressional AI legislation",
    jurisdiction: "United States federal",
    summary:
      "Official congressional search surface for AI-related bills. Runtime access returned 403, so this remains manual-review until an accessible official feed/API method is configured.",
    keyObligations: [],
    enforcementRelevance:
      "Congressional bills are legislative activity, not binding law unless enacted.",
    sourceReferences: [
      usReference({
        title: "Congress.gov artificial intelligence legislation search",
        institution: "Congress.gov",
        url: "https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22artificial+intelligence%22%7D",
        authorityType: "Congressional bill search",
        documentType: "Legislative database search",
        responseStatus: 403,
        notes:
          "Official source returned 403 from runtime; do not activate until an official accessible method is identified.",
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: false,
      responseStatus: 403,
      activeRecommendation: "inactive",
      parserStatus: "needs_dedicated_parser",
      expectedDocumentTypes: ["bills", "bill status", "sponsors", "committee activity"],
      reliabilityNotes:
        "Official source exists but runtime access is blocked. Keep inactive for recurring scans.",
    }),
    citationQualityStatus: "needs_manual_verification",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "medium",
    publicVisibilityStatus: "admin_review_only",
  },
  {
    id: "nist-ai-rmf",
    title: "AI Risk Management Framework",
    shortTitle: "NIST AI RMF",
    sourceInstitution: "National Institute of Standards and Technology",
    officialSourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "soft_law",
    bindingStatus: "non_binding",
    legalArea: "AI risk management and governance",
    jurisdiction: "United States federal",
    summary:
      "Official NIST AI RMF hub. Treated as non-binding governance framework material unless incorporated by another legal source.",
    keyObligations: [],
    enforcementRelevance:
      "Influential governance framework for AI risk management and compliance program design.",
    sourceReferences: [
      usReference({
        title: "AI Risk Management Framework",
        institution: "National Institute of Standards and Technology",
        url: "https://www.nist.gov/itl/ai-risk-management-framework",
        authorityType: "Governance framework",
        sourceType: "standards_body",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "active",
      parserStatus: "ready",
      expectedDocumentTypes: ["framework updates", "profiles", "playbooks"],
      reliabilityNotes: "Official NIST page returned 200 and is already active in monitoring.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "nist-airc",
    title: "NIST Trustworthy and Responsible AI Resource Center",
    shortTitle: "NIST AI Resource Center",
    sourceInstitution: "National Institute of Standards and Technology",
    officialSourceUrl: "https://airc.nist.gov/",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "soft_law",
    bindingStatus: "non_binding",
    legalArea: "AI governance resources",
    jurisdiction: "United States federal",
    summary:
      "Official NIST AI Resource Center. Included as a baseline source for governance materials and future official profiles.",
    keyObligations: [],
    enforcementRelevance:
      "Useful source for NIST AI risk-management materials; not binding law by itself.",
    sourceReferences: [
      usReference({
        title: "Trustworthy and Responsible AI Resource Center",
        institution: "National Institute of Standards and Technology",
        url: "https://airc.nist.gov/",
        authorityType: "Governance resource center",
        sourceType: "standards_body",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "manual_review",
      parserStatus: "needs_dedicated_parser",
      expectedDocumentTypes: ["profiles", "resources", "framework materials"],
      reliabilityNotes: "Official NIST resource returned 200; add parser before recurring activation.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "eeoc-ai-ada",
    title: "Artificial Intelligence and the ADA",
    shortTitle: "EEOC AI and ADA",
    sourceInstitution: "Equal Employment Opportunity Commission",
    officialSourceUrl:
      "https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_agency_guidance",
    bindingStatus: "needs_review",
    legalArea: "Employment discrimination and disability rights",
    jurisdiction: "United States federal",
    summary:
      "Official EEOC AI and ADA resource page. Individual guidance documents should be reviewed before stating legal effect.",
    keyObligations: [],
    enforcementRelevance:
      "Relevant to employment AI, algorithmic discrimination, and disability-law compliance monitoring.",
    sourceReferences: [
      usReference({
        title: "Artificial Intelligence and the ADA",
        institution: "Equal Employment Opportunity Commission",
        url: "https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada",
        authorityType: "Agency guidance source",
        sourceType: "regulator",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "active",
      parserStatus: "ready",
      expectedDocumentTypes: ["technical assistance", "guidance", "resources"],
      reliabilityNotes: "Official EEOC page returned 200 and is active in monitoring.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "cfpb-ai",
    title: "CFPB artificial intelligence materials",
    shortTitle: "CFPB AI",
    sourceInstitution: "Consumer Financial Protection Bureau",
    officialSourceUrl: "https://www.consumerfinance.gov/ai/",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_agency_guidance",
    bindingStatus: "needs_review",
    legalArea: "Consumer finance and automated decision-making",
    jurisdiction: "United States federal",
    summary:
      "Official CFPB AI page for consumer finance and AI-related materials.",
    keyObligations: [],
    enforcementRelevance:
      "Relevant to consumer finance, algorithmic decision-making, and enforcement monitoring.",
    sourceReferences: [
      usReference({
        title: "Artificial intelligence",
        institution: "Consumer Financial Protection Bureau",
        url: "https://www.consumerfinance.gov/ai/",
        authorityType: "Agency guidance source",
        sourceType: "regulator",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "active",
      parserStatus: "ready",
      expectedDocumentTypes: ["guidance", "blog posts", "circulars", "enforcement signals"],
      reliabilityNotes: "Official CFPB page returned 200 and is active in monitoring.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "copyright-office-ai",
    title: "Copyright Office artificial intelligence materials",
    shortTitle: "Copyright Office AI",
    sourceInstitution: "U.S. Copyright Office",
    officialSourceUrl: "https://www.copyright.gov/ai/",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_agency_guidance",
    bindingStatus: "needs_review",
    legalArea: "Copyright and generative AI",
    jurisdiction: "United States federal",
    summary:
      "Official U.S. Copyright Office AI page for copyright and AI materials.",
    keyObligations: [],
    enforcementRelevance:
      "Relevant to generative AI, copyright registration, authorship, and policy monitoring.",
    sourceReferences: [
      usReference({
        title: "Artificial Intelligence",
        institution: "U.S. Copyright Office",
        url: "https://www.copyright.gov/ai/",
        authorityType: "Agency policy source",
        sourceType: "official",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "manual_review",
      parserStatus: "needs_dedicated_parser",
      expectedDocumentTypes: ["reports", "notices", "policy statements"],
      reliabilityNotes: "Official source returned 200; parser not yet implemented.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "uspto-ai",
    title: "USPTO artificial intelligence initiatives",
    shortTitle: "USPTO AI",
    sourceInstitution: "United States Patent and Trademark Office",
    officialSourceUrl: "https://www.uspto.gov/initiatives/artificial-intelligence",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_agency_guidance",
    bindingStatus: "needs_review",
    legalArea: "Patents, trademarks, and AI",
    jurisdiction: "United States federal",
    summary:
      "Official USPTO AI initiatives page for AI-related patent and trademark materials.",
    keyObligations: [],
    enforcementRelevance:
      "Relevant to AI inventorship, patent examination, and USPTO policy monitoring.",
    sourceReferences: [
      usReference({
        title: "Artificial Intelligence",
        institution: "United States Patent and Trademark Office",
        url: "https://www.uspto.gov/initiatives/artificial-intelligence",
        authorityType: "Agency policy source",
        sourceType: "official",
        responseStatus: 200,
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "manual_review",
      parserStatus: "needs_dedicated_parser",
      expectedDocumentTypes: ["guidance", "notices", "policy initiatives"],
      reliabilityNotes: "Official source returned 200; parser not yet implemented.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "high",
    publicVisibilityStatus: "baseline_public",
  },
  {
    id: "sec-ai",
    title: "SEC artificial intelligence page",
    shortTitle: "SEC AI",
    sourceInstitution: "Securities and Exchange Commission",
    officialSourceUrl: "https://www.sec.gov/ai",
    publicationDate: null,
    effectiveDate: null,
    authorityType: "federal_agency_guidance",
    bindingStatus: "needs_review",
    legalArea: "Securities, investment advice, and predictive analytics",
    jurisdiction: "United States federal",
    summary:
      "Official SEC AI page returned 200 in the latest baseline verification, but existing source registry history includes prior 403 behavior and should be rechecked before activation.",
    keyObligations: [],
    enforcementRelevance:
      "Relevant to predictive analytics, broker-dealer/investment adviser activity, and SEC AI statements.",
    sourceReferences: [
      usReference({
        title: "Artificial Intelligence",
        institution: "Securities and Exchange Commission",
        url: "https://www.sec.gov/ai",
        authorityType: "Agency AI page",
        sourceType: "regulator",
        responseStatus: 200,
        notes:
          "Latest baseline check returned 200, but previous runtime checks returned 403. Keep manual review until stable.",
      }),
    ],
    sourceHealth: sourceHealth({
      runtimeAccessible: true,
      responseStatus: 200,
      activeRecommendation: "manual_review",
      parserStatus: "needs_dedicated_parser",
      expectedDocumentTypes: ["statements", "rules", "risk alerts", "enforcement materials"],
      reliabilityNotes:
        "Latest check returned 200, but prior verification marked access blocked. Reconfirm before activation.",
    }),
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
    confidenceLevel: "medium",
    publicVisibilityStatus: "baseline_public",
  },
];

export const usFederalTimelineEntries: UsTimelineEntry[] = [
  {
    id: "nist-ai-rmf-baseline",
    date: verifiedAt,
    title: "NIST AI RMF official source baseline verified",
    description:
      "The NIST AI Risk Management Framework page is verified as an official, public, recurring source for U.S. AI governance materials.",
    sourceInstitution: "National Institute of Standards and Technology",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    authorityType: "soft_law",
    legalEffect:
      "Non-binding governance framework unless incorporated by another legal source.",
    bindingStatus: "non_binding",
    confidenceLevel: "high",
    lastVerifiedAt: verifiedAt,
    sourceReferences: usFederalBaselineEntries.find((entry) => entry.id === "nist-ai-rmf")!
      .sourceReferences,
  },
  {
    id: "federal-register-ai-baseline",
    date: verifiedAt,
    title: "Federal Register AI monitoring source verified",
    description:
      "The official Federal Register API query is verified as the primary recurring federal source for AI-related rules, notices, and proposed actions.",
    sourceInstitution: "Federal Register",
    sourceUrl:
      "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=artificial%20intelligence&order=newest",
    authorityType: "federal_rulemaking",
    legalEffect:
      "Individual documents may have binding or non-binding effect depending on document type and final status.",
    bindingStatus: "needs_review",
    confidenceLevel: "high",
    lastVerifiedAt: verifiedAt,
    sourceReferences: usFederalBaselineEntries.find(
      (entry) => entry.id === "federal-register-ai-query",
    )!.sourceReferences,
  },
  {
    id: "copyright-office-ai-baseline",
    date: verifiedAt,
    title: "Copyright Office AI source verified",
    description:
      "The official U.S. Copyright Office AI page is verified for future copyright and generative-AI monitoring.",
    sourceInstitution: "U.S. Copyright Office",
    sourceUrl: "https://www.copyright.gov/ai/",
    authorityType: "federal_agency_guidance",
    legalEffect:
      "Agency policy and source baseline; individual reports or guidance require item-level review.",
    bindingStatus: "needs_review",
    confidenceLevel: "high",
    lastVerifiedAt: verifiedAt,
    sourceReferences: usFederalBaselineEntries.find(
      (entry) => entry.id === "copyright-office-ai",
    )!.sourceReferences,
  },
];

export function getUsFederalSourceBacklog() {
  return usFederalBaselineEntries.filter(
    (entry) =>
      entry.sourceHealth.activeRecommendation !== "active" ||
      entry.sourceHealth.parserStatus !== "ready" ||
      entry.citationQualityStatus !== "complete",
  );
}
