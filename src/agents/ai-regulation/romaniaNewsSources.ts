import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("romania"),
);

export const romaniaAgentProfileIds = sourceModule.agentProfileIds;
export type RomaniaAgentProfileId = GenericCountryAgentProfileId;
export const romaniaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type RomaniaMonitoringSourceDescriptor =
  (typeof romaniaMonitoringSourceRegistry)[number];
export const isRomaniaMonitoringSource = sourceModule.isMonitoringSource;
export const getRomaniaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getRomaniaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getRomaniaSchedulerGuidance = sourceModule.getSchedulerGuidance;
