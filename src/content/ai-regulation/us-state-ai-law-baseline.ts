import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";
import { slugify } from "@/lib/utils";

export type UsStateAiLawStatus =
  | "enacted_comprehensive_ai_law"
  | "enacted_sector_specific_ai_law"
  | "pending_ai_legislation"
  | "agency_guidance_or_enforcement"
  | "ai_related_privacy_or_automated_decision_rules"
  | "no_specific_ai_law_verified"
  | "needs_review";

export type UsStateConfidence = "high" | "medium" | "low" | "needs_review";

export interface UsStateStatusTaxonomyEntry {
  label: string;
  description: string;
  mapTone: "success" | "info" | "warning" | "neutral";
  confidenceRequirements: string;
  sourceRequirements: string;
}

export interface UsStateOfficialSource {
  label: string;
  institution: string;
  url: string;
  sourceType:
    | "legislature"
    | "state_code"
    | "governor"
    | "attorney_general"
    | "privacy_agency"
    | "labor_civil_rights_agency"
    | "court"
    | "regulator";
  official: boolean;
  public: boolean;
  runtimeAccessible: boolean | null;
  responseStatus: number | null;
  lastCheckedAt: string;
  parserStatus: "manual_reference" | "needs_dedicated_parser" | "ready";
  recommendation: "active" | "inactive" | "manual_review";
  note: string;
}

