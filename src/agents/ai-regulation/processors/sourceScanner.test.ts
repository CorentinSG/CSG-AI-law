import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RegulationSource } from "@/agents/ai-regulation/types";

const mocks = vi.hoisted(() => ({
  staticScan: vi.fn(),
  scraplingExtract: vi.fn(),
  scrapeUrl: vi.fn(),
}));

vi.mock("@/agents/ai-regulation/connectors/static-page-connector", () => ({
  StaticPageConnector: vi.fn(
    class {
      scan = mocks.staticScan;
    },
  ),
}));

vi.mock("@/agents/ingestion/scraplingClient", () => ({
  isScraplingRuntimeAvailable: vi.fn(() => true),
  scraplingExtract: mocks.scraplingExtract,
}));

vi.mock("@/agents/ingestion/firecrawlService", () => ({
  scrapeUrl: mocks.scrapeUrl,
}));

const officialStaticSource: RegulationSource = {
  id: "src-pl-dpa-ai",
  name: "Polish DPA AI guidance",
  jurisdiction: "Poland",
  region: "Europe",
  country: "Poland",
  sourceUrl: "https://uodo.gov.pl/en/artificial-intelligence",
  sourceType: "regulator_page",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "Official AI monitoring source.",
  reliabilityLevel: "high",
  preferredExtractionMethod: "html_static",
  config: {},
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z",
  ingestionMethod: "existing",
  sourceCategory: "regulator",
};

describe("sourceScanner static fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SCRAPLING_WORKER_URL;
    delete process.env.FIRECRAWL_API_KEY;
  });

  it("falls back to Scrapling when an official static source blocks the standard fetch", async () => {
    process.env.SCRAPLING_WORKER_URL = "https://scrapling-worker.example";
    mocks.staticScan.mockRejectedValueOnce(new Error("fetch failed"));
    mocks.scraplingExtract.mockResolvedValueOnce({
      url: officialStaticSource.sourceUrl,
      title: "Official AI guidance",
      markdown:
        "The official data protection authority published practical AI guidance for controllers and processors.",
      published_at: null,
      source_id: officialStaticSource.id,
      extraction_method: "scrapling",
      content_hash: "hash-scrapling-guidance",
    });

    const { sourceScanner } = await import("./sourceScanner");
    const result = await sourceScanner.scanSource(officialStaticSource);

    expect(mocks.scraplingExtract).toHaveBeenCalledWith(
      officialStaticSource.sourceUrl,
      officialStaticSource.id,
      officialStaticSource.scraplingConfig,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Official AI guidance",
      url: officialStaticSource.sourceUrl,
      sourceId: officialStaticSource.id,
      sourceName: officialStaticSource.name,
      jurisdictionHint: "Poland",
    });
    expect(result.items[0]?.metadata).toMatchObject({
      contentType: "static_fallback_document",
      extractionMethod: "scrapling",
      fallbackFrom: "html_static",
    });
    expect(result.warnings.join(" ")).toContain("Scrapling fallback recovered");
  });

  it("does not use browser fallback for non-official static media sources", async () => {
    process.env.SCRAPLING_WORKER_URL = "https://scrapling-worker.example";
    mocks.staticScan.mockRejectedValueOnce(new Error("fetch failed"));
    const mediaSource: RegulationSource = {
      ...officialStaticSource,
      id: "src-media-ai",
      name: "AI law media source",
      sourceType: "media_source",
      sourceCategory: "media",
      reliabilityLevel: "medium",
    };

    const { sourceScanner } = await import("./sourceScanner");

    await expect(sourceScanner.scanSource(mediaSource)).rejects.toThrow("fetch failed");
    expect(mocks.scraplingExtract).not.toHaveBeenCalled();
  });
});
