import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";

const verifiedAt = "2026-05-27T00:00:00.000Z";

export interface UsAiSoftLawEntry {
  id: string;
  title: string;
  institution: string;
  authorityType:
    | "soft_law"
    | "agency_guidance"
    | "governance_framework"
    | "technical_standard"
    | "best_practice"
    | "enforcement_signal";
  bindingStatus: "non_binding" | "binding_if_incorporated" | "needs_review";
  sourceUrl: string;
  publicationDate: string | null;
  summary: string;
  legalRelevance: string;
  limitations: string[];
  sourceReferences: SourceReference[];
  citationQualityStatus: CitationQualityStatus;
  lastVerifiedAt: string;
}

function softLawReference(input: {
  title: string;
  institution: string;
  url: string;
  authorityType: string;
  sourceType?: SourceReference["sourceType"];
  responseStatus: number;
  notes?: string | null;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: input.sourceType ?? "official",
    authorityType: input.authorityType,
    publicationDate: null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: input.responseStatus === 200 ? verifiedAt : null,
    jurisdiction: "United States",
    documentType: input.authorityType,
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: "high",
    verificationStatus: input.responseStatus === 200 ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      input.responseStatus !== 200
        ? `Runtime response status was ${input.responseStatus}.`
        : null,
    notes: input.notes ?? null,
  };
}

export const usAiSoftLawBaseline: UsAiSoftLawEntry[] = [
  {
    id: "nist-ai-rmf",
    title: "NIST AI Risk Management Framework",
    institution: "National Institute of Standards and Technology",
    authorityType: "governance_framework",
    bindingStatus: "non_binding",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    publicationDate: null,
    summary:
      "Official NIST AI RMF hub. Treated as non-binding governance framework material unless incorporated by another legal source.",
    legalRelevance:
      "Central U.S. AI governance and risk-management framework for compliance analysis.",
    limitations: ["Not binding law by itself."],
    sourceReferences: [
      softLawReference({
        title: "AI Risk Management Framework",
        institution: "National Institute of Standards and Technology",
        url: "https://www.nist.gov/itl/ai-risk-management-framework",
        authorityType: "Governance framework",
        sourceType: "standards_body",
        responseStatus: 200,
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "nist-airc",
    title: "NIST Trustworthy and Responsible AI Resource Center",
    institution: "National Institute of Standards and Technology",
    authorityType: "governance_framework",
    bindingStatus: "non_binding",
    sourceUrl: "https://airc.nist.gov/",
    publicationDate: null,
    summary:
      "Official NIST AI resource center for trustworthy and responsible AI materials.",
    legalRelevance:
      "Useful for tracking NIST profiles, playbooks, and governance materials.",
    limitations: ["Individual resources require item-level citation before publication."],
    sourceReferences: [
      softLawReference({
        title: "Trustworthy and Responsible AI Resource Center",
        institution: "National Institute of Standards and Technology",
        url: "https://airc.nist.gov/",
        authorityType: "Governance resource center",
        sourceType: "standards_body",
        responseStatus: 200,
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "eeoc-ai-ada",
    title: "EEOC AI and ADA resources",
    institution: "Equal Employment Opportunity Commission",
    authorityType: "agency_guidance",
    bindingStatus: "needs_review",
    sourceUrl:
      "https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada",
    publicationDate: null,
    summary:
      "Official EEOC AI and ADA resource page relevant to employment AI and disability-rights compliance.",
    legalRelevance:
      "Relevant to algorithmic discrimination, employment AI tools, and ADA compliance monitoring.",
    limitations: ["Individual guidance materials require item-level review for legal effect."],
    sourceReferences: [
      softLawReference({
        title: "Artificial Intelligence and the ADA",
        institution: "Equal Employment Opportunity Commission",
        url: "https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada",
        authorityType: "Agency guidance source",
        sourceType: "regulator",
        responseStatus: 200,
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "cfpb-ai",
    title: "CFPB artificial intelligence materials",
    institution: "Consumer Financial Protection Bureau",
    authorityType: "agency_guidance",
    bindingStatus: "needs_review",
    sourceUrl: "https://www.consumerfinance.gov/ai/",
    publicationDate: null,
    summary:
      "Official CFPB AI materials page relevant to consumer finance and automated decision-making.",
    legalRelevance:
      "Relevant to consumer protection, financial services, and algorithmic decision-making monitoring.",
    limitations: ["Individual circulars, guidance, or enforcement items require item-level citation."],
    sourceReferences: [
      softLawReference({
        title: "Artificial intelligence",
        institution: "Consumer Financial Protection Bureau",
        url: "https://www.consumerfinance.gov/ai/",
        authorityType: "Agency guidance source",
        sourceType: "regulator",
        responseStatus: 200,
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "owasp-aima-us",
    title: "OWASP AI Maturity Assessment",
    institution: "OWASP",
    authorityType: "best_practice",
    bindingStatus: "non_binding",
    sourceUrl: "https://owasp.org/www-project-ai-maturity-assessment/",
    publicationDate: null,
    summary:
      "Official OWASP project page for AI maturity assessment materials. Treated as best-practice material.",
    legalRelevance:
      "Relevant to AI security and governance program design, but not U.S. law by itself.",
    limitations: ["Not binding law unless incorporated by another legal or contractual source."],
    sourceReferences: [
      softLawReference({
        title: "OWASP AI Maturity Assessment",
        institution: "OWASP",
        url: "https://owasp.org/www-project-ai-maturity-assessment/",
        authorityType: "Best-practice framework",
        sourceType: "standards_body",
        responseStatus: 200,
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "iso-42001-us",
    title: "ISO/IEC 42001 official metadata",
    institution: "International Organization for Standardization",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/42001",
    publicationDate: null,
    summary:
      "Official ISO metadata for ISO/IEC 42001. Full standard text may be paywalled and is not reproduced.",
    legalRelevance:
      "Relevant as an AI management system standard and possible procurement/compliance reference.",
    limitations: [
      "Official public metadata only.",
      "Do not reproduce paywalled standard text.",
      "Do not present as binding law unless incorporated by a legal source.",
    ],
    sourceReferences: [
      softLawReference({
        title: "ISO/IEC 42001 official metadata",
        institution: "International Organization for Standardization",
        url: "https://www.iso.org/standard/42001",
        authorityType: "Technical standard metadata",
        sourceType: "standards_body",
        responseStatus: 200,
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
];
