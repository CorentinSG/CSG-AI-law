export interface UsAgentSourceMandate {
  legalNewsSources: ReadonlyArray<{
    id: string;
    label: string;
    sourceType:
      | "legal_press"
      | "privacy_security_press"
      | "technology_policy_press"
      | "business_press"
      | "state_local_press";
    scope: "national_filtered_by_jurisdiction" | "jurisdiction_specific";
    use: "legal_news_monitoring";
    activationRule: "filter_by_jurisdiction_and_ai_law_terms";
  }>;
  officialDatabaseSources: ReadonlyArray<{
    id: string;
    label: string;
    sourceType:
      | "federal_register"
      | "federal_agency"
      | "state_legislature"
      | "state_code_or_register"
      | "state_agency"
      | "court_or_case_law";
    use: "legal_database_monitoring";
    coverage: ReadonlyArray<"hard_law" | "soft_law" | "case_law_and_decisions">;
    activationRule: "verify_official_endpoint_before_active_scan";
  }>;
}

const sharedUsLegalNewsSources = [
  {
    id: "news-iapp-us-ai-law",
    label: "IAPP US AI, privacy, and data-protection legal news",
    sourceType: "legal_press",
    scope: "national_filtered_by_jurisdiction",
    use: "legal_news_monitoring",
    activationRule: "filter_by_jurisdiction_and_ai_law_terms",
  },
  {
    id: "news-law360-ai",
    label: "Law360 AI, privacy, technology, and litigation coverage",
    sourceType: "legal_press",
    scope: "national_filtered_by_jurisdiction",
    use: "legal_news_monitoring",
    activationRule: "filter_by_jurisdiction_and_ai_law_terms",
  },
  {
    id: "news-bloomberg-law-ai",
    label: "Bloomberg Law AI, privacy, labor, litigation, and technology-law coverage",
    sourceType: "legal_press",
    scope: "national_filtered_by_jurisdiction",
    use: "legal_news_monitoring",
    activationRule: "filter_by_jurisdiction_and_ai_law_terms",
  },
  {
    id: "news-mllex-us-ai",
    label: "MLex US AI, competition, privacy, and digital regulation coverage",
    sourceType: "legal_press",
    scope: "national_filtered_by_jurisdiction",
    use: "legal_news_monitoring",
    activationRule: "filter_by_jurisdiction_and_ai_law_terms",
  },
  {
    id: "news-cyberscoop-ai",
    label: "CyberScoop AI, cyber, privacy, and government technology coverage",
    sourceType: "privacy_security_press",
    scope: "national_filtered_by_jurisdiction",
    use: "legal_news_monitoring",
    activationRule: "filter_by_jurisdiction_and_ai_law_terms",
  },
] as const;

const federalNewsSources = [
  ...sharedUsLegalNewsSources,
  {
    id: "news-federal-ai-policy-press",
    label: "US federal AI policy and legal press filtered for federal agencies, Congress, and courts",
    sourceType: "technology_policy_press",
    scope: "jurisdiction_specific",
    use: "legal_news_monitoring",
    activationRule: "filter_by_jurisdiction_and_ai_law_terms",
  },
] as const;

const federalOfficialSources = [
  {
    id: "official-us-federal-register-ai",
    label: "Federal Register for AI, data, cloud, privacy, procurement, and digital rules",
    sourceType: "federal_register",
    use: "legal_database_monitoring",
    coverage: ["hard_law", "soft_law"],
    activationRule: "verify_official_endpoint_before_active_scan",
  },
  {
    id: "official-us-congress-ai",
    label: "Congress.gov and federal legislative trackers for AI, data, cloud, and digital bills",
    sourceType: "federal_agency",
    use: "legal_database_monitoring",
    coverage: ["hard_law"],
    activationRule: "verify_official_endpoint_before_active_scan",
  },
  {
    id: "official-us-ftc-ai",
    label: "Federal Trade Commission AI enforcement and guidance",
    sourceType: "federal_agency",
    use: "legal_database_monitoring",
    coverage: ["soft_law", "case_law_and_decisions"],
    activationRule: "verify_official_endpoint_before_active_scan",
  },
  {
    id: "official-us-nist-ai",
    label: "NIST AI Risk Management Framework and technical guidance",
    sourceType: "federal_agency",
    use: "legal_database_monitoring",
    coverage: ["soft_law"],
    activationRule: "verify_official_endpoint_before_active_scan",
  },
  {
    id: "official-us-federal-courts-ai",
    label: "Federal courts and case-law sources for AI-related decisions",
    sourceType: "court_or_case_law",
    use: "legal_database_monitoring",
    coverage: ["case_law_and_decisions"],
    activationRule: "verify_official_endpoint_before_active_scan",
  },
] as const;

