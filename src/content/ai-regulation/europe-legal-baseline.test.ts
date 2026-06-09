import { describe, expect, it } from "vitest";

import {
  europeAiActBaseline,
  europeGovernanceActors,
} from "@/content/ai-regulation/europe-ai-legal-baseline";
import {
  europeAiCaseLawEntries,
  europeAiCaseLawSources,
} from "@/content/ai-regulation/europe-ai-case-law";
import { europeAiSoftLawBaseline } from "@/content/ai-regulation/europe-ai-soft-law";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";

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
  expect(reference.lastVerifiedAt).toBeTruthy();
}

describe("Europe legal baseline", () => {
  it("stores a source-backed EU AI Act baseline", () => {
    expect(europeAiActBaseline.celexNumber).toBe("32024R1689");
    expect(europeAiActBaseline.authorityLayer).toBe("binding_law");
    expect(europeAiActBaseline.bindingStatusLabel).toBe("binding_eu_law");
    expect(europeAiActBaseline.sourceReferences.length).toBeGreaterThan(0);
    expect(europeAiActBaseline.citationQualityStatus).toBe("partial");
    expect(
      europeAiActBaseline.sourceReferences.some(
        (reference) =>
          reference.pinpoint?.article === "Article 113" &&
          reference.pinpoint?.CELEX === "32024R1689",
      ),
    ).toBe(true);

    for (const reference of europeAiActBaseline.sourceReferences) {
      expectPreciseReference(reference);
    }
  });

  it("requires timeline milestones to include precise official sources", () => {
    for (const entry of euAiTimelineEntries) {
      expect(entry.legalEffect).toBeTruthy();
      expect(entry.authorityType).toBeTruthy();
      expect(entry.sourceReferences.length).toBeGreaterThan(0);
      for (const reference of entry.sourceReferences) {
        expectPreciseReference(reference);
      }
    }
  });

  it("keeps governance actors citation-backed", () => {
    for (const actor of europeGovernanceActors) {
      expect(["governance_body", "eu_guidance"]).toContain(actor.authorityLayer);
      expect(actor.sourceReferences.length).toBeGreaterThan(0);
      expect(actor.responsibilities.length).toBeGreaterThan(0);
      for (const reference of actor.sourceReferences) {
        expectPreciseReference(reference);
      }
    }
  });

  it("stores officially sourced European case-law baseline entries conservatively", () => {
    expect(europeAiCaseLawSources.length).toBeGreaterThan(0);
    expect(europeAiCaseLawEntries.length).toBeGreaterThan(0);
    for (const source of europeAiCaseLawSources) {
      expect(source.sourceReferences.length).toBeGreaterThan(0);
      expect(source.parserStatus).toBe("needs_dedicated_parser");
    }

    for (const entry of europeAiCaseLawEntries) {
      expect(entry.status).toBe("needs_review");
      expect(entry.officialSourceUrl).toMatch(/^https:\/\//);
      if (entry.country === "Spain" && entry.courtOrAuthority.includes("AEPD")) {
        expect(entry.authorityType).toBe("administrative_decision");
      } else if (
        entry.country === "Italy" &&
        entry.courtOrAuthority.includes("Garante per la protezione dei dati personali")
      ) {
        expect(["administrative_decision", "enforcement_action"]).toContain(entry.authorityType);
      } else {
        expect(
          entry.docketOrCaseNumber ??
            entry.ecli ??
            entry.sourceReferences[0]?.pinpoint?.caseNumber ??
            entry.sourceReferences[0]?.pinpoint?.docket,
        ).toBeTruthy();
      }
      expect(entry.sourceReferences.length).toBeGreaterThan(0);
      for (const reference of entry.sourceReferences) {
        expectPreciseReference(reference);
      }
    }

    expect(
      europeAiCaseLawEntries.some(
        (entry) =>
          entry.country === "France" &&
          entry.docketOrCaseNumber === "427916" &&
          entry.courtOrAuthority.includes("Conseil d'Etat"),
      ),
    ).toBe(true);
    expect(
      europeAiCaseLawEntries.some(
        (entry) =>
          entry.country === "France" &&
          entry.docketOrCaseNumber === "16-27.866" &&
          entry.courtOrAuthority.includes("Cour de cassation"),
      ),
    ).toBe(true);
    expect(
      europeAiCaseLawEntries.some(
        (entry) =>
          entry.country === "France" &&
          entry.docketOrCaseNumber === "506370" &&
          entry.courtOrAuthority.includes("Conseil d'Etat"),
      ),
    ).toBe(true);
    expect(
      europeAiCaseLawEntries.some(
        (entry) =>
          entry.country === "France" &&
          entry.authorityType === "administrative_decision" &&
          entry.docketOrCaseNumber === "2025-108",
      ),
    ).toBe(true);
    expect(
      europeAiCaseLawEntries.some(
        (entry) =>
          entry.country === "Italy" &&
          entry.authorityType === "enforcement_action" &&
          entry.officialSourceUrl?.includes("10085432"),
      ),
    ).toBe(true);
    expect(
      europeAiCaseLawEntries.some(
        (entry) =>
          entry.country === "Germany" &&
          entry.docketOrCaseNumber === "VI ZR 431/24" &&
          entry.courtOrAuthority.includes("Bundesgerichtshof"),
      ),
    ).toBe(true);
  });

  it("classifies soft-law and standards as non-binding unless separately incorporated", () => {
    expect(europeAiSoftLawBaseline.length).toBeGreaterThan(0);

    for (const entry of europeAiSoftLawBaseline) {
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
