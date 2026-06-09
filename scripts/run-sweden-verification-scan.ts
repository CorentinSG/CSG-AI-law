import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runSwedenLegalNewsAgentScan } from "@/agents/ai-regulation/swedenLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[sweden-verification] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[sweden-verification] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=sweden_verification_scan`,
  );

  const result = await runSwedenLegalNewsAgentScan({
    profile: "sweden_verification_scan" as const,
    trigger: "scheduled_local_test" as const,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[sweden-verification] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
