import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiConnector } from "@/agents/ai-regulation/connectors/api-connector";
import { RssConnector } from "@/agents/ai-regulation/connectors/rss-connector";
import {
  AI_ACT_CELEX,
  buildEurLexAiActCandidates,
  parseEurLexAiActHtml,
} from "@/agents/ai-regulation/eurLexAiActParser";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { resetEnvForTests } from "@/lib/env";

const fixturesDir = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures");

function readFixture(name: string) {
  return readFileSync(join(fixturesDir, name), "utf8");
}

function makeSource(overrides: Partial<RegulationSource>): RegulationSource {
  return {
    id: "src-golden-test",
    name: "Golden Test Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: "https://example.test/source",
    sourceType: "API",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "golden fixture regression",
    reliabilityLevel: "high",
    preferredExtractionMethod: "api",
    config: {},
    createdAt: "2026-06-18T00:00:00.000Z",
    updatedAt: "2026-06-18T00:00:00.000Z",
    ...overrides,
  };
}

describe("golden connector fixtures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LEGIFRANCE_PISTE_CLIENT_ID;
    delete process.env.LEGIFRANCE_PISTE_CLIENT_SECRET;
    resetEnvForTests();
  });

  it("maps a recorded Legifrance PISTE search response into a stable official candidate", async () => {
    process.env.ADMIN_AUTH_SECRET = "test-admin-secret-1234567890";
    process.env.LEGIFRANCE_PISTE_CLIENT_ID = "test-client";
    process.env.LEGIFRANCE_PISTE_CLIENT_SECRET = "test-secret";
    resetEnvForTests();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(readFixture("legifrance-search-response.json"), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await new ApiConnector().scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        jurisdiction: "France",
        country: "France",
        sourceUrl: "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search",
        sourceType: "legislative_database",
        config: { apiProvider: "legifrance" },
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Decret relatif aux systemes d'intelligence artificielle",
      url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000049000001",
      sourceId: "src-fr-legifrance-ai",
      metadata: {
        provider: "legifrance",
        nature: "DECRET",
      },
    });
    expect(result.items[0]?.publicationDate).toBe("2026-05-20");
  });

  it("parses a recorded EUR-Lex AI Act HTML fixture with stable CELEX and pinpoint metadata", () => {
    const html = readFixture("eur-lex-ai-act.html");
    const parsed = parseEurLexAiActHtml(html);

    expect(parsed.celexNumber).toBe(AI_ACT_CELEX);
    expect(parsed.articles.map((article) => article.label)).toEqual([
      "Article 5",
      "Article 113",
    ]);

    const [candidate] = buildEurLexAiActCandidates({
      html,
      source: makeSource({
        id: "src-eur-lex-ai-act",
        name: "EUR-Lex AI Act consolidated text",
        sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng#art_5",
        sourceType: "legislative_database",
      }),
    });

    expect(candidate.metadata?.celexNumber).toBe(AI_ACT_CELEX);
    expect(candidate.metadata?.pinpoint).toEqual({ CELEX: AI_ACT_CELEX, article: "5" });
    expect(candidate.excerpt).toContain("Article 5");
  });

  it("parses a recorded IMY RSS fixture and filters it with deterministic AI/data terms", async () => {
    const rss = readFixture("imy-ai-rss.xml");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(rss, {
        status: 200,
        headers: { "content-type": "application/rss+xml" },
      }),
    );

    const result = await new RssConnector().scan(
      makeSource({
        id: "src-se-imy-ai",
        name: "Sweden IMY AI and data protection news",
        jurisdiction: "Sweden",
        country: "Sweden",
        sourceUrl: "https://www.imy.se/nyheter/rss",
        sourceType: "RSS",
        preferredExtractionMethod: "rss",
        config: {
          includeAnyTerms: ["artificiell intelligens", "dataskydd", "AI"],
          excludeTerms: ["oppettider"],
          maxItems: 10,
        },
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "IMY publicerar vagledning om artificiell intelligens och dataskydd",
      url: "https://www.imy.se/nyheter/ai-dataskydd-vagledning/",
      sourceId: "src-se-imy-ai",
    });
    expect(result.items[0]?.metadata?.categories).toEqual([
      "Artificiell intelligens",
      "Dataskydd",
    ]);
  });
});
