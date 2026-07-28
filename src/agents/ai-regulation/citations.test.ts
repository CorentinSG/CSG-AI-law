import { describe, expect, it } from "vitest";

import {
  assessCitationQuality,
  buildCandidateSourceReference,
  getCitationReferences,
  getSourceReferencesFromRawItem,
  type CitationQualityStatus,
  type SourceReference,
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
});

// ---------------------------------------------------------------------------
// Read-time validation of the sourceReferences JSON column (master plan 1.7)
// ---------------------------------------------------------------------------

function readReferences(payload: unknown) {
  return getSourceReferencesFromRawItem({
    rawMetadata: { sourceReferences: payload },
  });
}

const wellFormedReference = {
  sourceRole: "primary",
  title: "Regulation (EU) 2024/1689 laying down harmonised rules on AI",
  institution: "Official Journal of the European Union",
  url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  canonicalUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  sourceType: "legislation",
  authorityType: "Binding law",
  publicationDate: "2024-07-12",
  detectedAt: "2024-07-12T00:00:00.000Z",
  retrievedAt: "2024-07-12T00:00:00.000Z",
  lastVerifiedAt: "2024-07-12T00:00:00.000Z",
  jurisdiction: "European Union",
  documentType: "Regulation",
  excerpt: null,
  pinpoint: { article: "6", CELEX: "32024R1689" },
  reliabilityLevel: "high",
  verificationStatus: "verified_for_review",
  archivedUrl: null,
  accessLimitations: null,
  notes: "Official source.",
};

interface ReferencePayloadCase {
  name: string;
  payload: unknown;
  expectedCount: number;
  expectedQualityStatus: CitationQualityStatus;
  expectedPublicationEligible: boolean;
  expect?: (references: SourceReference[]) => void;
}

const referencePayloadCases: ReferencePayloadCase[] = [
  {
    name: "well-formed official reference is kept verbatim",
    payload: [wellFormedReference],
    expectedCount: 1,
    expectedQualityStatus: "complete",
    expectedPublicationEligible: true,
    expect: (references) => {
      expect(references[0]).toMatchObject(wellFormedReference);
    },
  },
  {
    name: "partially populated reference degrades to unverified defaults",
    payload: [
      {
        sourceRole: "primary",
        title: "Some official-looking document",
        institution: "Some Authority",
        url: "https://example.gov/doc",
      },
    ],
    expectedCount: 1,
    expectedQualityStatus: "discovery_only",
    expectedPublicationEligible: false,
    expect: (references) => {
      expect(references[0]).toMatchObject({
        sourceType: "discovery_source",
        reliabilityLevel: "low",
        verificationStatus: "needs_official_source",
        pinpoint: {},
        authorityType: null,
        lastVerifiedAt: null,
      });
    },
  },
  {
    name: "wrong-typed fields are replaced by conservative defaults",
    payload: [
      {
        sourceRole: "not_a_role",
        title: "Regulation on artificial intelligence",
        institution: "Authority",
        url: "https://example.gov/doc",
        sourceType: "not_a_source_type",
        reliabilityLevel: "extremely-high",
        verificationStatus: 42,
        pinpoint: "definitely not an object",
        authorityType: { nested: true },
        notes: 7,
        accessLimitations: ["blocked"],
      },
    ],
    expectedCount: 1,
    expectedQualityStatus: "discovery_only",
    expectedPublicationEligible: false,
    expect: (references) => {
      expect(references[0]).toMatchObject({
        sourceRole: "discovery",
        sourceType: "discovery_source",
        reliabilityLevel: "low",
        verificationStatus: "needs_official_source",
        pinpoint: {},
        authorityType: null,
        notes: null,
        accessLimitations: null,
      });
    },
  },
  {
    name: "entries missing the identifying core are dropped",
    payload: [
      { sourceRole: "primary", title: 5, institution: "Authority", url: "https://a.example" },
      { sourceRole: "primary", title: "Title", institution: "Authority" },
      { title: "Title", institution: "Authority", url: "https://a.example" },
      null,
      "not an object",
      ["nested", "array"],
    ],
    expectedCount: 0,
    expectedQualityStatus: "missing_official_source",
    expectedPublicationEligible: false,
  },
  {
    name: "null payload yields no references",
    payload: null,
    expectedCount: 0,
    expectedQualityStatus: "missing_official_source",
    expectedPublicationEligible: false,
  },
  {
    name: "empty array payload yields no references",
    payload: [],
    expectedCount: 0,
    expectedQualityStatus: "missing_official_source",
    expectedPublicationEligible: false,
  },
  {
    name: "empty object payload yields no references",
    payload: {},
    expectedCount: 0,
    expectedQualityStatus: "missing_official_source",
    expectedPublicationEligible: false,
  },
  {
    name: "non-array scalar payload yields no references",
    payload: "sourceReferences",
    expectedCount: 0,
    expectedQualityStatus: "missing_official_source",
    expectedPublicationEligible: false,
  },
];

describe("sourceReferences read-time validation", () => {
  it.each(referencePayloadCases)(
    "$name",
    ({
      payload,
      expectedCount,
      expectedQualityStatus,
      expectedPublicationEligible,
      expect: assertReferences,
    }) => {
      const references = readReferences(payload);

      expect(references).toHaveLength(expectedCount);
      assertReferences?.(references);

      const assessment = assessCitationQuality(references);
      expect(assessment.qualityStatus).toBe(expectedQualityStatus);
      expect(assessment.publicationEligible).toBe(expectedPublicationEligible);
    },
  );

  it("never throws in assessCitationQuality for malformed payloads", () => {
    for (const testCase of referencePayloadCases) {
      expect(() =>
        assessCitationQuality(readReferences(testCase.payload)),
      ).not.toThrow();
    }
  });

  it("preserves unknown keys so a read/write round trip loses nothing", () => {
    const [reference] = readReferences([
      { ...wellFormedReference, futurePipelineField: "keep-me" },
    ]);

    expect(reference).toMatchObject({ futurePipelineField: "keep-me" });
  });

  it("never lets a malformed reference claim official-source status", () => {
    const references = readReferences([
      {
        sourceRole: "primary",
        title: "Looks like a binding regulation",
        institution: "Ministry",
        url: "https://example.gov/doc",
        // sourceType/verificationStatus absent — the row cannot prove it is official
      },
    ]);

    const assessment = assessCitationQuality(references);

    expect(assessment.primaryOfficialSource).toBeNull();
    expect(assessment.publicationEligible).toBe(false);
  });
});
