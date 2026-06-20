import { describe, expect, it } from "vitest";

import {
  getLegalDomainBySlug,
  getLegalDomains,
  getLiveLegalDomains,
  legalDomains,
} from "@/content/legal-domains";

describe("legal-domains taxonomy", () => {
  it("exposes unique slugs", () => {
    const slugs = legalDomains.map((domain) => domain.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps AI law as the only live domain with a hub, others without one", () => {
    const live = getLiveLegalDomains();
    expect(live.map((d) => d.slug)).toEqual(["ai-law"]);
    expect(live.every((d) => d.hubHref)).toBe(true);

    const notLive = getLegalDomains().filter((d) => d.status !== "live");
    // Honesty guard: non-live domains must not link to a hub that implies coverage.
    expect(notLive.every((d) => d.hubHref === null)).toBe(true);
  });

  it("resolves a domain by slug and returns null for unknown slugs", () => {
    expect(getLegalDomainBySlug("ai-law")?.title).toBe("AI Law & Governance");
    expect(getLegalDomainBySlug("nope")).toBeNull();
  });

  it("gives every domain a status label and coverage note", () => {
    expect(
      legalDomains.every((d) => d.statusLabel.length > 0 && d.coverageNote.length > 0),
    ).toBe(true);
  });
});
