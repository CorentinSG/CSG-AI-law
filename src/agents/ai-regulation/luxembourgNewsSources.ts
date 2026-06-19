import {
  createCountryNewsSourceModule,
  type GenericCountryAgentProfileId,
} from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import { getMissingEuMemberStateAgentDefinition } from "@/agents/ai-regulation/euMemberStateAgentDefinitions";

const sourceModule = createCountryNewsSourceModule(
  getMissingEuMemberStateAgentDefinition("luxembourg"),
);

export const luxembourgAgentProfileIds = sourceModule.agentProfileIds;
export type LuxembourgAgentProfileId = GenericCountryAgentProfileId;
export const luxembourgMonitoringSourceRegistry = sourceModule.definition.sourceRegistry;
export type LuxembourgMonitoringSourceDescriptor =
  (typeof luxembourgMonitoringSourceRegistry)[number];
export const isLuxembourgMonitoringSource = sourceModule.isMonitoringSource;
export const getLuxembourgSourceDescriptor = sourceModule.getSourceDescriptor;
export const getLuxembourgAgentSourceIds = sourceModule.getAgentSourceIds;
export const getLuxembourgSchedulerGuidance = sourceModule.getSchedulerGuidance;
