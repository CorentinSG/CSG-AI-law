import type {
  AuthorityType,
  ConfidenceLevel,
  DevelopmentType,
  ExtractionMethod,
  ImportanceLevel,
  Jurisdiction,
  LegalArea,
  ProcessingStatus,
  ReliabilityLevel,
  ReviewStatus,
  ScanFrequency,
  SourceType,
} from "@/db/schema";

export interface RegulationSource {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  region: string;
  country: string;
  sourceUrl: string;
  sourceType: SourceType;
  scanFrequency: ScanFrequency;
  active: boolean;
  lastScannedAt: string | null;
  lastSuccessfulScanAt?: string | null;
  lastFailedScanAt?: string | null;
  latestResponseStatus?: number | null;
  latestItemsFetched?: number;
  latestNewItemsDetected?: number;
  latestDuplicatesDetected?: number;
  latestParserWarnings?: string[];
  latestAccessibilityIssue?: string | null;
  sourceReliabilityNotes?: string | null;
  notes: string;
  reliabilityLevel: ReliabilityLevel;
  preferredExtractionMethod: ExtractionMethod;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // ── Ingestion pipeline fields (migration 009) ────────────────────────
  /** Which ingestion engine to use (firecrawl | scrapling | hybrid | existing). */
  ingestionMethod?: string | null;
  /** Semantic category (official | regulator | court | parliament | media | newsletter). */
  sourceCategory?: string | null;
  /** Scrapling per-source extractor config. */
  scraplingConfig?: Record<string, unknown>;
  /** Starting URL for crawl (may differ from sourceUrl used for display). */
  crawlRootUrl?: string | null;
}


// Structured traceability metadata stored inside RawRegulatoryItem.rawMetadata.
// Typed interface replaces the previous Record<string,unknown> usage (C3).
export interface TraceabilityExtraction {
  stableId: string | null;
  contentType: string | null;
  extractedTitle: string;
  extractedContentPreview: string;
  publicationDate: string | null;
  effectiveDate: string | null;
  authorityClassification: string | null;
}

export interface TraceabilityRelevance {
  relevant: boolean;
  reason: string;
  matchedAiTerms?: string[];
  matchedRegulatoryTerms?: string[];
}

export interface TraceabilityClassification {
  authorityType: string | null;
  authorityClassification: string | null;
  jurisdiction: string | null;
  developmentType: string | null;
  legalArea: string | null;
  importanceLevel: string | null;
  effectiveDate: string | null;
}

export interface TraceabilityMetadata {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string;
  officialSource: boolean;
  parserUsed: string;
  scanTimestamp: string;
  scanTrigger: string;
  scanProfile: string;
  scanJobId: string | null;
  httpStatus: number | null;
  contentHash: string;
  duplicateStatus: "duplicate" | "unique";
  duplicateOfRawItemId: string | null;
  rawUrlScanned: string;
  extraction?: TraceabilityExtraction;
  relevance?: TraceabilityRelevance;
  classification?: TraceabilityClassification;
  reviewStatus?: string;
  publicationStatus?: string;
}

export interface ReviewAssistClassification {
  jurisdiction: Jurisdiction;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  importanceLevel: ImportanceLevel;
  confidenceLevel: ConfidenceLevel;
  tags: string[];
}

export interface ReviewAssistSummary {
  oneSentenceSummary: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  affectedParties: string[];
  keyObligations: string[];
  complianceDeadlines: string[];
  enforcementRisk: string;
}

export interface ReviewAssistMetadata {
  generatedAt: string;
  modelUsed: string;
  promptVersion: string;
  planningDecision: string;
  planningDecisionReason: string | null;
  estimatedCostUsd: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  humanReviewRequired: true;
  publicationStatus: "hidden";
  citationQualityStatus: "needs_manual_verification";
  suggestedClassification: ReviewAssistClassification;
  suggestedSummary: ReviewAssistSummary;
}

export interface RawRegulatoryItem {
  id: string;
  sourceId: string;
  rawTitle: string;
  rawUrl: string;
  rawText: string;
  rawMetadata: Record<string, unknown>;
  detectedAt: string;
  hash: string;
  duplicateOf: string | null;
  processingStatus: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiRegulatoryUpdate {
  id: string;
  sourceId: string;
  rawItemId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  jurisdiction: Jurisdiction;
  region: string;
  country: string;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  publicationDate: string | null;
  detectedDate: string;
  oneSentenceSummary: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  affectedParties: string[];
  keyObligations: string[];
  complianceDeadlines: string[];
  enforcementRisk: string;
  importanceLevel: ImportanceLevel;
  confidenceLevel: ConfidenceLevel;
  tags: string[];
  status: ReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegulationScanLog {
  id: string;
  sourceId: string;
  scanStartedAt: string;
  scanFinishedAt: string;
  status: "success" | "partial_success" | "failed";
  itemsFound: number;
  newItemsDetected: number;
  duplicatesDetected: number;
  errors: string[];
  createdAt: string;
}

export interface AiProcessingLog {
  id: string;
  rawItemId: string;
  regulatoryUpdateId: string | null;
  modelUsed: string;
  promptVersion: string;
  processingStartedAt: string;
  processingFinishedAt: string;
  status: "success" | "failed" | "skipped";
  errorMessage: string | null;
  createdAt: string;
}

export interface DevRuntimeCheck {
  port: number;
  reachable: boolean;
  routeStatuses: Record<string, number | null>;
  error: string | null;
}

export interface ExtractedCandidateItem {
  stableId?: string;
  title: string;
  url: string;
  text: string;
  excerpt?: string;
  publicationDate?: string | null;
  detectedAt?: string;
  sourceName?: string;
  sourceId?: string;
  jurisdictionHint?: Jurisdiction;
  developmentTypeHint?: DevelopmentType;
  legalAreaHint?: LegalArea;
  authorityTypeHint?: AuthorityType;
  metadata?: Record<string, unknown>;
}

export interface NormalizedRegulatoryUpdateDraft {
  title: string;
  jurisdiction: Jurisdiction;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  oneSentenceSummary: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  affectedParties: string[];
  keyObligations: string[];
  complianceDeadlines: string[];
  enforcementRisk: string;
  importanceLevel: ImportanceLevel;
  confidenceLevel: ConfidenceLevel;
  tags: string[];
  publicationDate: string | null;
}
