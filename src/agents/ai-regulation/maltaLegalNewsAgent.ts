import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getMaltaAgentSourceIds,
  getMaltaSchedulerGuidance,
  getMaltaSourceDescriptor,
  isMaltaMonitoringSource,
  maltaAgentProfileIds,
  maltaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/maltaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Malta",
    countrySlug: "malta",
    countryCode: "MT",
    adjective: "Maltese",
    primaryAuthorityLabel: "Information and Data Protection Commissioner",
    sourceRegistry: maltaMonitoringSourceRegistry,
  },
  agentProfileIds: maltaAgentProfileIds,
  isMonitoringSource: isMaltaMonitoringSource,
  getSourceDescriptor: getMaltaSourceDescriptor,
  getAgentSourceIds: getMaltaAgentSourceIds,
  getSchedulerGuidance: getMaltaSchedulerGuidance,
});

export const isMaltaNewsItem = agent.isNewsItem;
export const getMaltaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runMaltaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
