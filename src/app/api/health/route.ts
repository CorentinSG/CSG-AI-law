import { NextResponse } from "next/server";

import { buildHealthResponse } from "@/lib/health";
import { getCronAuthStatus } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

function hasAuthorizationHeader(request: Request) {
  return Boolean(request.headers.get("authorization"));
}

export async function GET(request: Request) {
  if (hasAuthorizationHeader(request)) {
    const auth = getCronAuthStatus(request);
    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          reason: auth.reason,
        },
        { status: auth.reason === "missing_cron_secret" ? 500 : 401 },
      );
    }

    const health = await buildHealthResponse({ visibility: "private" });
    return NextResponse.json(health, { status: health.ok ? 200 : 503 });
  }

  const health = await buildHealthResponse({ visibility: "public" });
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
