import { listEuMonitoringAgents } from "@/agents/ai-regulation/euMonitoringSupervisorAgent";
import { queueScanJob } from "@/agents/ai-regulation/processors/scanJobs";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { internationalMonitoringSourceRegistry } from "@/agents/ai-regulation/internationalNewsSources";
import { listUsMonitoringAgents } from "@/agents/ai-regulation/usMonitoringSupervisorAgent";

export type CentralSchedulerRegion = "eu" | "us" | "international" | "country";

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

export type CentralSchedulerSkippedJob =
  | {
      itemId: string;
      scanProfile: ScanProfileId;
      existingJobId: string;
      reason: "recent_duplicate";
    }
  | {
      itemId: string;
      scanProfile: ScanProfileId;
      reason: "staggered_country_wave";
    };

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

// Countries that own a dedicated source registry, monitoring agent, and scan
// profiles. Their `<country>_official_legal_scan` lane already runs daily from
// the per-country cron entries in `vercel.json`, so only the two lanes nothing
// else executes are scheduled here.
const COUNTRY_SCAN_SLUGS = [
  "austria",
  "belgium",
  "france",
  "germany",
  "ireland",
  "italy",
  "netherlands",
  "spain",
  "sweden",
] as const;

type CountryScanSlug = (typeof COUNTRY_SCAN_SLUGS)[number];

const COUNTRY_SCAN_TIERS = [
  {
    key: "live-news",
    profileSuffix: "live_news_scan",
    label: "live legal-news sweep",
    cadence: "live",
  },
  {
    key: "verification",
    profileSuffix: "verification_scan",
    label: "recurring verification sweep",
    cadence: "hourly",
  },
] as const;

// Compile-time proof that every generated id is a declared scan profile:
// this alias must stay assignable to `ScanProfileId`.
type CountryScanProfileId =
  `${CountryScanSlug}_${(typeof COUNTRY_SCAN_TIERS)[number]["profileSuffix"]}`;

const COUNTRY_SCAN_ITEMS: CentralSchedulerPlanItem[] = COUNTRY_SCAN_SLUGS.flatMap((slug) =>
  COUNTRY_SCAN_TIERS.map((tier) => {
    const scanProfile: CountryScanProfileId = `${slug}_${tier.profileSuffix}`;
    return {
      id: `${slug}-${tier.key}`,
      region: "country" as const,
      label: `${slug.charAt(0).toUpperCase()}${slug.slice(1)} ${tier.label}`,
      scanProfile,
      cadence: tier.cadence,
      agentIds: [slug],
      agentCount: 1,
    };
  }),
);

export const scheduler = {
  recommendedCron: "*/15 * * * *",
  description:
    "Central scheduler for the AI Regulation Monitor. It queues regional profile sweeps covering all EU and US monitoring agents, plus staggered per-country live-news and verification lanes; a permanent worker should drain the queue.",
};

const DEFAULT_SCHEDULER_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

// Per-country lanes are staggered instead of fanned out: one cycle activates
// exactly one country, rotating deterministically off the wall clock so that a
// fresh process (GitHub Actions spawns one per run) picks the same country as
// any other scheduler invocation in the same window. With nine countries on a
// 15-minute rotation each country's lanes run roughly every 2h15.
const COUNTRY_STAGGER_WINDOW_MS = 15 * 60 * 1000;

function activeCountryScanItemIds(now: number) {
  // The day offset keeps a once-a-day caller (the vercel.json central-scheduler
  // cron) from aliasing: 96 fifteen-minute windows per day is a multiple of 3,
  // so without it a daily cron would only ever reach three of the nine
  // countries. 96 + 1 is coprime with 9, and inside a day the offset is
  // constant, so the 15-minute rotation stays exactly one country per cycle.
  const index =
    (Math.floor(now / COUNTRY_STAGGER_WINDOW_MS) + Math.floor(now / 86_400_000)) %
    COUNTRY_SCAN_SLUGS.length;
  const slug = COUNTRY_SCAN_SLUGS[index];
  return new Set(COUNTRY_SCAN_TIERS.map((tier) => `${slug}-${tier.key}`));
}

function planItemsForRegion(
  region: Exclude<CentralSchedulerRegion, "country">,
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

function findRecentDuplicateSchedulerJob(
  jobs: Awaited<ReturnType<typeof updateRepository.getScanJobs>>,
  item: CentralSchedulerPlanItem,
  dedupeWindowMs: number,
  now: number,
) {
  if (dedupeWindowMs <= 0) {
    return null;
  }

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
      ...COUNTRY_SCAN_ITEMS,
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
  const selectedRegions = new Set(
    options?.regions ?? ["eu", "us", "international", "country"],
  );
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

  const now = Date.now();
  const activeCountryItemIds = activeCountryScanItemIds(now);
  // A row window could miss a duplicate created seconds ago once enqueue volume
  // pushed it past the newest N rows. Ask for the dedupe window by time instead.
  const recentJobs =
    dedupeWindowMs > 0
      ? await updateRepository.getScanJobsCreatedSince(
          new Date(now - dedupeWindowMs).toISOString(),
        )
      : [];

  const queuedJobs = [];
  const skippedJobs: CentralSchedulerSkippedJob[] = [];
  for (const item of selectedItems) {
    if (item.region === "country" && !activeCountryItemIds.has(item.id)) {
      skippedJobs.push({
        itemId: item.id,
        scanProfile: item.scanProfile,
        reason: "staggered_country_wave",
      });
      continue;
    }

    const duplicate = findRecentDuplicateSchedulerJob(
      recentJobs,
      item,
      dedupeWindowMs,
      now,
    );
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
