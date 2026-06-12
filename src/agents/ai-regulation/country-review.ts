const MS_PER_DAY = 86_400_000;

export const COUNTRY_REVIEW_DUE_SOON_DAYS = 60;
export const COUNTRY_REVIEW_OVERDUE_DAYS = 90;

export function computeCountryNeedsReReview(
  lastReviewedAt: string | null | undefined,
  now: Date = new Date(),
) {
  if (!lastReviewedAt) return true;

  const reviewedAt = new Date(lastReviewedAt);
  if (Number.isNaN(reviewedAt.getTime())) return true;

  const ageDays = Math.floor((now.getTime() - reviewedAt.getTime()) / MS_PER_DAY);
  return ageDays >= COUNTRY_REVIEW_DUE_SOON_DAYS;
}
