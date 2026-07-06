import { describe, expect, it } from "vitest";

import { isAustriaNewsItem } from "@/agents/ai-regulation/austriaLegalNewsAgent";

const base = {
  countryOrState: "Austria",
  jurisdiction: "Austria",
  region: "Europe",
  title: "",
  shortSummary: "",
  legalArea: "",
  topicTags: [] as string[],
  authorityType: "",
  developmentType: "",
};

describe("Austria legal-news relevance", () => {
  it.each([
    "DSB veröffentlicht Leitlinien zur KI-Verordnung und DSGVO",
    "RIS: Gericht entscheidet über automatisierte Entscheidung des AMS-Algorithmus",
    "RTR veröffentlicht AI Act Regulierung für KI-Systeme",
  ])("accepts Austrian AI legal signal: %s", (title) => {
    expect(isAustriaNewsItem({ ...base, title })).toBe(true);
  });

  it("rejects generic Austrian technology news without a legal signal", () => {
    expect(
      isAustriaNewsItem({
        ...base,
        title: "Österreichisches Startup präsentiert schnelleren KI-Chip",
        shortSummary: "Das Unternehmen plant eine neue Finanzierungsrunde.",
      }),
    ).toBe(false);
  });
});
