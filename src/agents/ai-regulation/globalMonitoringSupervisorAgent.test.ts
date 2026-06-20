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

  it("exposes manager needs for precision and central database distribution", () => {
    const registry = listGlobalMonitoringAgents();

    for (const supervisor of registry.regionalSupervisors) {
      expect(supervisor.needs.requestedCapabilities).toEqual(
        expect.arrayContaining([
          "verified_official_source_inventory",
          "jurisdiction_specific_news_portfolio",
          "central_legal_database_distribution",
          "local_legal_timeline_generation",
          "hard_law_soft_law_case_law_classification",
          "api_accelerated_monitoring",
        ]),
      );
      expect(supervisor.needs.apiInstructions).toMatchObject({
        useNativeApisWhenAvailable: true,
        noAdminInterventionForOfficialSourcePublication: true,
        noAdminInterventionForSeriousOrCorroboratedLegalNews: true,
      });
      expect(supervisor.needs.databaseInstructions).toMatchObject({
        centralBackendStore: "ai_regulatory_updates",
        jurisdictionProfileStore: "country_intelligence",
        timelineSource: "published_and_verified_regulatory_updates",
        distributionKey: "jurisdiction_country_region",
      });
    }
  });

  it("exposes API capabilities and missing user setup to the boss supervisor", () => {
    const registry = listGlobalMonitoringAgents();

    expect(registry.apiCapabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "gdelt-doc-api",
          status: "available",
        }),
        expect.objectContaining({
          id: "newsapi",
          envVars: ["NEWSAPI_API_KEY"],
        }),
        expect.objectContaining({
          id: "courtlistener-recap",
          status: "planned",
        }),
      ]),
    );
    expect(Array.isArray(registry.missingApiCapabilities)).toBe(true);
  });
});
