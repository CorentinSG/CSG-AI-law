import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke-level e2e config. Boots the app in memory mode (no Supabase needed) and
 * provides the admin Basic-auth credentials so both public and admin routes are
 * reachable. The goal is regression protection against the build/runtime-error
 * class of bug (a Server Component crash that 500s a whole page), not pixel diff.
 */
const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

// CI runs against the production build (next start) so prod-only failures
// (static generation, revalidate invariants) are caught; local runs keep the
// fast dev-server loop. The production env guard rejects default admin
// credentials, so CI must provide non-default placeholders via env.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "change-me";
const ADMIN_AUTH_SECRET =
  process.env.ADMIN_AUTH_SECRET ?? "dev-secret-dev-secret-dev-secret-secret";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Generous: the heaviest admin route compiles cold in dev on first hit.
  timeout: 90_000,
  reporter: process.env.CI ? "line" : [["list"]],
  use: {
    baseURL,
    httpCredentials: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: process.env.CI
      ? `npx next start -p ${PORT}`
      : `npx next dev -p ${PORT}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      APP_DATA_MODE: "memory",
      ALLOW_MEMORY_MODE_IN_PRODUCTION: "true",
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      ADMIN_AUTH_SECRET,
    },
  },
});
