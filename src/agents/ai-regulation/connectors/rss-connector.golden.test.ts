import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { RssConnector } from "@/agents/ai-regulation/connectors/rss-connector";
import type { RegulationSource } from "@/agents/ai-regulation/types";

const fixturesDir = join(process.cwd(), "src", "agents", "ai-regulation", "connectors", "fixtures");

function makeSource(overrides: Partial<RegulationSource>): RegulationSource {
  return {
    id: "src-rss-golden",
    name: "Golden RSS Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: "https://example.test/rss.xml",
    sourceType: "RSS",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "golden fixture",
    reliabilityLevel: "high",
    preferredExtractionMethod: "rss",
    config: {},
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("RssConnector golden official feed fixtures", () => {
  it.each([
    {
      fixture: "rss-garante-ai.xml",
      sourceId: "src-it-garante-ai",
      country: "Italy",
      jurisdiction: "Italy",
      includeAnyTerms: ["intelligenza artificiale", "AI"],
      expectedTitle: "Intelligenza artificiale: provvedimento del Garante",
      expectedCategory: "Intelligenza artificiale",
    },
    {
      fixture: "rss-bfdi-ai.xml",
      sourceId: "src-de-bfdi-ai",
      country: "Germany",
      jurisdiction: "Germany",
      includeAnyTerms: ["kuenstliche intelligenz", "KI"],
      expectedTitle: "BfDI veroeffentlicht Hinweise zu KI-Systemen",
      expectedCategory: "Kuenstliche Intelligenz",
    },
    {
      fixture: "rss-agid-ai.xml",
      sourceId: "src-it-agid-ai",
      country: "Italy",
      jurisdiction: "Italy",
      includeAnyTerms: ["intelligenza artificiale", "AI"],
      expectedTitle: "Linee guida per l'intelligenza artificiale nella PA",
      expectedCategory: "Innovazione digitale",
    },
    {
      fixture: "rss-imy-ai.xml",
      sourceId: "src-se-imy-ai",
      country: "Sweden",
      jurisdiction: "Sweden",
      includeAnyTerms: ["artificiell intelligens", "AI"],
      expectedTitle: "IMY granskar AI-system och personuppgifter",
      expectedCategory: "Artificiell intelligens",
    },
  ])("maps and filters $sourceId from a recorded RSS XML payload", async (entry) => {
    const xml = readFileSync(join(fixturesDir, entry.fixture), "utf8");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(xml, {
          status: 200,
          headers: { "content-type": "application/rss+xml" },
        }),
      ),
    );

    const connector = new RssConnector();
    const result = await connector.scan(
      makeSource({
        id: entry.sourceId,
        name: entry.sourceId,
        country: entry.country,
        jurisdiction: entry.jurisdiction as RegulationSource["jurisdiction"],
        config: {
          includeAnyTerms: entry.includeAnyTerms,
          maxItems: 10,
        },
      }),
    );

    expect(result.errors).toEqual([]);
    expect(result.responseStatus).toBe(200);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      sourceId: entry.sourceId,
      title: entry.expectedTitle,
      metadata: {
        contentType: "rss_item",
      },
    });
    expect(result.items[0]?.metadata?.categories).toContain(entry.expectedCategory);
    expect(result.zeroResultsReason).toBeNull();

    vi.unstubAllGlobals();
  });
});
