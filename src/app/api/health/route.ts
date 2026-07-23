import { NextResponse } from "next/server";

import { getCronAuthStatus } from "@/lib/cron-auth";
import { buildHealthSnapshot, type HealthAccess } from "@/lib/health";

export async function GET(request: Request) {
  const cronAuth = getCronAuthStatus(request);
  const access: HealthAccess = cronAuth.ok ? "authenticated" : "public";
  const snapshot = await buildHealthSnapshot({ access });
  const workerCheckFailed =
    new URL(request.url).searchParams.get("check") === "worker" &&
    !snapshot.worker.heartbeatFresh;
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
