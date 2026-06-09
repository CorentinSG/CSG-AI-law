import { loadScriptEnv } from "../src/lib/load-script-env";

loadScriptEnv();

async function main() {
  const { getRepositoryMode } = await import("../src/db/repository");
  const { runAiRegulationScan } = await import(
    "../src/agents/ai-regulation/processors/pipeline"
  );
  const {
    buildAiSmokeTestConfigSummary,
    runExistingDraftAiSmokeTest,
    summarizeAiLogsSince,
  } = await import("../src/agents/ai-regulation/processors/aiSmokeTest");
  const { updateRepository } = await import(
    "../src/agents/ai-regulation/processors/updateRepository"
  );
  const { env } = await import("../src/lib/env");

  const config = buildAiSmokeTestConfigSummary();
  console.log(`[ai-smoke] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[ai-smoke] AI enabled=${config.aiEnabled} guardrails=${config.costGuardrailsEnabled} max_items_per_scan=${config.maxItemsPerScan} max_input_tokens=${config.maxInputTokensPerItem} monthly_budget_usd=${config.monthlyBudgetUsd}`,
  );
  console.log(
    `[ai-smoke] target=${
      getRepositoryMode() === "supabase"
        ? new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").host
        : "in-memory repository"
    }`,
  );
  console.log(
    `[ai-smoke] models relevance=${config.models.relevance} classification=${config.models.classification} summary=${config.models.summary} deep_analysis=${config.models.deepAnalysis} api_key_present=${config.hasApiKey}`,
  );

  const startedAt = new Date().toISOString();
  const scanResults = await runAiRegulationScan();
  const processingLogs = await updateRepository.getProcessingLogs(2500);
  const scanSummary = summarizeAiLogsSince(processingLogs, startedAt);

  console.log(
    `[ai-smoke] sample scan summary eligible=${scanSummary.eligibleItems} processed=${scanSummary.processedItems} skipped=${scanSummary.skippedItems} live_call=${scanSummary.openAiCallMade}`,
  );

  for (const entry of scanResults) {
    console.log(
      `[ai-smoke] source=${entry.sourceId} status=${entry.status} fetched=${entry.itemsFound} new=${entry.newItemsDetected} filtered=${entry.itemsFilteredOut} duplicates=${entry.duplicatesDetected} ai_pending=${entry.aiPendingCount ?? 0} ai_skipped=${entry.aiSkippedCount ?? 0} ai_estimated_cost_usd=${entry.aiEstimatedCostUsd ?? 0}`,
    );
  }

  if (scanSummary.skipReasons.length > 0) {
    for (const reason of scanSummary.skipReasons) {
      console.log(`[ai-smoke] scan skip reason: ${reason}`);
    }
  }

  let fallbackSummary = null;
  if (config.aiEnabled && scanSummary.processedItems === 0) {
    console.log(
      "[ai-smoke] no new live AI processing occurred during the sample scan; attempting one existing unpublished needs_review draft fallback.",
    );
    fallbackSummary = await runExistingDraftAiSmokeTest();
    console.log(
      `[ai-smoke] fallback mode=${fallbackSummary.mode} eligible=${fallbackSummary.eligibleItems} processed=${fallbackSummary.processedItems} skipped=${fallbackSummary.skippedItems} est_cost_usd=${fallbackSummary.estimatedCostUsd} live_call=${fallbackSummary.openAiCallMade}`,
    );
    console.log(`[ai-smoke] fallback message: ${fallbackSummary.message}`);
    if (fallbackSummary.skipReasons.length > 0) {
      for (const reason of fallbackSummary.skipReasons) {
        console.log(`[ai-smoke] fallback skip reason: ${reason}`);
      }
    }
    if (fallbackSummary.processedUpdateId) {
      console.log(
        `[ai-smoke] fallback target update=${fallbackSummary.processedUpdateId} raw_item=${fallbackSummary.processedRawItemId} title=${fallbackSummary.processedTitle ?? ""} status_after=${fallbackSummary.statusAfterProcessing ?? ""} model=${fallbackSummary.modelUsed ?? "n/a"}`,
      );
    }
  }

  const finalSummary = {
    config,
    scanSummary,
    fallbackSummary,
    openAiCallMade:
      scanSummary.openAiCallMade || Boolean(fallbackSummary?.openAiCallMade),
    publicVisibilityReminder:
      "AI smoke test results remain private until an admin manually approves and publishes them.",
  };

  console.log(JSON.stringify(finalSummary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
