import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Installed AI design-skill bundles (reinstallable, not project source).
    ".claude/skills/**",
    ".agents/**",
    ".github/skills/**",
    ".impeccable/**",
    // Standalone tool sub-projects ship their own lint config and tooling.
    "tools/**",
  ]),
]);

export default eslintConfig;
