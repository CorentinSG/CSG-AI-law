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

  it("seeds aggressive France journalistic discovery sources as non-authority lanes", () => {
    const dataset = buildSeedDataset("demo");
    const aggressiveFranceIds = [
      "src-fr-legal-press-newsapi-ai",
      "src-fr-tech-policy-newsapi-ai",
      "src-fr-general-press-newsapi-ai",
      "src-fr-eu-policy-newsapi-ai",
      "src-fr-sector-press-newsapi-ai",
      "src-fr-aggressive-gdelt-ai",
    ];

    const sources = dataset.sources.filter((source) =>
      aggressiveFranceIds.includes(source.id),
    );

    expect(sources.map((source) => source.id).sort()).toEqual(
      [...aggressiveFranceIds].sort(),
    );
    expect(sources.every((source) => source.country === "France")).toBe(true);
    expect(sources.every((source) => source.jurisdiction === "France")).toBe(true);
    expect(sources.every((source) => source.active)).toBe(true);
    expect(
      sources.every((source) => source.preferredExtractionMethod === "api"),
    ).toBe(true);
    expect(
      sources.every((source) => source.notes.toLowerCase().includes("discovery-only")),
    ).toBe(true);
    expect(
      sources.every((source) =>
        source.notes
          .toLowerCase()
          .includes("legal authority without official-source confirmation"),
      ),
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
