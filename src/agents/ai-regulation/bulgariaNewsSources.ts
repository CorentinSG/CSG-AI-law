import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("bulgaria"),
);

export const bulgariaAgentProfileIds = sourceModule.agentProfileIds;
export type BulgariaAgentProfileId = GenericCountryAgentProfileId;
export const bulgariaMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type BulgariaMonitoringSourceDescriptor =
  (typeof bulgariaMonitoringSourceRegistry)[number];
export const isBulgariaMonitoringSource = sourceModule.isMonitoringSource;
export const getBulgariaSourceDescriptor = sourceModule.getSourceDescriptor;
export const getBulgariaAgentSourceIds = sourceModule.getAgentSourceIds;
export const getBulgariaSchedulerGuidance = sourceModule.getSchedulerGuidance;
