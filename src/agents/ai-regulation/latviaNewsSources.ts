import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("latvia"),
);

export const latviaAgentProfileIds = sourceModule.agentProfileIds;
export type LatviaAgentProfileId = GenericCountryAgentProfileId;
export const latviaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type LatviaMonitoringSourceDescriptor =
  (typeof latviaMonitoringSourceRegistry)[number];
export const isLatviaMonitoringSource = sourceModule.isMonitoringSource;
export const getLatviaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getLatviaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getLatviaSchedulerGuidance = sourceModule.getSchedulerGuidance;
