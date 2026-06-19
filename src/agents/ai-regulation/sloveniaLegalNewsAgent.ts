import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getSloveniaAgentSourceIds,
  getSloveniaSchedulerGuidance,
  getSloveniaSourceDescriptor,
  isSloveniaMonitoringSource,
  sloveniaAgentProfileIds,
  sloveniaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/sloveniaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Slovenia",
    countrySlug: "slovenia",
    countryCode: "SI",
    adjective: "Slovenian",
    primaryAuthorityLabel: "Information Commissioner",
    sourceRegistry: sloveniaMonitoringSourceRegistry,
  },
  agentProfileIds: sloveniaAgentProfileIds,
  isMonitoringSource: isSloveniaMonitoringSource,
  getSourceDescriptor: getSloveniaSourceDescriptor,
  getAgentSourceIds: getSloveniaAgentSourceIds,
  getSchedulerGuidance: getSloveniaSchedulerGuidance,
});

export const isSloveniaNewsItem = agent.isNewsItem;
export const getSloveniaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runSloveniaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
