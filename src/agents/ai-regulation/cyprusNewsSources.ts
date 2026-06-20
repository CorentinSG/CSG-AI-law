import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("cyprus"),
);

export const cyprusAgentProfileIds = sourceModule.agentProfileIds;
export type CyprusAgentProfileId = GenericCountryAgentProfileId;
export const cyprusMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type CyprusMonitoringSourceDescriptor =
  (typeof cyprusMonitoringSourceRegistry)[number];
export const isCyprusMonitoringSource = sourceModule.isMonitoringSource;
export const getCyprusSourceDescriptor = sourceModule.getSourceDescriptor;
export const getCyprusAgentSourceIds = sourceModule.getAgentSourceIds;
export const getCyprusSchedulerGuidance = sourceModule.getSchedulerGuidance;
