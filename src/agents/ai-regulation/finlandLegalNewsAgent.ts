import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  finlandAgentProfileIds,
  finlandMonitoringSourceRegistry,
  getFinlandAgentSourceIds,
  getFinlandSchedulerGuidance,
  getFinlandSourceDescriptor,
  isFinlandMonitoringSource,
} from "@/agents/ai-regulation/finlandNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Finland",
    countrySlug: "finland",
    countryCode: "FI",
    adjective: "Finnish",
    primaryAuthorityLabel: "Office of the Data Protection Ombudsman",
    sourceRegistry: finlandMonitoringSourceRegistry,
  },
  agentProfileIds: finlandAgentProfileIds,
  isMonitoringSource: isFinlandMonitoringSource,
  getSourceDescriptor: getFinlandSourceDescriptor,
  getAgentSourceIds: getFinlandAgentSourceIds,
  getSchedulerGuidance: getFinlandSchedulerGuidance,
});

export const isFinlandNewsItem = agent.isNewsItem;
export const getFinlandLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runFinlandLegalNewsAgentScan = agent.runLegalNewsAgentScan;
