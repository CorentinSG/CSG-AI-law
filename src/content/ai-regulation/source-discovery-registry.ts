export type SourceAuthorityTier =
  | "official_primary"
  | "official_court_or_legislative_database"
  | "official_regulator_or_agency"
  | "standards_body_or_governance_framework"
  | "secondary_tracker"
  | "informal_discovery_source"
  | "media_discovery_source";

export type SourceMonitoringRole =
  | "active_monitoring"
  | "candidate_for_monitoring"
  | "discovery_only"
  | "cross_check_only"
  | "manual_review_only"
  | "inactive_for_scraping";

export type SourceVerificationPosture =
  | "verified_active"
  | "verified_inactive"
  | "runtime_blocked"
  | "unstable_endpoint"
  | "needs_dedicated_parser"
  | "needs_runtime_verification"
  | "paywalled_or_restricted"
  | "manual_reference_only";

export type SourceRegionFocus = "europe" | "united-states" | "international";

export interface SourceDiscoveryRegistryEntry {
  id: string;
  name: string;
  regionFocus: SourceRegionFocus;
  authorityTier: SourceAuthorityTier;
  monitoringRole: SourceMonitoringRole;
  official: boolean;
  authorityLevel: "official" | "authoritative" | "secondary" | "non_official";
  publicationAllowed: boolean;
  requiresOfficialSourceConfirmation: boolean;
  requiresCrossSourceVerification: boolean;
  url: string | null;
  sourceStatus: SourceVerificationPosture;
  notes: string;
  examples?: string[];
}

export const sourceAuthorityTierLabels: Record<SourceAuthorityTier, string> = {
  official_primary: "Official primary source",
  official_court_or_legislative_database: "Official court or legislative database",
  official_regulator_or_agency: "Official regulator or agency",
  standards_body_or_governance_framework: "Standards body or governance framework",
  secondary_tracker: "Secondary tracker or policy resource",
  informal_discovery_source: "Informal discovery source",
  media_discovery_source: "Media or specialist press discovery source",
};

const officialPublicationPolicy = {
  publicationAllowed: true,
  requiresOfficialSourceConfirmation: false,
  requiresCrossSourceVerification: false,
} as const;

const nonOfficialDiscoveryPolicy = {
  publicationAllowed: false,
  requiresOfficialSourceConfirmation: true,
  requiresCrossSourceVerification: true,
} as const;

