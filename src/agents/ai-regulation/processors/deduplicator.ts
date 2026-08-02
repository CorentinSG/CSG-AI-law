import { buildStableHash } from "@/agents/ai-regulation/utils/hash";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";

export const deduplicator = {
  createHash(input: {
    sourceId: string;
    title: string;
    url: string;
    stableId?: string;
  }) {
    return buildStableHash(input);
  },
  async findDuplicate(hash: string) {
    return updateRepository.findRawItemByHash(hash);
  },
};
