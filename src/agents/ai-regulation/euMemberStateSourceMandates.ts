import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

/**
 * Whether a mandate entry corresponds to a real, seeded, scanned source.
 *
 * The field is required so a mandate can never be read as real monitoring
 * coverage by default. It is never hand-flipped: an entry that names
 * `seedSourceIds` gets its provisioning *derived* from the live seed through
 * `deriveProvisioning`, so claiming coverage without naming the actual seeded
 * source is impossible, and a source later removed from the seed demotes its
 * mandate entry automatically instead of leaving a stale claim behind.
 */
export type MandateSourceProvisioning = "aspirational_not_wired" | "seeded_and_scanned";

const ACTIVE_SEED_SOURCE_IDS = new Set(
  regulationSourcesSeed.filter((source) => source.active).map((source) => source.id),
);

/**
 * Candidate ids may include names that do not exist (e.g. the generic
 * `src-{code}-dpa-ai` shell alongside a hand-authored alias): only an id that
 * is actually present and active in the seed counts. "Seeded and scanned" is a
 * wiring statement, not a quality one — a gated source is still scanned; its
 * publication review status is a different axis (`requiresSourceReview`).
 */
export function deriveProvisioning(
  seedSourceIds: readonly string[] | undefined,
): MandateSourceProvisioning {
  return seedSourceIds?.some((id) => ACTIVE_SEED_SOURCE_IDS.has(id))
    ? "seeded_and_scanned"
    : "aspirational_not_wired";
}

export interface AgentSourceMandate {
  legalNewsSources: ReadonlyArray<{
    id: string;
    label: string;
    sourceType: "legal_press" | "regulatory_press" | "business_press" | "wire_or_policy_press";
    scope: "pan_european_filtered_by_country" | "country_specific";
    use: "legal_news_monitoring";
    activationRule: "filter_by_country_and_ai_law_terms";
    provisioning: MandateSourceProvisioning;
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
    provisioning: MandateSourceProvisioning;
    /** The seeded source ids this mandate line is fulfilled by, when wired. */
    seedSourceIds?: readonly string[];
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
    provisioning: "aspirational_not_wired",
  },
  {
    id: "news-euractiv-tech-ai",
    label: "Euractiv Technology and AI regulation coverage",
    sourceType: "regulatory_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
    provisioning: "aspirational_not_wired",
  },
  {
    id: "news-politico-tech-ai",
    label: "POLITICO technology and AI policy coverage",
    sourceType: "wire_or_policy_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
    provisioning: "aspirational_not_wired",
  },
  {
    id: "news-mlex-ai",
    label: "MLex AI, competition, privacy, and digital regulation coverage",
    sourceType: "legal_press",
    scope: "pan_european_filtered_by_country",
    use: "legal_news_monitoring",
    activationRule: "filter_by_country_and_ai_law_terms",
    provisioning: "aspirational_not_wired",
  },
] as const;

const memberStateRows = [
  ["austria", "Austria", "Austrian Data Protection Authority", "at"],
  ["belgium", "Belgium", "Belgian Data Protection Authority", "be"],
  ["bulgaria", "Bulgaria", "Commission for Personal Data Protection", "bg"],
  ["croatia", "Croatia", "Croatian Personal Data Protection Agency", "hr"],
  ["cyprus", "Cyprus", "Office of the Commissioner for Personal Data Protection", "cy"],
  ["czechia", "Czechia", "Office for Personal Data Protection", "cz"],
  ["denmark", "Denmark", "Danish Data Protection Agency", "dk"],
  ["estonia", "Estonia", "Estonian Data Protection Inspectorate", "ee"],
  ["finland", "Finland", "Office of the Data Protection Ombudsman", "fi"],
  ["france", "France", "CNIL", "fr"],
  ["germany", "Germany", "Federal Commissioner for Data Protection and Freedom of Information", "de"],
  ["greece", "Greece", "Hellenic Data Protection Authority", "gr"],
  ["hungary", "Hungary", "National Authority for Data Protection and Freedom of Information", "hu"],
  ["ireland", "Ireland", "Data Protection Commission", "ie"],
  ["italy", "Italy", "Garante per la protezione dei dati personali", "it"],
  ["latvia", "Latvia", "Data State Inspectorate", "lv"],
  ["lithuania", "Lithuania", "State Data Protection Inspectorate", "lt"],
  ["luxembourg", "Luxembourg", "National Commission for Data Protection", "lu"],
  ["malta", "Malta", "Information and Data Protection Commissioner", "mt"],
  ["netherlands", "Netherlands", "Dutch Data Protection Authority", "nl"],
  ["poland", "Poland", "Personal Data Protection Office", "pl"],
  ["portugal", "Portugal", "National Data Protection Commission", "pt"],
  ["romania", "Romania", "National Supervisory Authority for Personal Data Processing", "ro"],
  ["slovakia", "Slovakia", "Office for Personal Data Protection of the Slovak Republic", "sk"],
  ["slovenia", "Slovenia", "Information Commissioner", "si"],
  ["spain", "Spain", "Spanish Data Protection Agency", "es"],
  ["sweden", "Sweden", "Swedish Authority for Privacy Protection", "se"],
] as const;