export interface UsStateAiLawProfile {
  stateCode: string;
  stateName: string;
  slug: string;
  region: "United States";
  aiLawStatus: UsStateAiLawStatus;
  aiLawStatusLabel: string;
  aiLawStatusDescription: string;
  confidenceLevel: UsStateConfidence;
  enactedAIStatutes: string[];
  pendingAIBills: string[];
  failedAIBills: string[];
  stateGovernmentUseRules: string[];
  privateSectorRules: string[];
  employmentAIRules: string[];
  biometricRules: string[];
  deepfakeSyntheticMediaRules: string[];
  consumerProtectionAIActivity: string[];
  privacyAutomatedDecisionMakingRules: string[];
  stateAGActivity: string[];
  statePrivacyAgencyActivity: string[];
  laborCivilRightsAgencyActivity: string[];
  officialLegislatureUrl: string | null;
  officialBillSearchUrl: string | null;
  governorSourceUrls: string[];
  stateAGSourceUrls: string[];
  courtSourceUrls: string[];
  officialSourceUrls: string[];
  discoverySources: string[];
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

export const usStateAiLawStatusTaxonomy: Record<
  UsStateAiLawStatus,
  UsStateStatusTaxonomyEntry
> = {
  enacted_comprehensive_ai_law: {
    label: "Enacted comprehensive AI law",
    description:
      "An official state source verifies an enacted AI law with broad cross-sector AI governance scope.",
    mapTone: "success",
    confidenceRequirements: "High confidence only with official statute/bill source.",
    sourceRequirements: "Official state statute, enacted bill, or governor signing source.",
  },
  enacted_sector_specific_ai_law: {
    label: "Enacted sector-specific AI law",
    description:
      "An official state source verifies an enacted AI law limited to a sector or issue area.",
    mapTone: "success",
    confidenceRequirements: "High or medium with official statute/bill source.",
    sourceRequirements: "Official state statute, enacted bill, or agency source.",
  },
  pending_ai_legislation: {
    label: "Pending AI legislation",
    description:
      "An official state legislature source verifies pending AI legislation.",
    mapTone: "info",
    confidenceRequirements: "Official bill page with current status.",
    sourceRequirements: "Official state bill page or legislative database.",
  },
  agency_guidance_or_enforcement: {
    label: "Agency, court, or enforcement activity",
    description:
      "A state agency, attorney general, court system, privacy agency, labor agency, or regulator has official AI-related activity.",
    mapTone: "info",
    confidenceRequirements: "Official state agency, court, or regulator source.",
    sourceRequirements: "Official agency page, court rule page, enforcement release, guidance, or rulemaking page.",
  },
  ai_related_privacy_or_automated_decision_rules: {
    label: "AI-related privacy / automated decision rules",
    description:
      "An official source verifies privacy, automated decision-making, profiling, biometric, or similar rules materially relevant to AI governance.",
    mapTone: "info",
    confidenceRequirements:
      "Official privacy agency, statute, rulemaking, or regulator source.",
    sourceRequirements:
      "Official state privacy, automated decision-making, biometric, or regulator source.",
  },
  no_specific_ai_law_verified: {
    label: "No specific AI law verified",
    description:
      "An official state source has been identified, but no specific AI law or AI bill is verified in this baseline.",
    mapTone: "warning",
    confidenceRequirements: "At least one official state source verified.",
    sourceRequirements: "Official state source plus no verified AI-specific legal item yet.",
  },
  needs_review: {
    label: "Needs review",
    description:
      "No official state AI-law source has been verified deeply enough for a stronger label.",
    mapTone: "warning",
    confidenceRequirements: "Insufficient verified evidence for stronger status.",
    sourceRequirements: "Needs official state-source pass.",
  },
};

const verifiedAt = "2026-05-27T00:00:00.000Z";

function stateReference(source: UsStateOfficialSource): SourceReference {
  return {
    sourceRole: "primary",
    title: source.label,
    institution: source.institution,
    url: source.url,
    canonicalUrl: source.url,
    sourceType: source.sourceType === "court" ? "court" : "official",
    authorityType: source.sourceType.replaceAll("_", " "),
    publicationDate: null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: source.runtimeAccessible ? source.lastCheckedAt : null,
    jurisdiction: "United States state",
    documentType: source.sourceType,
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: source.runtimeAccessible ? "high" : "medium",
    verificationStatus: source.runtimeAccessible ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      source.runtimeAccessible === false
        ? `Runtime response status was ${source.responseStatus ?? "unavailable"}.`
        : null,
    notes: source.note,
  };
}

function source(input: Omit<UsStateOfficialSource, "lastCheckedAt" | "official" | "public">) {
  return {
    ...input,
    official: true,
    public: true,
    lastCheckedAt: verifiedAt,
  } satisfies UsStateOfficialSource;
}

const prioritySources: Record<string, UsStateOfficialSource[]> = {
  CA: [
    source({
      label: "CPPA CCPA rulemaking updates",
      institution: "California Privacy Protection Agency",
      url: "https://cppa.ca.gov/regulations/ccpa_updates.html",
      sourceType: "privacy_agency",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "ready",
      recommendation: "active",
      note:
        "Official California privacy agency rulemaking page; runtime verification returned 200.",
    }),
  ],
  CO: [
    source({
      label: "Colorado SB24-205 bill page",
      institution: "Colorado General Assembly",
      url: "https://leg.colorado.gov/bills/sb24-205",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official Colorado legislature bill page verified as reachable. Baseline flags it for source verification before detailed statutory claims.",
    }),
  ],
  NY: [
    source({
      label: "NYDFS innovation and guidance page",
      institution: "New York Department of Financial Services",
      url: "https://www.dfs.ny.gov/industry_guidance/innovation",
      sourceType: "regulator",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "ready",
      recommendation: "active",
      note:
        "Official NYDFS page verified as reachable and already used for state-level monitoring.",
    }),
    source({
      label: "New York Attorney General guidance page",
      institution: "New York Attorney General",
      url: "https://ag.ny.gov/guidance",
      sourceType: "attorney_general",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "ready",
      recommendation: "active",
      note:
        "Official New York Attorney General guidance hub verified as reachable; deterministic AI filtering remains required.",
    }),
    source({
      label: "New York Courts Part 161 AI rule page",
      institution: "New York State Unified Court System",
      url: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
      sourceType: "court",
      runtimeAccessible: false,
      responseStatus: 403,
      parserStatus: "ready",
      recommendation: "manual_review",
      note:
        "Official New York Courts Part 161 page governing use of artificial intelligence technology in court papers, with historical note linking AO/75/2026 and effective date June 1, 2026. The parser logic is ready, but the site returned HTTP 403 from the current runtime and therefore still requires manual review or an allowed access path.",
    }),
  ],
  IL: [
    source({
      label: "Illinois General Assembly official site",
      institution: "Illinois General Assembly",
      url: "https://www.ilga.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official state legislature site verified as reachable; specific AI bills or statutes require item-level review.",
    }),
  ],
  TX: [
    source({
      label: "Texas Legislature Online",
      institution: "Texas Legislature",
      url: "https://capitol.texas.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Texas legislative source verified as reachable; specific AI bills or statutes require item-level review.",
    }),
  ],
  CT: [
    source({
      label: "Connecticut General Assembly",
      institution: "Connecticut General Assembly",
      url: "https://www.cga.ct.gov/",
      sourceType: "legislature",
      runtimeAccessible: false,
      responseStatus: null,
      parserStatus: "needs_dedicated_parser",
      recommendation: "inactive",
      note:
        "Official legislature URL failed from runtime verification. Keep inactive until access is reliable.",
    }),
  ],
  UT: [
    source({
      label: "Utah Legislature",
      institution: "Utah State Legislature",
      url: "https://le.utah.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Utah legislature source verified as reachable; specific AI bills or statutes require item-level review.",
    }),
  ],
  VA: [
    source({
      label: "Virginia Legislative Information System",
      institution: "Virginia General Assembly",
      url: "https://lis.virginia.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Virginia legislative information system verified as reachable; specific AI bills or statutes require item-level review.",
    }),
  ],
  WA: [
    source({
      label: "Washington bill information",
      institution: "Washington State Legislature",
      url: "https://app.leg.wa.gov/billinfo/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Washington bill information source verified as reachable after redirect; specific AI bills require item-level review.",
    }),
  ],
  MD: [
    source({
      label: "Maryland General Assembly",
      institution: "Maryland General Assembly",
      url: "https://mgaleg.maryland.gov/mgawebsite/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Maryland legislative source verified as reachable; specific AI bills or statutes require item-level review.",
    }),
  ],
};

const states = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
  ["DC", "District of Columbia"],
] as const;

