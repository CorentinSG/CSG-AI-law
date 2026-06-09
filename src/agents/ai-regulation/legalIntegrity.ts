import { assessCitationQuality } from "@/agents/ai-regulation/citations";
import { assessFreshness } from "@/agents/ai-regulation/freshness";
import {
  getEuropeCountryProfiles,
  isSupportedEuropeImplementationStatus,
} from "@/content/ai-regulation/europe-country-profiles";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";
import { europeAiSoftLawBaseline } from "@/content/ai-regulation/europe-ai-soft-law";
import {
  europeAiActBaseline,
  europeGovernanceActors,
} from "@/content/ai-regulation/europe-ai-legal-baseline";
import {
  getUsStateAiLawProfiles,
  usStateAiLawStatusTaxonomy,
} from "@/content/ai-regulation/us-state-ai-law-baseline";
import {
  usFederalBaselineEntries,
  usFederalTimelineEntries,
} from "@/content/ai-regulation/us-ai-legal-baseline";
import { usAiCaseLawEntries } from "@/content/ai-regulation/us-ai-case-law";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";
import { buildSeedDataset } from "@/db/seed/seed-profiles";
import { sourceDiscoveryRegistry } from "@/content/ai-regulation/source-discovery-registry";

export type IntegritySeverity = "high" | "medium" | "low";

export interface IntegrityFinding {
  area:
    | "source_hierarchy"
    | "publication_guardrails"
    | "europe"
    | "united_states"
    | "case_law"
    | "seed_data";
  severity: IntegritySeverity;
  code: string;
  message: string;
  affectedId?: string;
}

export interface LegalDatabaseIntegrityReport {
  generatedAt: string;
  findings: IntegrityFinding[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
}

function pushIf(
  findings: IntegrityFinding[],
  condition: boolean,
  finding: IntegrityFinding,
) {
  if (condition) findings.push(finding);
}

function hasOfficialSourceReference(
  references: Array<{ sourceType: string }>,
) {
  return references.some((reference) =>
    [
      "official",
      "court",
      "regulator",
      "government",
      "parliament",
      "legislation",
      "policy",
      "standards_body",
    ].includes(reference.sourceType),
  );
}

function hasAnyPinpoint(
  references: Array<{ pinpoint?: object | null }>,
) {
  return references.some((reference) =>
    Object.values((reference.pinpoint ?? {}) as Record<string, unknown>).some((value) =>
      Boolean(value),
    ),
  );
}

function hasPublicationDate(
  references: Array<{ publicationDate?: string | null }>,
) {
  return references.some((reference) => Boolean(reference.publicationDate));
}

function hasSourceType(
  references: Array<{ sourceType: string }>,
  allowed: string[],
) {
  return references.some((reference) => allowed.includes(reference.sourceType));
}

function textSignalsManualReview(value: string | null | undefined) {
  if (!value) return false;
  return /require[s]?\s+(manual|legal-text|item-level|document-level)|pending more precise|topic page only|public metadata only|exact article-level pinpoints require review/i.test(
    value,
  );
}

function referencesLookLikeTopicPages(
  references: Array<{ title?: string; documentType?: string | null }>,
) {
  return references.some((reference) =>
    /topic page|subject page/i.test(
      `${reference.title ?? ""} ${reference.documentType ?? ""}`,
    ),
  );
}

function referencesHaveAccessibilityWarning(
  references: Array<{
    verificationStatus?: string;
    accessLimitations?: string | null;
  }>,
) {
  return references.some((reference) => {
    const access = reference.accessLimitations?.toLowerCase() ?? "";
    const verification = reference.verificationStatus?.toLowerCase() ?? "";
    return (
      verification.includes("manual") ||
      verification.includes("blocked") ||
      verification.includes("inaccessible") ||
      access.includes("403") ||
      access.includes("blocked") ||
      access.includes("inaccessible")
    );
  });
}

function auditSourceHierarchy(): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  for (const entry of sourceDiscoveryRegistry) {
    if (
      ["secondary_tracker", "informal_discovery_source", "media_discovery_source"].includes(
        entry.authorityTier,
      ) &&
      entry.publicationAllowed
    ) {
      findings.push({
        area: "source_hierarchy",
        severity: "high",
        code: "non-official-publication-allowed",
        message:
          "A non-official source is incorrectly marked as publication-allowed.",
        affectedId: entry.id,
      });
    }
  }

  return findings;
}

