import { listEuMonitoringAgents } from "@/agents/ai-regulation/euMonitoringSupervisorAgent";
import { queueScanJob } from "@/agents/ai-regulation/processors/scanJobs";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { listUsMonitoringAgents } from "@/agents/ai-regulation/usMonitoringSupervisorAgent";

export type CentralSchedulerRegion = "eu" | "us";

export interface CentralSchedulerPlanItem {
  id: string;
  region: CentralSchedulerRegion;
  label: string;
  scanProfile: ScanProfileId;
  cadence: "daily" | "hourly" | "live";
  agentIds: string[];
  agentCount: number;
}

export interface CentralSchedulerPlan {
  recommendedCron: string;
  description: string;
  totalAgents: number;
  euAgents: number;
  usAgents: number;
  items: CentralSchedulerPlanItem[];
}

const EU_SCAN_ITEMS = [
  {
    id: "eu-official",
    label: "EU official legal database sweep",
    scanProfile: "eu_official_legal_scan",
    cadence: "daily",
  },
  {
    id: "eu-live-news",
    label: "EU legal-news discovery sweep",
    scanProfile: "eu_live_news_discovery_scan",
    cadence: "live",
  },
  {
    id: "eu-verification",
    label: "EU recurring verification sweep",
    scanProfile: "eu_verification_scan",
    cadence: "hourly",
  },
] as const;

const US_SCAN_ITEMS = [
  {
    id: "us-official",
    label: "US official legal database sweep",
    scanProfile: "official_baseline_scan",
    cadence: "daily",
  },
  {
    id: "us-live-news",
    label: "US legal-news discovery sweep",
    scanProfile: "live_news_discovery_scan",
    cadence: "live",
  },
  {
    id: "us-verification",
    label: "US recurring verification sweep",
    scanProfile: "verification_scan",
    cadence: "hourly",
  },
] as const;

export const scheduler = {
  recommendedCron: "*/15 * * * *",
  description:
    "Central scheduler for the AI Regulation Monitor. It queues regional profile sweeps covering all EU and US monitoring agents; a permanent worker should drain the queue.",
};

function planItemsForRegion(
  region: CentralSchedulerRegion,
  agentIds: string[],
): CentralSchedulerPlanItem[] {
  const definitions = region === "eu" ? EU_SCAN_ITEMS : US_SCAN_ITEMS;
  return definitions.map((definition) => ({
    ...definition,
    region,
    agentIds,
    agentCount: agentIds.length,
  }));
}

export function buildCentralMonitoringSchedule(): CentralSchedulerPlan {
  const euAgentIds = listEuMonitoringAgents().map((agent) => agent.id);
  const usAgentIds = listUsMonitoringAgents().map((agent) => agent.id);

  return {
    ...scheduler,
    totalAgents: euAgentIds.length + usAgentIds.length,
    euAgents: euAgentIds.length,
    usAgents: usAgentIds.length,
    items: [
      ...planItemsForRegion("eu", euAgentIds),
      ...planItemsForRegion("us", usAgentIds),
    ],
  };
}

export async function enqueueCentralMonitoringSchedule(options?: {
  trigger?: ScanTrigger;
  requestedBy?: string;
  regions?: CentralSchedulerRegion[];
  cadences?: Array<CentralSchedulerPlanItem["cadence"]>;
}) {
  const selectedRegions = new Set(options?.regions ?? ["eu", "us"]);
  const selectedCadences = options?.cadences ? new Set(options.cadences) : null;
  const trigger = options?.trigger ?? "scheduled";
  const requestedBy = options?.requestedBy ?? "central-monitoring-scheduler";
  const plan = buildCentralMonitoringSchedule();
  const selectedItems = plan.items.filter(
    (item) =>
      selectedRegions.has(item.region) &&
      (!selectedCadences || selectedCadences.has(item.cadence)),
  );

  const queuedJobs = [];
  for (const item of selectedItems) {
    queuedJobs.push(
      await queueScanJob({
        trigger,
        requestedBy,
        scanProfile: item.scanProfile,
        resultSummary: {
          scheduler: "central-monitoring-scheduler",
          schedulerPlanItemId: item.id,
          schedulerRegion: item.region,
          schedulerCadence: item.cadence,
          coveredAgentIds: item.agentIds,
          coveredAgentCount: item.agentCount,
        },
      }),
    );
  }

  return {
    plan,
    queuedJobs,
    queuedJobCount: queuedJobs.length,
  };
}
