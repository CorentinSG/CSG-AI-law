import { assessCitationQuality } from "@/agents/ai-regulation/citations";
import { assessDataQuality, type DataQualityAssessment } from "@/agents/ai-regulation/dataQuality";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";
import {
  europeAiCaseLawEntries,
  europeAiCaseLawSources,
} from "@/content/ai-regulation/europe-ai-case-law";
import {
  europeAiActBaseline,
  europeGovernanceActors,
} from "@/content/ai-regulation/europe-ai-legal-baseline";
import { europeAiSoftLawBaseline } from "@/content/ai-regulation/europe-ai-soft-law";
import { getEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import {
  usAiCaseLawEntries,
  usAiCaseLawSources,
} from "@/content/ai-regulation/us-ai-case-law";
import {
  usFederalBaselineEntries,
  usFederalTimelineEntries,
} from "@/content/ai-regulation/us-ai-legal-baseline";
import { usAiSoftLawBaseline } from "@/content/ai-regulation/us-ai-soft-law";
import { getUsStateAiLawProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";

export interface CoverageFinding {
  id: string;
  area: "europe" | "united_states" | "source" | "global";
  entityType:
    | "country"
    | "state"
    | "timeline"
    | "baseline"
    | "case_law"
    | "soft_law"
    | "governance_actor";
  title: string;
  status: string;
  summary: string;
  quality: DataQualityAssessment;
  sourceCount: number;
  warnings: string[];
}

function warningsFromQuality(quality: DataQualityAssessment, extra: string[] = []) {
  return [
    ...extra,
    ...quality.missingFields.map((field) => `Missing field: ${field}`),
    ...quality.staleWarnings,
    ...quality.sourceAccessibilityWarnings,
  ];
}

function europeCountryFreshnessThreshold(status: string) {
  switch (status) {
    case "national_implementation_identified":
    case "implementation_in_progress":
    case "consultation_or_draft_identified":
    case "competent_authority_designated":
      return 45;
    case "no_specific_national_implementation_verified":
      return 60;
    default:
      return 75;
  }
}

function europeSoftLawFreshnessThreshold(bindingStatus: string) {
  return bindingStatus === "needs_review" ? 30 : 45;
}

export function buildEuropeCoverageDiagnostics(now = new Date()): CoverageFinding[] {
  const countryFindings = getEuropeCountryProfiles().map((profile) => {
    const quality = assessDataQuality({
      sourceReferences: profile.sourceReferences,
      requiredFields: {
        implementationStatus: profile.implementationStatus,
        lastReviewedDate: profile.lastReviewedDate,
      },
      verificationStatus: profile.sourceVerificationStatus,
      confidenceLevel: profile.implementationConfidence,
      lastReviewedAt: profile.lastReviewedDate,
      freshnessPolicy: "country_status",
      freshnessThresholdDaysOverride: europeCountryFreshnessThreshold(
        profile.implementationStatus,
      ),
      sourceAccessible: profile.sourceReferences.every(
        (reference) => reference.verificationStatus !== "needs_manual_verification",
      ),
      now,
    });

    return {
      id: `eu-country-${profile.slug}`,
      area: "europe" as const,
      entityType: "country" as const,
      title: profile.countryName,
      status: profile.implementationStatus,
      summary: profile.publicSummary,
      quality,
      sourceCount: profile.sourceReferences.length,
      warnings: warningsFromQuality(quality, profile.missingSourceWarnings),
    };
  });

  const timelineFindings = euAiTimelineEntries.map((entry) => {
    const quality = assessDataQuality({
      sourceReferences: entry.sourceReferences,
      requiredFields: {
        sourceUrl: entry.sourceUrl,
        institution: entry.institution,
        date: entry.date,
      },
      verificationStatus: entry.status,
      confidenceLevel: entry.confidence,
      lastReviewedAt: entry.lastVerifiedAt,
      freshnessPolicy: "timeline_milestone",
      now,
    });

    return {
      id: `eu-timeline-${entry.id}`,
      area: "europe" as const,
      entityType: "timeline" as const,
      title: entry.title,
      status: entry.status,
      summary: entry.legalEffect,
      quality,
      sourceCount: entry.sourceReferences.length,
      warnings: warningsFromQuality(quality),
    };
  });

  const baselineFindings = [
    {
      id: `eu-baseline-${europeAiActBaseline.id}`,
      area: "europe" as const,
      entityType: "baseline" as const,
      title: europeAiActBaseline.shortTitle,
      status: "eu_hard_law_baseline",
      summary: europeAiActBaseline.scope,
      quality: assessDataQuality({
        sourceReferences: europeAiActBaseline.sourceReferences,
        requiredFields: {
          eurLexUrl: europeAiActBaseline.eurLexUrl,
          dateEnteredIntoForce: europeAiActBaseline.dateEnteredIntoForce,
        },
        verificationStatus: "verified_for_review",
        confidenceLevel: europeAiActBaseline.confidenceLevel,
        lastReviewedAt: europeAiActBaseline.lastVerifiedAt,
        freshnessPolicy: "soft_law",
        freshnessThresholdDaysOverride: 120,
        now,
      }),
      sourceCount: europeAiActBaseline.sourceReferences.length,
      warnings: [] as string[],
    },
    ...europeGovernanceActors.map((actor) => {
      const quality = assessDataQuality({
        sourceReferences: actor.sourceReferences,
        requiredFields: {
          name: actor.name,
          legalBasis: actor.legalBasis,
        },
        verificationStatus: "verified_for_review",
        confidenceLevel: actor.confidenceLevel,
        lastReviewedAt: actor.lastVerifiedAt,
        freshnessPolicy: "soft_law",
        freshnessThresholdDaysOverride: 45,
        now,
      });
      return {
        id: `eu-governance-${actor.id}`,
        area: "europe" as const,
        entityType: "governance_actor" as const,
        title: actor.name,
        status: actor.citationQualityStatus,
        summary: actor.role,
        quality,
        sourceCount: actor.sourceReferences.length,
        warnings: warningsFromQuality(quality),
      };
    }),
  ].map((finding) => ({
    ...finding,
    warnings: finding.warnings.length > 0 ? finding.warnings : warningsFromQuality(finding.quality),
  }));

  const caseLawFindings: CoverageFinding[] = [
    ...europeAiCaseLawSources.map((source) => {
      const quality = assessDataQuality({
        sourceReferences: source.sourceReferences,
        requiredFields: {
          sourceUrl: source.sourceUrl,
          institution: source.institution,
        },
        verificationStatus: source.parserStatus,
        confidenceLevel: source.runtimeAccessible ? "medium" : "needs_review",
        lastReviewedAt: source.sourceReferences[0]?.lastVerifiedAt,
        freshnessPolicy: "case_law",
        freshnessThresholdDaysOverride: 45,
        sourceAccessible: source.runtimeAccessible,
        now,
      });
      return {
        id: `eu-case-source-${source.id}`,
        area: "europe" as const,
        entityType: "case_law" as const,
        title: source.name,
        status: source.parserStatus,
        summary: source.note,
        quality,
        sourceCount: source.sourceReferences.length,
        warnings: warningsFromQuality(quality),
      };
    }),
    ...europeAiCaseLawEntries.map((entry) => ({
      id: `eu-case-${entry.id}`,
      area: "europe" as const,
      entityType: "case_law" as const,
      title: entry.title,
      status: entry.status,
      summary: entry.shortSummary,
      quality: assessDataQuality({
        sourceReferences: entry.sourceReferences,
        verificationStatus: entry.status,
        confidenceLevel: entry.confidenceLevel,
        lastReviewedAt: entry.date,
        freshnessPolicy: "case_law",
        freshnessThresholdDaysOverride: 45,
        now,
      }),
      sourceCount: entry.sourceReferences.length,
      warnings: [],
    })),
  ];

  const softLawFindings = europeAiSoftLawBaseline.map((entry) => {
    const citation = assessCitationQuality(entry.sourceReferences);
    const quality = assessDataQuality({
      sourceReferences: entry.sourceReferences,
      requiredFields: {
        authorityType: entry.authorityType,
        bindingStatus: entry.bindingStatus,
        sourceUrl: entry.sourceUrl,
      },
      verificationStatus: citation.qualityStatus,
      confidenceLevel: entry.citationQualityStatus === "complete" ? "high" : "needs_review",
      lastReviewedAt: entry.lastVerifiedAt,
      freshnessPolicy: "soft_law",
      freshnessThresholdDaysOverride: europeSoftLawFreshnessThreshold(entry.bindingStatus),
      sourceAccessible: entry.citationQualityStatus !== "needs_manual_verification",
      now,
    });
    return {
      id: `eu-soft-law-${entry.id}`,
      area: "europe" as const,
      entityType: "soft_law" as const,
      title: entry.title,
      status: entry.bindingStatus,
      summary: entry.legalRelevance,
      quality,
      sourceCount: entry.sourceReferences.length,
      warnings: warningsFromQuality(quality, entry.limitations),
    };
  });

  return [
    ...countryFindings,
    ...timelineFindings,
    ...baselineFindings,
    ...caseLawFindings,
    ...softLawFindings,
  ];
}

export function buildUsCoverageDiagnostics(now = new Date()): CoverageFinding[] {
  const stateFindings = getUsStateAiLawProfiles().map((profile) => {
    const quality = assessDataQuality({
      sourceReferences: profile.sourceReferences,
      requiredFields: {
        aiLawStatus: profile.aiLawStatus,
        lastReviewedDate: profile.lastReviewedDate,
      },
      verificationStatus: profile.sourceVerificationStatus,
      confidenceLevel: profile.confidenceLevel,
      lastReviewedAt: profile.lastReviewedDate,
      freshnessPolicy: "state_status",
      sourceAccessible: profile.sourceReferences.every(
        (reference) => reference.verificationStatus !== "needs_manual_verification",
      ),
      now,
    });

    return {
      id: `us-state-${profile.slug}`,
      area: "united_states" as const,
      entityType: "state" as const,
      title: profile.stateName,
      status: profile.aiLawStatus,
      summary: profile.publicSummary,
      quality,
      sourceCount: profile.sourceReferences.length,
      warnings: warningsFromQuality(quality, profile.missingSourceWarnings),
    };
  });

  const federalFindings = usFederalBaselineEntries.map((entry) => {
    const quality = assessDataQuality({
      sourceReferences: entry.sourceReferences,
      requiredFields: {
        officialSourceUrl: entry.officialSourceUrl,
        sourceInstitution: entry.sourceInstitution,
      },
      verificationStatus: entry.publicVisibilityStatus,
      confidenceLevel: entry.confidenceLevel,
      lastReviewedAt: entry.lastVerifiedAt,
      freshnessPolicy: "active_source",
      sourceAccessible: entry.sourceHealth.runtimeAccessible,
      now,
    });

    return {
      id: `us-federal-${entry.id}`,
      area: "united_states" as const,
      entityType: "baseline" as const,
      title: entry.shortTitle,
      status: entry.sourceHealth.activeRecommendation,
      summary: entry.summary,
      quality,
      sourceCount: entry.sourceReferences.length,
      warnings: warningsFromQuality(quality, [entry.sourceHealth.reliabilityNotes]),
    };
  });

  const timelineFindings = usFederalTimelineEntries.map((entry) => {
    const quality = assessDataQuality({
      sourceReferences: entry.sourceReferences,
      requiredFields: {
        sourceUrl: entry.sourceUrl,
        sourceInstitution: entry.sourceInstitution,
        date: entry.date,
      },
      verificationStatus: entry.bindingStatus,
      confidenceLevel: entry.confidenceLevel,
      lastReviewedAt: entry.lastVerifiedAt,
      freshnessPolicy: "timeline_milestone",
      now,
    });

    return {
      id: `us-timeline-${entry.id}`,
      area: "united_states" as const,
      entityType: "timeline" as const,
      title: entry.title,
      status: entry.bindingStatus,
      summary: entry.legalEffect,
      quality,
      sourceCount: entry.sourceReferences.length,
      warnings: warningsFromQuality(quality),
    };
  });

  const caseLawFindings = [
    ...usAiCaseLawSources.map((source) => {
      const quality = assessDataQuality({
        sourceReferences: source.sourceReferences,
        requiredFields: {
          sourceUrl: source.sourceUrl,
          institution: source.institution,
        },
        verificationStatus: source.parserStatus,
        confidenceLevel: source.runtimeAccessible ? "medium" : "needs_review",
        lastReviewedAt: source.sourceReferences[0]?.lastVerifiedAt,
        freshnessPolicy: "case_law",
        sourceAccessible: source.runtimeAccessible,
        now,
      });
      return {
        id: `us-case-source-${source.id}`,
        area: "united_states" as const,
        entityType: "case_law" as const,
        title: source.name,
        status: source.parserStatus,
        summary: source.note,
        quality,
        sourceCount: source.sourceReferences.length,
        warnings: warningsFromQuality(quality),
      };
    }),
    ...usAiCaseLawEntries.map((entry) => {
      const quality = assessDataQuality({
        sourceReferences: entry.sourceReferences,
        verificationStatus: entry.status,
        confidenceLevel: entry.confidenceLevel,
        lastReviewedAt: entry.date,
        freshnessPolicy: "case_law",
        now,
      });
      return {
        id: `us-case-${entry.id}`,
        area: "united_states" as const,
        entityType: "case_law" as const,
        title: entry.caseName,
        status: entry.status,
        summary: entry.legalSignificance ?? "Case entry requires review.",
        quality,
        sourceCount: entry.sourceReferences.length,
        warnings: warningsFromQuality(quality),
      };
    }),
  ];

  const softLawFindings = usAiSoftLawBaseline.map((entry) => {
    const quality = assessDataQuality({
      sourceReferences: entry.sourceReferences,
      requiredFields: {
        authorityType: entry.authorityType,
        bindingStatus: entry.bindingStatus,
        sourceUrl: entry.sourceUrl,
      },
      verificationStatus: entry.citationQualityStatus,
      confidenceLevel: entry.citationQualityStatus === "complete" ? "high" : "needs_review",
      lastReviewedAt: entry.lastVerifiedAt,
      freshnessPolicy: "soft_law",
      now,
    });
    return {
      id: `us-soft-law-${entry.id}`,
      area: "united_states" as const,
      entityType: "soft_law" as const,
      title: entry.title,
      status: entry.bindingStatus,
      summary: entry.legalRelevance,
      quality,
      sourceCount: entry.sourceReferences.length,
      warnings: warningsFromQuality(quality, entry.limitations),
    };
  });

  return [
    ...stateFindings,
    ...federalFindings,
    ...timelineFindings,
    ...caseLawFindings,
    ...softLawFindings,
  ];
}
