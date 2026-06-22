import { loadScriptEnv } from "../src/lib/load-script-env";

loadScriptEnv();

function shouldWrite() {
  return process.argv.includes("--write") || process.env.BACKFILL_WRITE === "true";
}

async function main() {
  const write = shouldWrite();
  const { getAiRegulationRepository, getRepositoryMode } = await import(
    "../src/db/repository"
  );
  const { backfillNewsItemsFromUpdates } = await import("../src/lib/news-backfill");

  if (!write) {
    console.log(
      "[backfill:news-items] dry-run only. Re-run with --write to upsert news_items.",
    );
  }

  const repository = getAiRegulationRepository();
  if (write) {
    const summary = await backfillNewsItemsFromUpdates(repository);
    console.log(
      `[backfill:news-items] mode=${getRepositoryMode()} write=true summary=${JSON.stringify(summary)}`,
    );
    return;
  }

  const updates = await repository.listRegulatoryUpdates(undefined, "admin");
  const skippedTerminalStatus = updates.filter((update) =>
    ["archived", "rejected"].includes(update.status),
  ).length;

  console.log(
    `[backfill:news-items] mode=${getRepositoryMode()} write=false scanned=${updates.length} would_upsert=${updates.length - skippedTerminalStatus} skipped_terminal=${skippedTerminalStatus}`,
  );
}

main().catch((error) => {
  console.error("[backfill:news-items] failed", error);
  process.exitCode = 1;
});
