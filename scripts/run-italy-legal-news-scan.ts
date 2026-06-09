import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runItalyLegalNewsAgentScan } from "@/agents/ai-regulation/italyLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[italy-legal-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[italy-legal-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=italy_live_news_scan`,
  );

  const result = await runItalyLegalNewsAgentScan({
    profile: "italy_live_news_scan",
    trigger: "scheduled_local_test",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[italy-legal-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
