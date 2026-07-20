import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // Playwright e2e specs live in `e2e/` and must not be run by Vitest.
    // Git worktrees (bi-agent workflow) carry full repo copies whose tests
    // must never be collected from the main checkout.
    exclude: [
      ...configDefaults.exclude,
      "e2e/**",
      "**/e2e/**",
      "**/.worktrees/**",
      "**/.claude/worktrees/**",
    ],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
});
