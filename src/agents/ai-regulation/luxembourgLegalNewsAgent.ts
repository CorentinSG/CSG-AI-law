import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getLuxembourgAgentSourceIds,
  getLuxembourgSchedulerGuidance,
  getLuxembourgSourceDescriptor,
  isLuxembourgMonitoringSource,
  luxembourgAgentProfileIds,
  luxembourgMonitoringSourceRegistry,
} from "@/agents/ai-regulation/luxembourgNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Luxembourg",
    countrySlug: "luxembourg",
    countryCode: "LU",
    adjective: "Luxembourgish",
    primaryAuthorityLabel: "National Commission for Data Protection",
    sourceRegistry: luxembourgMonitoringSourceRegistry,
  },
  agentProfileIds: luxembourgAgentProfileIds,
  isMonitoringSource: isLuxembourgMonitoringSource,
  getSourceDescriptor: getLuxembourgSourceDescriptor,
  getAgentSourceIds: getLuxembourgAgentSourceIds,
  getSchedulerGuidance: getLuxembourgSchedulerGuidance,
});

export const isLuxembourgNewsItem = agent.isNewsItem;
export const getLuxembourgLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runLuxembourgLegalNewsAgentScan = agent.runLegalNewsAgentScan;
