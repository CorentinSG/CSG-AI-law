import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";

const verifiedAt = "2026-07-16T00:00:00.000Z";

export interface InternationalAiStandardEntry {
  id: string;
  title: string;
  institution: string;
  authorityType:
    | "soft_law"
    | "technical_standard"
    | "governance_framework"
    | "policy_framework"
    | "best_practice";
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

function internationalReference(input: {
  title: string;
  institution: string;
  url: string;
  authorityType: string;
  sourceType?: SourceReference["sourceType"];
  publicationDate?: string | null;
  accessLimitations?: string | null;
  notes?: string | null;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: input.sourceType ?? "standards_body",
    authorityType: input.authorityType,
    publicationDate: input.publicationDate ?? null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: verifiedAt,
    jurisdiction: "International",
    documentType: input.authorityType,
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: input.accessLimitations ?? null,
    notes: input.notes ?? null,
  };
}

export const internationalAiStandardsBaseline: InternationalAiStandardEntry[] = [
  {
    id: "iso-iec-42001",
    title: "ISO/IEC 42001 AI management system",
    institution: "ISO / IEC",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/42001",
    publicationDate: "2023",
    summary:
      "International AI management-system standard for establishing, implementing, maintaining, and improving organizational AI governance.",
    legalRelevance:
      "Relevant to AI governance programs, procurement, assurance, and potential legal incorporation by regulators, contracts, or conformity-assessment schemes.",
    limitations: [
      "Official public metadata only; do not reproduce paywalled standard text.",
      "Not binding law unless incorporated by an official legal, procurement, contractual, or certification requirement.",
    ],
    sourceReferences: [
      internationalReference({
        title: "ISO/IEC 42001 official metadata",
        institution: "ISO",
        url: "https://www.iso.org/standard/42001",
        authorityType: "Technical standard metadata",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "iso-iec-23894",
    title: "ISO/IEC 23894 AI risk management guidance",
    institution: "ISO / IEC",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/77304.html",
    publicationDate: "2023",
    summary:
      "International guidance standard for managing AI-specific risks and integrating AI risk management into organizational activities.",
    legalRelevance:
      "Useful for risk-management evidence, AI governance controls, and alignment with management-system or procurement expectations.",
    limitations: [
      "Guidance standard, not standalone law.",
      "Official public metadata only; do not reproduce paywalled standard text.",
    ],
    sourceReferences: [
      internationalReference({
        title: "ISO/IEC 23894 official metadata",
        institution: "ISO",
        url: "https://www.iso.org/standard/77304.html",
        authorityType: "Technical standard metadata",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "iso-iec-22989",
    title: "ISO/IEC 22989 AI concepts and terminology",
    institution: "ISO / IEC",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/74296.html",
    publicationDate: "2022",
    summary:
      "International terminology and concepts standard for artificial intelligence, used as a shared vocabulary across AI standards and governance work.",
    legalRelevance:
      "Supports precise classification, definitions, and cross-standard interpretation when monitoring AI legal and governance materials.",
    limitations: [
      "Terminology standard, not a legal obligation by itself.",
      "Official public metadata only; do not reproduce paywalled standard text.",
    ],
    sourceReferences: [
      internationalReference({
        title: "ISO/IEC 22989 official metadata",
        institution: "ISO",
        url: "https://www.iso.org/standard/74296.html",
        authorityType: "Technical standard metadata",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "iso-iec-23053",
    title: "ISO/IEC 23053 machine-learning framework",
    institution: "ISO / IEC",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/74438.html",
    publicationDate: "2022",
    summary:
      "International framework and shared terminology for describing AI systems that use machine-learning technology.",
    legalRelevance:
      "Helpful for understanding AI system components, lifecycle references, and technical descriptions in legal and regulatory materials.",
    limitations: [
      "Framework standard, not standalone binding law.",
      "Official public metadata only; do not reproduce paywalled standard text.",
    ],
    sourceReferences: [
      internationalReference({
        title: "ISO/IEC 23053 official metadata",
        institution: "ISO",
        url: "https://www.iso.org/standard/74438.html",
        authorityType: "Technical standard metadata",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "iso-iec-42005",
    title: "ISO/IEC 42005 AI system impact assessment",
    institution: "ISO / IEC",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/42005",
    publicationDate: "2025",
    summary:
      "International guidance standard for AI system impact assessments covering potential effects on individuals, groups, and society.",
    legalRelevance:
      "Relevant to impact-assessment workflows, AI governance documentation, and links between AI management systems and legal risk controls.",
    limitations: [
      "Guidance standard, not standalone binding law.",
      "Official public metadata only; do not reproduce paywalled standard text.",
    ],
    sourceReferences: [
      internationalReference({
        title: "ISO/IEC 42005 official metadata",
        institution: "ISO",
        url: "https://www.iso.org/standard/42005",
        authorityType: "Technical standard metadata",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "oecd-ai-principles",
    title: "OECD AI Principles",
    institution: "OECD.AI",
    authorityType: "policy_framework",
    bindingStatus: "non_binding",
    sourceUrl: "https://oecd.ai/en/ai-principles",
    publicationDate: "2019",
    summary:
      "International policy principles for trustworthy AI, updated to remain practical and flexible across jurisdictions.",
    legalRelevance:
      "Relevant as a high-level policy framework frequently referenced by governments, regulators, and AI governance programs.",
    limitations: ["Not binding law unless adopted or incorporated by a separate official legal source."],
    sourceReferences: [
      internationalReference({
        title: "OECD AI Principles overview",
        institution: "OECD.AI",
        url: "https://oecd.ai/en/ai-principles",
        authorityType: "Policy framework",
        sourceType: "official",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "unesco-ai-ethics-recommendation",
    title: "UNESCO Recommendation on the Ethics of Artificial Intelligence",
    institution: "UNESCO",
    authorityType: "soft_law",
    bindingStatus: "non_binding",
    sourceUrl: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
    publicationDate: "2021",
    summary:
      "Global UNESCO recommendation on AI ethics, human rights, transparency, fairness, human oversight, and policy implementation.",
    legalRelevance:
      "Relevant to international soft-law monitoring and comparative AI governance analysis, especially where national policies cite UNESCO ethics commitments.",
    limitations: ["UNESCO recommendation, not directly binding law without domestic implementation or incorporation."],
    sourceReferences: [
      internationalReference({
        title: "Recommendation on the Ethics of Artificial Intelligence",
        institution: "UNESCO",
        url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
        authorityType: "Soft-law recommendation",
        sourceType: "official",
        publicationDate: "2021",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "ieee-7000",
    title: "IEEE 7000-2021 ethical concerns in system design",
    institution: "IEEE Standards Association",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://standards.ieee.org/standard/7000-2021.html",
    publicationDate: "2021",
    summary:
      "IEEE standard describing a model process for addressing ethical concerns during system design and value-based engineering.",
    legalRelevance:
      "Relevant to AI governance, procurement, safety, and internal-control evidence when organizations document value-sensitive system design.",
    limitations: [
      "Not binding law unless incorporated by legal, procurement, certification, or contractual requirements.",
      "Official public metadata only; do not reproduce paywalled standard text.",
    ],
    sourceReferences: [
      internationalReference({
        title: "IEEE 7000-2021 official standard page",
        institution: "IEEE Standards Association",
        url: "https://standards.ieee.org/standard/7000-2021.html",
        authorityType: "Technical standard metadata",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
];
