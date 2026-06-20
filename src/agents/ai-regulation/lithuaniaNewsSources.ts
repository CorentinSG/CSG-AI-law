import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("lithuania"),
);

export const lithuaniaAgentProfileIds = sourceModule.agentProfileIds;
export type LithuaniaAgentProfileId = GenericCountryAgentProfileId;
export const lithuaniaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type LithuaniaMonitoringSourceDescriptor =
  (typeof lithuaniaMonitoringSourceRegistry)[number];
export const isLithuaniaMonitoringSource = sourceModule.isMonitoringSource;
export const getLithuaniaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getLithuaniaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getLithuaniaSchedulerGuidance = sourceModule.getSchedulerGuidance;
