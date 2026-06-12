import { z } from "zod";

import { areReplayValuesEqual } from "@/agents/harness/replay";
import {
  builtInReplayRunnerIds,
  getBuiltInReplayRunner,
  type BuiltInReplayRunnerId,
} from "@/agents/harness/runners";
import type { ReplayResult } from "@/agents/harness/replay";
import type { AgentRunTrace } from "@/agents/harness/trace";

export const harnessRegressionCaseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    runnerId: z.enum(builtInReplayRunnerIds),
    taskInput: z.unknown(),
    expectedOutput: z.unknown().optional(),
    expectedError: z.string().nullable().optional(),
    originalFailureReason: z.string().min(1),
    dateAdded: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.expectedOutput === undefined && value.expectedError === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "A regression case must declare expectedOutput or expectedError.",
      });
    }
  });

export type HarnessRegressionCase = z.infer<typeof harnessRegressionCaseSchema>;

export function buildHarnessRegressionCaseFromReplay(input: {
  id: string;
  title: string;
  runnerId: BuiltInReplayRunnerId;
  trace: AgentRunTrace;
  replayResult: ReplayResult;
  originalFailureReason?: string | null;
  dateAdded?: string;
}): HarnessRegressionCase {
  return harnessRegressionCaseSchema.parse({
    id: input.id,
    title: input.title,
    runnerId: input.runnerId,
    taskInput: input.trace.taskInput,
    expectedOutput:
      input.replayResult.newError === null ? input.replayResult.newOutput : undefined,
    expectedError:
      input.replayResult.newError === null ? undefined : input.replayResult.newError,
    originalFailureReason:
      input.originalFailureReason ??
      input.replayResult.originalError ??
      "Unknown original failure.",
    dateAdded: input.dateAdded ?? new Date().toISOString().slice(0, 10),
  });
}

export async function runHarnessRegressionCase(regressionCase: HarnessRegressionCase) {
  const runner = getBuiltInReplayRunner(regressionCase.runnerId);
  if (!runner) {
    throw new Error(`Unknown built-in replay runner: ${regressionCase.runnerId}`);
  }

  let actualOutput: unknown = null;
  let actualError: string | null = null;
  try {
    actualOutput = await runner.run(regressionCase.taskInput);
  } catch (error) {
    actualError = error instanceof Error ? error.message : String(error);
  }

  const passed =
    regressionCase.expectedError !== undefined
      ? actualError === regressionCase.expectedError
      : actualError === null &&
        areReplayValuesEqual(actualOutput, regressionCase.expectedOutput);

  return {
    passed,
    actualOutput,
    actualError,
  };
}
