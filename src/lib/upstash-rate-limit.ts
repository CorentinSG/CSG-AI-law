/**
 * Upstash Redis rate limiter (F6 roadmap).
 *
 * SETUP: To enable distributed rate limiting across Vercel serverless
 * function instances, install and configure:
 *
 *   npm install @upstash/redis @upstash/ratelimit
 *
 * Then set in your environment:
 *   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=your-token
 *
 * This module exports a `checkUpstashRateLimit` function that mirrors the
 * `checkRateLimit` API from rate-limit.ts. When UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured, rate limit state persists across
 * all serverless invocations, solving the cold-start reset problem.
 *
 * Usage in scan route:
 *   import { checkUpstashRateLimit } from "@/lib/upstash-rate-limit";
 *   const allowed = await checkUpstashRateLimit(rateKey, 5, 60_000);
 *
 * The rate-limit.ts module falls back to in-memory when Upstash is not
 * configured, so switching is gradual and non-breaking.
 */

// ---------------------------------------------------------------------------
// Upstash availability check
// ---------------------------------------------------------------------------

function isUpstashConfigured(): boolean {
  return (
    typeof process.env.UPSTASH_REDIS_REST_URL === "string" &&
    process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
    typeof process.env.UPSTASH_REDIS_REST_TOKEN === "string" &&
    process.env.UPSTASH_REDIS_REST_TOKEN.length > 0
  );
}

// ---------------------------------------------------------------------------
// Upstash sliding-window rate limit implementation
//
// Uses Upstash's REST API directly so we do NOT require the npm package to be
// installed before production is ready. Once you install @upstash/ratelimit,
// replace this with the official SDK for typed safety and better ergonomics.
// ---------------------------------------------------------------------------

async function upstashSlidingWindow(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const windowSec = Math.ceil(windowMs / 1000);
  const now = Date.now();
  const windowKey = `rate:${key}:${Math.floor(now / windowMs)}`;

  try {
    // INCR then EXPIRE via pipeline (two-command REST pipeline)
    const pipeline = [
      ["INCR", windowKey],
      ["EXPIRE", windowKey, String(windowSec)],
    ];

    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      // Upstash unavailable — fail open (allow request) to avoid false blocking
      console.warn("[rate-limit] Upstash unavailable, failing open.");
      return true;
    }

    const results = (await response.json()) as Array<{ result: number }>;
    const count = results[0]?.result ?? 0;
    return count <= limit;
  } catch {
    // Network error — fail open
    console.warn("[rate-limit] Upstash request failed, failing open.");
    return true;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rate limit check using Upstash Redis if configured, otherwise falls back
 * to the in-memory implementation.
 *
 * Returns true if the request is within the allowed window.
 */
export async function checkUpstashRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<boolean> {
  if (!isUpstashConfigured()) {
    // Fall back to synchronous in-memory limiter
    const { checkRateLimit } = await import("@/lib/rate-limit");
    return checkRateLimit(key, limit, windowMs);
  }

  return upstashSlidingWindow(key, limit, windowMs);
}
