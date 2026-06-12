import { describe, expect, it } from "vitest";

import { relevanceFilter } from "@/agents/ai-regulation/processors/relevanceFilter";
import { replayTrace } from "@/agents/harness/replay";
import { addStep, createTrace } from "@/agents/harness/trace";
import type { ExtractedCandidateItem, RegulationSource } from "@/agents/ai-regulation/types";

// Regression test format (one file or describe-block per real failure):
//   Input:            the recorded task input that failed, replayed via replayTrace.
//   Expected:         what the harness should now produce.
//   Assertion:        plain English in the test name, code in expect().
//   Original failure: why it failed, as a comment.
//   Date added:       in the comment.
//
// This example documents the format with a representative deterministic case:
// an AI-only item with no legal-regulatory context must stay irrelevant
// (false positives here would push noise into the human review queue).
// Original failure reason: example seeded with the harness (no production
// incident); replace pattern with real failures as they occur.
// Date added: 2026-06-10.

const source: RegulationSource = {
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
};

const candidate: ExtractedCandidateItem = {
  title: "Startup launches new AI chatbot for cooking recipes",
  url: "https://example.org/blog/ai-chatbot-recipes",
  text: "A startup announced an artificial intelligence assistant that suggests recipes.",
  excerpt: "New AI assistant for recipes.",
  metadata: {},
};

describe("regression: relevance filter must reject AI items without legal-regulatory context", () => {
  it("replays the recorded input and confirms the item is filtered out", async () => {
    const trace = createTrace({
      taskInput: { candidate, source },
      agentConfig: { step: "relevanceFilter" },
    });
    addStep(trace, { name: "relevance", kind: "parse" });

    const result = await replayTrace(trace, async (taskInput) => {
      const { candidate: c, source: s } = taskInput as {
        candidate: ExtractedCandidateItem;
        source: RegulationSource;
      };
      return relevanceFilter.evaluate(c, s);
    });

    expect(result.newError).toBeNull();
    const decision = result.newOutput as { relevant: boolean };
    expect(decision.relevant).toBe(false);
  });
});
