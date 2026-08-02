/** Tolerance for "today" across timezones and clock skew. */
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the date unchanged unless it lies in the future, in which case it
 * returns null. Sources sometimes publish mis-parsed or genuinely future
 * dates; the public monitor sorts by date, so one future-dated item would sit
 * pinned above every real development until that date arrives. A missing date
 * is honest — a future date on a legal monitor is wrong.
 */
export function clampFutureIsoDate(
  iso: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  if (parsed > now.getTime() + FUTURE_TOLERANCE_MS) return null;
  return iso;
}
