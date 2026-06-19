import { describe, expect, it } from "vitest";

import { buildSeedDataset } from "@/db/seed/seed-profiles";

describe("buildSeedDataset", () => {
  it("keeps production-safe seeded updates private except official auto-publications", () => {
    const dataset = buildSeedDataset("production_safe");
    expect(dataset.updates.length).toBeGreaterThan(0);
    expect(
      dataset.updates.every(
        (update) =>
          update.status === "needs_review" ||
          (update.status === "published" &&
            update.reviewedBy === "system:auto-official-source"),
      ),
    ).toBe(true);
    expect(
      dataset.updates
        .filter((update) => update.status === "needs_review")
        .every((update) => update.publishedAt === null),
    ).toBe(true);
    expect(dataset.reviewEvents).toEqual([]);
  });

  it("preserves demo statuses for the in-memory showcase store", () => {
    const dataset = buildSeedDataset("demo");
    expect(dataset.updates.some((update) => update.status === "published")).toBe(true);
  });

  it("builds normalized source-reference rows from seeded raw metadata", () => {
    const dataset = buildSeedDataset("demo");
    expect(dataset.sourceReferences.length).toBeGreaterThan(0);
    expect(
      dataset.sourceReferences.every(
        (reference) =>
          Boolean(reference.rawItemId) &&
          Boolean(reference.title) &&
          Boolean(reference.institution) &&
          Boolean(reference.url),
      ),
    ).toBe(true);
  });

  it("builds persisted news items from seeded updates", () => {
    const dataset = buildSeedDataset("demo");
    expect(dataset.newsItems.length).toBe(dataset.updates.length);
    expect(dataset.newsItems.every((item) => Boolean(item.slug))).toBe(true);
  });

  it("includes multiple official France legal-news items in the demo seed", () => {
    const dataset = buildSeedDataset("demo");
    const franceNews = dataset.newsItems.filter(
      (item) => item.countryOrState === "France" && item.region === "Europe",
    );

    expect(franceNews.length).toBeGreaterThanOrEqual(4);
    expect(franceNews.every((item) => item.sourceType === "official_source")).toBe(true);
    expect(
      franceNews.some((item) => item.title.includes("CNIL Annual Report 2025")),
    ).toBe(true);
  });

  it("builds normalized country intelligence seed records from Europe profiles", () => {
    const dataset = buildSeedDataset("demo");
    expect(dataset.countryIntelligence.length).toBeGreaterThan(0);
    expect(dataset.countryIntelligenceSources.length).toBeGreaterThan(0);

    const france = dataset.countryIntelligence.find((country) => country.slug === "france");
    expect(france?.region).toBe("Europe");
    expect(france?.countryCode).toBe("FR");

    const franceSources = dataset.countryIntelligenceSources.filter(
      (source) => source.countryId === france?.id,
    );
    expect(franceSources.length).toBeGreaterThan(0);
  });
});
