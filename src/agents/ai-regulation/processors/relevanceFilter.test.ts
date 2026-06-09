import { describe, expect, it } from "vitest";

import { relevanceFilter } from "@/agents/ai-regulation/processors/relevanceFilter";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";

const source: RegulationSource = {
  id: "src-test",
  name: "Official Government AI Monitor",
  jurisdiction: "United States federal",
  region: "North America",
  country: "United States",
  sourceUrl: "https://example.gov/ai",
  sourceType: "static_page",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "Official government AI guidance source",
  reliabilityLevel: "high",
  preferredExtractionMethod: "html_static",
  config: {},
  createdAt: "2026-05-24T00:00:00.000Z",
  updatedAt: "2026-05-24T00:00:00.000Z",
};

function makeCandidate(overrides: Partial<ExtractedCandidateItem>): ExtractedCandidateItem {
  return {
    title: "Untitled",
    url: "https://example.gov/item",
    text: "Default text",
    metadata: {},
    ...overrides,
  };
}

describe("relevanceFilter", () => {
  it("accepts AI items with regulatory context", () => {
    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "Draft AI transparency guidance for government agencies",
        text: "Official agency guidance on artificial intelligence governance, oversight, and compliance.",
      }),
      source,
    );

    expect(decision.relevant).toBe(true);
    expect(decision.matchedAiTerms.length).toBeGreaterThan(0);
    expect(decision.matchedRegulatoryTerms.length).toBeGreaterThan(0);
  });

  it("rejects AI-adjacent content without legal-regulatory context", () => {
    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "Business case study on machine learning adoption",
        text: "A business blog post about model deployment wins and engineering lessons.",
      }),
      source,
    );

    expect(decision.relevant).toBe(false);
  });

  it("rejects denylisted newsletter-style content", () => {
    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "AI newsletter roundup",
        text: "A newsletter covering artificial intelligence headlines and market chatter.",
      }),
      source,
    );

    expect(decision.relevant).toBe(false);
    expect(decision.reason).toContain("denylist");
  });

  it("accepts AI regulatory materials from newly added supervisory sources", () => {
    const euSource: RegulationSource = {
      ...source,
      id: "src-edpb-ai",
      name: "European Data Protection Board Artificial Intelligence",
      jurisdiction: "European Union",
      region: "Europe",
      country: "European Union",
      sourceUrl:
        "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
      notes: "Official EDPB AI guidance and opinions",
    };

    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "EDPB-EDPS Joint opinion on the implementation of harmonised rules on artificial intelligence",
        text: "Official opinion on the AI Act, data protection safeguards, and supervisory consistency.",
      }),
      euSource,
    );

    expect(decision.relevant).toBe(true);
    expect(decision.matchedRegulatoryTerms).toContain("opinion");
  });

  it("accepts governance framework materials such as NIST AI RMF", () => {
    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "NIST AI RMF profile for generative AI",
        text: "Official AI risk management framework profile on lifecycle management, AI assurance, and risk controls.",
      }),
      source,
    );

    expect(decision.relevant).toBe(true);
    expect(decision.matchedAiTerms).toContain("nist ai rmf");
  });

  it("accepts best-practice AI governance materials such as OWASP AIMA", () => {
    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "OWASP AIMA best-practice benchmark for AI security governance",
        text: "Best-practice material covering AI security, model governance, and responsible AI lifecycle management.",
      }),
      source,
    );

    expect(decision.relevant).toBe(true);
    expect(decision.matchedRegulatoryTerms).toContain("best-practice");
  });

  it("accepts standards-oriented AI management system materials such as ISO/IEC 42001", () => {
    const decision = relevanceFilter.evaluate(
      makeCandidate({
        title: "ISO/IEC 42001 artificial intelligence management system standard",
        text: "Official metadata for an AI management systems standard covering conformity assessment and responsible AI governance.",
      }),
      source,
    );

    expect(decision.relevant).toBe(true);
    expect(decision.matchedAiTerms).toContain("iso/iec 42001");
  });
});
