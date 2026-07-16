import { describe, expect, it } from "vitest";

import {
  buildLocusDiscoveryLead,
  buildLocusDiscoveryMetadata,
  LOCUS_DATASET_URL,
  locusDiscoverySourceRegistration,
  parseLocusReviewerNotes,
} from "@/agents/ai-regulation/usLocusDiscovery";

describe("US LOCUS discovery corpus policy", () => {
  it("registers LOCUS as an inactive discovery source, not legal authority", () => {
    expect(locusDiscoverySourceRegistration).toMatchObject({
      id: "src-us-locus-v1",
      name: "LOCUS-v1 U.S. local law discovery corpus",
      jurisdiction: "United States federal",
      region: "United States",
      country: "United States",
      sourceUrl: LOCUS_DATASET_URL,
      sourceType: "discovery_source",
      active: false,
      sourceCategory: "discovery_source",
      config: {
        sourceCategory: "discovery_source",
        corpusRole: "external_research_corpus",
        legalAuthority: false,
        publicDisplayAllowed: false,
        requiresOfficialSource: true,
      },
    });
  });

  it("creates a private discovery lead for an AI-related local law row", () => {
    const lead = buildLocusDiscoveryLead(
      {
        header: "## 9.64.030 Facial recognition technology.",
        content:
          "The city shall not acquire or use facial recognition technology or other biometric systems without council approval.",
        state: "ca",
        city: "Oakland",
        county: "Alameda",
        topic: "Rules",
        function: "Restriction",
        source_jurisdiction_type: "cities",
        is_substantive: true,
        official_municipal_code_url: "https://library.municode.com/ca/oakland/codes/code_of_ordinances",
      },
      { detectedAt: "2026-07-16T00:00:00.000Z" },
    );

    expect(lead).not.toBeNull();
    expect(lead).toMatchObject({
      rawItemId: null,
      sourceId: "src-us-locus-v1",
      discoverySourceUrl: LOCUS_DATASET_URL,
      outboundUrl: "https://library.municode.com/ca/oakland/codes/code_of_ordinances",
      detectedAt: "2026-07-16T00:00:00.000Z",
      possibleJurisdiction: "Oakland, CA",
      possibleTopic: "facial recognition",
      possibleLegalArea: "U.S. local AI law",
      possibleAuthorityType: "Discovery lead",
      status: "unresolved",
      officialSourceFound: false,
      publicVisibilityAllowed: false,
      convertedUpdateId: null,
    });

    const metadata = parseLocusReviewerNotes(lead?.reviewerNotes);
    expect(metadata).toMatchObject({
      corpusSource: "LOCUS-v1",
      city: "Oakland",
      county: "Alameda",
      state: "CA",
      topic: "facial recognition",
      officialMunicipalCodeUrl: "https://library.municode.com/ca/oakland/codes/code_of_ordinances",
      verificationStatus: "needs_official_source",
      citationQuality: "discovery_only",
      requiresOfficialSource: true,
      publicDisplayAllowed: false,
    });
    expect(metadata?.detectedTerms).toContain("facial recognition");
    expect(metadata?.detectedTerms).toContain("biometric");
    expect(metadata?.confidenceScore).toBeGreaterThanOrEqual(0.7);
  });

  it("rejects non-AI local-law rows", () => {
    const lead = buildLocusDiscoveryLead({
      header: "### 1.05.010 Name of municipality.",
      content: "The City of King Cove shall continue as a municipal corporation.",
      state: "ak",
      city: "King Cove",
      topic: "Context",
      is_substantive: false,
    });

    expect(lead).toBeNull();
  });

  it("classifies data centers only when AI infrastructure is present", () => {
    expect(
      buildLocusDiscoveryMetadata({
        content: "A permit is required for any data center in the industrial zone.",
        state: "va",
        county: "Loudoun",
      }),
    ).toBeNull();

    const metadata = buildLocusDiscoveryMetadata({
      content:
        "The county shall review artificial intelligence data center projects for energy and water infrastructure impacts.",
      state: "va",
      county: "Loudoun",
    });

    expect(metadata?.topic).toBe("AI infrastructure data centers");
    expect(metadata?.requiresOfficialSource).toBe(true);
    expect(metadata?.publicDisplayAllowed).toBe(false);
  });

  it("does not create verified legal authority or public items from LOCUS alone", () => {
    const lead = buildLocusDiscoveryLead({
      content:
        "The city uses automated license plate readers only after public notice and annual reporting.",
      state: "wa",
      city: "Seattle",
      url: "https://example.com/non-official-copy",
      is_substantive: true,
    });

    expect(lead).not.toBeNull();
    expect(lead?.status).toBe("unresolved");
    expect(lead?.officialSourceFound).toBe(false);
    expect(lead?.publicVisibilityAllowed).toBe(false);
    expect(lead?.convertedUpdateId).toBeNull();
    expect(lead?.possibleAuthorityType).toBe("Discovery lead");

    const metadata = parseLocusReviewerNotes(lead?.reviewerNotes);
    expect(metadata?.conversionRequirements).toContain(
      "Find the official municipal or county ordinance source.",
    );
    expect(metadata?.conversionRequirements).toContain(
      "Keep admin review available before any legal-database conversion.",
    );
  });
});
