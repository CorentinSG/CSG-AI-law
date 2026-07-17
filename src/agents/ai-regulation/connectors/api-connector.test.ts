import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiConnector } from "@/agents/ai-regulation/connectors/api-connector";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { resetEnvForTests } from "@/lib/env";

function makeSource(overrides: Partial<RegulationSource>): RegulationSource {
  return {
    id: "src-api-test",
    name: "Test API Source",
    jurisdiction: "France",
    region: "Europe",
    country: "France",
    sourceUrl: "https://example.test/api",
    sourceType: "API",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "test",
    reliabilityLevel: "high",
    preferredExtractionMethod: "api",
    config: {},
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEWSAPI_API_KEY;
  delete process.env.JUDILIBRE_API_KEYID;
  delete process.env.COURTLISTENER_API_KEY;
  delete process.env.COURTLISTENER_API_TOKEN;
  delete process.env.LEGAL_DATA_HUNTER_MCP_URL;
  delete process.env.LEGAL_DATA_HUNTER_API_KEY;
  delete process.env.LEGAL_RESEARCH_MCP_URL;
  delete process.env.EURLEX_USERNAME;
  delete process.env.EURLEX_PASSWORD;
  delete process.env.LEGIFRANCE_PISTE_CLIENT_ID;
  delete process.env.LEGIFRANCE_PISTE_CLIENT_SECRET;
  process.env.ADMIN_AUTH_SECRET = "test-admin-secret-1234567890";
  resetEnvForTests();
});

process.env.ADMIN_AUTH_SECRET = "test-admin-secret-1234567890";

