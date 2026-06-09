import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { drainQueuedScanJobs } from "@/agents/ai-regulation/processors/scanJobs";
import { getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function main() {
  const maxJobs = parsePositiveInt(process.env.SCAN_DRAIN_MAX_JOBS, 5);
  const continueOnError = process.env.SCAN_DRAIN_CONTINUE_ON_ERROR === "true";

  console.log(`[scan-drain] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[scan-drain] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} maxJobs=${maxJobs} continueOnError=${continueOnError}`,
  );

  const summary = await drainQueuedScanJobs({
    maxJobs,
    continueOnError,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        dataMode: getRepositoryMode(),
        aiEnabled: env.AI_ENABLE_PROCESSING,
        summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    `[scan-drain] failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
