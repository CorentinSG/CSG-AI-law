import { NextResponse } from "next/server";

import {
  franceAgentProfileIds,
  getFranceSchedulerGuidance,
  type FranceAgentProfileId,
} from "@/agents/ai-regulation/franceNewsSources";
import { queueAndDrainScanJob } from "@/agents/ai-regulation/processors/scanJobs";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";
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

function getFranceScanProfile(profileValue: string | null): FranceAgentProfileId {
  if (profileValue && (franceAgentProfileIds as readonly string[]).includes(profileValue)) {
    return profileValue as FranceAgentProfileId;
  }
  return "france_official_legal_scan";
}

async function handleScheduledFranceScan(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  if (!cronAuth.ok) {
    if (cronAuth.reason === "missing_cron_secret") {
      return misconfigured(cronAuth.reason);
    }
    return unauthorized(cronAuth.reason);
  }

  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId") ?? undefined;
  const scanProfile = getFranceScanProfile(url.searchParams.get("profile"));
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
    requestedBy: "vercel-cron-france",
    scanProfile,
  });

  return NextResponse.json({
    ok: true,
    trigger: "scheduled",
    regionScope: "France",
    scanProfile,
    dataMode: getRepositoryMode(),
    aiEnabled: env.AI_ENABLE_PROCESSING,
    schedulerGuidance: getFranceSchedulerGuidance(),
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
  return handleScheduledFranceScan(request);
}

export async function POST(request: Request) {
  return handleScheduledFranceScan(request);
}
