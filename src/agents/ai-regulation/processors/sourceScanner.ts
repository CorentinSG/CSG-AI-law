import { ApiConnector } from "@/agents/ai-regulation/connectors/api-connector";
import { RssConnector } from "@/agents/ai-regulation/connectors/rss-connector";
import { StaticPageConnector } from "@/agents/ai-regulation/connectors/static-page-connector";
import type { SourceConnector } from "@/agents/ai-regulation/connectors/types";
import type { RegulationSource } from "@/agents/ai-regulation/types";

function resolveConnector(source: RegulationSource): SourceConnector {
  if (source.preferredExtractionMethod === "rss") return new RssConnector();
  if (source.preferredExtractionMethod === "api") return new ApiConnector();
  return new StaticPageConnector();
}

export const sourceScanner = {
  async scanSource(source: RegulationSource) {
    const connector = resolveConnector(source);
    return connector.scan(source);
  },
};
