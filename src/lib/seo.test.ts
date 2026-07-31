import { describe, expect, it } from "vitest";

import type { ResearchEntry } from "@/content/research";

// The helpers read NEXT_PUBLIC_SITE_URL through the validated env module, which
// demands an admin secret on import — so the env is satisfied first and the
// module imported dynamically, the same pattern the route tests use.
process.env.ADMIN_AUTH_SECRET ??= "test-only-admin-secret-000000000";
const { jsonLdString, localeAlternates, researchArticleJsonLd } = await import("@/lib/seo");

const ENTRY: ResearchEntry = {
  slug: "ai-act-enforcement",
  title: "AI Act enforcement in practice",
  subtitle: "What the first wave of decisions shows",
  author: "C. Saint-Girons",
  status: "published",
  category: "EU AI Law",
  tags: ["AI Act", "enforcement"],
  readingTime: "8 min",
  summary: "A review of early AI Act enforcement.",
  abstract: "Abstract.",
  publishedAt: "2026-07-24",
  body: [],
  references: [],
} as unknown as ResearchEntry;

describe("localeAlternates", () => {
  it("declares the same document once per locale", () => {
    const alternates = localeAlternates("fr", "/research");

    expect(alternates.canonical).toMatch(/\/fr\/research$/);
    expect(alternates.languages.en).toMatch(/\/en\/research$/);
    expect(alternates.languages.fr).toMatch(/\/fr\/research$/);
  });

  it("does not double the slash on the root path", () => {
    expect(localeAlternates("en", "/").canonical).toMatch(/\/en$/);
  });
});

describe("researchArticleJsonLd", () => {
  it("builds only from the entry's own fields", () => {
    const jsonLd = researchArticleJsonLd(ENTRY, "en");

    expect(jsonLd.headline).toBe("AI Act enforcement in practice");
    expect(jsonLd.author).toEqual({ "@type": "Person", name: "C. Saint-Girons" });
    expect(jsonLd.datePublished).toBe("2026-07-24");
    expect(jsonLd.mainEntityOfPage).toMatch(/\/en\/research\/ai-act-enforcement$/);
  });

  // A fabricated datePublished on a legal analysis is worse than none.
  it("omits dates the entry does not state instead of inventing them", () => {
    const jsonLd = researchArticleJsonLd({ ...ENTRY, publishedAt: undefined }, "en");

    expect("datePublished" in jsonLd).toBe(false);
    expect("dateModified" in jsonLd).toBe(false);
  });
});

describe("jsonLdString", () => {
  it("escapes < so content can never close the script element", () => {
    const out = jsonLdString({ headline: "</script><script>alert(1)" });

    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script");
  });
});
