import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runFranceLegalNewsAgentScan } from "@/agents/ai-regulation/franceLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[france-legal-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[france-legal-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=france_live_news_scan`,
  );

  const result = await runFranceLegalNewsAgentScan({
    profile: "france_live_news_scan",
    trigger: "scheduled_local_test",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[france-legal-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
