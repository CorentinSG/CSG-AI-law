import { describe, expect, it } from "vitest";

import {
  article50Duties,
  article50Groups,
  article50Items,
  article50ScenarioCategories,
  article50Scenarios,
  article50Situations,
  article50Sources,
  article50Templates,
  ARTICLE_50_APPLICATION_DATE,
  ARTICLE_50_LAST_REVIEWED,
  ARTICLE_50_MARKING_GRACE_DATE,
  ARTICLE_50_OMNIBUS_NOTE,
  ARTICLE_50_PENALTIES,
  getArticle50DutiesForSituations,
} from "./article-50-checklist";

function ids(list: { id: string }[]) {
  return list.map((entry) => entry.id);
}

function expectUnique(list: string[]) {
  expect(new Set(list).size).toBe(list.length);
}

describe("article 50 checklist content integrity", () => {
  it("uses unique ids everywhere", () => {
    expectUnique(ids(article50Items));
    expectUnique(ids(article50Groups));
    expectUnique(ids(article50Duties));
    expectUnique(ids(article50Situations));
    expectUnique(ids(article50Scenarios));
    expectUnique(ids(article50Templates));
  });

  it("keeps every checklist item in a declared group", () => {
    const groupIds = new Set(ids(article50Groups));
    for (const item of article50Items) {
      expect(groupIds.has(item.group)).toBe(true);
    }
  });

  it("keeps every duty pointing at declared checklist groups", () => {
    const groupIds = new Set(ids(article50Groups));
    for (const duty of article50Duties) {
      expect(duty.groups.length).toBeGreaterThan(0);
      for (const group of duty.groups) {
        expect(groupIds.has(group)).toBe(true);
      }
    }
  });

  it("keeps every triage situation pointing at declared duties", () => {
    const dutyIds = new Set(ids(article50Duties));
    for (const situation of article50Situations) {
      expect(situation.duties.length).toBeGreaterThan(0);
      for (const duty of situation.duties) {
        expect(dutyIds.has(duty)).toBe(true);
      }
    }
  });

  it("keeps every scenario in a declared category with substance", () => {
    const categoryIds = new Set(ids(article50ScenarioCategories));
    for (const scenario of article50Scenarios) {
      expect(categoryIds.has(scenario.category)).toBe(true);
      expect(scenario.applies.length).toBeGreaterThan(0);
    }
  });

  it("resolves triage selections to the union of duties", () => {
    expect(getArticle50DutiesForSituations([])).toEqual([]);

    const all = getArticle50DutiesForSituations(ids(article50Situations));
    expect(ids(all).sort()).toEqual(ids(article50Duties).sort());

    const one = getArticle50DutiesForSituations(["sit-biometric"]);
    expect(ids(one)).toEqual(["duty-50-3"]);
  });

  it("pins the legal dates the UI displays", () => {
    expect(ARTICLE_50_APPLICATION_DATE).toBe("2026-08-02");
    expect(ARTICLE_50_MARKING_GRACE_DATE).toBe("2026-12-02");
  });

  it("states the penalty arithmetic in both directions, in both locales", () => {
    for (const lang of ["en", "fr"] as const) {
      const p = ARTICLE_50_PENALTIES[lang];
      // Undertakings pay the higher figure; SMEs the lower. Losing either half
      // of that contrast is the failure mode this guards against.
      expect(p.company).toMatch(/higher|plus élevé/i);
      expect(p.sme).toMatch(/lower|plus bas/i);
      expect(p.sme).toMatch(/99\(6\)/);
      expect(p.headline).toMatch(/15|3\s?%/);
      expect(p.institutions).toMatch(/750/);
    }
  });

  it("keeps the Omnibus note saying Article 50 was NOT postponed", () => {
    expect(ARTICLE_50_OMNIBUS_NOTE.en).toMatch(/did not postpone Article 50/i);
    expect(ARTICLE_50_OMNIBUS_NOTE.fr).toMatch(/pas reporté l'article 50/i);
    // It did amend 50(2) — that is where the December date comes from.
    for (const lang of ["en", "fr"] as const) {
      expect(ARTICLE_50_OMNIBUS_NOTE[lang]).toMatch(/50\(2\)/);
    }
  });

  it("flags the public-interest topic list as illustrative, not exhaustive", () => {
    const item = article50Items.find(
      (entry) => entry.id === "deployer-public-interest-text",
    );
    expect(item).toBeDefined();
    expect(item!.actions.join(" ")).toMatch(/illustrative, not exhaustive/i);
  });

  it("carries a review date so the page can be dated", () => {
    expect(ARTICLE_50_LAST_REVIEWED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("only cites https official sources", () => {
    for (const source of article50Sources) {
      expect(source.href.startsWith("https://")).toBe(true);
      expect(
        source.href.includes("europa.eu") || source.href.includes("eur-lex"),
      ).toBe(true);
    }
  });
});