function auditEuropeIntegrity(now: Date): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  const profiles = getEuropeCountryProfiles();

  pushIf(findings, profiles.length !== 27, {
    area: "europe",
    severity: "high",
    code: "eu-member-state-count",
    message: `Expected 27 EU Member State profiles, found ${profiles.length}.`,
  });

  for (const profile of profiles) {
    pushIf(findings, !isSupportedEuropeImplementationStatus(profile.implementationStatus), {
      area: "europe",
      severity: "high",
      code: "invalid-europe-status",
      message: "Country profile uses an unsupported implementation status.",
      affectedId: profile.slug,
    });

    const strongerStatus =
      profile.implementationStatus !== "needs_review" &&
      profile.implementationStatus !== "no_specific_national_implementation_verified";

    pushIf(findings, strongerStatus && !hasOfficialSourceReference(profile.sourceReferences), {
      area: "europe",
      severity: "high",
      code: "implemented-without-official-source",
      message:
        "A Europe country profile uses a stronger implementation label without an official source reference.",
      affectedId: profile.slug,
    });

    pushIf(findings, strongerStatus && !hasPublicationDate(profile.sourceReferences), {
      area: "europe",
      severity: "medium",
      code: "strong-status-without-dated-source",
      message:
        "A Europe country profile uses a stronger implementation label without any dated official source reference.",
      affectedId: profile.slug,
    });

    pushIf(
      findings,
      strongerStatus &&
        !hasSourceType(profile.sourceReferences, ["government", "legislation", "parliament"]),
      {
        area: "europe",
        severity: "medium",
        code: "strong-status-without-implementation-authority-source",
        message:
          "A Europe country profile uses a stronger implementation label without a government, legislation, or parliamentary source reference.",
        affectedId: profile.slug,
      },
    );

    const freshness = assessFreshness({
      lastReviewedAt: profile.lastReviewedDate,
      policy: "country_status",
      thresholdDaysOverride:
        profile.implementationStatus === "implementation_in_progress" ||
        profile.implementationStatus === "consultation_or_draft_identified" ||
        profile.implementationStatus === "national_implementation_identified" ||
        profile.implementationStatus === "competent_authority_designated"
          ? 45
          : profile.implementationStatus === "no_specific_national_implementation_verified"
            ? 60
            : 75,
      now,
    });

    pushIf(
      findings,
      strongerStatus &&
        ["due_for_review", "stale", "source_inaccessible"].includes(freshness.status),
      {
        area: "europe",
        severity: freshness.status === "stale" ? "high" : "medium",
        code: "strong-status-freshness-risk",
        message:
          "A Europe country profile with a stronger implementation label is due or stale under the tightened Europe freshness policy.",
        affectedId: profile.slug,
      },
    );
  }

  for (const item of euAiTimelineEntries) {
    pushIf(findings, item.sourceReferences.length === 0 || !item.sourceUrl, {
      area: "europe",
      severity: "high",
      code: "timeline-missing-source",
      message: "An EU timeline milestone is missing an official source reference or source URL.",
      affectedId: item.id,
    });
  }

  const aiActCitation = assessCitationQuality(europeAiActBaseline.sourceReferences);
  pushIf(
    findings,
    europeAiActBaseline.citationQualityStatus === "complete" ||
      aiActCitation.qualityStatus === "complete",
    {
      area: "europe",
      severity: "high",
      code: "eu-ai-act-overclaimed-completeness",
      message:
        "The EU AI Act baseline should remain conservative and must not be marked complete unless exact extraction is fully verified.",
      affectedId: europeAiActBaseline.id,
    },
  );

  for (const actor of europeGovernanceActors) {
    pushIf(
      findings,
      actor.citationQualityStatus === "complete" && textSignalsManualReview(actor.legalBasis),
      {
        area: "europe",
        severity: "medium",
        code: "governance-complete-despite-review-note",
        message:
          "A Europe governance actor is marked complete even though its legal-basis notes still say more precise review is required.",
        affectedId: actor.id,
      },
    );

    pushIf(
      findings,
      actor.citationQualityStatus === "complete" &&
        referencesLookLikeTopicPages(actor.sourceReferences) &&
        !hasAnyPinpoint(actor.sourceReferences),
      {
        area: "europe",
        severity: "medium",
        code: "governance-topic-page-overprecision",
        message:
          "A Europe governance actor is marked complete based only on high-level topic or institutional pages without pinpointed legal support.",
        affectedId: actor.id,
      },
    );
  }

  for (const item of europeAiSoftLawBaseline) {
    pushIf(
      findings,
      item.bindingStatus === "non_binding" && item.sourceReferences.length === 0,
      {
        area: "europe",
        severity: "medium",
        code: "soft-law-misclassified",
        message: "A Europe soft-law item is marked non-binding but lacks source support.",
        affectedId: item.id,
      },
    );

    pushIf(
      findings,
      item.citationQualityStatus === "complete" &&
        (item.limitations.some((limitation) => textSignalsManualReview(limitation)) ||
          referencesLookLikeTopicPages(item.sourceReferences)) &&
        !hasAnyPinpoint(item.sourceReferences),
      {
        area: "europe",
        severity: "medium",
        code: "soft-law-complete-despite-high-level-source",
        message:
          "A Europe soft-law entry is marked complete even though the source is still a high-level topic/metadata page or the entry notes further item-level review limitations.",
        affectedId: item.id,
      },
    );

    pushIf(
      findings,
      item.citationQualityStatus !== "needs_manual_verification" &&
        referencesHaveAccessibilityWarning(item.sourceReferences),
      {
        area: "europe",
        severity: "medium",
        code: "soft-law-accessibility-mismatch",
        message:
          "A Europe soft-law entry has source accessibility/manual-review warnings but is not flagged conservatively enough in citation status.",
        affectedId: item.id,
      },
    );
  }

  return findings;
}

