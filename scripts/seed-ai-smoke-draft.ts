import { loadScriptEnv } from "../src/lib/load-script-env";
import type { SupabaseClient } from "@supabase/supabase-js";

loadScriptEnv();

function getHostOnly(url: string | undefined) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

async function upsertAndLog(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  console.log(`[seed-ai-smoke] upserting table=${table} rows=${rows.length}`);
  const { data, error } = await client
    .from(table)
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) {
    throw new Error(
      [
        `Failed seeding ${table}`,
        `message=${error.message ?? "unknown"}`,
        `details=${error.details ?? "none"}`,
        `hint=${error.hint ?? "none"}`,
        `code=${error.code ?? "none"}`,
      ].join(" | "),
    );
  }

  console.log(
    `[seed-ai-smoke] ${table}: upserted ${data?.length ?? rows.length} rows`,
  );
}

async function main() {
  const { assertSupabaseConfigured, getRepositoryMode } = await import(
    "../src/db/repository"
  );
  const { getSupabaseAdminClient } = await import("../src/lib/supabase");
  const { env } = await import("../src/lib/env");
  const {
    processingLogToInsert,
    rawItemToInsert,
    updateToInsert,
  } = await import("../src/db/supabase-mappers");
  const {
    aiSmokeTestRawItemSeed,
    aiSmokeTestUpdateSeed,
  } = await import("../src/db/seed/ai-smoke-draft");

  assertSupabaseConfigured();
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client could not be created.");
  }

  console.log("[seed-ai-smoke] starting smoke-test draft seed");
  console.log(`[seed-ai-smoke] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[seed-ai-smoke] supabase-host=${getHostOnly(env.NEXT_PUBLIC_SUPABASE_URL)}`,
  );

  await upsertAndLog(client, "raw_regulatory_items", [
    rawItemToInsert(aiSmokeTestRawItemSeed),
  ]);
  await upsertAndLog(client, "ai_regulatory_updates", [
    updateToInsert(aiSmokeTestUpdateSeed),
  ]);

  console.log(
    `[seed-ai-smoke] clearing prior processing logs for raw_item_id=${aiSmokeTestRawItemSeed.id}`,
  );
  const { error: deleteError } = await client
    .from("ai_processing_logs")
    .delete()
    .eq("raw_item_id", aiSmokeTestRawItemSeed.id);

  if (deleteError) {
    throw new Error(
      [
        "Failed clearing prior smoke-test ai_processing_logs",
        `message=${deleteError.message ?? "unknown"}`,
        `details=${deleteError.details ?? "none"}`,
        `hint=${deleteError.hint ?? "none"}`,
        `code=${deleteError.code ?? "none"}`,
      ].join(" | "),
    );
  }

  const {
    data: resetLogData,
    error: resetLogError,
  } = await client
    .from("ai_processing_logs")
    .insert(
      processingLogToInsert({
        id: "proc-smoke-seed-001",
        rawItemId: aiSmokeTestRawItemSeed.id,
        regulatoryUpdateId: aiSmokeTestUpdateSeed.id,
        modelUsed: "smoke-test-seed",
        promptVersion: "smoke-test-seed.v1",
        processingStartedAt: new Date().toISOString(),
        processingFinishedAt: new Date().toISOString(),
        status: "success",
        errorMessage:
          "Smoke test draft reset for controlled one-item OpenAI verification. No live AI call made by this seed step.",
        createdAt: new Date().toISOString(),
      }),
    )
    .select("id");

  if (resetLogError) {
    throw new Error(
      [
        "Failed writing smoke-test seed log",
        `message=${resetLogError.message ?? "unknown"}`,
        `details=${resetLogError.details ?? "none"}`,
        `hint=${resetLogError.hint ?? "none"}`,
        `code=${resetLogError.code ?? "none"}`,
      ].join(" | "),
    );
  }

  console.log(
    `[seed-ai-smoke] ai_processing_logs: inserted ${resetLogData?.length ?? 1} reset log`,
  );
  console.log(
    `[seed-ai-smoke] ready update_id=${aiSmokeTestUpdateSeed.id} raw_item_id=${aiSmokeTestRawItemSeed.id} status=${aiSmokeTestUpdateSeed.status}`,
  );
  console.log(
    "[seed-ai-smoke] completed. The draft remains needs_review and is not publicly visible.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
