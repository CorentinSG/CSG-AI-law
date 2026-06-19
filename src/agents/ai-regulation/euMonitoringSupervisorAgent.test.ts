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

  it("equips every EU monitoring agent with legal-news and legal-database duties", () => {
    for (const agent of listEuMonitoringAgents()) {
      expect(agent.mandate.capabilities).toEqual(
        expect.arrayContaining([
          "legal_news_monitoring",
          "legal_database_maintenance",
          "hard_law_tracking",
          "soft_law_tracking",
          "case_law_and_decisions_tracking",
        ]),
      );
      expect(agent.mandate.obligations).toEqual(
        expect.arrayContaining([
          "monitor_legal_news",
          "update_legal_database",
          "track_new_regulations",
          "track_case_law_and_decisions",
        ]),
      );
      expect(agent.mandate.coverage).toMatchObject({
        legalNews: true,
        legalDatabase: true,
        hardLaw: true,
        softLaw: true,
        caseLawAndDecisions: true,
      });
    }
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
