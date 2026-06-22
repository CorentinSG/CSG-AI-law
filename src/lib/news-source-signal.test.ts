import { describe, expect, it } from "vitest";

import { getNewsSourceSignal } from "@/lib/news-source-signal";

describe("getNewsSourceSignal", () => {
  it("flags informal discovery sources as discovery leads with a caveat", () => {
    const s = getNewsSourceSignal({
      sourceType: "informal_discovery_source",
      verificationStatus: "needs_review",
      publicVisibilityStatus: "admin_only",
    });
    expect(s.tone).toBe("discovery");
    expect(s.adminOnly).toBe(true);
    expect(s.caveat).toMatch(/not legal authority/i);
  });

  it("treats discovery_only verification as discovery regardless of source type", () => {
    expect(getNewsSourceSignal({ sourceType: "official_source", verificationStatus: "discovery_only" }).tone).toBe(
      "discovery",
    );
  });

  it("marks legal/regulatory press as reporting, not a primary source", () => {
    const s = getNewsSourceSignal({ sourceType: "legal_regulatory_press", verificationStatus: "needs_review" });
    expect(s.tone).toBe("press");
    expect(s.caveat).toMatch(/reporting/i);
  });

  it("treats official sources as authority with no caveat", () => {
    const s = getNewsSourceSignal({
      sourceType: "official_source",
      verificationStatus: "official_verified",
      publicVisibilityStatus: "public",
    });
    expect(s.tone).toBe("official");
    expect(s.caveat).toBeNull();
    expect(s.adminOnly).toBe(false);
  });
});
