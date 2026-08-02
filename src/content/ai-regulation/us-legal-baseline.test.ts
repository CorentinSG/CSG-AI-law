import { describe, expect, it } from "vitest";

import {
  usFederalBaselineEntries,
  usFederalTimelineEntries,
} from "@/content/ai-regulation/us-ai-legal-baseline";
import {
  usAiCaseLawEntries,
  usAiCaseLawSources,
} from "@/content/ai-regulation/us-ai-case-law";
import { usAiSoftLawBaseline } from "@/content/ai-regulation/us-ai-soft-law";
import { getUsMapColor, usStateMapStatuses } from "@/content/ai-regulation/us-map";
import {
  getPriorityUsStateProfiles,
  getUsStateAiLawProfiles,
  usStateAiLawStatusTaxonomy,
} from "@/content/ai-regulation/us-state-ai-law-baseline";

function expectPreciseReference(reference: {
  title: string;
  institution: string;
  url: string;
  authorityType?: string | null;
  lastVerifiedAt?: string | null;
}) {
  expect(reference.title).toBeTruthy();
  expect(reference.institution).toBeTruthy();
  expect(reference.url).toMatch(/^https:\/\//);
  expect(reference.authorityType).toBeTruthy();
}

describe("U.S. federal legal baseline", () => {
  it("stores citation-backed federal baseline entries", () => {
    expect(usFederalBaselineEntries.length).toBeGreaterThan(0);

    for (const entry of usFederalBaselineEntries) {
      expect(entry.jurisdiction).toBe("United States federal");
      expect(entry.sourceReferences.length).toBeGreaterThan(0);
      for (const reference of entry.sourceReferences) {
        expectPreciseReference(reference);
      }
    }
  });

  it("keeps timeline entries source-backed", () => {
    for (const entry of usFederalTimelineEntries) {
      expect(entry.legalEffect).toBeTruthy();
      expect(entry.sourceReferences.length).toBeGreaterThan(0);
      for (const reference of entry.sourceReferences) {
        expectPreciseReference(reference);
      }
    }
  });
});

describe("U.S. state baseline", () => {
  it("contains all 50 states plus D.C.", () => {
    const profiles = getUsStateAiLawProfiles();

    expect(profiles).toHaveLength(51);
    expect(profiles.map((profile) => profile.stateName)).toEqual(
      expect.arrayContaining(["California", "Colorado", "New York", "District of Columbia"]),
    );
  });

  it("keeps state statuses within the supported taxonomy", () => {
    for (const profile of getUsStateAiLawProfiles()) {
      expect(profile.aiLawStatus in usStateAiLawStatusTaxonomy).toBe(true);
      if (profile.sourceReferences.length === 0) {
        expect(profile.aiLawStatus).toBe("needs_review");
        expect(profile.citationQualityStatus).toBe("missing_official_source");
      }
      if (profile.aiLawStatus.startsWith("enacted_")) {
        expect(profile.sourceReferences.some((reference) => reference.sourceType === "official")).toBe(
          true,
        );
        expect(profile.enactedAIStatutes.length).toBeGreaterThan(0);
      }
    }
  });

  it("exposes the priority state first wave", () => {
    expect(getPriorityUsStateProfiles().map((profile) => profile.stateCode)).toEqual(
      expect.arrayContaining(["CA", "CO", "NY", "IL", "TX", "CT", "UT", "VA", "WA", "MD"]),
    );
  });

  it("strengthens New York with official court-rule coverage for Part 161", () => {
    const newYork = getUsStateAiLawProfiles().find((profile) => profile.stateCode === "NY");

    expect(newYork?.aiLawStatus).toBe("agency_guidance_or_enforcement");
    expect(
      newYork?.courtSourceUrls.some((url) => url.includes("/rules/chiefadmin/161.shtml")),
    ).toBe(true);
    expect(
      newYork?.stateGovernmentUseRules.some((entry) => entry.includes("Part 161")),
    ).toBe(true);
    expect(newYork?.publicSummary).toContain("New York Courts Part 161");
  });

  // First populated pass of the state-by-state review. Each pinned status is
  // backed by codified text confirmed in the Legal Data Hunter corpus or a
  // runtime-verified official bill page — see populatedStateBaselines.
  it("records the source-confirmed enacted state AI laws", () => {
    const byCode = new Map(
      getUsStateAiLawProfiles().map((profile) => [profile.stateCode, profile]),
    );

    expect(byCode.get("CO")?.aiLawStatus).toBe("enacted_comprehensive_ai_law");
    expect(byCode.get("CO")?.enactedAIStatutes.join(" ")).toContain("SB24-205");

    expect(byCode.get("TX")?.aiLawStatus).toBe("enacted_comprehensive_ai_law");
    expect(byCode.get("TX")?.enactedAIStatutes.join(" ")).toContain("HB 149");
    expect(
      byCode.get("TX")?.officialSourceUrls.some((url) => url.includes("statutes.capitol.texas.gov")),
    ).toBe(true);

    expect(byCode.get("CA")?.aiLawStatus).toBe("enacted_sector_specific_ai_law");
    expect(byCode.get("CA")?.enactedAIStatutes.join(" ")).toContain("22757");

    expect(byCode.get("UT")?.aiLawStatus).toBe("enacted_sector_specific_ai_law");
    expect(byCode.get("UT")?.enactedAIStatutes.join(" ")).toContain("Chapter 77");

    expect(byCode.get("CT")?.aiLawStatus).toBe("enacted_sector_specific_ai_law");
    expect(byCode.get("CT")?.enactedAIStatutes.join(" ")).toContain("51-10e");
  });

  it("shows enacted states on the public map instead of zero", () => {
    const enacted = usStateMapStatuses.filter((state) =>
      state.status.startsWith("enacted_"),
    );

    expect(enacted.map((state) => state.code).sort()).toEqual(["CA", "CO", "CT", "TX", "UT"]);
  });

  it("maps all state profiles into the U.S. map", () => {
    expect(usStateMapStatuses).toHaveLength(51);
    expect(usStateMapStatuses.find((state) => state.code === "CA")?.href).toBe(
      "/ai-regulation/united-states/california",
    );
  });

  it("maps every state status to a valid public map color", () => {
    for (const state of usStateMapStatuses) {
      const color = getUsMapColor(state.status);
      expect(color.label).toBeTruthy();
      expect(color.className).toContain("border-");
      expect(color.dotClassName).toContain("bg-");
    }
  });

  it("does not present unverified states as confirmed enacted law", () => {
    const unverifiedStates = getUsStateAiLawProfiles().filter(
      (profile) => profile.sourceReferences.length === 0,
    );

    expect(unverifiedStates.length).toBeGreaterThan(0);
    expect(
      unverifiedStates.every(
        (profile) =>
          profile.aiLawStatus === "needs_review" ||
          profile.aiLawStatus === "no_specific_ai_law_verified",
      ),
    ).toBe(true);
  });
});

describe("U.S. case law and soft law baseline", () => {
  it("prepares case-law sources without inventing cases", () => {
    expect(usAiCaseLawSources.length).toBeGreaterThan(0);
    expect(usAiCaseLawEntries).toEqual([]);
  });

  it("classifies soft-law and standards as non-binding unless separately incorporated", () => {
    expect(usAiSoftLawBaseline.length).toBeGreaterThan(0);
    for (const entry of usAiSoftLawBaseline) {
      expect(["non_binding", "binding_if_incorporated", "needs_review"]).toContain(
        entry.bindingStatus,
      );
      expect(entry.sourceReferences.length).toBeGreaterThan(0);
      for (const reference of entry.sourceReferences) {
        expectPreciseReference(reference);
      }
    }
  });
});
