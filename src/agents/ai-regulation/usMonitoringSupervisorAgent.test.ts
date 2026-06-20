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

  it("equips every US monitoring agent with legal-news and legal-database duties", () => {
    for (const agent of listUsMonitoringAgents()) {
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
          "keep_country_or_state_profile_current",
        ]),
      );
    }
  });

  it("assigns legal-news and official database source mandates to every US agent", () => {
    for (const agent of listUsMonitoringAgents()) {
      expect(agent.sourceMandate.legalNewsSources.length).toBeGreaterThanOrEqual(6);
      expect(agent.sourceMandate.legalNewsSources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "news-iapp-us-ai-law",
            use: "legal_news_monitoring",
          }),
          expect.objectContaining({
            id: "news-law360-ai",
            use: "legal_news_monitoring",
          }),
          expect.objectContaining({
            id: "news-bloomberg-law-ai",
            use: "legal_news_monitoring",
          }),
        ]),
      );
      expect(agent.sourceMandate.officialDatabaseSources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            use: "legal_database_monitoring",
            coverage: expect.arrayContaining(["hard_law"]),
          }),
          expect.objectContaining({
            use: "legal_database_monitoring",
            coverage: expect.arrayContaining(["soft_law"]),
          }),
          expect.objectContaining({
            sourceType: "court_or_case_law",
            coverage: expect.arrayContaining(["case_law_and_decisions"]),
          }),
        ]),
      );
      expect(
        agent.sourceMandate.officialDatabaseSources.flatMap((source) => source.coverage),
      ).toEqual(expect.arrayContaining(["hard_law", "soft_law", "case_law_and_decisions"]));
    }
  });
});
