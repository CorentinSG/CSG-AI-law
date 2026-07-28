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

  // The flag must never spread beyond sources that genuinely extract with a bare
  // anchor selector: the 66 generated shells plus the 9 hand-authored
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

    expect(flagged.length).toBe(75);
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
    expect(mainScopedSources.map((source) => source.id).sort()).toEqual([
      "src-at-dsb-ai",
      "src-be-apd-ai",
      "src-ie-dete-ai",
      "src-ie-dpc-ai",
      "src-nl-ap-ai",
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
