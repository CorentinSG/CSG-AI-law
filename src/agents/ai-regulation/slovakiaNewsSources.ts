import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("slovakia"),
);

export const slovakiaAgentProfileIds = sourceModule.agentProfileIds;
export type SlovakiaAgentProfileId = GenericCountryAgentProfileId;
export const slovakiaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type SlovakiaMonitoringSourceDescriptor =
  (typeof slovakiaMonitoringSourceRegistry)[number];
export const isSlovakiaMonitoringSource = sourceModule.isMonitoringSource;
export const getSlovakiaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getSlovakiaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getSlovakiaSchedulerGuidance = sourceModule.getSchedulerGuidance;
