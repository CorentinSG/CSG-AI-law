import {
  buildDefaultCountrySourceRegistry,
  type CountryLegalNewsAgentDefinition,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";

const nonEuEuropeInputs = [
  {
    countryName: "United Kingdom",
    countrySlug: "united-kingdom",
    countryCode: "GB",
    adjective: "British",
    primaryAuthorityLabel: "Information Commissioner's Office",
  },
  {
    countryName: "Norway",
    countrySlug: "norway",
    countryCode: "NO",
    adjective: "Norwegian",
    primaryAuthorityLabel: "Norwegian Data Protection Authority",
  },
  {
    countryName: "Iceland",
    countrySlug: "iceland",
    countryCode: "IS",
    adjective: "Icelandic",
    primaryAuthorityLabel: "Icelandic Data Protection Authority",
  },
  {
    countryName: "Switzerland",
    countrySlug: "switzerland",
    countryCode: "CH",
    adjective: "Swiss",
    primaryAuthorityLabel: "Federal Data Protection and Information Commissioner",
  },
  {
    countryName: "Liechtenstein",
    countrySlug: "liechtenstein",
    countryCode: "LI",
    adjective: "Liechtenstein",
    primaryAuthorityLabel: "Data Protection Office",
  },
  {
    countryName: "Monaco",
    countrySlug: "monaco",
    countryCode: "MC",
    adjective: "Monegasque",
    primaryAuthorityLabel: "Commission de Controle des Informations Nominatives",
  },
  {
    countryName: "Andorra",
    countrySlug: "andorra",
    countryCode: "AD",
    adjective: "Andorran",
    primaryAuthorityLabel: "Andorran Data Protection Agency",
  },
  {
    countryName: "San Marino",
    countrySlug: "san-marino",
    countryCode: "SM",
    adjective: "Sammarinese",
    primaryAuthorityLabel: "San Marino Data Protection Authority",
  },
  {
    countryName: "Vatican City",
    countrySlug: "vatican-city",
    countryCode: "VA",
    adjective: "Vatican",
    primaryAuthorityLabel: "Vatican City official legal sources",
  },
  {
    countryName: "Albania",
    countrySlug: "albania",
    countryCode: "AL",
    adjective: "Albanian",
    primaryAuthorityLabel: "Information and Data Protection Commissioner",
  },
  {
    countryName: "Bosnia and Herzegovina",
    countrySlug: "bosnia-and-herzegovina",
    countryCode: "BA",
    adjective: "Bosnian",
    primaryAuthorityLabel: "Personal Data Protection Agency",
  },
  {
    countryName: "Kosovo",
    countrySlug: "kosovo",
    countryCode: "XK",
    adjective: "Kosovar",
    primaryAuthorityLabel: "Information and Privacy Agency",
  },
  {
    countryName: "Montenegro",
    countrySlug: "montenegro",
    countryCode: "ME",
    adjective: "Montenegrin",
    primaryAuthorityLabel: "Agency for Personal Data Protection and Free Access to Information",
  },
  {
    countryName: "North Macedonia",
    countrySlug: "north-macedonia",
    countryCode: "MK",
    adjective: "Macedonian",
    primaryAuthorityLabel: "Personal Data Protection Agency",
  },
  {
    countryName: "Serbia",
    countrySlug: "serbia",
    countryCode: "RS",
    adjective: "Serbian",
    primaryAuthorityLabel: "Commissioner for Information of Public Importance and Personal Data Protection",
  },
] as const;

export const nonEuEuropeAgentDefinitions = nonEuEuropeInputs.map(
  (input) =>
    ({
      ...input,
      sourceRegistry: buildDefaultCountrySourceRegistry(input),
    }) satisfies CountryLegalNewsAgentDefinition,
);

export type NonEuEuropeSlug = (typeof nonEuEuropeAgentDefinitions)[number]["countrySlug"];

export function getNonEuEuropeAgentDefinition(slug: NonEuEuropeSlug) {
  const definition =
    nonEuEuropeAgentDefinitions.find((entry) => entry.countrySlug === slug) ?? null;
  if (!definition) {
    throw new Error(`Unknown non-EU Europe monitoring agent: ${slug}`);
  }
  return definition;
}
