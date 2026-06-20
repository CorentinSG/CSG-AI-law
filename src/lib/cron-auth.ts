import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

function safeBearerEquals(actual: string, expectedSecret: string) {
  const expected = `Bearer ${expectedSecret}`;
  try {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}

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

  if (!safeBearerEquals(authHeader, env.CRON_SECRET)) {
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
