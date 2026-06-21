import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke-level e2e config. Boots the app in memory mode (no Supabase needed) and
 * provides the admin Basic-auth credentials so both public and admin routes are
 * reachable. The goal is regression protection against the build/runtime-error
 * class of bug (a Server Component crash that 500s a whole page), not pixel diff.
 */
const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

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
    httpCredentials: { username: "admin", password: "change-me" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      APP_DATA_MODE: "memory",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "change-me",
      ADMIN_AUTH_SECRET: "dev-secret-dev-secret-dev-secret-secret",
    },
  },
});
