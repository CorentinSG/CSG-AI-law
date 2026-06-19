import {
  buildDefaultCountrySourceRegistry,
  type CountryLegalNewsAgentDefinition,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";

const missingEuMemberStateInputs = [
  {
    countryName: "Bulgaria",
    countrySlug: "bulgaria",
    countryCode: "BG",
    adjective: "Bulgarian",
    primaryAuthorityLabel: "Commission for Personal Data Protection",
  },
  {
    countryName: "Croatia",
    countrySlug: "croatia",
    countryCode: "HR",
    adjective: "Croatian",
    primaryAuthorityLabel: "Croatian Personal Data Protection Agency",
  },
  {
    countryName: "Cyprus",
    countrySlug: "cyprus",
    countryCode: "CY",
    adjective: "Cypriot",
    primaryAuthorityLabel: "Office of the Commissioner for Personal Data Protection",
  },
  {
    countryName: "Czechia",
    countrySlug: "czechia",
    countryCode: "CZ",
    adjective: "Czech",
    primaryAuthorityLabel: "Office for Personal Data Protection",
  },
  {
    countryName: "Denmark",
    countrySlug: "denmark",
    countryCode: "DK",
    adjective: "Danish",
    primaryAuthorityLabel: "Danish Data Protection Agency",
  },
  {
    countryName: "Estonia",
    countrySlug: "estonia",
    countryCode: "EE",
    adjective: "Estonian",
    primaryAuthorityLabel: "Estonian Data Protection Inspectorate",
  },
  {
    countryName: "Finland",
    countrySlug: "finland",
    countryCode: "FI",
    adjective: "Finnish",
    primaryAuthorityLabel: "Office of the Data Protection Ombudsman",
  },
  {
    countryName: "Greece",
    countrySlug: "greece",
    countryCode: "GR",
    adjective: "Greek",
    primaryAuthorityLabel: "Hellenic Data Protection Authority",
  },
  {
    countryName: "Hungary",
    countrySlug: "hungary",
    countryCode: "HU",
    adjective: "Hungarian",
    primaryAuthorityLabel: "National Authority for Data Protection and Freedom of Information",
  },
  {
    countryName: "Latvia",
    countrySlug: "latvia",
    countryCode: "LV",
    adjective: "Latvian",
    primaryAuthorityLabel: "Data State Inspectorate",
  },
  {
    countryName: "Lithuania",
    countrySlug: "lithuania",
    countryCode: "LT",
    adjective: "Lithuanian",
    primaryAuthorityLabel: "State Data Protection Inspectorate",
  },
  {
    countryName: "Luxembourg",
    countrySlug: "luxembourg",
    countryCode: "LU",
    adjective: "Luxembourgish",
    primaryAuthorityLabel: "National Commission for Data Protection",
  },
  {
    countryName: "Malta",
    countrySlug: "malta",
    countryCode: "MT",
    adjective: "Maltese",
    primaryAuthorityLabel: "Information and Data Protection Commissioner",
  },
  {
    countryName: "Poland",
    countrySlug: "poland",
    countryCode: "PL",
    adjective: "Polish",
    primaryAuthorityLabel: "Personal Data Protection Office",
  },
  {
    countryName: "Portugal",
    countrySlug: "portugal",
    countryCode: "PT",
    adjective: "Portuguese",
    primaryAuthorityLabel: "National Data Protection Commission",
  },
  {
    countryName: "Romania",
    countrySlug: "romania",
    countryCode: "RO",
    adjective: "Romanian",
    primaryAuthorityLabel: "National Supervisory Authority for Personal Data Processing",
  },
  {
    countryName: "Slovakia",
    countrySlug: "slovakia",
    countryCode: "SK",
    adjective: "Slovak",
    primaryAuthorityLabel: "Office for Personal Data Protection of the Slovak Republic",
  },
  {
    countryName: "Slovenia",
    countrySlug: "slovenia",
    countryCode: "SI",
    adjective: "Slovenian",
    primaryAuthorityLabel: "Information Commissioner",
  },
] as const;

export const missingEuMemberStateAgentDefinitions = missingEuMemberStateInputs.map(
  (input) =>
    ({
      ...input,
      sourceRegistry: buildDefaultCountrySourceRegistry(input),
    }) satisfies CountryLegalNewsAgentDefinition,
);

export type MissingEuMemberStateSlug =
  (typeof missingEuMemberStateAgentDefinitions)[number]["countrySlug"];

export function getMissingEuMemberStateAgentDefinition(slug: MissingEuMemberStateSlug) {
  const definition =
    missingEuMemberStateAgentDefinitions.find((entry) => entry.countrySlug === slug) ?? null;
  if (!definition) {
    throw new Error(`Unknown EU member state monitoring agent: ${slug}`);
  }
  return definition;
}
