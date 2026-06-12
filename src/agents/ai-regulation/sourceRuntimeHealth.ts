import type { SourceHealthCheck, ScanJob } from "@/agents/ai-regulation/governance";
import type { SourceFreshnessStatus } from "@/agents/ai-regulation/newsCurrentness";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { RegulationScanLog, RegulationSource } from "@/agents/ai-regulation/types";
import { austriaMonitoringSourceRegistry } from "@/agents/ai-regulation/austriaNewsSources";
import { belgiumMonitoringSourceRegistry } from "@/agents/ai-regulation/belgiumNewsSources";
import { franceMonitoringSourceRegistry } from "@/agents/ai-regulation/franceNewsSources";
import { germanyMonitoringSourceRegistry } from "@/agents/ai-regulation/germanyNewsSources";
import { irelandMonitoringSourceRegistry } from "@/agents/ai-regulation/irelandNewsSources";
import { italyMonitoringSourceRegistry } from "@/agents/ai-regulation/italyNewsSources";
import { netherlandsMonitoringSourceRegistry } from "@/agents/ai-regulation/netherlandsNewsSources";
import { spainMonitoringSourceRegistry } from "@/agents/ai-regulation/spainNewsSources";
import { swedenMonitoringSourceRegistry } from "@/agents/ai-regulation/swedenNewsSources";
import type { IngestionLog, IngestionStatus } from "@/agents/ingestion/types";

type MonitoringDescriptorLike = {
  sourceId: string;
  label: string;
  recommendedCadence: string;
  priorityBand: "high" | "medium" | "low";
  freshHours: number;
  staleHours: number;
};

const sourceMonitoringRegistry: MonitoringDescriptorLike[] = [
  ...franceMonitoringSourceRegistry,
  ...spainMonitoringSourceRegistry,
  ...italyMonitoringSourceRegistry,
  ...germanyMonitoringSourceRegistry,
  ...netherlandsMonitoringSourceRegistry,
  ...belgiumMonitoringSourceRegistry,
  ...austriaMonitoringSourceRegistry,
  ...swedenMonitoringSourceRegistry,
  ...irelandMonitoringSourceRegistry,
];

export type SourceRuntimeHealthState = "healthy" | "degraded" | "stale" | "inactive";

export interface SourceRuntimeHealthSummary {
  sourceId: string;
  sourceName: string;
  jurisdiction: RegulationSource["jurisdiction"];
  active: boolean;
  state: SourceRuntimeHealthState;
  priorityBand: "high" | "medium" | "low";
  recommendedCadence: string;
  freshHours: number;
  staleHours: number;
  freshnessStatus: SourceFreshnessStatus | "awaiting_first_success";
  lastCheckedAt: string | null;
  lastSuccessfulAt: string | null;
  lastFailureAt: string | null;
  lastScanJobAt: string | null;
  lastScanJobStatus: ScanJob["status"] | null;
  hoursSinceSuccess: number | null;
  consecutiveFailures: number;
  latestResponseStatus: number | null;
  latestParserStatus: string | null;
  latestFailureMessage: string | null;
  reasons: string[];
}

export interface SourceRuntimeHealthInput {
  sources: RegulationSource[];
  sourceHealthChecks: SourceHealthCheck[];
  scanLogs: RegulationScanLog[];
  scanJobs: ScanJob[];
  ingestionLogs: IngestionLog[];
  now?: Date;
}

export interface SourceExecutionDecision {
  sourceId: string;
  shouldScan: boolean;
  decision: "scan_now" | "skip_until_due" | "skip_backoff" | "skip_circuit_open";
  reason: string | null;
  recommendedCadence: string;
  consecutiveFailures: number;
  nextEligibleAt: string | null;
}

interface AttemptSummary {
  status: "success" | "partial_success" | "failed" | "skipped";
  finishedAt: string;
  responseStatus: number | null;
  failureMessage: string | null;
}

function roundHours(value: number | null) {
  if (value === null) return null;
  return Math.round(value * 10) / 10;
}

