import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  harnessRegressionCaseSchema,
  runHarnessRegressionCase,
} from "@/agents/harness/regression";

const regressionsDir = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "regressions",
  "fixtures",
);

const regressionFixtureFiles = readdirSync(regressionsDir).filter((entry) =>
  entry.endsWith(".json"),
);

describe("harness regression fixtures", () => {
  for (const fixtureFile of regressionFixtureFiles) {
    it(`replays fixture ${fixtureFile}`, async () => {
      const regressionCase = harnessRegressionCaseSchema.parse(
        JSON.parse(readFileSync(join(regressionsDir, fixtureFile), "utf8")),
      );

      const result = await runHarnessRegressionCase(regressionCase);

      expect(result.passed).toBe(true);
    });
  }
});
