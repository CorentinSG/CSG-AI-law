export const freshnessStatuses = [
  "fresh",
  "due_for_review",
  "stale",
  "source_inaccessible",
  "needs_manual_review",
] as const;

export type FreshnessStatus = (typeof freshnessStatuses)[number];

export const freshnessPolicyKeys = [
  "active_source",
  "country_status",
  "state_status",
  "timeline_milestone",
  "case_law",
  "soft_law",
  "discovery_lead",
] as const;

export type FreshnessPolicyKey = (typeof freshnessPolicyKeys)[number];

export interface FreshnessAssessment {
  status: FreshnessStatus;
  ageDays: number | null;
  thresholdDays: number;
  nextReviewAt: string | null;
  warnings: string[];
}

export const freshnessThresholdDays: Record<FreshnessPolicyKey, number> = {
  active_source: 2,
  country_status: 90,
  state_status: 90,
  timeline_milestone: 30,
  case_law: 60,
  soft_law: 90,
  discovery_lead: 14,
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function assessFreshness(input: {
  lastReviewedAt: string | null | undefined;
  policy: FreshnessPolicyKey;
  thresholdDaysOverride?: number;
  now?: Date;
  sourceAccessible?: boolean | null;
  manualReviewRequired?: boolean;
}): FreshnessAssessment {
  const now = input.now ?? new Date();
  const thresholdDays = input.thresholdDaysOverride ?? freshnessThresholdDays[input.policy];
  const warnings: string[] = [];

  if (input.sourceAccessible === false) {
    warnings.push("Source is currently inaccessible from runtime or verification metadata.");
    return {
      status: "source_inaccessible",
      ageDays: null,
      thresholdDays,
      nextReviewAt: null,
      warnings,
    };
  }

  if (input.manualReviewRequired) {
    warnings.push("Manual review is required before this data can be treated as current.");
  }

  const reviewedAt = parseDate(input.lastReviewedAt);
  if (!reviewedAt) {
    warnings.push("No last-reviewed or last-verified timestamp is available.");
    return {
      status: "needs_manual_review",
      ageDays: null,
      thresholdDays,
      nextReviewAt: null,
      warnings,
    };
  }

  const ageDays = Math.max(0, daysBetween(reviewedAt, now));
  const nextReview = new Date(reviewedAt);
  nextReview.setUTCDate(nextReview.getUTCDate() + thresholdDays);

  if (ageDays > thresholdDays) {
    warnings.push(`Review age is ${ageDays} days, above the ${thresholdDays}-day threshold.`);
    return {
      status: "stale",
      ageDays,
      thresholdDays,
      nextReviewAt: nextReview.toISOString(),
      warnings,
    };
  }

  if (ageDays >= Math.ceil(thresholdDays * 0.75) || input.manualReviewRequired) {
    if (ageDays >= Math.ceil(thresholdDays * 0.75)) {
      warnings.push("Review window is approaching its freshness threshold.");
    }
    return {
      status: "due_for_review",
      ageDays,
      thresholdDays,
      nextReviewAt: nextReview.toISOString(),
      warnings,
    };
  }

  return {
    status: "fresh",
    ageDays,
    thresholdDays,
    nextReviewAt: nextReview.toISOString(),
    warnings,
  };
}
