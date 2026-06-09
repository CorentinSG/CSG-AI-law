import { describe, expect, it } from "vitest";

import { buildRegulatoryClassificationPrompt } from "@/agents/ai-regulation/prompts/classificationPrompt";
import { buildObligationExtractionPrompt } from "@/agents/ai-regulation/prompts/obligationExtractionPrompt";
import { buildRegulatorySummaryPrompt } from "@/agents/ai-regulation/prompts/regulatorySummaryPrompt";

const base = {
  sourceName: "EU AI Office",
  sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
  title: "AI Office implementation guidance",
  publicationDate: "2026-05-27",
  text: "Official source text.",
};

describe("AI prompt citation policy", () => {
  it("instructs OpenAI prompts not to invent citations", () => {
    const prompts = [
      buildRegulatoryClassificationPrompt({
        ...base,
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
      }),
      buildRegulatorySummaryPrompt({
        ...base,
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
        developmentType: "Agency guidance",
        legalArea: "AI governance",
      }),
      buildObligationExtractionPrompt(base),
    ];

    for (const prompt of prompts) {
      expect(prompt).toContain("Do not invent citations");
      expect(prompt).toContain("article numbers");
      expect(prompt).toContain("URLs");
    }
  });
});
