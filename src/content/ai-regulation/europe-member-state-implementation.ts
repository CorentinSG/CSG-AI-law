import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";

export type EuropeImplementationStatus =
  | "eu_framework_applies"
  | "national_implementation_identified"
  | "implementation_in_progress"
  | "competent_authority_designated"
  | "consultation_or_draft_identified"
  | "no_specific_national_implementation_verified"
  | "needs_review"
  | "not_applicable";

export type EuropeImplementationConfidence =
  | "high"
  | "medium"
  | "low"
  | "needs_review";

export type CountrySourceParserStatus =
  | "manual_reference"
  | "candidate_for_monitoring"
  | "needs_parser"
  | "not_planned";

export type CountrySourceRecommendation = "active" | "inactive" | "manual_review";

export interface CountrySourceRecord {
  label: string;
  url: string;
  institution: string;
  sourceType:
    | "regulator"
    | "government"
    | "parliament"
    | "legislation"
    | "court"
    | "soft_law"
    | "policy";
  official: boolean;
  public: boolean;
  runtimeAccessible: boolean | null;
  responseStatus: number | null;
  publicationDate?: string | null;
  lastCheckedDate: string;
  pinpoint?: SourceReference["pinpoint"] | null;
  parserStatus: CountrySourceParserStatus;
  recommendation: CountrySourceRecommendation;
  note: string;
}

export interface CountryLatestUpdate {
  title: string;
  date: string | null;
  note: string;
  sourceUrl: string;
}

export interface EuropeCountryProfile {
  countryCode: string;
  countryName: string;
  slug: string;
  region: "Europe";
  euMemberState: boolean;
  implementationStatus: EuropeImplementationStatus;
  implementationStatusLabel: string;
  implementationStatusDescription: string;
  implementationConfidence: EuropeImplementationConfidence;
  aiActImplementationNotes: string;
  nationalImplementationMeasures: string[];
  nationalCompetentAuthorities: string[];
  marketSurveillanceAuthorities: string[];
  notifyingAuthorities: string[];
  dataProtectionAuthority: string | null;
  relevantMinistriesOrAgencies: string[];
  nationalAIRegulationSources: CountrySourceRecord[];
  nationalAIRegulationNotes: string;
  nationalCaseLawSources: CountrySourceRecord[];
  nationalCaseLawNotes: string;
  nationalSoftLawSources: CountrySourceRecord[];
  nationalSoftLawNotes: string;
  latestRelevantUpdates: CountryLatestUpdate[];
  officialSourceUrls: string[];
  sourceReferences: SourceReference[];
  citationQualityStatus: CitationQualityStatus;
  sourceVerificationStatus:
    | "verified_official_sources_present"
    | "partially_verified"
    | "needs_review";
  lastReviewedDate: string;
  missingSourceWarnings: string[];
  editorialNotes: string[];
  publicSummary: string;
}

export interface EuropeImplementationTaxonomyEntry {
  label: string;
  shortExplanation: string;
  mapTone: "neutral" | "info" | "warning" | "success";
  sourceRequirements: string;
}

export const europeImplementationStatusTaxonomy: Record<
  EuropeImplementationStatus,
  EuropeImplementationTaxonomyEntry
> = {
  eu_framework_applies: {
    label: "EU framework applies",
    shortExplanation:
      "The EU AI Act applies directly, but this profile does not yet verify a specific national implementation measure or designation.",
    mapTone: "neutral",
    sourceRequirements:
      "EU-level source plus at least one verified official national source showing relevant AI-governance posture.",
  },
  national_implementation_identified: {
    label: "National implementation identified",
    shortExplanation:
      "A specific national implementation measure has been identified through an official source.",
    mapTone: "success",
    sourceRequirements:
      "Official national legal or government source identifying the measure.",
  },
  implementation_in_progress: {
    label: "Implementation in progress",
    shortExplanation:
      "Official sources show implementation work is underway, but the final structure is not yet fully verified.",
    mapTone: "info",
    sourceRequirements:
      "Official national government, ministry, or parliamentary source indicating implementation work.",
  },
  competent_authority_designated: {
    label: "Competent authority designated",
    shortExplanation:
      "An official source verifies that at least one national competent authority has been designated.",
    mapTone: "success",
    sourceRequirements:
      "Official designation source naming the authority or authorities.",
  },
  consultation_or_draft_identified: {
    label: "Consultation or draft identified",
    shortExplanation:
      "An official source confirms a draft law, consultation, or implementation proposal without final designation yet verified.",
    mapTone: "info",
    sourceRequirements:
      "Official draft, consultation, or government announcement source.",
  },
  no_specific_national_implementation_verified: {
    label: "No specific national implementation verified",
    shortExplanation:
      "Official national AI-relevant sources are known, but this phase did not verify a specific implementation act or designation.",
    mapTone: "warning",
    sourceRequirements:
      "At least one official national source verified, but no implementation act or designation confirmed.",
  },
  needs_review: {
    label: "Needs review",
    shortExplanation:
      "The country has not yet received enough official-source review for a stronger public implementation label.",
    mapTone: "warning",
    sourceRequirements:
      "Insufficient verified evidence for a stronger status label.",
  },
  not_applicable: {
    label: "Not applicable",
    shortExplanation:
      "This status is reserved for non-EU jurisdictions or edge cases where the Member State implementation taxonomy does not apply.",
    mapTone: "neutral",
    sourceRequirements: "Reserved for explicit non-applicability cases.",
  },
};

const reviewedAt = "2026-06-01T00:00:00.000Z";

function sourceReferenceFromCountrySource(
  source: CountrySourceRecord,
  sourceRole: SourceReference["sourceRole"] = "primary",
): SourceReference {
  const authorityType =
    source.sourceType === "court"
      ? "Case law source"
      : source.sourceType === "government"
        ? "Member State government source"
        : source.sourceType === "parliament"
          ? "Member State parliamentary source"
          : source.sourceType === "legislation"
            ? "Member State legislative source"
            : source.sourceType === "policy"
              ? "Member State policy source"
              : source.sourceType === "soft_law"
                ? "Agency guidance"
                : "Member State regulator source";

  const sourceType: SourceReference["sourceType"] =
    source.sourceType === "court"
      ? "court"
      : source.sourceType === "government"
        ? "government"
        : source.sourceType === "parliament"
          ? "parliament"
          : source.sourceType === "legislation"
            ? "legislation"
            : source.sourceType === "policy"
              ? "policy"
              : source.sourceType === "soft_law"
                ? "regulator"
                : "regulator";

  return {
    sourceRole,
    title: source.label,
    institution: source.institution,
    url: source.url,
    canonicalUrl: source.url,
    sourceType,
    authorityType,
    publicationDate: source.publicationDate ?? null,
    detectedAt: reviewedAt,
    retrievedAt: reviewedAt,
    lastVerifiedAt: source.runtimeAccessible ? source.lastCheckedDate : null,
    jurisdiction: "European Union / Member State",
    documentType: source.sourceType,
    excerpt: null,
    pinpoint: source.pinpoint ?? null,
    reliabilityLevel: source.official ? "high" : "low",
    verificationStatus: source.runtimeAccessible ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      source.runtimeAccessible === false
        ? "Source was not reachable during runtime verification."
        : null,
    notes: source.note,
  };
}

const cnilAiTopic: CountrySourceRecord = {
  label: "CNIL artificial intelligence topic page",
  url: "https://www.cnil.fr/fr/technologies/intelligence-artificielle-ia",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note: "Official French data-protection authority AI page; runtime verification returned 200.",
};

const cnilAiRecommendations: CountrySourceRecord = {
  label:
    "CNIL recommendations on the development of artificial intelligence systems",
  url: "https://cnil.fr/fr/ia-la-cnil-publie-ses-premieres-recommandations-sur-le-developpement-des-systemes-dintelligence",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2024-04-08",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL guidance publication dated 8 April 2024. Useful for French AI/data-protection soft-law baseline, but not a national AI Act implementation measure.",
};

const franceAiCouncilDecree: CountrySourceRecord = {
  label:
    "Decret no. 2025-902 of 4 September 2025 on the Council for Artificial Intelligence and Digital Affairs",
  url: "https://www.legifrance.gouv.fr/affichTexte.do?categorieLien=cid&cidTexte=JORFTEXT000052198538",
  institution: "Legifrance / Journal officiel de la Republique francaise",
  sourceType: "legislation",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-09-06",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    article: "Article 1",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Legifrance decree creating the Council for Artificial Intelligence and Digital Affairs. Relevant to national AI governance posture, but this baseline does not treat it as a verified AI Act implementation measure.",
};

const cnilAiActQa: CountrySourceRecord = {
  label:
    "CNIL questions and answers on entry into force of the EU AI Regulation",
  url: "https://www.cnil.fr/fr/node/165948",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2024-07-12",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL questions-and-answers page on the AI Act, published on 12 July 2024. Useful for the French AI Act baseline and CNIL's public explanation of the French and EU governance structure.",
};

const cnilStrategicPlan2025: CountrySourceRecord = {
  label: "CNIL strategic plan 2025-2028",
  url: "https://www.cnil.fr/fr/ia-mineurs-cybersecurite-quotidien-numerique-la-cnil-publie-son-plan-strategique-2025-2028",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-01-16",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL strategic plan publication dated 16 January 2025. It confirms that artificial intelligence is a principal CNIL strategic axis for 2025-2028.",
};

const cnilSecondRecommendation2025: CountrySourceRecord = {
  label:
    "CNIL Deliberation 2025-010 adopting a second recommendation on GDPR and AI-system development",
  url: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000051144655",
  institution: "Legifrance / CNIL",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-02-06",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Deliberation no. 2025-010",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official CNIL deliberation dated 6 February 2025 adopting a second recommendation on the application of the GDPR to development of AI systems.",
};

const cnilSandboxReport2025: CountrySourceRecord = {
  label:
    "CNIL report on its artificial intelligence and public services sandbox",
  url: "https://www.cnil.fr/fr/bilan-bac-a-sable-IA-services-publics",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-04-11",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL sandbox report published on 11 April 2025, summarising lessons from AI projects in public services. Relevant to French public-sector AI governance and regulatory guidance.",
};

const cnilFourthRecommendation2025: CountrySourceRecord = {
  label:
    "CNIL Deliberation 2025-047 adopting a fourth recommendation on GDPR and AI-system development",
  url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051986911",
  institution: "Legifrance / Journal officiel de la Republique francaise",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-07-26",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Deliberation no. 2025-047",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Journal publication of CNIL Deliberation no. 2025-047, adopted on 5 June 2025 and published in the JORF on 26 July 2025, concerning a fourth recommendation on AI-system development and the GDPR.",
};

const cnilFinalRecommendations2025: CountrySourceRecord = {
  label:
    "CNIL finalises its recommendations on the development of artificial intelligence systems",
  url: "https://www.cnil.fr/fr/ia-finalisation-recommandations-developpement-des-systemes-ia",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-07-22",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL publication dated 22 July 2025 announcing the finalisation of several AI-development recommendations and future workstreams.",
};

const cnilAnnualReport2025: CountrySourceRecord = {
  label: "CNIL annual report 2025",
  url: "https://www.cnil.fr/fr/rapport-annuel-2025",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-05-18",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL annual report published on 18 May 2026. The report states that, under the AI Act, CNIL was already designated in 2025 as an authority for the protection of fundamental rights and may receive additional market-surveillance responsibilities.",
};

