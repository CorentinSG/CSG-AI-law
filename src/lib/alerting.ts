import type { ScanJob } from "@/agents/ai-regulation/governance";
import {
  buildSourceRuntimeHealthSummaries,
  type SourceRuntimeHealthState,
} from "@/agents/ai-regulation/sourceRuntimeHealth";
import type { RegulationScanLog, RegulationSource } from "@/agents/ai-regulation/types";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { env } from "@/lib/env";

const DEFAULT_ALERT_TIMEOUT_MS = 2_000;
const CONSECUTIVE_FAILURE_ALERT_THRESHOLD = 3;
const DIGEST_SOURCE_ID = "ops-alerting";

type AlertKind =
  | "source_runtime_state"
  | "source_consecutive_failures"
  | "review_backlog_digest";
type AlertScanTrigger = "manual" | "scheduled" | "scheduled_local_test";

export interface AlertPayload {
  kind: AlertKind;
  emittedAt: string;
  sourceId?: string;
  sourceName?: string;
  previousState?: SourceRuntimeHealthState | "unknown";
  currentState?: SourceRuntimeHealthState;
  scanStatus?: RegulationScanLog["status"];
  trigger?: AlertScanTrigger;
  scanProfile?: string;
  scanJobId?: string | null;
  consecutiveFailures?: number;
  responseStatus?: number | null;
  checkedAt?: string;
  needsReviewBacklogSize?: number;
}

export async function postAlertPayload(
  payload: AlertPayload,
  options?: {
    webhookUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  },
) {
  const webhookUrl = options?.webhookUrl ?? env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return { attempted: false, ok: true, status: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options?.timeoutMs ?? DEFAULT_ALERT_TIMEOUT_MS,
  );

  try {
    const fetchImpl = options?.fetchImpl ?? fetch;
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return {
      attempted: true,
      ok: response.ok,
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function safePostAlert(payload: AlertPayload) {
  try {
    await postAlertPayload(payload);
  } catch {
    // Alert delivery is best-effort and must never fail a scan.
  }
}

function latestByCheckedAt(records: RegulationScanLog[]) {
  return [...records].sort((a, b) => b.scanFinishedAt.localeCompare(a.scanFinishedAt));
}

function countConsecutiveFailures(scanLogs: RegulationScanLog[]) {
  let count = 0;
  for (const log of latestByCheckedAt(scanLogs)) {
    if (log.status === "failed") {
      count += 1;
      continue;
    }
    break;
  }
  return count;
}

function getPreviousState(source: RegulationSource): SourceRuntimeHealthState | "unknown" {
  if (!source.active) return "inactive";
  if (source.latestAccessibilityIssue || source.latestResponseStatus && source.latestResponseStatus >= 400) {
    return "stale";
  }
  if ((source.latestParserWarnings ?? []).length > 0 || source.lastFailedScanAt) {
    return "degraded";
  }
  if (source.lastSuccessfulScanAt) {
    return "healthy";
  }
  return "unknown";
}

export async function alertOnSourceScanFinalized(input: {
  sourceBeforeUpdate: RegulationSource;
  scanStatus: RegulationScanLog["status"];
  trigger: AlertScanTrigger;
  scanProfile: string;
  scanJobId: string | null;
  responseStatus: number | null;
  checkedAt: string;
}) {
  try {
    const [sourceAfterUpdate, sourceHealthChecks, scanLogs, scanJobs, ingestionLogs] =
      await Promise.all([
        updateRepository.getSource(input.sourceBeforeUpdate.id),
        updateRepository.getSourceHealthChecks(input.sourceBeforeUpdate.id, 20),
        updateRepository.getScanLogsBySource(input.sourceBeforeUpdate.id, 20),
        updateRepository.getScanJobs(100),
        updateRepository.getIngestionLogs(input.sourceBeforeUpdate.id, 20),
      ]);

    if (!sourceAfterUpdate) {
      return;
    }

    const summary = buildSourceRuntimeHealthSummaries({
      sources: [sourceAfterUpdate],
      sourceHealthChecks,
      scanLogs,
      scanJobs,
      ingestionLogs,
    })[0];
    if (!summary) {
      return;
    }

    const previousState = getPreviousState(input.sourceBeforeUpdate);
    const currentState = summary.state;
    if (
      (currentState === "stale" || currentState === "degraded") &&
      previousState !== currentState
    ) {
      void safePostAlert({
        kind: "source_runtime_state",
        emittedAt: new Date().toISOString(),
        sourceId: summary.sourceId,
        sourceName: summary.sourceName,
        previousState,
        currentState,
        scanStatus: input.scanStatus,
        trigger: input.trigger,
        scanProfile: input.scanProfile,
        scanJobId: input.scanJobId,
        consecutiveFailures: summary.consecutiveFailures,
        responseStatus: input.responseStatus,
        checkedAt: input.checkedAt,
      });
    }

    const consecutiveFailures = countConsecutiveFailures(scanLogs);
    if (consecutiveFailures >= CONSECUTIVE_FAILURE_ALERT_THRESHOLD) {
      void safePostAlert({
        kind: "source_consecutive_failures",
        emittedAt: new Date().toISOString(),
        sourceId: summary.sourceId,
        sourceName: summary.sourceName,
        currentState,
        scanStatus: input.scanStatus,
        trigger: input.trigger,
        scanProfile: input.scanProfile,
        scanJobId: input.scanJobId,
        consecutiveFailures,
        responseStatus: input.responseStatus,
        checkedAt: input.checkedAt,
      });
    }
  } catch {
    // Alert evaluation is best-effort and must never fail a scan.
  }
}

function digestMarkerForDate(dateIso: string) {
  return `alert_digest_sent=${dateIso.slice(0, 10)}`;
}

async function hasDigestMarker(dateIso: string) {
  const marker = digestMarkerForDate(dateIso);
  const logs = await updateRepository.getScanLogsBySource(DIGEST_SOURCE_ID, 20);
  return logs.some((log) => log.errors.includes(marker));
}

export async function alertOnDailyReviewBacklog(input: {
  job: ScanJob;
  needsReviewBacklogSize: number;
}) {
  try {
    if (input.needsReviewBacklogSize <= 0) {
      return;
    }

    const emittedAt = new Date().toISOString();
    if (await hasDigestMarker(emittedAt)) {
      return;
    }

    void safePostAlert({
      kind: "review_backlog_digest",
      emittedAt,
      scanJobId: input.job.id,
      trigger: input.job.trigger as AlertScanTrigger,
      scanProfile:
        typeof input.job.resultSummary?.scanProfile === "string"
          ? input.job.resultSummary.scanProfile
          : "default",
      needsReviewBacklogSize: input.needsReviewBacklogSize,
    });

    await updateRepository.addScanLog({
      sourceId: DIGEST_SOURCE_ID,
      scanStartedAt: emittedAt,
      scanFinishedAt: emittedAt,
      status: "success",
      itemsFound: 0,
      newItemsDetected: 0,
      duplicatesDetected: 0,
      errors: [digestMarkerForDate(emittedAt)],
    });
  } catch {
    // Digest alerting and marker writes are best-effort.
  }
}
