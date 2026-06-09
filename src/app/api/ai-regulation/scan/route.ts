import { NextResponse } from "next/server";

import { getScanProfile } from "@/agents/ai-regulation/scanProfiles";
import { queueAndDrainScanJob } from "@/agents/ai-regulation/processors/scanJobs";
import {
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
} from "@/lib/admin-auth";
import { getRepositoryMode } from "@/db/repository";
import { checkUpstashRateLimit } from "@/lib/upstash-rate-limit";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export async function POST(request: Request) {
  const authorized =
    hasAdminSessionCookieForRequest(request) || requestHasValidAdminAuth(request);
  if (!authorized) {
    return unauthorized();
  }

  // checkUpstashRateLimit uses Upstash Redis when UPSTASH_REDIS_REST_URL and
  // UPSTASH_REDIS_REST_TOKEN are configured (F6), otherwise falls back to the
  // in-memory rate limiter (dev-safe, stateless on serverless cold starts).
  const rateKey = request.headers.get("x-forwarded-for") ?? "local-admin";
  if (!(await checkUpstashRateLimit(rateKey, 5, 60_000))) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Wait 60 seconds before retrying.",
        note: "This rate limit is in-memory and resets on serverless cold starts.",
      },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    sourceId?: string;
    scanProfile?: string;
  };
  const {
    queuedJob,
    processedJob,
    queuedJobProcessedImmediately,
    blockedByRunningJobs,
    blockingRunningJobSummaries,
    result,
  } =
    await queueAndDrainScanJob({
    sourceId: body.sourceId,
    trigger: "manual",
    requestedBy: "admin-api",
    scanProfile: getScanProfile(body.scanProfile)?.id ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    dataMode: getRepositoryMode(),
    job: processedJob,
    queuedJob,
    processedJob,
    queuedJobProcessedImmediately,
    blockedByRunningJobs,
    blockingRunningJobSummaries,
    result,
  });
}
