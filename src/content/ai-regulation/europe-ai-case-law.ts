import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";

const verifiedAt = "2026-06-01T00:00:00.000Z";

export interface EuropeAiCaseLawSource {
  id: string;
  name: string;
  jurisdiction: string;
  sourceUrl: string;
  institution: string;
  sourceType: "court" | "regulator";
  runtimeAccessible: boolean;
  responseStatus: number | null;
  parserStatus: "manual_reference" | "needs_dedicated_parser";
  monitoringRecommendation: "manual_review" | "inactive";
  sourceReferences: SourceReference[];
  note: string;
}

export interface EuropeAiCaseLawEntry {
  id: string;
  title: string;
  courtOrAuthority: string;
  jurisdiction: string;
  country: string | null;
  date: string | null;
  officialSourceUrl: string | null;
  docketOrCaseNumber: string | null;
  ecli: string | null;
  legalArea: string;
  aiIssue: string;
  legalIssue: string;
  outcomeOrHolding: string | null;
  shortSummary: string;
  sourceReferences: SourceReference[];
  confidenceLevel: "high" | "medium" | "low" | "needs_review";
  status: "needs_review" | "published" | "archived";
  authorityType: "case_law" | "administrative_decision" | "enforcement_action";
  citationQualityStatus: CitationQualityStatus;
}

function courtReference(input: {
  title: string;
  institution: string;
  url: string;
  jurisdiction?: string;
  publicationDate?: string | null;
  pinpoint?: SourceReference["pinpoint"] | null;
  responseStatus: number | null;
  notes: string;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: "court",
    authorityType: "Court database",
    publicationDate: input.publicationDate ?? null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: verifiedAt,
    jurisdiction: input.jurisdiction ?? "Europe",
    documentType: "Court database",
    excerpt: null,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: null,
    notes: input.notes,
  };
}

function regulatorReference(input: {
  title: string;
  institution: string;
  url: string;
  jurisdiction?: string;
  publicationDate?: string | null;
  pinpoint?: SourceReference["pinpoint"] | null;
  notes: string;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: "regulator",
    authorityType: "Regulator decision or legal criteria source",
    publicationDate: input.publicationDate ?? null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: verifiedAt,
    jurisdiction: input.jurisdiction ?? "Europe",
    documentType: "Regulator publication",
    excerpt: null,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: null,
    notes: input.notes,
  };
}

