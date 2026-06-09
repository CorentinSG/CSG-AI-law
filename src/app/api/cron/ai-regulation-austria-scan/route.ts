import { NextResponse } from "next/server";

import {
  austriaAgentProfileIds,
  getAustriaSchedulerGuidance,
  type AustriaAgentProfileId,
} from "@/agents/ai-regulation/austriaNewsSources";
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

function getAustriaScanProfile(profileValue: string | null): AustriaAgentProfileId {
  if (profileValue && (austriaAgentProfileIds as readonly string[]).includes(profileValue)) {
    return profileValue as AustriaAgentProfileId;
  }
  return "austria_official_legal_scan";
}

async function handleScheduledAustriaScan(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  if (!cronAuth.ok) {
    if (cronAuth.reason === "missing_cron_secret") {
      return misconfigured(cronAuth.reason);
    }
    return unauthorized(cronAuth.reason);
  }

  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId") ?? undefined;
  const scanProfile = getAustriaScanProfile(url.searchParams.get("profile"));
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
    requestedBy: "vercel-cron-austria",
    scanProfile,
  });

  return NextResponse.json({
    ok: true,
    trigger: "scheduled",
    regionScope: "Austria",
    scanProfile,
    dataMode: getRepositoryMode(),
    aiEnabled: env.AI_ENABLE_PROCESSING,
    schedulerGuidance: getAustriaSchedulerGuidance(),
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
  return handleScheduledAustriaScan(request);
}

export async function POST(request: Request) {
  return handleScheduledAustriaScan(request);
}
