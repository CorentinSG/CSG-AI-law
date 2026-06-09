import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { runNetherlandsLegalNewsAgentScan } from "@/agents/ai-regulation/netherlandsLegalNewsAgent";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

async function main() {
  console.log(`[netherlands-official-legal] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[netherlands-official-legal] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} profile=netherlands_official_legal_scan`,
  );

  const result = await runNetherlandsLegalNewsAgentScan({
    profile: "netherlands_official_legal_scan" as const,
    trigger: "scheduled_local_test" as const,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    `[netherlands-official-legal] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
