import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  croatiaAgentProfileIds,
  croatiaMonitoringSourceRegistry,
  getCroatiaAgentSourceIds,
  getCroatiaSchedulerGuidance,
  getCroatiaSourceDescriptor,
  isCroatiaMonitoringSource,
} from "@/agents/ai-regulation/croatiaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Croatia",
    countrySlug: "croatia",
    countryCode: "HR",
    adjective: "Croatian",
    primaryAuthorityLabel: "Croatian Personal Data Protection Agency",
    sourceRegistry: croatiaMonitoringSourceRegistry,
  },
  agentProfileIds: croatiaAgentProfileIds,
  isMonitoringSource: isCroatiaMonitoringSource,
  getSourceDescriptor: getCroatiaSourceDescriptor,
  getAgentSourceIds: getCroatiaAgentSourceIds,
  getSchedulerGuidance: getCroatiaSchedulerGuidance,
});

export const isCroatiaNewsItem = agent.isNewsItem;
export const getCroatiaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runCroatiaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
