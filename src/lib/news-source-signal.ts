/**
 * Presentational classification of a news item's source standing, so views can
 * clearly distinguish official sources from discovery / admin-only leads (which
 * are never legal authority on their own). Pure — no I/O.
 */

export type NewsSourceTone = "official" | "press" | "discovery";

export interface NewsSourceSignal {
  tone: NewsSourceTone;
  label: string;
  /** Short caveat to render publicly/admin-side, or null for clean official sources. */
  caveat: string | null;
  /** True when the item is gated to admin views (not publicly visible). */
  adminOnly: boolean;
}

export function getNewsSourceSignal(item: {
  sourceType?: string | null;
  verificationStatus?: string | null;
  publicVisibilityStatus?: string | null;
}): NewsSourceSignal {
  const adminOnly = item.publicVisibilityStatus === "admin_only";
  const isDiscovery =
    item.sourceType === "informal_discovery_source" ||
    item.sourceType === "media_discovery_source" ||
    item.verificationStatus === "discovery_only";

  if (isDiscovery) {
    return {
      tone: "discovery",
      label: "Discovery lead",
      caveat: "Not legal authority — requires official-source verification.",
      adminOnly,
    };
  }
  if (item.sourceType === "legal_regulatory_press") {
    return {
      tone: "press",
      label: "Legal / regulatory press",
      caveat: "Reporting, not a primary legal source.",
      adminOnly,
    };
  }
  return {
    tone: "official",
    label: "Official source",
    caveat: null,
    adminOnly,
  };
}
