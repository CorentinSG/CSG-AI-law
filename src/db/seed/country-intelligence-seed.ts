import type {
  CountryIntelligence,
  CountryIntelligenceSource,
  CountryImplementationConfidence,
  CountryReviewStatus,
} from "@/agents/ai-regulation/governance";
import { computeCountryNeedsReReview } from "@/agents/ai-regulation/country-review";
import type {
  CountryIntelligenceSourceWriteInput,
  CountryIntelligenceUpsertInput,
} from "@/db/repository-types";
import {
  getEuropeCountryProfiles,
  type CountrySourceRecord,
  type EuropeCountryProfile,
} from "@/content/ai-regulation/europe-member-state-implementation";

function mapImplementationConfidence(
  confidence: EuropeCountryProfile["implementationConfidence"],
): CountryImplementationConfidence {
  if (confidence === "needs_review") {
    return "unverified";
  }
  return confidence;
}

function mapReviewStatus(
  status: EuropeCountryProfile["sourceVerificationStatus"],
): CountryReviewStatus {
  if (status === "verified_official_sources_present") {
    return "verified";
  }
  if (status === "partially_verified") {
    return "needs_review";
  }
  return "needs_review";
}

function buildCountryId(profile: EuropeCountryProfile) {
  return `country-${profile.slug}`;
}

function buildSourceId(
  profile: EuropeCountryProfile,
  family: "regulation" | "case-law" | "soft-law",
  index: number,
) {
  return `country-source-${profile.slug}-${family}-${index + 1}`;
}

function flattenSourceFamilies(profile: EuropeCountryProfile) {
  return [
    { family: "regulation" as const, sources: profile.nationalAIRegulationSources },
    { family: "case-law" as const, sources: profile.nationalCaseLawSources },
    { family: "soft-law" as const, sources: profile.nationalSoftLawSources },
  ];
}

function sourceAuthorityType(
  family: "regulation" | "case-law" | "soft-law",
  source: CountrySourceRecord,
) {
  if (family === "case-law") return "case_law_source";
  if (family === "soft-law") return "guidance_source";
  return source.sourceType;
}

function sourceNotes(
  family: "regulation" | "case-law" | "soft-law",
  source: CountrySourceRecord,
) {
  return `${family}: ${source.note}`;
}

export function mapEuropeCountryProfileToCountryIntelligenceInput(
  profile: EuropeCountryProfile,
): CountryIntelligenceUpsertInput {
  const primaryRegulationSource = profile.nationalAIRegulationSources[0] ?? null;
  const latestSourceCheckCandidates = profile.nationalAIRegulationSources
    .map((source) => source.lastCheckedDate)
    .filter(Boolean)
    .sort()
    .reverse();

  return {
    id: buildCountryId(profile),
    region: "Europe",
    countryCode: profile.countryCode,
    countryName: profile.countryName,
    slug: profile.slug,
    implementationStatus: profile.implementationStatus,
    implementationConfidence: mapImplementationConfidence(profile.implementationConfidence),
    implementationNotes: profile.aiActImplementationNotes,
    competentAuthorityName: profile.nationalCompetentAuthorities[0] ?? null,
    competentAuthorityUrl: null,
    dpaName: profile.dataProtectionAuthority,
    dpaUrl: null,
    marketSurveillanceAuthority: profile.marketSurveillanceAuthorities[0] ?? null,
    primaryOfficialSourceUrl: profile.officialSourceUrls[0] ?? primaryRegulationSource?.url ?? null,
    primaryOfficialSourceTitle:
      primaryRegulationSource?.label ?? profile.sourceReferences[0]?.title ?? null,
    lastOfficialSourceCheck: latestSourceCheckCandidates[0] ?? profile.lastReviewedDate,
    citationQualityStatus: profile.citationQualityStatus,
    publicSummary: profile.publicSummary,
    editorialNotes:
      profile.editorialNotes.length > 0 ? profile.editorialNotes.join("\n") : null,
    missingSourceWarnings: profile.missingSourceWarnings,
    implementationMeasures: profile.nationalImplementationMeasures,
    competentAuthorities: profile.nationalCompetentAuthorities,
    marketSurveillanceAuthorities: profile.marketSurveillanceAuthorities,
    notifyingAuthorities: profile.notifyingAuthorities,
    relevantMinistries: profile.relevantMinistriesOrAgencies,
    nationalAIRegulationNotes: profile.nationalAIRegulationNotes,
    nationalCaseLawNotes: profile.nationalCaseLawNotes,
    nationalSoftLawNotes: profile.nationalSoftLawNotes,
    lastReviewedAt: profile.lastReviewedDate,
    reviewedBy: "seed-profile",
    reviewStatus: mapReviewStatus(profile.sourceVerificationStatus),
    needsReReview: computeCountryNeedsReReview(profile.lastReviewedDate),
  };
}

export function mapEuropeCountryProfileToCountryIntelligenceSources(
  profile: EuropeCountryProfile,
): CountryIntelligenceSourceWriteInput[] {
  const countryId = buildCountryId(profile);
  return flattenSourceFamilies(profile).flatMap(({ family, sources }) =>
    sources.map((source, index) => ({
      id: buildSourceId(profile, family, index),
      countryId,
      sourceUrl: source.url,
      sourceTitle: source.label,
      institution: source.institution,
      authorityType: sourceAuthorityType(family, source),
      publicAccessible: source.public,
      runtimeAccessible: source.runtimeAccessible,
      lastCheckedAt: source.lastCheckedDate,
      responseStatus: source.responseStatus,
      active: source.recommendation !== "inactive",
      notes: sourceNotes(family, source),
    })),
  );
}

export function buildCountryIntelligenceSeed(): CountryIntelligence[] {
  return getEuropeCountryProfiles().map((profile) => {
    const input = mapEuropeCountryProfileToCountryIntelligenceInput(profile);
    const timestamp = input.lastReviewedAt ?? new Date().toISOString();
    return {
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export function buildCountryIntelligenceSourcesSeed(): CountryIntelligenceSource[] {
  return getEuropeCountryProfiles().flatMap((profile) => {
    const timestamp = profile.lastReviewedDate;
    return mapEuropeCountryProfileToCountryIntelligenceSources(profile).map((input) => ({
      ...input,
      createdAt: timestamp,
    }));
  });
}
