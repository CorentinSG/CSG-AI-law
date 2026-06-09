import type {
  CountryIntelligence,
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
import type { IngestionLog } from "@/agents/ingestion/types";
import type {
  AiProcessingLog,
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationScanLog,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import { buildSeedDataset } from "@/db/seed/seed-profiles";

interface MockStore {
  sources: RegulationSource[];
  rawItems: RawRegulatoryItem[];
  updates: AiRegulatoryUpdate[];
  scanLogs: RegulationScanLog[];
  processingLogs: AiProcessingLog[];
  sourceReferences: SourceReferenceRecord[];
  verificationAttempts: VerificationAttempt[];
  reviewEvents: ReviewEvent[];
  dataQualityFindings: DataQualityFinding[];
  scanJobs: ScanJob[];
  discoveryLeads: DiscoveryLead[];
  newsItems: NewsItemRecord[];
  sourceHealthChecks: SourceHealthCheck[];
  countryIntelligence: CountryIntelligence[];
  countryIntelligenceSources: CountryIntelligenceSource[];
  ingestionLogs: IngestionLog[];
}

declare global {
  var __AI_REGULATION_STORE__: MockStore | undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getMockStore() {
  if (!globalThis.__AI_REGULATION_STORE__) {
    resetMockStore();
  }

  return globalThis.__AI_REGULATION_STORE__ as MockStore;
}

export function resetMockStore() {
  const seed = buildSeedDataset("demo");
  globalThis.__AI_REGULATION_STORE__ = {
    sources: clone(seed.sources),
    rawItems: clone(seed.rawItems),
    updates: clone(seed.updates),
    scanLogs: clone(seed.scanLogs),
    processingLogs: clone(seed.processingLogs),
    sourceReferences: clone(seed.sourceReferences),
    verificationAttempts: clone(seed.verificationAttempts),
    reviewEvents: clone(seed.reviewEvents),
    dataQualityFindings: clone(seed.dataQualityFindings),
    scanJobs: clone(seed.scanJobs),
    discoveryLeads: [],
    newsItems: clone(seed.newsItems),
    sourceHealthChecks: clone(seed.sourceHealthChecks),
    countryIntelligence: clone(seed.countryIntelligence),
    countryIntelligenceSources: clone(seed.countryIntelligenceSources),
    ingestionLogs: [],
  };
}
