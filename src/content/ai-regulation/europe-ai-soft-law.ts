import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";

const verifiedAt = "2026-05-27T00:00:00.000Z";

export interface EuropeAiSoftLawEntry {
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

function softLawReference(input: {
  title: string;
  institution: string;
  url: string;
  authorityType: string;
  sourceType?: SourceReference["sourceType"];
  publicationDate?: string | null;
  notes?: string | null;
  accessLimitations?: string | null;
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
    lastVerifiedAt: verifiedAt,
    jurisdiction: "Europe / International",
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

export const europeAiSoftLawBaseline: EuropeAiSoftLawEntry[] = [
  {
    id: "gpai-code-of-practice",
    title: "General-Purpose AI Code of Practice",
    institution: "European Commission / AI Office",
    authorityType: "governance_framework",
    bindingStatus: "non_binding",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/general-purpose-ai-code-practice-now-available",
    publicationDate: "2025-07-10",
    summary:
      "Official Commission material states that the General-Purpose AI Code of Practice is available. This baseline treats it as implementation-supporting governance material, not as standalone binding law.",
    legalRelevance:
      "Relevant to GPAI compliance posture and AI Act implementation review.",
    limitations: [
      "Specific obligations must be tied to the AI Act and official Code text before publication.",
    ],
    sourceReferences: [
      softLawReference({
        title: "General-Purpose AI Code of Practice now available",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/general-purpose-ai-code-practice-now-available",
        authorityType: "European Commission implementation material",
        publicationDate: "2025-07-10",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "gpai-provider-guidelines",
    title: "Guidelines for providers of general-purpose AI models",
    institution: "European Commission",
    authorityType: "soft_law",
    bindingStatus: "needs_review",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-providers-general-purpose-ai-models",
    publicationDate: "2025-07-18",
    summary:
      "Official Commission news page for GPAI provider guidelines. The legal effect of individual guidance statements requires document-level review.",
    legalRelevance:
      "Relevant to GPAI provider compliance and AI Office implementation monitoring.",
    limitations: [
      "Do not treat guidance as binding legislation without legal-effect review.",
    ],
    sourceReferences: [
      softLawReference({
        title:
          "Commission publishes guidelines for providers of general-purpose AI models",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-providers-general-purpose-ai-models",
        authorityType: "European Commission guidance",
        publicationDate: "2025-07-18",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "edpb-ai-topic",
    title: "EDPB Artificial Intelligence topic page",
    institution: "European Data Protection Board",
    authorityType: "soft_law",
    bindingStatus: "needs_review",
    sourceUrl:
      "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
    publicationDate: null,
    summary:
      "Official EDPB AI topic page for AI-related data-protection materials. Individual documents require item-level review.",
    legalRelevance:
      "Relevant to EU data-protection interpretation and AI governance monitoring.",
    limitations: ["Topic page only; cite individual EDPB documents for publication."],
    sourceReferences: [
      softLawReference({
        title: "Artificial Intelligence topic page",
        institution: "European Data Protection Board",
        url: "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
        authorityType: "Regulator guidance source",
        sourceType: "regulator",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "edps-ai-subject",
    title: "EDPS Artificial Intelligence subject page",
    institution: "European Data Protection Supervisor",
    authorityType: "soft_law",
    bindingStatus: "needs_review",
    sourceUrl:
      "https://www.edps.europa.eu/data-protection/our-work/subjects/artificial-intelligence_en?page=1",
    publicationDate: null,
    summary:
      "Official EDPS AI subject page for opinions, guidance, and institutional materials. Individual items require item-level review.",
    legalRelevance:
      "Relevant to EU institutional data-protection and AI governance monitoring.",
    limitations: ["Topic page only; cite individual EDPS documents for publication."],
    sourceReferences: [
      softLawReference({
        title: "Artificial Intelligence subject page",
        institution: "European Data Protection Supervisor",
        url: "https://www.edps.europa.eu/data-protection/our-work/subjects/artificial-intelligence_en?page=1",
        authorityType: "Regulator guidance source",
        sourceType: "regulator",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "iso-iec-42001",
    title: "ISO/IEC 42001 official metadata",
    institution: "International Organization for Standardization",
    authorityType: "technical_standard",
    bindingStatus: "binding_if_incorporated",
    sourceUrl: "https://www.iso.org/standard/42001",
    publicationDate: null,
    summary:
      "Official ISO metadata page for ISO/IEC 42001. The full standard text may be paywalled and must not be reproduced.",
    legalRelevance:
      "Relevant as an AI management system standard and governance benchmark.",
    limitations: [
      "Official public metadata only.",
      "Do not reproduce paywalled standard text.",
      "Do not present as binding law unless incorporated by an official legal source.",
    ],
    sourceReferences: [
      softLawReference({
        title: "ISO/IEC 42001 official metadata",
        institution: "International Organization for Standardization",
        url: "https://www.iso.org/standard/42001",
        authorityType: "Technical standard metadata",
        sourceType: "standards_body",
        accessLimitations: "Full standard text may be paywalled; public metadata only.",
      }),
    ],
    citationQualityStatus: "complete",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "owasp-aima",
    title: "OWASP AI Maturity Assessment",
    institution: "OWASP",
    authorityType: "best_practice",
    bindingStatus: "non_binding",
    sourceUrl: "https://owasp.org/www-project-ai-maturity-assessment/",
    publicationDate: null,
    summary:
      "Official OWASP project page for AI maturity assessment materials. Treated as non-binding best-practice material.",
    legalRelevance:
      "Relevant to AI governance, AI security, and compliance-program design as soft-law context.",
    limitations: ["Not binding law unless incorporated by a legal or contractual source."],
    sourceReferences: [
      softLawReference({
        title: "OWASP AI Maturity Assessment",
        institution: "OWASP",
        url: "https://owasp.org/www-project-ai-maturity-assessment/",
        authorityType: "Best-practice framework",
        sourceType: "standards_body",
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
    publicationDate: null,
    summary:
      "Official OECD AI Principles page. Treated as international policy framework material, not binding EU law.",
    legalRelevance:
      "Relevant as a policy framework and governance reference for AI compliance analysis.",
    limitations: ["Not binding law unless incorporated by a separate official legal source."],
    sourceReferences: [
      softLawReference({
        title: "OECD AI Principles",
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
    id: "council-of-europe-ai",
    title: "Council of Europe artificial intelligence materials",
    institution: "Council of Europe",
    authorityType: "policy_framework",
    bindingStatus: "needs_review",
    sourceUrl: "https://www.coe.int/en/web/artificial-intelligence/home",
    publicationDate: null,
    summary:
      "Official Council of Europe AI hub is relevant but currently blocked from the scan runtime.",
    legalRelevance:
      "Relevant to broader European AI governance and Convention-related tracking once runtime access is available.",
    limitations: [
      "Runtime returned 403 during verification.",
      "Keep inactive for automated monitoring until access is reliably restored.",
    ],
    sourceReferences: [
      softLawReference({
        title: "Artificial intelligence hub",
        institution: "Council of Europe",
        url: "https://www.coe.int/en/web/artificial-intelligence/home",
        authorityType: "Policy framework",
        accessLimitations: "Runtime returned 403; inactive for scraping.",
      }),
    ],
    citationQualityStatus: "needs_manual_verification",
    lastVerifiedAt: verifiedAt,
  },
];
