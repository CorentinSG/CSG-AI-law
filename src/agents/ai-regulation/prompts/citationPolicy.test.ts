import { describe, expect, it } from "vitest";

import { buildRegulatoryAnalysisPrompt } from "@/agents/ai-regulation/prompts/regulatoryAnalysisPrompt";

describe("AI prompt citation policy", () => {
  it("instructs OpenAI prompts not to invent citations", () => {
    const prompt = buildRegulatoryAnalysisPrompt({
      sourceName: "EU AI Office",
      sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
      title: "AI Office implementation guidance",
      publicationDate: "2026-05-27",
      text: "Official source text.",
      jurisdiction: "European Union",
      region: "Europe",
      country: "European Union",
    });

    expect(prompt).toContain("Do not invent citations");
    expect(prompt).toContain("article numbers");
    expect(prompt).toContain("URLs");
  });
});
