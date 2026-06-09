import type {
  ExtractedCandidateItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";

export interface ConnectorScanResult {
  items: ExtractedCandidateItem[];
  errors: string[];
  warnings: string[];
  responseStatus?: number | null;
  itemsFetched?: number;
  zeroResultsReason?: string | null;
}

export interface SourceConnector {
  scan(source: RegulationSource): Promise<ConnectorScanResult>;
}
