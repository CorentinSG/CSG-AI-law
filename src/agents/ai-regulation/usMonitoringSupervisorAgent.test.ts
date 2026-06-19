import { describe, expect, it } from "vitest";

import {
  listUsMonitoringAgents,
  usFederalMonitoringAgent,
  usMonitoringAgents,
  usStateMonitoringAgents,
} from "@/agents/ai-regulation/usMonitoringSupervisorAgent";
import {
  usStateMonitoringAgentDefinitions,
  usSubFederalMonitoringAgentDefinitions,
} from "@/agents/ai-regulation/usMonitoringAgentDefinitions";

describe("US monitoring supervisor agent", () => {
  it("registers one federal agent plus one agent for each state and DC", () => {
    expect(usFederalMonitoringAgent.id).toBe("us-federal");
    expect(usStateMonitoringAgents).toHaveLength(51);
    expect(usStateMonitoringAgentDefinitions).toHaveLength(50);
    expect(usSubFederalMonitoringAgentDefinitions).toHaveLength(51);
    expect(usMonitoringAgents).toHaveLength(52);
    expect(new Set(usMonitoringAgents.map((agent) => agent.id)).size).toBe(52);
  });

  it("exposes all expected US jurisdictions", () => {
    const agents = listUsMonitoringAgents();

    expect(agents[0]).toMatchObject({
      id: "us-federal",
      label: "US Federal Legal News Agent",
      scope: "federal",
      jurisdiction: "United States",
    });
    expect(agents.map((agent) => agent.id)).toEqual(
      expect.arrayContaining(["us-ca", "us-ny", "us-tx", "us-dc", "us-wy"]),
    );
    expect(agents.filter((agent) => agent.scope === "state")).toHaveLength(50);
    expect(agents.filter((agent) => agent.scope === "district")).toHaveLength(1);
  });

  it("creates source registries for every US monitoring shell", () => {
    for (const agent of usMonitoringAgents) {
      expect(agent.definition.sourceRegistry.length).toBeGreaterThanOrEqual(4);
      expect(agent.definition.sourceRegistry.some((source) => source.baselineEligible)).toBe(true);
      expect(agent.definition.sourceRegistry.some((source) => source.liveMonitoringEligible)).toBe(
        true,
      );
    }
  });
});
