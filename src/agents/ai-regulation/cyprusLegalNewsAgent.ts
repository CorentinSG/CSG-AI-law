import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  cyprusAgentProfileIds,
  cyprusMonitoringSourceRegistry,
  getCyprusAgentSourceIds,
  getCyprusSchedulerGuidance,
  getCyprusSourceDescriptor,
  isCyprusMonitoringSource,
} from "@/agents/ai-regulation/cyprusNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Cyprus",
    countrySlug: "cyprus",
    countryCode: "CY",
    adjective: "Cypriot",
    primaryAuthorityLabel: "Office of the Commissioner for Personal Data Protection",
    sourceRegistry: cyprusMonitoringSourceRegistry,
  },
  agentProfileIds: cyprusAgentProfileIds,
  isMonitoringSource: isCyprusMonitoringSource,
  getSourceDescriptor: getCyprusSourceDescriptor,
  getAgentSourceIds: getCyprusAgentSourceIds,
  getSchedulerGuidance: getCyprusSchedulerGuidance,
});

export const isCyprusNewsItem = agent.isNewsItem;
export const getCyprusLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runCyprusLegalNewsAgentScan = agent.runLegalNewsAgentScan;
