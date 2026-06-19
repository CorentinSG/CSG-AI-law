import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getHungaryAgentSourceIds,
  getHungarySchedulerGuidance,
  getHungarySourceDescriptor,
  hungaryAgentProfileIds,
  hungaryMonitoringSourceRegistry,
  isHungaryMonitoringSource,
} from "@/agents/ai-regulation/hungaryNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Hungary",
    countrySlug: "hungary",
    countryCode: "HU",
    adjective: "Hungarian",
    primaryAuthorityLabel: "National Authority for Data Protection and Freedom of Information",
    sourceRegistry: hungaryMonitoringSourceRegistry,
  },
  agentProfileIds: hungaryAgentProfileIds,
  isMonitoringSource: isHungaryMonitoringSource,
  getSourceDescriptor: getHungarySourceDescriptor,
  getAgentSourceIds: getHungaryAgentSourceIds,
  getSchedulerGuidance: getHungarySchedulerGuidance,
});

export const isHungaryNewsItem = agent.isNewsItem;
export const getHungaryLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runHungaryLegalNewsAgentScan = agent.runLegalNewsAgentScan;
