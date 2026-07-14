import { describe, expect, it } from "vitest";

import { nonEuEuropeAgentDefinitions } from "@/agents/ai-regulation/nonEuEuropeAgentDefinitions";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

describe("non-EU Western Europe and Balkan source coverage", () => {
  const seedById = new Map(regulationSourcesSeed.map((source) => [source.id, source]));

  it("backs every non-EU Europe agent descriptor with an active seed source", () => {
    for (const definition of nonEuEuropeAgentDefinitions) {
      for (const descriptor of definition.sourceRegistry) {
        const seedSource = seedById.get(descriptor.sourceId);

        expect(seedSource, `${definition.countryName} ${descriptor.sourceId}`).toBeDefined();
        expect(seedSource?.active, `${definition.countryName} ${descriptor.sourceId}`).toBe(true);
        expect(seedSource?.country, `${definition.countryName} ${descriptor.sourceId}`).toBe(
          definition.countryName,
        );
        expect(seedSource?.region, `${definition.countryName} ${descriptor.sourceId}`).toBe(
          "Europe",
        );
      }
    }
  });

  it("gives each non-EU Europe jurisdiction official and discovery coverage", () => {
    for (const definition of nonEuEuropeAgentDefinitions) {
      const sources = definition.sourceRegistry.map((descriptor) =>
        seedById.get(descriptor.sourceId),
      );

      const officialSources = sources.filter(
        (source) =>
          source?.sourceCategory === "official" ||
          source?.sourceCategory === "regulator" ||
          source?.sourceCategory === "court",
      );
      const discoverySources = sources.filter((source) => source?.sourceCategory === "media");

      expect(officialSources.length, definition.countryName).toBeGreaterThanOrEqual(2);
      expect(discoverySources.length, definition.countryName).toBeGreaterThanOrEqual(2);
      expect(
        sources.some((source) => source?.preferredExtractionMethod === "api"),
        definition.countryName,
      ).toBe(true);
    }
  });
});
