import { describe, expect, it } from "vitest";

import {
  listGlobalMonitoringAgents,
  summariseAgentProvisioning,
} from "@/agents/ai-regulation/globalMonitoringSupervisorAgent";

describe("summariseAgentProvisioning", () => {
  it("counts an agent as provisioned only if a declared source is actually scanned", () => {
    const summary = summariseAgentProvisioning([
      {
        managedAgents: [
          { sourceMandate: { legalNewsSources: [{ provisioning: "seeded_and_scanned" }] } },
          { sourceMandate: { legalNewsSources: [{ provisioning: "aspirational_not_wired" }] } },
        ],
      },
    ]);

    expect(summary).toEqual({ total: 2, declaring: 2, provisioned: 1, aspirational: 1 });
  });

  it("counts partial wiring as real coverage", () => {
    const summary = summariseAgentProvisioning([
      {
        managedAgents: [
          {
            sourceMandate: {
              legalNewsSources: [{ provisioning: "aspirational_not_wired" }],
              officialDatabaseSources: [{ provisioning: "seeded_and_scanned" }],
            },
          },
        ],
      },
    ]);

    expect(summary.provisioned).toBe(1);
  });

  // International agents carry no source mandate. Declaring nothing is not a
  // claim, so they must not inflate the gap any more than the coverage.
  it("ignores agents that declare no sources at all", () => {
    const summary = summariseAgentProvisioning([
      { managedAgents: [{ id: "oecd", label: "OECD" }, { sourceMandate: undefined }] },
    ]);

    expect(summary).toMatchObject({ total: 2, declaring: 0, provisioned: 0, aspirational: 0 });
  });

  it("flattens across regional supervisors of different shapes", () => {
    const summary = summariseAgentProvisioning([
      { managedAgents: [{ country: "Austria", sourceMandate: { legalNewsSources: [{ provisioning: "aspirational_not_wired" }] } }] },
      { managedAgents: [{ jurisdiction: "California", postalCode: "CA", sourceMandate: { officialDatabaseSources: [{ provisioning: "aspirational_not_wired" }] } }] },
    ]);

    expect(summary).toMatchObject({ total: 2, declaring: 2, aspirational: 2 });
  });
});

// Pins the live registry's provisioning split so it can only change through a
// deliberate edit. History of this pin: the dashboard once counted all 90
// agents as coverage; the first honest measurement was 0 provisioned; deriving
// provisioning from the seed (EU DPA/journal/government lines, US federal
// officials) brought it to 28. Both directions of drift are failures — a seed
// removal should demote silently into this test, and a new claim must name a
// real seed to move the number.
describe("the live agent registry", () => {
  it("derives 28 provisioned agents from the seed, 51 honestly aspirational", () => {
    const summary = summariseAgentProvisioning(listGlobalMonitoringAgents().regionalSupervisors);

    expect(summary.total).toBe(90);
    expect(summary.declaring).toBe(79);
    expect(summary.provisioned).toBe(28);
    expect(summary.aspirational).toBe(51);
  });
});
