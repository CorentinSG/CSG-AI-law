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
    exclude: [...configDefaults.exclude, "e2e/**"],
    testTimeout: 10_000,
    hookTimeout: 10_000,
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
