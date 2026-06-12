import { describe, expect, it } from "vitest";

import {
  AI_ACT_CELEX,
  buildEurLexAiActCandidates,
  deriveEurLexPinpoint,
  extractCelexFromUrl,
  isEurLexDocumentUrl,
  parseEurLexAiActHtml,
  parseEurLexSubdivisionFragment,
} from "@/agents/ai-regulation/eurLexAiActParser";
import type { RegulationSource } from "@/agents/ai-regulation/types";

const eurLexAiActHtmlFixture = `
<!doctype html>
<html lang="en">
  <head>
    <title>Regulation (EU) 2024/1689</title>
    <link rel="canonical" href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng" />
  </head>
  <body>
    <div id="title">Regulation (EU) 2024/1689 of the European Parliament and of the Council</div>
    <div class="eli-subdivision" id="cpt_I">
      <p class="oj-ti-section-1">CHAPTER I</p>
      <div class="eli-title">GENERAL PROVISIONS</div>
    </div>
    <div class="eli-subdivision" id="art_1">
      <p class="oj-ti-art">Article 1</p>
      <div class="eli-title">Subject matter\`\`</div>
    </div>
    <div class="eli-subdivision" id="art_5">
      <p class="oj-ti-art">Article 5</p>
      <div class="eli-title">Prohibited AI practices</div>
    </div>
    <div class="eli-subdivision" id="art_113">
      <p class="oj-ti-art">Article 113</p>
      <div class="eli-title">Entry into force and application</div>
    </div>
    <div class="eli-container" id="anx_III">
      <p class="oj-doc-ti">ANNEX III</p>
      <p class="oj-doc-ti">High-risk AI systems referred to in Article 6(2)</p>
    </div>
  </body>
</html>
`;

describe("parseEurLexAiActHtml", () => {
  it("extracts canonical metadata and key AI Act subdivisions from EUR-Lex HTML", () => {
    const result = parseEurLexAiActHtml(eurLexAiActHtmlFixture);

    expect(result.canonicalUrl).toBe("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng");
    expect(result.celexNumber).toBe("32024R1689");
    expect(result.officialTitle).toContain("Regulation (EU) 2024/1689");
    expect(result.chapters).toEqual([
      {
        id: "cpt_I",
        label: "CHAPTER I",
        title: "GENERAL PROVISIONS",
      },
    ]);
    expect(result.articles).toEqual(
      expect.arrayContaining([
        {
          id: "art_1",
          label: "Article 1",
          title: "Subject matter",
        },
        {
          id: "art_5",
          label: "Article 5",
          title: "Prohibited AI practices",
        },
        {
          id: "art_113",
          label: "Article 113",
          title: "Entry into force and application",
        },
      ]),
    );
    expect(result.annexes).toEqual([
      {
        id: "anx_III",
        label: "ANNEX III",
        title: "High-risk AI systems referred to in Article 6(2)",
      },
    ]);
    expect(result.warnings).toEqual([]);
  });
});

describe("extractCelexFromUrl", () => {
  it("derives CELEX from an ELI path", () => {
    expect(extractCelexFromUrl("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng")).toBe(
      "32024R1689",
    );
  });

  it("derives CELEX from a legal-content CELEX query", () => {
    expect(
      extractCelexFromUrl("https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689"),
    ).toBe("32024R1689");
  });

  it("returns null when no CELEX is present", () => {
    expect(extractCelexFromUrl("https://eur-lex.europa.eu/search.html?text=ai")).toBeNull();
  });
});

describe("parseEurLexSubdivisionFragment", () => {
  it("recognises article, annex, chapter and recital anchors", () => {
    expect(parseEurLexSubdivisionFragment("#art_5")).toEqual({ article: "5" });
    expect(parseEurLexSubdivisionFragment("#anx_III")).toEqual({ annex: "III" });
    expect(parseEurLexSubdivisionFragment("#cpt_II")).toEqual({ chapter: "II" });
    expect(parseEurLexSubdivisionFragment("#rct_12")).toEqual({ recital: "12" });
  });

  it("ignores unknown fragments", () => {
    expect(parseEurLexSubdivisionFragment("#footer")).toEqual({});
    expect(parseEurLexSubdivisionFragment(undefined)).toEqual({});
  });
});

describe("deriveEurLexPinpoint", () => {
  it("combines CELEX and a targeted article from the URL", () => {
    expect(
      deriveEurLexPinpoint({
        url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng#art_5",
      }),
    ).toEqual({ CELEX: "32024R1689", article: "5" });
  });

  it("falls back to the provided CELEX when the URL lacks one", () => {
    expect(
      deriveEurLexPinpoint({ url: "https://example.org/doc", celexNumber: "32024R1689" }),
    ).toEqual({ CELEX: "32024R1689" });
  });

  it("returns null when nothing concrete is found", () => {
    expect(deriveEurLexPinpoint({ url: "https://example.org/doc" })).toBeNull();
  });
});

describe("isEurLexDocumentUrl", () => {
  it("accepts ELI and legal-content document pages", () => {
    expect(isEurLexDocumentUrl("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng")).toBe(true);
    expect(
      isEurLexDocumentUrl("https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689"),
    ).toBe(true);
  });

  it("rejects the unstable search surface and non-EUR-Lex URLs", () => {
    expect(isEurLexDocumentUrl("https://eur-lex.europa.eu/search.html?text=ai")).toBe(false);
    expect(isEurLexDocumentUrl("https://example.org/eli/reg")).toBe(false);
  });
});

describe("buildEurLexAiActCandidates", () => {
  const source = {
    id: "src-eur-lex-ai-act",
    name: "EUR-Lex AI Act consolidated text",
    jurisdiction: "European Union",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng#art_5",
  } as unknown as RegulationSource;

  it("emits one document candidate with a genuinely-extracted article pinpoint", () => {
    const [candidate, ...rest] = buildEurLexAiActCandidates({
      html: eurLexAiActHtmlFixture,
      source,
    });

    expect(rest).toHaveLength(0);
    expect(candidate.url).toBe("https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng");
    expect(candidate.authorityTypeHint).toBe("Binding law");
    expect(candidate.metadata?.celexNumber).toBe(AI_ACT_CELEX);
    expect(candidate.metadata?.pinpoint).toEqual({ CELEX: "32024R1689", article: "5" });
    expect(candidate.metadata?.articleCount).toBe(3);
    expect(candidate.excerpt).toContain("Article 5");
  });
});
