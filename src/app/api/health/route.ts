import { NextResponse } from "next/server";

import { getCronAuthStatus } from "@/lib/cron-auth";
import { buildHealthSnapshot, isMonitoringStale, type HealthAccess } from "@/lib/health";

export async function GET(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  const access: HealthAccess = cronAuth.ok ? "authenticated" : "public";
  const snapshot = await buildHealthSnapshot({ access });
  // `check=worker` is the dead-man switch. It asks whether monitoring has run
  // recently enough, not whether a worker happens to be alive this second — the
  // monitor is a batch job that is legitimately absent between runs, so a
  // heartbeat test here reported 503 almost continuously.
  const workerCheckFailed =
    new URL(request.url).searchParams.get("check") === "worker" &&
    isMonitoringStale(snapshot);
  const ok = snapshot.ok && !workerCheckFailed;

  return NextResponse.json(
    { ...snapshot, ok },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
