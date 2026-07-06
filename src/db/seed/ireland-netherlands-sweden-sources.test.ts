import { describe, expect, it } from "vitest";

import { irelandMonitoringSourceRegistry } from "@/agents/ai-regulation/irelandNewsSources";
import { netherlandsMonitoringSourceRegistry } from "@/agents/ai-regulation/netherlandsNewsSources";
import { swedenMonitoringSourceRegistry } from "@/agents/ai-regulation/swedenNewsSources";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

const discoveryProviders = new Set(["newsapi", "gdelt"]);

describe("Ireland, Netherlands, and Sweden production source seed", () => {
  it.each([
    ["Ireland", irelandMonitoringSourceRegistry],
    ["Netherlands", netherlandsMonitoringSourceRegistry],
    ["Sweden", swedenMonitoringSourceRegistry],
  ] as const)("seeds every %s registry source as active", (country, registry) => {
    for (const descriptor of registry) {
      const source = regulationSourcesSeed.find((entry) => entry.id === descriptor.sourceId);

      expect(source, descriptor.sourceId).toBeDefined();
      expect(source?.active, descriptor.sourceId).toBe(true);
      expect(source?.country, descriptor.sourceId).toBe(country);
      expect(source?.jurisdiction, descriptor.sourceId).toBe(country);
      expect(source?.ingestionMethod, descriptor.sourceId).toBeTruthy();
      expect(source?.sourceCategory, descriptor.sourceId).toBeTruthy();
    }
  });

  it("keeps official sources authoritative and discovery APIs non-authoritative", () => {
    const descriptors = [
      ...irelandMonitoringSourceRegistry,
      ...netherlandsMonitoringSourceRegistry,
      ...swedenMonitoringSourceRegistry,
    ];

    for (const descriptor of descriptors) {
      const source = regulationSourcesSeed.find((entry) => entry.id === descriptor.sourceId);
      expect(source, descriptor.sourceId).toBeDefined();

      if (descriptor.baselineEligible) {
        expect(source?.reliabilityLevel, descriptor.sourceId).toBe("high");
        expect(["media_source", "discovery_source"], descriptor.sourceId).not.toContain(
          source?.sourceType,
        );
      } else {
        const config = source?.config ?? {};
        expect(discoveryProviders.has(String(config.apiProvider)), descriptor.sourceId).toBe(true);
        expect(config.sourceCategory, descriptor.sourceId).toBe("media_discovery_source");
      }
    }
  });
});
