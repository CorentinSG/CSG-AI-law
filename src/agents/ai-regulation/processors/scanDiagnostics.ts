interface ScanDiagnosticInput {
  responseStatus?: number | null;
  itemsFetched: number;
  itemsFilteredOut: number;
  itemsInserted: number;
  duplicatesDetected: number;
  processingFailures: number;
  parsingWarnings: string[];
  extractionErrors: string[];
  zeroResultsReason?: string | null;
  durationMs: number;
}

function formatDiagnosticEntry(
  prefix: "warning" | "error",
  message: string,
) {
  if (
    message.startsWith("failure_report=") ||
    message.startsWith("ai_result=")
  ) {
    return message;
  }

  return `${prefix}=${message}`;
}

export function buildScanDiagnosticMessages(input: ScanDiagnosticInput) {
  const messages = [
    `items_fetched=${input.itemsFetched}`,
    `items_filtered_out=${input.itemsFilteredOut}`,
    `items_inserted=${input.itemsInserted}`,
    `duplicates_detected=${input.duplicatesDetected}`,
    `processing_failures=${input.processingFailures}`,
    `scan_duration_ms=${input.durationMs}`,
  ];

  if (typeof input.responseStatus === "number") {
    messages.push(`source_response_status=${input.responseStatus}`);
  }

  if (input.zeroResultsReason) {
    messages.push(`zero_results_reason=${input.zeroResultsReason}`);
  }

  for (const warning of input.parsingWarnings) {
    messages.push(formatDiagnosticEntry("warning", warning));
  }

  for (const error of input.extractionErrors) {
    messages.push(formatDiagnosticEntry("error", error));
  }

  return messages;
}

export function deriveScanStatus(input: {
  extractionErrors: string[];
  processingFailures: number;
  parsingWarnings: string[];
  itemsInserted: number;
}) {
  if (input.extractionErrors.length > 0 && input.itemsInserted === 0) {
    return "failed" as const;
  }

  if (
    input.extractionErrors.length > 0 ||
    input.processingFailures > 0 ||
    (input.parsingWarnings.length > 0 && input.itemsInserted > 0)
  ) {
    return "partial_success" as const;
  }

  return "success" as const;
}