function parseCadenceToMs(cadence: string) {
  switch (cadence) {
    case "every_5_minutes_when_supported":
      return 5 * 60 * 1000;
    case "hourly":
    case "hourly_fallback":
      return 60 * 60 * 1000;
    case "every_6_hours":
      return 6 * 60 * 60 * 1000;
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function hoursSince(value: string | null | undefined, now: Date) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, (now.getTime() - parsed.getTime()) / 36e5);
}

function compareDesc(a: string, b: string) {
  return b.localeCompare(a);
}

function getMostRecentTimestamp(...values: Array<string | null | undefined>) {
  let latestTimestamp: number | null = null;

  for (const value of values) {
    const parsed = toTimestamp(value);
    if (parsed === null) {
      continue;
    }
    latestTimestamp = latestTimestamp === null ? parsed : Math.max(latestTimestamp, parsed);
  }

  return latestTimestamp;
}

function getFallbackCadence(source: RegulationSource): MonitoringDescriptorLike {
  switch (source.scanFrequency) {
    case "hourly":
      return {
        sourceId: source.id,
        label: source.name,
        recommendedCadence: "hourly",
        priorityBand: source.reliabilityLevel === "high" ? "high" : "medium",
        freshHours: 6,
        staleHours: 72,
      };
    case "every_6_hours":
      return {
        sourceId: source.id,
        label: source.name,
        recommendedCadence: "every_6_hours",
        priorityBand: source.reliabilityLevel === "low" ? "medium" : "high",
        freshHours: 12,
        staleHours: 120,
      };
    case "weekly":
      return {
        sourceId: source.id,
        label: source.name,
        recommendedCadence: "weekly",
        priorityBand: "low",
        freshHours: 72,
        staleHours: 336,
      };
    case "daily":
    default:
      return {
        sourceId: source.id,
        label: source.name,
        recommendedCadence: "daily",
        priorityBand: source.reliabilityLevel === "high" ? "high" : "medium",
        freshHours: 24,
        staleHours: 168,
      };
  }
}

function getSourceDescriptor(source: RegulationSource) {
  return (
    sourceMonitoringRegistry.find((entry) => entry.sourceId === source.id) ??
    getFallbackCadence(source)
  );
}

function getLatestBySourceId<T extends { sourceId: string; checkedAt?: string; scanFinishedAt?: string }>(
  records: T[],
  timestampKey: "checkedAt" | "scanFinishedAt",
) {
  const latest = new Map<string, T>();
  for (const record of records) {
    const current = latest.get(record.sourceId);
    const nextValue = record[timestampKey] ?? "";
    const currentValue = current?.[timestampKey] ?? "";
    if (!current || compareDesc(currentValue, nextValue) > 0) {
      latest.set(record.sourceId, record);
    }
  }
  return latest;
}

function getLatestScanJobsBySource(scanJobs: ScanJob[]) {
  const latest = new Map<string, ScanJob>();
  for (const job of scanJobs) {
    if (!job.sourceId) continue;
    const current = latest.get(job.sourceId);
    const nextStamp = job.finishedAt ?? job.updatedAt ?? job.startedAt ?? job.createdAt;
    const currentStamp = current
      ? current.finishedAt ?? current.updatedAt ?? current.startedAt ?? current.createdAt
      : "";
    if (!current || compareDesc(currentStamp, nextStamp) > 0) {
      latest.set(job.sourceId, job);
    }
  }
  return latest;
}

function mapIngestionStatus(status: IngestionStatus): AttemptSummary["status"] {
  switch (status) {
    case "success":
    case "partial_success":
    case "failed":
    case "skipped":
      return status;
    case "running":
    default:
      return "skipped";
  }
}

