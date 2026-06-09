import { describe, expect, it } from "vitest";

import {
  getEuAgentSourceIds,
  getEuNewsSourceConfigs,
  getEuSourceDescriptor,
} from "@/agents/ai-regulation/euNewsSources";

describe("EU news source registry", () => {
  it("classifies official EU sources at the highest authority tier", () => {
    const descriptor = getEuSourceDescriptor({
      name: "European Commission AI and Digital Strategy pages",
      region: "Europe",
      sourceType: "regulator_page",
    });

    expect(descriptor?.sourceAuthorityLevel).toBe("official_eu_primary");
    expect(descriptor?.official).toBe(true);
  });

  it("keeps discovery/blog-like sources non-authoritative", () => {
    const descriptor = getEuSourceDescriptor({
      name: "Global Policy Watch AI category",
      region: "Europe",
      sourceType: "discovery_source",
    });

    expect(descriptor?.sourceAuthorityLevel).toBe("informal_discovery");
    expect(descriptor?.official).toBe(false);
  });

  it("returns only Europe-relevant source configs for the EU agent", () => {
    const configs = getEuNewsSourceConfigs();

    expect(configs.length).toBeGreaterThan(0);
    expect(configs.every((config) => config.region !== "United States")).toBe(true);
  });

  it("includes the new official fast-feed Europe sources in the official EU scan set", () => {
    const sourceIds = getEuAgentSourceIds("eu_official_legal_scan");

    expect(sourceIds).toEqual(
      expect.arrayContaining([
        "src-eu-commission-news-rss",
        "src-edpb-rss",
        "src-curia-rss",
        "src-eur-lex-proposals-rss",
        "src-eur-lex-legislation-rss",
      ]),
    );
  });
});
