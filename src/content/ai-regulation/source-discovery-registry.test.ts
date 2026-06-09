import { describe, expect, it } from "vitest";

import {
  getNonPublishableSourceRegistryEntries,
  getSourceRegistryByTier,
  getSourceRegistrySummary,
  sourceDiscoveryRegistry,
} from "@/content/ai-regulation/source-discovery-registry";

describe("source discovery registry", () => {
  it("documents official, secondary, informal, and media source tiers", () => {
    expect(sourceDiscoveryRegistry.length).toBeGreaterThanOrEqual(25);
    expect(getSourceRegistryByTier("official_primary").length).toBeGreaterThan(0);
    expect(getSourceRegistryByTier("official_regulator_or_agency").length).toBeGreaterThan(0);
    expect(getSourceRegistryByTier("secondary_tracker").length).toBeGreaterThan(0);
    expect(getSourceRegistryByTier("informal_discovery_source").length).toBeGreaterThan(0);
    expect(getSourceRegistryByTier("media_discovery_source").length).toBeGreaterThan(0);
  });

  it("prevents non-official discovery and media sources from supporting publication alone", () => {
    const nonOfficial = sourceDiscoveryRegistry.filter((entry) => !entry.official);

    expect(nonOfficial.length).toBeGreaterThan(0);
    for (const entry of nonOfficial) {
      expect(entry.publicationAllowed).toBe(false);
      expect(entry.requiresOfficialSourceConfirmation).toBe(true);
      expect(entry.requiresCrossSourceVerification).toBe(true);
    }
  });

  it("marks paywalled specialist press as manual review only", () => {
    const paywalledPress = sourceDiscoveryRegistry.filter(
      (entry) => entry.sourceStatus === "paywalled_or_restricted",
    );

    expect(paywalledPress.map((entry) => entry.name)).toEqual(
      expect.arrayContaining(["Bloomberg Law", "Law360", "MLex"]),
    );
    expect(
      paywalledPress.every((entry) => entry.monitoringRole === "manual_review_only"),
    ).toBe(true);
  });

  it("summarizes non-publishable discovery posture for admin diagnostics", () => {
    const summary = getSourceRegistrySummary();
    const nonPublishable = getNonPublishableSourceRegistryEntries();

    expect(summary.total).toBe(sourceDiscoveryRegistry.length);
    expect(summary.nonPublishableDiscovery).toBe(nonPublishable.length);
    expect(summary.byTier.media_discovery_source).toBeGreaterThan(0);
  });

  it("includes a dedicated official France monitoring cluster", () => {
    expect(sourceDiscoveryRegistry.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        "official-france-cnil-ai",
        "official-france-legifrance-ai",
        "official-france-conseil-etat-ai",
        "official-france-cour-cassation-ai",
        "official-france-defenseur-des-droits-ai",
      ]),
    );
  });
});
