import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { selectSourcesForScanProfile } from "@/agents/ai-regulation/scanProfiles";
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
  async getAllSources() {
    return updateRepository.getSources();
  },
  async updateLastScannedAt(sourceId: string, value: string) {
    await updateRepository.updateSource(sourceId, {
      lastScannedAt: value,
    });
  },
};
