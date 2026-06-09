import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runIrelandLegalNewsAgentScan } from "@/agents/ai-regulation/irelandLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[ireland-legal-news] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[ireland-legal-news] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=ireland_live_news_scan`,
  );

  const result = await runIrelandLegalNewsAgentScan({
    profile: "ireland_live_news_scan" as const,
    trigger: "scheduled_local_test" as const,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[ireland-legal-news] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
