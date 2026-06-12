import { describe, expect, it } from "vitest";

import {
  buildScanDiagnosticMessages,
  deriveScanStatus,
} from "@/agents/ai-regulation/processors/scanDiagnostics";

describe("scan diagnostics", () => {
  it("builds structured scan log messages", () => {
    const messages = buildScanDiagnosticMessages({
      responseStatus: 200,
      itemsFetched: 8,
      itemsFilteredOut: 3,
      itemsInserted: 2,
      duplicatesDetected: 1,
      processingFailures: 0,
      parsingWarnings: ["One card was missing a date."],
      extractionErrors: [],
      zeroResultsReason: null,
      durationMs: 1543,
    });

    expect(messages).toContain("items_fetched=8");
    expect(messages).toContain("items_filtered_out=3");
    expect(messages).toContain("source_response_status=200");
    expect(messages.some((entry) => entry.startsWith("warning="))).toBe(true);
  });

  it("passes through structured failure messages unchanged", () => {
    const messages = buildScanDiagnosticMessages({
      responseStatus: 403,
      itemsFetched: 0,
      itemsFilteredOut: 0,
      itemsInserted: 0,
      duplicatesDetected: 0,
      processingFailures: 0,
      parsingWarnings: [],
      extractionErrors: ['failure_report={"runId":"trace-1"}'],
      zeroResultsReason: null,
      durationMs: 250,
    });

    expect(messages).toContain('failure_report={"runId":"trace-1"}');
    expect(
      messages.some((entry) => entry === 'error=failure_report={"runId":"trace-1"}'),
    ).toBe(false);
  });

  it("marks partial success when warnings exist alongside inserted items", () => {
    expect(
      deriveScanStatus({
        extractionErrors: [],
        processingFailures: 0,
        parsingWarnings: ["A listing was skipped."],
        itemsInserted: 1,
      }),
    ).toBe("partial_success");
  });

  it("marks failed when extraction errors prevent inserts", () => {
    expect(
      deriveScanStatus({
        extractionErrors: ["Request timed out."],
        processingFailures: 0,
        parsingWarnings: [],
        itemsInserted: 0,
      }),
    ).toBe("failed");
  });
});
