import { describe, expect, it } from "vitest";

import {
  europeImplementationStatusTaxonomy,
  getEuropeCountryProfileBySlug,
  getEuropeCountryProfiles,
  isSupportedEuropeImplementationStatus,
} from "@/content/ai-regulation/europe-country-profiles";
import {
  europeCountryStatuses,
  getEuropeMapTone,
} from "@/content/ai-regulation/europe-map";

describe("Europe country profiles", () => {
  it("exposes the first-wave country profiles", () => {
    const profiles = getEuropeCountryProfiles();

    expect(profiles).toHaveLength(27);
    expect(profiles.map((profile) => profile.slug)).toEqual(
      expect.arrayContaining([
        "france",
        "germany",
        "spain",
        "italy",
        "netherlands",
      ]),
    );
  });

  it("keeps implementation statuses inside the supported taxonomy", () => {
    for (const profile of getEuropeCountryProfiles()) {
      expect(isSupportedEuropeImplementationStatus(profile.implementationStatus)).toBe(
        true,
      );
      expect(
        europeImplementationStatusTaxonomy[profile.implementationStatus].label.length,
      ).toBeGreaterThan(0);
    }
  });

  it("resolves country profiles by slug", () => {
    expect(getEuropeCountryProfileBySlug("france")?.countryName).toBe("France");
    expect(getEuropeCountryProfileBySlug("unknown-country")).toBeNull();
  });

  it("uses conservative but stronger first-wave statuses where official sources support them", () => {
    expect(getEuropeCountryProfileBySlug("france")?.implementationStatus).toBe(
      "competent_authority_designated",
    );
    expect(getEuropeCountryProfileBySlug("germany")?.implementationStatus).toBe(
      "implementation_in_progress",
    );
    expect(getEuropeCountryProfileBySlug("spain")?.implementationStatus).toBe(
      "implementation_in_progress",
    );
    expect(getEuropeCountryProfileBySlug("italy")?.implementationStatus).toBe(
      "national_implementation_identified",
    );
    expect(getEuropeCountryProfileBySlug("netherlands")?.implementationStatus).toBe(
      "consultation_or_draft_identified",
    );
  });

  it("stores only official source records when sources are present", () => {
    for (const profile of getEuropeCountryProfiles()) {
      const everySource = [
        ...profile.nationalAIRegulationSources,
        ...profile.nationalCaseLawSources,
        ...profile.nationalSoftLawSources,
      ];

      expect(everySource.every((source) => source.official && source.public)).toBe(true);
      if (everySource.length === 0) {
        expect(profile.implementationStatus).toBe("needs_review");
        expect(profile.citationQualityStatus).toBe("missing_official_source");
      }
    }
  });

  it("keeps country source references precise or marks missing sources", () => {
    for (const profile of getEuropeCountryProfiles()) {
      if (profile.sourceReferences.length === 0) {
        expect(profile.missingSourceWarnings.length).toBeGreaterThan(0);
        continue;
      }

      for (const reference of profile.sourceReferences) {
        expect(reference.title).toBeTruthy();
        expect(reference.institution).toBeTruthy();
        expect(reference.url).toMatch(/^https:\/\//);
        expect(reference.lastVerifiedAt ?? reference.retrievedAt ?? reference.publicationDate).toBeTruthy();
      }
    }
  });

  it("preserves publication dates or pinpoints for first-wave official national sources when available", () => {
    const italy = getEuropeCountryProfileBySlug("italy");
    const netherlands = getEuropeCountryProfileBySlug("netherlands");

    expect(
      italy?.sourceReferences.some(
        (reference) =>
          reference.publicationDate === "2025-09-25" &&
          reference.pinpoint?.article === "Art. 1",
      ),
    ).toBe(true);
    expect(
      netherlands?.sourceReferences.some(
        (reference) => reference.publicationDate === "2026-04-20",
      ),
    ).toBe(true);
  });

  it("preserves distinct national authority source types instead of flattening them to regulator", () => {
    const france = getEuropeCountryProfileBySlug("france");
    const germany = getEuropeCountryProfileBySlug("germany");
    const spain = getEuropeCountryProfileBySlug("spain");

    expect(france?.sourceReferences.some((reference) => reference.sourceType === "legislation")).toBe(
      true,
    );
    expect(france?.sourceReferences.some((reference) => reference.sourceType === "parliament")).toBe(
      true,
    );
    expect(france?.sourceReferences.some((reference) => reference.sourceType === "court")).toBe(
      true,
    );
    expect(spain?.sourceReferences.some((reference) => reference.sourceType === "government")).toBe(
      true,
    );
    expect(germany?.sourceReferences.some((reference) => reference.sourceType === "parliament")).toBe(
      true,
    );
    expect(germany?.sourceReferences.some((reference) => reference.sourceType === "policy")).toBe(
      true,
    );
    expect(
      spain?.sourceReferences.some(
        (reference) =>
          reference.sourceType === "government" &&
          reference.authorityType === "Member State government source",
      ),
    ).toBe(true);
  });

  it("keeps France as a dense but still non-exhaustive official-source profile", () => {
    const france = getEuropeCountryProfileBySlug("france");

    expect(france?.nationalAIRegulationSources.length).toBeGreaterThanOrEqual(8);
    expect(france?.nationalSoftLawSources.length).toBeGreaterThanOrEqual(5);
    expect(france?.nationalCaseLawSources.length).toBeGreaterThanOrEqual(7);
    expect(france?.publicSummary).toContain("substantially stronger official-source AI baseline");
    expect(france?.missingSourceWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Direct final promulgated designation instrument"),
        expect.stringContaining("No complete market-surveillance"),
      ]),
    );
    expect(
      france?.sourceReferences.some(
        (reference) =>
          reference.url.includes("pjl_ecom2524721l_cm_10.11.2025.pdf") &&
          reference.sourceType === "legislation",
      ),
    ).toBe(true);
    expect(
      france?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/Amdt_442.html") &&
          reference.sourceType === "parliament",
      ),
    ).toBe(true);
    expect(france?.nationalCaseLawNotes).toContain(
      "first broader verified French case-law and administrative-decision layer",
    );
  });

  it("keeps Spain as a stronger but still non-exhaustive official-source profile", () => {
    const spain = getEuropeCountryProfileBySlug("spain");

    expect(spain?.nationalAIRegulationSources.length).toBeGreaterThanOrEqual(6);
    expect(spain?.nationalSoftLawSources.length).toBeGreaterThanOrEqual(5);
    expect(spain?.nationalCaseLawSources.length).toBeGreaterThanOrEqual(1);
    expect(spain?.publicSummary).toContain("materially stronger official-source AI baseline");
    expect(spain?.missingSourceWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No complete competent-authority designation analysis"),
        expect.stringContaining("final promulgated Spanish AI governance law"),
      ]),
    );
    expect(
      spain?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/20260526-referencia-rueda-de-prensa-ministros") &&
          reference.sourceType === "government",
      ),
    ).toBe(true);
    expect(
      spain?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/agencia-publica-su-plan-actuacion-2026") &&
          reference.sourceType === "policy",
      ),
    ).toBe(true);
    expect(spain?.nationalCaseLawNotes).toContain("AEPD legal-criteria");
  });

  it("keeps Italy as a stronger but still non-exhaustive official-source profile", () => {
    const italy = getEuropeCountryProfileBySlug("italy");

    expect(italy?.nationalAIRegulationSources.length).toBeGreaterThanOrEqual(5);
    expect(italy?.nationalSoftLawSources.length).toBeGreaterThanOrEqual(3);
    expect(italy?.nationalCaseLawSources.length).toBeGreaterThanOrEqual(1);
    expect(italy?.publicSummary).toContain("stronger official-source AI baseline");
    expect(italy?.missingSourceWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No final competent-authority designation"),
        expect.stringContaining("article-by-article national authority map"),
      ]),
    );
    expect(
      italy?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/linee-guida-su-ia-nella-pa-al-la-consultazione-pubblica-su-sviluppo-e-procurement") &&
          reference.sourceType === "policy",
      ),
    ).toBe(true);
    expect(
      italy?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/approvata-in-via-definitiva-la-legge-italiana-sull-intelligenza-artificiale") &&
          reference.sourceType === "government",
      ),
    ).toBe(true);
  });

  it("keeps Germany as a stronger but still non-exhaustive official-source profile", () => {
    const germany = getEuropeCountryProfileBySlug("germany");

    expect(germany?.nationalAIRegulationSources.length).toBeGreaterThanOrEqual(5);
    expect(germany?.nationalSoftLawSources.length).toBeGreaterThanOrEqual(2);
    expect(germany?.nationalCaseLawSources.length).toBeGreaterThanOrEqual(1);
    expect(germany?.publicSummary).toContain("materially stronger official-source AI baseline");
    expect(germany?.missingSourceWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No final competent-authority designation verified"),
        expect.stringContaining("No final article-level authority map verified"),
        expect.stringContaining("German AI-specific case-law baseline remains narrow"),
      ]),
    );
    expect(
      germany?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/presse/hib/kurzmeldungen-1155112") &&
          reference.sourceType === "parliament",
      ),
    ).toBe(true);
    expect(
      germany?.sourceReferences.some(
        (reference) =>
          reference.url.includes("/KI-pbD/KI-pbD-Einleitung.html") &&
          reference.sourceType === "policy",
      ),
    ).toBe(true);
    expect(germany?.nationalCaseLawNotes).toContain("BGH");
  });
});

describe("Europe map integration", () => {
  it("maps first-wave profiles into country entries with country routes", () => {
    const france = europeCountryStatuses.find((country) => country.code === "FR");
    const netherlands = europeCountryStatuses.find((country) => country.code === "NL");

    expect(france?.href).toBe("/ai-regulation/europe/france");
    expect(netherlands?.href).toBe("/ai-regulation/europe/netherlands");
  });

  it("maps supported statuses to visual tones", () => {
    expect(getEuropeMapTone("consultation_or_draft_identified")).toBe("info");
    expect(getEuropeMapTone("needs_review")).toBe("warning");
    expect(getEuropeMapTone("competent_authority_designated")).toBe("success");
  });
});
