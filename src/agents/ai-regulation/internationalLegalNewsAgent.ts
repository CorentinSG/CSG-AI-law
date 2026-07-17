import { runAiRegulationScan, type ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import {
  getInternationalSchedulerGuidance,
  internationalMonitoringSourceRegistry,
} from "@/agents/ai-regulation/internationalNewsSources";
import { internationalManagerNeeds } from "@/agents/ai-regulation/regionalManagerNeeds";

const internationalScanProfileMap = {
  international_official_legal_scan: "international_official_legal_scan",
  international_live_news_scan: "international_live_news_scan",
  international_verification_scan: "international_verification_scan",
  international_source_health_scan: "source_health_scan",
} as const satisfies Record<string, ScanProfileId>;

export type InternationalAgentScanProfile = keyof typeof internationalScanProfileMap;

export const internationalMonitoringSupervisorManager = {
  id: "international-monitoring-supervisor",
  label: "International Monitoring Supervisor Agent",
  region: "International",
  needs: internationalManagerNeeds,
  role:
    "Coordinates transnational AI governance, standards, soft-law, and global legal-news monitoring.",
  guidance: getInternationalSchedulerGuidance(),
};

export function listInternationalMonitoringAgents() {
  return internationalMonitoringSourceRegistry.map((source) => ({
    id: source.sourceId,
    label: source.label,
    scope: "international_source" as const,
    organization: source.organization,
    category: source.category,
    official: source.official,
    priorityBand: source.priorityBand,
  }));
}

export async function runInternationalLegalNewsAgentScan(options?: {
  trigger?: ScanTrigger;
  profile?: InternationalAgentScanProfile;
}) {
  return runAiRegulationScan(undefined, {
    trigger: options?.trigger ?? "scheduled_local_test",
    scanProfile:
      internationalScanProfileMap[options?.profile ?? "international_live_news_scan"],
  });
}

export async function runInternationalMonitoringSupervisorAgent(options?: {
  trigger?: ScanTrigger;
  profile?: InternationalAgentScanProfile;
}) {
  const trigger = options?.trigger ?? "scheduled_local_test";

  try {
    return {
      manager: internationalMonitoringSupervisorManager,
      trigger,
      totalAgents: internationalMonitoringSourceRegistry.length,
      succeeded: 1,
      failed: 0,
      result: await runInternationalLegalNewsAgentScan({
        trigger,
        profile: options?.profile,
      }),
    };
  } catch (error) {
    return {
      manager: internationalMonitoringSupervisorManager,
      trigger,
      totalAgents: internationalMonitoringSourceRegistry.length,
      succeeded: 0,
      failed: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
