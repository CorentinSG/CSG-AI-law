import { listEuMonitoringAgents } from "@/agents/ai-regulation/euMonitoringSupervisorAgent";
import { queueScanJob } from "@/agents/ai-regulation/processors/scanJobs";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { internationalMonitoringSourceRegistry } from "@/agents/ai-regulation/internationalNewsSources";
import { listUsMonitoringAgents } from "@/agents/ai-regulation/usMonitoringSupervisorAgent";

export type CentralSchedulerRegion = "eu" | "us" | "international";

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
  internationalAgents: number;
  items: CentralSchedulerPlanItem[];
}

export interface CentralSchedulerSkippedJob {
  itemId: string;
  scanProfile: ScanProfileId;
  existingJobId: string;
  reason: "recent_duplicate";
}

const EU_SCAN_ITEMS = [
  {
    // Hourly fast lane over the priority official feeds (CNIL, CURIA, EDPB,
    // Commission, EUR-Lex, Federal Register): this is what turns a 24h
    // publication latency into <1h for real legal events. Runs via the worker
    // self-scheduler's hourly cadence.
    id: "official-fast",
    label: "Priority official feeds fast sweep (EU + US)",
    scanProfile: "official_fast_scan",
    cadence: "hourly",
  },
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

const INTERNATIONAL_SCAN_ITEMS = [
  {
    id: "international-official",
    label: "International official governance sweep",
    scanProfile: "international_official_legal_scan",
    cadence: "daily",
  },
  {
    id: "international-live-news",
    label: "International legal-news discovery sweep",
    scanProfile: "international_live_news_scan",
    cadence: "live",
  },
  {
    id: "international-verification",
    label: "International recurring verification sweep",
    scanProfile: "international_verification_scan",
    cadence: "hourly",
  },
] as const;

export const scheduler = {
  recommendedCron: "*/15 * * * *",
  description:
    "Central scheduler for the AI Regulation Monitor. It queues regional profile sweeps covering all EU and US monitoring agents; a permanent worker should drain the queue.",
};

const DEFAULT_SCHEDULER_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function planItemsForRegion(
  region: CentralSchedulerRegion,
  agentIds: string[],
): CentralSchedulerPlanItem[] {
  const definitions =
    region === "eu"
      ? EU_SCAN_ITEMS
      : region === "us"
        ? US_SCAN_ITEMS
        : INTERNATIONAL_SCAN_ITEMS;
  return definitions.map((definition) => ({
    ...definition,
    region,
    agentIds,
    agentCount: agentIds.length,
  }));
}

function timestamp(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function findRecentDuplicateSchedulerJob(
  item: CentralSchedulerPlanItem,
  dedupeWindowMs: number,
  now = Date.now(),
) {
  if (dedupeWindowMs <= 0) {
    return null;
  }

  const jobs = await updateRepository.getScanJobs(100);
  return (
    jobs.find((job) => {
      if (job.status === "failed") {
        return false;
      }

      const scanProfile = job.resultSummary?.scanProfile;
      const schedulerPlanItemId = job.resultSummary?.schedulerPlanItemId;
      if (scanProfile !== item.scanProfile || schedulerPlanItemId !== item.id) {
        return false;
      }

      const createdAt = timestamp(job.createdAt);
      return createdAt !== null && now - createdAt <= dedupeWindowMs;
    }) ?? null
  );
}

export function buildCentralMonitoringSchedule(): CentralSchedulerPlan {
  const euAgentIds = listEuMonitoringAgents().map((agent) => agent.id);
  const usAgentIds = listUsMonitoringAgents().map((agent) => agent.id);
  const internationalAgentIds = internationalMonitoringSourceRegistry.map(
    (source) => source.sourceId,
  );

  return {
    ...scheduler,
    totalAgents: euAgentIds.length + usAgentIds.length + internationalAgentIds.length,
    euAgents: euAgentIds.length,
    usAgents: usAgentIds.length,
    internationalAgents: internationalAgentIds.length,
    items: [
      ...planItemsForRegion("eu", euAgentIds),
      ...planItemsForRegion("us", usAgentIds),
      ...planItemsForRegion("international", internationalAgentIds),
    ],
  };
}

export async function enqueueCentralMonitoringSchedule(options?: {
  trigger?: ScanTrigger;
  requestedBy?: string;
  regions?: CentralSchedulerRegion[];
  cadences?: Array<CentralSchedulerPlanItem["cadence"]>;
  dedupeWindowMs?: number;
}) {
  const selectedRegions = new Set(options?.regions ?? ["eu", "us", "international"]);
  const selectedCadences = options?.cadences ? new Set(options.cadences) : null;
  const trigger = options?.trigger ?? "scheduled";
  const requestedBy = options?.requestedBy ?? "central-monitoring-scheduler";
  const plan = buildCentralMonitoringSchedule();
  const dedupeWindowMs =
    options?.dedupeWindowMs ?? DEFAULT_SCHEDULER_DEDUPE_WINDOW_MS;
  const selectedItems = plan.items.filter(
    (item) =>
      selectedRegions.has(item.region) &&
      (!selectedCadences || selectedCadences.has(item.cadence)),
  );

  const queuedJobs = [];
  const skippedJobs: CentralSchedulerSkippedJob[] = [];
  for (const item of selectedItems) {
    const duplicate = await findRecentDuplicateSchedulerJob(item, dedupeWindowMs);
    if (duplicate) {
      skippedJobs.push({
        itemId: item.id,
        scanProfile: item.scanProfile,
        existingJobId: duplicate.id,
        reason: "recent_duplicate",
      });
      continue;
    }

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
    skippedJobs,
    skippedJobCount: skippedJobs.length,
  };
}
