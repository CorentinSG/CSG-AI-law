import { describe, expect, it } from "vitest";

import { evaluatePublicationEligibility } from "@/agents/ai-regulation/publicationEligibility";
import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

const baseUpdate: AiRegulatoryUpdate = {
  id: "upd-1",
  sourceId: "src-1",
  rawItemId: "raw-1",
  title: "AI Act implementation guidance",
  sourceName: "European Commission",
  sourceUrl: "https://commission.europa.eu/example",
  jurisdiction: "European Union",
  region: "Europe",
  country: "European Union",
  developmentType: "Agency guidance",
  legalArea: "AI governance",
  publicationDate: "2026-05-30",
  detectedDate: "2026-05-30T00:00:00.000Z",
  oneSentenceSummary: "Summary.",
  summary: "Summary.",
  whatHappened: "What happened.",
  whyItMatters: "Why.",
  practicalImpact: "Impact.",
  affectedParties: [],
  keyObligations: [],
  complianceDeadlines: [],
  enforcementRisk: "Risk.",
  importanceLevel: "high",
  confidenceLevel: "high",
  tags: [],
  status: "approved",
  reviewedBy: "Admin Reviewer",
  reviewedAt: "2026-05-30T10:00:00.000Z",
  publishedAt: null,
  createdAt: "2026-05-30T10:00:00.000Z",
  updatedAt: "2026-05-30T10:00:00.000Z",
};

const baseRawItem: RawRegulatoryItem = {
  id: "raw-1",
  sourceId: "src-1",
  rawTitle: "AI Act implementation guidance",
  rawUrl: "https://commission.europa.eu/example",
  rawText: "Official text",
  rawMetadata: {
    sourceReferences: [
      {
        sourceRole: "primary",
        title: "European Commission AI page",
        institution: "European Commission",
        url: "https://commission.europa.eu/example",
        canonicalUrl: "https://commission.europa.eu/example",
        sourceType: "official",
        authorityType: "Agency guidance",
        publicationDate: "2026-05-30",
        detectedAt: "2026-05-30T00:00:00.000Z",
        retrievedAt: "2026-05-30T00:00:00.000Z",
        lastVerifiedAt: "2026-05-30T00:00:00.000Z",
        jurisdiction: "European Union",
        documentType: "Agency guidance",
        reliabilityLevel: "high",
        verificationStatus: "verified",
      },
    ],
    verification: {
      verificationStatus: "verified_for_review",
      officialSourceFound: true,
      officialSourceUrl: "https://commission.europa.eu/example",
      publicVisibilityAllowed: true,
    },
  },
  detectedAt: "2026-05-30T00:00:00.000Z",
  hash: "hash-1",
  duplicateOf: null,
  processingStatus: "processed",
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z",
};

const baseSource: RegulationSource = {
  id: "src-1",
  name: "European Commission",
  jurisdiction: "European Union",
  region: "Europe",
  country: "European Union",
  sourceUrl: "https://commission.europa.eu/example",
  sourceType: "regulator_page",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: "2026-05-30T00:00:00.000Z",
  notes: "Official source",
  reliabilityLevel: "high",
  preferredExtractionMethod: "html_static",
  config: {},
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z",
};

describe("evaluatePublicationEligibility", () => {
  it("allows publication only when review and official citation requirements are satisfied", () => {
    const result = evaluatePublicationEligibility({
      update: baseUpdate,
      rawItem: baseRawItem,
      source: baseSource,
    });

    expect(result.eligible).toBe(true);
    expect(result.blockingReasons).toEqual([]);
  });

  it("blocks publication for discovery-only sources", () => {
    const result = evaluatePublicationEligibility({
      update: baseUpdate,
      rawItem: baseRawItem,
      source: {
        ...baseSource,
        name: "AI Weekly",
        config: { sourceCategory: "discovery_source" },
      },
    });

    expect(result.eligible).toBe(false);
    expect(
      result.blockingReasons.some((reason) => reason.includes("Discovery-only")),
    ).toBe(true);
  });

  it("allows automatic publication before admin approval when an official source is confirmed", () => {
    const result = evaluatePublicationEligibility({
      update: { ...baseUpdate, status: "needs_review" },
      rawItem: baseRawItem,
      source: baseSource,
    });

    expect(result.eligible).toBe(true);
    expect(result.blockingReasons).toEqual([]);
    expect(result.recommendedAction).toContain("automatic publication");
  });
});
