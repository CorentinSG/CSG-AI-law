import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("hungary"),
);

export const hungaryAgentProfileIds = sourceModule.agentProfileIds;
export type HungaryAgentProfileId = GenericCountryAgentProfileId;
export const hungaryMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type HungaryMonitoringSourceDescriptor =
  (typeof hungaryMonitoringSourceRegistry)[number];
export const isHungaryMonitoringSource = sourceModule.isMonitoringSource;
export const getHungarySourceDescriptor = sourceModule.getSourceDescriptor;
export const getHungaryAgentSourceIds = sourceModule.getAgentSourceIds;
export const getHungarySchedulerGuidance = sourceModule.getSchedulerGuidance;
