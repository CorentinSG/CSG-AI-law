import { describe, expect, it } from "vitest";

import {
  buildStableHash,
  normalizeTitle,
  normalizeUrl,
} from "@/agents/ai-regulation/utils/hash";

describe("hash helpers", () => {
  it("normalizes tracking parameters from URLs", () => {
    expect(
      normalizeUrl(
        "https://example.gov/notice?utm_source=rss&utm_medium=email&id=42#section",
      ),
    ).toBe("https://example.gov/notice?id=42");
  });

  it("normalizes titles to reduce punctuation-only variance", () => {
    expect(normalizeTitle("AI Guidance: Transparency for Government!")).toBe(
      "ai guidance transparency for government",
    );
  });

  it("uses source id and publication date to avoid false duplicates", () => {
    const left = buildStableHash({
      sourceId: "src-a",
      title: "AI transparency framework",
      url: "https://example.gov/a",
      publicationDate: "2026-05-01",
      text: "Official transparency framework for government AI systems.",
    });
    const right = buildStableHash({
      sourceId: "src-a",
      title: "AI transparency framework",
      url: "https://example.gov/a",
      publicationDate: "2026-05-02",
      text: "Official transparency framework for government AI systems.",
    });

    expect(left).not.toBe(right);
  });
});
