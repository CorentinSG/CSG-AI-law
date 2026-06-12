import { NextResponse } from "next/server";

import {
  germanyAgentProfileIds,
  getGermanySchedulerGuidance,
  type GermanyAgentProfileId,
} from "@/agents/ai-regulation/germanyNewsSources";
import { queueAndDrainScanJob } from "@/agents/ai-regulation/processors/scanJobs";
import { getRepositoryMode } from "@/db/repository";
import { env, isScanJobRouteEnqueueOnlyEnabled } from "@/lib/env";
import { getCronAuthStatus } from "@/lib/cron-auth";

function unauthorized(reason: string) {
  return NextResponse.json(
    {
      ok: false,
      error: "Unauthorized",
      reason,
    },
    { status: 401 },
  );
}

function misconfigured(reason: string) {
  return NextResponse.json(
    {
      ok: false,
      error: "Cron route misconfigured",
      reason,
    },
    { status: 500 },
  );
}

function getGermanyScanProfile(profileValue: string | null): GermanyAgentProfileId {
  if (profileValue && (germanyAgentProfileIds as readonly string[]).includes(profileValue)) {
    return profileValue as GermanyAgentProfileId;
  }
  return "germany_official_legal_scan";
}

async function handleScheduledGermanyScan(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  if (!cronAuth.ok) {
    if (cronAuth.reason === "missing_cron_secret") {
      return misconfigured(cronAuth.reason);
    }
    return unauthorized(cronAuth.reason);
  }

  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId") ?? undefined;
  const scanProfile = getGermanyScanProfile(url.searchParams.get("profile"));
  const {
    queuedJob,
    processedJob,
    queuedJobProcessedImmediately,
    blockedByRunningJobs,
    blockingRunningJobSummaries,
    result,
  } =
    await queueAndDrainScanJob({
      sourceId,
      trigger: "scheduled",
      requestedBy: "vercel-cron-germany",
      scanProfile,
      executionMode: isScanJobRouteEnqueueOnlyEnabled()
        ? "enqueue_only"
        : "drain",
    });

  return NextResponse.json({
    ok: true,
    trigger: "scheduled",
    regionScope: "Germany",
    scanProfile,
    dataMode: getRepositoryMode(),
    aiEnabled: env.AI_ENABLE_PROCESSING,
    schedulerGuidance: getGermanySchedulerGuidance(),
    job: processedJob,
    queuedJob,
    processedJob,
    queuedJobProcessedImmediately,
    blockedByRunningJobs,
    blockingRunningJobSummaries,
    result,
  });
}

export async function GET(request: Request) {
  return handleScheduledGermanyScan(request);
}

export async function POST(request: Request) {
  return handleScheduledGermanyScan(request);
}
