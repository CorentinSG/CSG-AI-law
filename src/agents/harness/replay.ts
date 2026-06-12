import type { AgentRunTrace } from "@/agents/harness/trace";

// Replay layer: rerun a recorded failing input against current code in a safe
// mode. The runner is supplied by the caller and must be side-effect free
// (no production writes, no destructive tools).

export interface ReplayResult {
  runId: string;
  originalError: string | null;
  originalOutput: unknown;
  newOutput: unknown;
  newError: string | null;
  verdict: "fixed" | "still-failing" | "output-changed" | "unchanged";
}

function normalizeReplayValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeReplayValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeReplayValue(entry)]),
    );
  }

  return value;
}

export function areReplayValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(normalizeReplayValue(left)) === JSON.stringify(normalizeReplayValue(right));
}

export async function replayTrace(
  trace: AgentRunTrace,
  runner: (taskInput: unknown) => Promise<unknown>,
): Promise<ReplayResult> {
  const originalError = trace.errors[0] ?? null;

  let newOutput: unknown = null;
  let newError: string | null = null;
  try {
    newOutput = await runner(trace.taskInput);
  } catch (error) {
    newError = error instanceof Error ? error.message : String(error);
  }

  let verdict: ReplayResult["verdict"];
  if (originalError) {
    verdict = newError ? "still-failing" : "fixed";
  } else {
    verdict = areReplayValuesEqual(newOutput, trace.finalOutput)
      ? "unchanged"
      : "output-changed";
  }

  return {
    runId: trace.runId,
    originalError,
    originalOutput: trace.finalOutput,
    newOutput,
    newError,
    verdict,
  };
}
