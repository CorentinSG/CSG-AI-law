import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("portugal"),
);

export const portugalAgentProfileIds = sourceModule.agentProfileIds;
export type PortugalAgentProfileId = GenericCountryAgentProfileId;
export const portugalMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type PortugalMonitoringSourceDescriptor =
  (typeof portugalMonitoringSourceRegistry)[number];
export const isPortugalMonitoringSource = sourceModule.isMonitoringSource;
export const getPortugalSourceDescriptor = sourceModule.getSourceDescriptor;
export const getPortugalAgentSourceIds = sourceModule.getAgentSourceIds;
export const getPortugalSchedulerGuidance = sourceModule.getSchedulerGuidance;
