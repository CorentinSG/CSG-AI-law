import { describe, expect, it } from "vitest";

import {
  getFeaturedResearchEntry,
  getPublicResearchEntries,
  getPublicResearchEntryBySlug,
  getRelatedResearchEntries,
} from "@/content/research";

describe("research content registry", () => {
  it("exposes published and forthcoming entries publicly but hides drafts", () => {
    const entries = getPublicResearchEntries();

    expect(entries.length).toBeGreaterThanOrEqual(5);
    expect(entries.some((entry) => entry.status === "draft")).toBe(false);
    expect(entries.some((entry) => entry.status === "forthcoming")).toBe(true);
    expect(entries.some((entry) => entry.status === "published")).toBe(true);
  });

  it("returns null for draft slugs in the public resolver", () => {
    expect(getPublicResearchEntryBySlug("from-monitoring-to-meaning")).toBeNull();
  });

  it("returns a public, published featured entry", () => {
    const featured = getFeaturedResearchEntry();

    // Invariant-based: the featured entry must exist, be published, and be
    // publicly resolvable — the exact slug is editorial data, not a contract.
    expect(featured).not.toBeNull();
    expect(featured!.status).toBe("published");
    expect(getPublicResearchEntryBySlug(featured!.slug)?.slug).toBe(featured!.slug);
  });

  it("returns related entries without including the current article", () => {
    const featured = getFeaturedResearchEntry();
    expect(featured).not.toBeNull();

    const related = getRelatedResearchEntries(featured!, 3);

    expect(related.length).toBeGreaterThan(0);
    expect(related.some((entry) => entry.slug === featured!.slug)).toBe(false);
  });
});
