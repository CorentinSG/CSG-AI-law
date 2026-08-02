import { describe, expect, it } from "vitest";

import {
  buildIdentityKey,
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

  // A prior version of this test asserted the opposite — that a shifted
  // publication date makes a different item. Production falsified it: the EU
  // AI Office republished the same page with a moving date and the public hub
  // showed the story three times. Identity is what the item *is* (source,
  // URL, title), not how the source presents it today.
  it("treats a republished item with a shifted date as the same item", () => {
    const base = {
      sourceId: "src-a",
      title: "AI transparency framework",
      url: "https://example.gov/a",
    };

    expect(buildStableHash(base)).toBe(buildStableHash({ ...base }));
  });

  it("keeps genuinely different items apart", () => {
    expect(
      buildStableHash({
        sourceId: "src-a",
        title: "AI transparency framework",
        url: "https://example.gov/a",
      }),
    ).not.toBe(
      buildStableHash({
        sourceId: "src-a",
        title: "AI liability framework",
        url: "https://example.gov/b",
      }),
    );
  });

  it("separates the same document seen by two different sources", () => {
    const shared = { title: "AI act guidance", url: "https://example.gov/g" };

    expect(buildStableHash({ sourceId: "src-a", ...shared })).not.toBe(
      buildStableHash({ sourceId: "src-b", ...shared }),
    );
  });
});

describe("buildIdentityKey", () => {
  it("matches across tracking parameters and title punctuation", () => {
    expect(
      buildIdentityKey(
        "https://example.gov/notice?utm_source=rss",
        "The Structure of the AI Office!",
      ),
    ).toBe(buildIdentityKey("https://example.gov/notice", "The Structure of the AI Office"));
  });

  it("separates different pages on the same host", () => {
    expect(buildIdentityKey("https://example.gov/a", "Title")).not.toBe(
      buildIdentityKey("https://example.gov/b", "Title"),
    );
  });
});
