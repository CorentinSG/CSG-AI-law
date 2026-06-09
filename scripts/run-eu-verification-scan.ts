import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runEuLegalNewsAgentScan } from "@/agents/ai-regulation/euLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[eu-verification] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[eu-verification] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=eu_verification_scan`,
  );

  const result = await runEuLegalNewsAgentScan({
    profile: "eu_verification_scan",
    trigger: "scheduled_local_test",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[eu-verification] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
