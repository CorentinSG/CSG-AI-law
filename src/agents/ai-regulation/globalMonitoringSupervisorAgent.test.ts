import { describe, expect, it } from "vitest";

import {
  designMonitoringAgent,
  globalMonitoringSupervisorAgent,
  listGlobalMonitoringAgents,
} from "@/agents/ai-regulation/globalMonitoringSupervisorAgent";

describe("global monitoring supervisor agent", () => {
  it("registers EU, US, and design under the boss supervisor", () => {
    const registry = listGlobalMonitoringAgents();

    expect(globalMonitoringSupervisorAgent.id).toBe("global-monitoring-supervisor");
    expect(registry.supervisor).toBe(globalMonitoringSupervisorAgent);
    expect(registry.regionalSupervisors.map((agent) => agent.id)).toEqual([
      "eu-monitoring-supervisor",
      "us-monitoring-supervisor",
    ]);
    expect(registry.crossFunctionalAgents).toEqual([designMonitoringAgent]);
  });

  it("keeps the managed agent counts explicit", () => {
    const registry = listGlobalMonitoringAgents();
    const euSupervisor = registry.regionalSupervisors.find(
      (agent) => agent.id === "eu-monitoring-supervisor",
    );
    const usSupervisor = registry.regionalSupervisors.find(
      (agent) => agent.id === "us-monitoring-supervisor",
    );

    expect(euSupervisor?.managedAgents).toHaveLength(28);
    expect(usSupervisor?.managedAgents).toHaveLength(52);
  });

  it("requires supervisors to audit child coverage for news, databases, hard law, soft law, and decisions", () => {
    const registry = listGlobalMonitoringAgents();

    expect(registry.supervisor.mandate.obligations).toEqual(
      expect.arrayContaining([
        "audit_child_agent_coverage",
        "escalate_missing_sources",
        "monitor_legal_news",
        "update_legal_database",
        "track_hard_law",
        "track_soft_law",
        "track_case_law_and_decisions",
      ]),
    );
    for (const supervisor of registry.regionalSupervisors) {
      expect(supervisor.mandate.coverage).toMatchObject({
        legalNews: true,
        legalDatabase: true,
        hardLaw: true,
        softLaw: true,
        caseLawAndDecisions: true,
      });
    }
  });
});
