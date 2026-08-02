import { describe, expect, it } from "vitest";

import { deduplicator } from "@/agents/ai-regulation/processors/deduplicator";

describe("deduplicator", () => {
  it("creates stable hashes for equivalent URLs", () => {
    const first = deduplicator.createHash({
      sourceId: "src-test",
      title: "AI rule",
      url: "https://example.gov/item?utm_source=rss",
    });
    const second = deduplicator.createHash({
      sourceId: "src-test",
      title: "AI rule",
      url: "https://example.gov/item",
    });

    expect(first).toBe(second);
  });

  it("keeps different items distinct", () => {
    const first = deduplicator.createHash({
      sourceId: "src-test",
      title: "AI rule",
      url: "https://example.gov/item-1",
    });
    const second = deduplicator.createHash({
      sourceId: "src-test",
      title: "Another AI rule",
      url: "https://example.gov/item-2",
    });

    expect(first).not.toBe(second);
  });
});
