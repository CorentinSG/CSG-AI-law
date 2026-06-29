import { describe, expect, it } from "vitest";

import { assertUsableFirecrawlDocuments } from "./verify-ingestion-runtime";

describe("verify-ingestion-runtime Firecrawl probe", () => {
  it("fails when configured crawl results are empty or content-free", () => {
    expect(() => assertUsableFirecrawlDocuments([])).toThrow("empty result set");
    expect(() =>
      assertUsableFirecrawlDocuments([
        {
          title: "Colorado AI Act",
          markdown: "",
        },
      ]),
    ).toThrow("usable content");
    expect(() =>
      assertUsableFirecrawlDocuments([
        {
          title: "Colorado AI Act",
          markdown: "Too short.",
        },
      ]),
    ).toThrow("usable content");
    expect(() =>
      assertUsableFirecrawlDocuments([
        {
          title: "Colorado Artificial Intelligence Act Guidance 2026",
          markdown: "Colorado Artificial Intelligence Act Guidance 2026",
        },
      ]),
    ).toThrow("usable content");
    expect(() =>
      assertUsableFirecrawlDocuments([
        {
          title: "Colorado Artificial Intelligence Act Guidance 2026",
          markdown: "Colorado Artificial Intelligence Act Guidance 2026.",
        },
      ]),
    ).toThrow("usable content");
  });

  it("accepts at least one substantial Firecrawl document", () => {
    expect(() =>
      assertUsableFirecrawlDocuments([
        {
          title: "Colorado AI Act",
          markdown:
            "Colorado AI Act guidance with meaningful extraction text that clears the runtime probe threshold.",
        },
      ]),
    ).not.toThrow();
  });
});
