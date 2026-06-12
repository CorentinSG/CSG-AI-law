/**
 * Replay a recorded agent-run trace against current code, safely.
 *
 * Usage:
 *   npx tsx scripts/replay-failure.ts <path-to-trace.json>
 *   npx tsx scripts/replay-failure.ts <path-to-trace.json> --write-regression <path> --title "Title"
 *
 * Prints the structured failure report for the trace, then (when the recorded
 * taskInput matches a built-in deterministic runner) replays it against
 * current code and compares old vs new outcome. It can also write a reusable
 * regression fixture JSON. It never calls external APIs, the database, or any
 * destructive tool.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { buildFailureReport } from "@/agents/harness/failure";
import { buildHarnessRegressionCaseFromReplay } from "@/agents/harness/regression";
import { replayTraceWithBuiltInRunner } from "@/agents/harness/runners";
import { agentRunTraceSchema } from "@/agents/harness/trace";

function sanitizeRegressionId(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function main() {
  const args = process.argv.slice(2);
  const tracePath = args[0];
  if (!tracePath) {
    console.error("Usage: npx tsx scripts/replay-failure.ts <path-to-trace.json>");
    process.exit(1);
  }

  let regressionOutputPath: string | null = null;
  let regressionTitle: string | null = null;

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--write-regression") {
      regressionOutputPath = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--title") {
      regressionTitle = args[index + 1] ?? null;
      index += 1;
    }
  }

  const trace = agentRunTraceSchema.parse(JSON.parse(readFileSync(tracePath, "utf8")));

  const report = buildFailureReport(trace);
  console.log("--- Failure report ---");
  console.log(JSON.stringify(report, null, 2));

  try {
    const replayed = await replayTraceWithBuiltInRunner(trace);

    console.log(`\n--- Replay result (${replayed.runnerId}) ---`);
    console.log(JSON.stringify(replayed.result, null, 2));

    if (regressionOutputPath) {
      const title =
        regressionTitle ??
        `Replay regression for ${replayed.runnerId} (${trace.runId.slice(0, 8)})`;
      const regressionCase = buildHarnessRegressionCaseFromReplay({
        id: sanitizeRegressionId(title),
        title,
        runnerId: replayed.runnerId,
        trace,
        replayResult: replayed.result,
        originalFailureReason: report?.whatHappened ?? trace.errors[0] ?? null,
      });
      writeFileSync(regressionOutputPath, `${JSON.stringify(regressionCase, null, 2)}\n`, "utf8");
      console.log(`\nWrote regression fixture to ${regressionOutputPath}`);
    }
  } catch (error) {
    console.log(
      "\nNo built-in runner matched this trace. " +
        "Use replayTrace() from src/agents/harness/replay.ts with a custom side-effect-free runner.",
    );
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
