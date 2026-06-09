import { extractObligations } from "@/agents/ai-regulation/utils/deadlines";

export const obligationExtractor = {
  extract(text: string) {
    return extractObligations(text);
  },
};
