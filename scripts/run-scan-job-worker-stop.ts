import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import {
  createScanWorkerConfig,
  requestScanWorkerStop,
} from "@/agents/ai-regulation/processors/scanWorkerRuntime";

async function main() {
  const config = createScanWorkerConfig(process.env);
  await requestScanWorkerStop(config);
  console.log(
    `[scan-worker] stop request written for workerId=${config.workerId} at ${config.stopFilePath}`,
  );
}

main().catch((error) => {
  console.error(
    `[scan-worker] stop request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
