import { describe, expect, it } from "vitest";

import { isBelgiumNewsItem } from "@/agents/ai-regulation/belgiumLegalNewsAgent";

const base = {
  countryOrState: "Belgium",
  jurisdiction: "Belgium",
  region: "Europe",
  title: "",
  shortSummary: "",
  legalArea: "",
  topicTags: [] as string[],
  authorityType: "",
  developmentType: "",
};

describe("Belgium legal-news relevance", () => {
  it.each([
    "L'APD publie une décision sur l'intelligence artificielle et le profilage",
    "Justel publiceert nieuwe wet over artificiële intelligentie",
    "La Cour examine une décision automatisée au regard de l'AI Act",
  ])("accepts Belgian AI legal signal: %s", (title) => {
    expect(isBelgiumNewsItem({ ...base, title })).toBe(true);
  });

  it("rejects generic Belgian technology news without a legal signal", () => {
    expect(
      isBelgiumNewsItem({
        ...base,
        title: "Une startup belge présente une nouvelle puce IA",
        shortSummary: "La société prépare une levée de fonds.",
      }),
    ).toBe(false);
  });
});
