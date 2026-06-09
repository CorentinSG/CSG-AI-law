import { describe, expect, it } from "vitest";

import {
  buildAuthorityTag,
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
  inferAuthorityType,
  parseAuthorityTag,
} from "@/agents/ai-regulation/utils/authority";

describe("authority helpers", () => {
  it("builds and parses stable authority tags", () => {
    const tag = buildAuthorityTag("Soft law");

    expect(tag).toBe("authority:soft-law");
    expect(parseAuthorityTag([tag])).toBe("Soft law");
  });

  it("classifies ISO/IEC 42001 as a technical standard", () => {
    const authority = inferAuthorityType({
      developmentType: "Standards document",
      title: "ISO/IEC 42001 artificial intelligence management system standard",
      text: "Official ISO metadata for an international standard.",
      sourceName: "ISO/IEC 42001",
    });

    expect(authority).toBe("Technical standard");
  });

  it("classifies NIST AI RMF materials as governance frameworks", () => {
    const authority = inferAuthorityType({
      developmentType: "Standards document",
      title: "NIST AI RMF profile for generative AI",
      text: "AI risk management framework profile and assurance guidance.",
      sourceName: "NIST AI Risk Management Framework",
    });

    expect(authority).toBe("Governance framework");
  });

  it("derives authority from tags before heuristics on saved updates", () => {
    const authority = deriveUpdateAuthorityType({
      developmentType: "Policy report",
      title: "OECD AI principles and policy work",
      summary: "Comparative material",
      sourceName: "OECD AI Policy Observatory",
      tags: ["authority:soft-law"],
    });

    expect(authority).toBe("Soft law");
  });

  it("provides a clear non-binding presentation for technical standards", () => {
    const presentation = getAuthorityPresentation("Technical standard");

    expect(presentation.label).toBe("Technical Standard");
    expect(presentation.shortNote).toContain("official metadata");
    expect(presentation.adminNotes.join(" ")).toContain("Paywalled full standard");
  });
});