export const europeAiCaseLawSources: EuropeAiCaseLawSource[] = [
  {
    id: "curia-info-curia",
    name: "CURIA / InfoCuria",
    jurisdiction: "European Union",
    sourceUrl: "https://curia.europa.eu/jcms/jcms/j_6/en/",
    institution: "Court of Justice of the European Union",
    sourceType: "court",
    runtimeAccessible: true,
    responseStatus: 200,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      courtReference({
        title: "Court of Justice of the European Union official site",
        institution: "Court of Justice of the European Union",
        url: "https://curia.europa.eu/jcms/jcms/j_6/en/",
        publicationDate: null,
        responseStatus: 200,
        notes:
          "Official CJEU/CURIA source verified as reachable. Specific AI-related cases require docket-level verification before publication.",
      }),
    ],
    note:
      "Prepared as the official EU case-law source. No AI-specific case is published from this baseline without case-level review.",
  },
  {
    id: "echr-hudoc",
    name: "HUDOC",
    jurisdiction: "Council of Europe / European Convention on Human Rights",
    sourceUrl: "https://hudoc.echr.coe.int/",
    institution: "European Court of Human Rights",
    sourceType: "court",
    runtimeAccessible: true,
    responseStatus: 200,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      courtReference({
        title: "HUDOC database",
        institution: "European Court of Human Rights",
        url: "https://hudoc.echr.coe.int/",
        publicationDate: null,
        responseStatus: 200,
        notes:
          "Official ECtHR HUDOC database verified as reachable. Specific AI/algorithm cases require case-level citation before publication.",
      }),
    ],
    note:
      "Prepared as the official ECHR case-law source. No case holdings or facts are inferred in this phase.",
  },
  {
    id: "france-conseil-etat-arianeweb",
    name: "Conseil d'Etat / ArianeWeb",
    jurisdiction: "France",
    sourceUrl: "https://www.conseil-etat.fr/fr/arianeweb/",
    institution: "Conseil d'Etat",
    sourceType: "court",
    runtimeAccessible: true,
    responseStatus: 200,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      courtReference({
        title: "ArianeWeb official case-law database",
        institution: "Conseil d'Etat",
        url: "https://www.conseil-etat.fr/fr/arianeweb/",
        jurisdiction: "France",
        publicationDate: null,
        responseStatus: 200,
        notes:
          "Official Conseil d'Etat case-law database used for verified French administrative decisions relevant to automated decision-making and algorithmic governance.",
      }),
    ],
    note:
      "Prepared as the official administrative-court source for French AI-related public-law decisions.",
  },
  {
    id: "france-legifrance-jurisprudence",
    name: "Legifrance / Jurisprudence judiciaire",
    jurisdiction: "France",
    sourceUrl: "https://www.legifrance.gouv.fr/juri/",
    institution: "Legifrance",
    sourceType: "court",
    runtimeAccessible: false,
    responseStatus: 403,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      courtReference({
        title: "Legifrance jurisprudence portal",
        institution: "Legifrance",
        url: "https://www.legifrance.gouv.fr/juri/",
        jurisdiction: "France",
        publicationDate: null,
        responseStatus: 403,
        notes:
          "Official French case-law portal used as the citation authority for judicial decisions, but runtime scan access may be blocked by a Cloudflare challenge.",
      }),
    ],
    note:
      "Prepared as the official Legifrance jurisprudence source for French judicial decisions, with current runtime-access limits clearly flagged.",
  },
  {
    id: "spain-aepd-resolutions",
    name: "AEPD legal criteria and resolutions",
    jurisdiction: "Spain",
    sourceUrl: "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd",
    institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
    sourceType: "regulator",
    runtimeAccessible: true,
    responseStatus: 200,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      regulatorReference({
        title: "AEPD legal criteria portal",
        institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
        url: "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd",
        jurisdiction: "Spain",
        notes:
          "Official AEPD portal for legal criteria and summaries linked to underlying resolutions. Useful as a conservative public anchor for Spanish AI-related administrative decisions, but full resolution-level pinning remains preferable where available.",
      }),
      regulatorReference({
        title: "AEPD resolutions portal",
        institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
        url: "https://www.aepd.es/informes-y-resoluciones/resoluciones",
        jurisdiction: "Spain",
        notes:
          "Official AEPD resolutions portal used as the authoritative registry for underlying Spanish data-protection decisions and files.",
      }),
    ],
    note:
      "Prepared as the official Spanish regulator-decision source for AI-related AEPD criteria and resolution summaries.",
  },
  {
    id: "italy-garante-ai-actions",
    name: "Garante AI topic and DocWeb actions",
    jurisdiction: "Italy",
    sourceUrl: "https://www.garanteprivacy.it/temi/intelligenza-artificiale",
    institution: "Garante per la protezione dei dati personali",
    sourceType: "regulator",
    runtimeAccessible: true,
    responseStatus: 200,
    parserStatus: "needs_dedicated_parser",
    monitoringRecommendation: "manual_review",
    sourceReferences: [
      regulatorReference({
        title: "Garante AI topic page",
        institution: "Garante per la protezione dei dati personali",
        url: "https://www.garanteprivacy.it/temi/intelligenza-artificiale",
        jurisdiction: "Italy",
        notes:
          "Official Italian data-protection authority AI topic page used as the main public anchor for Italian AI-related guidance, actions, and supervisory materials.",
      }),
      regulatorReference({
        title: "Garante DocWeb action on AI in workplace messaging tools",
        institution: "Garante per la protezione dei dati personali",
        url: "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10255522",
        jurisdiction: "Italy",
        publicationDate: "2026-05-28",
        notes:
          "Official Garante press communication concerning a warning about AI emotion-analysis in workplace messaging tools.",
      }),
      regulatorReference({
        title: "Garante DocWeb action on AI in schools",
        institution: "Garante per la protezione dei dati personali",
        url: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10257612",
        jurisdiction: "Italy",
        publicationDate: "2026-06-03",
        notes:
          "Official Garante press communication concerning a request for information on generative AI use in schools.",
      }),
    ],
    note:
      "Prepared as the official Italian regulator-action source for AI-related Garante warnings, information requests, and supervisory signals.",
  },
];

