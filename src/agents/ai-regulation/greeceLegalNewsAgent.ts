import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getGreeceAgentSourceIds,
  getGreeceSchedulerGuidance,
  getGreeceSourceDescriptor,
  greeceAgentProfileIds,
  greeceMonitoringSourceRegistry,
  isGreeceMonitoringSource,
} from "@/agents/ai-regulation/greeceNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Greece",
    countrySlug: "greece",
    countryCode: "GR",
    adjective: "Greek",
    primaryAuthorityLabel: "Hellenic Data Protection Authority",
    sourceRegistry: greeceMonitoringSourceRegistry,
  },
  agentProfileIds: greeceAgentProfileIds,
  isMonitoringSource: isGreeceMonitoringSource,
  getSourceDescriptor: getGreeceSourceDescriptor,
  getAgentSourceIds: getGreeceAgentSourceIds,
  getSchedulerGuidance: getGreeceSchedulerGuidance,
});

export const isGreeceNewsItem = agent.isNewsItem;
export const getGreeceLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runGreeceLegalNewsAgentScan = agent.runLegalNewsAgentScan;
