import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getPolandAgentSourceIds,
  getPolandSchedulerGuidance,
  getPolandSourceDescriptor,
  isPolandMonitoringSource,
  polandAgentProfileIds,
  polandMonitoringSourceRegistry,
} from "@/agents/ai-regulation/polandNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Poland",
    countrySlug: "poland",
    countryCode: "PL",
    adjective: "Polish",
    primaryAuthorityLabel: "Personal Data Protection Office",
    sourceRegistry: polandMonitoringSourceRegistry,
  },
  agentProfileIds: polandAgentProfileIds,
  isMonitoringSource: isPolandMonitoringSource,
  getSourceDescriptor: getPolandSourceDescriptor,
  getAgentSourceIds: getPolandAgentSourceIds,
  getSchedulerGuidance: getPolandSchedulerGuidance,
});

export const isPolandNewsItem = agent.isNewsItem;
export const getPolandLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runPolandLegalNewsAgentScan = agent.runLegalNewsAgentScan;
