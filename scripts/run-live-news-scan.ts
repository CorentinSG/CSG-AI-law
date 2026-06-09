import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runAiRegulationScan } from "@/agents/ai-regulation/processors/pipeline";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[live-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[live-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=live_news_discovery_scan`,
  );

  const result = await runAiRegulationScan(undefined, {
    trigger: "scheduled_local_test",
    scanProfile: "live_news_discovery_scan",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[live-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
