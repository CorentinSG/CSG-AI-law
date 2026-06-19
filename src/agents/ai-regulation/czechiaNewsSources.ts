import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("czechia"),
);

export const czechiaAgentProfileIds = sourceModule.agentProfileIds;
export type CzechiaAgentProfileId = GenericCountryAgentProfileId;
export const czechiaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type CzechiaMonitoringSourceDescriptor =
  (typeof czechiaMonitoringSourceRegistry)[number];
export const isCzechiaMonitoringSource = sourceModule.isMonitoringSource;
export const getCzechiaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getCzechiaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getCzechiaSchedulerGuidance = sourceModule.getSchedulerGuidance;
