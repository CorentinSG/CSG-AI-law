// In-memory rate limiter.
//
// SERVERLESS LIMITATION: This Map resets on every Vercel cold start.
// Each function instance has its own Map, so there is no shared state
// across concurrent invocations. This provides meaningful protection
// only in local dev or single-process environments.
//
// For production serverless use, replace with Upstash Redis.
// TODO (Phase F6): distributed rate limiter.
// The primary guard on the scan API is the admin auth check, not this.

const requestBuckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (requestBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (recent.length >= limit) {
    requestBuckets.set(key, recent);
    return false;
  }

  recent.push(now);
  requestBuckets.set(key, recent);
  return true;
}
