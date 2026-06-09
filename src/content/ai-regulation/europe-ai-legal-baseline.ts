import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";
import { parseEurLexAiActHtml } from "@/agents/ai-regulation/eurLexAiActParser";

export type EuropeBaselineAuthorityType =
  | "binding_law"
  | "eu_guidance"
  | "governance_body"
  | "technical_standard"
  | "soft_law"
  | "case_law_source";

export interface EuropeBaselineSourceStatus {
  runtimeAccessible: boolean;
  responseStatus: number | null;
  lastCheckedAt: string;
  monitoringRecommendation: "active" | "inactive" | "manual_review";
  parserStatus: "ready" | "needs_dedicated_parser" | "manual_reference";
  note: string;
}

export interface EuropeAiActApplicationDate {
  date: string;
  label: string;
  legalEffect: string;
  sourceReferences: SourceReference[];
  confidence: "high" | "medium" | "low";
}

export interface EuropeAiActBaseline {
  id: string;
  authorityLayer: Extract<EuropeBaselineAuthorityType, "binding_law">;
  bindingStatusLabel: "binding_eu_law";
  officialTitle: string;
  shortTitle: string;
  celexNumber: string | null;
  ojPublicationInfo: string;
  eurLexUrl: string;
  dateAdopted: string;
  datePublished: string;
  dateEnteredIntoForce: string;
  scope: string;
  riskBasedStructure: string;
  prohibitedPractices: string;
  highRiskSystems: string;
  transparencyObligations: string;
  gpaiModelObligations: string;
  governanceAndEnforcement: string;
  memberStateResponsibilities: string;
  penaltiesAndEnforcementFramework: string;
  keyArticlesChaptersAnnexes: string[];
  phasedApplicationDates: EuropeAiActApplicationDate[];
  sourceReferences: SourceReference[];
  citationQualityStatus: CitationQualityStatus;
  confidenceLevel: "high" | "medium" | "low";
  lastVerifiedAt: string;
}

export interface EuropeGovernanceActor {
  id: string;
  name: string;
  authorityLayer: Extract<EuropeBaselineAuthorityType, "eu_guidance" | "governance_body">;
  bindingStatusLabel:
    | "not_binding_by_itself"
    | "institutional_role_under_binding_law"
    | "needs_article_level_review";
  role: string;
  legalBasis: string;
  responsibilities: string[];
  sourceReferences: SourceReference[];
  citationQualityStatus: CitationQualityStatus;
  confidenceLevel: "high" | "medium" | "low";
  lastVerifiedAt: string;
}

const verifiedAt = "2026-05-27T00:00:00.000Z";

const eurLexAiActStructureHtml = `
<!doctype html>
<html lang="en">
  <head>
    <link rel="canonical" href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng" />
  </head>
  <body>
    <div id="title">Regulation (EU) 2024/1689 of the European Parliament and of the Council laying down harmonised rules on artificial intelligence</div>
    <div class="eli-subdivision" id="cpt_I">
      <p class="oj-ti-section-1">CHAPTER I</p>
      <div class="eli-title">GENERAL PROVISIONS</div>
    </div>
    <div class="eli-subdivision" id="art_1">
      <p class="oj-ti-art">Article 1</p>
      <div class="eli-title">Subject matter</div>
    </div>
    <div class="eli-subdivision" id="art_4">
      <p class="oj-ti-art">Article 4</p>
      <div class="eli-title">AI literacy</div>
    </div>
    <div class="eli-subdivision" id="art_5">
      <p class="oj-ti-art">Article 5</p>
      <div class="eli-title">Prohibited AI practices</div>
    </div>
    <div class="eli-subdivision" id="art_6">
      <p class="oj-ti-art">Article 6</p>
      <div class="eli-title">Classification rules for high-risk AI systems</div>
    </div>
    <div class="eli-subdivision" id="art_50">
      <p class="oj-ti-art">Article 50</p>
      <div class="eli-title">Transparency obligations for providers and deployers of certain AI systems</div>
    </div>
    <div class="eli-subdivision" id="art_64">
      <p class="oj-ti-art">Article 64</p>
      <div class="eli-title">AI Office</div>
    </div>
    <div class="eli-subdivision" id="art_113">
      <p class="oj-ti-art">Article 113</p>
      <div class="eli-title">Entry into force and application</div>
    </div>
    <div class="eli-container" id="anx_I">
      <p class="oj-doc-ti">ANNEX I</p>
      <p class="oj-doc-ti">List of Union harmonisation legislation</p>
    </div>
    <div class="eli-container" id="anx_III">
      <p class="oj-doc-ti">ANNEX III</p>
      <p class="oj-doc-ti">High-risk AI systems referred to in Article 6(2)</p>
    </div>
    <div class="eli-container" id="anx_XI">
      <p class="oj-doc-ti">ANNEX XI</p>
      <p class="oj-doc-ti">Technical documentation referred to in Article 53(1), point (a) — technical documentation for providers of general-purpose AI models</p>
    </div>
    <div class="eli-container" id="anx_XIII">
      <p class="oj-doc-ti">ANNEX XIII</p>
      <p class="oj-doc-ti">Criteria for the designation of general-purpose AI models with systemic risk referred to in Article 51</p>
    </div>
  </body>
</html>
`;

