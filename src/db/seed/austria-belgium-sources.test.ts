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
      expect(source?.ingestionMethod, descriptor.sourceId).toBeTruthy();
      expect(source?.sourceCategory, descriptor.sourceId).toBeTruthy();
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

  it("still scrapes src-be-apd-ai with the main-scoped anchor catch-all", () => {
    const source = regulationSourcesSeed.find((entry) => entry.id === "src-be-apd-ai");
    const config = source?.config ?? {};

    expect(config.itemSelector).toBe("main a[href]");
    expect(config.linkSelector).toBe("self");
  });

  // src-at-dsb-ai left the catch-all: its seeded deep link 404'd and the probe
  // verified a listing on the authority's root instead (run 30397833023).
  // linkSelector must stay absent — this selector matches containers, so the
  // connector's default descendant `a` is what finds the link.
  it("scrapes src-at-dsb-ai with the selector verified against its root", () => {
    const source = regulationSourcesSeed.find((entry) => entry.id === "src-at-dsb-ai");
    const config = source?.config ?? {};

    expect(source?.sourceUrl).toBe("https://dsb.gv.at");
    expect(config.itemSelector).toBe("main li:has(a[href])");
    expect(config.linkSelector).toBeUndefined();
  });
});
