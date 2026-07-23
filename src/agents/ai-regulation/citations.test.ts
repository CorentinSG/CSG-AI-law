import { describe, expect, it } from "vitest";

import {
  assessCitationQuality,
  getSourceReferencesFromRawItem,
  buildCandidateSourceReference,
  getCitationReferences,
} from "@/agents/ai-regulation/citations";
import type {
  AiRegulatoryUpdate,
  ExtractedCandidateItem,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

const source: RegulationSource = {
  id: "src-eu-ai-office",
  name: "EU AI Office",
  jurisdiction: "European Union",
  region: "Europe",
  country: "European Union",
  sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
  sourceType: "regulator_page",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "Official source.",
  reliabilityLevel: "high",
  preferredExtractionMethod: "html_static",
  config: {},
  createdAt: "2026-05-27T00:00:00.000Z",
  updatedAt: "2026-05-27T00:00:00.000Z",
};

const candidate: ExtractedCandidateItem = {
  title: "AI Office implementation guidance",
  url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
  text: "Official page text.",
  excerpt: "Official page text.",
  publicationDate: "2026-05-27",
  sourceName: "EU AI Office",
  sourceId: "src-eu-ai-office",
  jurisdictionHint: "European Union",
  developmentTypeHint: "Agency guidance",
  legalAreaHint: "AI governance",
  authorityTypeHint: "Agency guidance",
};

const update: AiRegulatoryUpdate = {
  id: "upd-test",
  sourceId: "src-eu-ai-office",
  rawItemId: "raw-test",
  title: "AI Office implementation guidance",
  sourceName: "EU AI Office",
  sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
  jurisdiction: "European Union",
  region: "Europe",
  country: "European Union",
  developmentType: "Agency guidance",
  legalArea: "AI governance",
  publicationDate: "2026-05-27",
  detectedDate: "2026-05-27",
  oneSentenceSummary: "Summary.",
  summary: "Summary.",
  whatHappened: "What happened.",
  whyItMatters: "Why.",
  practicalImpact: "Impact.",
  affectedParties: [],
  keyObligations: [],
  complianceDeadlines: [],
  enforcementRisk: "Risk.",
  importanceLevel: "medium",
  confidenceLevel: "medium",
  tags: [],
  status: "needs_review",
  reviewedBy: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: "2026-05-27T00:00:00.000Z",
  updatedAt: "2026-05-27T00:00:00.000Z",
};

describe("source citations", () => {
  it("maps candidate metadata into a precise source reference", () => {
    const reference = buildCandidateSourceReference({
      source,
      candidate,
      retrievedAt: "2026-05-27T12:00:00.000Z",
    });

    expect(reference.title).toBe(candidate.title);
    expect(reference.institution).toBe("EU AI Office");
    expect(reference.sourceType).toBe("regulator");
    expect(reference.sourceRole).toBe("primary");
    expect(reference.lastVerifiedAt).toBe("2026-05-27T12:00:00.000Z");
  });

  it("assesses complete official citations as publication eligible", () => {
    const reference = buildCandidateSourceReference({
      source,
      candidate,
      retrievedAt: "2026-05-27T12:00:00.000Z",
    });

    const assessment = assessCitationQuality([reference]);

    expect(assessment.qualityStatus).toBe("complete");
    expect(assessment.publicationEligible).toBe(true);
  });

  it("blocks discovery-only source references from publication eligibility", () => {
    const discoverySource = {
      ...source,
      name: "AI Weekly",
      config: { sourceCategory: "discovery_source" },
      reliabilityLevel: "medium" as const,
    };
    const reference = buildCandidateSourceReference({
      source: discoverySource,
      candidate,
      retrievedAt: "2026-05-27T12:00:00.000Z",
    });

    const assessment = assessCitationQuality([reference]);

    expect(reference.sourceType).toBe("discovery_source");
    expect(assessment.qualityStatus).toBe("discovery_only");
    expect(assessment.publicationEligible).toBe(false);
  });

  it("flags inaccessible official citations conservatively", () => {
    const reference = buildCandidateSourceReference({
      source,
      candidate,
      retrievedAt: "2026-05-27T12:00:00.000Z",
    });

    reference.accessLimitations = "Runtime response status was 403.";
    reference.verificationStatus = "blocked";

    const assessment = assessCitationQuality([reference]);

    expect(assessment.qualityStatus).toBe("inaccessible_source");
    expect(assessment.publicationEligible).toBe(false);
  });

  it("falls back to update/source metadata for legacy raw items", () => {
    const rawItem: RawRegulatoryItem = {
      id: "raw-test",
      sourceId: source.id,
      rawTitle: update.title,
      rawUrl: update.sourceUrl,
      rawText: "Official text.",
      rawMetadata: {},
      detectedAt: "2026-05-27T12:00:00.000Z",
      hash: "hash",
      duplicateOf: null,
      processingStatus: "processed",
      createdAt: "2026-05-27T12:00:00.000Z",
      updatedAt: "2026-05-27T12:00:00.000Z",
    };

    const references = getCitationReferences({ update, rawItem, source });
    const assessment = assessCitationQuality(references);

    expect(references[0]?.institution).toBe(update.sourceName);
    expect(assessment.publicationEligible).toBe(true);
  });

  it("survives malformed legacy references and never grants them trust (W1.7)", () => {
    const references = getSourceReferencesFromRawItem({
      rawMetadata: {
        sourceReferences: [
          {
            sourceRole: "primary",
            title: "Malformed legacy reference",
            institution: "Unknown",
            url: "https://example.org/doc",
            // verificationStatus / reliabilityLevel / sourceType absent
          },
        ],
      },
    });

    expect(references).toHaveLength(1);
    expect(references[0].verificationStatus).toBe("needs_manual_verification");
    expect(references[0].reliabilityLevel).toBe("low");
    expect(references[0].sourceType).toBe("media_source");
    // The old blind cast crashed here (verificationStatus.includes).
    expect(() => assessCitationQuality(references)).not.toThrow();
  });
});
