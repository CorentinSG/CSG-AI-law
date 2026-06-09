import { loadScriptEnv } from "../src/lib/load-script-env";

loadScriptEnv();

async function main() {
  const { getRepositoryMode } = await import("../src/db/repository");
  const { runAiRegulationScan } = await import(
    "../src/agents/ai-regulation/processors/pipeline"
  );
  const { env } = await import("../src/lib/env");

  console.log(`[scan] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[scan] AI_ENABLE_PROCESSING=${env.AI_ENABLE_PROCESSING} budget_usd=${env.AI_MONTHLY_BUDGET_USD} max_items_per_scan=${env.AI_MAX_ITEMS_PER_SCAN} max_input_tokens=${env.AI_MAX_INPUT_TOKENS_PER_ITEM}`,
  );
  console.log(
    `[scan] target=${
      getRepositoryMode() === "supabase"
        ? new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").host
        : "in-memory repository"
    }`,
  );

  const result = await runAiRegulationScan();
  for (const entry of result) {
    console.log(
      `[scan] source=${entry.sourceId} status=${entry.status} fetched=${entry.itemsFound} new=${entry.newItemsDetected} filtered=${entry.itemsFilteredOut} duplicates=${entry.duplicatesDetected} ai_pending=${entry.aiPendingCount ?? 0} ai_skipped=${entry.aiSkippedCount ?? 0} ai_estimated_cost_usd=${entry.aiEstimatedCostUsd ?? 0} failures=${entry.processingFailures} warnings=${entry.warnings.length} errors=${entry.errors.length} duration_ms=${entry.durationMs}`,
    );
    if (entry.responseStatus !== null) {
      console.log(`[scan] response_status: ${entry.responseStatus}`);
    }
    if (entry.zeroResultsReason) {
      console.log(`[scan] zero_results_reason: ${entry.zeroResultsReason}`);
    }
    for (const warning of entry.warnings) {
      console.log(`[scan] warning: ${warning}`);
    }
    for (const error of entry.errors) {
      console.log(`[scan] error: ${error}`);
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