export const sourceDiscoveryRegistry: SourceDiscoveryRegistryEntry[] = [
  {
    id: "official-new-york-courts-part-161-ai",
    name: "New York Courts Part 161 and AI court rules",
    regionFocus: "united-states",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
    sourceStatus: "runtime_blocked",
    notes:
      "Official New York State Unified Court System source for Part 161 governing use of artificial intelligence technology in court papers, including linked AO/75/2026 administrative-order material. Targeted parsing logic exists, but current runtime fetches return HTTP 403 and therefore require manual review or a different allowed access path.",
    examples: ["Part 161 court rule", "AO/75/2026", "AI use in court papers"],
  },
  {
    id: "official-eu-eur-lex",
    name: "EUR-Lex",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://eur-lex.europa.eu/",
    sourceStatus: "unstable_endpoint",
    notes:
      "Official EU legal database. The existing AI search source remains inactive until the parser is stable enough for recurring monitoring.",
    examples: ["EU AI Act text", "implementing acts", "delegated acts"],
  },
  {
    id: "official-eu-commission-ai",
    name: "European Commission artificial intelligence pages",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://commission.europa.eu/topics/artificial-intelligence_en",
    sourceStatus: "verified_active",
    notes:
      "Official European Commission AI hub for AI Act, policy, consultation, and implementation developments.",
  },
  {
    id: "official-eu-ai-office",
    name: "EU AI Office",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    sourceStatus: "verified_active",
    notes:
      "Official European AI Office page for implementation, GPAI supervision, and AI Act governance materials.",
  },
  {
    id: "official-eu-gpai-code",
    name: "General-Purpose AI Code of Practice",
    regionFocus: "europe",
    authorityTier: "standards_body_or_governance_framework",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "authoritative",
    publicationAllowed: true,
    requiresOfficialSourceConfirmation: false,
    requiresCrossSourceVerification: false,
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-code-practice",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Commission/Digital Strategy GPAI Code page. Add only after runtime accessibility and parser behavior are verified.",
  },
  {
    id: "official-eu-edpb-ai",
    name: "EDPB artificial intelligence documents",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
    sourceStatus: "verified_active",
    notes: "Official EDPB topic page for AI-related guidance, opinions, statements, and consultations.",
  },
  {
    id: "official-eu-edps-ai",
    name: "EDPS artificial intelligence subject page",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.edps.europa.eu/data-protection/our-work/subjects/artificial-intelligence_en?page=1",
    sourceStatus: "verified_active",
    notes: "Official EDPS subject page for AI opinions, guidance, and supervisory materials.",
  },
  {
    id: "official-eu-curia-infocuria",
    name: "CJEU / CURIA / InfoCuria",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://curia.europa.eu/",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official CJEU/CURIA entry point. Case monitoring needs a dedicated query strategy and should not infer case relevance without official records.",
  },
  {
    id: "official-europe-hudoc",
    name: "HUDOC / European Court of Human Rights",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://hudoc.echr.coe.int/",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official ECHR HUDOC database. Future case monitoring should use official records and avoid invented holdings or procedural posture.",
  },
  {
    id: "official-france-cnil-ai",
    name: "CNIL AI materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.cnil.fr/fr/rss.xml",
    sourceStatus: "verified_active",
    notes:
      "Official CNIL feed used as a stable monitoring fallback for French data protection and AI materials.",
  },
  {
    id: "official-france-legifrance-ai",
    name: "Legifrance AI legal texts",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.legifrance.gouv.fr/search/jorf",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official French legislative database for decrees, laws, CNIL deliberations published in the JORF, and related AI-governance legal texts. A dedicated parser is now in place, but runtime server access can still be blocked by a Cloudflare challenge.",
  },
  {
    id: "official-france-conseil-etat-ai",
    name: "Conseil d'Etat artificial intelligence materials",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.conseil-etat.fr/site/qui-sommes-nous/deontologie/charte-d-utilisation-de-l-intelligence-artificielle-au-sein-de-la-juridiction-administrative",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Conseil d'Etat AI-governance page used as a targeted monitoring anchor for institutional AI materials and linked jurisprudence references.",
  },
  {
    id: "official-france-cour-cassation-ai",
    name: "Cour de cassation artificial intelligence materials",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.courdecassation.fr/publications/lettre-de-la-cour/ndeg7-septembre-2025/la-modernisation-de-la-cour-se-poursuit-3-rapports-rendus-publics",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Cour de cassation AI-report publication page used as a targeted monitoring anchor for institutional AI materials and report links.",
  },
  {
    id: "official-france-defenseur-des-droits-ai",
    name: "Defender of Rights artificial intelligence materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.defenseurdesdroits.fr/intelligence-artificielle-la-defenseure-des-droits-appelle-garantir-le-droit-de-la-non-376",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Defender of Rights AI/non-discrimination page used as a targeted monitoring anchor for AI Act fundamental-rights posture and related rights-protection material.",
  },
  {
    id: "official-france-assemblee-ai",
    name: "Assemblee nationale AI materials",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.assemblee-nationale.fr/",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official parliamentary reports, information missions, and legislative dossiers relevant to AI policy and legal developments in France.",
  },
  {
    id: "official-france-senat-ai",
    name: "Senat AI materials",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.senat.fr/",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Senate reports, hearings, and parliamentary work relevant to AI, legal professions, public-sector use, and implementation debate in France.",
  },
  {
    id: "official-spain-aepd-ai",
    name: "AEPD AI and innovation materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.aepd.es/areas-de-actuacion/innovacion-y-tecnologia",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official Spanish data-protection authority source used as the primary Spain lightweight AI monitoring anchor for guidance, legal notes, and innovation material.",
  },
  {
    id: "official-spain-aesia-ai",
    name: "AESIA official materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.aesia.gob.es/en",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Spanish AI supervision agency source for governance and implementation monitoring.",
  },
  {
    id: "official-spain-boe-ai",
    name: "BOE AI legal texts",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.boe.es/eli/es/rd/2023/08/22/729",
    sourceStatus: "verified_active",
    notes:
      "Official BOE legal-text anchor used for Spanish AI-governance baseline instruments such as the AESIA statute and related implementation texts.",
  },
  {
    id: "official-spain-moncloa-ai",
    name: "La Moncloa AI governance materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.lamoncloa.gob.es/consejodeministros/referencias/Paginas/2026/20260526-referencia-rueda-de-prensa-ministros.aspx",
    sourceStatus: "verified_active",
    notes:
      "Official Spanish government source anchored to the current AI-governance draft-law milestone.",
  },
  {
    id: "official-germany-bfdi-ai",
    name: "BfDI AI unit materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.bfdi.bund.de/DE/BfDI/Inhalte/AufgabenReferate/Referat_28.html",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official German BfDI AI unit source used as the primary Germany lightweight monitoring anchor for AI oversight and data-protection posture.",
  },
  {
    id: "official-germany-bfdi-consultation",
    name: "BfDI AI-model consultation",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.bfdi.bund.de/DE/BfDI/Inhalte/Konsultationsverfahren/KI-pbD/KI-pbD-Einleitung.html",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official BfDI consultation source on personal data in AI models. Treat as official guidance and consultation material, not binding legislation.",
  },
  {
    id: "official-germany-bundesregierung-ai",
    name: "Federal Government AI Act implementation materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.bundesregierung.de/breg-de/bundesregierung/bundeskanzleramt/umsetzung-ki-verordnung-2406638",
    sourceStatus: "verified_active",
    notes:
      "Official Federal Government implementation source used for Germany's AI Act implementation baseline and authority-designation monitoring.",
  },
  {
    id: "official-germany-bundestag-ai",
    name: "Bundestag AI Act implementation materials",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.bundestag.de/presse/hib/kurzmeldungen-1155112",
    sourceStatus: "verified_active",
    notes:
      "Official Bundestag source used for Germany's AI Act implementation bill and parliamentary processing milestones.",
  },
  {
    id: "official-italy-garante-ai",
    name: "Garante AI topic and decisions",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.garanteprivacy.it/temi/intelligenza-artificiale",
    sourceStatus: "needs_dedicated_parser",
    notes:
      "Official Italian data-protection authority source used as the primary Italy lightweight AI monitoring anchor for guidance, press actions, and supervisory signals.",
  },
  {
    id: "official-italy-agid-ai",
    name: "AgID artificial intelligence materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.agid.gov.it/it/notizie/linee-guida-su-ia-nella-pa-al-la-consultazione-pubblica-su-sviluppo-e-procurement",
    sourceStatus: "verified_active",
    notes:
      "Official AgID source for Italy's public-administration AI guidance and implementation monitoring.",
  },
  {
    id: "official-italy-normattiva-ai",
    name: "Normattiva Italian AI legal texts",
    regionFocus: "europe",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.normattiva.it/eli/id/2025/09/25/25G00143/CONSOLIDATED",
    sourceStatus: "verified_active",
    notes:
      "Official Italian legal-text anchor used for Law No. 132 of 23 September 2025 and future targeted AI implementation review.",
  },
  {
    id: "official-italy-dtd-ai",
    name: "Digital Transformation Department AI materials",
    regionFocus: "europe",
    authorityTier: "official_regulator_or_agency",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://innovazione.gov.it/argomenti/intelligenza-artificiale/",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official Italian government strategy and implementation source for AI coordination, strategy, and related public-sector initiatives.",
  },
  {
    id: "official-us-federal-register",
    name: "Federal Register",
    regionFocus: "united-states",
    authorityTier: "official_primary",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.federalregister.gov/",
    sourceStatus: "verified_active",
    notes: "Official U.S. federal publication source and API for notices, rules, and agency materials.",
  },
  {
    id: "official-us-congress",
    name: "Congress.gov",
    regionFocus: "united-states",
    authorityTier: "official_court_or_legislative_database",
    monitoringRole: "candidate_for_monitoring",
    official: true,
    authorityLevel: "official",
    ...officialPublicationPolicy,
    url: "https://www.congress.gov/",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Official federal legislative database. Add only after query strategy and AI-law relevance filtering are verified.",
  },
  {
    id: "official-us-nist-ai-rmf",
    name: "NIST AI Risk Management Framework",
    regionFocus: "united-states",
    authorityTier: "standards_body_or_governance_framework",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "authoritative",
    publicationAllowed: true,
    requiresOfficialSourceConfirmation: false,
    requiresCrossSourceVerification: false,
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    sourceStatus: "verified_active",
    notes:
      "Official NIST framework page. Treat as soft law/governance framework unless incorporated by a binding legal source.",
  },
  {
    id: "standards-owasp-aima",
    name: "OWASP AI Maturity Assessment",
    regionFocus: "international",
    authorityTier: "standards_body_or_governance_framework",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "authoritative",
    publicationAllowed: true,
    requiresOfficialSourceConfirmation: false,
    requiresCrossSourceVerification: false,
    url: "https://owasp.org/www-project-ai-maturity-assessment/",
    sourceStatus: "verified_active",
    notes:
      "Official OWASP project page. Treat as best practice/governance framework, not binding law.",
  },
  {
    id: "standards-iso-iec-42001",
    name: "ISO/IEC 42001 official metadata",
    regionFocus: "international",
    authorityTier: "standards_body_or_governance_framework",
    monitoringRole: "active_monitoring",
    official: true,
    authorityLevel: "authoritative",
    publicationAllowed: true,
    requiresOfficialSourceConfirmation: false,
    requiresCrossSourceVerification: false,
    url: "https://www.iso.org/standard/81230.html",
    sourceStatus: "verified_active",
    notes:
      "Official ISO metadata only. Do not scrape or reproduce paywalled full standard text.",
  },
  {
    id: "secondary-ncsl-ai-legislation",
    name: "NCSL Artificial Intelligence Legislation Database",
    regionFocus: "united-states",
    authorityTier: "secondary_tracker",
    monitoringRole: "cross_check_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.ncsl.org/technology-and-communication/artificial-intelligence-2024-legislation",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Secondary state-legislation tracker. Use only to identify leads and verify with state legislatures or governors before publication.",
  },
  {
    id: "secondary-iapp-global-ai-tracker",
    name: "IAPP Global AI Law and Policy Tracker",
    regionFocus: "international",
    authorityTier: "secondary_tracker",
    monitoringRole: "cross_check_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://iapp.org/resources/article/global-ai-legislation-tracker/",
    sourceStatus: "needs_runtime_verification",
    notes:
      "Reputable privacy-policy tracker. Use only for discovery and cross-checking; official sources control.",
  },
  {
    id: "secondary-iapp-eu-ai-act-directory",
    name: "IAPP EU AI Act Regulatory Directory",
    regionFocus: "europe",
    authorityTier: "secondary_tracker",
    monitoringRole: "cross_check_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://iapp.org/",
    sourceStatus: "needs_runtime_verification",
    notes:
      "IAPP directory materials may help identify authority designations, but every designation must be verified with official national or EU sources.",
  },
  {
    id: "informal-ai-weekly-news-today",
    name: "AI Weekly / AI News Today",
    regionFocus: "international",
    authorityTier: "informal_discovery_source",
    monitoringRole: "discovery_only",
    official: false,
    authorityLevel: "non_official",
    ...nonOfficialDiscoveryPolicy,
    url: "https://aiweekly.co/ai-news-today",
    sourceStatus: "verified_active",
    notes:
      "Informal AI news dashboard used only as discovery radar. Leads remain private and non-publishable without official verification.",
  },
  {
    id: "informal-global-policy-watch-eu",
    name: "Global Policy Watch EU category",
    regionFocus: "europe",
    authorityTier: "informal_discovery_source",
    monitoringRole: "discovery_only",
    official: false,
    authorityLevel: "non_official",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.globalpolicywatch.com/category/european-union/",
    sourceStatus: "verified_active",
    notes:
      "Informal legal/regulatory publication category. Useful as a radar only; official EU or Member State sources must control.",
  },
  {
    id: "informal-global-policy-watch-ai",
    name: "Global Policy Watch AI category",
    regionFocus: "international",
    authorityTier: "informal_discovery_source",
    monitoringRole: "discovery_only",
    official: false,
    authorityLevel: "non_official",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.globalpolicywatch.com/category/artificial-intelligence/",
    sourceStatus: "verified_active",
    notes:
      "Informal AI policy/legal category. Useful as a radar only; official-source verification and corroboration remain mandatory.",
  },
  {
    id: "media-bloomberg-law",
    name: "Bloomberg Law",
    regionFocus: "united-states",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://news.bloomberglaw.com/",
    sourceStatus: "paywalled_or_restricted",
    notes:
      "Specialist legal press. Do not scrape paywalled content or reproduce article text; use public metadata/manual review only.",
  },
  {
    id: "media-law360",
    name: "Law360",
    regionFocus: "united-states",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.law360.com/",
    sourceStatus: "paywalled_or_restricted",
    notes:
      "Specialist legal press. Do not scrape paywalled content or reproduce article text; verify cases through court records.",
  },
  {
    id: "media-mlex",
    name: "MLex",
    regionFocus: "international",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://mlexmarketinsight.com/",
    sourceStatus: "paywalled_or_restricted",
    notes:
      "Specialist regulatory press. Use only as lead/corroboration; regulator or court records control.",
  },
  {
    id: "media-reuters-legal-tech",
    name: "Reuters Legal / Technology / Regulation",
    regionFocus: "international",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.reuters.com/",
    sourceStatus: "manual_reference_only",
    notes:
      "Reputable press source. Store only public metadata if used; verify legal developments through official sources before publication.",
  },
  {
    id: "media-politico-technology",
    name: "Politico technology and policy coverage",
    regionFocus: "international",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.politico.com/technology",
    sourceStatus: "manual_reference_only",
    notes:
      "Policy press discovery source. Use as an alert only; official government, regulator, legislative, or court sources control.",
  },
  {
    id: "media-euractiv-technology",
    name: "Euractiv Technology",
    regionFocus: "europe",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.euractiv.com/sections/digital/",
    sourceStatus: "manual_reference_only",
    notes:
      "Europe-focused policy press. Use for discovery/corroboration only; verify with EU or national official sources.",
  },
  {
    id: "media-tech-policy-press",
    name: "Tech Policy Press AI governance coverage",
    regionFocus: "international",
    authorityTier: "media_discovery_source",
    monitoringRole: "manual_review_only",
    official: false,
    authorityLevel: "secondary",
    ...nonOfficialDiscoveryPolicy,
    url: "https://www.techpolicy.press/",
    sourceStatus: "manual_reference_only",
    notes:
      "Policy analysis and media source. Useful for context and leads, not as legal authority.",
  },
];

export function getSourceRegistryByTier(tier: SourceAuthorityTier) {
  return sourceDiscoveryRegistry.filter((entry) => entry.authorityTier === tier);
}

export function getSourceRegistryByRegion(regionFocus: SourceRegionFocus) {
  return sourceDiscoveryRegistry.filter((entry) => entry.regionFocus === regionFocus);
}

export function getNonPublishableSourceRegistryEntries() {
  return sourceDiscoveryRegistry.filter((entry) => !entry.publicationAllowed);
}

export function getSourceRegistrySummary() {
  const byTier = Object.fromEntries(
    Object.keys(sourceAuthorityTierLabels).map((tier) => [
      tier,
      sourceDiscoveryRegistry.filter((entry) => entry.authorityTier === tier).length,
    ]),
  ) as Record<SourceAuthorityTier, number>;

  return {
    total: sourceDiscoveryRegistry.length,
    officialOrAuthoritative: sourceDiscoveryRegistry.filter((entry) => entry.official).length,
    nonPublishableDiscovery: getNonPublishableSourceRegistryEntries().length,
    byTier,
  };
}
