import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getRomaniaAgentSourceIds,
  getRomaniaSchedulerGuidance,
  getRomaniaSourceDescriptor,
  isRomaniaMonitoringSource,
  romaniaAgentProfileIds,
  romaniaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/romaniaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Romania",
    countrySlug: "romania",
    countryCode: "RO",
    adjective: "Romanian",
    primaryAuthorityLabel: "National Supervisory Authority for Personal Data Processing",
    sourceRegistry: romaniaMonitoringSourceRegistry,
  },
  agentProfileIds: romaniaAgentProfileIds,
  isMonitoringSource: isRomaniaMonitoringSource,
  getSourceDescriptor: getRomaniaSourceDescriptor,
  getAgentSourceIds: getRomaniaAgentSourceIds,
  getSchedulerGuidance: getRomaniaSchedulerGuidance,
});

export const isRomaniaNewsItem = agent.isNewsItem;
export const getRomaniaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runRomaniaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
