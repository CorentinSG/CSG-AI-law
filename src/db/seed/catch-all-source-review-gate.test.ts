import { describe, expect, it } from "vitest";

import { requiresSourceReview } from "@/agents/ai-regulation/publicationEligibility";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

// The generated country DPA/government shells scrape an index page with a
// catch-all anchor selector, so an extracted item is as likely to be a
// navigation link as a legal development. They must stay out of the automatic
// publication lane until a verified listing selector or an official feed
// replaces the selector.
const GENERATED_CATCH_ALL_SELECTOR = "main a[href], article a[href], a[href]";

// Nine hand-authored DPA/ministry sources use a bare anchor selector too,
// only scoped to <main> — the same failure mode one notch narrower.
const MAIN_SCOPED_ANCHOR_SELECTOR = "main a[href]";

// Verified official lanes that must keep auto-publishing.
const AUTO_ELIGIBLE_OFFICIAL_SOURCE_IDS = [
  "src-federal-register-ai",
  "src-us-courtlistener-ai",
  "src-cnil-ai",
  "src-fr-legifrance-ai",
  "src-es-boe-ai",
  "src-at-ris-ai-law",
];

describe("generated catch-all source review gate", () => {
  const catchAllSources = regulationSourcesSeed.filter(
    (source) => source.config?.itemSelector === GENERATED_CATCH_ALL_SELECTOR,
  );

  // 62, not the original 66: Croatia, Malta and Monaco (DPA lanes) and Greece
  // (government lane) moved to verified RSS feeds and left the gate.
  it("covers the generated shells that still have no verified feed", () => {
    expect(catchAllSources.length).toBe(62);
    expect(
      catchAllSources.every(
        (source) => source.id.endsWith("-dpa-ai") || source.id.endsWith("-government-ai"),
      ),
    ).toBe(true);
  });

  it("flags every generated catch-all source for review", () => {
    for (const source of catchAllSources) {
      expect(requiresSourceReview(source), source.id).toBe(true);
      expect(source.config?.requiresReviewReason, source.id).toBe(
        "generated_catch_all_selector",
      );
    }
  });

  // The flag must never spread beyond sources that genuinely extract with a bare
  // anchor selector: the 62 remaining generated shells plus the 8 hand-authored
  // main-scoped ones. Anything else appearing here means a verified official
  // lane was pulled out of the automatic publication path by mistake.
  it("keeps the flag confined to sources with a bare anchor selector", () => {
    const flagged = regulationSourcesSeed.filter((source) => requiresSourceReview(source));
    const anchorCatchAll = regulationSourcesSeed.filter((source) => {
      const selector = source.config?.itemSelector;
      return (
        selector === GENERATED_CATCH_ALL_SELECTOR || selector === MAIN_SCOPED_ANCHOR_SELECTOR
      );
    });

    expect(flagged.length).toBe(70);
    expect(flagged.map((source) => source.id).sort()).toEqual(
      anchorCatchAll.map((source) => source.id).sort(),
    );
  });

  it("gates the shells without downgrading them to non-official discovery leads", () => {
    for (const source of catchAllSources) {
      expect(isDiscoveryOnlySource(source), source.id).toBe(false);
      expect(["official", "regulator"], source.id).toContain(source.sourceCategory);
    }
  });

  it("leaves verified official lanes auto-eligible", () => {
    for (const id of AUTO_ELIGIBLE_OFFICIAL_SOURCE_IDS) {
      const source = regulationSourcesSeed.find((entry) => entry.id === id);

      expect(source, id).toBeDefined();
      expect(requiresSourceReview(source), id).toBe(false);
      expect(isDiscoveryOnlySource(source), id).toBe(false);
    }
  });
});

describe("main-scoped anchor catch-all review gate", () => {
  const mainScopedSources = regulationSourcesSeed.filter(
    (source) => source.config?.itemSelector === MAIN_SCOPED_ANCHOR_SELECTOR,
  );

  it("covers every hand-authored source using a bare main-scoped anchor selector", () => {
    // src-nl-ap-ai left this set: its verified RSS feed replaced the selector.
    expect(mainScopedSources.map((source) => source.id).sort()).toEqual([
      "src-at-dsb-ai",
      "src-be-apd-ai",
      "src-ie-dete-ai",
      "src-ie-dpc-ai",
      "src-nl-rdi-ai",
      "src-nl-rijksoverheid-ai",
      "src-se-digg-ai",
      "src-se-regeringen-ai",
    ]);
  });

  it("flags them for review without downgrading them to discovery leads", () => {
    for (const source of mainScopedSources) {
      expect(requiresSourceReview(source), source.id).toBe(true);
      expect(source.config?.requiresReviewReason, source.id).toBe(
        "main_scoped_anchor_catch_all",
      );
      // They remain official: a reviewer can still publish them.
      expect(isDiscoveryOnlySource(source), source.id).toBe(false);
      expect(["official", "regulator"], source.id).toContain(source.sourceCategory);
    }
  });
});

// Feeds verified end to end by scripts/discover-source-feeds.ts on GitHub
// Actions (run 30373800651, 2026-07-28): each parses and carries dated items.
// Only 12 of the 75 probed sources had one, and only these five were judged
// usable — the rest were stale, carried filename or case-number titles, or were
// whole-of-government firehoses. A feed URL must never be added from a guess.
const VERIFIED_FEEDS: Record<string, string> = {
  "src-hr-dpa-ai": "https://azop.hr/feed/",
  "src-mt-dpa-ai": "https://idpc.org.mt/feed/",
  "src-mc-dpa-ai": "https://www.ccin.mc/rss",
  "src-gr-government-ai": "https://gslegal.gov.gr/rss",
  "src-nl-ap-ai": "https://www.autoriteitpersoonsgegevens.nl/rss",
};

describe("sources promoted to a verified feed", () => {
  for (const [id, feedUrl] of Object.entries(VERIFIED_FEEDS)) {
    it(`${id} scans its verified feed and has left the review gate`, () => {
      const source = regulationSourcesSeed.find((entry) => entry.id === id);

      expect(source, id).toBeDefined();
      expect(source?.sourceUrl, id).toBe(feedUrl);
      expect(source?.sourceType, id).toBe("RSS");
      expect(source?.preferredExtractionMethod, id).toBe("rss");
      expect(requiresSourceReview(source), id).toBe(false);
      // The anchor selector must be gone, not merely overridden.
      expect(source?.config?.itemSelector, id).toBeUndefined();
      // These feeds are broader than AI, so deterministic filtering must remain.
      expect(Array.isArray(source?.config?.includeAnyTerms), id).toBe(true);
      expect((source?.config?.includeAnyTerms as unknown[]).length, id).toBeGreaterThan(0);
    });
  }
});
