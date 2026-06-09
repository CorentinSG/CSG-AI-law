import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runSpainLegalNewsAgentScan } from "@/agents/ai-regulation/spainLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[spain-verification] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[spain-verification] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=spain_verification_scan`,
  );

  const result = await runSpainLegalNewsAgentScan({
    profile: "spain_verification_scan",
    trigger: "scheduled_local_test",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[spain-verification] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
