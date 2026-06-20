import { NextResponse } from "next/server";

import { buildAdminOperationsSummary } from "@/lib/admin-operations-summary";
import {
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
} from "@/lib/admin-auth";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export async function GET(request: Request) {
  const authorized =
    hasAdminSessionCookieForRequest(request) || requestHasValidAdminAuth(request);
  if (!authorized) return unauthorized();

  const summary = await buildAdminOperationsSummary();
  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
