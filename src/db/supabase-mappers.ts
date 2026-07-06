import type { IngestionLog } from "@/agents/ingestion/types";
import type {
  CountryIntelligence,
  CountryProfileReviewEvent,
  CountryIntelligenceSource,
  DataQualityFinding,
  DiscoveryLead,
  NewsItemRecord,
  ReviewEvent,
  ScanJob,
  SourceReferenceRecord,
  SourceHealthCheck,
  VerificationAttempt,
} from "@/agents/ai-regulation/governance";
import { computeCountryNeedsReReview } from "@/agents/ai-regulation/country-review";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { deriveUpdateAuthorityType } from "@/agents/ai-regulation/utils/authority";

type Row = Record<string, unknown>;

function inferLegacyApiProvider(row: Row) {
  const id = typeof row.id === "string" ? row.id : "";
  const sourceUrl = typeof row.source_url === "string" ? row.source_url.toLowerCase() : "";

  if (id === "src-fr-newsapi-ai" || sourceUrl.includes("newsapi.org/")) {
    return "newsapi";
  }
  if (id === "src-eu-newsapi-ai") {
    return "newsapi";
  }
  if (id === "src-fr-gdelt-ai" || sourceUrl.includes("gdeltproject.org/")) {
    return "gdelt";
  }
  if (id === "src-eu-gdelt-ai") {
    return "gdelt";
  }
  if (id === "src-fr-judilibre-ai" || sourceUrl.includes("judilibre")) {
    return "judilibre";
  }
  if (id === "src-federal-register-ai" || sourceUrl.includes("federalregister.gov/api/")) {
    return "federal_register";
  }

  return null;
}

function normalizeLegacySourceType(row: Row) {
  const id = typeof row.id === "string" ? row.id : "";
  const sourceType = row.source_type as RegulationSource["sourceType"];

  if (sourceType !== "static_page" && sourceType !== "legislative_database") {
    return sourceType;
  }

  if (id === "src-fr-newsapi-ai") return "media_source" as const;
  if (id === "src-eu-newsapi-ai") return "media_source" as const;
  if (id === "src-fr-gdelt-ai") return "discovery_source" as const;
  if (id === "src-eu-gdelt-ai") return "discovery_source" as const;
  if (id === "src-fr-judilibre-ai") return "court_database" as const;

  return sourceType;
}

export function mapSourceRow(row: Row): RegulationSource {
  const config =
    row.config && typeof row.config === "object"
      ? ({ ...(row.config as Record<string, unknown>) } satisfies Record<string, unknown>)
      : {};
  const inferredApiProvider = inferLegacyApiProvider(row);
  if (inferredApiProvider && typeof config.apiProvider !== "string") {
    config.apiProvider = inferredApiProvider;
  }

  return {
    id: String(row.id),
    name: String(row.name),
    jurisdiction: row.jurisdiction as RegulationSource["jurisdiction"],
    region: String(row.region),
    country: String(row.country),
    sourceUrl: String(row.source_url),
    sourceType: normalizeLegacySourceType(row),
    scanFrequency: row.scan_frequency as RegulationSource["scanFrequency"],
    active: Boolean(row.active),
    lastScannedAt: row.last_scanned_at ? String(row.last_scanned_at) : null,
    lastSuccessfulScanAt: row.last_successful_scan_at
      ? String(row.last_successful_scan_at)
      : null,
    lastFailedScanAt: row.last_failed_scan_at ? String(row.last_failed_scan_at) : null,
    latestResponseStatus:
      typeof row.latest_response_status === "number"
        ? row.latest_response_status
        : null,
    latestItemsFetched: Number(row.latest_items_fetched ?? 0),
    latestNewItemsDetected: Number(row.latest_new_items_detected ?? 0),
    latestDuplicatesDetected: Number(row.latest_duplicates_detected ?? 0),
    latestParserWarnings: Array.isArray(row.latest_parser_warnings)
      ? (row.latest_parser_warnings as string[])
      : [],
    latestAccessibilityIssue: row.latest_accessibility_issue
      ? String(row.latest_accessibility_issue)
      : null,
    sourceReliabilityNotes: row.source_reliability_notes
      ? String(row.source_reliability_notes)
      : null,
    notes: String(row.notes ?? ""),
    reliabilityLevel: row.reliability_level as RegulationSource["reliabilityLevel"],
    preferredExtractionMethod:
      row.preferred_extraction_method as RegulationSource["preferredExtractionMethod"],
    config,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    // Ingestion pipeline fields (migration 009 — may be absent on older rows)
    ingestionMethod: row.ingestion_method ? String(row.ingestion_method) : null,
    sourceCategory: row.source_category ? String(row.source_category) : null,
    scraplingConfig:
      row.scrapling_config && typeof row.scrapling_config === "object"
        ? (row.scrapling_config as Record<string, unknown>)
        : {},
    crawlRootUrl: row.crawl_root_url ? String(row.crawl_root_url) : null,
  };
}

