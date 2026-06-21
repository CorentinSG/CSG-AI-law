import { NextResponse } from "next/server";
import { z } from "zod";

import {
  batchReviewTargetStatuses,
  batchTransitionReviewStatus,
  listPrioritizedReviewQueue,
} from "@/lib/admin-review-batch";
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

function isAuthorized(request: Request) {
  return hasAdminSessionCookieForRequest(request) || requestHasValidAdminAuth(request);
}

const postSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
  targetStatus: z.enum(batchReviewTargetStatuses),
  reviewer: z.string().trim().max(120).optional(),
});

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const queue = await listPrioritizedReviewQueue({ limit: Number.isFinite(limit) ? limit : 50 });

  return NextResponse.json(queue, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid batch review payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const result = await batchTransitionReviewStatus(parsed.data);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
