import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("finland"),
);

export const finlandAgentProfileIds = sourceModule.agentProfileIds;
export type FinlandAgentProfileId = GenericCountryAgentProfileId;
export const finlandMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type FinlandMonitoringSourceDescriptor =
  (typeof finlandMonitoringSourceRegistry)[number];
export const isFinlandMonitoringSource = sourceModule.isMonitoringSource;
export const getFinlandSourceDescriptor = sourceModule.getSourceDescriptor;
export const getFinlandAgentSourceIds = sourceModule.getAgentSourceIds;
export const getFinlandSchedulerGuidance = sourceModule.getSchedulerGuidance;
