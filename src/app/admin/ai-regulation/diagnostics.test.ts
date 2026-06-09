import { describe, expect, it } from "vitest";

import {
  buildDiscoveryLeadRecordSummary,
  buildEuropeVerificationSummary,
  buildSourceAuthoritySummary,
  buildSourceVerificationSummary,
  buildRawMetadataPreview,
  classifySourceHealth,
  parseScanDiagnostics,
} from "@/app/admin/ai-regulation/diagnostics";

describe("admin diagnostics helpers", () => {
  it("parses structured scan diagnostics from scan log messages", () => {
    const parsed = parseScanDiagnostics({
      duplicatesDetected: 4,
      errors: [
        "items_fetched=12",
        "items_filtered_out=5",
        "items_inserted=3",
        "processing_failures=0",
        "scan_duration_ms=1240",
        "source_response_status=200",
        "warning=A listing was missing a publication date.",
      ],
    });

    expect(parsed.itemsFetched).toBe(12);
    expect(parsed.itemsFilteredOut).toBe(5);
    expect(parsed.itemsInserted).toBe(3);
    expect(parsed.duplicatesDetected).toBe(4);
    expect(parsed.sourceResponseStatus).toBe(200);
    expect(parsed.warnings).toEqual(["A listing was missing a publication date."]);
  });

  it("classifies duplicate-heavy scans as healthy rather than failed", () => {
    const summary = classifySourceHealth(
      { active: true, lastScannedAt: "2026-05-24T10:00:00.000Z" },
      {
        status: "success",
        newItemsDetected: 0,
        duplicatesDetected: 10,
        errors: ["items_fetched=10", "duplicates_detected=10"],
      },
    );

    expect(summary.label).toBe("Duplicate-heavy but healthy");
    expect(summary.tone).toBe("success");
  });

  it("surfaces parser-too-narrow zero-result reasons clearly", () => {
    const summary = classifySourceHealth(
      { active: true, lastScannedAt: "2026-05-24T10:00:00.000Z" },
      {
        status: "success",
        newItemsDetected: 0,
        duplicatesDetected: 0,
        errors: [
          "items_fetched=0",
          "zero_results_reason=No generic static-page items were parsed; the configured selectors may need updating.",
        ],
      },
    );

    expect(summary.label).toBe("Parser too narrow");
    expect(summary.detail).toContain("selectors");
  });

  it("classifies inactive sources explicitly", () => {
    const summary = classifySourceHealth(
      { active: false, lastScannedAt: null },
      null,
    );

    expect(summary.label).toBe("Intentionally inactive");
  });

  it("surfaces blocked sources distinctly", () => {
    const summary = classifySourceHealth(
      { active: true, lastScannedAt: "2026-05-24T10:00:00.000Z" },
      {
        status: "failed",
        newItemsDetected: 0,
        duplicatesDetected: 0,
        errors: [
          "source_response_status=403",
          "Static source request failed with 403",
        ],
      },
    );

    expect(summary.label).toBe("Blocked or forbidden");
    expect(summary.tone).toBe("danger");
  });

  it("builds a safe raw metadata preview", () => {
    const preview = buildRawMetadataPreview({
      id: "raw-1",
      sourceId: "src-1",
      rawTitle: "Sample item",
      rawUrl: "https://example.com/item",
      rawText:
        "This is a long source excerpt about artificial intelligence regulation and algorithmic accountability obligations.",
      rawMetadata: {
        publicationDate: "2026-05-24",
        tags: ["AI", "governance"],
      },
      detectedAt: "2026-05-24T10:00:00.000Z",
      hash: "hash-1",
      duplicateOf: null,
      processingStatus: "new",
      createdAt: "2026-05-24T10:00:00.000Z",
      updatedAt: "2026-05-24T10:00:00.000Z",
    });

    expect(preview.excerpt).toContain("artificial intelligence regulation");
    expect(preview.metadataPreview[0]).toContain("publicationDate");
  });

  it("builds authority diagnostics for technical standard sources", () => {
    const summary = buildSourceAuthoritySummary({
      id: "src-iso-42001",
      name: "ISO/IEC 42001",
      jurisdiction: "OECD",
      region: "International",
      country: "International",
      sourceUrl: "https://www.iso.org/standard/81230.html",
      sourceType: "static_page",
      scanFrequency: "weekly",
      active: true,
      lastScannedAt: null,
      notes: "Official ISO metadata page only.",
      reliabilityLevel: "high",
      preferredExtractionMethod: "html_static",
      config: {
        authorityTypeHint: "Technical standard",
        editorialNotes: ["Paywalled full standard; do not reproduce full text."],
      },
      createdAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
    });

    expect(summary.label).toBe("Technical Standard");
    expect(summary.shortNote).toContain("official metadata");
    expect(summary.adminNotes.join(" ")).toContain("Paywalled full standard");
  });

  it("builds verification diagnostics for blocked sources", () => {
    const summary = buildSourceVerificationSummary({
      id: "src-council-europe-ai",
      name: "Council of Europe Artificial Intelligence",
      jurisdiction: "Council of Europe",
      region: "Europe",
      country: "International",
      sourceUrl: "https://www.coe.int/en/web/artificial-intelligence/home",
      sourceType: "regulator_page",
      scanFrequency: "weekly",
      active: false,
      lastScannedAt: null,
      notes: "Held inactive.",
      reliabilityLevel: "high",
      preferredExtractionMethod: "html_static",
      config: {},
      createdAt: "2026-05-25T00:00:00.000Z",
      updatedAt: "2026-05-25T00:00:00.000Z",
    });

    expect(summary.label).toBe("Access blocked");
    expect(summary.tone).toBe("danger");
  });

  it("summarizes Europe verification backlog conservatively", () => {
    const summary = buildEuropeVerificationSummary();

    expect(summary.countriesPendingReview).toBeGreaterThan(0);
    expect(summary.lowerConfidenceMilestoneCount).toBe(0);
  });

  it("builds discovery lead summaries from dedicated discovery lead records", () => {
    const summary = buildDiscoveryLeadRecordSummary({
      lead: {
        id: "lead-1",
        rawItemId: "raw-1",
        sourceId: "src-1",
        headline: "Dedicated lead",
        discoverySourceUrl: "https://example.com/discovery",
        outboundUrl: "https://example.com/outbound",
        detectedAt: "2026-05-24T10:00:00.000Z",
        possibleJurisdiction: "United States / New York",
        possibleTopic: "Court filings",
        possibleLegalArea: "Legal ethics",
        possibleAuthorityType: "Administrative court rule",
        status: "official_source_found",
        officialSourceFound: true,
        officialSourceUrl: "https://nycourts.gov/example",
        corroboratingSourceCount: 1,
        corroboratingSourceUrls: ["https://example.org/corroborating"],
        convertedUpdateId: null,
        reviewerNotes: "Needs reviewer confirmation.",
        lastVerifiedAt: "2026-05-24T11:00:00.000Z",
        staleAt: null,
        publicVisibilityAllowed: false,
        createdAt: "2026-05-24T10:00:00.000Z",
        updatedAt: "2026-05-24T11:00:00.000Z",
      },
      rawItem: null,
      source: null,
      verification: null,
      storageMode: "dedicated",
    });

    expect(summary.headline).toBe("Dedicated lead");
    expect(summary.possibleOfficialSourceFound).toBe(true);
    expect(summary.discoverySourceUrl).toBe("https://example.com/discovery");
  });
});
