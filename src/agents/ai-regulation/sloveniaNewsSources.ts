import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("slovenia"),
);

export const sloveniaAgentProfileIds = sourceModule.agentProfileIds;
export type SloveniaAgentProfileId = GenericCountryAgentProfileId;
export const sloveniaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type SloveniaMonitoringSourceDescriptor =
  (typeof sloveniaMonitoringSourceRegistry)[number];
export const isSloveniaMonitoringSource = sourceModule.isMonitoringSource;
export const getSloveniaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getSloveniaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getSloveniaSchedulerGuidance = sourceModule.getSchedulerGuidance;
