import {
  buildDefaultCountrySourceRegistry,
  type CountryLegalNewsAgentDefinition,
  type CountryMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";

export interface UsMonitoringAgentDefinition extends CountryLegalNewsAgentDefinition {
  jurisdictionLevel: "federal" | "state" | "district";
  postalCode: string;
}

const federalSourceRegistry: CountryMonitoringSourceDescriptor[] = [
  {
    sourceId: "src-us-federal-register-ai",
    label: "Federal Register - AI, data, and cloud regulatory actions",
    category: "official_government_implementation",
    recommendedCadence: "daily",
    priorityBand: "high",
    freshHours: 24,
    watchHours: 72,
    staleHours: 168,
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: true,
  },
  {
    sourceId: "src-us-nist-ai",
    label: "NIST - AI Risk Management Framework and technical guidance",
    category: "official_guidance_feed",
    recommendedCadence: "daily",
    priorityBand: "high",
    freshHours: 24,
    watchHours: 72,
    staleHours: 168,
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: true,
  },
  {
    sourceId: "src-us-ftc-ai",
    label: "Federal Trade Commission - AI enforcement and guidance",
    category: "official_supervision_feed",
    recommendedCadence: "daily",
    priorityBand: "high",
    freshHours: 24,
    watchHours: 72,
    staleHours: 168,
    liveMonitoringEligible: true,
    baselineEligible: true,
    verificationEligible: true,
  },
  {
    sourceId: "src-us-newsapi-ai",
    label: "United States AI legal news discovery (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "hourly_fallback",
    priorityBand: "medium",
    freshHours: 6,
    watchHours: 24,
    staleHours: 72,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-us-gdelt-ai",
    label: "United States AI legal news discovery (GDELT)",
    category: "discovery_media_feed",
    recommendedCadence: "hourly_fallback",
    priorityBand: "low",
    freshHours: 6,
    watchHours: 24,
    staleHours: 72,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
];

export const usFederalMonitoringAgentDefinition: UsMonitoringAgentDefinition = {
  countryName: "United States",
  countrySlug: "united-states-federal",
  countryCode: "US",
  adjective: "US federal",
  primaryAuthorityLabel: "US federal authorities",
  jurisdictionLevel: "federal",
  postalCode: "US",
  sourceRegistry: federalSourceRegistry,
};

const stateRows = [
  ["Alabama", "AL"],
  ["Alaska", "AK"],
  ["Arizona", "AZ"],
  ["Arkansas", "AR"],
  ["California", "CA"],
  ["Colorado", "CO"],
  ["Connecticut", "CT"],
  ["Delaware", "DE"],
  ["Florida", "FL"],
  ["Georgia", "GA"],
  ["Hawaii", "HI"],
  ["Idaho", "ID"],
  ["Illinois", "IL"],
  ["Indiana", "IN"],
  ["Iowa", "IA"],
  ["Kansas", "KS"],
  ["Kentucky", "KY"],
  ["Louisiana", "LA"],
  ["Maine", "ME"],
  ["Maryland", "MD"],
  ["Massachusetts", "MA"],
  ["Michigan", "MI"],
  ["Minnesota", "MN"],
  ["Mississippi", "MS"],
  ["Missouri", "MO"],
  ["Montana", "MT"],
  ["Nebraska", "NE"],
  ["Nevada", "NV"],
  ["New Hampshire", "NH"],
  ["New Jersey", "NJ"],
  ["New Mexico", "NM"],
  ["New York", "NY"],
  ["North Carolina", "NC"],
  ["North Dakota", "ND"],
  ["Ohio", "OH"],
  ["Oklahoma", "OK"],
  ["Oregon", "OR"],
  ["Pennsylvania", "PA"],
  ["Rhode Island", "RI"],
  ["South Carolina", "SC"],
  ["South Dakota", "SD"],
  ["Tennessee", "TN"],
  ["Texas", "TX"],
  ["Utah", "UT"],
  ["Vermont", "VT"],
  ["Virginia", "VA"],
  ["Washington", "WA"],
  ["West Virginia", "WV"],
  ["Wisconsin", "WI"],
  ["Wyoming", "WY"],
] as const;

const districtRows = [["District of Columbia", "DC"]] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildStateDefinition(
  [stateName, postalCode]: readonly [string, string],
  jurisdictionLevel: "state" | "district",
): UsMonitoringAgentDefinition {
  const sourceRegistry = buildDefaultCountrySourceRegistry({
    countryName: stateName,
    countryCode: `us-${postalCode.toLowerCase()}`,
    primaryAuthorityLabel:
      jurisdictionLevel === "district"
        ? "District of Columbia official authorities"
        : `${stateName} official authorities`,
  });

  if (stateName === "New York") {
    sourceRegistry.push(
      {
        sourceId: "src-us-ny-courts-ai-decisions",
        label: "New York Law Reporting Bureau - AI-related decisions and slip opinions",
        category: "official_court_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-nycourts-part-161-ai",
        label: "New York State Unified Court System - AI policies, Part 161, and rule comments",
        category: "official_court_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-us-ny-courtlistener-ai",
        label: "CourtListener / RECAP - New York federal AI, privilege, and work-product discovery",
        category: "official_court_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-us-nyc-dcwp-aedt",
        label: "NYC DCWP - Local Law 144 automated employment decision tools",
        category: "official_supervision_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-us-nyc-rules-aedt",
        label: "NYC Rules and Council - AEDT rulemaking and amendments",
        category: "official_legislative_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-us-ny-legislature-ai",
        label: "New York Senate and Assembly - AI, automated decision, and algorithmic discrimination bills",
        category: "official_legislative_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-nydfs-ai",
        label: "New York Department of Financial Services - AI, insurance, cyber, and model governance",
        category: "official_supervision_feed",
        recommendedCadence: "daily",
        priorityBand: "high",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
      {
        sourceId: "src-nyag-ai",
        label: "New York Attorney General - AI, consumer protection, privacy, and platform enforcement",
        category: "official_supervision_feed",
        recommendedCadence: "daily",
        priorityBand: "medium",
        freshHours: 24,
        watchHours: 72,
        staleHours: 168,
        liveMonitoringEligible: true,
        baselineEligible: true,
        verificationEligible: true,
      },
    );
  }

  return {
    countryName: stateName,
    countrySlug: `us-${slugify(stateName)}`,
    countryCode: `US-${postalCode}`,
    adjective: `${stateName}`,
    primaryAuthorityLabel:
      jurisdictionLevel === "district"
        ? "District of Columbia official authorities"
        : `${stateName} official authorities`,
    jurisdictionLevel,
    postalCode,
    sourceRegistry,
  };
}

export const usStateMonitoringAgentDefinitions: UsMonitoringAgentDefinition[] = stateRows.map(
  (row) => buildStateDefinition(row, "state"),
);

export const usDistrictMonitoringAgentDefinitions: UsMonitoringAgentDefinition[] = districtRows.map(
  (row) => buildStateDefinition(row, "district"),
);

export const usSubFederalMonitoringAgentDefinitions: UsMonitoringAgentDefinition[] = [
  ...usStateMonitoringAgentDefinitions,
  ...usDistrictMonitoringAgentDefinitions,
];

export const usMonitoringAgentDefinitions: UsMonitoringAgentDefinition[] = [
  usFederalMonitoringAgentDefinition,
  ...usSubFederalMonitoringAgentDefinitions,
];
