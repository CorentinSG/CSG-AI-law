import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  estoniaAgentProfileIds,
  estoniaMonitoringSourceRegistry,
  getEstoniaAgentSourceIds,
  getEstoniaSchedulerGuidance,
  getEstoniaSourceDescriptor,
  isEstoniaMonitoringSource,
} from "@/agents/ai-regulation/estoniaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Estonia",
    countrySlug: "estonia",
    countryCode: "EE",
    adjective: "Estonian",
    primaryAuthorityLabel: "Estonian Data Protection Inspectorate",
    sourceRegistry: estoniaMonitoringSourceRegistry,
  },
  agentProfileIds: estoniaAgentProfileIds,
  isMonitoringSource: isEstoniaMonitoringSource,
  getSourceDescriptor: getEstoniaSourceDescriptor,
  getAgentSourceIds: getEstoniaAgentSourceIds,
  getSchedulerGuidance: getEstoniaSchedulerGuidance,
});

export const isEstoniaNewsItem = agent.isNewsItem;
export const getEstoniaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runEstoniaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
