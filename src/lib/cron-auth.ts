import { env } from "@/lib/env";

export function getCronAuthStatus(request: Request) {
  if (!env.CRON_SECRET) {
    return {
      ok: false,
      reason: "missing_cron_secret" as const,
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return {
      ok: false,
      reason: "missing_authorization_header" as const,
    };
  }

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return {
      ok: false,
      reason: "invalid_cron_secret" as const,
    };
  }

  return {
    ok: true,
    reason: "authorized" as const,
  };
}