// Hand-authored DPA lanes whose ids do not follow the generated
// `src-{code}-dpa-ai` convention. Listing a candidate that does not exist is
// harmless — deriveProvisioning only counts ids actually present in the seed.
const DPA_SEED_ALIASES: Record<string, string> = {
  at: "src-at-dsb-ai",
  be: "src-be-apd-ai",
  fr: "src-cnil-ai",
  de: "src-de-bfdi-ai",
  es: "src-es-aepd-ai",
  ie: "src-ie-dpc-ai",
  it: "src-it-garante-ai",
  nl: "src-nl-ap-ai",
  se: "src-se-imy-ai",
};

// Gazette-class seeds, mapped only where the seeded source genuinely is the
// official journal or primary legislation database — RIS, BOE, Legifrance,
// likumi.lv. Everything else stays aspirational rather than stretching a
// ministry topic page into a "gazette".
const JOURNAL_SEED_IDS: Record<string, readonly string[]> = {
  at: ["src-at-ris-ai-law"],
  es: ["src-es-boe-ai"],
  fr: ["src-fr-legifrance-ai"],
  lv: ["src-lv-government-ai"],
};

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
    provisioning: "aspirational_not_wired" as const,
  };
}

function buildOfficialDatabaseSources(country: string, authority: string, code: string) {
  const slug = slugify(country);
  const dpaSeedIds = [`src-${code}-dpa-ai`, DPA_SEED_ALIASES[code]].filter(
    (id): id is string => Boolean(id),
  );
  const journalSeedIds = JOURNAL_SEED_IDS[code] ?? [];
  // likumi.lv is Latvia's legislation database and already fulfils the journal
  // line; claiming it a second time as digital policy would double-count one
  // seed across two mandate lines.
  const governmentSeedIds =
    code === "lv" ? [] : [`src-${code}-government-ai`];
  return [
    {
      id: `official-${slug}-dpa-ai`,
      label: `${authority} official AI, privacy, data, and digital guidance`,
      sourceType: "data_protection_authority",
      use: "legal_database_monitoring",
      coverage: ["soft_law", "case_law_and_decisions"],
      activationRule: "verify_official_endpoint_before_active_scan",
      provisioning: deriveProvisioning(dpaSeedIds),
      seedSourceIds: dpaSeedIds,
    },
    {
      id: `official-${slug}-journal-ai`,
      label: `${country} official journal / legal gazette for AI, data, cloud, and digital law`,
      sourceType: "official_journal",
      use: "legal_database_monitoring",
      coverage: ["hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
      provisioning: deriveProvisioning(journalSeedIds),
      seedSourceIds: journalSeedIds,
    },
    {
      id: `official-${slug}-parliament-ai`,
      label: `${country} parliament / legislative tracker for AI, data, cloud, and digital bills`,
      sourceType: "parliament",
      use: "legal_database_monitoring",
      coverage: ["hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
      provisioning: "aspirational_not_wired",
    },
    {
      id: `official-${slug}-government-digital-ai`,
      label: `${country} government digital-policy sources for AI, data, and cloud regulation`,
      sourceType: "government_digital_policy",
      use: "legal_database_monitoring",
      coverage: ["soft_law", "hard_law"],
      activationRule: "verify_official_endpoint_before_active_scan",
      provisioning: deriveProvisioning(governmentSeedIds),
      seedSourceIds: governmentSeedIds,
    },
    {
      id: `official-${slug}-courts-ai`,
      label: `${country} court and case-law sources for AI-related decisions`,
      sourceType: "court_or_case_law",
      use: "legal_database_monitoring",
      coverage: ["case_law_and_decisions"],
      activationRule: "verify_official_endpoint_before_active_scan",
      provisioning: "aspirational_not_wired",
    },
  ] as const;
}

type MemberStateSourceMandateSlug = (typeof memberStateRows)[number][0];

export const euMemberStateSourceMandates = memberStateRows.reduce(
  (accumulator, [slug, country, authority, code]) => {
    accumulator[slug] = {
      legalNewsSources: [
        ...sharedEuropeanLegalNewsSources,
        buildCountrySpecificNewsSource(country),
      ],
      officialDatabaseSources: buildOfficialDatabaseSources(country, authority, code),
    };
    return accumulator;
  },
  {} as Record<MemberStateSourceMandateSlug, AgentSourceMandate>,
);

export type EuMemberStateSourceMandateSlug = keyof typeof euMemberStateSourceMandates;

export function getEuMemberStateSourceMandate(slug: EuMemberStateSourceMandateSlug) {
  return euMemberStateSourceMandates[slug];
}