const cnilWorkProgramme2026: CountrySourceRecord = {
  label: "CNIL programme de travail 2026",
  url: "https://www.cnil.fr/fr/accompagnement-des-professionnels-le-programme-de-travail-de-la-cnil-pour-2026",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-04-07",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Entree en application du reglement IA",
  },
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL 2026 work programme page stating that CNIL is preparing to be designated as a market-surveillance authority under the AI Act in addition to its fundamental-rights role.",
};

const cnilHasPartnership2026: CountrySourceRecord = {
  label: "CNIL and HAS partnership on AI and digital health good practices",
  url: "https://www.cnil.fr/fr/numerique-en-sante-la-cnil-et-la-has-sengagent",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-03-10",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Premiere etape",
  },
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL announcement that CNIL and HAS signed a partnership on 10 March 2026, with a common recommendation expected in Q2 2026 on use of AI in care settings.",
};

const cnilAiHealthGuidance2026: CountrySourceRecord = {
  label: "CNIL guidance on developing and evaluating AI systems in healthcare",
  url: "https://www.cnil.fr/fr/ia-et-sante-developper-et-evaluer-des-systemes-ia-conformes",
  institution: "Commission nationale de l'informatique et des libertes (CNIL)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-03-05",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official CNIL healthcare guidance published on 5 March 2026 concerning development and evaluation of AI systems in compliance with applicable regulation.",
};

const franceAiActAdaptationBill2025: CountrySourceRecord = {
  label:
    "Draft adaptation bill introducing a French AI Act title into the law on confidence in the digital economy",
  url: "https://www.legifrance.gouv.fr/contenu/Media/files/autour-de-la-loi/legislatif-et-reglementaire/actualite-legislative/2025/pjl_ecom2524721l_cm_10.11.2025.pdf",
  institution: "Legifrance / Government legislative bill dossier",
  sourceType: "legislation",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-11-10",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    article: "Article 24",
    page: "42",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official government adaptation-bill dossier adding a French AI Act title to the LCEN framework. This is a direct AI Act implementation instrument at draft stage, not a final promulgated designation text.",
};

const franceSenateAiActDesignationAmendment442: CountrySourceRecord = {
  label: "Senate adopted government amendment no. 442 on CNIL AI Act authority powers",
  url: "https://www.senat.fr/enseance/2025-2026/348/Amdt_442.html",
  institution: "Senat",
  sourceType: "parliament",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-02-12",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    article: "After Article 24",
    section: "Article 8 and Article 20 changes",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Senate amendment page covering CNIL authority powers and complaint-handling provisions linked to the AI Act. This is a direct parliamentary-stage designation source, not final promulgated law.",
};

const franceSenateAiActGovernanceAmendment444: CountrySourceRecord = {
  label:
    "Senate adopted government amendment no. 444 on French AI Act coordination and notifying-authority framework",
  url: "https://www.senat.fr/enseance/2025-2026/348/Amdt_444.html",
  institution: "Senat",
  sourceType: "parliament",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-02-12",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    article: "Article 24",
    section: "Articles 55-2 to 55-6",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Senate amendment page describing a decentralised French AI Act governance, coordination, PEReN, ANSSI, and notifying-authority framework. This is a direct parliamentary-stage source, but not yet a complete final authority map.",
};

const franceAssembleeAiReport2024: CountrySourceRecord = {
  label:
    "Assemblee nationale / OPECST report on new developments in artificial intelligence",
  url: "https://www.assemblee-nationale.fr/dyn/17/dossiers/dev_IA",
  institution: "Assemblee nationale / OPECST",
  sourceType: "parliament",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2024-11-29",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official parliamentary dossier page for the OPECST report on new developments in artificial intelligence, deposited on 29 November 2024.",
};

const franceSenateAiLawReport2024: CountrySourceRecord = {
  label: "Senate report on artificial intelligence and legal professions",
  url: "https://www.senat.fr/travaux-parlementaires/commissions/commission-des-lois/controle-en-clair/intelligence-artificielle-et-professions-du-droit.html",
  institution: "Senat",
  sourceType: "parliament",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2024-12-18",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Senate page for the information report deposited on 18 December 2024 on artificial intelligence and legal professions.",
};

const franceConseilEtatAiCharter: CountrySourceRecord = {
  label:
    "Conseil d'Etat charter on use of artificial intelligence within the administrative courts",
  url: "https://www.conseil-etat.fr/site/qui-sommes-nous/deontologie/charte-d-utilisation-de-l-intelligence-artificielle-au-sein-de-la-juridiction-administrative",
  institution: "Conseil d'Etat",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-12-11",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Conseil d'Etat charter published on 11 December 2025 defining conditions for use of artificial intelligence within the administrative judiciary. This is a judicial governance source, not a judicial decision.",
};

const franceCourCassationAiReport: CountrySourceRecord = {
  label:
    "Cour de cassation page on recommendations concerning artificial intelligence",
  url: "https://www.courdecassation.fr/publications/lettre-de-la-cour/ndeg7-septembre-2025/la-modernisation-de-la-cour-se-poursuit-3-rapports-rendus-publics",
  institution: "Cour de cassation",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: null,
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Intelligence artificielle : les preconisations de la Cour",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Cour de cassation publication page stating that the working group on artificial intelligence submitted its report to the First President and Prosecutor General on 28 April 2025. This is an official judicial-institution source, not a court decision.",
};

const franceConseilEtatParcoursupDisclosureDecision: CountrySourceRecord = {
  label:
    "Conseil d'Etat decision no. 427916 on communication of Parcoursup algorithmic procedures",
  url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2019-06-12/427916",
  institution: "Conseil d'Etat / ArianeWeb",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2019-06-12",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    caseNumber: "427916",
    ECLI: "ECLI:FR:CECHR:2019:427916.20190612",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official ArianeWeb decision on access to algorithmic procedures used by a university in the Parcoursup admissions context.",
};

const franceConseilEtatParcoursupProcessingDecision: CountrySourceRecord = {
  label: "Conseil d'Etat decision no. 417906 on the Parcoursup automated-processing regime",
  url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2019-07-10/417906",
  institution: "Conseil d'Etat / ArianeWeb",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2019-07-10",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    caseNumber: "417906",
    ECLI: "ECLI:FR:CECHR:2019:417906.20190710",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official ArianeWeb decision concerning the automated personal-data processing known as Parcoursup and related public-facing platform content.",
};

const franceConseilEtatPlatformDataDecision: CountrySourceRecord = {
  label:
    "Conseil d'Etat decision no. 451653 on automated collection and exploitation of public platform data",
  url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2022-07-22/451653",
  institution: "Conseil d'Etat / ArianeWeb",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2022-07-22",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    caseNumber: "451653",
    ECLI: "ECLI:FR:CECHR:2022:451653.20220722",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official ArianeWeb decision on automated collection and exploitation of publicly accessible platform data by French authorities.",
};

const franceCourCassationWatsonDecision: CountrySourceRecord = {
  label:
    "Cour de cassation, chambre sociale, 12 avril 2018, no. 16-27.866 (application Watson)",
  url: "https://www.legifrance.gouv.fr/juri/id/JURITEXT000036829790/",
  institution: "Legifrance / Cour de cassation",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: false,
  responseStatus: 403,
  publicationDate: "2018-04-12",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    docket: "16-27.866",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Legifrance decision record involving introduction of an application using the Watson artificial-intelligence program. Runtime access may be blocked by a Cloudflare challenge.",
};

const franceConseilEtatNiceDecision: CountrySourceRecord = {
  label:
    "Conseil d'Etat decision no. 506370 on Nice school-entry algorithmic video analysis",
  url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2026-01-30/506370",
  institution: "Conseil d'Etat / ArianeWeb",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-01-30",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    caseNumber: "506370",
    ECLI: "ECLI:FR:CECHR:2026:506370.20260130",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official ArianeWeb decision page for a Nice challenge linked to algorithmic video analysis around school entries. Included conservatively as an official French administrative-law AI governance reference.",
};

const franceCnilViginumAiDecision: CountrySourceRecord = {
  label:
    "CNIL Deliberation 2025-108 on Viginum AI tools and automated online-data collection",
  url: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000053461680",
  institution: "Legifrance / CNIL",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-02-13",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Deliberation no. 2025-108",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official CNIL deliberation concerning Viginum, automated online-data collection, and AI tools, algorithms, and models.",
};

const franceCnilGeniallyDecision: CountrySourceRecord = {
  label:
    "CNIL Decision DR-2024-184 authorising an AI decision-support research project in healthcare",
  url: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000050216830",
  institution: "Legifrance / CNIL",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2024-09-21",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    section: "Decision DR-2024-184",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official CNIL authorisation decision for a research study involving an algorithmic decision-support tool for intensive-care admission.",
};

const franceDefenderRightsAiSummit: CountrySourceRecord = {
  label:
    "Defender of Rights statement for the AI Action Summit",
  url: "https://www.defenseurdesdroits.fr/sommet-pour-laction-sur-lintelligence-artificielle-pour-une-prise-en-compte-des-droits-fondamentaux",
  institution: "Defenseur des droits",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-02-10",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Defender of Rights statement published on 10 February 2025 emphasising AI Act implementation, technical standards, remedies, and the role of fundamental-rights authorities.",
};

const bfdiHome: CountrySourceRecord = {
  label: "BfDI official homepage",
  url: "https://www.bfdi.bund.de/EN/Home/home_node.html",
  institution: "The Federal Commissioner for Data Protection and Freedom of Information (BfDI)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note: "Official German federal data-protection authority source; runtime verification returned 200.",
};

const bfdiAiUnit: CountrySourceRecord = {
  label: "BfDI Unit 28 artificial intelligence page",
  url: "https://www.bfdi.bund.de/DE/BfDI/Aufgaben/Abteilungen/Abteilung-2/Referat-28-KI/Referat-28-KI_node.html",
  institution: "The Federal Commissioner for Data Protection and Freedom of Information (BfDI)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official BfDI AI unit page. Relevant to German AI oversight posture and public regulator capability, but not itself a final AI Act designation source.",
};

const germanyAiActImplementationPage: CountrySourceRecord = {
  label: "Federal Government page on implementation of the EU AI Regulation",
  url: "https://www.bundesregierung.de/breg-de/bundesregierung/bundeskanzleramt/umsetzung-ki-verordnung-2406638",
  institution: "Die Bundesregierung",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-02-11",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Federal Government page stating on 11 February 2026 that the cabinet decided how the EU AI Regulation should be implemented in Germany. This supports an implementation-in-progress label, not a final authority-designation claim.",
};

const germanyBfdiAiConsultationPage: CountrySourceRecord = {
  label: "BfDI consultation on personal data in AI models",
  url: "https://www.bfdi.bund.de/DE/BfDI/Inhalte/Konsultationsverfahren/KI-pbD/KI-pbD-Einleitung.html",
  institution: "The Federal Commissioner for Data Protection and Freedom of Information (BfDI)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official BfDI consultation page on the data-protection-compliant handling of personal data in AI models. This supports an official German guidance and consultation layer, not a final AI Act designation claim.",
};

const germanyBundestagAiImplementationPage: CountrySourceRecord = {
  label: "Bundestag notice on the AI Act implementation bill",
  url: "https://www.bundestag.de/presse/hib/kurzmeldungen-1155112",
  institution: "Deutscher Bundestag",
  sourceType: "parliament",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-03-11",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Bundestag parliamentary notice on the government AI Act implementation bill, including the proposed authority and enforcement structure. This supports implementation-in-progress, not a final authority-designation claim.",
};

const germanyBundestagBundesratAiPage: CountrySourceRecord = {
  label: "Bundestag notice on the Bundesrat statement concerning the AI Act implementation bill",
  url: "https://www.bundestag.de/presse/hib/kurzmeldungen-1161640",
  institution: "Deutscher Bundestag",
  sourceType: "parliament",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-04-02",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Bundestag notice on the Bundesrat statement regarding Germany's AI Act implementation bill. This is a parliamentary processing milestone, not a final enacted designation instrument.",
};

