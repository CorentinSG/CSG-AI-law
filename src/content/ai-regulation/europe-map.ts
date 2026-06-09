import {
  europeImplementationStatusTaxonomy,
  getEuropeCountryProfiles,
  type EuropeImplementationConfidence,
  type EuropeImplementationStatus,
} from "@/content/ai-regulation/europe-country-profiles";

export interface EuropeCountryStatus {
  code: string;
  slug: string | null;
  name: string;
  x: number;
  y: number;
  status: EuropeImplementationStatus;
  confidence: EuropeImplementationConfidence;
  note: string;
  officialSourceLabel?: string;
  officialSourceUrl?: string;
  lastReviewedDate: string | null;
  sourceCount: number;
  href: string | null;
}

const baseEuropeCountryStatuses: Omit<
  EuropeCountryStatus,
  "status" | "confidence" | "note" | "officialSourceLabel" | "officialSourceUrl" | "lastReviewedDate" | "sourceCount" | "href"
>[] = [
  { code: "IE", slug: "ireland", name: "Ireland", x: 12, y: 34 },
  { code: "PT", slug: "portugal", name: "Portugal", x: 12, y: 64 },
  { code: "ES", slug: "spain", name: "Spain", x: 20, y: 62 },
  { code: "FR", slug: "france", name: "France", x: 28, y: 51 },
  { code: "BE", slug: "belgium", name: "Belgium", x: 34, y: 42 },
  { code: "NL", slug: "netherlands", name: "Netherlands", x: 37, y: 37 },
  { code: "LU", slug: "luxembourg", name: "Luxembourg", x: 36, y: 45 },
  { code: "DE", slug: "germany", name: "Germany", x: 42, y: 42 },
  { code: "DK", slug: "denmark", name: "Denmark", x: 44, y: 27 },
  { code: "SE", slug: "sweden", name: "Sweden", x: 52, y: 18 },
  { code: "FI", slug: "finland", name: "Finland", x: 62, y: 15 },
  { code: "EE", slug: "estonia", name: "Estonia", x: 65, y: 24 },
  { code: "LV", slug: "latvia", name: "Latvia", x: 63, y: 29 },
  { code: "LT", slug: "lithuania", name: "Lithuania", x: 61, y: 34 },
  { code: "PL", slug: "poland", name: "Poland", x: 54, y: 39 },
  { code: "CZ", slug: "czechia", name: "Czechia", x: 48, y: 45 },
  { code: "AT", slug: "austria", name: "Austria", x: 47, y: 50 },
  { code: "IT", slug: "italy", name: "Italy", x: 45, y: 60 },
  { code: "SI", slug: "slovenia", name: "Slovenia", x: 50, y: 54 },
  { code: "HR", slug: "croatia", name: "Croatia", x: 53, y: 58 },
  { code: "HU", slug: "hungary", name: "Hungary", x: 54, y: 51 },
  { code: "SK", slug: "slovakia", name: "Slovakia", x: 53, y: 47 },
  { code: "RO", slug: "romania", name: "Romania", x: 61, y: 53 },
  { code: "BG", slug: "bulgaria", name: "Bulgaria", x: 63, y: 59 },
  { code: "GR", slug: "greece", name: "Greece", x: 60, y: 69 },
  { code: "CY", slug: "cyprus", name: "Cyprus", x: 70, y: 75 },
  { code: "MT", slug: "malta", name: "Malta", x: 39, y: 74 },
];

const profileByCode = new Map(
  getEuropeCountryProfiles().map((profile) => [profile.countryCode, profile]),
);

export const europeCountryStatuses: EuropeCountryStatus[] = baseEuropeCountryStatuses.map(
  (country) => {
    const profile = profileByCode.get(country.code);
    if (!profile) {
      return {
        ...country,
        status: "needs_review",
        confidence: "needs_review",
        note: "No official national implementation source has been verified in this profile layer yet.",
        officialSourceLabel: undefined,
        officialSourceUrl: undefined,
        lastReviewedDate: null,
        sourceCount: 0,
        href: null,
      };
    }

    const primarySource = profile.nationalAIRegulationSources[0] ?? profile.nationalSoftLawSources[0];
    return {
      ...country,
      status: profile.implementationStatus,
      confidence: profile.implementationConfidence,
      note: profile.publicSummary,
      officialSourceLabel: primarySource?.label,
      officialSourceUrl: primarySource?.url,
      lastReviewedDate: profile.lastReviewedDate,
      sourceCount:
        profile.nationalAIRegulationSources.length +
        profile.nationalCaseLawSources.length +
        profile.nationalSoftLawSources.length +
        profile.sourceReferences.length,
      href: `/ai-regulation/europe/${profile.slug}`,
    };
  },
);

export function getEuropeImplementationReviewQueue() {
  return europeCountryStatuses.filter(
    (country) => country.confidence !== "high",
  );
}

export function getEuropeMapTone(status: EuropeImplementationStatus) {
  return europeImplementationStatusTaxonomy[status].mapTone;
}
