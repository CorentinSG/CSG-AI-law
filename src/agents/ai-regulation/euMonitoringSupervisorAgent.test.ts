import { describe, expect, it } from "vitest";

import {
  euMemberStateMonitoringAgents,
  listEuMonitoringAgents,
} from "@/agents/ai-regulation/euMonitoringSupervisorAgent";
import { missingEuMemberStateAgentDefinitions } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";
import { getBulgariaAgentSourceIds } from "@/agents/ai-regulation/bulgariaNewsSources";
import { getSloveniaAgentSourceIds } from "@/agents/ai-regulation/sloveniaNewsSources";

describe("EU monitoring supervisor agent", () => {
  it("registers one member-state monitoring agent for every EU country", () => {
    expect(euMemberStateMonitoringAgents).toHaveLength(27);
    expect(new Set(euMemberStateMonitoringAgents.map((agent) => agent.id)).size).toBe(27);
    expect(euMemberStateMonitoringAgents.map((agent) => agent.id)).toEqual(
      expect.arrayContaining([
        "austria",
        "belgium",
        "bulgaria",
        "croatia",
        "cyprus",
        "czechia",
        "denmark",
        "estonia",
        "finland",
        "france",
        "germany",
        "greece",
        "hungary",
        "ireland",
        "italy",
        "latvia",
        "lithuania",
        "luxembourg",
        "malta",
        "netherlands",
        "poland",
        "portugal",
        "romania",
        "slovakia",
        "slovenia",
        "spain",
        "sweden",
      ]),
    );
  });

  it("exposes a top-level EU supervisor plus all member-state agents", () => {
    const agents = listEuMonitoringAgents();

    expect(agents).toHaveLength(28);
    expect(agents[0]).toMatchObject({
      id: "eu",
      label: "EU Legal News Agent",
      scope: "eu",
    });
    expect(agents.filter((agent) => agent.scope === "member_state")).toHaveLength(27);
  });

  it("creates source registries for all newly added member-state agents", () => {
    expect(missingEuMemberStateAgentDefinitions).toHaveLength(18);
    for (const definition of missingEuMemberStateAgentDefinitions) {
      expect(definition.sourceRegistry.length).toBeGreaterThanOrEqual(4);
      expect(definition.sourceRegistry.some((source) => source.baselineEligible)).toBe(true);
      expect(definition.sourceRegistry.some((source) => source.liveMonitoringEligible)).toBe(true);
    }
  });

  it("returns profile-specific source ids for newly generated agents", () => {
    expect(getBulgariaAgentSourceIds("official_legal_scan")).toEqual([
      "src-bg-dpa-ai",
      "src-bg-government-ai",
    ]);
    expect(getBulgariaAgentSourceIds("live_news_scan")).toEqual([
      "src-bg-dpa-ai",
      "src-bg-newsapi-ai",
      "src-bg-gdelt-ai",
    ]);
    expect(getSloveniaAgentSourceIds("verification_scan")).toEqual([]);
  });
});
