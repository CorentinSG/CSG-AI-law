import { describe, expect, it } from "vitest";

import { euMemberStateSourceMandates } from "@/agents/ai-regulation/euMemberStateSourceMandates";
import { franceMonitoringSourceRegistry } from "@/agents/ai-regulation/franceNewsSources";
import { germanyMonitoringSourceRegistry } from "@/agents/ai-regulation/germanyNewsSources";

describe("EU member-state source mandates", () => {
  const mandates = Object.values(euMemberStateSourceMandates);

  it("marks every declared mandate entry as aspirational rather than real coverage", () => {
    expect(mandates.length).toBe(27);

    for (const mandate of mandates) {
      for (const source of [
        ...mandate.legalNewsSources,
        ...mandate.officialDatabaseSources,
      ]) {
        expect(source.provisioning).toBe("aspirational_not_wired");
      }
    }
  });

  it("keeps mandate ids disjoint from the seeded country source registries", () => {
    const seededSourceIds = new Set([
      ...franceMonitoringSourceRegistry.map((entry) => entry.sourceId),
      ...germanyMonitoringSourceRegistry.map((entry) => entry.sourceId),
    ]);

    const mandateIds = mandates.flatMap((mandate) => [
      ...mandate.legalNewsSources.map((source) => source.id),
      ...mandate.officialDatabaseSources.map((source) => source.id),
    ]);

    expect(mandateIds.some((id) => seededSourceIds.has(id))).toBe(false);
  });
});