function getAttemptSummariesBySource(
  scanLogs: RegulationScanLog[],
  ingestionLogs: IngestionLog[],
) {
  const attempts = new Map<string, AttemptSummary[]>();

  for (const log of scanLogs) {
    const record: AttemptSummary = {
      status: log.status,
      finishedAt: log.scanFinishedAt,
      responseStatus: null,
      failureMessage: log.status === "failed" ? log.errors.find(Boolean) ?? null : null,
    };
    const existing = attempts.get(log.sourceId) ?? [];
    existing.push(record);
    attempts.set(log.sourceId, existing);
  }

  for (const log of ingestionLogs) {
    if (!log.source_id) continue;
    const finishedAt = log.finished_at ?? log.started_at;
    const record: AttemptSummary = {
      status: mapIngestionStatus(log.status),
      finishedAt,
      responseStatus:
        typeof log.details?.responseStatus === "number" ? Number(log.details.responseStatus) : null,
      failureMessage: log.error_message ?? null,
    };
    const existing = attempts.get(log.source_id) ?? [];
    existing.push(record);
    attempts.set(log.source_id, existing);
  }

  for (const [sourceId, records] of attempts) {
    records.sort((a, b) => compareDesc(a.finishedAt, b.finishedAt));
    attempts.set(sourceId, records);
  }

  return attempts;
}

function countConsecutiveFailures(attempts: AttemptSummary[]) {
  let count = 0;
  for (const attempt of attempts) {
    if (attempt.status === "failed") {
      count += 1;
      continue;
    }
    break;
  }
  return count;
}

function deriveFreshnessStatus(
  source: RegulationSource,
  latestCheck: SourceHealthCheck | null,
  descriptor: MonitoringDescriptorLike,
  lastSuccessfulAt: string | null,
  now: Date,
): SourceRuntimeHealthSummary["freshnessStatus"] {
  if (!source.active) return "source_inaccessible";
  if (latestCheck) {
    const hours = hoursSince(latestCheck.checkedAt, now);
    if (
      latestCheck.runtimeAccessible === false ||
      latestCheck.activeRecommendation === "inactive"
    ) {
      return "source_inaccessible";
    }
    if (hours === null) return "due_for_refresh";
    if (hours <= descriptor.freshHours) return "fresh";
    if (hours > descriptor.staleHours) return "stale";
    return "due_for_refresh";
  }
  if (!lastSuccessfulAt) {
    return "awaiting_first_success";
  }

  const hours = hoursSince(lastSuccessfulAt, now);
  if (hours === null) return "awaiting_first_success";
  if (hours <= descriptor.freshHours) return "fresh";
  if (hours > descriptor.staleHours) return "stale";
  return "due_for_refresh";
}

function deriveState(input: {
  source: RegulationSource;
  freshnessStatus: SourceRuntimeHealthSummary["freshnessStatus"];
  consecutiveFailures: number;
  latestCheck: SourceHealthCheck | null;
}) {
  const { source, freshnessStatus, consecutiveFailures, latestCheck } = input;
  if (!source.active) return "inactive" as const;
  if (
    freshnessStatus === "stale" ||
    freshnessStatus === "source_inaccessible" ||
    consecutiveFailures >= 3
  ) {
    return "stale" as const;
  }
  if (
    freshnessStatus === "due_for_refresh" ||
    freshnessStatus === "awaiting_first_success" ||
    consecutiveFailures > 0 ||
    latestCheck?.parserStatus === "needs_attention" ||
    latestCheck?.parserStatus === "warnings_present"
  ) {
    return "degraded" as const;
  }
  return "healthy" as const;
}

function buildReasons(input: {
  source: RegulationSource;
  freshnessStatus: SourceRuntimeHealthSummary["freshnessStatus"];
  consecutiveFailures: number;
  latestCheck: SourceHealthCheck | null;
  latestFailureMessage: string | null;
}) {
  const reasons: string[] = [];
  const { source, freshnessStatus, consecutiveFailures, latestCheck, latestFailureMessage } = input;

  if (!source.active) reasons.push("Source is intentionally inactive.");
  if (freshnessStatus === "awaiting_first_success") reasons.push("No successful source run is recorded yet.");
  if (freshnessStatus === "due_for_refresh") reasons.push("Source should be refreshed soon for its expected cadence.");
  if (freshnessStatus === "stale") reasons.push("Last successful source signal is beyond the stale threshold.");
  if (freshnessStatus === "source_inaccessible") reasons.push("Latest source check reported inaccessibility or inactivity.");
  if (consecutiveFailures > 0) {
    reasons.push(`Consecutive failures: ${consecutiveFailures}.`);
  }
  if (latestCheck?.parserStatus === "warnings_present") {
    reasons.push("Latest check reported parser warnings.");
  }
  if (latestCheck?.parserStatus === "needs_attention") {
    reasons.push("Latest check reported parser attention required.");
  }
  if (latestFailureMessage) {
    reasons.push(latestFailureMessage);
  }

  return reasons;
}