const germanyBghSchufaPositiveData: CountrySourceRecord = {
  label: "BGH press release on positive-data transfers to SCHUFA",
  url: "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2025&Gericht=bgh&anz=210&nr=143457&pos=1",
  institution: "Bundesgerichtshof (BGH)",
  sourceType: "court",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-10-14",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official BGH press release on the permissibility of certain positive-data transfers to SCHUFA. Used here as a cautious German scoring and automated-decision-making case-law anchor rather than as broad AI case-law coverage.",
};

const aepdHome: CountrySourceRecord = {
  label: "AEPD official homepage",
  url: "https://www.aepd.es/",
  institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note: "Official Spanish data-protection authority source; runtime verification returned 200.",
};

const aepdAgenticAiGuidance: CountrySourceRecord = {
  label:
    "AEPD guidance on agentic artificial intelligence from a data-protection perspective",
  url: "https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-agencia-publica-unas-orientaciones-sobre-inteligencia",
  institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-02-18",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official AEPD publication dated 18 February 2026 on agentic AI guidance. This supports national guidance coverage, not by itself final AI Act implementation designation.",
};

const aesiaHome: CountrySourceRecord = {
  label: "AESIA official site",
  url: "https://www.aesia.gob.es/en",
  institution: "Spanish Agency for the Supervision of Artificial Intelligence (AESIA)",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note: "Official Spanish AI agency site; runtime verification returned 200. This verifies source presence, not a complete AI Act designation analysis.",
};

const spainAesiaStatute: CountrySourceRecord = {
  label:
    "Royal Decree 729/2023 approving the Statute of the Spanish Agency for the Supervision of Artificial Intelligence",
  url: "https://www.boe.es/eli/es/rd/2023/08/22/729",
  institution: "Boletin Oficial del Estado (BOE)",
  sourceType: "legislation",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2023-09-02",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    article: "Articulo unico",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official BOE publication of the AESIA statute. This confirms the official legal basis of AESIA, but does not by itself complete Spain's full AI Act implementation verification.",
};

const spainAiGovernanceBill: CountrySourceRecord = {
  label:
    "Council of Ministers reference on the draft organic law for the proper use and governance of artificial intelligence",
  url: "https://www.lamoncloa.gob.es/consejodeministros/referencias/Paginas/2026/20260526-referencia-rueda-de-prensa-ministros.aspx",
  institution: "La Moncloa / Gobierno de Espana",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-05-26",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Council of Ministers reference stating on 26 May 2026 that the government approved a draft organic law on AI governance. This supports an implementation-in-progress label.",
};

const aepdProhibitedAiCompetenceNote: CountrySourceRecord = {
  label:
    "AEPD note on its ability to act against prohibited AI systems processing personal data",
  url: "https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-aepd-recuerda-que-ya-puede-actuar-ante-sistemas-de-ia",
  institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-07-15",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official AEPD note dated 15 July 2025 stating that Spain had not yet approved the national AI law, while clarifying that AEPD could already supervise prohibited-AI uses affecting personal-data protection.",
};

const aepdImageRiskNote2026: CountrySourceRecord = {
  label:
    "AEPD note on risks of using third-party images in artificial intelligence systems",
  url: "https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-aepd-alerta-sobre-los-riesgos-visibles-e-invisibles-del",
  institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
  sourceType: "soft_law",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-01-13",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official AEPD note dated 13 January 2026 on visible and less visible risks arising when third-party images are used in AI systems.",
};

const aepdActionPlan2026: CountrySourceRecord = {
  label: "AEPD 2026 action plan and 2025 initiative-compliance report",
  url: "https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/agencia-publica-su-plan-actuacion-2026-y-el-informe-cumplimiento-iniciaitivas-2025",
  institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-03-25",
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official AEPD publication dated 25 March 2026 describing the agency's 2026 action plan and 2025 execution report, including AI-related workstreams and governance activity.",
};

const aesiaDirectorAppointment: CountrySourceRecord = {
  label: "BOE publication of AESIA director appointment",
  url: "https://www.boe.es/boe/dias/2026/01/07/pdfs/BOE-A-2026-389.pdf",
  institution: "Boletin Oficial del Estado (BOE)",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-01-07",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official BOE publication recording the appointment of the AESIA director with effect from 7 January 2026. This strengthens the operational-governance baseline for Spain's AI supervision architecture.",
};

const garanteAi: CountrySourceRecord = {
  label: "Garante artificial intelligence topic page",
  url: "https://www.garanteprivacy.it/temi/intelligenza-artificiale",
  institution: "Garante per la protezione dei dati personali",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note: "Official Italian data-protection authority AI page; runtime verification returned 200.",
};

const italyAiLaw132: CountrySourceRecord = {
  label:
    "Law 23 September 2025, No. 132 on artificial intelligence",
  url: "https://www.normattiva.it/eli/id/2025/09/25/25G00143/CONSOLIDATED",
  institution: "Normattiva / Gazzetta Ufficiale della Repubblica Italiana",
  sourceType: "legislation",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-09-25",
  lastCheckedDate: reviewedAt,
  pinpoint: {
    article: "Art. 1",
  },
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Italian law published in the Gazzetta Ufficiale on 25 September 2025 and in force from 10 October 2025. This supports a national-implementation-identified label, but not a final mapping of all AI Act competent authorities.",
};

const italyAgidAiGuidelinesConsultation: CountrySourceRecord = {
  label:
    "AgID consultation on AI development and procurement guidelines for the public administration",
  url: "https://www.agid.gov.it/it/notizie/linee-guida-su-ia-nella-pa-al-la-consultazione-pubblica-su-sviluppo-e-procurement",
  institution: "Agenzia per l'Italia Digitale (AgID)",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-03-12",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official AgID publication opening consultation on AI development and procurement guidelines for the public administration. This is an implementation and guidance milestone, not binding legislation by itself.",
};

const italyDtdAiLawAnnouncement: CountrySourceRecord = {
  label: "Government announcement on final approval of the Italian AI law",
  url: "https://innovazione.gov.it/notizie/articoli/approvata-in-via-definitiva-la-legge-italiana-sull-intelligenza-artificiale",
  institution: "Dipartimento per la trasformazione digitale",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2025-09-25",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official government announcement on final approval of the Italian AI law. Useful as a supporting implementation source, while Normattiva remains the primary legal-text authority.",
};

const italyDtdAiStrategy: CountrySourceRecord = {
  label: "Italian AI Strategy 2024-2026 publication page",
  url: "https://innovazione.gov.it/notizie/articoli/strategia-italiana-per-l-intelligenza-artificiale-2024-2026/",
  institution: "Dipartimento per la trasformazione digitale",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2024-07-22",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official strategy publication page used as a supporting governance source for Italy's AI planning and coordination layer.",
};

// --- Poland sources ---

const polandUodo: CountrySourceRecord = {
  label: "UODO (Polish DPA) — official website",
  url: "https://uodo.gov.pl/",
  institution: "Urząd Ochrony Danych Osobowych (UODO)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Polish data-protection authority. UODO is expected to play a role in AI Act supervision as a market surveillance authority for AI systems involving personal data. Runtime accessibility has not yet been confirmed by this agent.",
};

const polandMinistryDigitalisation: CountrySourceRecord = {
  label: "Ministry of Digitalisation — government AI and digital portal",
  url: "https://www.gov.pl/web/cyfryzacja",
  institution: "Ministry of Digitalisation of Poland",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Polish government ministry portal relevant to national digital and AI governance strategy. Poland is implementing the EU AI Act as an EU member state; specific national implementation acts and authority-designation details remain under review.",
};

// --- Sweden sources ---

const swedenImy: CountrySourceRecord = {
  label: "IMY (Integritetsskyddsmyndigheten) — official website",
  url: "https://www.imy.se/",
  institution: "Integritetsskyddsmyndigheten (IMY)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  publicationDate: null,
  note:
    "Official Swedish data-protection authority and EDPB member. IMY participated in the EDPB coordinated ChatGPT investigation and is expected to have a role in AI Act supervision for AI systems involving personal data in Sweden. Runtime accessibility has not yet been confirmed by this agent.",
};

const swedenDigg: CountrySourceRecord = {
  label: "DIGG — Agency for Digital Government",
  url: "https://www.digg.se/",
  institution: "Myndigheten för digital förvaltning (DIGG)",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  publicationDate: null,
  note:
    "Official Swedish agency for digital government. DIGG manages Sweden's public-sector digital transformation and is relevant to national AI governance and policy implementation context. Runtime accessibility has not yet been confirmed by this agent.",
};

const swedenRegeringen: CountrySourceRecord = {
  label: "Regeringen — Swedish Government AI and digital policy",
  url: "https://www.regeringen.se/",
  institution: "Swedish Government (Regeringskansliet)",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  publicationDate: null,
  note:
    "Official portal of the Swedish Government. Relevant to national AI strategy, digital policy, and any national AI Act implementation instruments. Runtime accessibility has not yet been confirmed by this agent.",
};

// --- Ireland sources ---

const irelandDpc: CountrySourceRecord = {
  label: "DPC (Data Protection Commission) — official website",
  url: "https://www.dataprotection.ie/",
  institution: "Data Protection Commission (DPC)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  publicationDate: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official Irish data-protection authority and EDPB member. The DPC is expected to have a role in AI Act supervision for AI systems involving personal data. Ireland is the EU establishment of many large AI and technology companies including Meta, Google, Apple, LinkedIn, and Microsoft, making the DPC the lead supervisory authority for many cross-border GDPR cases involving AI systems. The DPC has active GDPR enforcement on AI-related data processing. Runtime accessibility has not yet been confirmed by this agent.",
};

const irelandEnterpriseDept: CountrySourceRecord = {
  label: "Department of Enterprise, Trade and Employment — enterprise and digital portal",
  url: "https://enterprise.gov.ie/",
  institution: "Department of Enterprise, Trade and Employment",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  publicationDate: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Irish government department with remit relevant to enterprise, technology, and digital regulation. DETE is expected to lead Ireland's national AI Act implementation. Specific national authority-designation and implementation details remain under review. Runtime accessibility has not yet been confirmed by this agent.",
};

const irelandGov: CountrySourceRecord = {
  label: "gov.ie — Irish Government official portal",
  url: "https://www.gov.ie/",
  institution: "Irish Government",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  publicationDate: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Irish Government portal. Relevant to national AI strategy, digital policy, and any national AI Act implementation instruments. Runtime accessibility has not yet been confirmed by this agent.",
};

// --- Austrian sources ---

const austriaDsb: CountrySourceRecord = {
  label: "Datenschutzbehörde — AI and data-protection oversight",
  url: "https://www.dsb.gv.at/",
  institution: "Datenschutzbehörde (DSB)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  publicationDate: null,
  note:
    "Official Austrian data-protection authority and EDPB member. The DSB is one of the most active DPAs in Europe on AI and GDPR enforcement, with a strong track record on automated decision-making, profiling, and facial recognition. NOYB (Max Schrems' NGO), based in Vienna, regularly files AI-related complaints with the DSB. Runtime accessibility has not yet been confirmed by this agent.",
};

const austriaDigitalAustria: CountrySourceRecord = {
  label: "Digital Austria — federal AI strategy and digital policy portal",
  url: "https://www.digital.gv.at/",
  institution: "Federal Chancellery / Digital Austria",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  publicationDate: null,
  note:
    "Official Austrian federal government portal for digital transformation and AI policy. Digital Austria coordinates Austria's national AI strategy and provides the policy framework relevant to Austria's approach to AI Act implementation. Specific authority-designation instruments under the AI Act remain under review. Runtime accessibility has not yet been confirmed by this agent.",
};

