import { describe, expect, it } from "vitest";

import { austriaMonitoringSourceRegistry } from "@/agents/ai-regulation/austriaNewsSources";
import { belgiumMonitoringSourceRegistry } from "@/agents/ai-regulation/belgiumNewsSources";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

const discoveryProviders = new Set(["newsapi", "gdelt"]);

describe("Austria and Belgium production source seed", () => {
  it.each([
    ["Austria", austriaMonitoringSourceRegistry],
    ["Belgium", belgiumMonitoringSourceRegistry],
  ] as const)("seeds every %s registry source as active", (country, registry) => {
    for (const descriptor of registry) {
      const source = regulationSourcesSeed.find((entry) => entry.id === descriptor.sourceId);

      expect(source, descriptor.sourceId).toBeDefined();
      expect(source?.active, descriptor.sourceId).toBe(true);
      expect(source?.country, descriptor.sourceId).toBe(country);
      expect(source?.jurisdiction, descriptor.sourceId).toBe(country);
    }
  });

  it("keeps official sources high-authority and discovery APIs non-authoritative", () => {
    const descriptors = [
      ...austriaMonitoringSourceRegistry,
      ...belgiumMonitoringSourceRegistry,
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
        expect(
          discoveryProviders.has(String(config.apiProvider)),
          descriptor.sourceId,
        ).toBe(true);
        expect(config.sourceCategory, descriptor.sourceId).toBe(
          "media_discovery_source",
        );
      }
    }
  });
});
