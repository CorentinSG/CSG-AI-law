import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  czechiaAgentProfileIds,
  czechiaMonitoringSourceRegistry,
  getCzechiaAgentSourceIds,
  getCzechiaSchedulerGuidance,
  getCzechiaSourceDescriptor,
  isCzechiaMonitoringSource,
} from "@/agents/ai-regulation/czechiaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Czechia",
    countrySlug: "czechia",
    countryCode: "CZ",
    adjective: "Czech",
    primaryAuthorityLabel: "Office for Personal Data Protection",
    sourceRegistry: czechiaMonitoringSourceRegistry,
  },
  agentProfileIds: czechiaAgentProfileIds,
  isMonitoringSource: isCzechiaMonitoringSource,
  getSourceDescriptor: getCzechiaSourceDescriptor,
  getAgentSourceIds: getCzechiaAgentSourceIds,
  getSchedulerGuidance: getCzechiaSchedulerGuidance,
});

export const isCzechiaNewsItem = agent.isNewsItem;
export const getCzechiaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runCzechiaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