const eurLexAiActStructure = parseEurLexAiActHtml(eurLexAiActStructureHtml);

function officialReference(input: {
  role?: SourceReference["sourceRole"];
  title: string;
  institution: string;
  url: string;
  sourceType?: SourceReference["sourceType"];
  authorityType: string;
  publicationDate?: string | null;
  documentType?: string | null;
  pinpoint?: SourceReference["pinpoint"];
  notes?: string | null;
  responseStatus?: number | null;
}): SourceReference {
  return {
    sourceRole: input.role ?? "primary",
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
    jurisdiction: "European Union",
    documentType: input.documentType ?? null,
    excerpt: null,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations:
      input.responseStatus && input.responseStatus !== 200
        ? `Runtime response status was ${input.responseStatus}; manual review may be needed.`
        : null,
    notes: input.notes ?? null,
  };
}

export const eurLexAiActReference = officialReference({
  title: "Regulation (EU) 2024/1689 of the European Parliament and of the Council",
  institution: "EUR-Lex / Official Journal of the European Union",
  url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
  sourceType: "official",
  authorityType: "Regulation",
  publicationDate: "2024-07-12",
  documentType: "Official Journal legal text",
  responseStatus: 202,
  notes:
    "Official EUR-Lex ELI URL for the AI Act. Runtime returned 202 during this verification pass, so the legal text is cited as official but monitoring still needs a dedicated parser.",
});

export const commissionAiActPolicyReference = officialReference({
  role: "supporting",
  title: "AI Act",
  institution: "European Commission, Digital Strategy",
  url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
  authorityType: "European Commission policy page",
  documentType: "Policy page",
  notes:
    "Official Commission policy page used for application-date and implementation overview citations.",
});

export const navigatingAiActReference = officialReference({
  role: "supporting",
  title: "Navigating the AI Act",
  institution: "European Commission, Digital Strategy",
  url: "https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act",
  authorityType: "European Commission FAQ",
  documentType: "FAQ",
  notes:
    "Official Commission FAQ used as a supporting source for phased application explanations.",
});

function aiActArticleReference(articleLabel: string) {
  const article = eurLexAiActStructure.articles.find(
    (entry) => entry.label === articleLabel,
  );

  if (!article) return eurLexAiActReference;

  return officialReference({
    title: eurLexAiActReference.title,
    institution: eurLexAiActReference.institution,
    url: eurLexAiActReference.url,
    sourceType: "official",
    authorityType: eurLexAiActReference.authorityType ?? "Regulation",
    publicationDate: eurLexAiActReference.publicationDate,
    documentType: eurLexAiActReference.documentType,
    responseStatus: 202,
    pinpoint: {
      article: article.label,
      CELEX: eurLexAiActStructure.celexNumber ?? "32024R1689",
    },
    notes: `${article.label} — ${article.title}. Pinpoint extracted from curated EUR-Lex HTML structure; full-text parser rollout remains in progress.`,
  });
}

function aiActAnnexReference(annexLabel: string) {
  const annex = eurLexAiActStructure.annexes.find(
    (entry) => entry.label === annexLabel,
  );

  if (!annex) return eurLexAiActReference;

  return officialReference({
    title: eurLexAiActReference.title,
    institution: eurLexAiActReference.institution,
    url: eurLexAiActReference.url,
    sourceType: "official",
    authorityType: eurLexAiActReference.authorityType ?? "Regulation",
    publicationDate: eurLexAiActReference.publicationDate,
    documentType: eurLexAiActReference.documentType,
    responseStatus: 202,
    pinpoint: {
      annex: annex.label,
      CELEX: eurLexAiActStructure.celexNumber ?? "32024R1689",
    },
    notes: `${annex.label} — ${annex.title}. Pinpoint extracted from curated EUR-Lex HTML structure; full annex-level extraction remains in progress.`,
  });
}

