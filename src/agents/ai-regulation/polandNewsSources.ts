import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("poland"),
);

export const polandAgentProfileIds = sourceModule.agentProfileIds;
export type PolandAgentProfileId = GenericCountryAgentProfileId;
export const polandMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type PolandMonitoringSourceDescriptor =
  (typeof polandMonitoringSourceRegistry)[number];
export const isPolandMonitoringSource = sourceModule.isMonitoringSource;
export const getPolandSourceDescriptor = sourceModule.getSourceDescriptor;
export const getPolandAgentSourceIds = sourceModule.getAgentSourceIds;
export const getPolandSchedulerGuidance = sourceModule.getSchedulerGuidance;
