import {
  listEuMonitoringAgents,
  euMonitoringSupervisorManager,
  runEuMonitoringSupervisorAgent,
} from "@/agents/ai-regulation/euMonitoringSupervisorAgent";
import {
  listUsMonitoringAgents,
  usMonitoringSupervisorManager,
  runUsMonitoringSupervisorAgent,
} from "@/agents/ai-regulation/usMonitoringSupervisorAgent";
import {
  internationalMonitoringSupervisorManager,
  listInternationalMonitoringAgents,
  runInternationalMonitoringSupervisorAgent,
} from "@/agents/ai-regulation/internationalLegalNewsAgent";
import { supervisorMonitoringMandate } from "@/agents/ai-regulation/monitoringAgentMandate";
import {
  listAgentApiCapabilities,
  listMissingAgentApiCapabilities,
} from "@/agents/ai-regulation/agentApiCapabilities";
import type { GenericCountryAgentProfileId } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";

export const designMonitoringAgent = {
  id: "design",
  label: "Design Agent",
  scope: "design",
  region: "experience",
  owner: "Claude Code",
  status: "external_controlled" as const,
  role: "Maintains visual system, UX direction, and page composition.",
};

export const globalMonitoringSupervisorAgent = {
  id: "global-monitoring-supervisor",
  label: "Global Monitoring Supervisor Agent",
  scope: "global",
  mandate: supervisorMonitoringMandate,
  role:
    "Coordinates EU monitoring, US monitoring, and the design agent. This is the future conversation channel anchor for agent orchestration.",
};

export function listGlobalMonitoringAgents() {
  return {
    supervisor: globalMonitoringSupervisorAgent,
    regionalSupervisors: [
      {
        ...euMonitoringSupervisorManager,
        mandate: supervisorMonitoringMandate,
        managedAgents: listEuMonitoringAgents(),
      },
      {
        ...usMonitoringSupervisorManager,
        mandate: supervisorMonitoringMandate,
        managedAgents: listUsMonitoringAgents(),
      },
      {
        ...internationalMonitoringSupervisorManager,
        mandate: supervisorMonitoringMandate,
        managedAgents: listInternationalMonitoringAgents(),
      },
    ],
    crossFunctionalAgents: [designMonitoringAgent],
    apiCapabilities: listAgentApiCapabilities(),
    missingApiCapabilities: listMissingAgentApiCapabilities(),
  };
}

export async function runGlobalMonitoringSupervisorAgent(options?: {
  trigger?: ScanTrigger;
  profile?: GenericCountryAgentProfileId;
  regions?: Array<"eu" | "us" | "international">;
}) {
  const selectedRegions = new Set(options?.regions ?? ["eu", "us", "international"]);
  const trigger = options?.trigger ?? "scheduled_local_test";
  const profile = options?.profile ?? "live_news_scan";
  const results = [];

  if (selectedRegions.has("eu")) {
    try {
      results.push({
        agentId: "eu-monitoring-supervisor",
        status: "succeeded" as const,
        result: await runEuMonitoringSupervisorAgent({ trigger }),
      });
    } catch (error) {
      results.push({
        agentId: "eu-monitoring-supervisor",
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (selectedRegions.has("us")) {
    try {
      results.push({
        agentId: "us-monitoring-supervisor",
        status: "succeeded" as const,
        result: await runUsMonitoringSupervisorAgent({ trigger, profile }),
      });
    } catch (error) {
      results.push({
        agentId: "us-monitoring-supervisor",
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (selectedRegions.has("international")) {
    try {
      results.push({
        agentId: "international-monitoring-supervisor",
        status: "succeeded" as const,
        result: await runInternationalMonitoringSupervisorAgent({ trigger }),
      });
    } catch (error) {
      results.push({
        agentId: "international-monitoring-supervisor",
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    supervisor: globalMonitoringSupervisorAgent,
    trigger,
    profile,
    totalSupervisors: results.length,
    succeeded: results.filter((result) => result.status === "succeeded").length,
    failed: results.filter((result) => result.status === "failed").length,
    designAgent: designMonitoringAgent,
    apiCapabilities: listAgentApiCapabilities(),
    missingApiCapabilities: listMissingAgentApiCapabilities(),
    results,
  };
}
