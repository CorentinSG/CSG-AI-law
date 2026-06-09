import { describe, expect, it } from "vitest";

import { parseEurLexAiActHtml } from "@/agents/ai-regulation/eurLexAiActParser";

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
