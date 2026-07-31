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

// The dashboard's headline count used to be every managed agent, which reported
// coverage the monitor does not have. This pins the real state so that number
// cannot quietly reinflate: if a mandate is genuinely wired later, this test
// fails and is updated deliberately.
describe("the live agent registry", () => {
  it("still declares every jurisdiction mandate as unwired", () => {
    const summary = summariseAgentProvisioning(listGlobalMonitoringAgents().regionalSupervisors);

    expect(summary.declaring).toBeGreaterThan(20);
    expect(summary.provisioned).toBe(0);
    expect(summary.aspirational).toBe(summary.declaring);
    // And the honest figure is well below the raw agent count the tile showed.
    expect(summary.total).toBeGreaterThan(summary.declaring);
  });
});
