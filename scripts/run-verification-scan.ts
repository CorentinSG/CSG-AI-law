import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runAiRegulationScan } from "@/agents/ai-regulation/processors/pipeline";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[verification] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[verification] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=verification_scan`,
  );

  const result = await runAiRegulationScan(undefined, {
    trigger: "scheduled_local_test",
    scanProfile: "verification_scan",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[verification] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