const austriaRtr: CountrySourceRecord = {
  label: "RTR — media and communications regulatory authority",
  url: "https://www.rtr.at/",
  institution: "Rundfunk und Telekom Regulierungs-GmbH (RTR)",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  publicationDate: null,
  note:
    "Official Austrian media and telecommunications regulatory authority. RTR's role in AI governance is growing, particularly for AI in broadcasting, algorithmic content curation, and digital communications. RTR's precise role under the EU AI Act has not been verified from a binding instrument. Runtime accessibility has not yet been confirmed by this agent.",
};

// --- Belgian sources ---

const belgiumApdAi: CountrySourceRecord = {
  label: "APD/GBA — AI and algorithmic oversight",
  url: "https://www.dataprotectionauthority.be/citizen/themes/artificial-intelligence",
  institution: "Autorité de protection des données / Gegevensbeschermingsautoriteit",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official Belgian data-protection authority page on artificial intelligence and algorithmic oversight. The APD/GBA is an EDPB member and the main Belgian authority competent for GDPR enforcement and AI Act supervision for AI systems involving personal data. Runtime accessibility has not yet been confirmed by this agent.",
};

const belgiumDigitalBelgium: CountrySourceRecord = {
  label: "Digital Belgium — AI and digital policy portal",
  url: "https://www.digitalbelgium.be/en/themes/artificial-intelligence",
  institution: "Federal Public Service Economy / Digital Belgium",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Belgian federal government portal for digital transformation and AI policy. Digital Belgium provides the policy framework relevant to Belgium's approach to AI Act implementation. Specific authority-designation instruments under the AI Act remain under review. Runtime accessibility has not yet been confirmed by this agent.",
};

const belgiumAi4Belgium: CountrySourceRecord = {
  label: "AI4Belgium — government AI strategy coordination",
  url: "https://ai4belgium.be/",
  institution: "AI4Belgium",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: null,
  responseStatus: null,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Belgian government AI coordination initiative that has produced strategic recommendations for public and private sector AI adoption. AI4Belgium is a policy-level body, not a supervisory authority under the EU AI Act, and its materials should be treated as policy guidance rather than binding law. Runtime accessibility has not yet been confirmed by this agent.",
};

// --- Dutch sources ---

const dutchApAlgorithms: CountrySourceRecord = {
  label: "AP algorithms and AI page",
  url: "https://autoriteitpersoonsgegevens.nl/en/themes/algorithms-ai",
  institution: "Autoriteit Persoonsgegevens",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note: "Official Dutch data-protection authority algorithms and AI page; runtime verification returned 200.",
};

const dutchRdiAi: CountrySourceRecord = {
  label: "RDI artificial intelligence page",
  url: "https://www.rdi.nl/onderwerpen/technologische-ontwikkelingen/kunstmatige-intelligentie",
  institution: "Rijksinspectie Digitale Infrastructuur",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note: "Official Dutch regulator page relevant to AI supervision context; runtime verification returned 200.",
};

const dutchAiConsultation: CountrySourceRecord = {
  label: "Government news on consultation of the AI Regulation implementing act",
  url: "https://www.rijksoverheid.nl/actueel/nieuws/2026/04/20/kabinet-zet-stap-met-toezicht-op-europese-ai-regels",
  institution: "Rijksoverheid",
  sourceType: "government",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2026-04-20",
  lastCheckedDate: reviewedAt,
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Dutch government announcement stating on 20 April 2026 that the proposal for the AI Regulation implementing act was opened for internet consultation. This supports a consultation-or-draft-identified label.",
};

// --- Bulgarian sources ---

const bulgariaCpdp: CountrySourceRecord = {
  label: "Bulgarian Commission for Personal Data Protection official site",
  url: "https://cpdp.bg/en/",
  institution: "Commission for Personal Data Protection",
  sourceType: "regulator",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: "2026-07-15T00:00:00.000Z",
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official Bulgarian data-protection authority site. CPDP is a verified national regulator for data protection and AI-related privacy issues, but this source does not by itself designate a Bulgarian AI Act competent authority.",
};

const bulgariaAiWatchStrategy: CountrySourceRecord = {
  label: "European Commission AI Watch Bulgaria strategy report",
  url: "https://ai-watch.ec.europa.eu/countries/bulgaria/bulgaria-ai-strategy-report_en",
  institution: "European Commission AI Watch",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  lastCheckedDate: "2026-07-15T00:00:00.000Z",
  parserStatus: "candidate_for_monitoring",
  recommendation: "manual_review",
  note:
    "Official European Commission AI Watch country report summarising Bulgaria's AI strategy and policy initiatives for the 2020-2030 period.",
};

const bulgariaAiConcept2030: CountrySourceRecord = {
  label: "Concept for the Development of Artificial Intelligence in Bulgaria until 2030",
  url: "https://www.mtc.government.bg/sites/default/files/conceptforthedevelopmentofaiinbulgariauntil2030.pdf",
  institution: "Ministry of Transport, Information Technology and Communications",
  sourceType: "policy",
  official: true,
  public: true,
  runtimeAccessible: true,
  responseStatus: 200,
  publicationDate: "2020-10-01",
  lastCheckedDate: "2026-07-15T00:00:00.000Z",
  parserStatus: "manual_reference",
  recommendation: "manual_review",
  note:
    "Official Bulgarian government AI policy concept through 2030. This is a strategy/soft-law source, not a binding AI Act implementation measure.",
};