export const europeAiCaseLawEntries: EuropeAiCaseLawEntry[] = [
  {
    id: "france-conseil-etat-427916-parcoursup-disclosure",
    title: "Université des Antilles (communication des procédés algorithmiques Parcoursup)",
    courtOrAuthority: "Conseil d'Etat",
    jurisdiction: "France",
    country: "France",
    date: "2019-06-12",
    officialSourceUrl: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2019-06-12/427916",
    docketOrCaseNumber: "427916",
    ecli: "ECLI:FR:CECHR:2019:427916.20190612",
    legalArea: "Access to justice",
    aiIssue: "Disclosure of algorithmic criteria and source code used in Parcoursup admissions review",
    legalIssue:
      "Whether a student union could obtain communication of the algorithmic procedures and source code used by a university to review Parcoursup applications.",
    outcomeOrHolding:
      "The Conseil d'Etat held that the specific communication right recognised for Parcoursup candidates did not extend in the same way to a student union requesting the university's algorithmic procedures and source code.",
    shortSummary:
      "Verified Conseil d'Etat decision on access to algorithmic-selection information in the Parcoursup context. Included because it is a foundational French administrative-law reference on algorithmic transparency and admissions-related automated processing.",
    sourceReferences: [
      courtReference({
        title: "ArianeWeb decision no. 427916",
        institution: "Conseil d'Etat",
        url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2019-06-12/427916",
        jurisdiction: "France",
        publicationDate: "2019-06-12",
        pinpoint: {
          caseNumber: "427916",
          ECLI: "ECLI:FR:CECHR:2019:427916.20190612",
        },
        responseStatus: 200,
        notes:
          "Official ArianeWeb decision page for the 12 June 2019 ruling concerning disclosure of Parcoursup algorithmic procedures.",
      }),
      courtReference({
        title: "Conseil d'Etat news note on communication of Parcoursup processing rules",
        institution: "Conseil d'Etat",
        url: "https://conseil-etat.fr/actualites/communication-des-regles-de-traitement-des-candidatures-sur-parcoursup",
        jurisdiction: "France",
        publicationDate: "2019-06-12",
        pinpoint: {
          paragraph: "L'Essentiel",
        },
        responseStatus: 200,
        notes:
          "Official Conseil d'Etat explanatory note used as a supporting source for a conservative public summary of the decision's effect.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "spain-aepd-uiv-biometric-online-evaluation-2025",
    title: "AEPD sanction concerning biometric AI use in online university examination monitoring",
    courtOrAuthority: "Agencia Espanola de Proteccion de Datos (AEPD)",
    jurisdiction: "Spain",
    country: "Spain",
    date: "2025-06-03",
    officialSourceUrl:
      "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd/aepd-sanciona-tratamiento-datos-biometricos-ia",
    docketOrCaseNumber: null,
    ecli: null,
    legalArea: "Data protection",
    aiIssue:
      "Facial-recognition and AI-assisted proctoring in remote university examinations",
    legalIssue:
      "Whether biometric and AI-based online proctoring for university exams had a valid legal basis under Spanish and EU data-protection law.",
    outcomeOrHolding:
      "According to the AEPD's official legal-criteria summary, the agency rejected the current legal basis relied on for the biometric and AI-based proctoring system, while indicating that a specific future legal framework could alter the analysis.",
    shortSummary:
      "Official AEPD legal-criteria page summarising a Spanish administrative decision on AI-assisted biometric exam monitoring. Included conservatively as a verified regulator-decision signal rather than as a full-resolution publication.",
    sourceReferences: [
      regulatorReference({
        title:
          "AEPD legal criteria summary on biometric AI in online university evaluation",
        institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
        url: "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd/aepd-sanciona-tratamiento-datos-biometricos-ia",
        jurisdiction: "Spain",
        publicationDate: "2025-06-03",
        notes:
          "Official AEPD legal-criteria page explicitly stating that the summaries cannot be considered the official publication of a public document and that the full binding content is published in the resolutions section.",
      }),
      regulatorReference({
        title: "AEPD resolutions portal",
        institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
        url: "https://www.aepd.es/informes-y-resoluciones/resoluciones",
        jurisdiction: "Spain",
        notes:
          "Official resolutions portal cited as the place where full binding AEPD resolution texts are published.",
      }),
    ],
    confidenceLevel: "medium",
    status: "needs_review",
    authorityType: "administrative_decision",
    citationQualityStatus: "partial",
  },
  {
    id: "spain-aepd-chatbot-data-rights-2025",
    title: "AEPD legal criterion on whether an AI chatbot must understand the exercise of a data-protection right",
    courtOrAuthority: "Agencia Espanola de Proteccion de Datos (AEPD)",
    jurisdiction: "Spain",
    country: "Spain",
    date: "2025-06-19",
    officialSourceUrl:
      "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd/debe-la-ia-entender-el-ejercicio-de-un-derecho-proteccion-de-datos",
    docketOrCaseNumber: null,
    ecli: null,
    legalArea: "Data protection",
    aiIssue: "AI chatbot behavior in automated commercial communications and opt-out handling",
    legalIssue:
      "Whether an AI system used in automated commercial communications had to understand and execute a data-protection objection expressed without the expected keyword.",
    outcomeOrHolding:
      "According to the AEPD's official legal-criteria summary, the agency treated the clear and free 'BAJA' mechanism as sufficient in the case and did not require the AI system to interpret every possible human formulation, while noting future AI Act transparency requirements.",
    shortSummary:
      "Official AEPD legal-criteria page summarising an AI-chatbot and data-rights case. Included as a conservative administrative-decision signal with explicit notice that the page summarises, rather than fully reproduces, the binding resolution.",
    sourceReferences: [
      regulatorReference({
        title:
          "AEPD legal criteria on AI understanding of a data-protection right request",
        institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
        url: "https://www.aepd.es/informes-y-resoluciones/criterios-juridicos-aepd/debe-la-ia-entender-el-ejercicio-de-un-derecho-proteccion-de-datos",
        jurisdiction: "Spain",
        publicationDate: "2025-06-19",
        notes:
          "Official AEPD legal-criteria page with explicit disclaimer that the summary is not the official publication of the public document and that the full binding content is published in the resolutions section.",
      }),
      regulatorReference({
        title: "AEPD resolutions portal",
        institution: "Agencia Espanola de Proteccion de Datos (AEPD)",
        url: "https://www.aepd.es/informes-y-resoluciones/resoluciones",
        jurisdiction: "Spain",
        notes:
          "Official resolutions portal cited by the criteria page as the location of the full binding resolution text.",
      }),
    ],
    confidenceLevel: "medium",
    status: "needs_review",
    authorityType: "administrative_decision",
    citationQualityStatus: "partial",
  },
  {
    id: "italy-garante-openai-chatgpt-2024",
    title: "Garante action against OpenAI in relation to ChatGPT",
    courtOrAuthority: "Garante per la protezione dei dati personali",
    jurisdiction: "Italy",
    country: "Italy",
    date: "2024-12-20",
    officialSourceUrl:
      "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10085432",
    docketOrCaseNumber: null,
    ecli: null,
    legalArea: "Data protection",
    aiIssue: "Generative AI training, transparency, age verification, and sanctions related to ChatGPT",
    legalIssue:
      "Official Italian data-protection enforcement concerning personal-data processing for training and operation of a generative-AI chatbot service.",
    outcomeOrHolding:
      "According to the official Garante communication, OpenAI was ordered to carry out an information campaign and fined EUR 15 million, while the same page also notes that Decision No. 755 of 2 November 2024 was later temporarily removed following a 2026 court judgment.",
    shortSummary:
      "Official Italian enforcement communication on ChatGPT and personal-data processing. Included conservatively because the official page itself records both the corrective and sanctioning measures and the later court-related procedural note.",
    sourceReferences: [
      regulatorReference({
        title: "Garante press communication on closure of the ChatGPT investigation",
        institution: "Garante per la protezione dei dati personali",
        url: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10085432",
        jurisdiction: "Italy",
        publicationDate: "2024-12-20",
        notes:
          "Official Garante page describing the measures taken against OpenAI and also recording that Decision No. 755 of 2 November 2024 was temporarily removed after a 2026 court judgment.",
      }),
    ],
    confidenceLevel: "medium",
    status: "needs_review",
    authorityType: "enforcement_action",
    citationQualityStatus: "partial",
  },
  {
    id: "italy-garante-workplace-ai-warning-2026",
    title: "Garante warning on AI emotion-analysis in workplace messaging tools",
    courtOrAuthority: "Garante per la protezione dei dati personali",
    jurisdiction: "Italy",
    country: "Italy",
    date: "2026-05-28",
    officialSourceUrl:
      "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10255522",
    docketOrCaseNumber: null,
    ecli: null,
    legalArea: "Employment and data protection",
    aiIssue: "AI and semantic analysis of workplace chats to infer worker stress or emotions",
    legalIssue:
      "Official Italian supervisory action addressing whether AI-enabled semantic analysis of workplace communications creates unacceptable risks for employee rights and sensitive inferences.",
    outcomeOrHolding:
      "According to the official Garante communication, the authority sent a warning to an Italian startup and emphasised that employers cannot legitimately access or process emotional information in this context, while also citing the EU AI Act prohibition on emotion-recognition uses in employment settings.",
    shortSummary:
      "Official Garante supervisory warning on AI emotion-analysis in the workplace. Included as a verified Italian enforcement-oriented signal rather than as a court ruling.",
    sourceReferences: [
      regulatorReference({
        title: "Garante press communication on AI and work",
        institution: "Garante per la protezione dei dati personali",
        url: "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10255522",
        jurisdiction: "Italy",
        publicationDate: "2026-05-28",
        notes:
          "Official Garante page describing the warning sent to an Italian startup over AI-based analysis of worker stress and emotions in workplace messaging tools.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "enforcement_action",
    citationQualityStatus: "partial",
  },
  {
    id: "italy-garante-school-ai-information-request-2026",
    title: "Garante request for information on generative AI use in schools",
    courtOrAuthority: "Garante per la protezione dei dati personali",
    jurisdiction: "Italy",
    country: "Italy",
    date: "2026-06-03",
    officialSourceUrl:
      "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10257612",
    docketOrCaseNumber: null,
    ecli: null,
    legalArea: "Education and data protection",
    aiIssue: "Generative AI use in educational services involving students and teachers",
    legalIssue:
      "Official Italian supervisory request for information concerning generative AI use in educational settings, including data-processing methods, participating schools, vendors, and DPIA posture.",
    outcomeOrHolding:
      "According to the official Garante communication, the authority requested information within 20 days and highlighted the need for specific safeguards where automated decision-making or high risks may be involved.",
    shortSummary:
      "Official Garante information request on generative AI in schools. Included as a verified Italian supervisory signal showing live education-sector AI monitoring.",
    sourceReferences: [
      regulatorReference({
        title: "Garante press communication on AI in schools",
        institution: "Garante per la protezione dei dati personali",
        url: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10257612",
        jurisdiction: "Italy",
        publicationDate: "2026-06-03",
        notes:
          "Official Garante page describing a request for information on generative AI use in educational and teaching activities.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "administrative_decision",
    citationQualityStatus: "partial",
  },
  {
    id: "france-conseil-etat-417906-parcoursup-processing",
    title: "CRCE du Sénat et autres (Parcoursup)",
    courtOrAuthority: "Conseil d'Etat",
    jurisdiction: "France",
    country: "France",
    date: "2019-07-10",
    officialSourceUrl: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2019-07-10/417906",
    docketOrCaseNumber: "417906",
    ecli: "ECLI:FR:CECHR:2019:417906.20190710",
    legalArea: "Automated decision-making",
    aiIssue: "Automated personal-data processing and public communications linked to the Parcoursup platform",
    legalIssue:
      "Review of the ministerial act authorising the automated personal-data processing underlying Parcoursup and related public-facing platform content.",
    outcomeOrHolding:
      "The Conseil d'Etat annulled certain public-facing Parcoursup website statements insofar as, before 11 March 2018, they were not accompanied by wording making clear their non-final character.",
    shortSummary:
      "Verified Conseil d'Etat decision on the legal framing of Parcoursup's automated-processing system and associated public communications. Included because it sits at the intersection of automated decision-making, administrative legality, and public-sector digital systems.",
    sourceReferences: [
      courtReference({
        title: "ArianeWeb decision no. 417906",
        institution: "Conseil d'Etat",
        url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2019-07-10/417906",
        jurisdiction: "France",
        publicationDate: "2019-07-10",
        pinpoint: {
          caseNumber: "417906",
          ECLI: "ECLI:FR:CECHR:2019:417906.20190710",
        },
        responseStatus: 200,
        notes:
          "Official ArianeWeb decision page for the 10 July 2019 ruling on the automated personal-data processing known as Parcoursup.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "france-conseil-etat-451653-automated-platform-scraping",
    title: "La Quadrature du Net (collecte et exploitation automatisées de données de plateformes)",
    courtOrAuthority: "Conseil d'Etat",
    jurisdiction: "France",
    country: "France",
    date: "2022-07-22",
    officialSourceUrl: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2022-07-22/451653",
    docketOrCaseNumber: "451653",
    ecli: "ECLI:FR:CECHR:2022:451653.20220722",
    legalArea: "Data protection",
    aiIssue: "Automated collection and exploitation of publicly accessible platform data",
    legalIssue:
      "Legality of a decree authorising automated processing for collection and exploitation of public platform data, including safeguards and data categories.",
    outcomeOrHolding:
      "The Conseil d'Etat rejected the application challenging the decree and noted, among other things, that no facial-recognition identification was authorised under the scheme.",
    shortSummary:
      "Verified Conseil d'Etat decision on automated collection and analysis of public online-platform data by French authorities. Included because it is a significant French public-law reference on automated processing, safeguards, and state use of algorithmic tools.",
    sourceReferences: [
      courtReference({
        title: "ArianeWeb decision no. 451653",
        institution: "Conseil d'Etat",
        url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2022-07-22/451653",
        jurisdiction: "France",
        publicationDate: "2022-07-22",
        pinpoint: {
          caseNumber: "451653",
          ECLI: "ECLI:FR:CECHR:2022:451653.20220722",
        },
        responseStatus: 200,
        notes:
          "Official ArianeWeb decision page for the 22 July 2022 ruling on automated collection and exploitation of publicly available platform data.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "france-cour-cassation-16-27-866-watson",
    title: "Crédit Mutuel Sud-Est / CHSCT (introduction de l'application Watson)",
    courtOrAuthority: "Cour de cassation, chambre sociale",
    jurisdiction: "France",
    country: "France",
    date: "2018-04-12",
    officialSourceUrl: "https://www.legifrance.gouv.fr/juri/id/JURITEXT000036829790/",
    docketOrCaseNumber: "16-27.866",
    ecli: null,
    legalArea: "Employment",
    aiIssue: "Workplace introduction of an application using the IBM Watson artificial-intelligence program",
    legalIssue:
      "Labour-law dispute concerning expert review and consultation linked to the introduction of an AI-enabled workplace application.",
    outcomeOrHolding:
      "The official decision record states that the dispute concerned expert review of changes linked to the introduction of a specific application using the Watson artificial-intelligence program.",
    shortSummary:
      "Verified Cour de cassation decision record involving workplace deployment of a system described as using the Watson artificial-intelligence program. Included as a cautious French judicial reference touching employment, consultation, and AI-enabled workplace tooling.",
    sourceReferences: [
      courtReference({
        title: "Legifrance decision record for Cour de cassation, chambre sociale, 12 avril 2018, 16-27.866",
        institution: "Legifrance / Cour de cassation",
        url: "https://www.legifrance.gouv.fr/juri/id/JURITEXT000036829790/",
        jurisdiction: "France",
        publicationDate: "2018-04-12",
        pinpoint: {
          docket: "16-27.866",
        },
        responseStatus: 403,
        notes:
          "Official Legifrance judicial decision page. Runtime fetch may be blocked, but the official record and citation were independently verified.",
      }),
    ],
    confidenceLevel: "medium",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "france-conseil-etat-506370-nice-video-analytics",
    title: "Ville de Nice et autre (analyse video algorithmique autour des ecoles)",
    courtOrAuthority: "Conseil d'Etat",
    jurisdiction: "France",
    country: "France",
    date: "2026-01-30",
    officialSourceUrl: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2026-01-30/506370",
    docketOrCaseNumber: "506370",
    ecli: "ECLI:FR:CECHR:2026:506370.20260130",
    legalArea: "Administrative law and public-sector digital systems",
    aiIssue: "Algorithmic video analysis around school-entry security arrangements",
    legalIssue:
      "Administrative-law challenge linked to a municipal project involving algorithmic video-analysis around schools and the CNIL's position on the matter.",
    outcomeOrHolding:
      "The official ArianeWeb decision page records the Conseil d'Etat ruling of 30 January 2026 in litigation linked to algorithmic video analysis around schools.",
    shortSummary:
      "Verified Conseil d'Etat decision page for a Nice dispute linked to algorithmic video analysis around schools. Included conservatively as a French public-law AI governance reference without overclaiming beyond the official record.",
    sourceReferences: [
      courtReference({
        title: "ArianeWeb decision no. 506370",
        institution: "Conseil d'Etat",
        url: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2026-01-30/506370",
        jurisdiction: "France",
        publicationDate: "2026-01-30",
        pinpoint: {
          caseNumber: "506370",
          ECLI: "ECLI:FR:CECHR:2026:506370.20260130",
        },
        responseStatus: 200,
        notes:
          "Official ArianeWeb decision page for the 30 January 2026 ruling linked to algorithmic video analysis around school entries in Nice.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "france-cnil-2025-108-viginum-ai-tools",
    title: "CNIL Deliberation no. 2025-108 (Viginum AI tools and automated online-data collection)",
    courtOrAuthority: "CNIL",
    jurisdiction: "France",
    country: "France",
    date: "2026-02-13",
    officialSourceUrl: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000053461680",
    docketOrCaseNumber: "2025-108",
    ecli: null,
    legalArea: "Data protection and public-sector digital oversight",
    aiIssue: "Official CNIL deliberation concerning Viginum, automated online-data collection, and AI tools",
    legalIssue:
      "CNIL review of a framework involving automated online-data collection and the development or use of AI tools, algorithms, and models by a French public authority.",
    outcomeOrHolding:
      "The official CNIL / Legifrance record identifies Deliberation no. 2025-108 and its subject matter concerning Viginum and AI tools.",
    shortSummary:
      "Verified French administrative-decision record relevant to public-sector AI tooling and automated online-data collection. Included conservatively as an official CNIL AI-governance source.",
    sourceReferences: [
      courtReference({
        title: "Legifrance CNIL record for Deliberation no. 2025-108",
        institution: "Legifrance / CNIL",
        url: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000053461680",
        jurisdiction: "France",
        publicationDate: "2026-02-13",
        pinpoint: {
          section: "Deliberation no. 2025-108",
        },
        responseStatus: 200,
        notes:
          "Official Legifrance CNIL record concerning Viginum, automated online-data collection, and AI tools, algorithms, and models.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "administrative_decision",
    citationQualityStatus: "partial",
  },
  {
    id: "france-cnil-dr-2024-184-healthcare-decision-support",
    title: "CNIL Decision DR-2024-184 (healthcare decision-support research project)",
    courtOrAuthority: "CNIL",
    jurisdiction: "France",
    country: "France",
    date: "2024-09-21",
    officialSourceUrl: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000050216830",
    docketOrCaseNumber: "DR-2024-184",
    ecli: null,
    legalArea: "Health data and research governance",
    aiIssue: "Research authorisation for an algorithmic decision-support tool in intensive-care admissions",
    legalIssue:
      "CNIL authorisation for a healthcare research project involving an AI or algorithmic decision-support tool used in intensive-care admission assessment.",
    outcomeOrHolding:
      "The official CNIL / Legifrance record identifies Decision DR-2024-184 as an authorisation decision for the Genially research project.",
    shortSummary:
      "Verified French administrative-decision record for a healthcare AI decision-support research authorisation. Included as a cautious official CNIL baseline entry on sectoral AI governance.",
    sourceReferences: [
      courtReference({
        title: "Legifrance CNIL record for Decision DR-2024-184",
        institution: "Legifrance / CNIL",
        url: "https://www.legifrance.gouv.fr/cnil/id/CNILTEXT000050216830",
        jurisdiction: "France",
        publicationDate: "2024-09-21",
        pinpoint: {
          section: "Decision DR-2024-184",
        },
        responseStatus: 200,
        notes:
          "Official Legifrance CNIL authorisation record for a research project involving an algorithmic decision-support tool for intensive-care admission.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "administrative_decision",
    citationQualityStatus: "partial",
  },
  {
    id: "germany-bgh-schufa-positive-data-2025",
    title: "BGH decision on transfer of positive data to SCHUFA",
    courtOrAuthority: "Bundesgerichtshof (BGH)",
    jurisdiction: "Germany",
    country: "Germany",
    date: "2025-10-14",
    officialSourceUrl:
      "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2025&Gericht=bgh&anz=210&nr=143457&pos=1",
    docketOrCaseNumber: "VI ZR 431/24",
    ecli: null,
    legalArea: "Data protection and automated scoring",
    aiIssue: "Automated creditworthiness and fraud-prevention data transfers involving scoring infrastructure",
    legalIssue:
      "Permissibility of transmitting so-called positive data to SCHUFA in a German data-protection and scoring dispute.",
    outcomeOrHolding:
      "The official BGH press release states that the court upheld dismissal of the injunction claim challenging the transfer of positive data to SCHUFA.",
    shortSummary:
      "Verified German high-court decision anchor on data transfers into scoring infrastructure. Included cautiously as an automated decision-making and algorithmic-governance reference, not as proof of a broad German AI case-law corpus.",
    sourceReferences: [
      courtReference({
        title: "BGH press release on VI ZR 431/24",
        institution: "Bundesgerichtshof",
        url: "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2025&Gericht=bgh&anz=210&nr=143457&pos=1",
        jurisdiction: "Germany",
        publicationDate: "2025-10-14",
        pinpoint: {
          docket: "VI ZR 431/24",
        },
        responseStatus: 200,
        notes:
          "Official BGH press communication on the decision concerning positive-data transfers to SCHUFA. Used conservatively for a public Germany automated-scoring case-law baseline.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "cjeu-c-634-21-schufa-scoring",
    title: "OQ v Land Hessen (SCHUFA Holding (Scoring))",
    courtOrAuthority: "Court of Justice of the European Union",
    jurisdiction: "European Union",
    country: "Germany",
    date: "2023-12-07",
    officialSourceUrl:
      "https://infocuria.curia.europa.eu/tabs/redirect/juris/liste.jsf?language=en&num=C-634%2F21",
    docketOrCaseNumber: "C-634/21",
    ecli: "ECLI:EU:C:2023:957",
    legalArea: "Data protection and automated decision-making",
    aiIssue: "Automated scoring used by a credit information agency",
    legalIssue:
      "GDPR Article 22 and use of automated probability scores by third parties in decision-making.",
    outcomeOrHolding:
      "The Court held that Article 22(1) GDPR can apply where a credit information agency establishes a probability value that is then used decisively by a third party.",
    shortSummary:
      "Verified CJEU judgment on automated scoring under the GDPR. Included here because it is a foundational European case on automated decision-making relevant to AI and algorithmic governance.",
    sourceReferences: [
      courtReference({
        title: "InfoCuria case list for C-634/21",
        institution: "Court of Justice of the European Union",
        url: "https://infocuria.curia.europa.eu/tabs/redirect/juris/liste.jsf?language=en&num=C-634%2F21",
        publicationDate: "2023-12-07",
        pinpoint: {
          caseNumber: "C-634/21",
          ECLI: "ECLI:EU:C:2023:957",
        },
        responseStatus: 200,
        notes:
          "Official InfoCuria case list showing the judgment of 7 December 2023 and the associated ECLI.",
      }),
      courtReference({
        title: "CJEU Press Release No 186/23 on SCHUFA Holding (Scoring)",
        institution: "Court of Justice of the European Union",
        url: "https://curia.europa.eu/jcms/upload/docs/application/pdf/2023-12/cp230186en.pdf",
        publicationDate: "2023-12-07",
        pinpoint: {
          caseNumber: "C-634/21",
        },
        responseStatus: 200,
        notes:
          "Official CJEU press release summarising the same judgment. Used as a supporting official source for conservative public summarisation.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
  {
    id: "cjeu-c-203-22-dun-and-bradstreet-austria",
    title: "CK v Magistrat der Stadt Wien (Dun & Bradstreet Austria)",
    courtOrAuthority: "Court of Justice of the European Union",
    jurisdiction: "European Union",
    country: "Austria",
    date: "2025-02-27",
    officialSourceUrl:
      "https://infocuria.curia.europa.eu/tabs/redirect/juris/liste.jsf?num=C-203%2F22",
    docketOrCaseNumber: "C-203/22",
    ecli: "ECLI:EU:C:2025:117",
    legalArea: "Data protection, profiling, and access rights",
    aiIssue: "Automated credit assessment and explainability of profiling logic",
    legalIssue:
      "Scope of the right of access to meaningful information about the logic involved in automated decision-making under GDPR Article 15(1)(h).",
    outcomeOrHolding:
      "The Court held that the data subject is entitled to an explanation enabling the automated decision to be understood and challenged.",
    shortSummary:
      "Verified CJEU judgment on automated credit assessment and explainability. Included because it is directly relevant to European AI and algorithmic accountability baseline coverage.",
    sourceReferences: [
      courtReference({
        title: "InfoCuria case list for C-203/22",
        institution: "Court of Justice of the European Union",
        url: "https://infocuria.curia.europa.eu/tabs/redirect/juris/liste.jsf?num=C-203%2F22",
        publicationDate: "2025-02-27",
        pinpoint: {
          caseNumber: "C-203/22",
          ECLI: "ECLI:EU:C:2025:117",
        },
        responseStatus: 200,
        notes:
          "Official InfoCuria case list showing the judgment of 27 February 2025 and the associated ECLI.",
      }),
      courtReference({
        title: "CJEU Press Release No 22/25 on Dun & Bradstreet Austria",
        institution: "Court of Justice of the European Union",
        url: "https://curia.europa.eu/jcms/upload/docs/application/pdf/2025-02/cp250022en.pdf",
        publicationDate: "2025-02-27",
        pinpoint: {
          caseNumber: "C-203/22",
        },
        responseStatus: 200,
        notes:
          "Official CJEU press release summarising the judgment and supporting a conservative short summary.",
      }),
    ],
    confidenceLevel: "high",
    status: "needs_review",
    authorityType: "case_law",
    citationQualityStatus: "partial",
  },
];

export const europeAiCaseLawTopics = [
  "automated decision-making",
  "biometric identification",
  "facial recognition",
  "public-sector algorithms",
  "welfare or public benefits algorithms",
  "employment algorithms",
  "algorithmic discrimination",
  "AI and data protection",
  "AI evidence",
  "law enforcement and surveillance",
  "platform or content moderation where AI-specific",
  "AI liability",
];
