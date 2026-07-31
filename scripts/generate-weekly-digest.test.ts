import { describe, expect, it } from "vitest";

import {
  buildWeeklyDigestMarkdown,
  type DigestNewsItem,
  type DigestUpdate,
} from "./generate-weekly-digest";

const GENERATED_AT = "2026-07-31T06:00:00.000Z";

function update(overrides: Partial<DigestUpdate>): DigestUpdate {
  return {
    title: "Guidance on automated decision-making",
    jurisdiction: "France",
    legal_area: "Data protection",
    authority_type: "Agency guidance",
    source_name: "CNIL",
    source_url: "https://cnil.fr/guidance",
    publication_date: "2026-07-28",
    published_at: "2026-07-28T10:00:00Z",
    ...overrides,
  };
}

function newsItem(overrides: Partial<DigestNewsItem>): DigestNewsItem {
  return {
    title: "EDPB adopts anonymisation guidelines",
    jurisdiction: "European Union",
    short_summary: "The board adopted final guidelines on anonymisation.",
    source_name: "EDPB",
    slug: "edpb-anonymisation-guidelines",
    event_date: "2026-07-29",
    detected_at: "2026-07-29T09:00:00Z",
    ...overrides,
  };
}

describe("buildWeeklyDigestMarkdown", () => {
  it("assembles only what it was given — titles, sources, dates, links", () => {
    const markdown = buildWeeklyDigestMarkdown({
      updates: [update({})],
      news: [newsItem({})],
      windowDays: 7,
      generatedAtIso: GENERATED_AT,
    });

    expect(markdown).toContain("Guidance on automated decision-making");
    expect(markdown).toContain("[CNIL](https://cnil.fr/guidance)");
    expect(markdown).toContain("EDPB adopts anonymisation guidelines");
    expect(markdown).toContain("/news/edpb-anonymisation-guidelines");
    expect(markdown).toContain("2026-07-28");
  });

  // The draft banner is the contract with the owner: nothing goes live verbatim.
  it("marks itself a draft and says nothing was generated", () => {
    const markdown = buildWeeklyDigestMarkdown({
      updates: [update({})],
      news: [],
      windowDays: 7,
      generatedAtIso: GENERATED_AT,
    });

    expect(markdown).toContain("DRAFT");
    expect(markdown).toContain("Nothing below was generated");
    expect(markdown).toContain("publish nothing from it verbatim");
  });

  it("orders jurisdictions by volume, busiest first", () => {
    const markdown = buildWeeklyDigestMarkdown({
      updates: [
        update({ jurisdiction: "Austria" }),
        update({ jurisdiction: "France", title: "One" }),
        update({ jurisdiction: "France", title: "Two" }),
      ],
      news: [],
      windowDays: 7,
      generatedAtIso: GENERATED_AT,
    });

    expect(markdown.indexOf("### France (2)")).toBeLessThan(markdown.indexOf("### Austria (1)"));
  });

  it("says plainly when a window published nothing", () => {
    const markdown = buildWeeklyDigestMarkdown({
      updates: [],
      news: [],
      windowDays: 7,
      generatedAtIso: GENERATED_AT,
    });

    expect(markdown).toContain("Nothing was published in this window");
  });

  it("never fabricates a date", () => {
    const markdown = buildWeeklyDigestMarkdown({
      updates: [update({ publication_date: null, published_at: null })],
      news: [],
      windowDays: 7,
      generatedAtIso: GENERATED_AT,
    });

    expect(markdown).toContain("date not stated");
  });

  it("is deterministic for identical input", () => {
    const input = {
      updates: [update({})],
      news: [newsItem({})],
      windowDays: 7,
      generatedAtIso: GENERATED_AT,
    };

    expect(buildWeeklyDigestMarkdown(input)).toBe(buildWeeklyDigestMarkdown(input));
  });
});
