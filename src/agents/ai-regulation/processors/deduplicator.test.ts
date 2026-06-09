import { describe, expect, it } from "vitest";

import { deduplicator } from "@/agents/ai-regulation/processors/deduplicator";

describe("deduplicator", () => {
  it("creates stable hashes for equivalent URLs", () => {
    const first = deduplicator.createHash({
      sourceId: "src-test",
      title: "AI rule",
      url: "https://example.gov/item?utm_source=rss",
      text: "Official AI rule text",
    });
    const second = deduplicator.createHash({
      sourceId: "src-test",
      title: "AI rule",
      url: "https://example.gov/item",
      text: "Official AI rule text",
    });

    expect(first).toBe(second);
  });
});
