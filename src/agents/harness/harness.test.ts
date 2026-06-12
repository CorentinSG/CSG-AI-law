import { describe, expect, it } from "vitest";

import {
  buildFailureReport,
  buildFailureReportLogMessage,
  classifyFailure,
  parseFailureReportLog,
} from "@/agents/harness/failure";
import {
  buildHarnessRegressionCaseFromReplay,
  harnessRegressionCaseSchema,
  runHarnessRegressionCase,
} from "@/agents/harness/regression";
import { replayTrace } from "@/agents/harness/replay";
import { replayTraceWithBuiltInRunner, resolveBuiltInReplayRunner } from "@/agents/harness/runners";
import { addStep, createTrace, finishTrace, redactSecrets } from "@/agents/harness/trace";

describe("trace layer", () => {
  it("captures steps and propagates step errors to run errors", () => {
    const trace = createTrace({
      taskInput: { title: "Test item" },
      agentConfig: { model: "gpt-test", promptVersion: "v1" },
    });
    addStep(trace, { name: "classification", kind: "llm", model: "gpt-test" });
    addStep(trace, { name: "summary", kind: "llm", error: "Request timed out" });
    finishTrace(trace, null);

    expect(trace.runId).toBeTruthy();
    expect(trace.finishedAt).not.toBeNull();
    expect(trace.steps).toHaveLength(2);
    expect(trace.errors).toEqual(["summary: Request timed out"]);
  });

  it("redacts secret-looking keys recursively", () => {
    const redacted = redactSecrets({
      apiKey: "sk-123",
      nested: { authorization: "Bearer x", safe: "ok" },
      list: [{ token: "t" }],
    });
    expect(redacted.apiKey).toBe("[redacted]");
    expect(redacted.nested.authorization).toBe("[redacted]");
    expect(redacted.nested.safe).toBe("ok");
    expect(redacted.list[0].token).toBe("[redacted]");
  });
});

describe("failure diagnosis layer", () => {
  it("classifies common failure kinds", () => {
    expect(classifyFailure("Request timed out after 30000ms")).toBe("timeout");
    expect(classifyFailure("401 Unauthorized")).toBe("permission");
    expect(classifyFailure("OpenAI response did not contain a valid JSON object.")).toBe("parsing");
    expect(classifyFailure("getaddrinfo ENOTFOUND example.org", "retrieval")).toBe("retrieval");
    expect(classifyFailure("model refused the instruction", "llm")).toBe("prompt");
    expect(classifyFailure("something odd")).toBe("unknown");
  });

  it("builds a structured report from a failed trace and round-trips the log message", () => {
    const trace = createTrace({ taskInput: { url: "https://example.org" }, agentConfig: {} });
    addStep(trace, {
      name: "summary",
      kind: "llm",
      error: "OpenAI response did not contain a valid JSON object.",
    });
    const report = buildFailureReport(trace);

    expect(report).not.toBeNull();
    expect(report?.kind).toBe("parsing");
    expect(report?.impactedStep).toBe("summary");
    expect(report?.regressionTestRecommended).toBe(true);
    expect(report?.fixPolicy).toBe("propose-only-human-approval-required");

    const message = buildFailureReportLogMessage(report!);
    expect(parseFailureReportLog(message)).toEqual(report);
    expect(parseFailureReportLog("not a report")).toBeNull();
  });

  it("returns null for a successful trace", () => {
    const trace = createTrace({ taskInput: {}, agentConfig: {} });
    addStep(trace, { name: "fetch", kind: "retrieval" });
    expect(buildFailureReport(trace)).toBeNull();
  });
});

describe("replay layer", () => {
  it("reports fixed when a previously failing input now succeeds", async () => {
    const trace = createTrace({ taskInput: { value: 2 }, agentConfig: {} });
    addStep(trace, { name: "run", kind: "tool", error: "boom" });

    const result = await replayTrace(trace, async (input) => ({
      doubled: (input as { value: number }).value * 2,
    }));
    expect(result.verdict).toBe("fixed");
    expect(result.newOutput).toEqual({ doubled: 4 });
  });

  it("reports still-failing when the runner throws again", async () => {
    const trace = createTrace({ taskInput: {}, agentConfig: {} });
    addStep(trace, { name: "run", kind: "tool", error: "boom" });

    const result = await replayTrace(trace, async () => {
      throw new Error("boom again");
    });
    expect(result.verdict).toBe("still-failing");
    expect(result.newError).toBe("boom again");
  });

  it("detects output drift on successful traces", async () => {
    const trace = finishTrace(
      createTrace({ taskInput: { a: 1 }, agentConfig: {} }),
      { answer: "old" },
    );
    const result = await replayTrace(trace, async () => ({ answer: "new" }));
    expect(result.verdict).toBe("output-changed");
  });

  it("treats object key-order drift as unchanged", async () => {
    const trace = finishTrace(
      createTrace({ taskInput: { a: 1 }, agentConfig: {} }),
      { alpha: 1, beta: 2 },
    );
    const result = await replayTrace(trace, async () => ({ beta: 2, alpha: 1 }));
    expect(result.verdict).toBe("unchanged");
  });
});

