import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runBelgiumLegalNewsAgentScan } from "@/agents/ai-regulation/belgiumLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[belgium-legal-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[belgium-legal-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=belgium_live_news_scan`,
  );

  const result = await runBelgiumLegalNewsAgentScan({
    profile: "belgium_live_news_scan" as const,
    trigger: "scheduled_local_test" as const,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[belgium-legal-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
