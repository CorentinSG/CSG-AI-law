import { randomUUID } from "node:crypto";

import { z } from "zod";

// Trace layer for agent runs: failure -> trace -> root cause -> proposed fix
// -> replay -> regression test. Traces are plain JSON, written by callers to
// .agent-traces/ (gitignored) or attached to scan logs. Never store secrets.

export const traceStepSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["llm", "tool", "retrieval", "parse", "db", "other"]),
  startedAt: z.string(),
  durationMs: z.number().nullable(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.string().nullable(),
  model: z.string().optional(),
  promptVersion: z.string().optional(),
  tokens: z
    .object({ input: z.number().optional(), output: z.number().optional() })
    .optional(),
  costUsd: z.number().optional(),
});

export const agentRunTraceSchema = z.object({
  runId: z.string().min(1),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  taskInput: z.unknown(),
  agentConfig: z.record(z.string(), z.unknown()),
  steps: z.array(traceStepSchema),
  finalOutput: z.unknown().nullable(),
  errors: z.array(z.string()),
});

export type TraceStep = z.infer<typeof traceStepSchema>;
export type AgentRunTrace = z.infer<typeof agentRunTraceSchema>;

const SECRET_KEY_PATTERN = /key|token|secret|password|authorization|credential/i;

export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = SECRET_KEY_PATTERN.test(key) ? "[redacted]" : redactSecrets(entry);
    }
    return result as T;
  }
  return value;
}

export function createTrace(input: {
  taskInput: unknown;
  agentConfig: Record<string, unknown>;
}): AgentRunTrace {
  return {
    runId: randomUUID(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    taskInput: redactSecrets(input.taskInput),
    agentConfig: redactSecrets(input.agentConfig),
    steps: [],
    finalOutput: null,
    errors: [],
  };
}

export function addStep(
  trace: AgentRunTrace,
  step: Pick<TraceStep, "name" | "kind"> & Partial<TraceStep>,
): TraceStep {
  const fullStep: TraceStep = {
    startedAt: new Date().toISOString(),
    durationMs: null,
    error: null,
    ...step,
    input: step.input === undefined ? undefined : redactSecrets(step.input),
    output: step.output === undefined ? undefined : redactSecrets(step.output),
  };
  trace.steps.push(fullStep);
  if (fullStep.error) {
    trace.errors.push(`${fullStep.name}: ${fullStep.error}`);
  }
  return fullStep;
}

export function finishTrace(trace: AgentRunTrace, finalOutput: unknown): AgentRunTrace {
  trace.finishedAt = new Date().toISOString();
  trace.finalOutput = finalOutput === undefined ? null : redactSecrets(finalOutput);
  return trace;
}