export function buildSourceExecutionDecisions(
  input: SourceRuntimeHealthInput,
): SourceExecutionDecision[] {
  const now = input.now ?? new Date();
  const nowTimestamp = now.getTime();

  return buildSourceRuntimeHealthSummaries(input).map((summary) => {
    const baseCadenceMs = parseCadenceToMs(summary.recommendedCadence);
    const latestAttemptTimestamp = getMostRecentTimestamp(
      summary.lastScanJobAt,
      summary.lastCheckedAt,
      summary.lastFailureAt,
      summary.lastSuccessfulAt,
    );

    if (latestAttemptTimestamp === null) {
      return {
        sourceId: summary.sourceId,
        shouldScan: true,
        decision: "scan_now",
        reason: null,
        recommendedCadence: summary.recommendedCadence,
        consecutiveFailures: summary.consecutiveFailures,
        nextEligibleAt: null,
      } satisfies SourceExecutionDecision;
    }

    if (summary.consecutiveFailures >= 3) {
      const circuitCooldownMs = Math.min(
        Math.max(baseCadenceMs * 4, 6 * 60 * 60 * 1000),
        48 * 60 * 60 * 1000,
      );
      const nextEligibleTimestamp = latestAttemptTimestamp + circuitCooldownMs;

      if (nowTimestamp < nextEligibleTimestamp) {
        const nextEligibleAt = new Date(nextEligibleTimestamp).toISOString();
        return {
          sourceId: summary.sourceId,
          shouldScan: false,
          decision: "skip_circuit_open",
          reason:
            `Scheduled scan skipped while the source circuit is open after ${summary.consecutiveFailures} consecutive failures. Next eligible retry: ${nextEligibleAt}.`,
          recommendedCadence: summary.recommendedCadence,
          consecutiveFailures: summary.consecutiveFailures,
          nextEligibleAt,
        } satisfies SourceExecutionDecision;
      }
    }

    const waitMultiplier =
      summary.consecutiveFailures > 0
        ? 2 ** Math.max(0, summary.consecutiveFailures - 1)
        : 1;
    const nextEligibleTimestamp = latestAttemptTimestamp + baseCadenceMs * waitMultiplier;

    if (nowTimestamp < nextEligibleTimestamp) {
      const nextEligibleAt = new Date(nextEligibleTimestamp).toISOString();
      return {
        sourceId: summary.sourceId,
        shouldScan: false,
        decision:
          summary.consecutiveFailures > 0 ? "skip_backoff" : "skip_until_due",
        reason:
          summary.consecutiveFailures > 0
            ? `Scheduled scan skipped because the source is backing off after ${summary.consecutiveFailures} consecutive failures. Next eligible retry: ${nextEligibleAt}.`
            : `Scheduled scan skipped because the source is not due yet for its ${summary.recommendedCadence} cadence. Next eligible retry: ${nextEligibleAt}.`,
        recommendedCadence: summary.recommendedCadence,
        consecutiveFailures: summary.consecutiveFailures,
        nextEligibleAt,
      } satisfies SourceExecutionDecision;
    }

    return {
      sourceId: summary.sourceId,
      shouldScan: true,
      decision: "scan_now",
      reason: null,
      recommendedCadence: summary.recommendedCadence,
      consecutiveFailures: summary.consecutiveFailures,
      nextEligibleAt: null,
    } satisfies SourceExecutionDecision;
  });
}

