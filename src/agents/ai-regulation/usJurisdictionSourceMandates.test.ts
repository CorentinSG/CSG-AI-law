import { describe, expect, it } from "vitest";

import { usJurisdictionSourceMandates } from "@/agents/ai-regulation/usJurisdictionSourceMandates";
import {
  usDistrictMonitoringAgentDefinitions,
  usMonitoringAgentDefinitions,
  usStateMonitoringAgentDefinitions,
  usSubFederalMonitoringAgentDefinitions,
} from "@/agents/ai-regulation/usMonitoringAgentDefinitions";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

describe("US jurisdiction source mandates", () => {
  const mandates = Object.values(usJurisdictionSourceMandates);
  const mandateIds = mandates.flatMap((mandate) => [
    ...mandate.legalNewsSources.map((source) => source.id),
    ...mandate.officialDatabaseSources.map((source) => source.id),
  ]);

  it("marks every declared mandate entry as aspirational rather than real coverage", () => {
    // 50 states + District of Columbia + the federal lane.
    expect(mandates.length).toBe(52);

    for (const mandate of mandates) {
      for (const source of [
        ...mandate.legalNewsSources,
        ...mandate.officialDatabaseSources,
      ]) {
        expect(source.provisioning, source.id).toBe("aspirational_not_wired");
      }
    }
  });

  // Guards the flag against going stale: the moment a mandate id is actually
  // seeded or registered, this fails and forces the entry to be flipped to
  // `seeded_and_scanned` instead of silently reading as real coverage.
  it("keeps mandate ids disjoint from every seeded source and agent registry", () => {
    const registeredSourceIds = new Set<string>([
      ...regulationSourcesSeed.map((source) => source.id),
      ...[
        ...usMonitoringAgentDefinitions,
        ...usStateMonitoringAgentDefinitions,
        ...usDistrictMonitoringAgentDefinitions,
        ...usSubFederalMonitoringAgentDefinitions,
      ].flatMap((definition) =>
        definition.sourceRegistry.map((descriptor) => descriptor.sourceId),
      ),
    ]);

    const collisions = mandateIds.filter((id) => registeredSourceIds.has(id));

    expect(collisions).toEqual([]);
  });
});
