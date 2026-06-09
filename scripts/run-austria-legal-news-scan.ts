import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runAustriaLegalNewsAgentScan } from "@/agents/ai-regulation/austriaLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[austria-legal-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[austria-legal-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=austria_live_news_scan`,
  );

  const result = await runAustriaLegalNewsAgentScan({
    profile: "austria_live_news_scan" as const,
    trigger: "scheduled_local_test" as const,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[austria-legal-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
