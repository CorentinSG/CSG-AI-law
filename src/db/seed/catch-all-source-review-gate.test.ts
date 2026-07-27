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

  it("covers the generated DPA and government shells for all 33 countries", () => {
    expect(catchAllSources.length).toBe(66);
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

  it("keeps the flag confined to the generated catch-all shells", () => {
    const flagged = regulationSourcesSeed.filter((source) => requiresSourceReview(source));

    expect(flagged.map((source) => source.id).sort()).toEqual(
      catchAllSources.map((source) => source.id).sort(),
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
