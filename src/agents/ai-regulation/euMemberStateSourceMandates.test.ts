import { describe, expect, it } from "vitest";

import { euMemberStateSourceMandates } from "@/agents/ai-regulation/euMemberStateSourceMandates";
import { franceMonitoringSourceRegistry } from "@/agents/ai-regulation/franceNewsSources";
import { germanyMonitoringSourceRegistry } from "@/agents/ai-regulation/germanyNewsSources";

describe("EU member-state source mandates", () => {
  const mandates = Object.values(euMemberStateSourceMandates);

  // Provisioning is derived, never hand-flipped: seeded_and_scanned requires a
  // named seedSourceIds entry that actually exists and is active in the seed.
  // Press mandates have no seeded counterpart and must all stay aspirational.
  it("derives provisioning from the seed and never claims it without naming ids", () => {
    expect(mandates.length).toBe(27);

    for (const mandate of mandates) {
      for (const source of mandate.legalNewsSources) {
        expect(source.provisioning).toBe("aspirational_not_wired");
      }
      for (const source of mandate.officialDatabaseSources) {
        if (source.provisioning === "seeded_and_scanned") {
          expect(source.seedSourceIds?.length ?? 0).toBeGreaterThan(0);
        }
      }
    }
  });

  it("wires every member state's DPA line to a real seeded lane", () => {
    // Every member state has either a generated src-{code}-dpa-ai shell or a
    // hand-authored DPA lane, so a fully aspirational DPA line means a typo in
    // the code map, not a missing source.
    for (const mandate of mandates) {
      const dpa = mandate.officialDatabaseSources.find(
        (source) => source.sourceType === "data_protection_authority",
      );
      expect(dpa?.provisioning).toBe("seeded_and_scanned");
    }
  });

  it("keeps parliament and court lines aspirational — nothing seeds them yet", () => {
    for (const mandate of mandates) {
      for (const source of mandate.officialDatabaseSources) {
        if (source.sourceType === "parliament" || source.sourceType === "court_or_case_law") {
          expect(source.provisioning).toBe("aspirational_not_wired");
        }
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