export function buildSourceRuntimeHealthSummaries(
  input: SourceRuntimeHealthInput,
): SourceRuntimeHealthSummary[] {
  const now = input.now ?? new Date();
  const latestCheckBySource = getLatestBySourceId(input.sourceHealthChecks, "checkedAt");
  const latestLogBySource = getLatestBySourceId(input.scanLogs, "scanFinishedAt");
  const latestScanJobBySource = getLatestScanJobsBySource(input.scanJobs);
  const attemptsBySource = getAttemptSummariesBySource(input.scanLogs, input.ingestionLogs);

  return input.sources.map((source) => {
    const descriptor = getSourceDescriptor(source);
    const latestCheck = latestCheckBySource.get(source.id) ?? null;
    const latestLog = latestLogBySource.get(source.id) ?? null;
    const latestScanJob = latestScanJobBySource.get(source.id) ?? null;
    const attempts = attemptsBySource.get(source.id) ?? [];
    const latestSuccessfulAt =
      source.lastSuccessfulScanAt ??
      attempts.find((attempt) => attempt.status === "success" || attempt.status === "partial_success")
        ?.finishedAt ??
      null;
    const latestFailure = attempts.find((attempt) => attempt.status === "failed") ?? null;
    const freshnessStatus = deriveFreshnessStatus(
      source,
      latestCheck,
      descriptor,
      latestSuccessfulAt,
      now,
    );
    const consecutiveFailures = countConsecutiveFailures(attempts);
    const latestFailureMessage =
      latestFailure?.failureMessage ??
      latestCheck?.accessibilityIssue ??
      latestLog?.errors.find(Boolean) ??
      null;
    const state = deriveState({
      source,
      freshnessStatus,
      consecutiveFailures,
      latestCheck,
    });

    return {
      sourceId: source.id,
      sourceName: source.name,
      jurisdiction: source.jurisdiction,
      active: source.active,
      state,
      priorityBand: descriptor.priorityBand,
      recommendedCadence: descriptor.recommendedCadence,
      freshHours: descriptor.freshHours,
      staleHours: descriptor.staleHours,
      freshnessStatus,
      lastCheckedAt: latestCheck?.checkedAt ?? source.lastScannedAt ?? null,
      lastSuccessfulAt: latestSuccessfulAt,
      lastFailureAt: source.lastFailedScanAt ?? latestFailure?.finishedAt ?? null,
      lastScanJobAt: latestScanJob
        ? latestScanJob.finishedAt ??
          latestScanJob.updatedAt ??
          latestScanJob.startedAt ??
          latestScanJob.createdAt
        : null,
      lastScanJobStatus: latestScanJob?.status ?? null,
      hoursSinceSuccess: roundHours(hoursSince(latestSuccessfulAt, now)),
      consecutiveFailures,
      latestResponseStatus:
        latestCheck?.responseStatus ?? source.latestResponseStatus ?? null,
      latestParserStatus: latestCheck?.parserStatus ?? null,
      latestFailureMessage,
      reasons: buildReasons({
        source,
        freshnessStatus,
        consecutiveFailures,
        latestCheck,
        latestFailureMessage,
      }),
    } satisfies SourceRuntimeHealthSummary;
  }).sort((a, b) => {
    const stateRank = (value: SourceRuntimeHealthState) =>
      value === "stale" ? 0 : value === "degraded" ? 1 : value === "healthy" ? 2 : 3;
    const priorityRank = (value: SourceRuntimeHealthSummary["priorityBand"]) =>
      value === "high" ? 0 : value === "medium" ? 1 : 2;

    return (
      stateRank(a.state) - stateRank(b.state) ||
      priorityRank(a.priorityBand) - priorityRank(b.priorityBand) ||
      a.sourceName.localeCompare(b.sourceName)
    );
  });
}

export async function getSourceRuntimeHealthSummaries(options?: {
  now?: Date;
  limitPerCollection?: number;
}) {
  const limit = options?.limitPerCollection ?? 500;
  const [sources, sourceHealthChecks, scanLogs, scanJobs, ingestionLogs] = await Promise.all([
    updateRepository.getSources(),
    updateRepository.getSourceHealthChecks(undefined, limit),
    updateRepository.getScanLogs(limit),
    updateRepository.getScanJobs(limit),
    updateRepository.getIngestionLogs(undefined, limit),
  ]);

  return buildSourceRuntimeHealthSummaries({
    sources,
    sourceHealthChecks,
    scanLogs,
    scanJobs,
    ingestionLogs,
    now: options?.now,
  });
}
