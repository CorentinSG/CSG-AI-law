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
  ARTICLE_50_MARKING_GRACE_DATE,
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

  it("only cites https official sources", () => {
    for (const source of article50Sources) {
      expect(source.href.startsWith("https://")).toBe(true);
      expect(
        source.href.includes("europa.eu") || source.href.includes("eur-lex"),
      ).toBe(true);
    }
  });
});