export function mapRawItemRow(row: Row): RawRegulatoryItem {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    rawTitle: String(row.raw_title),
    rawUrl: String(row.raw_url),
    rawText: row.raw_text != null ? String(row.raw_text) : "",
    rawMetadata:
      row.raw_metadata && typeof row.raw_metadata === "object"
        ? (row.raw_metadata as Record<string, unknown>)
        : {},
    detectedAt: String(row.detected_at),
    hash: String(row.hash),
    duplicateOf: row.duplicate_of ? String(row.duplicate_of) : null,
    processingStatus: row.processing_status as RawRegulatoryItem["processingStatus"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapUpdateRow(row: Row): AiRegulatoryUpdate {
  const update: AiRegulatoryUpdate = {
    id: String(row.id),
    sourceId: String(row.source_id),
    rawItemId: String(row.raw_item_id),
    title: String(row.title),
    sourceName: String(row.source_name),
    sourceUrl: String(row.source_url),
    jurisdiction: row.jurisdiction as AiRegulatoryUpdate["jurisdiction"],
    region: String(row.region),
    country: String(row.country),
    developmentType: row.development_type as AiRegulatoryUpdate["developmentType"],
    legalArea: row.legal_area as AiRegulatoryUpdate["legalArea"],
    authorityType: row.authority_type
      ? (String(row.authority_type) as AiRegulatoryUpdate["authorityType"])
      : undefined,
    publicationDate: row.publication_date ? String(row.publication_date) : null,
    detectedDate: String(row.detected_date),
    oneSentenceSummary: String(row.one_sentence_summary),
    summary: String(row.summary),
    whatHappened: String(row.what_happened),
    whyItMatters: String(row.why_it_matters),
    practicalImpact: String(row.practical_impact),
    affectedParties: Array.isArray(row.affected_parties)
      ? (row.affected_parties as string[])
      : [],
    keyObligations: Array.isArray(row.key_obligations)
      ? (row.key_obligations as string[])
      : [],
    complianceDeadlines: Array.isArray(row.compliance_deadlines)
      ? (row.compliance_deadlines as string[])
      : [],
    enforcementRisk: String(row.enforcement_risk),
    importanceLevel: row.importance_level as AiRegulatoryUpdate["importanceLevel"],
    confidenceLevel: row.confidence_level as AiRegulatoryUpdate["confidenceLevel"],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    status: row.status as AiRegulatoryUpdate["status"],
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
  return {
    ...update,
    authorityType: update.authorityType ?? deriveUpdateAuthorityType(update),
  };
}

export function mapScanLogRow(row: Row): RegulationScanLog {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    scanStartedAt: String(row.scan_started_at),
    scanFinishedAt: String(row.scan_finished_at),
    status: row.status as RegulationScanLog["status"],
    itemsFound: Number(row.items_found ?? 0),
    newItemsDetected: Number(row.new_items_detected ?? 0),
    duplicatesDetected: Number(row.duplicates_detected ?? 0),
    errors: Array.isArray(row.errors) ? (row.errors as string[]) : [],
    createdAt: String(row.created_at),
  };
}

export function mapProcessingLogRow(row: Row): AiProcessingLog {
  return {
    id: String(row.id),
    rawItemId: String(row.raw_item_id),
    regulatoryUpdateId: row.regulatory_update_id
      ? String(row.regulatory_update_id)
      : null,
    modelUsed: String(row.model_used),
    promptVersion: String(row.prompt_version),
    processingStartedAt: String(row.processing_started_at),
    processingFinishedAt: String(row.processing_finished_at),
    status: row.status as AiProcessingLog["status"],
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAt: String(row.created_at),
  };
}

export function mapSourceReferenceRow(row: Row): SourceReferenceRecord {
  return {
    id: String(row.id),
    rawItemId: String(row.raw_item_id),
    regulatoryUpdateId: row.regulatory_update_id
      ? String(row.regulatory_update_id)
      : null,
    sourceRole: String(row.source_role) as SourceReferenceRecord["sourceRole"],
    title: String(row.title),
    institution: String(row.institution),
    url: String(row.url),
    canonicalUrl: row.canonical_url ? String(row.canonical_url) : null,
    sourceType: String(row.source_type) as SourceReferenceRecord["sourceType"],
    authorityType: row.authority_type ? String(row.authority_type) : null,
    publicationDate: row.publication_date ? String(row.publication_date) : null,
    detectedAt: row.detected_at ? String(row.detected_at) : null,
    retrievedAt: row.retrieved_at ? String(row.retrieved_at) : null,
    lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : null,
    jurisdiction: row.jurisdiction ? String(row.jurisdiction) : null,
    documentType: row.document_type ? String(row.document_type) : null,
    excerpt: row.excerpt ? String(row.excerpt) : null,
    pinpoint:
      row.pinpoint && typeof row.pinpoint === "object"
        ? (row.pinpoint as SourceReferenceRecord["pinpoint"])
        : null,
    reliabilityLevel: row.reliability_level as SourceReferenceRecord["reliabilityLevel"],
    verificationStatus: String(row.verification_status),
    archivedUrl: row.archived_url ? String(row.archived_url) : null,
    accessLimitations: row.access_limitations
      ? String(row.access_limitations)
      : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
  };
}

export function mapVerificationAttemptRow(row: Row): VerificationAttempt {
  return {
    id: String(row.id),
    rawItemId: String(row.raw_item_id),
    sourceReferenceId: row.source_reference_id
      ? String(row.source_reference_id)
      : null,
    sourceName: String(row.source_name),
    sourceUrl: String(row.source_url),
    sourceType: String(row.source_type),
    attemptType: String(row.attempt_type),
    resultStatus: String(row.result_status),
    responseStatus:
      typeof row.response_status === "number" ? row.response_status : null,
    officialSourceFound: Boolean(row.official_source_found),
    officialSourceUrl: row.official_source_url
      ? String(row.official_source_url)
      : null,
    notes: row.notes ? String(row.notes) : null,
    attemptedAt: String(row.attempted_at),
    createdAt: String(row.created_at),
  };
}

export function mapReviewEventRow(row: Row): ReviewEvent {
  return {
    id: String(row.id),
    regulatoryUpdateId: String(row.regulatory_update_id),
    sourceId: String(row.source_id),
    rawItemId: String(row.raw_item_id),
    eventType: row.event_type as ReviewEvent["eventType"],
    actor: String(row.actor),
    previousStatus: row.previous_status ? String(row.previous_status) : null,
    nextStatus: row.next_status ? String(row.next_status) : null,
    notes: row.notes ? String(row.notes) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
  };
}

export function mapCountryProfileReviewEventRow(row: Row): CountryProfileReviewEvent {
  return {
    id: String(row.id),
    countryId: String(row.country_id),
    countrySlug: String(row.country_slug),
    eventType: row.event_type as CountryProfileReviewEvent["eventType"],
    actor: String(row.actor),
    previousReviewStatus: row.previous_review_status
      ? String(row.previous_review_status)
      : null,
    nextReviewStatus: row.next_review_status ? String(row.next_review_status) : null,
    previousNeedsReReview:
      typeof row.previous_needs_re_review === "boolean"
        ? row.previous_needs_re_review
        : null,
    nextNeedsReReview: Boolean(row.next_needs_re_review),
    notes: row.notes ? String(row.notes) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
  };
}

export function mapDataQualityFindingRow(row: Row): DataQualityFinding {
  return {
    id: String(row.id),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    scope: String(row.scope),
    severity: row.severity as DataQualityFinding["severity"],
    status: String(row.status),
    findingType: String(row.finding_type),
    message: String(row.message),
    details:
      row.details && typeof row.details === "object"
        ? (row.details as Record<string, unknown>)
        : {},
    firstDetectedAt: String(row.first_detected_at),
    lastDetectedAt: String(row.last_detected_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapScanJobRow(row: Row): ScanJob {
  return {
    id: String(row.id),
    sourceId: row.source_id ? String(row.source_id) : null,
    trigger: String(row.trigger),
    requestedBy: String(row.requested_by),
    status: row.status as ScanJob["status"],
    startedAt: row.started_at ? String(row.started_at) : null,
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    resultSummary:
      row.result_summary && typeof row.result_summary === "object"
        ? (row.result_summary as Record<string, unknown>)
        : {},
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapDiscoveryLeadRow(row: Row): DiscoveryLead {
  return {
    id: String(row.id),
    rawItemId: row.raw_item_id ? String(row.raw_item_id) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
    headline: String(row.headline),
    discoverySourceUrl: String(row.discovery_source_url),
    outboundUrl: row.outbound_url ? String(row.outbound_url) : null,
    detectedAt: String(row.detected_at),
    possibleJurisdiction: row.possible_jurisdiction
      ? String(row.possible_jurisdiction)
      : null,
    possibleTopic: row.possible_topic ? String(row.possible_topic) : null,
    possibleLegalArea: row.possible_legal_area ? String(row.possible_legal_area) : null,
    possibleAuthorityType: row.possible_authority_type
      ? String(row.possible_authority_type)
      : null,
    status: String(row.status) as DiscoveryLead["status"],
    officialSourceFound: Boolean(row.official_source_found),
    officialSourceUrl: row.official_source_url
      ? String(row.official_source_url)
      : null,
    corroboratingSourceCount: Number(row.corroborating_source_count ?? 0),
    corroboratingSourceUrls: Array.isArray(row.corroborating_source_urls)
      ? (row.corroborating_source_urls as string[])
      : [],
    convertedUpdateId: row.converted_update_id ? String(row.converted_update_id) : null,
    reviewerNotes: row.reviewer_notes ? String(row.reviewer_notes) : null,
    lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : null,
    staleAt: row.stale_at ? String(row.stale_at) : null,
    publicVisibilityAllowed: Boolean(row.public_visibility_allowed),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapNewsItemRow(row: Row): NewsItemRecord {
  return {
    id: String(row.id),
    regulatoryUpdateId: row.regulatory_update_id
      ? String(row.regulatory_update_id)
      : null,
    rawItemId: String(row.raw_item_id),
    slug: String(row.slug),
    title: String(row.title),
    shortSummary: String(row.short_summary),
    fullSummary: String(row.full_summary),
    detectedAt: String(row.detected_at),
    eventDate: row.event_date ? String(row.event_date) : null,
    publicationDate: row.publication_date ? String(row.publication_date) : null,
    lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : null,
    sourceName: String(row.source_name),
    sourceUrl: String(row.source_url),
    sourceType: String(row.source_type),
    sourceReliability: String(row.source_reliability),
    sourceJurisdiction: String(row.source_jurisdiction),
    jurisdiction: String(row.jurisdiction),
    region: String(row.region),
    countryOrState: String(row.country_or_state),
    legalArea: String(row.legal_area),
    topicTags: Array.isArray(row.topic_tags) ? (row.topic_tags as string[]) : [],
    authorityType: String(row.authority_type),
    developmentType: String(row.development_type),
    verificationStatus: String(row.verification_status),
    officialSourceFound: Boolean(row.official_source_found),
    officialSourceUrl: row.official_source_url
      ? String(row.official_source_url)
      : null,
    exactDateOfInformation: row.exact_date_of_information
      ? String(row.exact_date_of_information)
      : null,
    datePrecision: String(row.date_precision),
    citationQuality: String(row.citation_quality),
    publicVisibilityStatus: row.public_visibility_status as NewsItemRecord["publicVisibilityStatus"],
    reviewerNotes: String(row.reviewer_notes ?? ""),
    relatedMonitorItemId: row.related_monitor_item_id
      ? String(row.related_monitor_item_id)
      : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapSourceHealthCheckRow(row: Row): SourceHealthCheck {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    checkedAt: String(row.checked_at),
    responseStatus:
      typeof row.response_status === "number" ? row.response_status : null,
    runtimeAccessible: Boolean(row.runtime_accessible),
    parserStatus: String(row.parser_status),
    activeRecommendation: String(row.active_recommendation),
    itemsFetched: Number(row.items_fetched ?? 0),
    newItemsDetected: Number(row.new_items_detected ?? 0),
    duplicatesDetected: Number(row.duplicates_detected ?? 0),
    parserWarnings: Array.isArray(row.parser_warnings)
      ? (row.parser_warnings as string[])
      : [],
    accessibilityIssue: row.accessibility_issue
      ? String(row.accessibility_issue)
      : null,
    reliabilityNotes: String(row.reliability_notes ?? ""),
    createdAt: String(row.created_at),
  };
}

export function mapCountryIntelligenceRow(row: Row): CountryIntelligence {
  const lastReviewedAt = row.last_reviewed_at ? String(row.last_reviewed_at) : null;
  return {
    id: String(row.id),
    region: String(row.region) as CountryIntelligence["region"],
    countryCode: String(row.country_code),
    countryName: String(row.country_name),
    slug: String(row.slug),
    implementationStatus: String(row.implementation_status) as CountryIntelligence["implementationStatus"],
    implementationConfidence:
      String(row.implementation_confidence) as CountryIntelligence["implementationConfidence"],
    implementationNotes: row.implementation_notes ? String(row.implementation_notes) : null,
    competentAuthorityName:
      row.competent_authority_name ? String(row.competent_authority_name) : null,
    competentAuthorityUrl:
      row.competent_authority_url ? String(row.competent_authority_url) : null,
    dpaName: row.dpa_name ? String(row.dpa_name) : null,
    dpaUrl: row.dpa_url ? String(row.dpa_url) : null,
    marketSurveillanceAuthority:
      row.market_surveillance_authority ? String(row.market_surveillance_authority) : null,
    primaryOfficialSourceUrl:
      row.primary_official_source_url ? String(row.primary_official_source_url) : null,
    primaryOfficialSourceTitle:
      row.primary_official_source_title ? String(row.primary_official_source_title) : null,
    lastOfficialSourceCheck:
      row.last_official_source_check ? String(row.last_official_source_check) : null,
    citationQualityStatus:
      String(row.citation_quality_status) as CountryIntelligence["citationQualityStatus"],
    publicSummary: row.public_summary ? String(row.public_summary) : null,
    editorialNotes: row.editorial_notes ? String(row.editorial_notes) : null,
    missingSourceWarnings: Array.isArray(row.missing_source_warnings)
      ? (row.missing_source_warnings as string[])
      : [],
    implementationMeasures: Array.isArray(row.implementation_measures)
      ? (row.implementation_measures as string[])
      : [],
    competentAuthorities: Array.isArray(row.competent_authorities)
      ? (row.competent_authorities as string[])
      : [],
    marketSurveillanceAuthorities: Array.isArray(row.market_surveillance_authorities)
      ? (row.market_surveillance_authorities as string[])
      : [],
    notifyingAuthorities: Array.isArray(row.notifying_authorities)
      ? (row.notifying_authorities as string[])
      : [],
    relevantMinistries: Array.isArray(row.relevant_ministries)
      ? (row.relevant_ministries as string[])
      : [],
    nationalAIRegulationNotes: row.national_ai_regulation_notes
      ? String(row.national_ai_regulation_notes)
      : null,
    nationalCaseLawNotes: row.national_case_law_notes
      ? String(row.national_case_law_notes)
      : null,
    nationalSoftLawNotes: row.national_soft_law_notes
      ? String(row.national_soft_law_notes)
      : null,
    lastReviewedAt,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewStatus: String(row.review_status) as CountryIntelligence["reviewStatus"],
    needsReReview:
      typeof row.needs_re_review === "boolean"
        ? row.needs_re_review
        : computeCountryNeedsReReview(lastReviewedAt),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapCountryIntelligenceSourceRow(row: Row): CountryIntelligenceSource {
  return {
    id: String(row.id),
    countryId: String(row.country_id),
    sourceUrl: String(row.source_url),
    sourceTitle: String(row.source_title),
    institution: row.institution ? String(row.institution) : null,
    authorityType: row.authority_type ? String(row.authority_type) : null,
    publicAccessible: Boolean(row.public_accessible),
    runtimeAccessible:
      typeof row.runtime_accessible === "boolean" ? row.runtime_accessible : null,
    lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : null,
    responseStatus:
      typeof row.response_status === "number" ? row.response_status : null,
    active: Boolean(row.active),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
  };
}

export function sourceToInsert(source: Partial<RegulationSource>) {
  return {
    id: source.id,
    name: source.name,
    jurisdiction: source.jurisdiction,
    region: source.region,
    country: source.country,
    source_url: source.sourceUrl,
    source_type: source.sourceType,
    scan_frequency: source.scanFrequency,
    active: source.active,
    last_scanned_at: source.lastScannedAt,
    last_successful_scan_at: source.lastSuccessfulScanAt,
    last_failed_scan_at: source.lastFailedScanAt,
    latest_response_status: source.latestResponseStatus,
    latest_items_fetched: source.latestItemsFetched ?? 0,
    latest_new_items_detected: source.latestNewItemsDetected ?? 0,
    latest_duplicates_detected: source.latestDuplicatesDetected ?? 0,
    latest_parser_warnings: source.latestParserWarnings ?? [],
    latest_accessibility_issue: source.latestAccessibilityIssue,
    source_reliability_notes: source.sourceReliabilityNotes,
    notes: source.notes,
    reliability_level: source.reliabilityLevel,
    preferred_extraction_method: source.preferredExtractionMethod,
    config: source.config ?? {},
    ingestion_method: source.ingestionMethod,
    source_category: source.sourceCategory,
    scrapling_config: source.scraplingConfig ?? {},
    crawl_root_url: source.crawlRootUrl,
    created_at: source.createdAt,
    updated_at: source.updatedAt,
  };
}

export function rawItemToInsert(item: Partial<RawRegulatoryItem>) {
  return {
    id: item.id,
    source_id: item.sourceId,
    raw_title: item.rawTitle,
    raw_url: item.rawUrl,
    raw_text: item.rawText,
    raw_metadata: item.rawMetadata ?? {},
    detected_at: item.detectedAt,
    hash: item.hash,
    duplicate_of: item.duplicateOf,
    processing_status: item.processingStatus,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function updateToInsert(update: Partial<AiRegulatoryUpdate>) {
  return {
    id: update.id,
    source_id: update.sourceId,
    raw_item_id: update.rawItemId,
    title: update.title,
    source_name: update.sourceName,
    source_url: update.sourceUrl,
    jurisdiction: update.jurisdiction,
    region: update.region,
    country: update.country,
    development_type: update.developmentType,
    legal_area: update.legalArea,
    authority_type: update.authorityType,
    publication_date: update.publicationDate,
    detected_date: update.detectedDate,
    one_sentence_summary: update.oneSentenceSummary,
    summary: update.summary,
    what_happened: update.whatHappened,
    why_it_matters: update.whyItMatters,
    practical_impact: update.practicalImpact,
    affected_parties: update.affectedParties ?? [],
    key_obligations: update.keyObligations ?? [],
    compliance_deadlines: update.complianceDeadlines ?? [],
    enforcement_risk: update.enforcementRisk,
    importance_level: update.importanceLevel,
    confidence_level: update.confidenceLevel,
    tags: update.tags ?? [],
    status: update.status,
    reviewed_by: update.reviewedBy,
    reviewed_at: update.reviewedAt,
    published_at: update.publishedAt,
    created_at: update.createdAt,
    updated_at: update.updatedAt,
  };
}

export function scanLogToInsert(log: Partial<RegulationScanLog>) {
  return {
    id: log.id,
    source_id: log.sourceId,
    scan_started_at: log.scanStartedAt,
    scan_finished_at: log.scanFinishedAt,
    status: log.status,
    items_found: log.itemsFound,
    new_items_detected: log.newItemsDetected,
    duplicates_detected: log.duplicatesDetected,
    errors: log.errors ?? [],
    created_at: log.createdAt,
  };
}

export function processingLogToInsert(log: Partial<AiProcessingLog>) {
  return {
    id: log.id,
    raw_item_id: log.rawItemId,
    regulatory_update_id: log.regulatoryUpdateId,
    model_used: log.modelUsed,
    prompt_version: log.promptVersion,
    processing_started_at: log.processingStartedAt,
    processing_finished_at: log.processingFinishedAt,
    status: log.status,
    error_message: log.errorMessage,
    created_at: log.createdAt,
  };
}

export function sourceReferenceToInsert(reference: Partial<SourceReferenceRecord>) {
  return {
    id: reference.id,
    raw_item_id: reference.rawItemId,
    regulatory_update_id: reference.regulatoryUpdateId,
    source_role: reference.sourceRole,
    title: reference.title,
    institution: reference.institution,
    url: reference.url,
    canonical_url: reference.canonicalUrl,
    source_type: reference.sourceType,
    authority_type: reference.authorityType,
    publication_date: reference.publicationDate,
    detected_at: reference.detectedAt,
    retrieved_at: reference.retrievedAt,
    last_verified_at: reference.lastVerifiedAt,
    jurisdiction: reference.jurisdiction,
    document_type: reference.documentType,
    excerpt: reference.excerpt,
    pinpoint: reference.pinpoint ?? {},
    reliability_level: reference.reliabilityLevel,
    verification_status: reference.verificationStatus,
    archived_url: reference.archivedUrl,
    access_limitations: reference.accessLimitations,
    notes: reference.notes,
    created_at: reference.createdAt,
  };
}

export function verificationAttemptToInsert(
  attempt: Partial<VerificationAttempt>,
) {
  return {
    id: attempt.id,
    raw_item_id: attempt.rawItemId,
    source_reference_id: attempt.sourceReferenceId,
    source_name: attempt.sourceName,
    source_url: attempt.sourceUrl,
    source_type: attempt.sourceType,
    attempt_type: attempt.attemptType,
    result_status: attempt.resultStatus,
    response_status: attempt.responseStatus,
    official_source_found: attempt.officialSourceFound,
    official_source_url: attempt.officialSourceUrl,
    notes: attempt.notes,
    attempted_at: attempt.attemptedAt,
    created_at: attempt.createdAt,
  };
}

export function reviewEventToInsert(event: Partial<ReviewEvent>) {
  return {
    id: event.id,
    regulatory_update_id: event.regulatoryUpdateId,
    source_id: event.sourceId,
    raw_item_id: event.rawItemId,
    event_type: event.eventType,
    actor: event.actor,
    previous_status: event.previousStatus,
    next_status: event.nextStatus,
    notes: event.notes,
    metadata: event.metadata ?? {},
    created_at: event.createdAt,
  };
}

export function countryProfileReviewEventToInsert(
  event: Partial<CountryProfileReviewEvent>,
) {
  return {
    id: event.id,
    country_id: event.countryId,
    country_slug: event.countrySlug,
    event_type: event.eventType,
    actor: event.actor,
    previous_review_status: event.previousReviewStatus,
    next_review_status: event.nextReviewStatus,
    previous_needs_re_review: event.previousNeedsReReview,
    next_needs_re_review: event.nextNeedsReReview,
    notes: event.notes,
    metadata: event.metadata ?? {},
    created_at: event.createdAt,
  };
}

export function dataQualityFindingToInsert(
  finding: Partial<DataQualityFinding>,
) {
  return {
    id: finding.id,
    entity_type: finding.entityType,
    entity_id: finding.entityId,
    scope: finding.scope,
    severity: finding.severity,
    status: finding.status,
    finding_type: finding.findingType,
    message: finding.message,
    details: finding.details ?? {},
    first_detected_at: finding.firstDetectedAt,
    last_detected_at: finding.lastDetectedAt,
    resolved_at: finding.resolvedAt,
    created_at: finding.createdAt,
    updated_at: finding.updatedAt,
  };
}

export function scanJobToInsert(job: Partial<ScanJob>) {
  return {
    id: job.id,
    source_id: job.sourceId,
    trigger: job.trigger,
    requested_by: job.requestedBy,
    status: job.status,
    started_at: job.startedAt,
    finished_at: job.finishedAt,
    result_summary: job.resultSummary ?? {},
    error_message: job.errorMessage,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

export function discoveryLeadToInsert(lead: Partial<DiscoveryLead>) {
  return {
    id: lead.id,
    raw_item_id: lead.rawItemId,
    source_id: lead.sourceId,
    headline: lead.headline,
    discovery_source_url: lead.discoverySourceUrl,
    outbound_url: lead.outboundUrl,
    detected_at: lead.detectedAt,
    possible_jurisdiction: lead.possibleJurisdiction,
    possible_topic: lead.possibleTopic,
    possible_legal_area: lead.possibleLegalArea,
    possible_authority_type: lead.possibleAuthorityType,
    status: lead.status,
    official_source_found: lead.officialSourceFound,
    official_source_url: lead.officialSourceUrl,
    corroborating_source_count: lead.corroboratingSourceCount ?? 0,
    corroborating_source_urls: lead.corroboratingSourceUrls ?? [],
    converted_update_id: lead.convertedUpdateId,
    reviewer_notes: lead.reviewerNotes,
    last_verified_at: lead.lastVerifiedAt,
    stale_at: lead.staleAt,
    public_visibility_allowed: lead.publicVisibilityAllowed,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };
}

export function newsItemToInsert(item: Partial<NewsItemRecord>) {
  return {
    id: item.id,
    regulatory_update_id: item.regulatoryUpdateId,
    raw_item_id: item.rawItemId,
    slug: item.slug,
    title: item.title,
    short_summary: item.shortSummary,
    full_summary: item.fullSummary,
    detected_at: item.detectedAt,
    event_date: item.eventDate,
    publication_date: item.publicationDate,
    last_verified_at: item.lastVerifiedAt,
    source_name: item.sourceName,
    source_url: item.sourceUrl,
    source_type: item.sourceType,
    source_reliability: item.sourceReliability,
    source_jurisdiction: item.sourceJurisdiction,
    jurisdiction: item.jurisdiction,
    region: item.region,
    country_or_state: item.countryOrState,
    legal_area: item.legalArea,
    topic_tags: item.topicTags ?? [],
    authority_type: item.authorityType,
    development_type: item.developmentType,
    verification_status: item.verificationStatus,
    official_source_found: item.officialSourceFound,
    official_source_url: item.officialSourceUrl,
    exact_date_of_information: item.exactDateOfInformation,
    date_precision: item.datePrecision,
    citation_quality: item.citationQuality,
    public_visibility_status: item.publicVisibilityStatus,
    reviewer_notes: item.reviewerNotes,
    related_monitor_item_id: item.relatedMonitorItemId,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function sourceHealthCheckToInsert(check: Partial<SourceHealthCheck>) {
  return {
    id: check.id,
    source_id: check.sourceId,
    checked_at: check.checkedAt,
    response_status: check.responseStatus,
    runtime_accessible: check.runtimeAccessible,
    parser_status: check.parserStatus,
    active_recommendation: check.activeRecommendation,
    items_fetched: check.itemsFetched ?? 0,
    new_items_detected: check.newItemsDetected ?? 0,
    duplicates_detected: check.duplicatesDetected ?? 0,
    parser_warnings: check.parserWarnings ?? [],
    accessibility_issue: check.accessibilityIssue,
    reliability_notes: check.reliabilityNotes,
    created_at: check.createdAt,
  };
}

export function countryIntelligenceToInsert(country: Partial<CountryIntelligence>) {
  return {
    id: country.id,
    region: country.region,
    country_code: country.countryCode,
    country_name: country.countryName,
    slug: country.slug,
    implementation_status: country.implementationStatus,
    implementation_confidence: country.implementationConfidence,
    implementation_notes: country.implementationNotes,
    competent_authority_name: country.competentAuthorityName,
    competent_authority_url: country.competentAuthorityUrl,
    dpa_name: country.dpaName,
    dpa_url: country.dpaUrl,
    market_surveillance_authority: country.marketSurveillanceAuthority,
    primary_official_source_url: country.primaryOfficialSourceUrl,
    primary_official_source_title: country.primaryOfficialSourceTitle,
    last_official_source_check: country.lastOfficialSourceCheck,
    citation_quality_status: country.citationQualityStatus,
    public_summary: country.publicSummary,
    editorial_notes: country.editorialNotes,
    missing_source_warnings: country.missingSourceWarnings ?? [],
    implementation_measures: country.implementationMeasures ?? [],
    competent_authorities: country.competentAuthorities ?? [],
    market_surveillance_authorities: country.marketSurveillanceAuthorities ?? [],
    notifying_authorities: country.notifyingAuthorities ?? [],
    relevant_ministries: country.relevantMinistries ?? [],
    national_ai_regulation_notes: country.nationalAIRegulationNotes ?? null,
    national_case_law_notes: country.nationalCaseLawNotes ?? null,
    national_soft_law_notes: country.nationalSoftLawNotes ?? null,
    last_reviewed_at: country.lastReviewedAt,
    reviewed_by: country.reviewedBy,
    review_status: country.reviewStatus,
    needs_re_review:
      typeof country.needsReReview === "boolean"
        ? country.needsReReview
        : computeCountryNeedsReReview(country.lastReviewedAt),
    created_at: country.createdAt,
    updated_at: country.updatedAt,
  };
}

export function countryIntelligenceSourceToInsert(
  source: Partial<CountryIntelligenceSource>,
) {
  return {
    id: source.id,
    country_id: source.countryId,
    source_url: source.sourceUrl,
    source_title: source.sourceTitle,
    institution: source.institution,
    authority_type: source.authorityType,
    public_accessible: source.publicAccessible,
    runtime_accessible: source.runtimeAccessible,
    last_checked_at: source.lastCheckedAt,
    response_status: source.responseStatus,
    active: source.active,
    notes: source.notes,
    created_at: source.createdAt,
  };
}

export function mapIngestionLogRow(row: Row): IngestionLog {
  return {
    id: String(row.id ?? ""),
    source_id: row.source_id != null ? String(row.source_id) : null,
    method: String(row.method ?? "existing") as IngestionLog["method"],
    status: String(row.status ?? "skipped") as IngestionLog["status"],
    urls_discovered: typeof row.urls_discovered === "number" ? row.urls_discovered : 0,
    items_ingested: typeof row.items_ingested === "number" ? row.items_ingested : 0,
    duplicates: typeof row.duplicates === "number" ? row.duplicates : 0,
    error_message: row.error_message != null ? String(row.error_message) : null,
    details:
      row.details != null && typeof row.details === "object"
        ? (row.details as Record<string, unknown>)
        : {},
    started_at: String(row.started_at ?? new Date().toISOString()),
    finished_at: row.finished_at != null ? String(row.finished_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}
