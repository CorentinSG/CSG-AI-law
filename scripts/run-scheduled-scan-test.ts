import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runAiRegulationScan } from "@/agents/ai-regulation/processors/pipeline";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[scheduled-test] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[scheduled-test] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} budget_usd=${env.AI_MONTHLY_BUDGET_USD} max_items_per_scan=${env.AI_MAX_ITEMS_PER_SCAN}`,
  );

  const result = await runAiRegulationScan(undefined, {
    trigger: "scheduled_local_test",
    scanProfile: "official_baseline_scan",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        trigger: "scheduled_local_test",
        scanProfile: "official_baseline_scan",
        dataMode: getRepositoryMode(),
        aiEnabled: env.AI_ENABLE_PROCESSING,
        result,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    `[scheduled-test] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