const aiActKeyReferences = [
  aiActArticleReference("Article 1"),
  aiActArticleReference("Article 4"),
  aiActArticleReference("Article 5"),
  aiActArticleReference("Article 6"),
  aiActArticleReference("Article 50"),
  aiActArticleReference("Article 64"),
  aiActArticleReference("Article 113"),
  aiActAnnexReference("ANNEX III"),
  aiActAnnexReference("ANNEX XI"),
  aiActAnnexReference("ANNEX XIII"),
];

export const europeAiActBaseline: EuropeAiActBaseline = {
  id: "eu-ai-act-regulation-2024-1689",
  authorityLayer: "binding_law",
  bindingStatusLabel: "binding_eu_law",
  officialTitle:
    "Regulation (EU) 2024/1689 of the European Parliament and of the Council laying down harmonised rules on artificial intelligence",
  shortTitle: "EU AI Act",
  celexNumber: "32024R1689",
  ojPublicationInfo:
    "Published in the Official Journal of the European Union on 12 July 2024.",
  eurLexUrl: eurLexAiActReference.url,
  dateAdopted: "2024-06-13",
  datePublished: "2024-07-12",
  dateEnteredIntoForce: "2024-08-01",
  scope:
    "Baseline entry for the EU-level AI Act legal framework. Detailed article-level extraction is intentionally marked for further review rather than inferred.",
  riskBasedStructure:
    "The Act is treated in this baseline as the EU risk-based AI governance framework. Detailed category pinpoints require article-level parser review.",
  prohibitedPractices:
    "Prohibited-practices coverage is tracked as a baseline topic; article-level obligation extraction remains under review and should be tied to exact AI Act text before publication.",
  highRiskSystems:
    "High-risk system coverage is tracked as a baseline topic; Annex and article pinpoints remain parser/manual-review tasks.",
  transparencyObligations:
    "Transparency obligations are tracked as a baseline topic; precise article-level summaries are not generated in this phase.",
  gpaiModelObligations:
    "General-purpose AI model obligations are tracked through the AI Act and official Commission / AI Office implementation materials.",
  governanceAndEnforcement:
    "Governance and enforcement are tracked through EU-level governance actors and Member State implementation responsibilities, with exact role pinpoints requiring legal-text review.",
  memberStateResponsibilities:
    "Member State implementation and authority designation are tracked country by country and remain conservative unless supported by an official national source.",
  penaltiesAndEnforcementFramework:
    "Penalties and enforcement are part of the AI Act baseline; no article-level penalty summary is published from this layer without exact source pinpoints.",
  keyArticlesChaptersAnnexes: aiActKeyReferences.map((reference) => {
    const article = reference.pinpoint?.article;
    const annex = reference.pinpoint?.annex;
    const title = reference.notes?.split(".")[0] ?? reference.title;

    return article ?? annex ? title : reference.title;
  }),
  phasedApplicationDates: [
    {
      date: "2024-08-01",
      label: "Entry into force",
      legalEffect:
        "Official Commission materials state that the AI Act entered into force on 1 August 2024.",
      sourceReferences: [aiActArticleReference("Article 113"), commissionAiActPolicyReference],
      confidence: "high",
    },
    {
      date: "2025-02-02",
      label: "Prohibited practices and AI literacy obligations",
      legalEffect:
        "Official Commission materials identify 2 February 2025 as an application milestone for prohibited AI practices and AI literacy obligations.",
      sourceReferences: [
        aiActArticleReference("Article 113"),
        aiActArticleReference("Article 4"),
        aiActArticleReference("Article 5"),
        commissionAiActPolicyReference,
      ],
      confidence: "high",
    },
    {
      date: "2025-08-02",
      label: "GPAI obligations and governance rules",
      legalEffect:
        "Official Commission materials identify 2 August 2025 as an application milestone for governance rules and GPAI model obligations.",
      sourceReferences: [
        aiActArticleReference("Article 113"),
        aiActArticleReference("Article 64"),
        aiActAnnexReference("ANNEX XI"),
        aiActAnnexReference("ANNEX XIII"),
        commissionAiActPolicyReference,
      ],
      confidence: "high",
    },
    {
      date: "2026-08-02",
      label: "General application date",
      legalEffect:
        "Official Commission materials identify 2 August 2026 as the general AI Act application date, subject to exceptions.",
      sourceReferences: [
        aiActArticleReference("Article 113"),
        commissionAiActPolicyReference,
        navigatingAiActReference,
      ],
      confidence: "high",
    },
    {
      date: "2027-08-02",
      label: "Certain high-risk system obligations",
      legalEffect:
        "Official Commission FAQ materials identify a later application window for certain high-risk systems. The exact category and article pinpoints need manual legal-text review.",
      sourceReferences: [
        aiActArticleReference("Article 113"),
        aiActArticleReference("Article 6"),
        aiActAnnexReference("ANNEX III"),
        navigatingAiActReference,
      ],
      confidence: "medium",
    },
  ],
  sourceReferences: [
    eurLexAiActReference,
    ...aiActKeyReferences,
    commissionAiActPolicyReference,
    navigatingAiActReference,
  ],
  citationQualityStatus: "partial",
  confidenceLevel: "high",
  lastVerifiedAt: verifiedAt,
};

