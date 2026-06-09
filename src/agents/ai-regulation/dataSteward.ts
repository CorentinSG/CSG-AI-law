import {
  assessCitationQuality,
  getCitationReferences,
} from "@/agents/ai-regulation/citations";
import { buildUsCoverageDiagnostics, buildEuropeCoverageDiagnostics, type CoverageFinding } from "@/agents/ai-regulation/coverageDiagnostics";
import { type DataQualityAssessment, type ReviewPriority } from "@/agents/ai-regulation/dataQuality";
import { assessFreshness } from "@/agents/ai-regulation/freshness";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { parseScanDiagnostics } from "@/app/admin/ai-regulation/diagnostics";
import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { extractDiscoveryLeadMetadata, isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import { extractVerificationMetadata } from "@/agents/ai-regulation/verification";
import {
  sourceVerificationRecords,
  type SourceVerificationRecord,
} from "@/content/ai-regulation/source-verification";
import type { DataQualityFindingInput } from "@/agents/ai-regulation/governance";
import type { DiscoveryLead } from "@/agents/ai-regulation/governance";
import type { DiscoveryLeadRecord } from "@/agents/ai-regulation/utils/discovery-lead-records";

export interface ReviewQueueItem {
  id: string;
  priority: ReviewPriority;
  area: "source" | "europe" | "united_states" | "citation" | "discovery" | "scan";
  entityType: string;
  title: string;
  reason: string;
  suggestedAction: string;
  href?: string;
  quality?: DataQualityAssessment;
}

export interface SourceStewardFinding {
  sourceId: string;
  sourceName: string;
  active: boolean;
  freshnessStatus: string;
  lastReviewedAt: string | null;
  latestResponseStatus: number | null;
  latestScanStatus: RegulationScanLog["status"] | "not_scanned";
  itemsFetched: number | null;
  newItemsDetected: number;
  duplicatesDetected: number;
  parserWarnings: string[];
  accessibilityWarnings: string[];
  reliabilityNotes: string[];
  reviewPriority: ReviewPriority;
}

export interface CitationStewardFinding {
  updateId: string;
  title: string;
  status: AiRegulatoryUpdate["status"];
  region: string | null;
  jurisdiction: string | null;
  citationQuality: string;
  publicationEligible: boolean;
  warnings: string[];
  sourceCount: number;
  href: string;
}

export interface DiscoveryStewardFinding {
  discoveryLeadId: string;
  rawItemId: string;
  headline: string;
  detectedAt: string;
  discoverySourceUrl: string;
  outboundUrl: string;
  verificationStatus: string;
  officialSourceFound: boolean;
  corroboratingSourceCount: number;
  publicVisibilityAllowed: boolean;
  reviewerNotes: string;
  reviewPriority: ReviewPriority;
}

export interface LegalIntelligenceDataStewardReport {
  generatedAt: string;
  summary: {
    sourceFindings: number;
    sourceAttention: number;
    europeCoverageFindings: number;
    usCoverageFindings: number;
    citationWarnings: number;
    discoveryLeadsNeedingVerification: number;
    highPriorityReviewItems: number;
    staleOrDueCoverageItems: number;
    europeMaintenanceItems: number;
  };
  latestScheduledScan: RegulationScanLog | null;
  sources: SourceStewardFinding[];
  europeCoverage: CoverageFinding[];
  usCoverage: CoverageFinding[];
  citationFindings: CitationStewardFinding[];
  discoveryFindings: DiscoveryStewardFinding[];
  reviewQueue: ReviewQueueItem[];
  europeMaintenanceQueue: ReviewQueueItem[];
}

function priorityRank(priority: ReviewPriority) {
  return priority === "high" ? 0 : priority === "medium" ? 1 : 2;
}

function severityFromPriority(priority: ReviewPriority): "high" | "medium" | "low" {
  return priority === "high" ? "high" : priority === "medium" ? "medium" : "low";
}

function latestLogForSource(sourceId: string, scanLogs: RegulationScanLog[]) {
  return scanLogs.find((log) => log.sourceId === sourceId) ?? null;
}

function verificationRecordForSource(sourceId: string): SourceVerificationRecord | null {
  return sourceVerificationRecords.find((record) => record.sourceId === sourceId) ?? null;
}

function findLatestScheduledScan(scanLogs: RegulationScanLog[]) {
  return (
    scanLogs.find((log) =>
      log.errors.some((entry) => /scan_trigger=(scheduled|scheduled_local_test)/.test(entry)),
    ) ?? null
  );
}

function buildSourceFindings(
  sources: RegulationSource[],
  scanLogs: RegulationScanLog[],
): SourceStewardFinding[] {
  return sources.map((source) => {
    const latestLog = latestLogForSource(source.id, scanLogs);
    const diagnostics = parseScanDiagnostics(latestLog);
    const verification = verificationRecordForSource(source.id);
    const accessibilityWarnings = [
      ...(!source.active ? ["Source is inactive and skipped by daily scans."] : []),
      ...(verification && !verification.runtimeAccessible ? [verification.note] : []),
      ...(verification && verification.recommendation === "inactive"
        ? ["Verification registry recommends inactive monitoring."]
        : []),
    ];
    const parserWarnings = [
      ...diagnostics.warnings,
      ...(verification?.requiresDedicatedParser ? ["Source requires a dedicated parser."] : []),
      ...(source.latestParserWarnings ?? []),
    ];
    const sourceAccessible =
      source.latestAccessibilityIssue
        ? false
        : verification
          ? verification.runtimeAccessible
          : null;
    const freshness = assessFreshness({
      lastReviewedAt: source.lastSuccessfulScanAt ?? source.lastScannedAt,
      policy: "active_source",
      sourceAccessible,
    });
    const reviewPriority: ReviewPriority =
      source.active && verification && !verification.runtimeAccessible
        ? "high"
        : freshness.status === "source_inaccessible" || freshness.status === "stale"
          ? "high"
        : source.active && latestLog?.status === "failed"
          ? "high"
          : parserWarnings.length > 0 || accessibilityWarnings.length > 0
            ? "medium"
            : "low";

    return {
      sourceId: source.id,
      sourceName: source.name,
      active: source.active,
      freshnessStatus: freshness.status,
      lastReviewedAt: source.lastSuccessfulScanAt ?? source.lastScannedAt,
      latestResponseStatus: diagnostics.sourceResponseStatus ?? verification?.responseStatus ?? null,
      latestScanStatus: latestLog?.status ?? "not_scanned",
      itemsFetched: diagnostics.itemsFetched ?? source.latestItemsFetched ?? null,
      newItemsDetected: latestLog?.newItemsDetected ?? source.latestNewItemsDetected ?? 0,
      duplicatesDetected: latestLog?.duplicatesDetected ?? source.latestDuplicatesDetected ?? 0,
      parserWarnings,
      accessibilityWarnings: [
        ...accessibilityWarnings,
        ...(source.latestAccessibilityIssue ? [source.latestAccessibilityIssue] : []),
        ...freshness.warnings,
      ],
      reliabilityNotes: [
        source.notes,
        source.sourceReliabilityNotes,
        verification?.note,
      ].filter(Boolean) as string[],
      reviewPriority,
    };
  });
}

function buildCitationFindings(input: {
  updates: AiRegulatoryUpdate[];
  rawItems: RawRegulatoryItem[];
  sources: RegulationSource[];
}): CitationStewardFinding[] {
  const rawById = new Map(input.rawItems.map((item) => [item.id, item]));
  const sourceById = new Map(input.sources.map((source) => [source.id, source]));

  return input.updates
    .map((update) => {
      const references = getCitationReferences({
        update,
        rawItem: rawById.get(update.rawItemId) ?? null,
        source: sourceById.get(update.sourceId) ?? null,
      });
      const assessment = assessCitationQuality(references);
      return {
        updateId: update.id,
        title: update.title,
        status: update.status,
        region: update.region,
        jurisdiction: update.jurisdiction,
        citationQuality: assessment.qualityStatus,
        publicationEligible: assessment.publicationEligible && update.status === "published",
        warnings: assessment.warnings,
        sourceCount: references.length,
        href: `/admin/ai-regulation/${update.id}`,
      };
    })
    .filter(
      (finding) =>
        finding.warnings.length > 0 ||
        finding.citationQuality !== "complete" ||
        (finding.status === "published" && !finding.publicationEligible),
    );
}

function isEuropeSource(source: RegulationSource) {
  return (
    source.region === "Europe" ||
    /europe|european union|eu|france|germany|spain|italy|netherlands/i.test(
      `${source.jurisdiction} ${source.country ?? ""}`,
    )
  );
}

function buildDiscoveryFindings(
  rawItems: RawRegulatoryItem[],
  sources: RegulationSource[],
  discoveryLeadRecords?: DiscoveryLeadRecord[],
): DiscoveryStewardFinding[] {
  if (discoveryLeadRecords && discoveryLeadRecords.length > 0) {
    return discoveryLeadRecords
      .map(({ lead, rawItem, verification }) => {
        const status = verification?.verificationStatus ?? lead.status;
        return {
          discoveryLeadId: lead.id,
          rawItemId: lead.rawItemId ?? rawItem?.id ?? lead.id,
          headline: lead.headline,
          detectedAt: lead.detectedAt,
          discoverySourceUrl: lead.discoverySourceUrl,
          outboundUrl: lead.outboundUrl ?? lead.discoverySourceUrl,
          verificationStatus: status,
          officialSourceFound:
            verification?.officialSourceFound ?? lead.officialSourceFound,
          corroboratingSourceCount:
            verification?.corroboratingSourcesCount ?? lead.corroboratingSourceCount,
          publicVisibilityAllowed:
            verification?.publicVisibilityAllowed ?? lead.publicVisibilityAllowed,
          reviewerNotes:
            verification?.reviewerNotes ??
            lead.reviewerNotes ??
            "Non-official discovery lead - requires official verification.",
          reviewPriority:
            verification?.officialSourceFound || lead.officialSourceFound
              ? ("medium" as const)
              : ("high" as const),
        };
      })
      .filter(
        (finding) =>
          !finding.publicVisibilityAllowed || finding.verificationStatus !== "published",
      );
  }

  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return rawItems
    .filter((item) => isDiscoveryOnlySource(sourceById.get(item.sourceId) ?? null))
    .map((item) => {
      const discovery = extractDiscoveryLeadMetadata(item);
      const verification = extractVerificationMetadata(item);
      const status =
        verification?.verificationStatus ??
        discovery?.verificationStatus ??
        "discovery_only";
      const officialSourceFound =
        verification?.officialSourceFound ??
        discovery?.possibleOfficialSourceFound ??
        false;
      const corroboratingSourceCount =
        verification?.corroboratingSourcesCount ??
        (discovery?.corroboratingSourceFound ? 1 : 0);

      return {
        discoveryLeadId: `legacy-${item.id}`,
        rawItemId: item.id,
        headline: discovery?.headline ?? item.rawTitle,
        detectedAt: item.detectedAt,
        discoverySourceUrl: discovery?.discoverySourceUrl ?? item.rawUrl,
        outboundUrl: discovery?.outboundUrl ?? item.rawUrl,
        verificationStatus: status,
        officialSourceFound,
        corroboratingSourceCount,
        publicVisibilityAllowed: verification?.publicVisibilityAllowed ?? false,
        reviewerNotes:
          verification?.reviewerNotes ??
          discovery?.reviewerNotes ??
          "Non-official discovery lead - requires official verification.",
        reviewPriority: officialSourceFound ? ("medium" as const) : ("high" as const),
      };
    })
    .filter((finding) => !finding.publicVisibilityAllowed || finding.verificationStatus !== "published");
}

function coverageToQueueItem(finding: CoverageFinding): ReviewQueueItem | null {
  if (
    finding.quality.reviewPriority === "low" &&
    finding.quality.freshnessStatus === "fresh" &&
    finding.warnings.length === 0
  ) {
    return null;
  }

  return {
    id: finding.id,
    priority: finding.quality.reviewPriority,
    area: finding.area === "europe" ? "europe" : "united_states",
    entityType: finding.entityType,
    title: finding.title,
    reason:
      finding.warnings[0] ??
      `${finding.entityType.replaceAll("_", " ")} requires data-steward review.`,
    suggestedAction:
      finding.quality.citationQuality === "missing_official_source" ||
      finding.sourceCount === 0
        ? "Attach or verify at least one official source before strengthening public claims."
        : finding.quality.freshnessStatus === "stale"
          ? "Refresh the source verification metadata and review the baseline entry."
          : "Review missing fields, citation quality, and source classification.",
    quality: finding.quality,
  };
}

export function buildLegalIntelligenceDataStewardReport(input: {
  updates: AiRegulatoryUpdate[];
  rawItems: RawRegulatoryItem[];
  sources: RegulationSource[];
  scanLogs: RegulationScanLog[];
  discoveryLeads?: DiscoveryLead[] | DiscoveryLeadRecord[];
  now?: Date;
}): LegalIntelligenceDataStewardReport {
  const now = input.now ?? new Date();
  const generatedAt = now.toISOString();
  const sourceFindings = buildSourceFindings(input.sources, input.scanLogs);
  const europeCoverage = buildEuropeCoverageDiagnostics(now);
  const usCoverage = buildUsCoverageDiagnostics(now);
  const citationFindings = buildCitationFindings(input);
  const discoveryLeadRecords =
    input.discoveryLeads && input.discoveryLeads.length > 0
      ? ("lead" in input.discoveryLeads[0]
          ? (input.discoveryLeads as DiscoveryLeadRecord[])
          : (input.discoveryLeads as DiscoveryLead[]).map((lead) => ({
              lead,
              rawItem:
                lead.rawItemId
                  ? (input.rawItems.find((item) => item.id === lead.rawItemId) ?? null)
                  : null,
              source:
                lead.sourceId
                  ? (input.sources.find((source) => source.id === lead.sourceId) ?? null)
                  : null,
              verification: null,
              storageMode: "dedicated" as const,
            })))
      : undefined;
  const discoveryFindings = buildDiscoveryFindings(
    input.rawItems,
    input.sources,
    discoveryLeadRecords,
  );

  const sourceQueue: ReviewQueueItem[] = sourceFindings
    .filter((finding) => finding.reviewPriority !== "low")
    .map((finding) => ({
      id: `source-${finding.sourceId}`,
      priority: finding.reviewPriority,
      area: "source",
      entityType: "source",
      title: finding.sourceName,
      reason:
        finding.accessibilityWarnings[0] ??
        finding.parserWarnings[0] ??
        "Source needs stewardship review.",
      suggestedAction:
        finding.latestScanStatus === "failed"
          ? "Check source accessibility, response status, and parser output before keeping active."
          : "Review source reliability notes and parser posture.",
      href: `/admin/ai-regulation/sources/${finding.sourceId}`,
    }));

  const citationQueue: ReviewQueueItem[] = citationFindings.map((finding) => ({
    id: `citation-${finding.updateId}`,
    priority: finding.status === "published" ? "high" : "medium",
    area: "citation",
    entityType: "monitor_item",
    title: finding.title,
    reason:
      finding.warnings[0] ??
      `Citation quality is ${finding.citationQuality.replaceAll("_", " ")}.`,
    suggestedAction:
      "Attach precise official source metadata before publication or continued public display.",
    href: finding.href,
  }));

  const discoveryQueue: ReviewQueueItem[] = discoveryFindings.map((finding) => ({
    id: `discovery-${finding.discoveryLeadId}`,
    priority: finding.reviewPriority,
    area: "discovery",
    entityType: "discovery_lead",
    title: finding.headline,
    reason: finding.officialSourceFound
      ? "Discovery lead has a possible official source but still needs review."
      : "Discovery lead is non-official and lacks official-source confirmation.",
    suggestedAction:
      "Find and attach the controlling official source or reject/stale the lead.",
  }));

  const coverageQueue = [...europeCoverage, ...usCoverage]
    .map(coverageToQueueItem)
    .filter((item): item is ReviewQueueItem => item !== null);

  const europeMaintenanceQueue = [
    ...sourceFindings
      .filter(
        (finding) =>
          finding.reviewPriority !== "low" &&
          isEuropeSource(input.sources.find((source) => source.id === finding.sourceId)!),
      )
      .map((finding) => ({
        id: `eu-source-${finding.sourceId}`,
        priority: finding.reviewPriority,
        area: "europe" as const,
        entityType: "source",
        title: finding.sourceName,
        reason:
          finding.accessibilityWarnings[0] ??
          finding.parserWarnings[0] ??
          "Europe monitoring source requires review.",
        suggestedAction:
          "Recheck source accessibility, parser posture, and official-source reliability before relying on this Europe feed.",
        href: `/admin/ai-regulation/sources/${finding.sourceId}`,
      })),
    ...citationFindings
      .filter(
        (finding) =>
          finding.region === "Europe" ||
          /europe|european union|france|germany|spain|italy|netherlands/i.test(
            finding.jurisdiction ?? "",
          ),
      )
      .map((finding) => ({
        id: `eu-citation-${finding.updateId}`,
        priority: finding.status === "published" ? ("high" as const) : ("medium" as const),
        area: "europe" as const,
        entityType: "citation",
        title: finding.title,
        reason:
          finding.warnings[0] ??
          `Europe citation quality is ${finding.citationQuality.replaceAll("_", " ")}.`,
        suggestedAction:
          "Tighten the Europe source trail before treating the item as a strong legal-intelligence reference.",
        href: finding.href,
      })),
    ...coverageQueue.filter((item) => item.area === "europe"),
  ].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const reviewQueue = [
    ...sourceQueue,
    ...citationQueue,
    ...discoveryQueue,
    ...coverageQueue,
  ].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const staleOrDueCoverageItems = [...europeCoverage, ...usCoverage].filter((finding) =>
    ["stale", "due_for_review", "source_inaccessible"].includes(
      finding.quality.freshnessStatus,
    ),
  ).length;

  return {
    generatedAt,
    summary: {
      sourceFindings: sourceFindings.length,
      sourceAttention: sourceFindings.filter((finding) => finding.reviewPriority !== "low").length,
      europeCoverageFindings: europeCoverage.length,
      usCoverageFindings: usCoverage.length,
      citationWarnings: citationFindings.length,
      discoveryLeadsNeedingVerification: discoveryFindings.length,
      highPriorityReviewItems: reviewQueue.filter((item) => item.priority === "high").length,
      staleOrDueCoverageItems,
      europeMaintenanceItems: europeMaintenanceQueue.length,
    },
    latestScheduledScan: findLatestScheduledScan(input.scanLogs),
    sources: sourceFindings,
    europeCoverage,
    usCoverage,
    citationFindings,
    discoveryFindings,
    reviewQueue,
    europeMaintenanceQueue,
  };
}

export async function syncLegalIntelligenceDataStewardFindings(
  report: LegalIntelligenceDataStewardReport,
) {
  const findings: Array<
    Omit<DataQualityFindingInput, "firstDetectedAt" | "lastDetectedAt" | "resolvedAt">
  > = [
    ...report.sources.map((finding) => ({
      entityType: "source",
      entityId: finding.sourceId,
      scope: "source_health",
      severity: severityFromPriority(finding.reviewPriority),
      status: finding.reviewPriority === "low" ? "healthy" : finding.freshnessStatus,
      findingType: "source_health_attention",
      message:
        finding.accessibilityWarnings[0] ??
        finding.parserWarnings[0] ??
        finding.reliabilityNotes[0] ??
        "Source stewardship review required.",
      details: {
        sourceName: finding.sourceName,
        active: finding.active,
        freshnessStatus: finding.freshnessStatus,
        lastReviewedAt: finding.lastReviewedAt,
        latestResponseStatus: finding.latestResponseStatus,
        latestScanStatus: finding.latestScanStatus,
        itemsFetched: finding.itemsFetched,
        newItemsDetected: finding.newItemsDetected,
        duplicatesDetected: finding.duplicatesDetected,
        parserWarnings: finding.parserWarnings,
        accessibilityWarnings: finding.accessibilityWarnings,
      },
    })),
    ...report.citationFindings.map((finding) => ({
      entityType: "monitor_item",
      entityId: finding.updateId,
      scope: "citation_quality",
      severity: finding.status === "published" ? ("high" as const) : ("medium" as const),
      status: finding.citationQuality,
      findingType: "citation_warning",
      message:
        finding.warnings[0] ??
        "Precise official citation data requires review.",
      details: {
        title: finding.title,
        reviewStatus: finding.status,
        publicationEligible: finding.publicationEligible,
        sourceCount: finding.sourceCount,
        href: finding.href,
      },
    })),
    ...report.discoveryFindings.map((finding) => ({
      entityType: "discovery_lead",
      entityId: finding.discoveryLeadId,
      scope: "verification",
      severity: severityFromPriority(finding.reviewPriority) as "high" | "medium" | "low",
      status: finding.verificationStatus,
      findingType: "discovery_verification_backlog",
      message: finding.reviewerNotes,
      details: {
        headline: finding.headline,
        detectedAt: finding.detectedAt,
        discoverySourceUrl: finding.discoverySourceUrl,
        outboundUrl: finding.outboundUrl,
        officialSourceFound: finding.officialSourceFound,
        corroboratingSourceCount: finding.corroboratingSourceCount,
        publicVisibilityAllowed: finding.publicVisibilityAllowed,
      },
    })),
    ...[...report.europeCoverage, ...report.usCoverage].map((finding) => ({
      entityType: finding.entityType,
      entityId: finding.id,
      scope: finding.area,
      severity: severityFromPriority(finding.quality.reviewPriority) as "high" | "medium" | "low",
      status: finding.quality.publicReadiness,
      findingType: `${finding.area}_${finding.entityType}_coverage`,
      message:
        finding.warnings[0] ??
        `${finding.title} requires baseline review.`,
      details: {
        title: finding.title,
        status: finding.status,
        summary: finding.summary,
        sourceCount: finding.sourceCount,
        freshnessStatus: finding.quality.freshnessStatus,
        citationQuality: finding.quality.citationQuality,
        missingFields: finding.quality.missingFields,
        staleWarnings: finding.quality.staleWarnings,
        sourceAccessibilityWarnings: finding.quality.sourceAccessibilityWarnings,
      },
    })),
  ];

  await Promise.all(
    findings.map((finding) =>
      updateRepository.upsertDataQualityFinding({
        ...finding,
        firstDetectedAt: report.generatedAt,
        lastDetectedAt: report.generatedAt,
        resolvedAt: null,
      }),
    ),
  );

  return {
    syncedCount: findings.length,
  };
}
