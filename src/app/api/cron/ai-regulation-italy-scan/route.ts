import { NextResponse } from "next/server";

import {
  getItalySchedulerGuidance,
  italyAgentProfileIds,
  type ItalyAgentProfileId,
} from "@/agents/ai-regulation/italyNewsSources";
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

function getItalyScanProfile(profileValue: string | null): ItalyAgentProfileId {
  if (profileValue && (italyAgentProfileIds as readonly string[]).includes(profileValue)) {
    return profileValue as ItalyAgentProfileId;
  }
  return "italy_official_legal_scan";
}

async function handleScheduledItalyScan(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  if (!cronAuth.ok) {
    if (cronAuth.reason === "missing_cron_secret") {
      return misconfigured(cronAuth.reason);
    }
    return unauthorized(cronAuth.reason);
  }

  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId") ?? undefined;
  const scanProfile = getItalyScanProfile(url.searchParams.get("profile"));
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
      requestedBy: "vercel-cron-italy",
      scanProfile,
      executionMode: isScanJobRouteEnqueueOnlyEnabled()
        ? "enqueue_only"
        : "drain",
    });

  return NextResponse.json({
    ok: true,
    trigger: "scheduled",
    regionScope: "Italy",
    scanProfile,
    dataMode: getRepositoryMode(),
    aiEnabled: env.AI_ENABLE_PROCESSING,
    schedulerGuidance: getItalySchedulerGuidance(),
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
  return handleScheduledItalyScan(request);
}

export async function POST(request: Request) {
  return handleScheduledItalyScan(request);
}
