import {
  createCountryLegalNewsAgent,
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  usFederalMonitoringAgentDefinition,
  usSubFederalMonitoringAgentDefinitions,
  type UsMonitoringAgentDefinition,
} from "@/agents/ai-regulation/usMonitoringAgentDefinitions";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";

export type UsMonitoringAgentScope = "federal" | "state" | "district";

type UsAgentRunner = (options?: {
  trigger?: ScanTrigger;
  profile?: GenericCountryAgentProfileId;
}) => Promise<unknown>;

export interface UsMonitoringAgentDescriptor {
  id: string;
  label: string;
  scope: UsMonitoringAgentScope;
  jurisdiction: string;
  postalCode: string;
  runner: UsAgentRunner;
  definition: UsMonitoringAgentDefinition;
}

function toAgentId(definition: UsMonitoringAgentDefinition) {
  if (definition.jurisdictionLevel === "federal") return "us-federal";
  return `us-${definition.postalCode.toLowerCase()}`;
}

function createUsMonitoringAgentDescriptor(
  definition: UsMonitoringAgentDefinition,
): UsMonitoringAgentDescriptor {
  const sourceModule = createCountryNewsSourceModule(definition);
  const agent = createCountryLegalNewsAgent(sourceModule);

  return {
    id: toAgentId(definition),
    label:
      definition.jurisdictionLevel === "federal"
        ? "US Federal Legal News Agent"
        : `${definition.countryName} Legal News Agent`,
    scope: definition.jurisdictionLevel,
    jurisdiction: definition.countryName,
    postalCode: definition.postalCode,
    runner: agent.runLegalNewsAgentScan,
    definition,
  };
}

export const usFederalMonitoringAgent = createUsMonitoringAgentDescriptor(
  usFederalMonitoringAgentDefinition,
);

export const usStateMonitoringAgents = usSubFederalMonitoringAgentDefinitions.map(
  createUsMonitoringAgentDescriptor,
);

export const usMonitoringAgents: UsMonitoringAgentDescriptor[] = [
  usFederalMonitoringAgent,
  ...usStateMonitoringAgents,
];

export function listUsMonitoringAgents() {
  return usMonitoringAgents.map((agent) => ({
    id: agent.id,
    label: agent.label,
    scope: agent.scope,
    jurisdiction: agent.jurisdiction,
    postalCode: agent.postalCode,
  }));
}
