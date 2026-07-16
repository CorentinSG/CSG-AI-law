import { describe, expect, it } from "vitest";

import { internationalAiStandardsBaseline } from "@/content/ai-regulation/international-ai-standards";

describe("international AI standards baseline", () => {
  it("covers core international AI technical standards and soft-law instruments", () => {
    const ids = internationalAiStandardsBaseline.map((entry) => entry.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "iso-iec-42001",
        "iso-iec-23894",
        "iso-iec-22989",
        "iso-iec-23053",
        "iso-iec-42005",
        "oecd-ai-principles",
        "unesco-ai-ethics-recommendation",
        "ieee-7000",
      ]),
    );
  });

  it("keeps international standards separate from standalone binding law", () => {
    expect(internationalAiStandardsBaseline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "iso-iec-42001",
          authorityType: "technical_standard",
          bindingStatus: "binding_if_incorporated",
        }),
        expect.objectContaining({
          id: "unesco-ai-ethics-recommendation",
          authorityType: "soft_law",
          bindingStatus: "non_binding",
        }),
      ]),
    );
    expect(
      internationalAiStandardsBaseline.some((entry) =>
        entry.limitations.some((limitation) => /not binding law unless/i.test(limitation)),
      ),
    ).toBe(true);
  });

  it("uses official or standards-body source references only", () => {
    for (const entry of internationalAiStandardsBaseline) {
      expect(entry.citationQualityStatus).toBe("complete");
      expect(entry.sourceReferences).toHaveLength(1);
      expect(["official", "standards_body"]).toContain(entry.sourceReferences[0]?.sourceType);
      expect(entry.sourceReferences[0]?.verificationStatus).toBe("verified");
    }
  });
});