const stateRows = [
  ["us-al", "Alabama", "AL"],
  ["us-ak", "Alaska", "AK"],
  ["us-az", "Arizona", "AZ"],
  ["us-ar", "Arkansas", "AR"],
  ["us-ca", "California", "CA"],
  ["us-co", "Colorado", "CO"],
  ["us-ct", "Connecticut", "CT"],
  ["us-de", "Delaware", "DE"],
  ["us-fl", "Florida", "FL"],
  ["us-ga", "Georgia", "GA"],
  ["us-hi", "Hawaii", "HI"],
  ["us-id", "Idaho", "ID"],
  ["us-il", "Illinois", "IL"],
  ["us-in", "Indiana", "IN"],
  ["us-ia", "Iowa", "IA"],
  ["us-ks", "Kansas", "KS"],
  ["us-ky", "Kentucky", "KY"],
  ["us-la", "Louisiana", "LA"],
  ["us-me", "Maine", "ME"],
  ["us-md", "Maryland", "MD"],
  ["us-ma", "Massachusetts", "MA"],
  ["us-mi", "Michigan", "MI"],
  ["us-mn", "Minnesota", "MN"],
  ["us-ms", "Mississippi", "MS"],
  ["us-mo", "Missouri", "MO"],
  ["us-mt", "Montana", "MT"],
  ["us-ne", "Nebraska", "NE"],
  ["us-nv", "Nevada", "NV"],
  ["us-nh", "New Hampshire", "NH"],
  ["us-nj", "New Jersey", "NJ"],
  ["us-nm", "New Mexico", "NM"],
  ["us-ny", "New York", "NY"],
  ["us-nc", "North Carolina", "NC"],
  ["us-nd", "North Dakota", "ND"],
  ["us-oh", "Ohio", "OH"],
  ["us-ok", "Oklahoma", "OK"],
  ["us-or", "Oregon", "OR"],
  ["us-pa", "Pennsylvania", "PA"],
  ["us-ri", "Rhode Island", "RI"],
  ["us-sc", "South Carolina", "SC"],
  ["us-sd", "South Dakota", "SD"],
  ["us-tn", "Tennessee", "TN"],
  ["us-tx", "Texas", "TX"],
  ["us-ut", "Utah", "UT"],
  ["us-vt", "Vermont", "VT"],
  ["us-va", "Virginia", "VA"],
  ["us-wa", "Washington", "WA"],
  ["us-wv", "West Virginia", "WV"],
  ["us-wi", "Wisconsin", "WI"],
  ["us-wy", "Wyoming", "WY"],
  ["us-dc", "District of Columbia", "DC"],
] as const;

function buildJurisdictionSpecificNewsSource(jurisdiction: string, postalCode: string) {
  return {
    id: `news-us-${postalCode.toLowerCase()}-legal-press-ai`,
    label: `${jurisdiction} legal, technology, business, and local government press filtered for AI law`,
    sourceType: "state_local_press" as const,
    scope: "jurisdiction_specific" as const,
    use: "legal_news_monitoring" as const,
    activationRule: "filter_by_jurisdiction_and_ai_law_terms" as const,
  };
}

function buildStateOfficialSources(jurisdiction: string, postalCode: string) {
  const code = postalCode.toLowerCase();
  return [
    {
      id: `official-us-${code}-legislature-ai`,
      label: `${jurisdiction} legislature and bill tracker for AI, data, cloud, and digital law`,
      sourceType: "state_legislature",
      use: "legal_database_monitoring",
      coverage: ["hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-us-${code}-code-register-ai`,
      label: `${jurisdiction} code, register, administrative rules, or official gazette`,
      sourceType: "state_code_or_register",
      use: "legal_database_monitoring",
      coverage: ["hard_law", "soft_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-us-${code}-ag-ai`,
      label: `${jurisdiction} attorney general / consumer protection authority for AI and data enforcement`,
      sourceType: "state_agency",
      use: "legal_database_monitoring",
      coverage: ["soft_law", "case_law_and_decisions"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-us-${code}-digital-ai`,
      label: `${jurisdiction} government digital-policy, procurement, labor, education, and privacy sources`,
      sourceType: "state_agency",
      use: "legal_database_monitoring",
      coverage: ["soft_law", "hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-us-${code}-courts-ai`,
      label: `${jurisdiction} courts and case-law sources for AI-related decisions`,
      sourceType: "court_or_case_law",
      use: "legal_database_monitoring",
      coverage: ["case_law_and_decisions"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
  ] as const;
}

type UsJurisdictionSourceMandateId = "us-federal" | (typeof stateRows)[number][0];

const sourceMandates = stateRows.reduce(
  (accumulator, [id, jurisdiction, postalCode]) => {
    accumulator[id] = {
      legalNewsSources: [
        ...sharedUsLegalNewsSources,
        buildJurisdictionSpecificNewsSource(jurisdiction, postalCode),
      ],
      officialDatabaseSources: buildStateOfficialSources(jurisdiction, postalCode),
    };
    return accumulator;
  },
  {
    "us-federal": {
      legalNewsSources: federalNewsSources,
      officialDatabaseSources: federalOfficialSources,
    },
  } as Partial<Record<UsJurisdictionSourceMandateId, UsAgentSourceMandate>>,
);

export const usJurisdictionSourceMandates =
  sourceMandates as Record<UsJurisdictionSourceMandateId, UsAgentSourceMandate>;

export type UsJurisdictionSourceMandateKey = keyof typeof usJurisdictionSourceMandates;

export function getUsJurisdictionSourceMandate(id: UsJurisdictionSourceMandateKey) {
  return usJurisdictionSourceMandates[id];
}
