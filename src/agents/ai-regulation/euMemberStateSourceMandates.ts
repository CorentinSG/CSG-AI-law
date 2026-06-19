export interface AgentSourceMandate {
  legalNewsSources: ReadonlyArray<{
    id: string;
    label: string;
    sourceType: "legal_press" | "regulatory_press" | "business_press" | "wire_or_policy_press";
    scope: "pan_european_filtered_by_country" | "country_specific";
    use: "legal_news_monitoring";
    activationRule: "filter_by_country_and_ai_law_terms";
  }>;
  officialDatabaseSources: ReadonlyArray<{
    id: string;
    label: string;
    sourceType:
      | "data_protection_authority"
      | "official_journal"
      | "parliament"
      | "government_digital_policy"
      | "court_or_case_law";
    use: "legal_database_monitoring";
    coverage: ReadonlyArray<"hard_law" | "soft_law" | "case_law_and_decisions">;
    activationRule: "verify_official_endpoint_before_active_scan";
  }>;
}

const sharedEuropeanLegalNewsSources = [
  {
    id: "news-iapp-ai-law",
    label: "IAPP AI, privacy, and data-protection legal news",
    sourceType: "legal_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
  },
  {
    id: "news-euractiv-tech-ai",
    label: "Euractiv Technology and AI regulation coverage",
    sourceType: "regulatory_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
  },
  {
    id: "news-politico-tech-ai",
    label: "POLITICO technology and AI policy coverage",
    sourceType: "wire_or_policy_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
  },
  {
    id: "news-mlex-ai",
    label: "MLex AI, competition, privacy, and digital regulation coverage",
    sourceType: "legal_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
  },
] as const;

const memberStateRows = [
  ["austria", "Austria", "Austrian Data Protection Authority"],
  ["belgium", "Belgium", "Belgian Data Protection Authority"],
  ["bulgaria", "Bulgaria", "Commission for Personal Data Protection"],
  ["croatia", "Croatia", "Croatian Personal Data Protection Agency"],
  ["cyprus", "Cyprus", "Office of the Commissioner for Personal Data Protection"],
  ["czechia", "Czechia", "Office for Personal Data Protection"],
  ["denmark", "Denmark", "Danish Data Protection Agency"],
  ["estonia", "Estonia", "Estonian Data Protection Inspectorate"],
  ["finland", "Finland", "Office of the Data Protection Ombudsman"],
  ["france", "France", "CNIL"],
  ["germany", "Germany", "Federal Commissioner for Data Protection and Freedom of Information"],
  ["greece", "Greece", "Hellenic Data Protection Authority"],
  ["hungary", "Hungary", "National Authority for Data Protection and Freedom of Information"],
  ["ireland", "Ireland", "Data Protection Commission"],
  ["italy", "Italy", "Garante per la protezione dei dati personali"],
  ["latvia", "Latvia", "Data State Inspectorate"],
  ["lithuania", "Lithuania", "State Data Protection Inspectorate"],
  ["luxembourg", "Luxembourg", "National Commission for Data Protection"],
  ["malta", "Malta", "Information and Data Protection Commissioner"],
  ["netherlands", "Netherlands", "Dutch Data Protection Authority"],
  ["poland", "Poland", "Personal Data Protection Office"],
  ["portugal", "Portugal", "National Data Protection Commission"],
  ["romania", "Romania", "National Supervisory Authority for Personal Data Processing"],
  ["slovakia", "Slovakia", "Office for Personal Data Protection of the Slovak Republic"],
  ["slovenia", "Slovenia", "Information Commissioner"],
  ["spain", "Spain", "Spanish Data Protection Agency"],
  ["sweden", "Sweden", "Swedish Authority for Privacy Protection"],
] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildCountrySpecificNewsSource(country: string) {
  const slug = slugify(country);
  return {
    id: `news-${slug}-legal-press-ai`,
    label: `${country} legal, technology, and business press filtered for AI law`,
    sourceType: "business_press" as const,
    scope: "country_specific" as const,
    use: "legal_news_monitoring" as const,
    activationRule: "filter_by_country_and_ai_law_terms" as const,
  };
}

function buildOfficialDatabaseSources(country: string, authority: string) {
  const slug = slugify(country);
  return [
    {
      id: `official-${slug}-dpa-ai`,
      label: `${authority} official AI, privacy, data, and digital guidance`,
      sourceType: "data_protection_authority",
      use: "legal_database_monitoring",
      coverage: ["soft_law", "case_law_and_decisions"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-${slug}-journal-ai`,
      label: `${country} official journal / legal gazette for AI, data, cloud, and digital law`,
      sourceType: "official_journal",
      use: "legal_database_monitoring",
      coverage: ["hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-${slug}-parliament-ai`,
      label: `${country} parliament / legislative tracker for AI, data, cloud, and digital bills`,
      sourceType: "parliament",
      use: "legal_database_monitoring",
      coverage: ["hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-${slug}-government-digital-ai`,
      label: `${country} government digital-policy sources for AI, data, and cloud regulation`,
      sourceType: "government_digital_policy",
      use: "legal_database_monitoring",
      coverage: ["soft_law", "hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
    {
      id: `official-${slug}-courts-ai`,
      label: `${country} court and case-law sources for AI-related decisions`,
      sourceType: "court_or_case_law",
      use: "legal_database_monitoring",
      coverage: ["case_law_and_decisions"],
      activationRule: "verify_official_endpoint_before_active_scan",
    },
  ] as const;
}

type MemberStateSourceMandateSlug = (typeof memberStateRows)[number][0];

export const euMemberStateSourceMandates = memberStateRows.reduce(
  (accumulator, [slug, country, authority]) => {
    accumulator[slug] = {
      legalNewsSources: [
        ...sharedEuropeanLegalNewsSources,
        buildCountrySpecificNewsSource(country),
      ],
      officialDatabaseSources: buildOfficialDatabaseSources(country, authority),
    };
    return accumulator;
  },
  {} as Record<MemberStateSourceMandateSlug, AgentSourceMandate>,
);

export type EuMemberStateSourceMandateSlug = keyof typeof euMemberStateSourceMandates;

export function getEuMemberStateSourceMandate(slug: EuMemberStateSourceMandateSlug) {
  return euMemberStateSourceMandates[slug];
}
