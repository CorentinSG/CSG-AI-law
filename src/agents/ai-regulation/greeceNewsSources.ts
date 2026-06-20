import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("greece"),
);

export const greeceAgentProfileIds = sourceModule.agentProfileIds;
export type GreeceAgentProfileId = GenericCountryAgentProfileId;
export const greeceMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type GreeceMonitoringSourceDescriptor =
  (typeof greeceMonitoringSourceRegistry)[number];
export const isGreeceMonitoringSource = sourceModule.isMonitoringSource;
export const getGreeceSourceDescriptor = sourceModule.getSourceDescriptor;
export const getGreeceAgentSourceIds = sourceModule.getAgentSourceIds;
export const getGreeceSchedulerGuidance = sourceModule.getSchedulerGuidance;
