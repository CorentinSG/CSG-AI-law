import type {
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { DiscoveryLeadRecord } from "@/agents/ai-regulation/utils/discovery-lead-records";
import { extractDiscoveryLeadMetadata, getDiscoverySourcePolicy } from "@/agents/ai-regulation/utils/discovery";
import { extractVerificationMetadata } from "@/agents/ai-regulation/verification";
import {
  getAuthorityPresentation,
  inferSourceAuthorityType,
} from "@/agents/ai-regulation/utils/authority";
import {
  getResolvedSourceVerificationRecord,
  getSourceVerificationRecord,
  type SourceVerificationRecord,
} from "@/content/ai-regulation/source-verification";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import {
  euAiTimelineEntries,
} from "@/content/ai-regulation/eu-timeline";
import {
  europeCountryStatuses,
} from "@/content/ai-regulation/europe-map";

export interface ParsedScanDiagnostics {
  itemsFetched: number | null;
  itemsFilteredOut: number | null;
  itemsInserted: number | null;
  duplicatesDetected: number | null;
  processingFailures: number | null;
  scanDurationMs: number | null;
  sourceResponseStatus: number | null;
  warnings: string[];
  zeroResultsReason: string | null;
  errors: string[];
}

export interface SourceHealthSummary {
  tone: "success" | "warning" | "danger" | "neutral";
  label: string;
  detail: string;
}

export interface SourceVerificationSummary {
  tone: "success" | "warning" | "danger" | "neutral";
  label: string;
  detail: string;
  record: SourceVerificationRecord | null;
}

export interface DiscoveryLeadSummary {
  headline: string;
  discoverySourceName: string;
  discoverySourceUrl: string;
  outboundUrl: string;
  detectedDate: string;
  possibleJurisdiction: string;
  possibleTopic: string;
  possibleLegalArea: string;
  possibleAuthorityType: string;
  possibleOfficialSourceFound: boolean;
  possibleOfficialSourceUrl: string | null;
  corroboratingSourceFound: boolean;
  corroboratingSourceUrl: string | null;
  verificationStatus: string;
  conversionStatus: string;
  reviewerNotes: string;
  lastVerifiedAt: string | null;
  nextSuggestedVerificationSource: string;
  notPublishableReason: string | null;
  stale: boolean;
}

const structuredPrefixes = [
  "items_fetched=",
  "items_filtered_out=",
  "items_inserted=",
  "duplicates_detected=",
  "processing_failures=",
  "scan_duration_ms=",
  "source_response_status=",
  "warning=",
  "zero_results_reason=",
];

function parseNumericValue(entry: string, prefix: string) {
  if (!entry.startsWith(prefix)) return null;
  const value = Number(entry.slice(prefix.length));
  return Number.isFinite(value) ? value : null;
}

export function parseScanDiagnostics(
  log: Pick<RegulationScanLog, "errors" | "duplicatesDetected"> | null,
): ParsedScanDiagnostics {
  const parsed: ParsedScanDiagnostics = {
    itemsFetched: null,
    itemsFilteredOut: null,
    itemsInserted: null,
    duplicatesDetected: log?.duplicatesDetected ?? null,
    processingFailures: null,
    scanDurationMs: null,
    sourceResponseStatus: null,
    warnings: [],
    zeroResultsReason: null,
    errors: [],
  };

  if (!log) return parsed;

  for (const entry of log.errors) {
    parsed.itemsFetched ??= parseNumericValue(entry, "items_fetched=");
    parsed.itemsFilteredOut ??= parseNumericValue(entry, "items_filtered_out=");
    parsed.itemsInserted ??= parseNumericValue(entry, "items_inserted=");
    parsed.duplicatesDetected ??= parseNumericValue(entry, "duplicates_detected=");
    parsed.processingFailures ??= parseNumericValue(entry, "processing_failures=");
    parsed.scanDurationMs ??= parseNumericValue(entry, "scan_duration_ms=");
    parsed.sourceResponseStatus ??= parseNumericValue(
      entry,
      "source_response_status=",
    );

    if (entry.startsWith("warning=")) {
      parsed.warnings.push(entry.slice("warning=".length));
      continue;
    }

    if (entry.startsWith("zero_results_reason=")) {
      parsed.zeroResultsReason = entry.slice("zero_results_reason=".length);
      continue;
    }

    if (!structuredPrefixes.some((prefix) => entry.startsWith(prefix))) {
      parsed.errors.push(entry);
    }
  }

  return parsed;
}

export function classifySourceHealth(
  source: Pick<RegulationSource, "active" | "lastScannedAt">,
  log: Pick<RegulationScanLog, "status" | "newItemsDetected" | "duplicatesDetected" | "errors"> | null,
): SourceHealthSummary {
  if (!source.active) {
    return {
      tone: "neutral",
      label: "Intentionally inactive",
      detail: "This source is intentionally disabled and will not be scanned until its official endpoint is ready.",
    };
  }

  if (!log) {
    return {
      tone: "neutral",
      label: "Awaiting first scan",
      detail: source.lastScannedAt
        ? "No recent scan log is available for this source."
        : "Run a scan to assess connector output quality.",
    };
  }

  const diagnostics = parseScanDiagnostics(log);
  const warningText = diagnostics.warnings.join(" ").toLowerCase();
  const errorText = diagnostics.errors.join(" ").toLowerCase();
  const responseStatus = diagnostics.sourceResponseStatus;

  if (
    log.status === "failed" &&
    (responseStatus === 401 ||
      responseStatus === 403 ||
      errorText.includes("403") ||
      errorText.includes("forbidden"))
  ) {
    return {
      tone: "danger",
      label: "Blocked or forbidden",
      detail:
        diagnostics.errors[0] ??
        diagnostics.warnings[0] ??
        "The official source rejected the scan request.",
    };
  }

  if (log.status === "failed") {
    return {
      tone: "danger",
      label: "Scan failed",
      detail:
        diagnostics.errors[0] ??
        diagnostics.warnings[0] ??
        "The connector failed before producing usable scan results.",
    };
  }

  const structureSignal =
    warningText.includes("selector") ||
    warningText.includes("structure") ||
    warningText.includes("parse") ||
    errorText.includes("selector") ||
    errorText.includes("structure") ||
    errorText.includes("parse");

  if (diagnostics.zeroResultsReason) {
    const parserTooNarrow =
      /parsed|selector|structure|generic|topic page|framework page|guidance hub|official .* page/i.test(
        diagnostics.zeroResultsReason,
      );

    if (parserTooNarrow) {
      return {
        tone: "warning",
        label: "Parser too narrow",
        detail: diagnostics.zeroResultsReason,
      };
    }

    return {
      tone: "neutral",
      label: "Working but no matching items",
      detail: diagnostics.zeroResultsReason,
    };
  }

  if (structureSignal) {
    return {
      tone: "warning",
      label: "Parsing warning",
      detail:
        diagnostics.warnings[0] ??
        diagnostics.errors[0] ??
        "The source responded, but parsing signals suggest connector maintenance may be needed.",
    };
  }

  if (
    log.newItemsDetected === 0 &&
    (diagnostics.itemsFetched ?? 0) > 0 &&
    (log.duplicatesDetected ?? 0) > 0
  ) {
    return {
      tone: "success",
      label: "Duplicate-heavy but healthy",
      detail:
        "The source is responding and yielding relevant official items, but the latest scan mostly rediscovered documents already stored in the database.",
    };
  }

  if (
    (diagnostics.itemsFilteredOut ?? 0) > 0 &&
    log.newItemsDetected === 0 &&
    log.duplicatesDetected === 0
  ) {
    return {
      tone: "neutral",
      label: "Working but no matching items",
      detail:
        "The source returned official candidates, but deterministic AI-regulation filtering excluded them from persistence.",
    };
  }

  if (diagnostics.warnings.length > 0) {
    return {
      tone: "warning",
      label: "Warnings present",
      detail: diagnostics.warnings[0],
    };
  }

  return {
    tone: "success",
    label: "Working and returning items",
    detail:
      "The latest scan completed successfully and produced parseable items without warnings.",
  };
}

export function formatDiagnosticsSummary(log: RegulationScanLog | null) {
  const diagnostics = parseScanDiagnostics(log);
  return {
    ...diagnostics,
    latestWarning: diagnostics.warnings[0] ?? null,
    latestError: diagnostics.errors[0] ?? null,
  };
}

export function buildRawMetadataPreview(item: RawRegulatoryItem) {
  const excerpt = item.rawText.trim().replace(/\s+/g, " ").slice(0, 220);
  const metadataEntries = Object.entries(item.rawMetadata).slice(0, 4);
  return {
    excerpt,
    metadataPreview: metadataEntries.map(([key, value]) => {
      const preview =
        typeof value === "string"
          ? value
          : JSON.stringify(value);
      return `${key}: ${preview}`.slice(0, 140);
    }),
  };
}

export function buildSourceAuthoritySummary(source: RegulationSource) {
  const authorityType = inferSourceAuthorityType(source);
  const presentation = getAuthorityPresentation(authorityType);
  const editorialNotes = Array.isArray(source.config?.editorialNotes)
    ? source.config.editorialNotes.filter((note): note is string => typeof note === "string")
    : [];

  return {
    authorityType,
    label: presentation.label,
    shortNote: presentation.shortNote,
    adminNotes: [...presentation.adminNotes, ...editorialNotes],
  };
}

export function buildSourceVerificationSummary(
  source: RegulationSource,
  sourceHealthChecks: SourceHealthCheck[] = [],
): SourceVerificationSummary {
  const record =
    getResolvedSourceVerificationRecord(source.id, {
      sources: [source],
      sourceHealthChecks,
    }) ?? getSourceVerificationRecord(source.id);
  if (!record) {
    return {
      tone: "warning",
      label: "Verification missing",
      detail:
        "No runtime accessibility verification record is documented for this source yet.",
      record: null,
    };
  }

  const discoveryPolicy = getDiscoverySourcePolicy(source);
  if (discoveryPolicy) {
    return {
      tone: "warning",
      label: "Verified discovery source (non-official)",
      detail:
        record.note ??
        "This source is discovery-only, non-official, and cannot be published without separate official verification.",
      record,
    };
  }

  if (!record.runtimeAccessible) {
    return {
      tone: "danger",
      label: "Access blocked",
      detail: record.note,
      record,
    };
  }

  if (!record.stableEnoughForMonitoring || record.status !== "verified") {
    return {
      tone: "warning",
      label:
        record.status === "needs_dedicated_parser"
          ? "Needs dedicated parser"
          : "Verification caution",
      detail: record.note,
      record,
    };
  }

  return {
    tone: "success",
    label: "Verified official source",
    detail: record.note,
    record,
  };
}

export function buildDiscoveryLeadSummary(
  rawItem: RawRegulatoryItem,
): DiscoveryLeadSummary | null {
  const discovery = extractDiscoveryLeadMetadata(rawItem);
  const verification = extractVerificationMetadata(rawItem);
  if (!discovery) {
    return null;
  }

  return {
    headline: discovery.headline ?? rawItem.rawTitle,
    discoverySourceName: discovery.discoverySourceName ?? "Unknown discovery source",
    discoverySourceUrl: discovery.discoverySourceUrl ?? "Unknown discovery source URL",
    outboundUrl: discovery.outboundUrl ?? rawItem.rawUrl,
    detectedDate: discovery.detectedDate ?? rawItem.detectedAt,
    possibleJurisdiction: discovery.possibleJurisdiction ?? "Needs verification",
    possibleTopic: discovery.possibleTopic ?? "Needs verification",
    possibleLegalArea: discovery.possibleLegalArea ?? "Needs verification",
    possibleAuthorityType: discovery.possibleAuthorityType ?? "Needs verification",
    possibleOfficialSourceFound: discovery.possibleOfficialSourceFound,
    possibleOfficialSourceUrl: discovery.possibleOfficialSourceUrl,
    corroboratingSourceFound: discovery.corroboratingSourceFound,
    corroboratingSourceUrl: discovery.corroboratingSourceUrl,
    verificationStatus:
      verification?.verificationStatus ?? discovery.verificationStatus ?? "needs_review",
    conversionStatus:
      discovery.conversionStatus ?? "discovery_only",
    reviewerNotes:
      verification?.reviewerNotes ??
      discovery.reviewerNotes ??
      "Non-official discovery lead - requires verification.",
    lastVerifiedAt: verification?.lastVerifiedAt ?? null,
    nextSuggestedVerificationSource:
      verification?.nextSuggestedVerificationSource ??
      "Identify the relevant official source before conversion.",
    notPublishableReason: verification?.notPublishableReason ?? null,
    stale: verification?.stale ?? false,
  };
}

export function buildDiscoveryLeadRecordSummary(
  record: DiscoveryLeadRecord,
): DiscoveryLeadSummary {
  const { lead, verification } = record;

  return {
    headline: lead.headline,
    discoverySourceName: record.source?.name ?? "Unknown discovery source",
    discoverySourceUrl: lead.discoverySourceUrl,
    outboundUrl: lead.outboundUrl ?? lead.discoverySourceUrl,
    detectedDate: lead.detectedAt,
    possibleJurisdiction: lead.possibleJurisdiction ?? "Needs verification",
    possibleTopic: lead.possibleTopic ?? "Needs verification",
    possibleLegalArea: lead.possibleLegalArea ?? "Needs verification",
    possibleAuthorityType: lead.possibleAuthorityType ?? "Needs verification",
    possibleOfficialSourceFound:
      verification?.officialSourceFound ?? lead.officialSourceFound,
    possibleOfficialSourceUrl:
      verification?.officialSourceUrl ?? lead.officialSourceUrl,
    corroboratingSourceFound:
      (verification?.corroboratingSourcesCount ?? lead.corroboratingSourceCount) > 0,
    corroboratingSourceUrl:
      verification?.corroboratingSourceUrls[0] ??
      lead.corroboratingSourceUrls[0] ??
      null,
    verificationStatus:
      verification?.verificationStatus ?? lead.status ?? "needs_review",
    conversionStatus:
      lead.convertedUpdateId ? "converted_to_monitor_item" : "discovery_only",
    reviewerNotes:
      verification?.reviewerNotes ??
      lead.reviewerNotes ??
      "Non-official discovery lead - requires verification.",
    lastVerifiedAt: verification?.lastVerifiedAt ?? lead.lastVerifiedAt,
    nextSuggestedVerificationSource:
      verification?.nextSuggestedVerificationSource ??
      "Identify the relevant official source before conversion.",
    notPublishableReason: verification?.notPublishableReason ?? null,
    stale:
      verification?.stale ??
      (lead.status === "stale" || lead.staleAt !== null),
  };
}

export function buildEuropeVerificationSummary() {
  const pendingCountries = europeCountryStatuses.filter(
    (country) => country.confidence !== "high",
  );
  const lowerConfidenceMilestones = euAiTimelineEntries.filter(
    (entry) => entry.confidence !== "high",
  );

  return {
    countriesPendingReview: pendingCountries.length,
    lowerConfidenceMilestoneCount: lowerConfidenceMilestones.length,
    pendingCountries,
    lowerConfidenceMilestones,
  };
}