function auditUnitedStatesIntegrity(): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  const profiles = getUsStateAiLawProfiles();

  pushIf(findings, profiles.length !== 51, {
    area: "united_states",
    severity: "high",
    code: "us-state-count",
    message: `Expected 51 U.S. state profiles including D.C., found ${profiles.length}.`,
  });

  for (const profile of profiles) {
    pushIf(findings, !(profile.aiLawStatus in usStateAiLawStatusTaxonomy), {
      area: "united_states",
      severity: "high",
      code: "invalid-us-status",
      message: "State profile uses an unsupported AI law status.",
      affectedId: profile.slug,
    });

    const enactedOrPending =
      profile.aiLawStatus.startsWith("enacted_") ||
      profile.aiLawStatus === "pending_ai_legislation" ||
      profile.aiLawStatus === "agency_guidance_or_enforcement";

    pushIf(findings, enactedOrPending && !hasOfficialSourceReference(profile.sourceReferences), {
      area: "united_states",
      severity: "high",
      code: "state-status-without-official-source",
      message:
        "A U.S. state profile uses an enacted, pending, or agency-activity label without an official source reference.",
      affectedId: profile.slug,
    });
  }

  for (const entry of usFederalBaselineEntries) {
    pushIf(findings, !entry.officialSourceUrl || entry.sourceReferences.length === 0, {
      area: "united_states",
      severity: "high",
      code: "federal-baseline-missing-source",
      message:
        "A federal baseline entry is missing an official source URL or source references.",
      affectedId: entry.id,
    });
  }

  for (const item of usFederalTimelineEntries) {
    pushIf(findings, !item.sourceUrl || item.sourceReferences.length === 0, {
      area: "united_states",
      severity: "high",
      code: "us-timeline-missing-source",
      message:
        "A U.S. timeline milestone is missing a source URL or structured source references.",
      affectedId: item.id,
    });
  }

  return findings;
}

function auditCaseLawIntegrity(): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  for (const entry of [...europeAiCaseLawEntries, ...usAiCaseLawEntries]) {
    const hasReference = entry.sourceReferences.length > 0;
    const hasPrimaryUrl = Boolean(
      "officialSourceUrl" in entry ? entry.officialSourceUrl : undefined,
    );
    pushIf(findings, !hasReference || !hasPrimaryUrl, {
      area: "case_law",
      severity: "high",
      code: "case-law-missing-source",
      message:
        "A case-law or administrative decision entry is missing court/authority citation support.",
      affectedId: entry.id,
    });

    pushIf(
      findings,
      Boolean("outcomeOrHolding" in entry ? entry.outcomeOrHolding : entry.holdingOrOutcome) &&
        !(
          Boolean("ecli" in entry ? entry.ecli : entry.citation) ||
          Boolean("docketOrCaseNumber" in entry ? entry.docketOrCaseNumber : entry.docketNumber) ||
          hasAnyPinpoint(entry.sourceReferences)
        ),
      {
        area: "case_law",
        severity: "medium",
        code: "case-law-outcome-without-identifier",
        message:
          "A case-law entry includes an outcome summary without sufficient official identifying citation data.",
        affectedId: entry.id,
      },
    );
  }
  return findings;
}

function auditSeedIntegrity(): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  const dataset = buildSeedDataset("production_safe");

  pushIf(
    findings,
    dataset.updates.some(
      (update) => update.status !== "needs_review" || update.publishedAt !== null,
    ),
    {
      area: "seed_data",
      severity: "high",
      code: "production-seed-not-private",
      message:
        "Production-safe seed data is exposing reviewed or published monitor items.",
    },
  );

  pushIf(findings, dataset.sourceReferences.length === 0, {
    area: "seed_data",
    severity: "medium",
    code: "seed-missing-source-references",
    message: "Seed dataset does not provide any normalized source references.",
  });

  for (const reference of dataset.sourceReferences) {
    const assessment = assessCitationQuality([reference]);
    pushIf(findings, assessment.qualityStatus === "missing_official_source", {
      area: "seed_data",
      severity: "medium",
      code: "seed-reference-missing-official-source",
      message:
        "A seeded source reference is missing official-source characteristics.",
      affectedId: reference.id,
    });
  }

  return findings;
}

export function buildLegalDatabaseIntegrityReport(
  now = new Date(),
): LegalDatabaseIntegrityReport {
  const findings = [
    ...auditSourceHierarchy(),
    ...auditEuropeIntegrity(now),
    ...auditUnitedStatesIntegrity(),
    ...auditCaseLawIntegrity(),
    ...auditSeedIntegrity(),
  ];

  return {
    generatedAt: now.toISOString(),
    findings,
    summary: {
      total: findings.length,
      high: findings.filter((finding) => finding.severity === "high").length,
      medium: findings.filter((finding) => finding.severity === "medium").length,
      low: findings.filter((finding) => finding.severity === "low").length,
    },
  };
}
