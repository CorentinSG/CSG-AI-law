import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("denmark"),
);

export const denmarkAgentProfileIds = sourceModule.agentProfileIds;
export type DenmarkAgentProfileId = GenericCountryAgentProfileId;
export const denmarkMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type DenmarkMonitoringSourceDescriptor =
  (typeof denmarkMonitoringSourceRegistry)[number];
export const isDenmarkMonitoringSource = sourceModule.isMonitoringSource;
export const getDenmarkSourceDescriptor = sourceModule.getSourceDescriptor;
export const getDenmarkAgentSourceIds = sourceModule.getAgentSourceIds;
export const getDenmarkSchedulerGuidance = sourceModule.getSchedulerGuidance;
