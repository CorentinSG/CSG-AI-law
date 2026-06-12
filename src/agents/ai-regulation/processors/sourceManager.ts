import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { selectSourcesForScanProfile } from "@/agents/ai-regulation/scanProfiles";
import {
  buildSourceExecutionDecisions,
  type SourceExecutionDecision,
} from "@/agents/ai-regulation/sourceRuntimeHealth";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";

export const sourceManager = {
  async getActiveSources() {
    const sources = await updateRepository.getSources();
    return sources.filter((source) => source.active);
  },
  async getActiveSourcesForProfile(profileId?: ScanProfileId) {
    const sources = await this.getActiveSources();
    return selectSourcesForScanProfile(sources, profileId);
  },
  async getScheduledExecutionDecisionsForProfile(profileId?: ScanProfileId, now?: Date) {
    const sources = await this.getActiveSourcesForProfile(profileId);
    if (sources.length === 0) {
      return new Map<string, SourceExecutionDecision>();
    }

    const [sourceHealthChecks, scanLogs, scanJobs, ingestionLogs] = await Promise.all([
      updateRepository.getSourceHealthChecks(undefined, 500),
      updateRepository.getScanLogs(500),
      updateRepository.getScanJobs(500),
      updateRepository.getIngestionLogs(undefined, 500),
    ]);

    return new Map(
      buildSourceExecutionDecisions({
        sources,
        sourceHealthChecks,
        scanLogs,
        scanJobs,
        ingestionLogs,
        now,
      }).map((decision) => [decision.sourceId, decision]),
    );
  },
  async getAllSources() {
    return updateRepository.getSources();
  },
  async updateLastScannedAt(sourceId: string, value: string) {
    await updateRepository.updateSource(sourceId, {
      lastScannedAt: value,
    });
  },
};
