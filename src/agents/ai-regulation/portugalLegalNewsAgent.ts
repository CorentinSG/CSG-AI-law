import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getPortugalAgentSourceIds,
  getPortugalSchedulerGuidance,
  getPortugalSourceDescriptor,
  isPortugalMonitoringSource,
  portugalAgentProfileIds,
  portugalMonitoringSourceRegistry,
} from "@/agents/ai-regulation/portugalNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Portugal",
    countrySlug: "portugal",
    countryCode: "PT",
    adjective: "Portuguese",
    primaryAuthorityLabel: "National Data Protection Commission",
    sourceRegistry: portugalMonitoringSourceRegistry,
  },
  agentProfileIds: portugalAgentProfileIds,
  isMonitoringSource: isPortugalMonitoringSource,
  getSourceDescriptor: getPortugalSourceDescriptor,
  getAgentSourceIds: getPortugalAgentSourceIds,
  getSchedulerGuidance: getPortugalSchedulerGuidance,
});

export const isPortugalNewsItem = agent.isNewsItem;
export const getPortugalLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runPortugalLegalNewsAgentScan = agent.runLegalNewsAgentScan;
