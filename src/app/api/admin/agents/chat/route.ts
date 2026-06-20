import { NextResponse } from "next/server";

import {
  handleGlobalSupervisorChat,
  type GlobalSupervisorChatRequest,
} from "@/agents/ai-regulation/globalSupervisorChat";
import {
  hasAdminSessionCookieForRequest,
  requestHasValidAdminAuth,
} from "@/lib/admin-auth";
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
  if (!authorized) return unauthorized();

  const rateKey = request.headers.get("x-forwarded-for") ?? "local-admin";
  if (!(await checkUpstashRateLimit(`agent-chat:${rateKey}`, 20, 60_000))) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Wait 60 seconds before retrying.",
      },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  const body = (await request.json().catch(() => ({}))) as GlobalSupervisorChatRequest;
  const response = await handleGlobalSupervisorChat(body);

  return NextResponse.json(response);
}
