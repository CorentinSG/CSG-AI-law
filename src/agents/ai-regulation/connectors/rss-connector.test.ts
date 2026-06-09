import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RssConnector } from "@/agents/ai-regulation/connectors/rss-connector";
import type { RegulationSource } from "@/agents/ai-regulation/types";

const { parseUrlMock } = vi.hoisted(() => ({
  parseUrlMock: vi.fn(),
}));

vi.mock("rss-parser", () => {
  return {
    default: class MockParser {
      parseURL = parseUrlMock;
    },
  };
});

function makeSource(overrides: Partial<RegulationSource>): RegulationSource {
  return {
    id: "src-rss-test",
    name: "Test RSS Source",
    jurisdiction: "United States federal",
    region: "North America",
    country: "United States",
    sourceUrl: "https://example.gov/feed.xml",
    sourceType: "RSS",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "test",
    reliabilityLevel: "high",
    preferredExtractionMethod: "rss",
    config: {},
    createdAt: "2026-05-24T00:00:00.000Z",
    updatedAt: "2026-05-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("RssConnector", () => {
  beforeEach(() => {
    parseUrlMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("filters RSS items deterministically using configured include terms", async () => {
    parseUrlMock.mockResolvedValue({
      title: "Agency Feed",
      items: [
        {
          title: "FTC warns about deceptive AI claims",
          link: "https://example.gov/ai-guidance",
          contentSnippet: "Artificial intelligence marketing guidance.",
          isoDate: "2026-05-24T00:00:00.000Z",
          guid: "guid-1",
        },
        {
          title: "General consumer update",
          link: "https://example.gov/general-update",
          contentSnippet: "A general update with no emerging technology angle.",
          isoDate: "2026-05-23T00:00:00.000Z",
          guid: "guid-2",
        },
      ],
    });

    const connector = new RssConnector();
    const result = await connector.scan(
      makeSource({
        config: {
          includeAnyTerms: ["artificial intelligence", "AI"],
          maxItems: 10,
        },
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toContain("AI");
    expect(result.responseStatus).toBe(200);
  });

  it("returns a clear zero-result reason when configured terms match nothing", async () => {
    parseUrlMock.mockResolvedValue({
      title: "Agency Feed",
      items: [
        {
          title: "General update",
          link: "https://example.gov/general-update",
          contentSnippet: "A general update with no relevant AI material.",
          isoDate: "2026-05-23T00:00:00.000Z",
          guid: "guid-1",
        },
      ],
    });

    const connector = new RssConnector();
    const result = await connector.scan(
      makeSource({
        config: {
          includeAnyTerms: ["algorithmic pricing"],
        },
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("configured deterministic AI-regulation terms");
  });

  it("handles RSS category objects from richer XML feeds without crashing", async () => {
    parseUrlMock.mockResolvedValue({
      title: "European Commission | Highlighted news",
      items: [
        {
          title: "European Commission advances artificial intelligence governance package",
          link: "https://commission.europa.eu/example-ai-update",
          contentSnippet: "The Commission published an AI-related update.",
          isoDate: "2026-06-02T14:57:27.000Z",
          guid: "guid-ai-1",
          categories: [
            {
              _: "Directorate-General for Communication",
              $: { domain: "http://publications.europa.eu/resource/authority/corporate-body" },
            },
            {
              _: "Artificial intelligence",
              $: { domain: "topic" },
            },
          ],
        },
      ],
    });

    const connector = new RssConnector();
    const result = await connector.scan(
      makeSource({
        sourceUrl: "https://commission.europa.eu/node/29665/rss_en",
        config: {
          includeAnyTerms: ["artificial intelligence", "AI Act"],
          maxItems: 10,
        },
      }),
    );

    expect(result.errors).toEqual([]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.metadata?.categories).toEqual([
      "Directorate-General for Communication",
      "Artificial intelligence",
    ]);
  });
});
