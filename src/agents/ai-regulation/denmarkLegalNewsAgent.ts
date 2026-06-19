import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  denmarkAgentProfileIds,
  denmarkMonitoringSourceRegistry,
  getDenmarkAgentSourceIds,
  getDenmarkSchedulerGuidance,
  getDenmarkSourceDescriptor,
  isDenmarkMonitoringSource,
} from "@/agents/ai-regulation/denmarkNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Denmark",
    countrySlug: "denmark",
    countryCode: "DK",
    adjective: "Danish",
    primaryAuthorityLabel: "Danish Data Protection Agency",
    sourceRegistry: denmarkMonitoringSourceRegistry,
  },
  agentProfileIds: denmarkAgentProfileIds,
  isMonitoringSource: isDenmarkMonitoringSource,
  getSourceDescriptor: getDenmarkSourceDescriptor,
  getAgentSourceIds: getDenmarkAgentSourceIds,
  getSchedulerGuidance: getDenmarkSchedulerGuidance,
});

export const isDenmarkNewsItem = agent.isNewsItem;
export const getDenmarkLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runDenmarkLegalNewsAgentScan = agent.runLegalNewsAgentScan;
