import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runAustriaLegalNewsAgentScan } from "@/agents/ai-regulation/austriaLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[austria-verification] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[austria-verification] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=austria_verification_scan`,
  );

  const result = await runAustriaLegalNewsAgentScan({
    profile: "austria_verification_scan" as const,
    trigger: "scheduled_local_test" as const,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[austria-verification] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
