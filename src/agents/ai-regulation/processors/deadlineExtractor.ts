import { extractDeadlines } from "@/agents/ai-regulation/utils/deadlines";

export const deadlineExtractor = {
  extract(text: string) {
    return extractDeadlines(text);
  },
};
