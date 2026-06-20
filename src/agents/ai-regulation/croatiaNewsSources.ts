import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("croatia"),
);

export const croatiaAgentProfileIds = sourceModule.agentProfileIds;
export type CroatiaAgentProfileId = GenericCountryAgentProfileId;
export const croatiaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type CroatiaMonitoringSourceDescriptor =
  (typeof croatiaMonitoringSourceRegistry)[number];
export const isCroatiaMonitoringSource = sourceModule.isMonitoringSource;
export const getCroatiaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getCroatiaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getCroatiaSchedulerGuidance = sourceModule.getSchedulerGuidance;