describe("built-in replay runners", () => {
  it("resolves the relevance runner from trace metadata or task shape", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          candidate: {
            title: "AI compliance checklist",
            url: "https://example.org/item",
            text: "Regulators issued an AI compliance checklist for providers.",
            metadata: {},
          },
          source: {
            id: "src-test",
            name: "Official bulletin",
            jurisdiction: "European Union",
            region: "Europe",
            country: "European Union",
            sourceUrl: "https://example.org/feed",
            sourceType: "regulator_page",
            scanFrequency: "daily",
            active: true,
            lastScannedAt: null,
            notes: "",
            reliabilityLevel: "high",
            preferredExtractionMethod: "rss",
            createdAt: "2026-06-11T00:00:00.000Z",
            updatedAt: "2026-06-11T00:00:00.000Z",
          },
        },
        agentConfig: { replayRunner: "relevance_filter" },
      }),
      null,
    );

    expect(resolveBuiltInReplayRunner(trace)?.id).toBe("relevance_filter");

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("relevance_filter");
    expect(replayed.result.newError).toBeNull();
  });

  it("replays heuristic classification inputs through the classifier runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          title: "New York courts require attorney review of AI-assisted filings",
          text: "A new court rule applies to attorneys filing AI-assisted papers in civil and criminal matters.",
          sourceName: "New York State Unified Court System",
          publicationDate: "2026-06-01",
        },
        agentConfig: { replayRunner: "ai_classifier" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("ai_classifier");
    expect(replayed.result.newError).toBeNull();
    expect((replayed.result.newOutput as { legalArea: string }).legalArea).toBeTruthy();
  });

  it("replays text-only deadline extraction inputs through the deadline runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          text: "Providers must submit the required documentation by 1 September 2026.",
        },
        agentConfig: { replayRunner: "deadline_extractor" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("deadline_extractor");
    expect(replayed.result.newError).toBeNull();
    expect(Array.isArray(replayed.result.newOutput)).toBe(true);
  });

  it("replays text-only obligation extraction inputs through the obligation runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          text: "Attorneys must independently verify all AI-assisted citations before filing.",
        },
        agentConfig: { replayRunner: "obligation_extractor" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("obligation_extractor");
    expect(replayed.result.newError).toBeNull();
    expect(Array.isArray(replayed.result.newOutput)).toBe(true);
  });

  it("replays deterministic summarizer inputs through the summarizer runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          title: "AI filing rule",
          text: "The court adopted a binding rule requiring lawyers to review AI-assisted submissions carefully.",
          legalArea: "AI governance",
          developmentType: "Court rule",
          authorityType: "Binding court rule",
        },
        agentConfig: { replayRunner: "ai_summarizer" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("ai_summarizer");
    expect(replayed.result.newError).toBeNull();
    expect((replayed.result.newOutput as { title: string }).title).toBe("AI filing rule");
  });

  it("replays deterministic AI-planning inputs through the planning runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          candidates: [
            {
              candidate: {
                title: "EU regulator opens AI consultation",
                url: "https://example.org/consultation",
                text: "The regulator opened a public consultation on AI compliance obligations.",
                excerpt: "AI consultation",
                publicationDate: "2026-06-11",
                detectedAt: "2026-06-11T00:00:00.000Z",
                metadata: {},
              },
              rawItem: {
                id: "raw-plan-1",
                sourceId: "src-eu-ai-office",
                rawTitle: "EU regulator opens AI consultation",
                rawUrl: "https://example.org/consultation",
                rawText: "The regulator opened a public consultation on AI compliance obligations.",
                rawMetadata: {},
                detectedAt: "2026-06-11T00:00:00.000Z",
                hash: "hash-plan-1",
                duplicateOf: null,
                processingStatus: "new",
                createdAt: "2026-06-11T00:00:00.000Z",
                updatedAt: "2026-06-11T00:00:00.000Z",
              },
              source: {
                id: "src-eu-ai-office",
                name: "EU AI Office",
                jurisdiction: "European Union",
                region: "Europe",
                country: "European Union",
                sourceUrl: "https://example.org/feed",
                sourceType: "regulator_page",
                scanFrequency: "daily",
                active: true,
                lastScannedAt: null,
                notes: "",
                reliabilityLevel: "high",
                preferredExtractionMethod: "rss",
                createdAt: "2026-06-11T00:00:00.000Z",
                updatedAt: "2026-06-11T00:00:00.000Z",
              },
              classification: {
                jurisdiction: "European Union",
                developmentType: "Public consultation",
                importanceLevel: "high",
              },
            },
          ],
          env: {
            AI_ENABLE_PROCESSING: false,
            AI_PROCESSING_ENABLED: false,
            AI_MONTHLY_BUDGET_USD: 10,
            AI_MAX_INPUT_TOKENS_PER_ITEM: 5000,
            AI_MAX_ITEMS_PER_SCAN: 5,
            AI_MODEL_RELEVANCE: "gpt-5.4-nano",
            AI_MODEL_CLASSIFICATION: "gpt-5.4-nano",
            AI_MODEL_SUMMARY: "gpt-5.4-mini",
            AI_MODEL_DEEP_ANALYSIS: "gpt-5.4",
            AI_COST_GUARDRAILS_ENABLED: true,
            OPENAI_API_KEY: "test-key",
          },
          monthlySpendUsd: 0,
        },
        agentConfig: { replayRunner: "ai_planning_batch" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("ai_planning_batch");
    expect(replayed.result.newError).toBeNull();
    expect(Array.isArray(replayed.result.newOutput)).toBe(true);
  });

  it("replays deterministic scan diagnostics through the diagnostics runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          responseStatus: 200,
          itemsFetched: 3,
          itemsFilteredOut: 1,
          itemsInserted: 1,
          duplicatesDetected: 1,
          processingFailures: 0,
          parsingWarnings: ["One card was missing a date."],
          extractionErrors: [],
          zeroResultsReason: null,
          durationMs: 1200,
        },
        agentConfig: { replayRunner: "scan_diagnostics_messages" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("scan_diagnostics_messages");
    expect(replayed.result.newError).toBeNull();
    expect(Array.isArray(replayed.result.newOutput)).toBe(true);
  });

  it("replays deterministic scan status derivation through the status runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          extractionErrors: [],
          processingFailures: 1,
          parsingWarnings: [],
          itemsInserted: 2,
        },
        agentConfig: { replayRunner: "scan_status_derivation" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("scan_status_derivation");
    expect(replayed.result.newError).toBeNull();
    expect(replayed.result.newOutput).toBe("partial_success");
  });

  it("replays deterministic deduplicator inputs through the hash runner", async () => {
    const trace = finishTrace(
      createTrace({
        taskInput: {
          sourceId: "src-hash",
          title: "Duplicate candidate",
          url: "https://example.org/duplicate",
          publicationDate: "2026-06-11",
          stableId: "dup-1",
          text: "Candidate body",
        },
        agentConfig: { replayRunner: "deduplicator_hash" },
      }),
      null,
    );

    const replayed = await replayTraceWithBuiltInRunner(trace);
    expect(replayed.runnerId).toBe("deduplicator_hash");
    expect(replayed.result.newError).toBeNull();
    expect(typeof replayed.result.newOutput).toBe("string");
  });
});

