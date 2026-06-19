import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getLatviaAgentSourceIds,
  getLatviaSchedulerGuidance,
  getLatviaSourceDescriptor,
  isLatviaMonitoringSource,
  latviaAgentProfileIds,
  latviaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/latviaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Latvia",
    countrySlug: "latvia",
    countryCode: "LV",
    adjective: "Latvian",
    primaryAuthorityLabel: "Data State Inspectorate",
    sourceRegistry: latviaMonitoringSourceRegistry,
  },
  agentProfileIds: latviaAgentProfileIds,
  isMonitoringSource: isLatviaMonitoringSource,
  getSourceDescriptor: getLatviaSourceDescriptor,
  getAgentSourceIds: getLatviaAgentSourceIds,
  getSchedulerGuidance: getLatviaSchedulerGuidance,
});

export const isLatviaNewsItem = agent.isNewsItem;
export const getLatviaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runLatviaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
