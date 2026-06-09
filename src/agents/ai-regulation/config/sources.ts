import type { RegulationSource } from "@/agents/ai-regulation/types";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

export const defaultSourceConfig: RegulationSource[] = regulationSourcesSeed;
