import type { SourceReference } from "@/agents/ai-regulation/citations";

export const reviewEventTypes = [
  "draft_saved",
  "status_transition",
  "citation_synced",
] as const;

export type ReviewEventType = (typeof reviewEventTypes)[number];

export interface SourceReferenceRecord extends SourceReference {
  id: string;
  rawItemId: string;
  regulatoryUpdateId: string | null;
  createdAt: string;
}

export interface VerificationAttempt {
  id: string;
  rawItemId: string;
  sourceReferenceId: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  attemptType: string;
  resultStatus: string;
  responseStatus: number | null;
  officialSourceFound: boolean;
  officialSourceUrl: string | null;
  notes: string | null;
  attemptedAt: string;
  createdAt: string;
}

export interface ReviewEvent {
  id: string;
  regulatoryUpdateId: string;
  sourceId: string;
  rawItemId: string;
  eventType: ReviewEventType;
  actor: string;
  previousStatus: string | null;
  nextStatus: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DataQualityFinding {
  id: string;
  entityType: string;
  entityId: string;
  scope: string;
  severity: "high" | "medium" | "low";
  status: string;
  findingType: string;
  message: string;
  details: Record<string, unknown>;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const scanJobStatuses = [
  "queued",
  "running",
  "succeeded",
  "partial_success",
  "failed",
] as const;

export type ScanJobStatus = (typeof scanJobStatuses)[number];

export interface ScanJob {
  id: string;
  sourceId: string | null;
  trigger: string;
  requestedBy: string;
  status: ScanJobStatus;
  startedAt: string | null;
  finishedAt: string | null;
  resultSummary: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsItemRecord {
  id: string;
  regulatoryUpdateId: string | null;
  rawItemId: string;
  slug: string;
  title: string;
  shortSummary: string;
  fullSummary: string;
  detectedAt: string;
  eventDate: string | null;
  publicationDate: string | null;
  lastVerifiedAt: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  sourceReliability: string;
  sourceJurisdiction: string;
  jurisdiction: string;
  region: string;
  countryOrState: string;
  legalArea: string;
  topicTags: string[];
  authorityType: string;
  developmentType: string;
  verificationStatus: string;
  officialSourceFound: boolean;
  officialSourceUrl: string | null;
  sourceReferences?: SourceReference[];
  corroboratingSources?: SourceReference[];
  exactDateOfInformation: string | null;
  datePrecision: string;
  citationQuality: string;
  publicVisibilityStatus: "public" | "admin_only";
  reviewerNotes: string;
  relatedMonitorItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceHealthCheck {
  id: string;
  sourceId: string;
  checkedAt: string;
  responseStatus: number | null;
  runtimeAccessible: boolean;
  parserStatus: string;
  activeRecommendation: string;
  itemsFetched: number;
  newItemsDetected: number;
  duplicatesDetected: number;
  parserWarnings: string[];
  accessibilityIssue: string | null;
  reliabilityNotes: string;
  createdAt: string;
}

export type SourceReferenceRecordInput = Omit<
  SourceReferenceRecord,
  "id" | "createdAt"
>;

export type VerificationAttemptInput = Omit<
  VerificationAttempt,
  "id" | "createdAt"
>;

export type ReviewEventInput = Omit<ReviewEvent, "id" | "createdAt">;

export type DataQualityFindingInput = Omit<
  DataQualityFinding,
  "id" | "createdAt" | "updatedAt"
>;

export type ScanJobInput = Omit<ScanJob, "id" | "createdAt" | "updatedAt">;

export type NewsItemRecordInput = Omit<
  NewsItemRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type SourceHealthCheckInput = Omit<SourceHealthCheck, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Country intelligence — typed interface for migration 006_country_intelligence
// Mirrors europe-member-state-implementation.ts content toward DB-backed storage.
// These types are used by the future seed/migration scripts (E3 roadmap).
// ---------------------------------------------------------------------------

export type CountryImplementationStatus =
  | "eu_framework_applies"
  | "national_implementation_identified"
  | "implementation_in_progress"
  | "competent_authority_designated"
  | "consultation_or_draft_identified"
  | "no_specific_national_implementation_verified"
  | "needs_review"
  | "not_applicable";

export type CountryImplementationConfidence = "high" | "medium" | "low" | "unverified";

export type CountryCitationQualityStatus =
  | "complete"
  | "partial"
  | "missing_official_source"
  | "missing_pinpoint"
  | "vague_source"
  | "inaccessible_source"
  | "discovery_only"
  | "needs_manual_verification"
  | "needs_review";

export type CountryReviewStatus = "needs_review" | "verified" | "stale" | "flagged";

export interface CountryIntelligenceSource {
  id: string;
  countryId: string;
  sourceUrl: string;
  sourceTitle: string;
  institution?: string | null;
  authorityType?: string | null;
  publicAccessible: boolean;
  runtimeAccessible?: boolean | null;
  lastCheckedAt?: string | null;
  responseStatus?: number | null;
  active: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface CountryIntelligence {
  id: string;
  region: "Europe" | "United States" | "Global";
  countryCode: string;
  countryName: string;
  slug: string;
  implementationStatus: CountryImplementationStatus;
  implementationConfidence: CountryImplementationConfidence;
  implementationNotes?: string | null;
  competentAuthorityName?: string | null;
  competentAuthorityUrl?: string | null;
  dpaName?: string | null;
  dpaUrl?: string | null;
  marketSurveillanceAuthority?: string | null;
  primaryOfficialSourceUrl?: string | null;
  primaryOfficialSourceTitle?: string | null;
  lastOfficialSourceCheck?: string | null;
  citationQualityStatus: CountryCitationQualityStatus;
  publicSummary?: string | null;
  editorialNotes?: string | null;
  missingSourceWarnings: string[];
  lastReviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewStatus: CountryReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export type CountryIntelligenceInput = Omit<CountryIntelligence, "id" | "createdAt" | "updatedAt">;
export type CountryIntelligenceSourceInput = Omit<CountryIntelligenceSource, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Discovery leads — typed interface for migration 007_discovery_leads
// Replaces raw_regulatory_items metadata-flag filtering with a dedicated
// relational entity (F2 roadmap).
// ---------------------------------------------------------------------------

export type DiscoveryLeadStatus =
  | "unresolved"
  | "official_source_found"
  | "corroborated"
  | "converted_to_monitor_item"
  | "rejected"
  | "stale";

export interface DiscoveryLead {
  id: string;
  rawItemId: string | null;
  sourceId: string | null;
  headline: string;
  discoverySourceUrl: string;
  outboundUrl: string | null;
  detectedAt: string;
  possibleJurisdiction: string | null;
  possibleTopic: string | null;
  possibleLegalArea: string | null;
  possibleAuthorityType: string | null;
  status: DiscoveryLeadStatus;
  officialSourceFound: boolean;
  officialSourceUrl: string | null;
  corroboratingSourceCount: number;
  corroboratingSourceUrls: string[];
  convertedUpdateId: string | null;
  reviewerNotes: string | null;
  lastVerifiedAt: string | null;
  staleAt: string | null;
  publicVisibilityAllowed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DiscoveryLeadInput = Omit<DiscoveryLead, "id" | "createdAt" | "updatedAt">;
