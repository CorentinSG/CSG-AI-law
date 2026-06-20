import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("estonia"),
);

export const estoniaAgentProfileIds = sourceModule.agentProfileIds;
export type EstoniaAgentProfileId = GenericCountryAgentProfileId;
export const estoniaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type EstoniaMonitoringSourceDescriptor =
  (typeof estoniaMonitoringSourceRegistry)[number];
export const isEstoniaMonitoringSource = sourceModule.isMonitoringSource;
export const getEstoniaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getEstoniaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getEstoniaSchedulerGuidance = sourceModule.getSchedulerGuidance;
