import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getSlovakiaAgentSourceIds,
  getSlovakiaSchedulerGuidance,
  getSlovakiaSourceDescriptor,
  isSlovakiaMonitoringSource,
  slovakiaAgentProfileIds,
  slovakiaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/slovakiaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Slovakia",
    countrySlug: "slovakia",
    countryCode: "SK",
    adjective: "Slovak",
    primaryAuthorityLabel: "Office for Personal Data Protection of the Slovak Republic",
    sourceRegistry: slovakiaMonitoringSourceRegistry,
  },
  agentProfileIds: slovakiaAgentProfileIds,
  isMonitoringSource: isSlovakiaMonitoringSource,
  getSourceDescriptor: getSlovakiaSourceDescriptor,
  getAgentSourceIds: getSlovakiaAgentSourceIds,
  getSchedulerGuidance: getSlovakiaSchedulerGuidance,
});

export const isSlovakiaNewsItem = agent.isNewsItem;
export const getSlovakiaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runSlovakiaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
