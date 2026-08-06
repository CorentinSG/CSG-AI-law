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

    // Provenance: New York moved off the source-reachability heuristic once the
    // LOADinG Act (Chapter 674 of the Laws of 2024) and its chapter amendment
    // S822 were reviewed at nysenate.gov, so the pin is now an enacted status.
    // Part 161 court coverage below is unchanged.
    expect(newYork?.aiLawStatus).toBe("enacted_sector_specific_ai_law");
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

    // Second populated pass (2026-08). Each pin quotes the citation carried in
    // populatedStateBaselines, which in turn names the official source.
    expect(byCode.get("IL")?.enactedAIStatutes.join(" ")).toContain("103-0804");
    expect(byCode.get("NY")?.enactedAIStatutes.join(" ")).toContain("Chapter 674");
    expect(byCode.get("TN")?.enactedAIStatutes.join(" ")).toContain("Public Chapter 588");
    expect(byCode.get("MT")?.enactedAIStatutes.join(" ")).toContain("2-21-103");
    expect(byCode.get("KY")?.enactedAIStatutes.join(" ")).toContain("42.731");
    expect(byCode.get("MD")?.enactedAIStatutes.join(" ")).toContain("3.5-803");
    expect(byCode.get("ND")?.enactedAIStatutes.join(" ")).toContain("16.1-10-04.2");
    expect(byCode.get("NM")?.enactedAIStatutes.join(" ")).toContain("1-19-26.4");
    expect(byCode.get("AZ")?.enactedAIStatutes.join(" ")).toContain("16-1024");
    expect(byCode.get("SD")?.enactedAIStatutes.join(" ")).toContain("12-26-32");
    expect(byCode.get("AR")?.enactedAIStatutes.join(" ")).toContain("Act 927");

    // Third populated pass (2026-08-05), verified on each issuing site because
    // the Legal Data Hunter connector was rate-limiting throughout.
    expect(byCode.get("OR")?.enactedAIStatutes.join(" ")).toContain("Chapter 62");
    expect(byCode.get("VA")?.enactedAIStatutes.join(" ")).toContain("18.2-213.3");
    expect(byCode.get("NJ")?.enactedAIStatutes.join(" ")).toContain("P.L. 2025, c.40");
    expect(byCode.get("FL")?.enactedAIStatutes.join(" ")).toContain("106.145");
    expect(byCode.get("WI")?.enactedAIStatutes.join(" ")).toContain("11.1303(2m)");
    expect(byCode.get("MI")?.enactedAIStatutes.join(" ")).toContain("168.932f");

    // Fourth populated pass (2026-08-05).
    expect(byCode.get("MN")?.enactedAIStatutes.join(" ")).toContain("609.771");
    expect(byCode.get("PA")?.enactedAIStatutes.join(" ")).toContain("4101.1");
    expect(byCode.get("LA")?.enactedAIStatutes.join(" ")).toContain("14:73.13");
    expect(byCode.get("ID")?.enactedAIStatutes.join(" ")).toContain("67-6628A");

    // Fifth populated pass (2026-08-05). Nebraska is the first entry in this
    // database that regulates AI behaviour rather than synthetic media.
    expect(byCode.get("NE")?.enactedAIStatutes.join(" ")).toContain(
      "Conversational Artificial Intelligence Safety Act",
    );
    expect(byCode.get("DE")?.enactedAIStatutes.join(" ")).toContain("15 Del. C. § 5145");

    // Washington is deliberately pinned as pending: the LDH Washington corpus
    // returns bill texts only (SB 6120, HB 1170/1168 series), no enacted AI act.
    expect(byCode.get("WA")?.aiLawStatus).toBe("pending_ai_legislation");
    expect(byCode.get("WA")?.enactedAIStatutes).toHaveLength(0);
    expect(byCode.get("WA")?.pendingAIBills.join(" ")).toContain("SB 6120");
  });

  it("shows enacted states on the public map instead of zero", () => {
    const enacted = usStateMapStatuses.filter((state) =>
      state.status.startsWith("enacted_"),
    );

    // Provenance for each added code (all verified at an official source before
    // being pinned here — see populatedStateBaselines for the exact citation):
    //   AR  Act 927 of 2025 (HB 1876), arkleg.state.ar.us bill-status page
    //   AZ  ARS § 16-1024, azleg.gov
    //   IL  Public Act 103-0804 (HB 3773), ilga.gov bill-status page
    //   KY  KRS §§ 42.722, 42.731, apps.legislature.ky.gov
    //   MD  State Finance and Procurement §§ 3.5-801 to 3.5-806, mgaleg.maryland.gov
    //   MT  MCA §§ 2-10-203/205, 2-21-101 to 104, 13-35-801, mca.legmt.gov
    //   ND  NDCC §§ 16.1-10-04.2, 12.1-17-07, ndlegis.gov
    //   NM  NMSA 1978 § 1-19-26.4 (Laws 2024, ch. 57), nmonesource.com
    //   NY  Chapter 674 of the Laws of 2024 + S822, nysenate.gov
    //   SD  S.D. Codified Laws §§ 12-26-32 to 12-26-37, sdlegislature.gov
    //   TN  Public Chapter 588 (HB 2091), publications.tnsosfiles.com
    // Third pass (2026-08-05), each read on the issuing site:
    //   FL  Fla. Stat. § 106.145 (ch. 2024-126), leg.state.fl.us
    //   MI  MCL 168.932f (2023 PA 265), legislature.mi.gov
    //   NJ  P.L. 2025, c.40 (A3540), pub.njleg.state.nj.us
    //   OR  SB 1571, Ch. 62 Oregon Laws 2024, olis.oregonlegislature.gov
    //   VA  Code of Virginia § 18.2-213.3 (HB 697), legacylis.virginia.gov
    //   WI  Wis. Stat. § 11.1303(2m) (2023 Act 123), docs.legis.wisconsin.gov
    // Fourth pass (2026-08-05), each read on the issuing site:
    //   ID  Idaho Code § 67-6628A (2024 ch. 172), legislature.idaho.gov
    //   LA  La. R.S. 14:73.13 (Acts 2023 No. 457), legis.la.gov
    //   MN  Minn. Stat. § 609.771, revisor.mn.gov
    //   PA  18 Pa.C.S. § 4101.1 (Act 35 of 2025), legis.state.pa.us
    // Fifth pass (2026-08-05), read in the LDH corpus, URLs runtime-checked:
    //   DE  15 Del. C. § 5145, delcode.delaware.gov
    //   NE  Neb. Rev. Stat. §§ 86-1801 to 86-1807 (Laws 2026, LB525),
    //       nebraskalegislature.gov
    expect(enacted.map((state) => state.code).sort()).toEqual([
      "AR",
      "AZ",
      "CA",
      "CO",
      "CT",
      "DE",
      "FL",
      "ID",
      "IL",
      "KY",
      "LA",
      "MD",
      "MI",
      "MN",
      "MT",
      "ND",
      "NE",
      "NJ",
      "NM",
      "NY",
      "OR",
      "PA",
      "SD",
      "TN",
      "TX",
      "UT",
      "VA",
      "WI",
    ]);
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
  it("keeps monitored case-law sources declared", () => {
    expect(usAiCaseLawSources.length).toBeGreaterThan(0);
  });

  // A prior version of this suite pinned usAiCaseLawEntries to [] ("no
  // invented cases"). The populated socle keeps that promise differently:
  // every entry must carry a verified reference and a real docket identity —
  // an invented case cannot satisfy these invariants.
  it("publishes only source-backed case-law entries", () => {
    expect(usAiCaseLawEntries.length).toBeGreaterThanOrEqual(9);

    for (const entry of usAiCaseLawEntries) {
      expect(entry.docketNumber, entry.id).toBeTruthy();
      expect(entry.courtListenerUrl, entry.id).toMatch(/^https:\/\/www\.courtlistener\.com\//);
      expect(entry.sourceReferences.length, entry.id).toBeGreaterThan(0);
      for (const reference of entry.sourceReferences) {
        expectPreciseReference(reference);
        expect(reference.verificationStatus).toBe("verified");
      }
      if (entry.status === "published") {
        expect(["high", "medium"]).toContain(entry.confidenceLevel);
        expect(entry.holdingOrOutcome, entry.id).toBeTruthy();
      }
    }
  });

  it("anchors the reference AI disputes", () => {
    const ids = usAiCaseLawEntries.map((entry) => entry.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "case-thomson-reuters-ross",
        "case-bartz-anthropic",
        "case-kadrey-meta",
        "case-nyt-openai-microsoft",
        "case-mobley-workday",
        "case-mata-avianca",
      ]),
    );
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
