import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runGermanyLegalNewsAgentScan } from "@/agents/ai-regulation/germanyLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[germany-verification] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[germany-verification] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=germany_verification_scan`,
  );

  const result = await runGermanyLegalNewsAgentScan({
    profile: "germany_verification_scan",
    trigger: "scheduled_local_test",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[germany-verification] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
