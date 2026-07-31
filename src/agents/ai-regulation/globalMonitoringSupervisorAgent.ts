import type { MandateSourceProvisioning } from "@/agents/ai-regulation/euMemberStateSourceMandates";
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

type ProvisionedSource = { provisioning: MandateSourceProvisioning };

/**
 * Reads the declared sources off an agent, whatever registry it came from.
 *
 * The three regional registries are structurally different — EU agents carry
 * `country`, US agents `jurisdiction` and `postalCode`, and international agents
 * no source mandate at all. Typing the parameter to any one of them would either
 * exclude the others or couple this to source-type unions it never inspects, so
 * the shape is checked at the boundary instead.
 */
function declaredSources(agent: unknown): ProvisionedSource[] {
  const mandate = (agent as { sourceMandate?: unknown }).sourceMandate;
  if (!mandate || typeof mandate !== "object") return [];
  const { legalNewsSources, officialDatabaseSources } = mandate as {
    legalNewsSources?: unknown;
    officialDatabaseSources?: unknown;
  };
  return [
    ...(Array.isArray(legalNewsSources) ? (legalNewsSources as ProvisionedSource[]) : []),
    ...(Array.isArray(officialDatabaseSources)
      ? (officialDatabaseSources as ProvisionedSource[])
      : []),
  ];
}

/**
 * How many monitoring agents actually have a wired source behind them.
 *
 * A `sourceMandate` is a statement of intent: each of its sources carries
 * `provisioning`, and today every one of the 79 agents that declares a mandate
 * declares it entirely `aspirational_not_wired`. The dashboard counted agents
 * without reading that field, so it repeated the claim on the very instrument an
 * operator would use to notice the gap.
 *
 * This does not mean the monitor collects nothing — scanning runs off
 * `regulationSourcesSeed`, a separate registry. The mandates describe coverage
 * that was planned and never provisioned.
 *
 * An agent counts as provisioned when at least one of its declared sources is
 * `seeded_and_scanned`. Deliberately generous: partial wiring is still real
 * coverage, and the point is to stop overstating, not to understate.
 */
export function summariseAgentProvisioning(
  supervisors: ReadonlyArray<{ managedAgents: readonly unknown[] }>,
) {
  const agents = supervisors.flatMap((supervisor) => [...supervisor.managedAgents]);

  let declaring = 0;
  let provisioned = 0;
  for (const agent of agents) {
    const sources = declaredSources(agent);
    // An agent that declares nothing is not overstating anything, so it is
    // neither a gap nor a claim — international agents are all like this.
    if (sources.length === 0) continue;
    declaring += 1;
    if (sources.some((source) => source.provisioning === "seeded_and_scanned")) {
      provisioned += 1;
    }
  }

  return { total: agents.length, declaring, provisioned, aspirational: declaring - provisioned };
}

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
