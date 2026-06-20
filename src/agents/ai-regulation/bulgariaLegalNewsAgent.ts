import { createCountryLegalNewsAgent } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import {
  getBulgariaAgentSourceIds,
  getBulgariaSchedulerGuidance,
  getBulgariaSourceDescriptor,
  isBulgariaMonitoringSource,
  bulgariaAgentProfileIds,
  bulgariaMonitoringSourceRegistry,
} from "@/agents/ai-regulation/bulgariaNewsSources";

const agent = createCountryLegalNewsAgent({
  definition: {
    countryName: "Bulgaria",
    countrySlug: "bulgaria",
    countryCode: "BG",
    adjective: "Bulgarian",
    primaryAuthorityLabel: "Commission for Personal Data Protection",
    sourceRegistry: bulgariaMonitoringSourceRegistry,
  },
  agentProfileIds: bulgariaAgentProfileIds,
  isMonitoringSource: isBulgariaMonitoringSource,
  getSourceDescriptor: getBulgariaSourceDescriptor,
  getAgentSourceIds: getBulgariaAgentSourceIds,
  getSchedulerGuidance: getBulgariaSchedulerGuidance,
});

export const isBulgariaNewsItem = agent.isNewsItem;
export const getBulgariaLiveLegalIntelligenceData = agent.getLiveLegalIntelligenceData;
export const runBulgariaLegalNewsAgentScan = agent.runLegalNewsAgentScan;
