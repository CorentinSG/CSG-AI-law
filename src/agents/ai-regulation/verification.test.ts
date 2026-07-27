import { describe, expect, it } from "vitest";

import type { RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";
import {
  buildInitialVerificationMetadata,
  extractVerificationMetadata,
  type VerificationMetadata,
} from "@/agents/ai-regulation/verification";

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

// ---------------------------------------------------------------------------
// Read-time validation of the rawMetadata.verification JSON blob (plan 1.7)
// ---------------------------------------------------------------------------

function readVerification(payload: unknown) {
  return extractVerificationMetadata({
    rawMetadata: { verification: payload },
  });
}

const wellFormedVerification: VerificationMetadata = {
  initialDetectionSource: "Official Test Source",
  initialSourceOfficial: true,
  initialSourceType: "regulator_page",
  sourceUrl: "https://commission.europa.eu/example",
  detectedAt: "2026-05-26T00:00:00.000Z",
  lastVerifiedAt: "2026-05-26T01:00:00.000Z",
  verificationStatus: "verified_for_review",
  officialSourceFound: true,
  officialSourceUrl: "https://commission.europa.eu/example",
  corroboratingSourcesCount: 2,
  corroboratingSourceUrls: ["https://a.example", "https://b.example"],
  confidenceLevel: "medium",
  reviewerNotes: "Reviewed.",
  publicVisibilityAllowed: true,
  nextSuggestedVerificationSource: "Check EUR-Lex.",
  notPublishableReason: null,
  stale: false,
};

// The unverified/unknown shape a malformed row must degrade to.
const unverifiedDefaults = {
  initialDetectionSource: "",
  initialSourceOfficial: false,
  initialSourceType: "",
  sourceUrl: "",
  detectedAt: "",
  lastVerifiedAt: null,
  verificationStatus: "needs_official_source",
  officialSourceFound: false,
  officialSourceUrl: null,
  corroboratingSourcesCount: 0,
  corroboratingSourceUrls: [],
  confidenceLevel: "low",
  reviewerNotes: "",
  publicVisibilityAllowed: false,
  nextSuggestedVerificationSource: "",
  notPublishableReason: null,
  stale: false,
};

const verificationPayloadCases: Array<{
  name: string;
  payload: unknown;
  expected: VerificationMetadata | null;
}> = [
  {
    name: "well-formed blob is returned unchanged",
    payload: wellFormedVerification,
    expected: wellFormedVerification,
  },
  {
    name: "partially populated blob keeps known fields and defaults the rest",
    payload: {
      initialDetectionSource: "Partial Source",
      officialSourceUrl: "https://official.example",
      corroboratingSourceUrls: ["https://a.example"],
    },
    expected: {
      ...unverifiedDefaults,
      initialDetectionSource: "Partial Source",
      officialSourceUrl: "https://official.example",
      corroboratingSourceUrls: ["https://a.example"],
    } as VerificationMetadata,
  },
  {
    name: "wrong-typed fields degrade to unknown/unverified",
    payload: {
      initialDetectionSource: 12,
      initialSourceOfficial: "yes",
      verificationStatus: "not_a_status",
      officialSourceFound: "true",
      officialSourceUrl: 404,
      corroboratingSourcesCount: "many",
      corroboratingSourceUrls: "https://a.example",
      confidenceLevel: "extreme",
      publicVisibilityAllowed: 1,
      notPublishableReason: { reason: "x" },
      stale: "no",
    },
    expected: unverifiedDefaults as VerificationMetadata,
  },
  {
    name: "mixed-type corroborating url array keeps only the strings",
    payload: { corroboratingSourceUrls: ["https://a.example", 7, null, "https://b.example"] },
    expected: {
      ...unverifiedDefaults,
      corroboratingSourceUrls: ["https://a.example", "https://b.example"],
    } as VerificationMetadata,
  },
  {
    name: "empty object degrades to the full unverified default",
    payload: {},
    expected: unverifiedDefaults as VerificationMetadata,
  },
  { name: "null payload yields null", payload: null, expected: null },
  { name: "undefined payload yields null", payload: undefined, expected: null },
  { name: "string payload yields null", payload: "verified", expected: null },
  { name: "array payload yields null", payload: [], expected: null },
];

describe("verification metadata read-time validation", () => {
  it.each(verificationPayloadCases)("$name", ({ payload, expected }) => {
    expect(readVerification(payload)).toEqual(expected);
  });

  it("preserves unknown keys so a read/merge/write round trip loses nothing", () => {
    const parsed = readVerification({
      ...wellFormedVerification,
      futurePipelineField: "keep-me",
    });

    expect(parsed).toMatchObject({ futurePipelineField: "keep-me" });
  });

  it("keeps a malformed blob out of publication instead of throwing", () => {
    const rawItem: RawRegulatoryItem = {
      ...baseRawItem,
      rawMetadata: { verification: { verificationStatus: 42 } },
    };

    const assessment = evaluatePublicationEligibility({
      update: {
        status: "approved",
        title: "Some update",
        jurisdiction: "European Union",
        developmentType: "Regulation",
        sourceName: "Official Test Source",
        sourceUrl: "https://commission.europa.eu/example",
        publicationDate: "2026-05-26",
        detectedDate: "2026-05-26",
      },
      rawItem,
      source: baseSource,
    });

    expect(assessment.eligible).toBe(false);
    expect(assessment.blockingReasons.join(" ")).toContain("needs official source");
  });
});
