import {
  listUsMonitoringAgents,
  usMonitoringAgents,
  usStateMonitoringAgents,
  usFederalMonitoringAgent,
  type UsMonitoringAgentDescriptor,
} from "@/agents/ai-regulation/usMonitoringAgents";
import type { GenericCountryAgentProfileId } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";

export { listUsMonitoringAgents, usFederalMonitoringAgent, usMonitoringAgents, usStateMonitoringAgents };
export type { UsMonitoringAgentDescriptor };

export async function runUsMonitoringSupervisorAgent(options?: {
  trigger?: ScanTrigger;
  profile?: GenericCountryAgentProfileId;
  agentIds?: string[];
}) {
  const selectedIds = options?.agentIds ? new Set(options.agentIds) : null;
  const selectedAgents = selectedIds
    ? usMonitoringAgents.filter((agent) => selectedIds.has(agent.id))
    : usMonitoringAgents;
  const trigger = options?.trigger ?? "scheduled_local_test";
  const profile = options?.profile ?? "live_news_scan";

  const results = [];
  for (const agent of selectedAgents) {
    try {
      results.push({
        agentId: agent.id,
        status: "succeeded" as const,
        result: await agent.runner({ trigger, profile }),
      });
    } catch (error) {
      results.push({
        agentId: agent.id,
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    trigger,
    profile,
    totalAgents: selectedAgents.length,
    succeeded: results.filter((result) => result.status === "succeeded").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}