describe("ApiConnector", () => {
  it("returns a safe zero-result warning when NewsAPI credentials are missing", async () => {
    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-newsapi-ai",
        sourceUrl: "https://newsapi.org/v2/everything?q=ai",
        config: { apiProvider: "newsapi" },
        sourceType: "media_source",
        reliabilityLevel: "medium",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("NEWSAPI_API_KEY");
  });

  it("maps NewsAPI discovery articles into candidate items", async () => {
    process.env.NEWSAPI_API_KEY = "test-key";
    resetEnvForTests();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          articles: [
            {
              source: { id: "reuters", name: "Reuters" },
              title: "France AI Act and CNIL developments",
              description: "A legal update involving the AI Act and CNIL.",
              content: "Further details on AI regulation in France.",
              url: "https://example.com/reuters-ai",
              publishedAt: "2026-06-02T10:00:00.000Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-newsapi-ai",
        sourceUrl: "https://newsapi.org/v2/everything?q=ai",
        config: { apiProvider: "newsapi" },
        sourceType: "media_source",
        reliabilityLevel: "medium",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toContain("France AI Act");
  });

  it("filters out AI articles without a legal or regulatory angle", async () => {
    process.env.NEWSAPI_API_KEY = "test-key";
    resetEnvForTests();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          articles: [
            {
              source: { id: "tech", name: "Tech Outlet" },
              title: "New artificial intelligence model released for consumers",
              description: "A product launch with no legal angle.",
              content: "This article discusses model features and benchmarks.",
              url: "https://example.com/product-ai",
              publishedAt: "2026-06-02T10:00:00.000Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-eu-major-press-newsapi-ai",
        sourceUrl: "https://newsapi.org/v2/everything?q=ai",
        config: {
          apiProvider: "newsapi",
          allowedDomains: ["reuters.com"],
        },
        sourceType: "media_source",
        reliabilityLevel: "medium",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("AI-plus-legal-regulatory");
  });

  it("keeps only major-press legal AI articles from allowed domains", async () => {
    process.env.NEWSAPI_API_KEY = "test-key";
    resetEnvForTests();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          articles: [
            {
              source: { id: "reuters", name: "Reuters" },
              title: "EU AI Act regulation enters new enforcement phase",
              description: "A legal update on artificial intelligence regulation in Europe.",
              content: "Commission guidance and enforcement posture are discussed.",
              url: "https://www.reuters.com/world/europe/eu-ai-act-regulation-update-2026-06-02/",
              publishedAt: "2026-06-02T10:00:00.000Z",
            },
            {
              source: { id: "blog", name: "Random Blog" },
              title: "AI regulation commentary",
              description: "Commentary post",
              content: "Blog discussion of AI law.",
              url: "https://randomblog.example/ai-law",
              publishedAt: "2026-06-02T11:00:00.000Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-eu-major-press-newsapi-ai",
        name: "Europe AI legal major press (NewsAPI)",
        sourceUrl: "https://newsapi.org/v2/everything?q=ai",
        config: {
          apiProvider: "newsapi",
          allowedDomains: ["reuters.com", "politico.eu"],
        },
        sourceType: "media_source",
        reliabilityLevel: "medium",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.url).toContain("reuters.com");
  });

  it("maps Judilibre decisions when a KeyId is available", async () => {
    process.env.JUDILIBRE_API_KEYID = "test-key-id";
    resetEnvForTests();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: "decision-1",
              title: "Arrêt relatif à l'intelligence artificielle",
              summary: "Résumé de la décision.",
              text: "Texte de la décision.",
              number: "24-10.001",
              formation: "Chambre sociale",
              jurisdiction: "Cour de cassation",
              date: "2026-05-20",
              files: [{ type: "text/html", url: "https://example.test/decision-1" }],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-judilibre-ai",
        name: "Judilibre AI-related decisions",
        sourceUrl: "https://api.piste.gouv.fr/cassation/judilibre/v1.0/search?query=intelligence%20artificielle",
        config: { apiProvider: "judilibre" },
        sourceType: "court_database",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.metadata?.number).toBe("24-10.001");
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("KeyId")).toBe("test-key-id");
  });

  it("maps Judilibre decisions with PISTE OAuth credentials when a KeyId is absent", async () => {
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
        new Response(
          JSON.stringify({
            results: [
              {
                id: "decision-1",
                title: "Decision relative a l'intelligence artificielle",
                summary: "Resume de la decision.",
                number: "24-10.001",
                formation: "Chambre sociale",
                jurisdiction: "Cour de cassation",
                date: "2026-05-20",
                files: [{ type: "text/html", url: "https://example.test/decision-1" }],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-judilibre-ai",
        name: "Judilibre AI-related decisions",
        sourceUrl:
          "https://api.piste.gouv.fr/cassation/judilibre/v1.0/search?query=intelligence%20artificielle",
        config: { apiProvider: "judilibre" },
        sourceType: "court_database",
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const headers = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.metadata?.provider).toBe("judilibre");
  });

  it("returns a non-fatal warning when Judilibre rejects the request", async () => {
    process.env.JUDILIBRE_API_KEYID = "invalid-key";
    resetEnvForTests();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "bad request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-judilibre-ai",
        name: "Judilibre AI-related decisions",
        sourceUrl: "https://api.piste.gouv.fr/cassation/judilibre/v1.0/search?query=intelligence%20artificielle",
        config: { apiProvider: "judilibre" },
        sourceType: "court_database",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0]).toContain(
      "Judilibre official-case-law discovery could not be queried safely",
    );
    expect(result.zeroResultsReason).toContain("400");
  });

  it("degrades honestly when Legifrance PISTE credentials are missing", async () => {
    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        sourceUrl: "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search",
        config: { apiProvider: "legifrance" },
        sourceType: "legislative_database",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("LEGIFRANCE_PISTE_CLIENT_ID/SECRET");
  });

  it("maps Legifrance results when PISTE credentials are available", async () => {
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
        new Response(
          JSON.stringify({
            results: [
              {
                titles: [{ cid: "JORFTEXT000049000001", title: "Décret relatif à l'intelligence artificielle" }],
                nature: "DECRET",
                date: "2026-05-20",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        sourceUrl: "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search",
        config: { apiProvider: "legifrance" },
        sourceType: "legislative_database",
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toContain("intelligence artificielle");
    expect(result.items[0]?.url).toBe(
      "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000049000001",
    );
    expect(result.items[0]?.metadata?.provider).toBe("legifrance");
  });

  it("returns a non-fatal warning when the Legifrance API rejects the request", async () => {
    process.env.LEGIFRANCE_PISTE_CLIENT_ID = "test-client";
    process.env.LEGIFRANCE_PISTE_CLIENT_SECRET = "test-secret";
    resetEnvForTests();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "test-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "bad request" }), { status: 400 }),
      );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        sourceUrl: "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search",
        config: { apiProvider: "legifrance" },
        sourceType: "legislative_database",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0]).toContain(
      "Legifrance official DILA/PISTE API could not be queried safely",
    );
  });

  it("degrades honestly when EUR-Lex webservice credentials are missing", async () => {
    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-eur-lex-ai",
        name: "EUR-Lex AI webservice search",
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
        sourceUrl: "https://eur-lex.europa.eu/EURLexWebService",
        config: { apiProvider: "eurlex" },
        sourceType: "legislative_database",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("EURLEX_USERNAME/EURLEX_PASSWORD");
  });

  it("queries EUR-Lex SOAP webservice and maps official results", async () => {
    process.env.EURLEX_USERNAME = "test-user";
    process.env.EURLEX_PASSWORD = "test-password";
    resetEnvForTests();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
          <soap:Body>
            <searchResults xmlns="http://eur-lex.europa.eu/search">
              <numhits>1</numhits>
              <totalhits>1</totalhits>
              <page>1</page>
              <language>EN</language>
              <result>
                <reference>32024R1689</reference>
                <rank>1</rank>
                <document_link type="html">https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689</document_link>
                <content>
                  <title>Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence</title>
                  <date_document>2024-06-13</date_document>
                </content>
              </result>
            </searchResults>
          </soap:Body>
        </soap:Envelope>`,
        { status: 200, headers: { "Content-Type": "application/soap+xml" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-eur-lex-ai",
        name: "EUR-Lex AI webservice search",
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
        sourceUrl: "https://eur-lex.europa.eu/EURLexWebService",
        config: {
          apiProvider: "eurlex",
          expertQuery: 'TI="AI Act"',
          searchLanguage: "EN",
          maxItems: 5,
        },
        sourceType: "legislative_database",
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.method).toBe("POST");
    expect(String(requestInit?.body)).toContain("<wsse:Username>test-user</wsse:Username>");
    expect(String(requestInit?.body)).toContain(
      'PasswordText">test-password</wsse:Password>',
    );
    expect(String(requestInit?.body)).toContain("<elx:expertQuery>TI=&quot;AI Act&quot;</elx:expertQuery>");
    expect(String(requestInit?.body)).toContain("<elx:searchLanguage>en</elx:searchLanguage>");
    expect(String(requestInit?.body)).toContain("<elx:excludeAllConsleg>true</elx:excludeAllConsleg>");
    expect(String(requestInit?.body)).toContain("<elx:limitToLatestConsleg>false</elx:limitToLatestConsleg>");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toContain("harmonised rules on artificial intelligence");
    expect(result.items[0]?.url).toContain("CELEX:32024R1689");
    expect(result.items[0]?.metadata?.provider).toBe("eurlex");
    expect(result.items[0]?.metadata?.reference).toBe("32024R1689");
  });

  it("degrades honestly when CourtListener credentials are missing", async () => {
    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-us-courtlistener-ai",
        name: "CourtListener AI case-law search",
        jurisdiction: "United States federal",
        region: "North America",
        country: "United States",
        sourceUrl: "https://www.courtlistener.com/api/rest/v4/search/?q=artificial%20intelligence&type=o",
        config: { apiProvider: "courtlistener" },
        sourceType: "court_database",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("COURTLISTENER_API_KEY/COURTLISTENER_API_TOKEN");
  });

  it("maps CourtListener case-law results when credentials are available", async () => {
    process.env.COURTLISTENER_API_TOKEN = "test-courtlistener-token";
    resetEnvForTests();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 123,
              docket_id: 456,
              case_name: "Doe v. AI Platform",
              case_name_full: "Doe v. AI Platform Inc.",
              absolute_url: "/opinion/123/doe-v-ai-platform/",
              date_filed: "2026-05-01",
              court: "ca2",
              precedential_status: "Published",
              summary: "Decision discussing artificial intelligence and legal obligations.",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-us-courtlistener-ai",
        name: "CourtListener AI case-law search",
        jurisdiction: "United States federal",
        region: "North America",
        country: "United States",
        sourceUrl: "https://www.courtlistener.com/api/rest/v4/search/?q=artificial%20intelligence&type=o",
        config: { apiProvider: "courtlistener" },
        sourceType: "court_database",
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.headers).toBeInstanceOf(Headers);
    expect((requestInit?.headers as Headers).get("authorization")).toBe(
      "Token test-courtlistener-token",
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe("Doe v. AI Platform Inc.");
    expect(result.items[0]?.url).toBe(
      "https://www.courtlistener.com/opinion/123/doe-v-ai-platform/",
    );
    expect(result.items[0]?.metadata?.provider).toBe("courtlistener");
    expect(result.items[0]?.metadata?.docketId).toBe(456);
  });

  it("degrades honestly when Legal Data Hunter MCP endpoint is missing", async () => {
    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-global-legal-data-hunter",
        name: "Legal Data Hunter global search",
        jurisdiction: "European Union",
        region: "Global",
        country: "European Union",
        sourceUrl: "https://legal-data-hunter.example/mcp",
        config: { apiProvider: "legal_data_hunter" },
        sourceType: "API",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("LEGAL_DATA_HUNTER_MCP_URL");
  });

  it("posts legal-research requests to Legal Data Hunter and maps results", async () => {
    process.env.LEGAL_DATA_HUNTER_MCP_URL = "https://legal-data-hunter.example/mcp";
    process.env.LEGAL_DATA_HUNTER_API_KEY = "hunter-token";
    resetEnvForTests();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: "ldh-1",
              title: "AI governance statute update",
              url: "https://official.example/legal/ai-governance",
              summary: "Official legal update about artificial intelligence governance.",
              publicationDate: "2026-06-01",
              jurisdiction: "European Union",
              authorityType: "Binding law",
              sourceType: "official_legal_database",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as Response,
    );

    const connector = new ApiConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-global-legal-data-hunter",
        name: "Legal Data Hunter global search",
        jurisdiction: "European Union",
        region: "Global",
        country: "European Union",
        sourceUrl: "https://legal-data-hunter.example/mcp",
        config: {
          apiProvider: "legal_data_hunter",
          query: "AI governance statute",
          maxItems: 5,
        },
        sourceType: "API",
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestInit?.method).toBe("POST");
    expect((requestInit?.headers as Record<string, string>).Authorization).toBe(
      "Bearer hunter-token",
    );
    expect(JSON.parse(String(requestInit?.body))).toMatchObject({
      tool: "legal-research",
      action: "search",
      query: "AI governance statute",
      maxItems: 5,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.metadata?.provider).toBe("legal_data_hunter");
    expect(result.items[0]?.metadata?.authorityType).toBe("Binding law");
  });
});
