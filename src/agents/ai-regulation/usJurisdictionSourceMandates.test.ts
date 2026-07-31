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

  // Provisioning is derived from the seed. The five federal official lines name
  // their seeds explicitly; four exist (Federal Register, FTC, NIST,
  // CourtListener) and Congress has no seeded counterpart, so it must stay
  // aspirational. State-level officials have no seeds at all.
  it("derives federal provisioning from real seeds and keeps states aspirational", () => {
    const federal = usJurisdictionSourceMandates["us-federal"];
    const byId = new Map(federal.officialDatabaseSources.map((source) => [source.id, source]));

    expect(byId.get("official-us-federal-register-ai")?.provisioning).toBe("seeded_and_scanned");
    // The FTC line names src-ftc-ai-press, but that seed is deliberately
    // inactive (the official feed 403s from the scan runtime), and the
    // derivation refuses to count an inactive seed — which is the mechanism
    // working. If the source is reactivated, this flips on its own and this
    // assertion gets updated deliberately.
    expect(byId.get("official-us-ftc-ai")?.provisioning).toBe("aspirational_not_wired");
    expect(byId.get("official-us-ftc-ai")?.seedSourceIds).toContain("src-ftc-ai-press");
    expect(byId.get("official-us-nist-ai")?.provisioning).toBe("seeded_and_scanned");
    expect(byId.get("official-us-federal-courts-ai")?.provisioning).toBe("seeded_and_scanned");
    expect(byId.get("official-us-congress-ai")?.provisioning).toBe("aspirational_not_wired");

    for (const [key, mandate] of Object.entries(usJurisdictionSourceMandates)) {
      if (key === "us-federal") continue;
      for (const source of [...mandate.legalNewsSources, ...mandate.officialDatabaseSources]) {
        expect(source.provisioning, `${key}/${source.id}`).toBe("aspirational_not_wired");
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
