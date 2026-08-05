import { describe, expect, it } from "vitest";

import {
  ARTICLE_LANGUAGES,
  getAvailableLanguages,
  getFeaturedResearchEntry,
  getOriginalLanguage,
  getPublicResearchEntries,
  getPublicResearchEntryBySlug,
  getRelatedResearchEntries,
  getResearchRendition,
} from "@/content/research";

describe("research translations", () => {
  it("offers only languages that actually render", () => {
    for (const entry of getPublicResearchEntries()) {
      const languages = getAvailableLanguages(entry);
      expect(languages[0]).toBe(getOriginalLanguage(entry));
      expect(new Set(languages).size).toBe(languages.length);
      for (const language of languages) {
        const rendition = getResearchRendition(entry, language);
        expect(rendition.title.length).toBeGreaterThan(0);
        expect(rendition.body.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to the original when a language is missing", () => {
    for (const entry of getPublicResearchEntries()) {
      const available = getAvailableLanguages(entry);
      const missing = ARTICLE_LANGUAGES.filter((l) => !available.includes(l));
      for (const language of missing) {
        const rendition = getResearchRendition(entry, language);
        // Never blank the page: fall back and say so.
        expect(rendition.isOriginal).toBe(true);
        expect(rendition.title).toBe(entry.title);
      }
    }
  });

  it("keeps citations on every rendition", () => {
    for (const entry of getPublicResearchEntries()) {
      if (!entry.references?.length) continue;
      for (const language of getAvailableLanguages(entry)) {
        expect(
          getResearchRendition(entry, language).references?.length,
          `${entry.slug} loses its sources in ${language}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("marks unreviewed translations so the page can disclose them", () => {
    for (const entry of getPublicResearchEntries()) {
      const original = getOriginalLanguage(entry);
      for (const language of getAvailableLanguages(entry)) {
        if (language === original) continue;
        const rendition = getResearchRendition(entry, language);
        // The flag must be explicit either way — silence would read as
        // "author-reviewed" and misrepresent a machine translation.
        expect(
          typeof rendition.humanReviewed,
          `${entry.slug}/${language} does not state whether it was reviewed`,
        ).toBe("boolean");
      }
    }
  });
});

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