export const europeGovernanceActors: EuropeGovernanceActor[] = [
  {
    id: "european-ai-office",
    name: "European AI Office",
    authorityLayer: "governance_body",
    bindingStatusLabel: "institutional_role_under_binding_law",
    role:
      "EU-level office supporting AI Act implementation and supervision of general-purpose AI model rules.",
    legalBasis:
      "Official Commission AI Office materials and AI Act governance context; exact article pinpoints require legal-text review.",
    responsibilities: [
      "Support implementation of the AI Act.",
      "Provide EU-level coordination and expertise for AI governance.",
      "Support the Commission's work on general-purpose AI model rules.",
    ],
    sourceReferences: [
      officialReference({
        title: "AI Office",
        institution: "European Commission, Digital Strategy",
        url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
        authorityType: "European Commission governance page",
        documentType: "Policy page",
      }),
      officialReference({
        role: "supporting",
        title:
          "Commission establishes AI Office to strengthen EU leadership in safe and trustworthy artificial intelligence",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/commission-establishes-ai-office-strengthen-eu-leadership-safe-and-trustworthy-artificial",
        authorityType: "European Commission news release",
        publicationDate: "2024-05-29",
        documentType: "News release",
      }),
    ],
    citationQualityStatus: "complete",
    confidenceLevel: "high",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "european-artificial-intelligence-board",
    name: "European Artificial Intelligence Board",
    authorityLayer: "governance_body",
    bindingStatusLabel: "needs_article_level_review",
    role:
      "AI Act governance actor tracked in the baseline pending more precise article-level extraction.",
    legalBasis:
      "Regulation (EU) 2024/1689; exact article-level pinpoints require manual review.",
    responsibilities: [
      "Governance role under the AI Act.",
      "Detailed responsibilities require direct legal-text extraction before publication.",
    ],
    sourceReferences: [eurLexAiActReference],
    citationQualityStatus: "partial",
    confidenceLevel: "medium",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "edpb",
    name: "European Data Protection Board",
    authorityLayer: "eu_guidance",
    bindingStatusLabel: "not_binding_by_itself",
    role:
      "EU data-protection body whose AI-related guidance and documents are monitored separately from binding AI Act law.",
    legalBasis:
      "Official EDPB AI topic page; AI-specific documents require item-level citation.",
    responsibilities: [
      "Publish AI-related data-protection guidance, opinions, statements, and related materials.",
    ],
    sourceReferences: [
      officialReference({
        title: "Artificial Intelligence topic page",
        institution: "European Data Protection Board",
        url: "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
        sourceType: "regulator",
        authorityType: "Regulator guidance source",
        documentType: "Topic page",
      }),
    ],
    citationQualityStatus: "complete",
    confidenceLevel: "high",
    lastVerifiedAt: verifiedAt,
  },
  {
    id: "edps",
    name: "European Data Protection Supervisor",
    authorityLayer: "eu_guidance",
    bindingStatusLabel: "not_binding_by_itself",
    role:
      "EU data-protection supervisory authority whose AI materials are monitored as guidance and institutional source material.",
    legalBasis:
      "Official EDPS AI subject page; document-specific legal effect requires item-level review.",
    responsibilities: [
      "Publish AI-related opinions, guidance, and institutional materials relevant to EU AI governance and data protection.",
    ],
    sourceReferences: [
      officialReference({
        title: "Artificial Intelligence subject page",
        institution: "European Data Protection Supervisor",
        url: "https://www.edps.europa.eu/data-protection/our-work/subjects/artificial-intelligence_en?page=1",
        sourceType: "regulator",
        authorityType: "Regulator guidance source",
        documentType: "Topic page",
      }),
    ],
    citationQualityStatus: "complete",
    confidenceLevel: "high",
    lastVerifiedAt: verifiedAt,
  },
];

export function getEuropeBaselineSourceReferences() {
  return [
    ...europeAiActBaseline.sourceReferences,
    ...europeGovernanceActors.flatMap((actor) => actor.sourceReferences),
  ];
}