function createProfile(code: string, name: string): UsStateAiLawProfile {
  const sources = prioritySources[code] ?? [];
  const sourceReferences = sources.map(stateReference);
  const hasReachableOfficialSource = sources.some((entry) => entry.runtimeAccessible);
  const status: UsStateAiLawStatus =
    code === "CO" && hasReachableOfficialSource
      ? "pending_ai_legislation"
      : code === "CA" && hasReachableOfficialSource
        ? "ai_related_privacy_or_automated_decision_rules"
      : code === "NY" && hasReachableOfficialSource
        ? "agency_guidance_or_enforcement"
      : hasReachableOfficialSource
        ? "no_specific_ai_law_verified"
        : "needs_review";

  return {
    stateCode: code,
    stateName: name,
    slug: slugify(name),
    region: "United States",
    aiLawStatus: status,
    aiLawStatusLabel: usStateAiLawStatusTaxonomy[status].label,
    aiLawStatusDescription: usStateAiLawStatusTaxonomy[status].description,
    confidenceLevel: hasReachableOfficialSource ? "medium" : "needs_review",
    enactedAIStatutes: [],
    pendingAIBills:
      code === "CO" && hasReachableOfficialSource
        ? ["Colorado SB24-205 requires item-level legal review before detailed public summary."]
        : [],
    failedAIBills: [],
    stateGovernmentUseRules:
      code === "NY"
        ? [
            "Part 161 of the Rules of the Chief Administrator governs use of artificial intelligence technology in preparing court papers and became effective June 1, 2026.",
          ]
        : [],
    privateSectorRules: [],
    employmentAIRules: [],
    biometricRules: [],
    deepfakeSyntheticMediaRules: [],
    consumerProtectionAIActivity: [],
    privacyAutomatedDecisionMakingRules: code === "CA" ? ["CPPA rulemaking source verified; individual rule text requires review."] : [],
    stateAGActivity: code === "NY" ? ["New York Attorney General guidance hub verified; AI-specific items require filtering and review."] : [],
    statePrivacyAgencyActivity: code === "CA" ? ["California Privacy Protection Agency rulemaking page verified."] : [],
    laborCivilRightsAgencyActivity: [],
    officialLegislatureUrl:
      sources.find((entry) => entry.sourceType === "legislature")?.url ?? null,
    officialBillSearchUrl:
      sources.find((entry) => entry.sourceType === "legislature")?.url ?? null,
    governorSourceUrls: sources.filter((entry) => entry.sourceType === "governor").map((entry) => entry.url),
    stateAGSourceUrls: sources.filter((entry) => entry.sourceType === "attorney_general").map((entry) => entry.url),
    courtSourceUrls: sources.filter((entry) => entry.sourceType === "court").map((entry) => entry.url),
    officialSourceUrls: sources.map((entry) => entry.url),
    discoverySources: [],
    sourceReferences,
    citationQualityStatus: sourceReferences.length > 0 ? "partial" : "missing_official_source",
    sourceVerificationStatus: hasReachableOfficialSource
      ? "partially_verified"
      : "needs_review",
    lastReviewedDate: verifiedAt,
    missingSourceWarnings: [
      ...(sourceReferences.length === 0 ? ["No official state source verified yet."] : []),
      "No comprehensive state-by-state AI law review completed yet.",
      "No official case-law source verified for this state profile.",
    ],
    editorialNotes: [
      "This state profile is baseline coverage only and should not be read as exhaustive.",
      "Do not infer absence of state AI law from missing verified entries.",
    ],
    publicSummary: hasReachableOfficialSource
      ? code === "NY"
        ? `${name} has multiple official sources verified for baseline monitoring, including the New York Courts Part 161 rule page, but item-level legal review remains necessary before stronger public conclusions about broader state AI law coverage are made.`
        : `${name} has at least one official state source verified for baseline monitoring, but specific AI laws, bills, or agency actions still require item-level review.`
      : `${name} is included in the U.S. state baseline, but no official state source has been verified in this phase.`,
  };
}

export const usStateAiLawProfiles: UsStateAiLawProfile[] = states.map(([code, name]) =>
  createProfile(code, name),
);

export function getUsStateAiLawProfiles() {
  return [...usStateAiLawProfiles];
}

export function getUsStateAiLawProfileBySlug(slug: string) {
  return usStateAiLawProfiles.find((profile) => profile.slug === slug) ?? null;
}

export function getPriorityUsStateProfiles() {
  const priorityCodes = ["CA", "CO", "NY", "IL", "TX", "CT", "UT", "VA", "WA", "MD"];
  return usStateAiLawProfiles.filter((profile) =>
    priorityCodes.includes(profile.stateCode),
  );
}

export function getUsStateVerificationBacklog() {
  return usStateAiLawProfiles.filter(
    (profile) =>
      profile.sourceVerificationStatus !== "verified_official_sources_present" ||
      profile.missingSourceWarnings.length > 0,
  );
}
