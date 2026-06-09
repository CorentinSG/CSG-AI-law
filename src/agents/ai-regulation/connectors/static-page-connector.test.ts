import { afterEach, describe, expect, it, vi } from "vitest";

import { StaticPageConnector } from "@/agents/ai-regulation/connectors/static-page-connector";
import type { RegulationSource } from "@/agents/ai-regulation/types";

const originalFetch = global.fetch;

function makeSource(overrides: Partial<RegulationSource>): RegulationSource {
  return {
    id: "src-test",
    name: "Test Source",
    jurisdiction: "United States federal",
    region: "North America",
    country: "United States",
    sourceUrl: "https://example.gov/source",
    sourceType: "static_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "test",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: {},
    createdAt: "2026-05-24T00:00:00.000Z",
    updatedAt: "2026-05-24T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe("StaticPageConnector", () => {
  it("extracts White House listing items with dates and categories", async () => {
    const html = `
      <li class="wp-block-post">
        <div class="wp-block-post-title">
          <a href="https://www.whitehouse.gov/presidential-actions/2026/05/ensuring-a-national-policy-framework-for-artificial-intelligence/">
            Ensuring a National Policy Framework for Artificial Intelligence
          </a>
        </div>
        <div class="wp-block-post-terms">Presidential Actions, Executive Orders</div>
        <div class="wp-block-post-date"><time datetime="2025-12-11">December 11, 2025</time></div>
      </li>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-white-house-ai",
        name: "White House AI Presidential Actions",
        sourceUrl: "https://www.whitehouse.gov/presidential-actions/",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.publicationDate).toBe("2025-12-11");
    expect(result.items[0]?.developmentTypeHint).toBe("Executive order");
    expect(result.responseStatus).toBe(200);
  });

  it("extracts CNIL associated articles from the AI landing page", async () => {
    const html = `
      <div class="articles-associes">
        <div class="article">
          <div class="article-inner">
            <div class="titre">
              <a href="/fr/la-cnil-publie-un-outil-pour-la-tracabilite-des-modeles-dia-publies-en-source-ouverte">
                La CNIL publie un outil pour la traçabilité des modèles d’IA publiés en source ouverte
              </a>
            </div>
            <p class="date">18 décembre 2025</p>
          </div>
        </div>
      </div>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-cnil-ai",
        name: "CNIL AI and Algorithms",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl: "https://www.cnil.fr/fr/technologies/intelligence-artificielle-ia",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.url).toContain("/fr/la-cnil-publie-un-outil");
    expect(result.items[0]?.publicationDate).toBe("2025-12-18");
    expect(result.items[0]?.legalAreaHint).toBe("AI governance");
  });

  it("extracts OECD AI Wonk cards with excerpts and dates", async () => {
    const html = `
      <div class="card card--post layout-regular">
        <a class="ghost" href="/en/wonk/uk-algorithmic-transparency-recording-standard">
          <h4 class="title is-4 m-b-sm">
            Designing transparency for government AI: Insights from the UK's Algorithmic Transparency Recording Standard initiative
          </h4>
        </a>
        <p class="excerpt m-y-md">
          <a class="ghost" href="/en/wonk/uk-algorithmic-transparency-recording-standard">
            How the UK's ATRS strengthens algorithmic transparency, public trust and accountability in government AI.
          </a>
        </p>
        <span class="has-text-link xsmall-meta">Government</span>
        <p class="xsmall-meta"><span>April 14, 2026</span></p>
      </div>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-oecd-ai",
        name: "OECD AI Policy Observatory",
        jurisdiction: "OECD",
        region: "International",
        country: "International",
        sourceUrl: "https://oecd.ai/en/wonk",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.publicationDate).toBe("2026-04-14");
    expect(result.items[0]?.legalAreaHint).toBe("Public sector use of AI");
    expect(result.items[0]?.developmentTypeHint).toBe("Policy report");
  });

  it("reports a useful zero-result warning when no known cards are found", async () => {
    global.fetch = async () =>
      new Response("<html><body><main>No matching listing nodes here.</main></body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-oecd-ai",
        name: "OECD AI Policy Observatory",
        jurisdiction: "OECD",
        region: "International",
        country: "International",
        sourceUrl: "https://oecd.ai/en/wonk",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.zeroResultsReason).toContain("OECD AI Wonk");
    expect(result.warnings[0]).toContain("No OECD AI Wonk");
  });

  it("degrades Legifrance fetch failures into explicit non-fatal warnings", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("fetch failed");
    }) as typeof fetch;

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl:
          "https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=intelligence+artificielle",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0]).toContain("Legifrance could not be queried safely");
    expect(result.zeroResultsReason).toContain("manual review");
  });

  it("degrades Legifrance challenge pages into explicit non-fatal warnings", async () => {
    global.fetch = async () =>
      new Response("<html><title>Just a moment...</title><body>cf-mitigated</body></html>", {
        status: 403,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl:
          "https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query=intelligence+artificielle",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0]).toContain("Cloudflare challenge");
    expect(result.responseStatus).toBe(403);
  });

  it("supports generic configured link extraction from direct anchor items", async () => {
    const html = `
      <main>
        <a href="/guidance/artificial-intelligence-governance">
          Governance and accountability in AI
        </a>
        <a href="/guidance/data-minimisation">
          Data minimisation
        </a>
      </main>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-generic-ai",
        name: "Generic AI Guidance",
        sourceUrl: "https://example.gov/ai-guidance",
        config: {
          itemSelector: "main a[href*='artificial-intelligence'], main a[href*='ai']",
          linkSelector: "a",
          maxItems: 8,
        },
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.url).toContain("/guidance/artificial-intelligence-governance");
  });

  it("extracts EDPB AI topic publications from official topic rows", async () => {
    const html = `
      <div class="views-row">
        <div class="node node--type-edpb-publication">
          <div class="row">
            <div class="intro">
              <h4 class="node__title">
                <a href="/our-work-tools/our-documents/opinion-board-art-64/opinion-282024-certain-data-protection-aspects_en">
                  Opinion 28/2024 on certain data protection aspects related to the processing of personal data in the context of AI models
                </a>
              </h4>
              <span class="news-date">18 December 2024</span>
              <ul class="publication-type-list">
                <li><a href="/our-work-tools/our-documents/publication-type/opinion-board-art-64_en">Opinion of the Board (Art. 64)</a></li>
              </ul>
              <ul class="topic-list">
                <li><a href="/our-work-tools/our-documents/topic/artificial-intelligence_en">Artificial intelligence</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-edpb-ai",
        name: "European Data Protection Board Artificial Intelligence",
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
        sourceUrl:
          "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.publicationDate).toBe("2024-12-18");
    expect(result.items[0]?.legalAreaHint).toBe("Data protection");
  });

  it("extracts SEC AI resources from the official resource section", async () => {
    const html = `
      <main>
        <h2>Resources</h2>
        <h4>AI Compliance Plan</h4>
        <p><a href="/files/2025-sec-ai-compliance-plan.pdf">SEC's 2025 AI Compliance Plan</a></p>
        <ul>
          <li><a href="/files/2025-sec-individual-ai-use-cases.csv">2025 SEC Individual AI Use Cases</a></li>
        </ul>
      </main>
      <div class="date-modified"><span class="nowrap">Jan. 28, 2026</span></div>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-sec-ai",
        name: "SEC Artificial Intelligence",
        jurisdiction: "United States federal",
        sourceUrl: "https://www.sec.gov/ai",
      }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.publicationDate).toBe("2026-01-28");
  });

  it("extracts NYDFS AI section links from the innovation page", async () => {
    const html = `
      <section>
        <h2>Artificial Intelligence</h2>
        <div class="wysiwyg--field-webny-wysiwyg-body">
          <p>The Department is taking a leading role in enabling responsible innovation with artificial intelligence.</p>
          <ul>
            <li><a href="https://www.dfs.ny.gov/reports_and_publications/press_releases/pr202401171">DFS Proposes Artificial Intelligence Guidance to Combat Discrimination</a></li>
            <li><a href="https://www.dfs.ny.gov/reports_and_publications/press_releases/pr20241016">DFS Issues New Guidance to Address Cybersecurity Risks Arising from Artificial Intelligence</a></li>
          </ul>
        </div>
      </section>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-nydfs-ai",
        name: "NYDFS Innovation and Artificial Intelligence",
        jurisdiction: "New York",
        sourceUrl: "https://www.dfs.ny.gov/industry_guidance/innovation",
      }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.legalAreaHint).toBe("Financial services");
  });

  it("extracts EUR-Lex AI legal materials with CELEX metadata", async () => {
    const html = `
      <div class="SearchResult">
        <h2><a class="title" href="/legal-content/EN/TXT/?uri=CELEX:32024R1689">Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence</a></h2>
        <div class="textUnderTitle">OJ L, 12.7.2024, p. 1-144</div>
        <dl>
          <dt>CELEX number:</dt><dd>32024R1689</dd>
          <dt>Form:</dt><dd>Regulation</dd>
          <dt>Date of document:</dt><dd>13/06/2024</dd>
        </dl>
        <span class="DocStatus">In force</span>
        <a href="https://data.europa.eu/eli/reg/2024/1689/oj">ELI</a>
      </div>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-eur-lex-ai",
        name: "EUR-Lex AI Search",
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
        sourceUrl:
          "https://eur-lex.europa.eu/search.html?scope=EURLEX&text=%22artificial%20intelligence%22&type=quick",
        sourceType: "legislative_database",
      }),
    );

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item).toBeDefined();
    expect(item?.publicationDate).toBe("2024-06-13");
    expect(item?.authorityTypeHint).toBe("Regulation");
    expect(item?.metadata?.celexNumber).toBe("32024R1689");
  });

  it("extracts Legifrance AI legal texts from official search-style results", async () => {
    const html = `
      <main>
        <article class="search-result">
          <h2>
            <a href="/jorf/id/JORFTEXT000051986911">
              Délibération n° 2025-047 du 5 juin 2025 portant adoption d'une quatrième recommandation sur l'application du règlement général sur la protection des données au développement des systèmes d'intelligence artificielle
            </a>
          </h2>
          <p class="description">JORF n°0172 du 26 juillet 2025 - publication officielle.</p>
          <time datetime="2025-07-26">26 juillet 2025</time>
        </article>
        <article class="search-result">
          <h2>
            <a href="/cnil/id/CNILTEXT000051144655">
              Délibération 2025-010 du 6 février 2025
            </a>
          </h2>
          <p class="description">Recommandation CNIL sur le développement des systèmes d'intelligence artificielle.</p>
          <time datetime="2025-02-06">6 février 2025</time>
        </article>
      </main>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl: "https://www.legifrance.gouv.fr/search/jorf",
        sourceType: "legislative_database",
      }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.publicationDate).toBe("2025-07-26");
    expect(result.items[0]?.authorityTypeHint).toBe("Agency guidance");
    expect(result.items[1]?.metadata?.contentType).toBe("legifrance_search_result");
  });

  it("surfaces an explicit Cloudflare challenge warning for blocked Legifrance runtime access", async () => {
    global.fetch = async () =>
      new Response(
        "<html><head><title>Just a moment...</title></head><body>cf-mitigated challenges.cloudflare.com</body></html>",
        {
          status: 403,
          headers: { "Content-Type": "text/html" },
        },
      );

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-legifrance-ai",
        name: "Legifrance AI legal texts",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl: "https://www.legifrance.gouv.fr/search/jorf",
        sourceType: "legislative_database",
      }),
    );

    expect(result.items).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings[0]).toContain("Cloudflare challenge");
    expect(result.responseStatus).toBe(403);
  });

  it("extracts targeted Conseil d'Etat AI institutional materials from a dedicated official page", async () => {
    const html = `
      <html>
        <body>
          <main>
            <h1>Charte d'utilisation de l'intelligence artificielle au sein de la juridiction administrative</h1>
            <time datetime="2025-12-11">11 décembre 2025</time>
            <p>Le Conseil d'Etat publie sa charte relative à l'usage de l'intelligence artificielle.</p>
            <a href="/Media/actualites/documents/2025/decembre-2025/charte-ia-juridiction-administrative.pdf">Télécharger la charte IA</a>
            <a href="/fr/arianeweb/CE/decision/2026-01-30/506370">Décision n° 506370</a>
          </main>
        </body>
      </html>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-conseil-etat-ai",
        name: "Conseil d'Etat artificial intelligence materials",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl:
          "https://www.conseil-etat.fr/site/qui-sommes-nous/deontologie/charte-d-utilisation-de-l-intelligence-artificielle-au-sein-de-la-juridiction-administrative",
        sourceType: "court_database",
      }),
    );

    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items[0]?.publicationDate).toBe("2025-12-11");
    expect(result.items.some((item) => item.url.includes("/506370"))).toBe(true);
  });

  it("extracts targeted Cour de cassation AI materials from a dedicated official publication page", async () => {
    const redirectedHtml = `
      <html>
        <body>
          <main>
            <h1>La modernisation de la Cour se poursuit : 3 rapports rendus publics</h1>
            <time datetime="2025-09-01">1 septembre 2025</time>
            <p>Intelligence artificielle : les préconisations de la Cour.</p>
            <a href="/files/files/Publications/Rapports/rapport-intelligence-artificielle-cour-de-cassation.pdf">Rapport intelligence artificielle</a>
            <a href="/agenda-evenementiel/quels-developpements-pour-lia-dans-la-justice">Quels développements pour l'IA dans la justice ?</a>
          </main>
        </body>
      </html>
    `;
    const gateHtml = `
      <html lang="en"><body><script>window.location.href='/redirect_ABC/publications/lettre-de-la-cour/ndeg7-septembre-2025/la-modernisation-de-la-cour-se-poursuit-3-rapports-rendus-publics';</script></body></html>
    `;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(gateHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(redirectedHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      );
    global.fetch = fetchMock as typeof fetch;

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-fr-cour-cassation-ai",
        name: "Cour de cassation artificial intelligence materials",
        jurisdiction: "France",
        region: "Europe",
        country: "France",
        sourceUrl:
          "https://www.courdecassation.fr/publications/lettre-de-la-cour/ndeg7-septembre-2025/la-modernisation-de-la-cour-se-poursuit-3-rapports-rendus-publics",
        sourceType: "court_database",
      }),
    );

    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items[0]?.publicationDate).toBe("2025-09-01");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      result.items.some((item) => item.url.endsWith(".pdf") || item.url.includes("lia-dans-la-justice")),
    ).toBe(true);
  });

  it("extracts NY Courts Part 161 and its linked administrative order from the official rule page", async () => {
    const html = `
      <html>
        <body>
          <main>
            <h1>PART 161. Use of Artificial Intelligence Technology</h1>
            <p>Historical Note: Added Part 161 on <a href="/LegacyPDFS/rules/comments/pdf/AdministrativeOrder-CAJ-75-2026-ArttificialIntelligence-032526r.pdf">March 25, 2026</a>, effective June 1, 2026</p>
            <p>This Part applies in civil cases and criminal cases across the New York State Unified Court System.</p>
            <h2>Section 161.3 Policy</h2>
            <p>The use by attorneys and parties of artificial intelligence tools in preparing papers submitted to a court should not be prohibited.</p>
            <h2>Appendix A</h2>
            <p>Any attorney or party who uses an artificial intelligence tool in preparing any paper filed in or submitted to this court is required to carefully review the paper and independently ensure that it contains no fabricated or fictitious cases, statutes, or other material.</p>
          </main>
        </body>
      </html>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-nycourts-part-161-ai",
        name: "New York Courts Part 161 and AI Court Rules",
        jurisdiction: "New York",
        region: "North America",
        country: "United States",
        sourceUrl: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
        sourceType: "court_database",
      }),
    );

    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items[0]?.publicationDate).toBe("2026-03-25");
    expect(result.items[0]?.metadata?.effectiveDate).toBe("2026-06-01");
    expect(result.items[0]?.metadata?.applicableForum).toBe(
      "New York State Unified Court System",
    );
    expect(result.items[0]?.metadata?.scope).toEqual(["civil cases", "criminal cases"]);
    expect(
      result.items.some(
        (item) =>
          item.url.includes("AdministrativeOrder-CAJ-75-2026") &&
          item.metadata?.administrativeOrderId === "AO/75/2026",
      ),
    ).toBe(true);
  });

  it("degrades honestly when NY Courts blocks runtime access to the Part 161 page", async () => {
    global.fetch = async () =>
      new Response("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-nycourts-part-161-ai",
        name: "New York Courts Part 161 and AI Court Rules",
        jurisdiction: "New York",
        region: "North America",
        country: "United States",
        sourceUrl: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
        sourceType: "court_database",
      }),
    );

    expect(result.items).toEqual([]);
    expect(result.responseStatus).toBe(403);
    expect(result.zeroResultsReason).toContain("NY Courts refused or constrained access");
    expect(result.warnings[0]).toContain("NY Courts refused or constrained access");
  });

  it("extracts OWASP AIMA as best-practice material rather than binding law", async () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="OWASP AI Maturity Assessment project page for AI security and governance benchmarking." />
        </head>
        <body>
          <main>
            <h1>OWASP AI Maturity Assessment</h1>
            <section id="sec-roadmap">
              On August, 11th 2025 Version 1.0 of the OWASP AI Maturity Assessment was released.
            </section>
            <a href="/www-project-ai-maturity-assessment/assets/OWASP-AIMA_V1.pdf">Toolkit PDF</a>
          </main>
        </body>
      </html>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-owasp-aima",
        name: "OWASP AI Maturity Assessment",
        jurisdiction: "OECD",
        region: "International",
        country: "International",
        sourceUrl: "https://owasp.org/www-project-ai-maturity-assessment/",
      }),
    );

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item).toBeDefined();
    expect(item?.publicationDate).toBe("2025-08-11");
    expect(item?.authorityTypeHint).toBe("Best practice");
    expect(item?.developmentTypeHint).toBe("Code of practice");
  });

  it("extracts ISO/IEC 42001 official metadata without storing full paywalled text", async () => {
    const html = `
      <html>
        <head>
          <title>ISO/IEC 42001:2023 - Information technology - Artificial intelligence - Management system</title>
          <meta name="description" content="This document specifies requirements and provides guidance for establishing, implementing, maintaining and continually improving an AI management system." />
          <link rel="canonical" href="https://www.iso.org/standard/42001" />
        </head>
        <body>
          <main>
            <h1>ISO/IEC 42001:2023 - Information technology - Artificial intelligence - Management system</h1>
            <div id="publicationDate"><span itemprop="releaseDate">2023-12-18</span></div>
            <div id="publicationStatus">Published</div>
            <div id="stageId">90.93</div>
            <a href="/committee/6794475.html">ISO/IEC JTC 1/SC 42</a>
          </main>
        </body>
      </html>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-iso-42001",
        name: "ISO/IEC 42001",
        jurisdiction: "OECD",
        region: "International",
        country: "International",
        sourceUrl: "https://www.iso.org/standard/81230.html",
      }),
    );

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item).toBeDefined();
    expect(item?.authorityTypeHint).toBe("Technical standard");
    expect(item?.metadata?.paywalledFullText).toBe(true);
    expect(item?.text).not.toContain("full standard text");
  });

  it("extracts AI Weekly items as non-official discovery leads only", async () => {
    const html = `
      <div id="live-stories" class="dash__stories">
        <div class="dash__story dash__story--alert" data-beat="law">
          <div class="dash__story-meta">
            <span class="dash__story-source">commission.europa.eu</span>
            <span class="dash__story-time">8m ago</span>
            <span class="dash__alert-badge">ALERT</span>
            <span class="dash__story-score">29</span>
          </div>
          <a
            href="https://commission.europa.eu/example-ai-office-update"
            target="_blank"
            rel="noopener"
            class="dash__story-headline"
          >
            European Commission signals new AI Office implementation update
          </a>
        </div>
      </div>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-ai-weekly-news-today",
        name: "AI Weekly / AI News Today (Discovery Only)",
        jurisdiction: "OECD",
        region: "International",
        country: "International",
        sourceUrl: "https://aiweekly.co/ai-news-today",
      }),
    );

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item?.metadata?.discoveryLead).toBe(true);
    expect(item?.metadata?.possibleOfficialSourceFound).toBe(true);
    expect(item?.metadata?.discoveryVerificationStatus).toBe(
      "official_source_candidate_identified",
    );
    expect(item?.metadata?.possibleJurisdiction).toBe("European Union");
    expect(item?.metadata?.corroboratingSourceFound).toBe(false);
    expect(item?.metadata?.discoveryConversionStatus).toBe("discovery_only");
  });

  it("extracts Global Policy Watch category posts as discovery-only leads", async () => {
    const html = `
      <article class="post type-post">
        <h2 class="entry-title">
          <a href="https://www.globalpolicywatch.com/2026/05/eu-ai-act-implementation-update/">
            EU AI Act implementation update from European regulators
          </a>
        </h2>
        <time datetime="2026-05-20T10:00:00+00:00">May 20, 2026</time>
        <div class="entry-summary">
          <p>European Commission materials and AI Act implementation questions remain active.</p>
        </div>
        <span class="cat-links"><a>Artificial Intelligence</a></span>
      </article>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(
      makeSource({
        id: "src-global-policy-watch-eu",
        name: "Global Policy Watch EU (Discovery Only)",
        jurisdiction: "European Union",
        region: "Europe",
        country: "European Union",
        sourceUrl: "https://www.globalpolicywatch.com/category/european-union/",
      }),
    );

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item?.metadata?.discoveryLead).toBe(true);
    expect(item?.metadata?.contentType).toBe("global_policy_watch_discovery_lead");
    expect(item?.metadata?.discoverySourceName).toBe(
      "Global Policy Watch EU (Discovery Only)",
    );
    expect(item?.metadata?.possibleOfficialSourceFound).toBe(false);
    expect(item?.metadata?.corroboratingSourceFound).toBe(false);
    expect(item?.metadata?.discoveryConversionStatus).toBe("discovery_only");
    expect(item?.publicationDate).toBe("2026-05-20");
  });
});
