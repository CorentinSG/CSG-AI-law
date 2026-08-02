import { describe, expect, it } from "vitest";

import { clampFutureIsoDate } from "./dates";

const NOW = new Date("2026-08-02T12:00:00.000Z");

describe("clampFutureIsoDate", () => {
  it("keeps past and present dates", () => {
    expect(clampFutureIsoDate("2026-07-28", NOW)).toBe("2026-07-28");
    expect(clampFutureIsoDate("2026-08-02T11:00:00.000Z", NOW)).toBe(
      "2026-08-02T11:00:00.000Z",
    );
  });

  // Timezone and clock-skew tolerance: "tomorrow" from a source one day ahead
  // is not a data defect.
  it("tolerates dates within 24 hours ahead", () => {
    expect(clampFutureIsoDate("2026-08-03T06:00:00.000Z", NOW)).toBe(
      "2026-08-03T06:00:00.000Z",
    );
  });

  // The observed defect: an item dated a month ahead sat pinned at the top of
  // the public monitor above every real development.
  it("drops dates further in the future", () => {
    expect(clampFutureIsoDate("2026-09-02", NOW)).toBeNull();
  });

  it("drops unparseable and missing dates", () => {
    expect(clampFutureIsoDate("not a date", NOW)).toBeNull();
    expect(clampFutureIsoDate(null, NOW)).toBeNull();
    expect(clampFutureIsoDate(undefined, NOW)).toBeNull();
  });
});
