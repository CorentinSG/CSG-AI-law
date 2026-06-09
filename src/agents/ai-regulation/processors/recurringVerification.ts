import type { RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import {
  buildInitialVerificationMetadata,
  extractVerificationMetadata,
  suggestVerificationSource,
  type VerificationMetadata,
  type VerificationStatus,
} from "@/agents/ai-regulation/verification";
import {
  extractDiscoveryLeadMetadata,
  isDiscoveryOnlySource,
} from "@/agents/ai-regulation/utils/discovery";
import {
  loadDiscoveryLeadRecords,
  type DiscoveryLeadRecord,
} from "@/agents/ai-regulation/utils/discovery-lead-records";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getAiRegulationRepository } from "@/db/repository";

const staleAfterMs = 45 * 24 * 60 * 60 * 1000;

export interface RecurringVerificationSummary {
  checked: number;
  officialSourceFound: number;
  needsOfficialSource: number;
  stale: number;
}

function statusFromVerification(verification: VerificationMetadata): VerificationStatus {
  if (!verification.officialSourceFound) return "needs_official_source";
  if (verification.corroboratingSourcesCount > 0) return "corroborated";
  return "official_source_found";
}

async function checkUrlReachable(url: string | null) {
  if (!url) {
    return { reachable: false, responseStatus: null, error: "No URL provided." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "C-Saint-Girons-AI-Regulation-Monitor/0.1 (verification-check)",
      },
      signal: controller.signal,
    });

    return {
      reachable: response.ok,
      responseStatus: response.status,
      error: response.ok ? null : `Verification URL returned ${response.status}.`,
    };
  } catch (error) {
    return {
      reachable: false,
      responseStatus: null,
      error: error instanceof Error ? error.message : "Unknown verification request error.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkCandidateUrls(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean))).slice(0, 3);
  const results = await Promise.all(
    uniqueUrls.map(async (url) => ({
      url,
      ...(await checkUrlReachable(url)),
    })),
  );
  return results;
}

function shouldReverify(rawItem: RawRegulatoryItem, source: RegulationSource) {
  if (!isDiscoveryOnlySource(source)) return false;

  const verification = extractVerificationMetadata(rawItem);
  if (!verification) return true;
  if (verification.verificationStatus === "rejected") return false;
  if (verification.verificationStatus === "published") return false;
  if (verification.verificationStatus === "verified_for_review") return false;

  return true;
}

function shouldReverifyLeadRecord(record: DiscoveryLeadRecord) {
  if (!record.source || !isDiscoveryOnlySource(record.source)) return false;
  if (record.lead.status === "rejected") return false;
  if (record.lead.status === "converted_to_monitor_item") return false;
  if (record.verification?.verificationStatus === "published") return false;
  if (record.verification?.verificationStatus === "verified_for_review") return false;
  return true;
}

function mergeVerificationMetadata(input: {
  rawItem: RawRegulatoryItem;
  source: RegulationSource;
  now: string;
  officialReachable: boolean;
  officialResponseStatus: number | null;
  officialError: string | null;
  corroboratingUrls: string[];
}) {
  const existing =
    extractVerificationMetadata(input.rawItem) ??
    buildInitialVerificationMetadata({ rawItem: input.rawItem, source: input.source });
  const discovery = extractDiscoveryLeadMetadata(input.rawItem);
  const officialSourceUrl = existing.officialSourceUrl ?? discovery?.possibleOfficialSourceUrl ?? null;
  const detectedAtMs = Date.parse(input.rawItem.detectedAt);
  const stale = Number.isFinite(detectedAtMs)
    ? Date.now() - detectedAtMs > staleAfterMs && !input.officialReachable
    : false;
  const officialSourceFound = Boolean(officialSourceUrl && input.officialReachable);
  const corroboratingSourceUrls = input.corroboratingUrls;
  const verification: VerificationMetadata = {
    ...existing,
    lastVerifiedAt: input.now,
    officialSourceFound,
    officialSourceUrl,
    verificationStatus: statusFromVerification({
      ...existing,
      officialSourceFound,
      officialSourceUrl,
    }),
    confidenceLevel: officialSourceFound ? "medium" : "low",
    corroboratingSourcesCount: corroboratingSourceUrls.length,
    corroboratingSourceUrls,
    publicVisibilityAllowed: false,
    reviewerNotes: officialSourceFound
      ? corroboratingSourceUrls.length > 0
        ? "Possible official source and corroborating source responded successfully. Human review is still required before conversion."
        : "Possible official source responded successfully. Human review and corroboration are still required before conversion."
      : `Official source confirmation is still missing. ${input.officialError ?? "No official source candidate was available."}`,
    nextSuggestedVerificationSource: suggestVerificationSource({
      possibleJurisdiction: discovery?.possibleJurisdiction ?? input.source.jurisdiction,
      possibleTopic: discovery?.possibleTopic ?? null,
      sourceCountry: input.source.country,
    }),
    notPublishableReason: officialSourceFound
      ? "Official source candidate found, but discovery item still requires human review and conversion through an official-source-backed workflow."
      : "No verified official source is available yet.",
    stale,
  };

  return {
    verification,
    verificationAttempt: {
      attemptedAt: input.now,
      checkedUrl: officialSourceUrl,
      sourceChecked: input.source.name,
      sourceType: input.source.config?.sourceCategory ?? input.source.sourceType,
      result: verification.verificationStatus,
      responseStatus: input.officialResponseStatus,
      officialSourceFound,
      error: input.officialError,
    },
  };
}

function buildSyntheticRawItem(
  record: DiscoveryLeadRecord,
  source: RegulationSource,
): RawRegulatoryItem {
  return {
    id: record.rawItem?.id ?? record.lead.rawItemId ?? `synthetic-${record.lead.id}`,
    sourceId: source.id,
    rawTitle: record.lead.headline,
    rawUrl: record.lead.discoverySourceUrl,
    rawText: record.lead.headline,
    rawMetadata: {},
    detectedAt: record.lead.detectedAt,
    hash: record.rawItem?.hash ?? `synthetic-${record.lead.id}`,
    duplicateOf: null,
    processingStatus: "new",
    createdAt: record.rawItem?.createdAt ?? record.lead.createdAt,
    updatedAt: record.rawItem?.updatedAt ?? record.lead.updatedAt,
  };
}

function buildFallbackVerificationMetadata(
  record: DiscoveryLeadRecord,
  source: RegulationSource,
): VerificationMetadata {
  return {
    initialDetectionSource: source.name,
    initialSourceOfficial: false,
    initialSourceType: String(source.config?.sourceCategory ?? source.sourceType),
    sourceUrl: record.lead.discoverySourceUrl,
    detectedAt: record.lead.detectedAt,
    lastVerifiedAt: record.lead.lastVerifiedAt,
    verificationStatus:
      record.lead.status === "corroborated"
        ? "corroborated"
        : record.lead.status === "official_source_found"
          ? "official_source_found"
          : "needs_official_source",
    officialSourceFound: record.lead.officialSourceFound,
    officialSourceUrl: record.lead.officialSourceUrl,
    corroboratingSourcesCount: record.lead.corroboratingSourceCount,
    corroboratingSourceUrls: record.lead.corroboratingSourceUrls,
    confidenceLevel: record.lead.officialSourceFound ? "medium" : "low",
    reviewerNotes:
      record.lead.reviewerNotes ??
      "Non-official discovery lead. Keep private until an official source is verified and corroboration is reviewed.",
    publicVisibilityAllowed: false,
    nextSuggestedVerificationSource: suggestVerificationSource({
      possibleJurisdiction: record.lead.possibleJurisdiction,
      possibleTopic: record.lead.possibleTopic,
      sourceCountry: source.country,
    }),
    notPublishableReason:
      "Discovery/media/secondary source cannot support publication without official-source verification and human review.",
    stale: record.lead.status === "stale",
  };
}

export async function runRecurringVerification(options?: {
  limit?: number;
  sourceFilter?: (source: RegulationSource) => boolean;
  rawItemFilter?: (rawItem: RawRegulatoryItem, source: RegulationSource) => boolean;
}): Promise<RecurringVerificationSummary> {
  const limit = options?.limit ?? 30;
  const candidates = (await loadDiscoveryLeadRecords({ limit: 200 }))
    .filter((record) => {
      if (!record.source) return false;
      if (options?.sourceFilter && !options.sourceFilter(record.source)) return false;
      if (
        options?.rawItemFilter &&
        record.rawItem &&
        !options.rawItemFilter(record.rawItem, record.source)
      ) {
        return false;
      }
      if (options?.rawItemFilter && !record.rawItem && record.storageMode === "dedicated") {
        return false;
      }
      if (record.storageMode === "legacy_raw_item" && record.rawItem) {
        return shouldReverify(record.rawItem, record.source);
      }
      return shouldReverifyLeadRecord(record);
    })
    .slice(0, limit);

  const summary: RecurringVerificationSummary = {
    checked: 0,
    officialSourceFound: 0,
    needsOfficialSource: 0,
    stale: 0,
  };
  const repository = getAiRegulationRepository();

  for (const record of candidates) {
    const source = record.source;
    if (!source) continue;

    const rawItem = record.rawItem ?? buildSyntheticRawItem(record, source);
    const existing =
      extractVerificationMetadata(rawItem) ??
      record.verification ??
      buildFallbackVerificationMetadata(record, source);
    const officialCheck = await checkUrlReachable(existing.officialSourceUrl);
    const discovery = extractDiscoveryLeadMetadata(rawItem);
    const corroborationCandidates = [
      ...(existing.corroboratingSourceUrls ?? []),
      ...(discovery?.corroboratingSourceUrl ? [discovery.corroboratingSourceUrl] : []),
      ...record.lead.corroboratingSourceUrls,
    ];
    const corroborationChecks = await checkCandidateUrls(corroborationCandidates);
    const now = new Date().toISOString();
    const { verification, verificationAttempt } = mergeVerificationMetadata({
      rawItem,
      source,
      now,
      officialReachable: officialCheck.reachable,
      officialResponseStatus: officialCheck.responseStatus,
      officialError: officialCheck.error,
      corroboratingUrls: corroborationChecks
        .filter((check) => check.reachable)
        .map((check) => check.url),
    });

    if (record.rawItem) {
      await updateRepository.updateRawItemMetadata(record.rawItem.id, {
        ...record.rawItem.rawMetadata,
        verification,
        verificationAttempts: [
          ...((Array.isArray(record.rawItem.rawMetadata.verificationAttempts)
            ? record.rawItem.rawMetadata.verificationAttempts
            : []) as unknown[]).slice(-9),
          verificationAttempt,
          ...corroborationChecks.map((check) => ({
            attemptedAt: now,
            checkedUrl: check.url,
            sourceChecked: source.name,
            sourceType: source.config?.sourceCategory ?? source.sourceType,
            result: check.reachable ? "corroborated" : "needs_official_source",
            responseStatus: check.responseStatus,
            officialSourceFound: false,
            error: check.error,
          })),
        ],
        discoveryVerificationStatus: verification.verificationStatus,
        discoveryConversionStatus:
          verification.verificationStatus === "corroborated"
            ? "official_source_found"
            : "needs_verification",
        possibleOfficialSourceFound: verification.officialSourceFound,
        possibleOfficialSourceUrl: verification.officialSourceUrl,
        corroboratingSourceFound: verification.corroboratingSourcesCount > 0,
        corroboratingSourceUrls: verification.corroboratingSourceUrls,
      });

      await updateRepository.addVerificationAttempt({
        rawItemId: record.rawItem.id,
        sourceReferenceId: null,
        sourceName: verificationAttempt.sourceChecked,
        sourceUrl: verificationAttempt.checkedUrl ?? record.rawItem.rawUrl,
        sourceType: String(verificationAttempt.sourceType),
        attemptType: "recurring_verification",
        resultStatus: String(verificationAttempt.result),
        responseStatus: verificationAttempt.responseStatus,
        officialSourceFound: verificationAttempt.officialSourceFound,
        officialSourceUrl: verification.officialSourceUrl,
        notes: verificationAttempt.error ?? verification.reviewerNotes,
        attemptedAt: verificationAttempt.attemptedAt,
      });
      await Promise.all(
        corroborationChecks.map((check) =>
          updateRepository.addVerificationAttempt({
            rawItemId: record.rawItem!.id,
            sourceReferenceId: null,
            sourceName: source.name,
            sourceUrl: check.url,
            sourceType: String(source.config?.sourceCategory ?? source.sourceType),
            attemptType: "corroboration_check",
            resultStatus: check.reachable ? "corroborated" : "needs_official_source",
            responseStatus: check.responseStatus,
            officialSourceFound: false,
            officialSourceUrl: null,
            notes: check.error,
            attemptedAt: now,
          }),
        ),
      );
    }

    if (record.storageMode === "dedicated") {
      await repository.updateDiscoveryLead(record.lead.id, {
        status:
          verification.verificationStatus === "corroborated"
            ? "corroborated"
            : verification.officialSourceFound
              ? "official_source_found"
              : verification.stale
                ? "stale"
                : "unresolved",
        officialSourceFound: verification.officialSourceFound,
        officialSourceUrl: verification.officialSourceUrl,
        corroboratingSourceCount: verification.corroboratingSourcesCount,
        corroboratingSourceUrls: verification.corroboratingSourceUrls,
        reviewerNotes: verification.reviewerNotes,
        lastVerifiedAt: verification.lastVerifiedAt,
        staleAt: verification.stale ? now : null,
        publicVisibilityAllowed: false,
      });
    }

    await updateRepository.addProcessingLog({
      rawItemId: record.rawItem?.id ?? record.lead.rawItemId ?? record.lead.id,
      regulatoryUpdateId: null,
      modelUsed: "recurring-verification-agent",
      promptVersion: "cross-source-verification.v1",
      processingStartedAt: now,
      processingFinishedAt: new Date().toISOString(),
      status: verification.officialSourceFound ? "success" : "skipped",
      errorMessage: [
        `verification_status=${verification.verificationStatus}`,
        `source_checked=${source.name}`,
        `source_type=${source.config?.sourceCategory ?? source.sourceType}`,
        `official_source_found=${verification.officialSourceFound ? "yes" : "no"}`,
        `corroborating_sources_found=${verification.corroboratingSourcesCount}`,
        `response_status=${officialCheck.responseStatus ?? "n/a"}`,
        verification.notPublishableReason
          ? `not_publishable_reason=${verification.notPublishableReason}`
          : null,
      ]
        .filter(Boolean)
        .join(" | "),
    });

    summary.checked += 1;
    if (verification.officialSourceFound) summary.officialSourceFound += 1;
    if (!verification.officialSourceFound) summary.needsOfficialSource += 1;
    if (verification.stale) summary.stale += 1;
  }

  return summary;
}
