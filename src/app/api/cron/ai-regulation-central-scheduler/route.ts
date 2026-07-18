import { NextResponse } from "next/server";

import {
  enqueueCentralMonitoringSchedule,
  type CentralSchedulerRegion,
} from "@/agents/ai-regulation/scheduler";
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

function parseRegions(value: string | null): CentralSchedulerRegion[] | undefined {
  if (!value) return undefined;
  const regions = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is CentralSchedulerRegion =>
      entry === "eu" || entry === "us" || entry === "international",
    );
  return regions.length > 0 ? regions : undefined;
}

function parseCadences(value: string | null) {
  if (!value) return undefined;
  const cadences = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is "daily" | "hourly" | "live" =>
      entry === "daily" || entry === "hourly" || entry === "live",
    );
  return cadences.length > 0 ? cadences : undefined;
}

async function handleCentralScheduler(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  if (!cronAuth.ok) {
    if (cronAuth.reason === "missing_cron_secret") {
      return misconfigured(cronAuth.reason);
    }
    return unauthorized(cronAuth.reason);
  }

  const url = new URL(request.url);
  const result = await enqueueCentralMonitoringSchedule({
    trigger: "scheduled",
    requestedBy: "central-monitoring-scheduler",
    regions: parseRegions(url.searchParams.get("regions")),
    cadences: parseCadences(url.searchParams.get("cadences")),
  });

  return NextResponse.json({
    ok: true,
    trigger: "scheduled",
    dataMode: getRepositoryMode(),
    aiEnabled: env.AI_ENABLE_PROCESSING,
    plan: result.plan,
    queuedJobCount: result.queuedJobCount,
    skippedJobCount: result.skippedJobCount,
    queuedJobs: result.queuedJobs,
    skippedJobs: result.skippedJobs,
  });
}

export async function GET(request: Request) {
  return handleCentralScheduler(request);
}

export async function POST(request: Request) {
  return handleCentralScheduler(request);
}
