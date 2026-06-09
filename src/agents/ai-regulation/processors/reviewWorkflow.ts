import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { ReviewStatus } from "@/db/schema";

export const reviewWorkflow = {
  async transition(updateId: string, status: ReviewStatus) {
    return updateRepository.updateReviewStatus(updateId, status);
  },
};
