import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runNetherlandsLegalNewsAgentScan } from "@/agents/ai-regulation/netherlandsLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[netherlands-legal-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[netherlands-legal-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=netherlands_live_news_scan`,
  );

  const result = await runNetherlandsLegalNewsAgentScan({
    profile: "netherlands_live_news_scan",
    trigger: "scheduled_local_test",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[netherlands-legal-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
