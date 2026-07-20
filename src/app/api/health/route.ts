import { NextResponse } from "next/server";

import { getCronAuthStatus } from "@/lib/cron-auth";
import { buildHealthSnapshot, type HealthAccess } from "@/lib/health";

export async function GET(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  const access: HealthAccess = cronAuth.ok ? "authenticated" : "public";
  const snapshot = await buildHealthSnapshot({ access });

  // Dead-man switch: /api/health?check=worker returns 503 whenever the
  // Railway scan worker heartbeat is stale, so any external uptime monitor
  // (pinging hourly) can alert on a silent worker outage — the failure mode
  // that would otherwise degrade "live" monitoring to daily without notice.
  const workerCheck = new URL(request.url).searchParams.get("check") === "worker";
  const workerDown = workerCheck && !snapshot.worker.alive;

  return NextResponse.json(snapshot, {
    status: snapshot.ok && !workerDown ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