describe("regression fixtures", () => {
  it("builds and replays a regression case from a replay result", async () => {
    const trace = createTrace({
      taskInput: {
        candidate: {
          title: "Startup launches new AI chatbot for cooking recipes",
          url: "https://example.org/blog/ai-chatbot-recipes",
          text: "A startup announced an artificial intelligence assistant that suggests recipes.",
          excerpt: "New AI assistant for recipes.",
          metadata: {},
        },
        source: {
          id: "src-regression-example",
          name: "Example Tech Blog",
          jurisdiction: "European Union",
          region: "Europe",
          country: "European Union",
          sourceUrl: "https://example.org/blog",
          sourceType: "media_source",
          scanFrequency: "weekly",
          active: true,
          lastScannedAt: null,
          notes: "",
          reliabilityLevel: "medium",
          preferredExtractionMethod: "rss",
          createdAt: "2026-06-10T00:00:00.000Z",
          updatedAt: "2026-06-10T00:00:00.000Z",
        },
      },
      agentConfig: { replayRunner: "relevance_filter" },
    });
    addStep(trace, { name: "relevance", kind: "parse", error: "false positive queued" });

    const replayed = await replayTraceWithBuiltInRunner(trace);
    const regressionCase = buildHarnessRegressionCaseFromReplay({
      id: "regression-generated",
      title: "Generated regression fixture",
      runnerId: replayed.runnerId,
      trace,
      replayResult: replayed.result,
      dateAdded: "2026-06-11",
    });

    expect(harnessRegressionCaseSchema.parse(regressionCase)).toBeTruthy();

    const executed = await runHarnessRegressionCase(regressionCase);
    expect(executed.passed).toBe(true);
  });
});
