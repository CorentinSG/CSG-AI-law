import type { EuNewsClassification } from "@/agents/ai-regulation/euNewsClassification";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";
import type {
  FranceMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/franceNewsSources";
import type {
  SpainMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/spainNewsSources";
import type {
  ItalyMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/italyNewsSources";
import type {
  GermanyMonitoringSourceDescriptor,
} from "@/agents/ai-regulation/germanyNewsSources";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";

export type NewsFreshnessLabel = "breaking" | "current" | "watch" | "stale";
export type SourceFreshnessStatus =
  | "fresh"
  | "due_for_refresh"
  | "stale"
  | "source_inaccessible";
export type ReviewUrgency = "high" | "medium" | "low";

export interface NewsCurrentnessAssessment {
  freshnessLabel: NewsFreshnessLabel;
  currentnessScore: number;
  reviewUrgency: ReviewUrgency;
  ageHours: number | null;
  dueForRefresh: boolean;
  reasons: string[];
}

export interface SourceCurrentnessAssessment {
  freshnessStatus: SourceFreshnessStatus;
  hoursSinceCheck: number | null;
  dueForRefresh: boolean;
  reasons: string[];
}

type RegionalMonitoringSourceDescriptor =
  | FranceMonitoringSourceDescriptor
  | SpainMonitoringSourceDescriptor
  | ItalyMonitoringSourceDescriptor
  | GermanyMonitoringSourceDescriptor;

function hoursSince(value: string | null | undefined, now = new Date()) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, (now.getTime() - parsed.getTime()) / 36e5);
}

function roundScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getFreshnessLabel(
  ageHours: number | null,
  descriptor?: RegionalMonitoringSourceDescriptor,
) {
  const freshHours = descriptor?.freshHours ?? 24;
  const watchHours = descriptor?.watchHours ?? 72;
  const staleHours = descriptor?.staleHours ?? 168;

  if (ageHours === null) return "watch" as const;
  if (ageHours <= Math.max(2, freshHours / 2)) return "breaking" as const;
  if (ageHours <= freshHours) return "current" as const;
  if (ageHours <= watchHours) return "watch" as const;
  if (ageHours > staleHours) return "stale" as const;
  return "watch" as const;
}

function getVerificationWeight(item: Pick<AiLawNewsItem, "verificationStatus" | "officialSourceFound">) {
  if (item.verificationStatus === "official_verified" || item.officialSourceFound) return 24;
  if (item.verificationStatus === "corroborated") return 18;
  if (item.verificationStatus === "published_news") return 16;
  if (item.verificationStatus === "needs_official_source") return 6;
  if (item.verificationStatus === "discovery_only" || item.verificationStatus === "media_reported") {
    return 2;
  }
  return 10;
}

function getReliabilityWeight(
  item: Pick<AiLawNewsItem, "sourceReliability" | "sourceType">,
  descriptor?: RegionalMonitoringSourceDescriptor,
) {
  if (item.sourceType === "official_source") return descriptor?.priorityBand === "high" ? 20 : 16;
  if (item.sourceReliability === "reputable_secondary") return 8;
  if (item.sourceReliability === "tracker_secondary") return 6;
  return 3;
}

function getLegalSignalWeight(classification: EuNewsClassification) {
  if (classification.hardLaw) return 28;
  if (classification.caseLaw || classification.enforcement) return 22;
  if (classification.softLaw) return 14;
  return 8;
}

function getAgeWeight(label: NewsFreshnessLabel) {
  switch (label) {
    case "breaking":
      return 28;
    case "current":
      return 20;
    case "watch":
      return 10;
    case "stale":
    default:
      return 2;
  }
}

export function assessNewsCurrentness(
  item: AiLawNewsItem,
  classification: EuNewsClassification,
  descriptor?: RegionalMonitoringSourceDescriptor | null,
  now = new Date(),
): NewsCurrentnessAssessment {
  const ageHours = hoursSince(
    item.publicationDate ?? item.exactDateOfInformation ?? item.detectedAt,
    now,
  );
  const freshnessLabel = getFreshnessLabel(ageHours, descriptor ?? undefined);
  const dueForRefresh =
    ageHours === null
      ? true
      : descriptor
        ? ageHours > descriptor.freshHours
        : ageHours > 24;
  const reasons: string[] = [];

  if (freshnessLabel === "breaking") reasons.push("Very recent legal signal.");
  else if (freshnessLabel === "current") reasons.push("Recently published or detected.");
  else if (freshnessLabel === "watch") reasons.push("Still relevant, but no longer immediate.");
  else reasons.push("Signal is ageing and should be refreshed or deprioritised.");

  if (classification.hardLaw) reasons.push("Hard-law or implementation signal.");
  else if (classification.caseLaw || classification.enforcement) {
    reasons.push("Decision or enforcement signal.");
  } else if (classification.softLaw) {
    reasons.push("Official guidance or governance signal.");
  }

  if (item.officialSourceFound || item.verificationStatus === "official_verified") {
    reasons.push("Official-source support is present.");
  } else if (
    item.verificationStatus === "needs_official_source" ||
    item.verificationStatus === "discovery_only" ||
    item.verificationStatus === "media_reported"
  ) {
    reasons.push("Official confirmation is still pending.");
  }

  let reviewUrgency: ReviewUrgency = "low";
  if (
    (classification.hardLaw || classification.caseLaw || classification.enforcement) &&
    freshnessLabel !== "stale"
  ) {
    reviewUrgency = item.officialSourceFound ? "high" : "medium";
  } else if (freshnessLabel === "breaking" || freshnessLabel === "current") {
    reviewUrgency = item.officialSourceFound ? "medium" : "low";
  }

  const currentnessScore = roundScore(
    getAgeWeight(freshnessLabel) +
      getLegalSignalWeight(classification) +
      getVerificationWeight(item) +
      getReliabilityWeight(item, descriptor ?? undefined),
  );

  return {
    freshnessLabel,
    currentnessScore,
    reviewUrgency,
    ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
    dueForRefresh,
    reasons,
  };
}

export function assessSourceCurrentness(
  check: SourceHealthCheck,
  descriptor?: RegionalMonitoringSourceDescriptor | null,
  now = new Date(),
): SourceCurrentnessAssessment {
  const hours = hoursSince(check.checkedAt, now);
  const reasons: string[] = [];

  if (check.runtimeAccessible === false || check.activeRecommendation === "inactive") {
    reasons.push("Source is currently inaccessible or marked inactive.");
    return {
      freshnessStatus: "source_inaccessible",
      hoursSinceCheck: hours === null ? null : Math.round(hours * 10) / 10,
      dueForRefresh: true,
      reasons,
    };
  }

  const freshHours = descriptor?.freshHours ?? 24;
  const staleHours = descriptor?.staleHours ?? 168;

  if (hours === null) {
    reasons.push("No runtime source-health timestamp is available.");
    return {
      freshnessStatus: "due_for_refresh",
      hoursSinceCheck: null,
      dueForRefresh: true,
      reasons,
    };
  }

  if (hours <= freshHours) {
    reasons.push("Source was checked within its fresh monitoring window.");
    return {
      freshnessStatus: "fresh",
      hoursSinceCheck: Math.round(hours * 10) / 10,
      dueForRefresh: false,
      reasons,
    };
  }

  if (hours > staleHours) {
    reasons.push("Source health snapshot is stale for this source cadence.");
    return {
      freshnessStatus: "stale",
      hoursSinceCheck: Math.round(hours * 10) / 10,
      dueForRefresh: true,
      reasons,
    };
  }

  reasons.push("Source should be refreshed soon based on its monitoring cadence.");
  return {
    freshnessStatus: "due_for_refresh",
    hoursSinceCheck: Math.round(hours * 10) / 10,
    dueForRefresh: true,
    reasons,
  };
}

export function getFreshnessLabelDisplay(label: NewsFreshnessLabel) {
  switch (label) {
    case "breaking":
      return "Breaking";
    case "current":
      return "Current";
    case "watch":
      return "Watch";
    case "stale":
    default:
      return "Stale";
  }
}

export function getSourceFreshnessDisplay(status: SourceFreshnessStatus) {
  switch (status) {
    case "fresh":
      return "Fresh";
    case "due_for_refresh":
      return "Due for refresh";
    case "stale":
      return "Stale";
    case "source_inaccessible":
    default:
      return "Source inaccessible";
  }
}
