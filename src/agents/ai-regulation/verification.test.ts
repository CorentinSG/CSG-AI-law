import { describe, expect, it } from "vitest";

import type { RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import { buildInitialVerificationMetadata } from "@/agents/ai-regulation/verification";

const baseSource: RegulationSource = {
  id: "src-test",
  name: "Official Test Source",
  jurisdiction: "European Union",
  region: "Europe",
  country: "European Union",
  sourceUrl: "https://commission.europa.eu/example",
  sourceType: "regulator_page",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "test",
  reliabilityLevel: "high",
  preferredExtractionMethod: "html_static",
  config: {},
  createdAt: "2026-05-26T00:00:00.000Z",
  updatedAt: "2026-05-26T00:00:00.000Z",
};

const baseRawItem: RawRegulatoryItem = {
  id: "raw-test",
  sourceId: "src-test",
  rawTitle: "AI Act official update",
  rawUrl: "https://commission.europa.eu/example",
  rawText: "Official source text.",
  rawMetadata: {},
  detectedAt: "2026-05-26T00:00:00.000Z",
  hash: "hash-test",
  duplicateOf: null,
  processingStatus: "new",
  createdAt: "2026-05-26T00:00:00.000Z",
  updatedAt: "2026-05-26T00:00:00.000Z",
};

describe("verification metadata", () => {
  it("marks official-source items as verified for private review, not auto-published", () => {
    const verification = buildInitialVerificationMetadata({
      source: baseSource,
      rawItem: baseRawItem,
    });

    expect(verification.initialSourceOfficial).toBe(true);
    expect(verification.officialSourceFound).toBe(true);
    expect(verification.verificationStatus).toBe("verified_for_review");
    expect(verification.publicVisibilityAllowed).toBe(true);
    expect(verification.reviewerNotes).toContain("Human review");
  });

  it("keeps discovery-source items private until official confirmation", () => {
    const verification = buildInitialVerificationMetadata({
      source: {
        ...baseSource,
        name: "Discovery Source",
        sourceUrl: "https://example.com/discovery",
        config: {
          sourceCategory: "discovery_source",
          publicationAllowed: false,
          requiresOfficialSourceConfirmation: true,
          requiresCrossSourceVerification: true,
        },
      },
      rawItem: {
        ...baseRawItem,
        rawUrl: "https://example.com/discovery-item",
        rawMetadata: {
          discoveryLead: true,
          possibleJurisdiction: "European Union",
          possibleTopic: "EU AI Act",
        },
      },
    });

    expect(verification.initialSourceOfficial).toBe(false);
    expect(verification.officialSourceFound).toBe(false);
    expect(verification.verificationStatus).toBe("needs_official_source");
    expect(verification.publicVisibilityAllowed).toBe(false);
    expect(verification.notPublishableReason).toContain("Discovery");
  });
});
