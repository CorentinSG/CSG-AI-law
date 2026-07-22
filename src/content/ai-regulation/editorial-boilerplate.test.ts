import { describe, expect, it } from "vitest";

import { stripCurationBoilerplate } from "@/content/ai-regulation/editorial-boilerplate";

describe("stripCurationBoilerplate", () => {
  it("removes extractor fallbacks and curation instructions, keeps substance", () => {
    const result = stripCurationBoilerplate([
      "No binding obligations were identified in the reviewed source.",
      "No clear deadline was detected in the reviewed source.",
      "Use the official source as the primary authority for this country-specific database entry.",
      "Separate official national Austrian sources from EU baseline entries and from media-only live news.",
      "Map each item to the legal-area, authority-type and country axes so the Austria page can be filtered by domain.",
      "Do not publish this discovery lead directly.",
      "Providers of high-risk AI systems must register in the EU database before placing on the market.",
    ]);

    expect(result).toEqual([
      "Providers of high-risk AI systems must register in the EU database before placing on the market.",
    ]);
  });

  it("removes discovery-lead audience placeholders", () => {
    expect(
      stripCurationBoilerplate([
        "Editorial reviewers",
        "Legal intelligence researchers",
        "AI regulation monitoring team",
        "Austrian AI providers and deployers",
      ]),
    ).toEqual(["Austrian AI providers and deployers"]);
  });
});
