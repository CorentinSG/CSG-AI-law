import type { AgentRunTrace, TraceStep } from "@/agents/harness/trace";

// Failure diagnosis layer. Produces a structured, machine-readable report a
// human (or a future diagnostic agent) can act on. Fix policy is fixed:
// failures never trigger automatic code changes — propose, get approval, verify.

export const failureKinds = [
  "prompt",
  "tool",
  "retrieval",
  "parsing",
  "permission",
  "timeout",
  "hallucination",
  "unknown",
] as const;

export type FailureKind = (typeof failureKinds)[number];

export interface FailureReport {
  runId: string;
  createdAt: string;
  whatHappened: string;
  likelyRootCause: string;
  impactedStep: string;
  kind: FailureKind;
  recommendedNextAction: string;
  regressionTestRecommended: boolean;
  fixPolicy: "propose-only-human-approval-required";
}

export function classifyFailure(error: string, stepKind?: TraceStep["kind"]): FailureKind {
  const text = error.toLowerCase();
  if (/timeout|timed out|etimedout|aborted|abortsignal/.test(text)) return "timeout";
  if (/401|403|unauthorized|forbidden|permission|api key|apikey|credential/.test(text)) {
    return "permission";
  }
  if (/zoderror|json|parse|unexpected token|did not contain|invalid_type|schema/.test(text)) {
    return "parsing";
  }
  if (/fabricat|hallucinat|unsupported claim|citation not found/.test(text)) {
    return "hallucination";
  }
  if (stepKind === "retrieval" || /rss|feed|scrape|crawl|fetch failed|enotfound|econn|5\d\d/.test(text)) {
    return stepKind === "llm" ? "tool" : "retrieval";
  }
  if (stepKind === "llm") return "prompt";
  if (stepKind === "tool" || stepKind === "db") return "tool";
  return "unknown";
}

const nextActionByKind: Record<FailureKind, string> = {
  prompt: "Review the prompt template and model output; adjust prompt or schema, then replay.",
  tool: "Check the failing tool/connector and its target endpoint; replay once reachable.",
  retrieval: "Verify the source URL/feed is alive and its markup unchanged; update connector if the source changed.",
  parsing: "Inspect the raw output vs the expected schema; tighten extraction or relax schema, then replay.",
  permission: "Check credentials/env configuration. Do not commit or log secret values.",
  timeout: "Replay once; if reproducible, raise the timeout or reduce payload size.",
  hallucination: "Treat output as untrusted; require source-backed verification before any publication.",
  unknown: "Replay with the recorded input and inspect the full trace step by step.",
};

export function buildFailureReport(trace: AgentRunTrace): FailureReport | null {
  const failedStep = trace.steps.find((step) => step.error);
  const error = failedStep?.error ?? trace.errors[0];
  if (!error) return null;

  const kind = classifyFailure(error, failedStep?.kind);
  return {
    runId: trace.runId,
    createdAt: new Date().toISOString(),
    whatHappened: error,
    likelyRootCause: `${kind} failure in step "${failedStep?.name ?? "run"}" (heuristic classification; confirm via replay).`,
    impactedStep: failedStep?.name ?? "run",
    kind,
    recommendedNextAction: nextActionByKind[kind],
    // Deterministic failures deserve regression tests; flaky infra usually does not.
    regressionTestRecommended: kind !== "timeout" && kind !== "permission",
    fixPolicy: "propose-only-human-approval-required",
  };
}

// Same convention as ai_result= in openaiProcessor: structured JSON inside an
// existing scan-log message field, so no schema migration is needed.
export function buildFailureReportLogMessage(report: FailureReport) {
  return `failure_report=${JSON.stringify(report)}`;
}

export function parseFailureReportLog(message: string): FailureReport | null {
  if (!message.startsWith("failure_report=")) return null;
  try {
    return JSON.parse(message.slice("failure_report=".length)) as FailureReport;
  } catch {
    return null;
  }
}