const firstWaveProfiles: EuropeCountryProfile[] = [
  {
    countryCode: "BG",
    countryName: "Bulgaria",
    slug: "bulgaria",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel:
      europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "low",
    aiActImplementationNotes:
      "Bulgaria is an EU member state to which the EU AI Act applies directly. Official sources verify a national AI strategy/policy baseline through the Concept for the Development of Artificial Intelligence in Bulgaria until 2030 and the European Commission AI Watch country report. The Bulgarian Commission for Personal Data Protection is a verified national data-protection authority relevant to AI/privacy oversight. This baseline does not yet verify a final Bulgarian AI Act implementation act, competent-authority designation, market-surveillance authority, or notifying authority.",
    nationalImplementationMeasures: [
      "Official AI policy baseline: Concept for the Development of Artificial Intelligence in Bulgaria until 2030.",
      "European Commission AI Watch country report summarises Bulgaria's AI strategy and policy initiatives for 2020-2030.",
    ],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Commission for Personal Data Protection",
    relevantMinistriesOrAgencies: [
      "Commission for Personal Data Protection",
      "Ministry of Transport, Information Technology and Communications",
    ],
    nationalAIRegulationSources: [
      bulgariaCpdp,
      bulgariaAiWatchStrategy,
      bulgariaAiConcept2030,
    ],
    nationalAIRegulationNotes:
      "Bulgaria now has verified official institutional and policy anchors for the baseline: CPDP for data-protection and AI/privacy oversight, the European Commission AI Watch country report, and the official Bulgarian AI Concept until 2030. These sources support an implementation-in-progress label, but they do not verify final AI Act authority designations.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Bulgaria-specific AI case-law source has been verified into this baseline in this phase.",
    nationalSoftLawSources: [bulgariaAiWatchStrategy, bulgariaAiConcept2030],
    nationalSoftLawNotes:
      "The verified Bulgaria layer currently consists mainly of AI strategy and policy material. Binding national AI Act implementation instruments remain under review.",
    latestRelevantUpdates: [],
    officialSourceUrls: [
      bulgariaCpdp.url,
      bulgariaAiWatchStrategy.url,
      bulgariaAiConcept2030.url,
    ],
    sourceReferences: [
      sourceReferenceFromCountrySource(bulgariaCpdp),
      sourceReferenceFromCountrySource(bulgariaAiWatchStrategy, "supporting"),
      sourceReferenceFromCountrySource(bulgariaAiConcept2030, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "partially_verified",
    lastReviewedDate: "2026-07-15T00:00:00.000Z",
    missingSourceWarnings: [
      "No specific Bulgarian AI Act implementation act verified.",
      "No competent-authority designation instrument verified.",
      "No market-surveillance or notifying authority verified.",
      "No country-specific AI case-law source verified.",
    ],
    editorialNotes: [
      "Do not describe CPDP as a Bulgarian AI Act competent authority unless a final official designation instrument is verified.",
      "The AI Concept and AI Watch report are policy/strategy sources and should not be treated as binding AI Act implementation law.",
      "Absence of a verified designation here does not mean absence of Bulgarian regulatory work.",
    ],
    publicSummary:
      "Bulgaria is included in the EU AI baseline with verified official policy and institutional anchors. The EU AI Act applies directly, CPDP is the national data-protection authority relevant to AI/privacy oversight, and Bulgaria has an official AI strategy/policy baseline through 2030. Final national AI Act authority designations remain under review.",
  },
  {
    countryCode: "FR",
    countryName: "France",
    slug: "france",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "competent_authority_designated",
    implementationStatusLabel:
      europeImplementationStatusTaxonomy.competent_authority_designated.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.competent_authority_designated.shortExplanation,
    implementationConfidence: "medium",
    aiActImplementationNotes:
      "France now has a denser verified-source baseline including CNIL AI Act materials, direct legislative and parliamentary AI Act adaptation instruments, multiple CNIL recommendation publications, parliamentary AI reports, and official judicial-institution AI governance sources. The CNIL annual report for 2025 states that CNIL was already designated in 2025 as an authority for protection of fundamental rights under the AI Act. The adaptation bill and Senate amendments now provide a stronger direct-instrument baseline for French implementation, while the final complete national authority map still requires deeper final-text verification.",
    nationalImplementationMeasures: [
      "Decret no. 2025-902 of 4 September 2025 on the Council for Artificial Intelligence and Digital Affairs was verified on Legifrance as a national AI-governance measure.",
      "The CNIL annual report for 2025 states that CNIL was already designated in 2025 as an authority for protection of fundamental rights under the AI Act.",
      "Article 24 of the official government adaptation bill adds a French AI Act title to the law on confidence in the digital economy at draft stage.",
      "Senate amendments nos. 442 and 444 provide direct parliamentary-stage provisions on CNIL powers, coordination, PEReN, ANSSI, and the notifying-authority framework.",
    ],
    nationalCompetentAuthorities: [
      "Commission nationale de l'informatique et des libertes (CNIL) - the CNIL annual report for 2025 states that CNIL was designated in 2025 as an authority for protection of fundamental rights under the AI Act.",
    ],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "CNIL",
    relevantMinistriesOrAgencies: [
      "Direction generale des entreprises",
      "Conseil de l'intelligence artificielle et du numerique",
      "Defenseur des droits",
    ],
    nationalAIRegulationSources: [
      cnilAiActQa,
      cnilAnnualReport2025,
      cnilWorkProgramme2026,
      franceAiActAdaptationBill2025,
      franceSenateAiActDesignationAmendment442,
      franceSenateAiActGovernanceAmendment444,
      franceAiCouncilDecree,
      franceAssembleeAiReport2024,
      franceSenateAiLawReport2024,
      franceDefenderRightsAiSummit,
    ],
    nationalAIRegulationNotes:
      "France now has a broader official-source baseline including CNIL AI Act explanations, the CNIL annual report, direct legislative and parliamentary adaptation instruments, Legifrance governance material, parliamentary AI reports, and official rights-protection materials. The baseline still does not claim that France's full AI Act authority architecture has been conclusively mapped.",
    nationalCaseLawSources: [
      franceConseilEtatParcoursupDisclosureDecision,
      franceConseilEtatParcoursupProcessingDecision,
      franceConseilEtatPlatformDataDecision,
      franceCourCassationWatsonDecision,
      franceConseilEtatNiceDecision,
      franceCnilViginumAiDecision,
      franceCnilGeniallyDecision,
      franceConseilEtatAiCharter,
      franceCourCassationAiReport,
    ],
    nationalCaseLawNotes:
      "France now has a first broader verified French case-law and administrative-decision layer covering Parcoursup algorithmic transparency, the automated-processing framework of Parcoursup, automated public-platform data collection by French authorities, a Nice administrative-law challenge linked to algorithmic video analysis, a Cour de cassation decision record involving the workplace introduction of an AI-labelled application, and official CNIL decisions linked to AI or algorithmic tools. Institutional judicial AI-governance materials remain tracked separately from these decisions.",
    nationalSoftLawSources: [
      cnilAiTopic,
      cnilAiRecommendations,
      cnilSecondRecommendation2025,
      cnilSandboxReport2025,
      cnilFinalRecommendations2025,
      cnilFourthRecommendation2025,
      cnilStrategicPlan2025,
      cnilHasPartnership2026,
      cnilAiHealthGuidance2026,
    ],
    nationalSoftLawNotes:
      "French soft-law and governance coverage now includes multiple CNIL recommendation and sandbox publications, the CNIL strategic plan, AI Act explanatory materials, and 2026 CNIL healthcare and partnership initiatives. These sources remain distinct from binding national legislation.",
    latestRelevantUpdates: [
      {
        title:
          "CNIL published its 2026 work programme and stated it is preparing for a market-surveillance role under the AI Act",
        date: "2026-04-07",
        note:
          "Official CNIL work-programme milestone relevant to the French authority map and near-term implementation posture.",
        sourceUrl: cnilWorkProgramme2026.url,
      },
      {
        title:
          "CNIL published healthcare guidance on developing and evaluating AI systems in compliance with regulation",
        date: "2026-03-05",
        note:
          "Official sector-specific guidance showing live French AI governance activity in healthcare.",
        sourceUrl: cnilAiHealthGuidance2026.url,
      },
      {
        title: "CNIL annual report for 2025 states that CNIL was designated in 2025 as an AI Act fundamental-rights authority",
        date: "2026-05-18",
        note:
          "Official institutional statement supporting a stronger French implementation posture, alongside a denser direct-instrument baseline that still falls short of a complete final authority map.",
        sourceUrl: cnilAnnualReport2025.url,
      },
      {
        title:
          "Senate adopted amendments on French AI Act powers, coordination, and notifying-authority arrangements",
        date: "2026-02-12",
        note:
          "Official parliamentary-stage AI Act implementation milestone covering CNIL powers and governance architecture, but not yet the final promulgated authority map.",
        sourceUrl: franceSenateAiActDesignationAmendment442.url,
      },
      {
        title:
          "Conseil d'Etat decision no. 506370 addressed a Nice challenge linked to algorithmic video analysis around schools",
        date: "2026-01-30",
        note:
          "Official French administrative-law AI governance reference added to the verified France case-law layer.",
        sourceUrl: franceConseilEtatNiceDecision.url,
      },
      {
        title:
          "CNIL published the sandbox report on artificial intelligence and public services",
        date: "2025-04-11",
        note:
          "Official CNIL public-sector AI governance and compliance signal.",
        sourceUrl: cnilSandboxReport2025.url,
      },
      {
        title:
          "CNIL finalised a new package of recommendations on development of artificial intelligence systems",
        date: "2025-07-22",
        note:
          "Official CNIL guidance milestone relevant to French AI/data-protection practice.",
        sourceUrl: cnilFinalRecommendations2025.url,
      },
      {
        title:
          "Legifrance published Decret no. 2025-902 on the Council for Artificial Intelligence and Digital Affairs",
        date: "2025-09-06",
        note:
          "Official governance measure relevant to French AI institutional posture, but not treated here as a verified AI Act implementation act.",
        sourceUrl: franceAiCouncilDecree.url,
      },
      {
        title:
          "Conseil d'Etat published its charter on use of artificial intelligence within the administrative courts",
        date: "2025-12-11",
        note:
          "Official judicial-governance development relevant to French AI use in the justice system.",
        sourceUrl: franceConseilEtatAiCharter.url,
      },
      {
        title:
          "Conseil d'Etat decision no. 451653 rejected the challenge to the decree on automated collection and exploitation of public platform data",
        date: "2022-07-22",
        note:
          "Official French administrative-law reference on automated public-data collection and safeguards.",
        sourceUrl: franceConseilEtatPlatformDataDecision.url,
      },
    ],
    officialSourceUrls: [
      cnilAiTopic.url,
      cnilAiActQa.url,
      cnilAiRecommendations.url,
      cnilSecondRecommendation2025.url,
      cnilSandboxReport2025.url,
      cnilFinalRecommendations2025.url,
      cnilFourthRecommendation2025.url,
      cnilStrategicPlan2025.url,
      cnilAnnualReport2025.url,
      cnilWorkProgramme2026.url,
      cnilHasPartnership2026.url,
      cnilAiHealthGuidance2026.url,
      franceAiActAdaptationBill2025.url,
      franceSenateAiActDesignationAmendment442.url,
      franceSenateAiActGovernanceAmendment444.url,
      franceAiCouncilDecree.url,
      franceAssembleeAiReport2024.url,
      franceSenateAiLawReport2024.url,
      franceConseilEtatParcoursupDisclosureDecision.url,
      franceConseilEtatParcoursupProcessingDecision.url,
      franceConseilEtatPlatformDataDecision.url,
      franceCourCassationWatsonDecision.url,
      franceConseilEtatNiceDecision.url,
      franceCnilViginumAiDecision.url,
      franceCnilGeniallyDecision.url,
      franceConseilEtatAiCharter.url,
      franceCourCassationAiReport.url,
      franceDefenderRightsAiSummit.url,
    ],
    sourceReferences: [
      sourceReferenceFromCountrySource(cnilAnnualReport2025),
      sourceReferenceFromCountrySource(cnilWorkProgramme2026, "official_confirmation"),
      sourceReferenceFromCountrySource(franceAiActAdaptationBill2025, "official_confirmation"),
      sourceReferenceFromCountrySource(franceSenateAiActDesignationAmendment442, "official_confirmation"),
      sourceReferenceFromCountrySource(franceSenateAiActGovernanceAmendment444, "official_confirmation"),
      sourceReferenceFromCountrySource(franceAiCouncilDecree, "official_confirmation"),
      sourceReferenceFromCountrySource(cnilAiActQa, "supporting"),
      sourceReferenceFromCountrySource(cnilAiTopic, "supporting"),
      sourceReferenceFromCountrySource(cnilAiRecommendations, "supporting"),
      sourceReferenceFromCountrySource(cnilSecondRecommendation2025, "supporting"),
      sourceReferenceFromCountrySource(cnilSandboxReport2025, "supporting"),
      sourceReferenceFromCountrySource(cnilFinalRecommendations2025, "supporting"),
      sourceReferenceFromCountrySource(cnilFourthRecommendation2025, "supporting"),
      sourceReferenceFromCountrySource(cnilStrategicPlan2025, "supporting"),
      sourceReferenceFromCountrySource(cnilHasPartnership2026, "supporting"),
      sourceReferenceFromCountrySource(cnilAiHealthGuidance2026, "supporting"),
      sourceReferenceFromCountrySource(franceAssembleeAiReport2024, "supporting"),
      sourceReferenceFromCountrySource(franceSenateAiLawReport2024, "supporting"),
      sourceReferenceFromCountrySource(franceConseilEtatParcoursupDisclosureDecision, "supporting"),
      sourceReferenceFromCountrySource(franceConseilEtatParcoursupProcessingDecision, "supporting"),
      sourceReferenceFromCountrySource(franceConseilEtatPlatformDataDecision, "supporting"),
      sourceReferenceFromCountrySource(franceCourCassationWatsonDecision, "supporting"),
      sourceReferenceFromCountrySource(franceConseilEtatNiceDecision, "supporting"),
      sourceReferenceFromCountrySource(franceCnilViginumAiDecision, "supporting"),
      sourceReferenceFromCountrySource(franceCnilGeniallyDecision, "supporting"),
      sourceReferenceFromCountrySource(franceConseilEtatAiCharter, "supporting"),
      sourceReferenceFromCountrySource(franceCourCassationAiReport, "supporting"),
      sourceReferenceFromCountrySource(franceDefenderRightsAiSummit, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "verified_official_sources_present",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "Direct final promulgated designation instrument still needs full pinpointing; the current direct-source baseline includes the government adaptation bill and Senate amendments but not yet a complete final national authority map.",
      "No complete market-surveillance and notifying-authority map verified yet.",
      "French case-law and administrative-decision baseline remains non-exhaustive and should be expanded beyond the current verified layer.",
    ],
    editorialNotes: [
      "This France profile is substantially stronger, but it still should not be described as exhaustive.",
      "French judicial-institution AI materials are tracked separately from actual judicial holdings or decisions.",
      "Some official judicial citations currently rely on manual-reference mode because runtime crawling of certain official pages remains constrained.",
    ],
    publicSummary:
      "France now has a substantially stronger official-source AI baseline with CNIL AI Act materials, direct AI Act adaptation instruments, CNIL recommendation series, a Legifrance AI-governance decree, parliamentary reports, and a broader verified layer of French AI-related case law and administrative decisions. The profile supports verification of at least one French AI Act-related authority role, while the final authority map and broader French AI case-law coverage remain under review.",
  },
  {
    countryCode: "DE",
    countryName: "Germany",
    slug: "germany",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "medium",
    aiActImplementationNotes:
      "Germany now has a denser official-source baseline including the Federal Government implementation page, Bundestag processing materials, the BfDI AI unit page, and the BfDI consultation on personal data in AI models. This supports an implementation-in-progress label, but this baseline still does not verify the final national authority-designation outcome.",
    nationalImplementationMeasures: [
      "Federal cabinet decision of 11 February 2026 on implementation of the EU AI Regulation, as described on the official Federal Government page.",
      "Bundestag processing of the implementation bill on 11 March 2026.",
      "Bundesrat statement stage reflected in Bundestag materials on 2 April 2026.",
    ],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "BfDI",
    relevantMinistriesOrAgencies: [
      "BfDI Unit 28 (Artificial Intelligence)",
      "Federal Government",
      "Bundestag",
    ],
    nationalAIRegulationSources: [
      bfdiHome,
      bfdiAiUnit,
      germanyBfdiAiConsultationPage,
      germanyAiActImplementationPage,
      germanyBundestagAiImplementationPage,
      germanyBundestagBundesratAiPage,
    ],
    nationalAIRegulationNotes:
      "Germany now has a stronger official-source baseline including the Federal Government implementation source, official BfDI AI materials, and Bundestag processing materials. Final competent-authority designation still needs a deeper pass.",
    nationalCaseLawSources: [germanyBghSchufaPositiveData],
    nationalCaseLawNotes:
      "Germany now has a first cautious public case-law anchor on automated decision-making and scoring through official BGH materials, but the German AI decision layer remains narrow and should not be described as exhaustive.",
    nationalSoftLawSources: [bfdiAiUnit, germanyBfdiAiConsultationPage],
    nationalSoftLawNotes:
      "German soft-law and guidance coverage now includes official BfDI AI and consultation materials. These sources remain distinct from binding legislation and final designation instruments.",
    latestRelevantUpdates: [
      {
        title:
          "Federal Government announced cabinet decision on implementation of the EU AI Regulation",
        date: "2026-02-11",
        note:
          "Official source supports implementation-in-progress posture rather than final designation.",
        sourceUrl: germanyAiActImplementationPage.url,
      },
      {
        title:
          "Bundestag published the AI Act implementation bill notice and described the proposed authority structure",
        date: "2026-03-11",
        note:
          "Official parliamentary milestone relevant to Germany's implementation architecture, while the final enacted map remains under review.",
        sourceUrl: germanyBundestagAiImplementationPage.url,
      },
      {
        title:
          "Bundestag published the Bundesrat statement stage for the AI Act implementation bill",
        date: "2026-04-02",
        note:
          "Official parliamentary processing milestone relevant to Germany's implementation and authority-allocation debate.",
        sourceUrl: germanyBundestagBundesratAiPage.url,
      },
    ],
    officialSourceUrls: [
      bfdiHome.url,
      bfdiAiUnit.url,
      germanyBfdiAiConsultationPage.url,
      germanyAiActImplementationPage.url,
      germanyBundestagAiImplementationPage.url,
      germanyBundestagBundesratAiPage.url,
      germanyBghSchufaPositiveData.url,
    ],
    sourceReferences: [
      sourceReferenceFromCountrySource(germanyAiActImplementationPage),
      sourceReferenceFromCountrySource(germanyBundestagAiImplementationPage, "official_confirmation"),
      sourceReferenceFromCountrySource(germanyBundestagBundesratAiPage, "supporting"),
      sourceReferenceFromCountrySource(germanyBfdiAiConsultationPage, "supporting"),
      sourceReferenceFromCountrySource(bfdiHome, "supporting"),
      sourceReferenceFromCountrySource(bfdiAiUnit, "supporting"),
      sourceReferenceFromCountrySource(germanyBghSchufaPositiveData, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "verified_official_sources_present",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No final competent-authority designation verified.",
      "No final article-level authority map verified.",
      "German AI-specific case-law baseline remains narrow and should not be described as exhaustive.",
    ],
    editorialNotes: [
      "Germany should receive a dedicated competent-authority verification pass before stronger public implementation labeling.",
      "Germany now has official parliamentary and consultation materials, but they do not by themselves close the final authority-designation analysis.",
    ],
    publicSummary:
      "Germany now has a materially stronger official-source AI baseline with Federal Government implementation material, Bundestag processing milestones, BfDI AI oversight and consultation sources, and a first cautious German scoring-related decision anchor. The profile supports a stronger implementation-in-progress posture, while the final AI Act authority map and broader German AI decision layer remain under review.",
  },
  {
    countryCode: "ES",
    countryName: "Spain",
    slug: "spain",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "medium",
    aiActImplementationNotes:
      "Spain now has a denser official-source baseline including AEPD competence notes on prohibited AI systems, AEPD guidance and action-plan material, the AESIA statutory basis, BOE publication of AESIA leadership, and an official Council of Ministers reference to a draft AI governance law approved on 26 May 2026. This supports an implementation-in-progress label, not a final national authority-designation claim.",
    nationalImplementationMeasures: [
      "Royal Decree 729/2023 approving the AESIA statute.",
      "Council of Ministers reference of 26 May 2026 on the draft organic law for the proper use and governance of artificial intelligence.",
    ],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "AEPD",
    relevantMinistriesOrAgencies: [
      "AEPD",
      "AESIA",
      "Ministry for Digital Transformation and Public Function",
    ],
    nationalAIRegulationSources: [
      aepdHome,
      aesiaHome,
      spainAesiaStatute,
      aesiaDirectorAppointment,
      spainAiGovernanceBill,
      aepdProhibitedAiCompetenceNote,
      aepdActionPlan2026,
    ],
    nationalAIRegulationNotes:
      "Spain now has a stronger official-source baseline including AEPD institutional competence material, the AESIA statutory basis and leadership milestone, and the 26 May 2026 government draft-law reference. The profile remains conservative on final AI Act designation and implementation outcome.",
    nationalCaseLawSources: [
      {
        ...aepdHome,
        label: "AEPD legal criteria and resolutions portal",
        url: "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd",
        note:
          "Official AEPD legal-criteria portal used as a conservative public anchor for Spanish AI-related administrative-decision monitoring.",
      },
    ],
    nationalCaseLawNotes:
      "Spain now has an official AEPD legal-criteria source anchored in the public baseline, but the Spanish AI decision layer remains narrow and should not be described as exhaustive case law.",
    nationalSoftLawSources: [
      aepdHome,
      aepdAgenticAiGuidance,
      aepdImageRiskNote2026,
      aepdActionPlan2026,
      aepdProhibitedAiCompetenceNote,
    ],
    nationalSoftLawNotes:
      "Spanish soft-law and guidance coverage now includes official AEPD material on agentic AI, prohibited AI systems, image risks, and 2026 institutional planning. These sources remain distinct from binding law.",
    latestRelevantUpdates: [
      {
        title:
          "Council of Ministers approved draft organic law on AI governance",
        date: "2026-05-26",
        note:
          "Official government source supports implementation-in-progress status.",
        sourceUrl: spainAiGovernanceBill.url,
      },
      {
        title:
          "AEPD published guidance on agentic artificial intelligence",
        date: "2026-02-18",
        note:
          "Official data-protection guidance relevant to Spain's AI governance baseline.",
        sourceUrl: aepdAgenticAiGuidance.url,
      },
      {
        title:
          "AEPD published its 2026 action plan with AI-related workstreams",
        date: "2026-03-25",
        note:
          "Official AEPD institutional milestone supporting the live-governance and monitoring layer in Spain.",
        sourceUrl: aepdActionPlan2026.url,
      },
      {
        title:
          "AEPD warned about AI image risks involving third-party data",
        date: "2026-01-13",
        note:
          "Official AEPD note on AI-image and privacy risks relevant to Spanish soft-law monitoring.",
        sourceUrl: aepdImageRiskNote2026.url,
      },
      {
        title:
          "BOE recorded AESIA's director appointment",
        date: "2026-01-07",
        note:
          "Official BOE governance milestone strengthening the operational layer of AESIA.",
        sourceUrl: aesiaDirectorAppointment.url,
      },
      {
        title:
          "AEPD clarified its role regarding prohibited AI systems affecting personal data",
        date: "2025-07-15",
        note:
          "Official competence note relevant to Spain's AI Act readiness baseline while the full national law remained pending.",
        sourceUrl: aepdProhibitedAiCompetenceNote.url,
      },
    ],
    officialSourceUrls: [
      aepdHome.url,
      aesiaHome.url,
      spainAesiaStatute.url,
      aesiaDirectorAppointment.url,
      spainAiGovernanceBill.url,
      aepdAgenticAiGuidance.url,
      aepdActionPlan2026.url,
      aepdImageRiskNote2026.url,
      aepdProhibitedAiCompetenceNote.url,
    ],
    sourceReferences: [
      sourceReferenceFromCountrySource(spainAiGovernanceBill),
      sourceReferenceFromCountrySource(spainAesiaStatute, "supporting"),
      sourceReferenceFromCountrySource(aesiaDirectorAppointment, "supporting"),
      sourceReferenceFromCountrySource(aepdHome, "supporting"),
      sourceReferenceFromCountrySource(aesiaHome, "supporting"),
      sourceReferenceFromCountrySource(aepdAgenticAiGuidance, "supporting"),
      sourceReferenceFromCountrySource(aepdActionPlan2026, "supporting"),
      sourceReferenceFromCountrySource(aepdImageRiskNote2026, "supporting"),
      sourceReferenceFromCountrySource(aepdProhibitedAiCompetenceNote, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "verified_official_sources_present",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No complete competent-authority designation analysis verified article by article.",
      "No final promulgated Spanish AI governance law has yet been verified in force.",
      "Spain's AI decision layer remains narrow and should be expanded beyond the current official AEPD-oriented baseline.",
    ],
    editorialNotes: [
      "AESIA is a verified official institution in the profile, but this phase still does not claim that Spain's full AI Act authority designation has been conclusively verified.",
      "Official AEPD legal-criteria summaries are useful for the Spain decision layer, but they should remain clearly marked as summary pages rather than full resolution texts unless the full resolution is separately pinned.",
    ],
    publicSummary:
      "Spain now has a materially stronger official-source AI baseline with AEPD competence and guidance materials, an AESIA legal basis and leadership milestone, and an official 2026 draft-law governance milestone. The profile supports implementation in progress, while the final authority map, enacted text posture, and broader Spanish AI decision layer remain under review.",
  },
  {
    countryCode: "IT",
    countryName: "Italy",
    slug: "italy",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "national_implementation_identified",
    implementationStatusLabel:
      europeImplementationStatusTaxonomy.national_implementation_identified.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.national_implementation_identified.shortExplanation,
    implementationConfidence: "medium",
    aiActImplementationNotes:
      "Italy now has a stronger official-source baseline including Law No. 132 of 23 September 2025, official Garante AI materials, an official government announcement on final approval of the AI law, and official AgID consultation material on AI development and procurement guidelines for the public administration. This supports a national-implementation-identified label, but not a complete verification of all AI Act authority designations.",
    nationalImplementationMeasures: [
      "Law No. 132 of 23 September 2025 on artificial intelligence, published in the Gazzetta Ufficiale and accessible through Normattiva.",
      "AgID opened consultation on AI development and procurement guidelines for the public administration on 12 March 2026.",
    ],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Garante per la protezione dei dati personali",
    relevantMinistriesOrAgencies: [
      "Agenzia per l'Italia Digitale (AgID)",
      "Dipartimento per la trasformazione digitale",
      "Agenzia per la cybersicurezza nazionale (authority mapping still under review)",
    ],
    nationalAIRegulationSources: [
      italyAiLaw132,
      italyDtdAiLawAnnouncement,
      italyAgidAiGuidelinesConsultation,
      italyDtdAiStrategy,
      garanteAi,
    ],
    nationalAIRegulationNotes:
      "Italy now has a stronger official-source baseline combining a verified national AI law, government strategy and law-approval pages, AgID implementation-guidance consultation material, and official Garante AI materials. Competent-authority verification remains open.",
    nationalCaseLawSources: [
      {
        ...garanteAi,
        label: "Garante AI topic and official DocWeb actions",
        note:
          "Official Garante AI topic page used as a conservative public anchor for Italian AI-related administrative decisions, warnings, and information requests.",
      },
    ],
    nationalCaseLawNotes:
      "Italy now has a first official regulator-action layer anchored in Garante AI materials, but broader Italian AI court and decision coverage remains under review.",
    nationalSoftLawSources: [garanteAi, italyAgidAiGuidelinesConsultation, italyDtdAiStrategy],
    nationalSoftLawNotes:
      "Italian soft-law coverage is now anchored in official Garante materials, AgID public-administration AI guideline work, and government strategy materials, all of which remain distinct from binding law.",
    latestRelevantUpdates: [
      {
        title:
          "Italy's Law No. 132 on artificial intelligence entered the Italian legal baseline",
        date: "2025-09-25",
        note:
          "Official legislative source supports a national-implementation-identified label.",
        sourceUrl: italyAiLaw132.url,
      },
      {
        title:
          "AgID opened consultation on AI development and procurement guidelines for the public administration",
        date: "2026-03-12",
        note:
          "Official implementation and guidance milestone relevant to Italy's public-sector AI governance posture.",
        sourceUrl: italyAgidAiGuidelinesConsultation.url,
      },
      {
        title:
          "Government publication highlighted final approval of the Italian AI law",
        date: "2025-09-25",
        note:
          "Official government supporting source for Italy's national AI implementation baseline.",
        sourceUrl: italyDtdAiLawAnnouncement.url,
      },
    ],
    officialSourceUrls: [
      italyAiLaw132.url,
      italyDtdAiLawAnnouncement.url,
      italyAgidAiGuidelinesConsultation.url,
      italyDtdAiStrategy.url,
      garanteAi.url,
    ],
    sourceReferences: [
      sourceReferenceFromCountrySource(italyAiLaw132),
      sourceReferenceFromCountrySource(italyDtdAiLawAnnouncement, "supporting"),
      sourceReferenceFromCountrySource(italyAgidAiGuidelinesConsultation, "supporting"),
      sourceReferenceFromCountrySource(italyDtdAiStrategy, "supporting"),
      sourceReferenceFromCountrySource(garanteAi, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "verified_official_sources_present",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No final competent-authority designation verified.",
      "No complete article-by-article national authority map verified.",
      "Italian AI decision and court layer remains non-exhaustive.",
    ],
    editorialNotes: [
      "Italy has a stronger official-source base, but competent-authority and implementation verification remain open tasks.",
      "AgID and strategy/government pages strengthen governance and implementation monitoring, but they must remain clearly distinct from binding legal-text authority.",
    ],
    publicSummary:
      "Italy now has a stronger official-source AI baseline with a verified national AI law, government strategy and law-approval materials, AgID guideline consultation material, and official Garante AI content. The profile supports a national-implementation-identified label while authority-designation review and broader Italian AI decision coverage remain open.",
  },
  {
    countryCode: "NL",
    countryName: "Netherlands",
    slug: "netherlands",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "consultation_or_draft_identified",
    implementationStatusLabel: europeImplementationStatusTaxonomy.consultation_or_draft_identified.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.consultation_or_draft_identified.shortExplanation,
    implementationConfidence: "medium",
    aiActImplementationNotes:
      "The Netherlands has verified official regulator sources plus an official government announcement of a 20 April 2026 internet consultation on an AI Regulation implementing act. This supports a consultation-or-draft-identified label, not a final designation claim.",
    nationalImplementationMeasures: [
      "Internet consultation announced on 20 April 2026 for the proposal for an implementing act for the AI Regulation.",
    ],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Autoriteit Persoonsgegevens",
    relevantMinistriesOrAgencies: ["Rijksinspectie Digitale Infrastructuur"],
    nationalAIRegulationSources: [dutchAiConsultation, dutchApAlgorithms, dutchRdiAi],
    nationalAIRegulationNotes:
      "Dutch AP and RDI sources are verified and relevant to AI governance, and the official consultation source supports a draft-or-consultation label. Final AI Act designation remains under review.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Dutch AI-specific case-law source has been reviewed into the public baseline in this phase.",
    nationalSoftLawSources: [dutchApAlgorithms],
    nationalSoftLawNotes:
      "Dutch soft-law and oversight materials are relevant but require a deeper verification pass for implementation claims.",
    latestRelevantUpdates: [
      {
        title:
          "Dutch government opened consultation on AI Regulation implementing act",
        date: "2026-04-20",
        note:
          "Official source supports consultation-or-draft-identified status.",
        sourceUrl: dutchAiConsultation.url,
      },
    ],
    officialSourceUrls: [dutchAiConsultation.url, dutchApAlgorithms.url, dutchRdiAi.url],
    sourceReferences: [
      sourceReferenceFromCountrySource(dutchAiConsultation),
      sourceReferenceFromCountrySource(dutchApAlgorithms, "supporting"),
      sourceReferenceFromCountrySource(dutchRdiAi, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "verified_official_sources_present",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No final competent-authority designation verified.",
      "No country-specific AI case-law baseline entry verified.",
    ],
    editorialNotes: [
      "The Netherlands has useful verified official source coverage, but final designation and implementation details remain under review.",
    ],
    publicSummary:
      "The Netherlands has verified official regulator sources and an official 2026 consultation milestone, so the profile now supports a consultation-or-draft-identified label while final implementation and designation remain under review.",
  },
  {
    countryCode: "PL",
    countryName: "Poland",
    slug: "poland",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "low",
    aiActImplementationNotes:
      "Poland is an EU member state to which the EU AI Act applies directly. Official sources confirm the existence of the Polish DPA (UODO) and the Ministry of Digitalisation as key national institutions relevant to AI governance. Specific Polish implementation acts, competent-authority designation instruments, and detailed national measures have not been verified into this baseline layer. An implementation-in-progress label reflects EU-wide applicability and visible official institutions without claiming finalized national measures.",
    nationalImplementationMeasures: [],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Urząd Ochrony Danych Osobowych (UODO)",
    relevantMinistriesOrAgencies: ["Ministry of Digitalisation of Poland"],
    nationalAIRegulationSources: [polandUodo, polandMinistryDigitalisation],
    nationalAIRegulationNotes:
      "UODO and Ministry of Digitalisation are the principal verified official institutional anchors for Polish AI governance. Specific national AI law or implementation act has not yet been verified into this baseline.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Polish AI-specific case-law source has been reviewed into the public baseline in this phase.",
    nationalSoftLawSources: [],
    nationalSoftLawNotes:
      "No Polish AI soft-law or guidance source has been verified into this baseline in this phase.",
    latestRelevantUpdates: [],
    officialSourceUrls: [polandUodo.url, polandMinistryDigitalisation.url],
    sourceReferences: [
      sourceReferenceFromCountrySource(polandUodo),
      sourceReferenceFromCountrySource(polandMinistryDigitalisation, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "partially_verified",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No specific Polish AI Act implementation act verified.",
      "No competent-authority designation instrument verified.",
      "No market-surveillance or notifying authority verified.",
      "No country-specific AI case-law source verified.",
      "Runtime accessibility of Polish official sources has not been confirmed by this agent.",
    ],
    editorialNotes: [
      "Poland has identifiable official institutions but requires a deeper official-source verification pass before stronger implementation claims can be made.",
      "Absence of detailed verified data here does not mean absence of national Polish AI law or regulatory activity.",
    ],
    publicSummary:
      "Poland is included in the EU AI baseline with verified official institutional anchors (UODO, Ministry of Digitalisation). Specific national implementation acts and authority-designation details remain under review. An implementation-in-progress label reflects EU-wide applicability and institutional visibility rather than a fully verified national measure.",
  },
  {
    countryCode: "AT",
    countryName: "Austria",
    slug: "austria",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "low",
    aiActImplementationNotes:
      "Austria is an EU member state to which the EU AI Act applies directly. The DSB (Datenschutzbehörde) is Austria's data-protection authority, an EDPB member, and one of the most active DPAs in Europe on AI and GDPR enforcement. Digital Austria coordinates the national AI strategy. Specific Austrian implementation acts, competent-authority designation instruments, and detailed national measures under the AI Act have not been verified into this baseline layer. An implementation-in-progress label reflects EU-wide applicability and visible official institutions without claiming finalized national measures.",
    nationalImplementationMeasures: [],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Datenschutzbehörde (DSB)",
    relevantMinistriesOrAgencies: [
      "Digital Austria (Federal Chancellery)",
      "Rundfunk und Telekom Regulierungs-GmbH (RTR)",
    ],
    nationalAIRegulationSources: [austriaDsb, austriaDigitalAustria, austriaRtr],
    nationalAIRegulationNotes:
      "The DSB, Digital Austria, and RTR are the principal verified official institutional anchors for Austrian AI and data-governance. Specific national AI Act implementation acts and competent-authority designation instruments have not yet been verified into this baseline.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Austrian AI-specific case law or DSB sanction specifically related to AI Act provisions has been reviewed into this baseline. GDPR-era DSB AI decisions exist but have not been individually verified into this profile.",
    nationalSoftLawSources: [],
    nationalSoftLawNotes:
      "No Austrian AI soft-law or guidance source beyond the DSB and Digital Austria pages has been verified into this baseline in this phase.",
    latestRelevantUpdates: [],
    officialSourceUrls: [austriaDsb.url, austriaDigitalAustria.url, austriaRtr.url],
    sourceReferences: [
      sourceReferenceFromCountrySource(austriaDsb),
      sourceReferenceFromCountrySource(austriaDigitalAustria, "supporting"),
      sourceReferenceFromCountrySource(austriaRtr, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "partially_verified",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No specific Austrian AI Act implementation act verified.",
      "No competent-authority designation instrument under the AI Act verified.",
      "No market-surveillance or notifying authority verified.",
      "RTR's role under the AI Act not yet mapped from a binding instrument.",
      "No country-specific Austrian AI case-law source verified.",
      "Runtime accessibility of Austrian official sources has not been confirmed by this agent.",
    ],
    editorialNotes: [
      "Austria has identifiable official institutions but requires a deeper official-source verification pass before stronger implementation claims can be made.",
      "The DSB is one of the most active DPAs in Europe and has a strong enforcement track record on AI and GDPR matters, making it a high-priority live monitoring source.",
      "NOYB (Max Schrems' NGO), based in Vienna, regularly files AI-related complaints with the DSB; DSB enforcement decisions therefore warrant close monitoring.",
      "Absence of detailed verified data here does not mean absence of national Austrian AI law or regulatory activity.",
    ],
    publicSummary:
      "Austria is included in the EU AI baseline with verified official institutional anchors (DSB, Digital Austria, RTR). The DSB is Austria's data-protection authority and an EDPB member with a strong AI and GDPR enforcement track record. NOYB, based in Vienna, regularly drives AI-related complaints to the DSB. Specific national AI Act implementation acts and authority-designation details remain under review.",
  },
  {
    countryCode: "BE",
    countryName: "Belgium",
    slug: "belgium",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "low",
    aiActImplementationNotes:
      "Belgium is an EU member state to which the EU AI Act applies directly. Official sources confirm the APD/GBA (Autorité de protection des données / Gegevensbeschermingsautoriteit) as the principal Belgian data-protection authority and EDPB member with an active AI and algorithmic oversight capability. Digital Belgium and AI4Belgium provide the federal government's policy and coordination framework. Belgium's complex federal structure — with three regions and three language communities alongside the federal tier — makes the national AI Act authority map more complex than in many other member states. Specific Belgian implementation acts, competent-authority designation instruments under the AI Act, and final national measures have not been verified into this baseline. An implementation-in-progress label reflects EU-wide applicability, institutional visibility, and active policy engagement without claiming finalized national designation.",
    nationalImplementationMeasures: [],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Autorité de protection des données / Gegevensbeschermingsautoriteit (APD/GBA)",
    relevantMinistriesOrAgencies: [
      "Digital Belgium",
      "AI4Belgium",
    ],
    nationalAIRegulationSources: [belgiumApdAi, belgiumDigitalBelgium, belgiumAi4Belgium],
    nationalAIRegulationNotes:
      "The APD/GBA, Digital Belgium, and AI4Belgium are the principal verified official institutional anchors for Belgian AI and data-governance. Specific national AI Act implementation act and competent-authority designation instrument have not yet been verified into this baseline.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Belgian AI-specific case-law source has been reviewed into the public baseline in this phase.",
    nationalSoftLawSources: [],
    nationalSoftLawNotes:
      "No Belgian AI soft-law or guidance source beyond the APD/GBA page has been verified into this baseline in this phase.",
    latestRelevantUpdates: [],
    officialSourceUrls: [belgiumApdAi.url, belgiumDigitalBelgium.url, belgiumAi4Belgium.url],
    sourceReferences: [
      sourceReferenceFromCountrySource(belgiumApdAi),
      sourceReferenceFromCountrySource(belgiumDigitalBelgium, "supporting"),
      sourceReferenceFromCountrySource(belgiumAi4Belgium, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "partially_verified",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No specific Belgian AI Act implementation act verified.",
      "No competent-authority designation instrument under the AI Act verified.",
      "No market-surveillance or notifying authority verified.",
      "No country-specific Belgian AI case-law source verified.",
      "Belgium's regional AI governance (Flemish, Walloon, Brussels-Capital) not yet mapped.",
      "Runtime accessibility of Belgian official sources has not been confirmed by this agent.",
    ],
    editorialNotes: [
      "Belgium has identifiable official institutions but requires a deeper official-source verification pass before stronger implementation claims can be made.",
      "Belgium's federal structure means AI Act supervision may involve multiple tiers of government; the current profile covers only the federal tier.",
      "The APD/GBA has a demonstrated track record of AI-related enforcement and guidance under GDPR, which is directly relevant to AI Act implementation.",
      "Absence of detailed verified data here does not mean absence of national Belgian AI law or regulatory activity.",
    ],
    publicSummary:
      "Belgium is included in the EU AI baseline with verified official institutional anchors (APD/GBA, Digital Belgium, AI4Belgium). The APD/GBA is Belgium's data-protection authority and an EDPB member actively engaged with AI oversight. Belgium's complex federal structure adds governance complexity. Specific national AI Act implementation acts and authority-designation details remain under review.",
  },
  {
    countryCode: "SE",
    countryName: "Sweden",
    slug: "sweden",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "low",
    aiActImplementationNotes:
      "Sweden is an EU member state to which the EU AI Act applies directly. Official sources confirm the existence of IMY (Swedish DPA) and DIGG (Agency for Digital Government) as key national institutions relevant to AI and data-governance. Specific Swedish implementation acts, competent-authority designation instruments, and detailed national measures have not been verified into this baseline layer. An implementation-in-progress label reflects EU-wide applicability and visible official institutions without claiming finalized national measures.",
    nationalImplementationMeasures: [],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Integritetsskyddsmyndigheten (IMY)",
    relevantMinistriesOrAgencies: ["Myndigheten för digital förvaltning (DIGG)", "Swedish Government (Regeringskansliet)"],
    nationalAIRegulationSources: [swedenImy, swedenDigg, swedenRegeringen],
    nationalAIRegulationNotes:
      "IMY, DIGG, and Regeringen are the principal verified official institutional anchors for Swedish AI and data-governance. IMY participated in the EDPB coordinated ChatGPT investigation. Specific national AI Act implementation act has not yet been verified into this baseline.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Swedish AI-specific case-law source has been reviewed into the public baseline in this phase.",
    nationalSoftLawSources: [],
    nationalSoftLawNotes:
      "No Swedish AI soft-law or guidance source has been verified into this baseline in this phase.",
    latestRelevantUpdates: [],
    officialSourceUrls: [swedenImy.url, swedenDigg.url, swedenRegeringen.url],
    sourceReferences: [
      sourceReferenceFromCountrySource(swedenImy),
      sourceReferenceFromCountrySource(swedenDigg, "supporting"),
      sourceReferenceFromCountrySource(swedenRegeringen, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "partially_verified",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No specific Swedish AI Act implementation act verified.",
      "No competent-authority designation instrument verified.",
      "No market-surveillance or notifying authority verified.",
      "No country-specific AI case-law source verified.",
      "Runtime accessibility of Swedish official sources has not been confirmed by this agent.",
    ],
    editorialNotes: [
      "Sweden has identifiable official institutions but requires a deeper official-source verification pass before stronger implementation claims can be made.",
      "IMY participated in the EDPB coordinated ChatGPT investigation, which is directly relevant to AI Act supervision in Sweden.",
      "Absence of detailed verified data here does not mean absence of national Swedish AI law or regulatory activity.",
    ],
    publicSummary:
      "Sweden is included in the EU AI baseline with verified official institutional anchors (IMY, DIGG, Regeringen). IMY participated in the EDPB coordinated ChatGPT investigation, reflecting Sweden's active engagement with AI oversight. Specific national implementation acts and authority-designation details remain under review.",
  },
  {
    countryCode: "IE",
    countryName: "Ireland",
    slug: "ireland",
    region: "Europe",
    euMemberState: true,
    implementationStatus: "implementation_in_progress",
    implementationStatusLabel: europeImplementationStatusTaxonomy.implementation_in_progress.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.implementation_in_progress.shortExplanation,
    implementationConfidence: "low",
    aiActImplementationNotes:
      "Ireland is an EU member state to which the EU AI Act applies directly. Official sources confirm the existence of the DPC (Data Protection Commission) and the Department of Enterprise, Trade and Employment as key national institutions relevant to AI governance. Ireland is the EU establishment of many major AI and technology companies, which increases its practical relevance under the AI Act. Specific Irish implementation acts, competent-authority designation instruments, and detailed national measures have not been verified into this baseline layer. An implementation-in-progress label reflects EU-wide applicability and visible official institutions without claiming finalized national measures.",
    nationalImplementationMeasures: [],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: "Data Protection Commission (DPC)",
    relevantMinistriesOrAgencies: ["Department of Enterprise, Trade and Employment"],
    nationalAIRegulationSources: [irelandDpc, irelandEnterpriseDept, irelandGov],
    nationalAIRegulationNotes:
      "DPC, the Department of Enterprise, Trade and Employment, and the main government portal (gov.ie) are the principal verified official institutional anchors for Irish AI and data governance. The DPC is registered as a live-monitoring candidate given its role as lead supervisory authority for many major AI and technology companies established in Ireland. Specific national AI Act implementation acts and authority-designation details remain under review.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No Irish AI-specific case-law source has been reviewed into the public baseline in this phase.",
    nationalSoftLawSources: [],
    nationalSoftLawNotes:
      "No Irish AI soft-law or guidance source has been verified into this baseline in this phase.",
    latestRelevantUpdates: [],
    officialSourceUrls: [irelandDpc.url, irelandEnterpriseDept.url, irelandGov.url],
    sourceReferences: [
      sourceReferenceFromCountrySource(irelandDpc),
      sourceReferenceFromCountrySource(irelandEnterpriseDept, "supporting"),
      sourceReferenceFromCountrySource(irelandGov, "supporting"),
    ],
    citationQualityStatus: "partial",
    sourceVerificationStatus: "partially_verified",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No binding national AI Act competent authority designation instrument verified.",
      "No market-surveillance or notifying authority verified.",
      "No country-specific AI case-law source verified.",
      "Runtime accessibility of Irish official sources has not been confirmed by this agent.",
    ],
    editorialNotes: [
      "Ireland has identifiable official institutions and is now enrolled in full live monitoring with the DPC as the primary live-monitoring anchor.",
      "Ireland's role as EU home of many major AI and technology companies gives the DPC's actions heightened practical relevance under both GDPR and the AI Act; this should be reflected in monitoring priority, not in overclaiming DPC's AI Act role.",
      "Absence of detailed verified data here does not mean absence of national Irish AI law or regulatory activity.",
    ],
    publicSummary:
      "Ireland is included in the EU AI baseline with live monitoring now active. The DPC (Data Protection Commission) is the primary monitoring anchor and Ireland's lead supervisory authority for many major AI and technology companies established in Ireland. DETE and gov.ie provide the national implementation context. Specific national implementation acts and authority-designation details remain under review.",
  },
];

const allEuMemberStates = [
  ["AT", "Austria", "austria"],
  ["BE", "Belgium", "belgium"],
  ["BG", "Bulgaria", "bulgaria"],
  ["HR", "Croatia", "croatia"],
  ["CY", "Cyprus", "cyprus"],
  ["CZ", "Czechia", "czechia"],
  ["DK", "Denmark", "denmark"],
  ["EE", "Estonia", "estonia"],
  ["FI", "Finland", "finland"],
  ["FR", "France", "france"],
  ["DE", "Germany", "germany"],
  ["GR", "Greece", "greece"],
  ["HU", "Hungary", "hungary"],
  ["IE", "Ireland", "ireland"],
  ["IT", "Italy", "italy"],
  ["LV", "Latvia", "latvia"],
  ["LT", "Lithuania", "lithuania"],
  ["LU", "Luxembourg", "luxembourg"],
  ["MT", "Malta", "malta"],
  ["NL", "Netherlands", "netherlands"],
  ["PL", "Poland", "poland"],
  ["PT", "Portugal", "portugal"],
  ["RO", "Romania", "romania"],
  ["SK", "Slovakia", "slovakia"],
  ["SI", "Slovenia", "slovenia"],
  ["ES", "Spain", "spain"],
  ["SE", "Sweden", "sweden"],
] as const;

const firstWaveByCode = new Map(
  firstWaveProfiles.map((profile) => [profile.countryCode, profile]),
);

function createUnverifiedProfile(
  countryCode: string,
  countryName: string,
  slug: string,
): EuropeCountryProfile {
  return {
    countryCode,
    countryName,
    slug,
    region: "Europe",
    euMemberState: true,
    implementationStatus: "needs_review",
    implementationStatusLabel: europeImplementationStatusTaxonomy.needs_review.label,
    implementationStatusDescription:
      europeImplementationStatusTaxonomy.needs_review.shortExplanation,
    implementationConfidence: "needs_review",
    aiActImplementationNotes:
      "No official national AI Act implementation source has been verified for this country in the baseline layer yet.",
    nationalImplementationMeasures: [],
    nationalCompetentAuthorities: [],
    marketSurveillanceAuthorities: [],
    notifyingAuthorities: [],
    dataProtectionAuthority: null,
    relevantMinistriesOrAgencies: [],
    nationalAIRegulationSources: [],
    nationalAIRegulationNotes:
      "No official national AI regulation source verified yet.",
    nationalCaseLawSources: [],
    nationalCaseLawNotes:
      "No official national AI case-law source verified yet.",
    nationalSoftLawSources: [],
    nationalSoftLawNotes:
      "No official national soft-law or AI guidance source verified yet.",
    latestRelevantUpdates: [],
    officialSourceUrls: [],
    sourceReferences: [],
    citationQualityStatus: "missing_official_source",
    sourceVerificationStatus: "needs_review",
    lastReviewedDate: reviewedAt,
    missingSourceWarnings: [
      "No official national implementation source verified yet.",
      "No competent-authority designation verified.",
      "No market-surveillance or notifying authority verified.",
      "No country-specific AI case-law source verified.",
    ],
    editorialNotes: [
      "Needs official-source review. Absence of verified data here does not mean absence of national law or activity.",
    ],
    publicSummary:
      "This Member State is included in the EU baseline map, but no official national implementation source has been verified yet.",
  };
}

export const europeCountryProfiles: EuropeCountryProfile[] = allEuMemberStates.map(
  ([countryCode, countryName, slug]) =>
    firstWaveByCode.get(countryCode) ??
    createUnverifiedProfile(countryCode, countryName, slug),
);

export function getEuropeCountryProfiles() {
  return [...europeCountryProfiles];
}

export function getEuropeCountryProfileBySlug(slug: string) {
  return europeCountryProfiles.find((profile) => profile.slug === slug) ?? null;
}

export function getPriorityEuropeCountryProfiles() {
  return europeCountryProfiles.filter((profile) =>
    ["FR", "DE", "ES", "IT", "NL", "PL", "SE", "IE", "BE", "AT"].includes(profile.countryCode),
  );
}

export function getEuropeCountryVerificationBacklog() {
  return europeCountryProfiles.filter(
    (profile) =>
      profile.sourceVerificationStatus !== "verified_official_sources_present" ||
      profile.missingSourceWarnings.length > 0,
  );
}

export function isSupportedEuropeImplementationStatus(
  status: string,
): status is EuropeImplementationStatus {
  return status in europeImplementationStatusTaxonomy;
}
