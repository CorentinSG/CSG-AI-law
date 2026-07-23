import { describe, expect, it } from "vitest";

import {
  buildCorroborationMetadataPatch,
  findCorroboratingUpdates,
  isEligibleCorroboratingSource,
} from "@/agents/ai-regulation/processors/crossSourceCorroboration";
import type {
  AiRegulatoryUpdate,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { VerificationMetadata } from "@/agents/ai-regulation/verification";

const NOW = "2026-07-23T12:00:00.000Z";

function buildSource(
  overrides: Partial<RegulationSource> & { id: string },
): RegulationSource {
  return {
    name: `Source ${overrides.id}`,
    jurisdiction: "France",
    region: "Europe",
    country: "France",
    sourceUrl: `https://example.org/${overrides.id}`,
    sourceType: "regulator_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as RegulationSource;
}

function buildUpdate(
  overrides: Partial<AiRegulatoryUpdate> & { id: string; sourceId: string },
): AiRegulatoryUpdate {
  return {
    rawItemId: `raw-${overrides.id}`,
    title: "CNIL publishes AI Act compliance guidance for recommendation systems",
    sourceName: `Source ${overrides.sourceId}`,
    sourceUrl: `https://example.org/${overrides.id}`,
    jurisdiction: "France",
    region: "Europe",
    country: "France",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    publicationDate: "2026-07-22",
    detectedDate: "2026-07-22",
    oneSentenceSummary: "",
    summary: "",
    whatHappened: "",
    whyItMatters: "",
    practicalImpact: "",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "",
    importanceLevel: "medium",
    confidenceLevel: "medium",
    tags: [],
    status: "published",
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as AiRegulatoryUpdate;
}

describe("isEligibleCorroboratingSource", () => {
  it("accepts official and media sources, rejects informal discovery", () => {
    expect(isEligibleCorroboratingSource(buildSource({ id: "s1" }))).toBe(true);
    expect(
      isEligibleCorroboratingSource(
        buildSource({ id: "s2", config: { sourceCategory: "media_discovery_source" } }),
      ),
    ).toBe(true);
    expect(
      isEligibleCorroboratingSource(
        buildSource({ id: "s3", config: { sourceCategory: "discovery_source" } }),
      ),
    ).toBe(false);
    expect(isEligibleCorroboratingSource(null)).toBe(false);
  });
});

describe("findCorroboratingUpdates", () => {
  const update = buildUpdate({ id: "u-new", sourceId: "src-cnil" });
  const sourcesById = new Map<string, RegulationSource>([
    ["src-cnil", buildSource({ id: "src-cnil" })],
    ["src-mlex", buildSource({ id: "src-mlex", config: { sourceCategory: "media_discovery_source" } })],
    ["src-tracker", buildSource({ id: "src-tracker", config: { sourceCategory: "discovery_source" } })],
    ["src-legifrance", buildSource({ id: "src-legifrance" })],
  ]);

  it("matches a similar recent title from a different serious source", () => {
    const counterpart = buildUpdate({
      id: "u-press",
      sourceId: "src-mlex",
      title: "CNIL AI Act compliance guidance targets recommendation systems",
    });
    const matches = findCorroboratingUpdates({
      update,
      recentUpdates: [counterpart],
      sourcesById,
    });
    expect(matches).toHaveLength(1);
    expect(matches[0].update.id).toBe("u-press");
  });

  it("never matches the same source, informal discovery, rejected items, or other regions", () => {
    const sameSource = buildUpdate({ id: "u-same", sourceId: "src-cnil" });
    const informal = buildUpdate({ id: "u-informal", sourceId: "src-tracker" });
    const rejected = buildUpdate({
      id: "u-rejected",
      sourceId: "src-mlex",
      status: "rejected",
    });
    const otherRegion = buildUpdate({
      id: "u-us",
      sourceId: "src-legifrance",
      jurisdiction: "United States federal",
      region: "North America",
      country: "United States",
    });
    const dissimilar = buildUpdate({
      id: "u-other",
      sourceId: "src-legifrance",
      title: "Senate hearing examines biometric surveillance moratorium",
    });

    expect(
      findCorroboratingUpdates({
        update,
        recentUpdates: [sameSource, informal, rejected, otherRegion, dissimilar],
        sourcesById,
      }),
    ).toHaveLength(0);
  });

  it("ignores counterparts outside the corroboration window", () => {
    const tooOld = buildUpdate({
      id: "u-old",
      sourceId: "src-mlex",
      publicationDate: "2026-05-01",
      detectedDate: "2026-05-01",
    });
    expect(
      findCorroboratingUpdates({ update, recentUpdates: [tooOld], sourcesById }),
    ).toHaveLength(0);
  });

  it("counts each counterpart source only once", () => {
    const first = buildUpdate({ id: "u-a", sourceId: "src-mlex" });
    const second = buildUpdate({ id: "u-b", sourceId: "src-mlex" });
    expect(
      findCorroboratingUpdates({ update, recentUpdates: [first, second], sourcesById }),
    ).toHaveLength(1);
  });
});

describe("buildCorroborationMetadataPatch", () => {
  const counterpart = buildUpdate({
    id: "u-press",
    sourceId: "src-mlex",
    title: "CNIL AI Act compliance guidance targets recommendation systems",
    sourceUrl: "https://mlex.example/article",
  });
  const counterpartSource = buildSource({
    id: "src-mlex",
    config: { sourceCategory: "media_discovery_source" },
  });
  const verification = {
    verificationStatus: "verified_for_review",
    officialSourceFound: true,
    corroboratingSourcesCount: 0,
    corroboratingSourceUrls: [],
  } as unknown as VerificationMetadata;

  it("appends a supporting reference and marks verification corroborated", () => {
    const patch = buildCorroborationMetadataPatch({
      rawItem: { rawMetadata: { sourceReferences: [], verification } },
      matches: [{ update: counterpart, source: counterpartSource }],
      now: NOW,
    });

    expect(patch).not.toBeNull();
    expect(patch?.addedReferences).toHaveLength(1);
    expect(patch?.addedReferences[0].sourceRole).toBe("supporting");
    expect(patch?.addedReferences[0].sourceType).toBe("media_source");
    const patchedVerification = patch?.rawMetadata.verification as VerificationMetadata;
    expect(patchedVerification.verificationStatus).toBe("corroborated");
    expect(patchedVerification.corroboratingSourcesCount).toBe(1);
    expect(patchedVerification.corroboratingSourceUrls).toEqual([
      "https://mlex.example/article",
    ]);
  });

  it("is idempotent for an already-recorded corroborating URL", () => {
    const first = buildCorroborationMetadataPatch({
      rawItem: { rawMetadata: { sourceReferences: [], verification } },
      matches: [{ update: counterpart, source: counterpartSource }],
      now: NOW,
    });
    const second = buildCorroborationMetadataPatch({
      rawItem: { rawMetadata: first!.rawMetadata },
      matches: [{ update: counterpart, source: counterpartSource }],
      now: NOW,
    });
    expect(second).toBeNull();
  });

  it("returns null when there is nothing to corroborate", () => {
    expect(
      buildCorroborationMetadataPatch({
        rawItem: { rawMetadata: {} },
        matches: [],
        now: NOW,
      }),
    ).toBeNull();
  });
});
