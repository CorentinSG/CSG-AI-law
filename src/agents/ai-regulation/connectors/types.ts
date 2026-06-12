import type {
  ExtractedCandidateItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

export interface ConnectorFetchState {
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  contentType: string | null;
  checkedAt: string;
}

export interface ConnectorFetchMetadata {
  state: ConnectorFetchState;
  notModified: boolean;
  reusedConditionalHeaders: boolean;
}

export interface ConnectorScanResult {
  items: ExtractedCandidateItem[];
  errors: string[];
  warnings: string[];
  responseStatus?: number | null;
  itemsFetched?: number;
  zeroResultsReason?: string | null;
  fetchMetadata?: ConnectorFetchMetadata | null;
}

export interface SourceConnector {
  scan(source: RegulationSource): Promise<ConnectorScanResult>;
}
