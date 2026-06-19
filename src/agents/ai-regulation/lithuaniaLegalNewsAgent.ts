import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getLithuaniaAgentSourceIds,
  getLithuaniaSchedulerGuidance,
  getLithuaniaSourceDescriptor,
  isLithuaniaMonitoringSource,
  lithuaniaAgentProfileIds,
  lithuaniaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/lithuaniaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Lithuania",
    countrySlug: "lithuania",
    countryCode: "LT",
    adjective: "Lithuanian",
    primaryAuthorityLabel: "State Data Protection Inspectorate",
    sourceRegistry: lithuaniaMonitoringSourceRegistry,
  },
  agentProfileIds: lithuaniaAgentProfileIds,
  isMonitoringSource: isLithuaniaMonitoringSource,
  getSourceDescriptor: getLithuaniaSourceDescriptor,
  getAgentSourceIds: getLithuaniaAgentSourceIds,
  getSchedulerGuidance: getLithuaniaSchedulerGuidance,
});

export const isLithuaniaNewsItem = agent.isNewsItem;
export const getLithuaniaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runLithuaniaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
