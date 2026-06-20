import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("malta"),
);

export const maltaAgentProfileIds = sourceModule.agentProfileIds;
export type MaltaAgentProfileId = GenericCountryAgentProfileId;
export const maltaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type MaltaMonitoringSourceDescriptor =
  (typeof maltaMonitoringSourceRegistry)[number];
export const isMaltaMonitoringSource = sourceModule.isMonitoringSource;
export const getMaltaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getMaltaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getMaltaSchedulerGuidance = sourceModule.getSchedulerGuidance;
